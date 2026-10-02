"""OLYMPUS Federation Subsystem — Simulation Runner (Stage 1).

Executes a verifiable, deterministic, 3-round federated learning simulation across
BANK-001, BANK-002, and BANK-003 with FedAvg aggregation and validation evaluation.
"""

import sys
import numpy as np
from pathlib import Path

# Add backend directory to path if run as standalone script
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from federation.data import create_bank_partitions, get_partition_profiles, FEATURE_COLUMNS
from federation.client import FederationClient
from federation.coordinator import FederationCoordinator


def run_federation_simulation(num_rounds: int = 3, seed: int = 42, verbose: bool = True) -> dict:
    """Run deterministic multi-round federation experiment."""
    if verbose:
        print("=" * 70)
        print(" OLYMPUS FEDERATION BASELINE SIMULATION (STAGE 1)")
        print("=" * 70)

    # 1. Generate non-IID partitions
    partitions = create_bank_partitions(seed=seed)
    profiles = get_partition_profiles(partitions)

    if verbose:
        print("\n--- Non-IID Partition Profiles ---")
        print(f"{'Partition':<10} | {'Samples':<8} | {'Fraud Count':<11} | {'Fraud Rate':<10} | {'Mean Drain':<10} | {'Mean Transfer':<13}")
        print("-" * 72)
        for p in profiles:
            print(f"{p['partition']:<10} | {p['sample_count']:<8} | {p['fraud_count']:<11} | {p['fraud_rate']:<10.3f} | {p['feature_9_mean']:<10.3f} | {p['feature_10_mean']:<13.3f}")

    # 2. Instantiate Clients
    clients = {
        "BANK-001": FederationClient("BANK-001", *partitions["BANK-001"]),
        "BANK-002": FederationClient("BANK-002", *partitions["BANK-002"]),
        "BANK-003": FederationClient("BANK-003", *partitions["BANK-003"]),
    }
    X_val, y_val = partitions["val"]

    # 3. Instantiate Coordinator
    coordinator = FederationCoordinator(num_features=len(FEATURE_COLUMNS), seed=seed)

    # Round 0 Baseline evaluation (prior to any federated rounds)
    r0_eval = coordinator.evaluate(X_val, y_val)
    if verbose:
        print("\n--- Baseline (Round 0 - Initial Global Weights) ---")
        print(f"Validation Loss:   {r0_eval['val_loss']:.4f}")
        print(f"Validation PR-AUC: {r0_eval['val_pr_auc']:.4f}")
        print(f"Validation Acc:    {r0_eval['val_accuracy']:.4f}")
        print(f"Weights Norm:      {r0_eval['global_weights_norm']:.4f}")

    rounds_records = [r0_eval]

    # 4. Execute Federation Rounds
    for r in range(1, num_rounds + 1):
        if verbose:
            print(f"\n>>> Starting Federation Round {r} <<<")

        global_w, global_b = coordinator.get_global_parameters()
        round_updates = []

        # Each client trains independently on private partition
        for cid, client in clients.items():
            # Derive deterministic round seed
            client_seed = seed + (r * 100) + int(cid.split("-")[1])
            update = client.local_train(
                global_weights=global_w,
                global_bias=global_b,
                epochs=5,
                lr=0.08,
                batch_size=64,
                seed=client_seed,
            )
            round_updates.append(update)
            if verbose:
                print(f"  [{cid}] Local Train: Loss={update['local_loss']:.4f}, PR-AUC={update['local_pr_auc']:.4f}, Delta Norm={update['delta_norm']:.4f}")

        # Coordinator aggregates updates via FedAvg
        agg_meta = coordinator.aggregate_fedavg(round_updates)
        eval_meta = coordinator.evaluate(X_val, y_val)
        eval_meta["aggregated_dw_norm"] = agg_meta["aggregated_dw_norm"]
        rounds_records.append(eval_meta)

        if verbose:
            print(f"  [FedAvg Aggregation] Participants: {len(agg_meta['participating_clients'])}, Total Samples: {agg_meta['total_samples']}, Delta Norm: {agg_meta['aggregated_dw_norm']:.4f}")
            print(f"  [Global Eval Round {r}] Loss: {eval_meta['val_loss']:.4f}, PR-AUC: {eval_meta['val_pr_auc']:.4f}, Acc: {eval_meta['val_accuracy']:.4f}")

    # 5. Analyze empirical trajectory
    val_losses = [rec["val_loss"] for rec in rounds_records]
    val_praucs = [rec["val_pr_auc"] for rec in rounds_records]

    loss_change = val_losses[-1] - val_losses[0]
    prauc_change = val_praucs[-1] - val_praucs[0]

    if val_losses[-1] < val_losses[0] and val_praucs[-1] > val_praucs[0]:
        trajectory = "improves"
    elif abs(loss_change) < 0.05 and abs(prauc_change) < 0.05:
        trajectory = "remains stable"
    else:
        trajectory = "fluctuates"

    if verbose:
        print("\n" + "=" * 70)
        print(" FEDERATION SIMULATION SUMMARY")
        print("=" * 70)
        print(f"Total Participants: {len(clients)} (BANK-001, BANK-002, BANK-003)")
        print(f"Rounds Completed:   {num_rounds}")
        print("\nRound-by-Round Validation Metrics:")
        print(f"{'Round':<8} | {'Val Loss':<12} | {'Val PR-AUC':<12} | {'Val Accuracy':<12} | {'Weights Norm':<12}")
        print("-" * 62)
        for rec in rounds_records:
            print(f"{rec['round']:<8} | {rec['val_loss']:<12.4f} | {rec['val_pr_auc']:<12.4f} | {rec['val_accuracy']:<12.4f} | {rec['global_weights_norm']:<12.4f}")

        print(f"\nEmpirical Determination: Global model {trajectory} across rounds.")
        print(f"Initial (R0) -> Final (R{num_rounds}):")
        print(f"  Loss:   {val_losses[0]:.4f} -> {val_losses[-1]:.4f} (delta: {loss_change:+.4f})")
        print(f"  PR-AUC: {val_praucs[0]:.4f} -> {val_praucs[-1]:.4f} (delta: {prauc_change:+.4f})")
        print("=" * 70)

    return {
        "profiles": profiles,
        "round_records": rounds_records,
        "empirical_trajectory": trajectory,
        "loss_change": loss_change,
        "prauc_change": prauc_change,
    }


if __name__ == "__main__":
    run_federation_simulation()
