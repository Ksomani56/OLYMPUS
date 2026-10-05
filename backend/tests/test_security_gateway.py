"""OLYMPUS Federation Subsystem — Stage 3 Security Gateway Test Suite.

Verifies:
1. Valid client updates pass through Gateway -> Coordinator -> Aggregator.
2. Malformed updates are rejected at the Gateway boundary and never reach aggregation.
3. NaN and infinite values in parameter deltas are strictly rejected.
4. Tensor dimension mismatches are rejected.
5. Stale / mismatched round IDs are rejected.
6. Deterministic SHA-256 fingerprint generation for identical payloads.
7. Tampering detection: any modification alters the computed SHA-256 hash.
8. Gateway Enforcement: Coordinator aggregate_fedavg() blocks unvetted or rejected updates.
9. Security event audit trail captures structured events for all decisions.
"""

import sys
import unittest
from pathlib import Path
import numpy as np

# Ensure backend directory is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from federation.gateway import SecurityGateway, GatewayDecision, GatewayResult
from federation.coordinator import FederationCoordinator
from federation.client import FederationClient
from federation.data import FEATURE_COLUMNS


class TestSecurityGateway(unittest.TestCase):
    """Test suite for Stage 3 Security Gateway control point."""

    def setUp(self):
        self.num_features = len(FEATURE_COLUMNS)  # 11 features
        self.gateway = SecurityGateway(num_features=self.num_features)
        self.coordinator = FederationCoordinator(num_features=self.num_features, gateway=self.gateway)

        # Baseline valid update payload for round 1
        self.valid_payload = {
            "client_id": "BANK-001",
            "round_id": 1,
            "sample_count": 500,
            "delta_weights": np.ones(self.num_features, dtype=np.float64) * 0.05,
            "delta_bias": 0.02,
        }

    def test_valid_update_acceptance_and_aggregation(self):
        """Verify valid client update passes Gateway with ACCEPT, hash, telemetry, and FedAvg."""
        result = self.gateway.process_update(self.valid_payload, expected_round=1)

        # Gateway checks
        self.assertEqual(result.decision, GatewayDecision.ACCEPT)
        self.assertTrue(result.is_valid)
        self.assertEqual(result.client_id, "BANK-001")
        self.assertEqual(result.round_id, 1)
        self.assertIsInstance(result.update_hash, str)
        self.assertEqual(len(result.update_hash), 64)  # SHA-256 hex length
        self.assertIn("l2_norm", result.telemetry)
        self.assertAlmostEqual(result.telemetry["l2_norm"], float(np.linalg.norm(self.valid_payload["delta_weights"])))
        self.assertEqual(result.telemetry["dimension"], self.num_features)

        # Forward through Coordinator aggregation
        agg_summary = self.coordinator.aggregate_fedavg([result])
        self.assertEqual(agg_summary["round"], 1)
        self.assertIn("BANK-001", agg_summary["participating_clients"])
        self.assertEqual(agg_summary["client_hashes"]["BANK-001"], result.update_hash)

    def test_missing_required_fields_rejected(self):
        """Verify updates missing required fields (e.g. sample_count, delta_weights) are REJECTED."""
        # 1. Missing client_id
        p1 = dict(self.valid_payload)
        del p1["client_id"]
        res1 = self.gateway.process_update(p1, expected_round=1)
        self.assertEqual(res1.decision, GatewayDecision.REJECT)
        self.assertFalse(res1.is_valid)
        self.assertIn("client_id", res1.reason.lower())

        # 2. Missing round_id
        p2 = dict(self.valid_payload)
        del p2["round_id"]
        res2 = self.gateway.process_update(p2, expected_round=1)
        self.assertEqual(res2.decision, GatewayDecision.REJECT)
        self.assertFalse(res2.is_valid)
        self.assertIn("round_id", res2.reason.lower())

        # 3. Missing delta_weights
        p3 = dict(self.valid_payload)
        del p3["delta_weights"]
        res3 = self.gateway.process_update(p3, expected_round=1)
        self.assertEqual(res3.decision, GatewayDecision.REJECT)
        self.assertFalse(res3.is_valid)
        self.assertIn("delta_weights", res3.reason.lower())

        # 4. Missing delta_bias
        p4 = dict(self.valid_payload)
        del p4["delta_bias"]
        res4 = self.gateway.process_update(p4, expected_round=1)
        self.assertEqual(res4.decision, GatewayDecision.REJECT)
        self.assertFalse(res4.is_valid)
        self.assertIn("delta_bias", res4.reason.lower())

    def test_invalid_and_stale_round_rejected(self):
        """Verify updates belonging to wrong or stale round are rejected."""
        # Active round is 1, client sends round 2
        p_future = dict(self.valid_payload, round_id=2)
        res_future = self.gateway.process_update(p_future, expected_round=1)
        self.assertEqual(res_future.decision, GatewayDecision.REJECT)
        self.assertIn("Round mismatch", res_future.reason)

        # Active round is 3, client sends round 1
        p_stale = dict(self.valid_payload, round_id=1)
        res_stale = self.gateway.process_update(p_stale, expected_round=3)
        self.assertEqual(res_stale.decision, GatewayDecision.REJECT)
        self.assertIn("Round mismatch", res_stale.reason)

    def test_non_positive_sample_count_rejected(self):
        """Verify non-positive or invalid sample counts are rejected."""
        for bad_count in [0, -50, "500", None]:
            p = dict(self.valid_payload, sample_count=bad_count)
            res = self.gateway.process_update(p, expected_round=1)
            self.assertEqual(res.decision, GatewayDecision.REJECT)
            self.assertIn("sample_count", res.reason)

    def test_nan_and_inf_numerical_poisoning_rejected(self):
        """Verify delta tensors containing NaN, +Inf, or -Inf are rejected."""
        # 1. NaN in delta_weights
        dw_nan = np.ones(self.num_features)
        dw_nan[3] = np.nan
        p_nan = dict(self.valid_payload, delta_weights=dw_nan)
        res_nan = self.gateway.process_update(p_nan, expected_round=1)
        self.assertEqual(res_nan.decision, GatewayDecision.REJECT)
        self.assertIn("NaN", res_nan.reason)

        # 2. Inf in delta_weights
        dw_inf = np.ones(self.num_features)
        dw_inf[0] = np.inf
        p_inf = dict(self.valid_payload, delta_weights=dw_inf)
        res_inf = self.gateway.process_update(p_inf, expected_round=1)
        self.assertEqual(res_inf.decision, GatewayDecision.REJECT)
        self.assertIn("infinite", res_inf.reason)

        # 3. NaN in delta_bias
        p_bias_nan = dict(self.valid_payload, delta_bias=float("nan"))
        res_bias_nan = self.gateway.process_update(p_bias_nan, expected_round=1)
        self.assertEqual(res_bias_nan.decision, GatewayDecision.REJECT)
        self.assertIn("NaN", res_bias_nan.reason)

        # 4. -Inf in delta_bias
        p_bias_inf = dict(self.valid_payload, delta_bias=float("-inf"))
        res_bias_inf = self.gateway.process_update(p_bias_inf, expected_round=1)
        self.assertEqual(res_bias_inf.decision, GatewayDecision.REJECT)
        self.assertIn("infinite", res_bias_inf.reason)

    def test_dimension_mismatch_rejected(self):
        """Verify delta_weights with wrong shape/length are rejected."""
        # Expected 11 features, provided 5
        dw_short = np.array([0.1, 0.2, 0.3, 0.4, 0.5])
        p = dict(self.valid_payload, delta_weights=dw_short)
        res = self.gateway.process_update(p, expected_round=1)
        self.assertEqual(res.decision, GatewayDecision.REJECT)
        self.assertIn("dimension mismatch", res.reason)

    def test_deterministic_sha256_hashing(self):
        """Verify equivalent updates produce identical SHA-256 hashes."""
        h1 = self.gateway.compute_update_hash(
            client_id="BANK-001",
            round_id=1,
            sample_count=500,
            delta_weights=np.array([0.1, 0.2, 0.3]),
            delta_bias=0.05,
        )
        h2 = self.gateway.compute_update_hash(
            client_id="BANK-001",
            round_id=1,
            sample_count=500,
            delta_weights=np.array([0.1, 0.2, 0.3]),
            delta_bias=0.05,
        )
        self.assertEqual(h1, h2)
        self.assertIsInstance(h1, str)
        self.assertEqual(len(h1), 64)

    def test_tampering_detection(self):
        """Verify any subtle modification in weights, bias, or metadata alters the SHA-256 hash."""
        base_h = self.gateway.compute_update_hash(
            client_id="BANK-001",
            round_id=1,
            sample_count=500,
            delta_weights=np.ones(self.num_features) * 0.1,
            delta_bias=0.05,
        )

        # Perturb single weight parameter by 1e-6
        perturbed_w = np.ones(self.num_features) * 0.1
        perturbed_w[0] += 1e-6
        h_perturbed_w = self.gateway.compute_update_hash(
            client_id="BANK-001",
            round_id=1,
            sample_count=500,
            delta_weights=perturbed_w,
            delta_bias=0.05,
        )
        self.assertNotEqual(base_h, h_perturbed_w)

        # Alter client ID
        h_diff_client = self.gateway.compute_update_hash(
            client_id="BANK-002",
            round_id=1,
            sample_count=500,
            delta_weights=np.ones(self.num_features) * 0.1,
            delta_bias=0.05,
        )
        self.assertNotEqual(base_h, h_diff_client)

        # Alter round ID
        h_diff_round = self.gateway.compute_update_hash(
            client_id="BANK-001",
            round_id=2,
            sample_count=500,
            delta_weights=np.ones(self.num_features) * 0.1,
            delta_bias=0.05,
        )
        self.assertNotEqual(base_h, h_diff_round)

    def test_gateway_enforcement_at_coordinator(self):
        """Verify coordinator cannot aggregate rejected updates and enforces gateway boundary."""
        # 1. Direct submission of rejected GatewayResult raises ValueError
        rejected_result = self.gateway.process_update(
            dict(self.valid_payload, delta_bias=float("nan")), expected_round=1
        )
        self.assertEqual(rejected_result.decision, GatewayDecision.REJECT)

        with self.assertRaises(ValueError) as ctx:
            self.coordinator.aggregate_fedavg([rejected_result])
        self.assertIn("rejected", str(ctx.exception).lower())

        # 2. Raw dict bypassing gateway with NaN is intercepted by coordinator's gateway
        raw_poisoned = dict(self.valid_payload, delta_weights=np.array([np.nan] * self.num_features))
        with self.assertRaises(ValueError) as ctx2:
            self.coordinator.aggregate_fedavg([raw_poisoned])
        self.assertIn("rejected", str(ctx2.exception).lower())

    def test_security_event_audit_logging(self):
        """Verify every gateway evaluation appends an auditable SecurityEvent record."""
        initial_count = len(self.gateway.security_events)

        # Send 1 valid update
        self.gateway.process_update(self.valid_payload, expected_round=1)

        # Send 1 invalid update (stale round)
        self.gateway.process_update(dict(self.valid_payload, round_id=99), expected_round=1)

        events = self.gateway.security_events
        self.assertEqual(len(events), initial_count + 2)

        accept_event = events[-2]
        self.assertEqual(accept_event["decision"], "ACCEPT")
        self.assertEqual(accept_event["event_type"], "GATEWAY_UPDATE_INGRESS")
        self.assertTrue(accept_event["event_id"].startswith("SEC-"))

        reject_event = events[-1]
        self.assertEqual(reject_event["decision"], "REJECT")
        self.assertEqual(reject_event["event_type"], "GATEWAY_VALIDATION_FAILURE")
        self.assertIn("mismatch", reject_event["reason"])


if __name__ == "__main__":
    unittest.main()
