"""OLYMPUS Federation Subsystem — Stage 1 Baseline Test Suite.

Verifies:
1. Genuine non-IID data distributions across BANK-001, BANK-002, and BANK-003.
2. Client isolation (local training, private data separation, parameter deltas).
3. Coordinator structural validation and sample-weighted FedAvg aggregation.
4. Multi-round execution, recording round-by-round validation loss and PR-AUC.
5. Deterministic reproducibility across repeated runs.
6. Existing OLYMPUS API integrity (zero regressions).
"""

import sys
import unittest
from pathlib import Path
import numpy as np

# Ensure backend is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from federation.data import create_bank_partitions, get_partition_profiles, FEATURE_COLUMNS
from federation.client import FederationClient
from federation.coordinator import FederationCoordinator
from federation.run_simulation import run_federation_simulation


class TestFederationBaseline(unittest.TestCase):
    """Test suite for Stage 1 clean federation baseline."""

    def test_non_iid_distributions(self):
        """Verify BANK-001, BANK-002, and BANK-003 have genuinely different distributions."""
        partitions = create_bank_partitions(seed=42)
        self.assertIn("BANK-001", partitions)
        self.assertIn("BANK-002", partitions)
        self.assertIn("BANK-003", partitions)
        self.assertIn("val", partitions)

        profiles = {p["partition"]: p for p in get_partition_profiles(partitions)}

        # 1. Sample size verification
        self.assertEqual(profiles["BANK-001"]["sample_count"], 1000)
        self.assertEqual(profiles["BANK-002"]["sample_count"], 800)
        self.assertEqual(profiles["BANK-003"]["sample_count"], 1200)
        self.assertEqual(profiles["val"]["sample_count"], 600)

        # 2. Fraud rate differences (non-IID label distribution)
        r1 = profiles["BANK-001"]["fraud_rate"]
        r2 = profiles["BANK-002"]["fraud_rate"]
        r3 = profiles["BANK-003"]["fraud_rate"]
        self.assertNotEqual(r1, r2)
        self.assertNotEqual(r2, r3)
        self.assertGreater(r2, r1, "BANK-002 should have a higher fraud rate (digital wallet profile)")
        self.assertGreater(r1, r3, "BANK-001 should have a higher fraud rate than BANK-003")

        # 3. Feature domain differences (non-IID covariate shift: drain ratio & transfer proportion)
        drain_wallet = profiles["BANK-002"]["feature_9_mean"]
        drain_commercial = profiles["BANK-001"]["feature_9_mean"]
        drain_lender = profiles["BANK-003"]["feature_9_mean"]
        self.assertGreater(drain_wallet, drain_commercial)
        self.assertGreater(drain_commercial, drain_lender)

    def test_client_isolation_and_parameter_deltas(self):
        """Verify client conducts local training without exposing private records."""
        partitions = create_bank_partitions(seed=42)
        client = FederationClient("BANK-001", *partitions["BANK-001"])

        dummy_w = np.zeros(len(FEATURE_COLUMNS))
        dummy_b = 0.0

        update = client.local_train(dummy_w, dummy_b, epochs=2, lr=0.05, seed=123)

        # Check required fields
        self.assertEqual(update["client_id"], "BANK-001")
        self.assertEqual(update["sample_count"], 1000)
        self.assertIn("delta_weights", update)
        self.assertIn("delta_bias", update)
        self.assertIn("local_loss", update)
        self.assertIn("local_pr_auc", update)

        # Ensure deltas are non-zero after training
        self.assertGreater(np.linalg.norm(update["delta_weights"]), 0.0)

        # Ensure client does NOT include raw X or y in its update payload
        self.assertNotIn("X", update)
        self.assertNotIn("y", update)
        self.assertNotIn("raw_records", update)

    def test_coordinator_validation_and_fedavg(self):
        """Verify coordinator validates payloads and performs sample-weighted FedAvg."""
        coordinator = FederationCoordinator(num_features=len(FEATURE_COLUMNS), seed=42)
        initial_w, initial_b = coordinator.get_global_parameters()

        # Reject invalid update with corrupted shape
        invalid_update = {
            "client_id": "MALICIOUS-001",
            "sample_count": 100,
            "delta_weights": np.array([1.0, 2.0]),  # Wrong dimension (expected 11)
            "delta_bias": 0.0,
        }
        self.assertFalse(coordinator.validate_update(invalid_update))

        # Accept well-formed updates
        dw1 = np.ones(len(FEATURE_COLUMNS)) * 0.1
        dw2 = np.ones(len(FEATURE_COLUMNS)) * 0.2
        valid_updates = [
            {"client_id": "BANK-001", "sample_count": 100, "delta_weights": dw1, "delta_bias": 0.05},
            {"client_id": "BANK-002", "sample_count": 300, "delta_weights": dw2, "delta_bias": 0.15},
        ]

        # Total samples = 400. BANK-001 weight = 0.25, BANK-002 weight = 0.75
        expected_dw = 0.25 * dw1 + 0.75 * dw2
        expected_db = 0.25 * 0.05 + 0.75 * 0.15

        agg = coordinator.aggregate_fedavg(valid_updates)
        self.assertEqual(agg["round"], 1)
        self.assertEqual(agg["total_samples"], 400)

        new_w, new_b = coordinator.get_global_parameters()
        np.testing.assert_allclose(new_w, initial_w + expected_dw, rtol=1e-5)
        self.assertAlmostEqual(new_b, initial_b + expected_db, places=5)

    def test_multi_round_convergence_and_metrics_logging(self):
        """Verify 3-round federation records metrics and produces an empirical trajectory."""
        result = run_federation_simulation(num_rounds=3, seed=42, verbose=False)

        records = result["round_records"]
        self.assertEqual(len(records), 4)  # Round 0 + Rounds 1, 2, 3

        # Check every round has loss, PR-AUC, accuracy, and weights norm
        for r_idx, rec in enumerate(records):
            self.assertEqual(rec["round"], r_idx)
            self.assertIn("val_loss", rec)
            self.assertIn("val_pr_auc", rec)
            self.assertIn("val_accuracy", rec)
            self.assertIn("global_weights_norm", rec)

        # Check empirical determination string
        self.assertIn(result["empirical_trajectory"], ["improves", "remains stable", "fluctuates"])
        self.assertEqual(result["empirical_trajectory"], "improves")

    def test_simulation_reproducibility(self):
        """Verify deterministic reproducibility with fixed seed."""
        res1 = run_federation_simulation(num_rounds=2, seed=42, verbose=False)
        res2 = run_federation_simulation(num_rounds=2, seed=42, verbose=False)

        rec1 = res1["round_records"]
        rec2 = res2["round_records"]

        for r in range(len(rec1)):
            self.assertAlmostEqual(rec1[r]["val_loss"], rec2[r]["val_loss"], places=7)
            self.assertAlmostEqual(rec1[r]["val_pr_auc"], rec2[r]["val_pr_auc"], places=7)
            self.assertAlmostEqual(rec1[r]["global_weights_norm"], rec2[r]["global_weights_norm"], places=7)

    def test_existing_api_integrity(self):
        """Verify existing OLYMPUS backend endpoints are completely unaffected."""
        from fastapi.testclient import TestClient
        from risks_api import app

        client = TestClient(app)

        # Root
        root_res = client.get("/")
        self.assertEqual(root_res.status_code, 200)

        # Health
        health_res = client.get("/health")
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.json().get("status"), "ok")

        # Status
        status_res = client.get("/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json().get("status"), "healthy")
        self.assertEqual(status_res.json().get("service"), "OLYMPUS Risk Inference API")

        # API Status
        api_status_res = client.get("/api/status")
        self.assertEqual(api_status_res.status_code, 200)
        self.assertEqual(api_status_res.json().get("status"), "healthy")
        self.assertEqual(api_status_res.json().get("service"), "OLYMPUS Risk Inference API")


if __name__ == "__main__":
    unittest.main()
