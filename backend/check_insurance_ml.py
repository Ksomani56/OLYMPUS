"""Quick, memory-safe suitability check for the 100M-row insurance CSV.

Run from the project folder with:
    python check_insurance_ml.py

This scans the file in chunks; it does not train a model or load the full CSV
into memory. The complete scan can take several minutes on a 10 GB file.
"""

from pathlib import Path

import pandas as pd


CSV_PATH = Path(__file__).parent / "datasets" / "insuranceclaims" / "insurance_claims_100M.csv"
CHUNK_ROWS = 500_000
TARGET = "is_fraud_flagged_ground_truth"


def main():
    if not CSV_PATH.is_file():
        print(f"CSV not found: {CSV_PATH}")
        return

    print(f"File: {CSV_PATH}")
    print(f"Size: {CSV_PATH.stat().st_size / (1024 ** 3):.2f} GB")
    print(f"Chunk size: {CHUNK_ROWS:,} rows")
    print("Scanning all rows in chunks; this may take a while...\n")

    total_rows = 0
    missing = None
    target_counts = None
    columns = None
    chunk_count = 0

    try:
        for chunk in pd.read_csv(CSV_PATH, chunksize=CHUNK_ROWS, low_memory=False):
            chunk_count += 1
            total_rows += len(chunk)
            columns = list(chunk.columns)
            chunk_missing = chunk.isna().sum()
            missing = chunk_missing if missing is None else missing.add(chunk_missing, fill_value=0)

            if TARGET in chunk.columns:
                counts = chunk[TARGET].astype("string").value_counts(dropna=False)
                target_counts = counts if target_counts is None else target_counts.add(counts, fill_value=0)

            print(f"Scanned {total_rows:,} rows...", end="\r")
    except Exception as exc:
        print(f"\nCould not read the CSV: {exc}")
        return

    print("\n\n=== Dataset check ===")
    print(f"Rows scanned: {total_rows:,}")
    print(f"Columns ({len(columns or [])}): {', '.join(columns or [])}")

    if missing is not None:
        missing = missing.sort_values(ascending=False)
        print("\nMissing values (nonzero only):")
        found_missing = False
        for col, count in missing.items():
            if count:
                found_missing = True
                print(f"  {col}: {int(count):,} ({count / total_rows:.2%})")
        if not found_missing:
            print("  None")

    print(f"\nTarget check: {TARGET}")
    if target_counts is None:
        print("  Target column was not found; select/derive a label before supervised training.")
    else:
        print("  Label counts:")
        for label, count in target_counts.sort_values(ascending=False).items():
            print(f"    {label}: {int(count):,} ({count / total_rows:.4%})")

    print("\nML readiness notes:")
    print("  The CSV is readable in chunks, so its size does not prevent model training.")
    print("  Use a train/validation/test split and fit preprocessing on training data only.")
    print("  Exclude identifiers such as claim_id and policy_id from model features.")
    print("  Check for target leakage: claim_status and days_to_resolution may be unavailable at prediction time.")
    print("  If the fraud label is rare, use stratified sampling and suitable imbalance metrics.")
    print("  Prefer Parquet for repeated ML runs; it is much smaller and faster to scan than this CSV.")


if __name__ == "__main__":
    main()
