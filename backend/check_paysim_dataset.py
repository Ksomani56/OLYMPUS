"""Chunked dataset description and pre-training checks for PaySim.

Run from the project folder:
    python check_paysim_dataset.py

Scans the train/test CSV files without loading a complete shard into RAM.
"""

from pathlib import Path

import pandas as pd


DATA_DIR = Path(__file__).parent / "datasets" / "paysim"
CHUNK_ROWS = 250_000
TARGET = "isFraud"


def inspect_file(path):
    print(f"\n--- {path.name} ({path.stat().st_size / (1024 ** 2):.1f} MB) ---")
    rows = 0
    missing = None
    target_counts = None
    bank_target = None
    flagged_counts = None
    columns = None

    for chunk in pd.read_csv(path, chunksize=CHUNK_ROWS, low_memory=False):
        rows += len(chunk)
        columns = list(chunk.columns)
        chunk_missing = chunk.isna().sum()
        missing = chunk_missing if missing is None else missing.add(chunk_missing, fill_value=0)

        if TARGET in chunk:
            counts = chunk[TARGET].astype("string").value_counts(dropna=False)
            target_counts = counts if target_counts is None else target_counts.add(counts, fill_value=0)

        if "BankID" in chunk and TARGET in chunk:
            counts = chunk.groupby("BankID", dropna=False)[TARGET].agg(["count", "sum"])
            bank_target = counts if bank_target is None else bank_target.add(counts, fill_value=0)

        if "isFlaggedFraud" in chunk:
            counts = chunk["isFlaggedFraud"].astype("string").value_counts(dropna=False)
            flagged_counts = counts if flagged_counts is None else flagged_counts.add(counts, fill_value=0)

        print(f"Rows scanned: {rows:,}", end="\r")

    print(f"Rows: {rows:,}")
    print(f"Columns ({len(columns or [])}): {', '.join(columns or [])}")

    print("Missing values:")
    nonzero = [(name, int(value)) for name, value in (missing.items() if missing is not None else []) if value]
    if nonzero:
        for name, count in sorted(nonzero, key=lambda item: item[1], reverse=True):
            print(f"  {name}: {count:,} ({count / rows:.3%})")
    else:
        print("  None")

    print(f"{TARGET} distribution:")
    if target_counts is not None:
        for label, count in target_counts.sort_values(ascending=False).items():
            print(f"  {label}: {int(count):,} ({count / rows:.4%})")

    if bank_target is not None:
        print("Fraud by BankID:")
        for bank, values in bank_target.sort_index().iterrows():
            count = int(values["count"])
            positives = int(values["sum"])
            print(f"  {bank}: {count:,} rows, {positives:,} fraud ({positives / count:.4%})")

    if flagged_counts is not None:
        print("isFlaggedFraud distribution (review as a possible leakage feature):")
        for label, count in flagged_counts.sort_values(ascending=False).items():
            print(f"  {label}: {int(count):,}")


def main():
    if not DATA_DIR.is_dir():
        print(f"PaySim directory not found: {DATA_DIR}")
        return
    paths = sorted(DATA_DIR.glob("*.csv"))
    if not paths:
        print(f"No CSV files found in {DATA_DIR}")
        return

    print("PaySim dataset audit")
    print(f"Folder: {DATA_DIR}")
    for path in paths:
        inspect_file(path)

    print("\nPre-training notes:")
    print("  isFraud is the supervised training label; evaluate with PR-AUC/recall as well as ROC-AUC.")
    print("  Exclude nameOrig/nameDest and BankID from model inputs; use BankID to describe simulated silos.")
    print("  Exclude isFlaggedFraud from the baseline model because it is an existing fraud flag and may leak label information.")
    print("  This check reports label prevalence and per-bank prevalence; assess split strategy for bank-level generalization.")
    print("  Account velocity and amount-deviation features require account-history aggregation and are not in the current baseline.")


if __name__ == "__main__":
    main()
