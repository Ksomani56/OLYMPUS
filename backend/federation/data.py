"""OLYMPUS Federation Subsystem — Partitioning and Data Generation (Stage 1).

Generates genuinely non-IID synthetic transaction partitions for simulated banking
participants (BANK-001, BANK-002, BANK-003) alongside a held-out global validation set.
Uses deterministic seeds and standard normalization for gradient stability.
"""

from typing import Dict, List, Tuple
import numpy as np

FEATURE_COLUMNS = [
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "hour",
    "day_of_week",
    "orig_txn_count",
    "dest_txn_count",
    "balance_drain_ratio",
    "is_transfer",
]


def _generate_synthetic_bank_data(
    n_samples: int,
    fraud_rate: float,
    amount_mean: float,
    amount_std: float,
    high_drain_bias: float,
    transfer_prob: float,
    seed: int,
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate synthetic tabular transactions mimicking PaySim characteristics."""
    rng = np.random.default_rng(seed)

    # Labels
    y = (rng.uniform(0, 1, size=n_samples) < fraud_rate).astype(np.float64)

    # Feature 0: Amount (log-normal distribution)
    amount = rng.lognormal(mean=amount_mean, sigma=amount_std, size=n_samples)
    # Fraudulent transactions often carry higher amounts
    amount[y == 1] *= rng.uniform(1.5, 3.5, size=int(np.sum(y == 1)))

    # Feature 1: oldbalanceOrg
    oldbalanceOrg = rng.exponential(scale=50000.0, size=n_samples) + amount * rng.uniform(0.5, 1.5, size=n_samples)

    # Feature 9: balance_drain_ratio
    # Legit transactions drain modest portions; fraud or wallet draining empties accounts
    drain_base = rng.beta(a=2.0 + high_drain_bias, b=5.0, size=n_samples)
    drain_base[y == 1] = np.clip(rng.beta(a=8.0, b=1.5, size=int(np.sum(y == 1))), 0.7, 1.0)
    balance_drain_ratio = drain_base

    # Feature 2: newbalanceOrig
    newbalanceOrig = np.maximum(0.0, oldbalanceOrg * (1.0 - balance_drain_ratio))

    # Feature 3: oldbalanceDest
    oldbalanceDest = rng.exponential(scale=80000.0, size=n_samples)

    # Feature 10: is_transfer
    is_transfer = (rng.uniform(0, 1, size=n_samples) < transfer_prob).astype(np.float64)
    # Fraud in PaySim is predominantly TRANSFER or CASH_OUT
    is_transfer[y == 1] = (rng.uniform(0, 1, size=int(np.sum(y == 1))) < 0.9).astype(np.float64)

    # Feature 4: newbalanceDest
    newbalanceDest = oldbalanceDest + amount * is_transfer

    # Feature 5: hour (0-23)
    hour = rng.integers(0, 24, size=n_samples).astype(np.float64)
    # Feature 6: day_of_week (0-6)
    day_of_week = rng.integers(0, 7, size=n_samples).astype(np.float64)

    # Feature 7 & 8: transaction velocity
    orig_txn_count = rng.poisson(lam=3.0, size=n_samples).astype(np.float64)
    dest_txn_count = rng.poisson(lam=4.0, size=n_samples).astype(np.float64)
    # Fraud spikes velocity
    dest_txn_count[y == 1] += rng.poisson(lam=5.0, size=int(np.sum(y == 1)))

    X = np.column_stack([
        amount,
        oldbalanceOrg,
        newbalanceOrig,
        oldbalanceDest,
        newbalanceDest,
        hour,
        day_of_week,
        orig_txn_count,
        dest_txn_count,
        balance_drain_ratio,
        is_transfer,
    ])

    return X, y


def create_bank_partitions(
    seed: int = 42,
) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
    """Create genuinely non-IID partitions for BANK-001, BANK-002, BANK-003, and global validation.

    Bank Characteristics:
    - BANK-001 (Commercial Bank): Moderate volume (1,000 txns), moderate fraud (~2.5%), standard commercial transfers.
    - BANK-002 (Digital Wallet / Neo-Bank): High velocity (800 txns), higher fraud (~6.0%), very high balance drain ratio.
    - BANK-003 (Lender / Enterprise): Large transactions (1,200 txns), lower fraud (~1.5%), low velocity, high balances.
    - VAL (Global Validation): Representative mixed distribution (600 txns, ~3.0% fraud) for unbiased global evaluation.
    """
    # 1. Generate raw data
    X1, y1 = _generate_synthetic_bank_data(
        n_samples=1000,
        fraud_rate=0.025,
        amount_mean=9.5,
        amount_std=1.2,
        high_drain_bias=1.0,
        transfer_prob=0.35,
        seed=seed + 1,
    )

    X2, y2 = _generate_synthetic_bank_data(
        n_samples=800,
        fraud_rate=0.060,
        amount_mean=7.5,
        amount_std=0.9,
        high_drain_bias=5.0,  # strong account drain
        transfer_prob=0.60,
        seed=seed + 2,
    )

    X3, y3 = _generate_synthetic_bank_data(
        n_samples=1200,
        fraud_rate=0.015,
        amount_mean=11.2,
        amount_std=1.4,
        high_drain_bias=0.2,
        transfer_prob=0.20,
        seed=seed + 3,
    )

    X_val, y_val = _generate_synthetic_bank_data(
        n_samples=600,
        fraud_rate=0.030,
        amount_mean=9.8,
        amount_std=1.2,
        high_drain_bias=2.0,
        transfer_prob=0.35,
        seed=seed + 99,
    )

    # 2. Standardize features across a global reference baseline for stable SGD convergence
    # Note: Mean and scale computed on pooled baseline data, then applied to all partitions
    pooled_X = np.vstack([X1, X2, X3])
    means = np.mean(pooled_X, axis=0)
    stds = np.std(pooled_X, axis=0)
    stds[stds == 0] = 1.0

    X1_scaled = (X1 - means) / stds
    X2_scaled = (X2 - means) / stds
    X3_scaled = (X3 - means) / stds
    X_val_scaled = (X_val - means) / stds

    return {
        "BANK-001": (X1_scaled, y1),
        "BANK-002": (X2_scaled, y2),
        "BANK-003": (X3_scaled, y3),
        "val": (X_val_scaled, y_val),
    }


def get_partition_profiles(partitions: Dict[str, Tuple[np.ndarray, np.ndarray]]) -> List[Dict]:
    """Calculate profile metrics to prove non-IID characteristics across participants."""
    profiles = []
    for name, (X, y) in partitions.items():
        # X is scaled, but we can compute relative metrics
        profiles.append({
            "partition": name,
            "sample_count": len(y),
            "fraud_count": int(np.sum(y)),
            "fraud_rate": float(np.mean(y)),
            "mean_norm": float(np.mean(np.linalg.norm(X, axis=1))),
            "feature_0_mean": float(np.mean(X[:, 0])),  # scaled amount
            "feature_9_mean": float(np.mean(X[:, 9])),  # scaled drain ratio
            "feature_10_mean": float(np.mean(X[:, 10])), # scaled transfer prob
        })
    return profiles
