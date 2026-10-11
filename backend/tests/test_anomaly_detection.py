"""
Unit tests for OLYMPUS Stage 5: Anomaly & Update Telemetry Detection Engine.

Verifies:
1. Synthetic mathematical vectors:
   - Identical updates (cosine similarity = 1.0, norm ratio = 1.0, status NORMAL)
   - Opposing direction updates (cosine similarity = -1.0, status ANOMALOUS)
   - Magnitude outlier updates (norm ratio >= 3.0, status ANOMALOUS)
   - Safe handling of zero vectors without division by zero.
2. Minimum peer consortium constraints (N < 3 returns INSUFFICIENT_PEERS).
3. Non-interference: FedAvg mathematical weights and trust scores remain completely
   untouched by anomaly detection results (observation-only layer).
4. Coordinator integration and dictionary serialization.
"""

import unittest
import numpy as np

from backend.federation.anomaly import (
    AnomalyDetectionEngine,
    AnomalyResult,
    DetectionStatus,
)
from backend.federation.gateway import GatewayResult, GatewayDecision
from backend.federation.coordinator import FederationCoordinator


import time


def _create_mock_gateway_result(
    client_id: str,
    delta_w: np.ndarray,
    delta_b: float = 0.0,
    sample_count: int = 100,
    round_id: int = 1,
) -> GatewayResult:
    """Helper to construct synthetic GatewayResult instances."""
    norm = float(np.linalg.norm(delta_w))
    return GatewayResult(
        decision=GatewayDecision.ACCEPT,
        client_id=client_id,
        round_id=round_id,
        is_valid=True,
        reason="",
        update_hash=f"hash_{client_id}",
        timestamp=time.time(),
        sample_count=sample_count,
        delta_weights=delta_w,
        delta_bias=delta_b,
        telemetry={
            "l2_norm": norm,
            "max_abs_weight": float(np.max(np.abs(delta_w))),
            "finite_check": True,
            "delta_bias": delta_b,
        },
    )


class TestAnomalyDetectionEngine(unittest.TestCase):
    def setUp(self):
        self.engine = AnomalyDetectionEngine(
            min_peers=3,
            cosine_similarity_threshold=0.0,
            norm_ratio_low=0.1,
            norm_ratio_high=3.0,
        )

    def test_insufficient_peers_single_client(self):
        """Single update must yield INSUFFICIENT_PEERS status."""
        w1 = np.array([1.0, 2.0, 3.0])
        res1 = _create_mock_gateway_result("BANK-001", w1)
        results = self.engine.evaluate_round([res1])

        self.assertIn("BANK-001", results)
        a_res = results["BANK-001"]
        self.assertEqual(a_res.status, DetectionStatus.INSUFFICIENT_PEERS)
        self.assertFalse(a_res.is_anomalous)
        self.assertEqual(a_res.peer_count, 0)
        self.assertIn("insufficient_peers", a_res.reasons)

    def test_insufficient_peers_two_clients(self):
        """Two updates (min_peers=3) must yield INSUFFICIENT_PEERS status."""
        w1 = np.array([1.0, 0.0, 0.0])
        w2 = np.array([1.0, 0.0, 0.0])
        res1 = _create_mock_gateway_result("BANK-001", w1)
        res2 = _create_mock_gateway_result("BANK-002", w2)

        results = self.engine.evaluate_round([res1, res2])
        self.assertEqual(len(results), 2)
        for cid in ["BANK-001", "BANK-002"]:
            self.assertEqual(results[cid].status, DetectionStatus.INSUFFICIENT_PEERS)
            self.assertEqual(results[cid].peer_count, 1)

    def test_identical_updates_all_normal(self):
        """Three identical updates should result in cos_sim=1.0, norm_ratio=1.0, status=NORMAL."""
        w = np.array([2.0, -1.0, 0.5, 3.0])
        updates = [
            _create_mock_gateway_result(f"BANK-00{i}", w.copy())
            for i in range(1, 4)
        ]
        results = self.engine.evaluate_round(updates)
        self.assertEqual(len(results), 3)

        for cid, a_res in results.items():
            self.assertEqual(a_res.status, DetectionStatus.NORMAL)
            self.assertFalse(a_res.is_anomalous)
            self.assertAlmostEqual(a_res.cosine_similarity, 1.0, places=5)
            self.assertAlmostEqual(a_res.norm_ratio, 1.0, places=5)
            self.assertEqual(a_res.peer_count, 2)
            self.assertEqual(len(a_res.reasons), 0)

    def test_divergent_direction_anomalous(self):
        """Opposite direction vector should trigger low_cosine_similarity anomaly."""
        w_normal = np.array([1.0, 2.0, 3.0])
        w_opposing = np.array([-1.0, -2.0, -3.0])

        updates = [
            _create_mock_gateway_result("BANK-001", w_normal.copy()),
            _create_mock_gateway_result("BANK-002", w_normal.copy()),
            _create_mock_gateway_result("BANK-003", w_opposing.copy()),
        ]
        results = self.engine.evaluate_round(updates)

        # Peer consensus for BANK-003 is (BANK-001 + BANK-002)/2 = w_normal
        # Cosine similarity between w_opposing and w_normal is exactly -1.0
        res3 = results["BANK-003"]
        self.assertEqual(res3.status, DetectionStatus.ANOMALOUS)
        self.assertTrue(res3.is_anomalous)
        self.assertAlmostEqual(res3.cosine_similarity, -1.0, places=5)
        self.assertTrue(any("low_cosine_similarity" in r for r in res3.reasons))

    def test_divergent_magnitude_large_norm(self):
        """An update with 10x larger norm should trigger high_norm_ratio anomaly."""
        w_normal = np.array([1.0, 1.0, 1.0])
        w_large = np.array([10.0, 10.0, 10.0])

        updates = [
            _create_mock_gateway_result("BANK-001", w_normal.copy()),
            _create_mock_gateway_result("BANK-002", w_normal.copy()),
            _create_mock_gateway_result("BANK-003", w_large.copy()),
        ]
        results = self.engine.evaluate_round(updates)

        res3 = results["BANK-003"]
        self.assertEqual(res3.status, DetectionStatus.ANOMALOUS)
        self.assertTrue(res3.is_anomalous)
        self.assertAlmostEqual(res3.norm_ratio, 10.0, places=4)
        self.assertTrue(any("high_norm_ratio" in r for r in res3.reasons))

    def test_divergent_magnitude_low_norm(self):
        """An update with tiny norm (< 0.1 ratio) should trigger low_norm_ratio anomaly."""
        w_normal = np.array([10.0, 10.0, 10.0])
        w_tiny = np.array([0.1, 0.1, 0.1])

        updates = [
            _create_mock_gateway_result("BANK-001", w_normal.copy()),
            _create_mock_gateway_result("BANK-002", w_normal.copy()),
            _create_mock_gateway_result("BANK-003", w_tiny.copy()),
        ]
        results = self.engine.evaluate_round(updates)

        res3 = results["BANK-003"]
        self.assertEqual(res3.status, DetectionStatus.ANOMALOUS)
        self.assertTrue(res3.is_anomalous)
        self.assertAlmostEqual(res3.norm_ratio, 0.01, places=4)
        self.assertTrue(any("low_norm_ratio" in r for r in res3.reasons))

    def test_zero_vector_handling(self):
        """Zero vector updates must be handled gracefully without division by zero."""
        w_normal = np.array([1.0, 1.0, 1.0])
        w_zero = np.array([0.0, 0.0, 0.0])

        updates = [
            _create_mock_gateway_result("BANK-001", w_normal.copy()),
            _create_mock_gateway_result("BANK-002", w_normal.copy()),
            _create_mock_gateway_result("BANK-003", w_zero.copy()),
        ]
        results = self.engine.evaluate_round(updates)

        res3 = results["BANK-003"]
        self.assertEqual(res3.l2_norm, 0.0)
        self.assertEqual(res3.cosine_similarity, 0.0)
        self.assertEqual(res3.norm_ratio, 0.0)
        self.assertEqual(res3.status, DetectionStatus.ANOMALOUS)

    def test_serialization_to_dict(self):
        """Verify to_dict returns clean, JSON-serializable types."""
        w = np.array([1.0, 2.0, 3.0])
        updates = [
            _create_mock_gateway_result(f"BANK-00{i}", w.copy())
            for i in range(1, 4)
        ]
        results = self.engine.evaluate_round(updates)
        d = results["BANK-001"].to_dict()

        self.assertIsInstance(d["client_id"], str)
        self.assertIsInstance(d["status"], str)
        self.assertIsInstance(d["is_anomalous"], bool)
        self.assertIsInstance(d["cosine_similarity"], float)
        self.assertIsInstance(d["l2_norm"], float)
        self.assertIsInstance(d["peer_median_norm"], float)
        self.assertIsInstance(d["norm_ratio"], float)
        self.assertIsInstance(d["peer_count"], int)
        self.assertIsInstance(d["reasons"], list)


class TestCoordinatorAnomalyIntegration(unittest.TestCase):
    """Test anomaly engine integration inside FederationCoordinator."""

    def setUp(self):
        self.coordinator = FederationCoordinator(num_features=4)

    def test_coordinator_aggregation_attaches_anomaly_results(self):
        """aggregate_fedavg must attach anomaly telemetry without altering FedAvg weights."""
        delta_w = np.array([0.1, 0.2, -0.1, 0.05], dtype=np.float64)
        client_updates = [
            {
                "client_id": f"BANK-00{i}",
                "round_id": 1,
                "sample_count": 100,
                "delta_weights": delta_w.copy(),
                "delta_bias": 0.01,
            }
            for i in range(1, 4)
        ]

        summary = self.coordinator.aggregate_fedavg(client_updates)

        self.assertIn("anomaly_results", summary)
        self.assertEqual(len(summary["anomaly_results"]), 3)
        for cid in ["BANK-001", "BANK-002", "BANK-003"]:
            a_dict = summary["anomaly_results"][cid]
            self.assertEqual(a_dict["status"], "NORMAL")
            self.assertFalse(a_dict["is_anomalous"])
            self.assertAlmostEqual(a_dict["cosine_similarity"], 1.0, places=4)

    def test_anomalous_update_is_not_rejected_or_deprived_of_weight(self):
        """Stage 5 is observation only: an anomalous update must still be weighted and aggregated."""
        w_normal = np.array([0.1, 0.1, 0.1, 0.1], dtype=np.float64)
        w_anomalous = np.array([-0.1, -0.1, -0.1, -0.1], dtype=np.float64)

        client_updates = [
            {
                "client_id": "BANK-001",
                "round_id": 1,
                "sample_count": 100,
                "delta_weights": w_normal.copy(),
                "delta_bias": 0.0,
            },
            {
                "client_id": "BANK-002",
                "round_id": 1,
                "sample_count": 100,
                "delta_weights": w_normal.copy(),
                "delta_bias": 0.0,
            },
            {
                "client_id": "BANK-003",
                "round_id": 1,
                "sample_count": 100,
                "delta_weights": w_anomalous.copy(),
                "delta_bias": 0.0,
            },
        ]

        w_init = self.coordinator.global_weights.copy()
        summary = self.coordinator.aggregate_fedavg(client_updates)

        # Anomaly results flag BANK-003
        self.assertTrue(summary["anomaly_results"]["BANK-003"]["is_anomalous"])
        self.assertEqual(summary["anomaly_results"]["BANK-003"]["status"], "ANOMALOUS")

        # But all 3 clients participated in aggregation
        self.assertEqual(len(summary["participating_clients"]), 3)
        self.assertEqual(summary["total_samples"], 300)

        # Exact FedAvg calculation: (100*w1 + 100*w2 + 100*w3)/300 = (2*w_normal + w_anomalous)/3
        expected_dw = (w_normal + w_normal + w_anomalous) / 3.0
        np.testing.assert_allclose(self.coordinator.global_weights, w_init + expected_dw, rtol=1e-5)

        # Trust score for BANK-003 must NOT be penalized (Stage 5 is observation only)
        # Newly observed client receives initial trust 100.0, +1.0 reinforcement capped at 100.0
        trust_3 = self.coordinator.trust_engine.get_trust_score("BANK-003")
        self.assertEqual(trust_3, 100.0)


if __name__ == "__main__":
    unittest.main()
