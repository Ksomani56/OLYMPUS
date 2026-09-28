import os
import requests
import pandas as pd
import pyarrow.parquet as pq
from tqdm import tqdm


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = "datasets"

PAYSIM_DIR = os.path.join(BASE_DIR, "paysim")
INSURANCE_DIR = os.path.join(BASE_DIR, "insuranceclaims")

os.makedirs(PAYSIM_DIR, exist_ok=True)
os.makedirs(INSURANCE_DIR, exist_ok=True)


# ============================================================
# DOWNLOAD FUNCTION
# ============================================================

def download_file(url, output_path):

    # --------------------------------------------------------
    # If already downloaded, don't download again
    # --------------------------------------------------------

    if os.path.exists(output_path):

        size_mb = os.path.getsize(output_path) / (1024 * 1024)

        print("\n[SKIP] File already exists")
        print("      ", output_path)
        print(f"       Size: {size_mb:.2f} MB")

        return True

    print("\n" + "=" * 70)
    print("DOWNLOADING")
    print("=" * 70)

    print("URL :")
    print(url)

    print("\nSAVE TO:")
    print(output_path)

    try:

        response = requests.get(
            url,
            stream=True,
            allow_redirects=True,
            timeout=120
        )

        response.raise_for_status()

    except requests.RequestException as e:

        print("\n[ERROR] Download failed")
        print(e)

        return False


    total_size = int(
        response.headers.get(
            "content-length",
            0
        )
    )


    try:

        with open(
            output_path,
            "wb"
        ) as file:

            with tqdm(
                total=total_size,
                unit="B",
                unit_scale=True,
                unit_divisor=1024,
                desc=os.path.basename(output_path)
            ) as progress:

                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):

                    if chunk:

                        file.write(chunk)

                        progress.update(
                            len(chunk)
                        )

    except Exception as e:

        print("\n[ERROR] Could not save file")
        print(e)

        if os.path.exists(output_path):
            os.remove(output_path)

        return False


    print("\n[DONE]")
    print(output_path)

    return True


# ============================================================
# PAYSim DATASET
# ============================================================

def download_paysim():

    print("\n")
    print("#" * 70)
    print("# 1. PAYSim FEDERATED DATASET")
    print("#" * 70)

    """
    Current public dataset:
    flwrlabs/fed-fraud-paysim-banks

    Contains:
        train
        test

    BankID:
        0
        1
        2
        3
        4
    """

    PAYSIM_REPO = (
        "https://huggingface.co/datasets/"
        "flwrlabs/fed-fraud-paysim-banks"
    )


    # --------------------------------------------------------
    # IMPORTANT:
    # Use Hugging Face API endpoint, NOT /tree/main/
    # --------------------------------------------------------

    API_URL = (
        "https://huggingface.co/api/datasets/"
        "flwrlabs/fed-fraud-paysim-banks/tree/main/data"
        "?recursive=true"
    )


    print("\nFinding PaySim files...")

    try:

        response = requests.get(
            API_URL,
            timeout=120
        )

        response.raise_for_status()

        files = response.json()

    except Exception as e:

        print("\n[ERROR] Could not access Hugging Face API")
        print(e)

        return


    # --------------------------------------------------------
    # Find parquet files
    # --------------------------------------------------------

    parquet_files = []


    for item in files:

        if item.get("type") != "file":
            continue

        path = item.get(
            "path",
            ""
        )

        if path.endswith(".parquet"):

            parquet_files.append(
                path
            )


    if not parquet_files:

        print("\n[ERROR]")
        print("No PaySim Parquet files were found.")

        return


    print("\nFound PaySim files:")

    for file in parquet_files:

        print("   ", file)


    # --------------------------------------------------------
    # Download + convert each Parquet
    # --------------------------------------------------------

    for parquet_file in parquet_files:

        filename = os.path.basename(
            parquet_file
        )


        parquet_path = os.path.join(
            PAYSIM_DIR,
            filename
        )


        csv_filename = filename.replace(
            ".parquet",
            ".csv"
        )


        csv_path = os.path.join(
            PAYSIM_DIR,
            csv_filename
        )


        # ----------------------------------------------------
        # If CSV already exists
        # ----------------------------------------------------

        if os.path.exists(csv_path):

            print("\n[SKIP] CSV already exists:")
            print("      ", csv_path)

            continue


        # ----------------------------------------------------
        # Download Parquet
        # ----------------------------------------------------

        download_url = (
            PAYSIM_REPO +
            "/resolve/main/" +
            parquet_file +
            "?download=true"
        )


        success = download_file(
            download_url,
            parquet_path
        )


        if not success:

            continue


        # ----------------------------------------------------
        # Convert Parquet → CSV
        # ----------------------------------------------------

        print("\n" + "-" * 70)
        print("CONVERTING PAYSim")
        print("-" * 70)

        print(
            parquet_path,
            "→",
            csv_path
        )


        try:

            df = pd.read_parquet(
                parquet_path
            )


            df.to_csv(
                csv_path,
                index=False
            )


            print("\n[CSV CREATED]")
            print(csv_path)


            del df


        except Exception as e:

            print("\n[ERROR] Conversion failed")
            print(e)

            continue


        # ----------------------------------------------------
        # Delete Parquet
        # ----------------------------------------------------

        if os.path.exists(csv_path):

            os.remove(
                parquet_path
            )

            print(
                "[PARQUET REMOVED]"
            )


# ============================================================
# INSURANCE CLAIMS DATASET
# ============================================================

def download_insurance():

    print("\n")
    print("#" * 70)
    print("# 2. INSURANCE CLAIMS 100M DATASET")
    print("#" * 70)


    INSURANCE_REPO = (
        "https://huggingface.co/datasets/"
        "ziadatalabs/FreeInsuranceClaims100M"
    )


    INSURANCE_FILE = (
        "insurance_claims_100M.parquet"
    )


    insurance_url = (
        INSURANCE_REPO +
        "/resolve/main/" +
        INSURANCE_FILE +
        "?download=true"
    )


    insurance_parquet = os.path.join(
        INSURANCE_DIR,
        INSURANCE_FILE
    )


    insurance_csv = os.path.join(
        INSURANCE_DIR,
        "insurance_claims_100M.csv"
    )

    # A 100M-row CSV is too large for spreadsheet apps and many data viewers.
    # Keep a small, directly viewable preview alongside the full dataset.
    insurance_preview = os.path.join(
        INSURANCE_DIR,
        "insurance_claims_preview.csv"
    )


    # --------------------------------------------------------
    # If CSV already exists
    # --------------------------------------------------------

    if os.path.exists(insurance_csv):

        if not os.path.exists(insurance_preview):
            print("\nCreating a 1,000-row preview...")
            pd.read_csv(insurance_csv, nrows=1000).to_csv(
                insurance_preview,
                index=False
            )
            print("[PREVIEW CREATED]")
            print(insurance_preview)

        size_gb = (
            os.path.getsize(
                insurance_csv
            )
            /
            (1024 ** 3)
        )

        print("\n[SKIP]")
        print("Insurance CSV already exists:")
        print(insurance_csv)
        print(f"Size: {size_gb:.2f} GB")

        return


    # --------------------------------------------------------
    # Download Parquet
    # --------------------------------------------------------

    success = download_file(
        insurance_url,
        insurance_parquet
    )


    if not success:

        return


    # --------------------------------------------------------
    # Read Parquet metadata
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("INSURANCE DATASET INFORMATION")
    print("=" * 70)


    try:

        parquet = pq.ParquetFile(
            insurance_parquet
        )

        total_rows = (
            parquet.metadata.num_rows
        )

        total_batches = (
            parquet.num_row_groups
        )

        print(
            f"Rows: {total_rows:,}"
        )

        print(
            f"Row groups: {total_batches}"
        )


    except Exception as e:

        print("\n[ERROR] Could not read Parquet")
        print(e)

        return


    # --------------------------------------------------------
    # Convert in batches
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("CONVERTING INSURANCE PARQUET → CSV")
    print("=" * 70)

    print(
        "IMPORTANT: Dataset is processed in batches."
    )

    print(
        "The entire 100M rows will NOT be loaded into RAM."
    )


    first_batch = True

    rows_written = 0


    try:

        with tqdm(
            total=total_rows,
            unit="rows",
            desc="Converting"
        ) as progress:


            for batch in parquet.iter_batches(
                batch_size=100_000
            ):


                df = batch.to_pandas()


                df.to_csv(
                    insurance_csv,
                    mode="w" if first_batch else "a",
                    header=first_batch,
                    index=False
                )


                rows_written += len(df)


                progress.update(
                    len(df)
                )


                first_batch = False


                del df


    except Exception as e:

        print("\n[ERROR] Insurance conversion failed")
        print(e)

        return


    # --------------------------------------------------------
    # Verify row count
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("CONVERSION COMPLETE")
    print("=" * 70)

    print(
        f"Rows written: {rows_written:,}"
    )

    print(
        f"Expected rows: {total_rows:,}"
    )


    if rows_written != total_rows:

        print(
            "\n[WARNING] Row count mismatch!"
        )

        print(
            "Parquet file will NOT be deleted."
        )

        return

    # Release the Parquet file handle before deleting it (required on Windows).
    parquet.close()


    print(
        "\n[OK] Row count verified."
    )


    # --------------------------------------------------------
    # Delete Parquet
    # --------------------------------------------------------

    if os.path.exists(
        insurance_csv
    ):

        os.remove(
            insurance_parquet
        )

        print(
            "[PARQUET REMOVED]"
        )


# ============================================================
# FINAL DATASET STRUCTURE
# ============================================================

def show_final_structure():

    print("\n")
    print("#" * 70)
    print("# FINAL DATASET STRUCTURE")
    print("#" * 70)


    if not os.path.exists(
        BASE_DIR
    ):

        print(
            "datasets/ does not exist."
        )

        return


    for root, dirs, files in os.walk(
        BASE_DIR
    ):

        level = (
            root
            .replace(
                BASE_DIR,
                ""
            )
            .count(
                os.sep
            )
        )


        indent = (
            "    " * level
        )


        folder_name = (
            os.path.basename(
                root
            )
        )


        print(
            f"{indent}{folder_name}/"
        )


        for file in files:

            path = os.path.join(
                root,
                file
            )


            size_mb = (
                os.path.getsize(
                    path
                )
                /
                (1024 * 1024)
            )


            print(
                f"{indent}    "
                f"{file} "
                f"({size_mb:.2f} MB)"
            )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("\n")
    print("=" * 70)
    print("FEDERATED FINANCIAL RISK DATASET DOWNLOADER")
    print("=" * 70)

    print("\nNo Hugging Face token is required.")
    print("Public datasets will be downloaded directly.")

    # --------------------------------------------------------
    # PAYSim
    # --------------------------------------------------------

    download_paysim()

    # --------------------------------------------------------
    # Insurance Claims
    # --------------------------------------------------------

    download_insurance()

    # --------------------------------------------------------
    # Final structure
    # --------------------------------------------------------

    show_final_structure()

    print("\n")
    print("=" * 70)
    print("DATASET PROCESS COMPLETE")
    print("=" * 70)

    print(
        "\nFinal CSV datasets are stored inside:"
    )

    print(
        os.path.abspath(
            BASE_DIR
        )
    )
