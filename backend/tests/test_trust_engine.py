"""OLYMPUS Federation Subsystem — Stage 4 Dynamic Trust Engine Test Suite.

Verifies:
1. Initial trust: Newly observed client receives deterministic initial score (100.0) and TRUSTED status.
2. Valid behavior: Repeated accepted updates reinforce trust and maintain 100.0 ceiling.
3. Rejection penalties: First rejection incurs -15.0 penalty; consecutive rejections incur -25.0 penalty.
4. Mismatch penalty: Round mismatch incurs -10.0 penalty.
5. Boundary clamping: Score never drops below 0.0 or exceeds 100.0.
6. Multi-client isolation: BANK-001, BANK-002, and BANK-003 maintain completely independent trust states.
7. Determinism: Identical sequences of GatewayResult produce identical trust scores and history logs.
8. Audit trail explainability: Transition history records delta, score_after, and reason.
9. Coordinator integration: Coordinator.receive_update() and aggregate_fedavg() seamlessly update trust.
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
from federation.trust import TrustEngine, TrustStatus, ClientTrustRecord
from federation.coordinator import FederationCoordinator
from federation.data import FEATURE_COLUMNS


class TestDynamicTrustEngine(unittest.TestCase):
    """Test suite for Stage 4 Dynamic Trust Engine."""

    def setUp(self):
        self.num_features = len(FEATURE_COLUMNS)
        self.gateway = SecurityGateway(num_features=self.num_features)
        self.trust_engine = TrustEngine(initial_trust=100.0)
        self.coordinator = FederationCoordinator(
            num_features=self.num_features,
            gateway=self.gateway,
            trust_engine=self.trust_engine,
        )

        self.valid_payload = {
            "client_id": "BANK-001",
            "round_id": 1,
            "sample_count": 500,
            "delta_weights": np.ones(self.num_features) * 0.05,
            "delta_bias": 0.02,
        }

    def test_initial_trust_policy(self):
        """Verify newly observed client receives deterministic 100.0 score and TRUSTED status."""
        rec = self.trust_engine.get_or_register_client("BANK-001")
        self.assertEqual(rec.trust_score, 100.0)
        self.assertEqual(rec.status, TrustStatus.TRUSTED)
        self.assertEqual(rec.rounds_seen, 0)
        self.assertEqual(rec.accepted_updates, 0)
        self.assertEqual(rec.rejected_updates, 0)

        # Query unobserved client
        self.assertEqual(self.trust_engine.get_trust_score("UNSEEN-001"), 100.0)

    def test_valid_behavior_reinforcement_and_ceiling(self):
        """Verify valid updates increase/maintain trust and cap at 100.0."""
        # Start at 90.0 to test upward evolution
        custom_engine = TrustEngine(initial_trust=90.0, reward_step=2.0)
        res = self.gateway.process_update(self.valid_payload, expected_round=1)
        self.assertEqual(res.decision, GatewayDecision.ACCEPT)

        # Round 1: 90 + 2 -> 92
        rec1 = custom_engine.evaluate_update(res)
        self.assertEqual(rec1.trust_score, 92.0)
        self.assertEqual(rec1.accepted_updates, 1)
        self.assertEqual(rec1.consecutive_rejections, 0)

        # Make another update for round 2
        p2 = dict(self.valid_payload, round_id=2)
        res2 = self.gateway.process_update(p2, expected_round=2)
        rec2 = custom_engine.evaluate_update(res2)
        self.assertEqual(rec2.trust_score, 94.0)

        # Fast forward multiple valid updates to verify 100.0 ceiling
        for r in range(3, 10):
            pr = dict(self.valid_payload, round_id=r)
            res_r = self.gateway.process_update(pr, expected_round=r)
            rec_r = custom_engine.evaluate_update(res_r)

        self.assertEqual(custom_engine.get_trust_score("BANK-001"), 100.0)

    def test_rejection_penalties_single_and_consecutive(self):
        """Verify 1st rejection applies -15.0 penalty, and consecutive rejection applies -25.0."""
        # 1. First rejection (NaN poisoning)
        p_nan = dict(self.valid_payload, delta_weights=np.array([np.nan] * self.num_features))
        res_nan = self.gateway.process_update(p_nan, expected_round=1)
        self.assertEqual(res_nan.decision, GatewayDecision.REJECT)

        rec1 = self.trust_engine.evaluate_update(res_nan)
        # Initial 100.0 - 15.0 = 85.0
        self.assertEqual(rec1.trust_score, 85.0)
        self.assertEqual(rec1.consecutive_rejections, 1)
        self.assertEqual(rec1.status, TrustStatus.TRUSTED)  # >= 80 is TRUSTED

        # 2. Second consecutive rejection (Inf poisoning)
        p_inf = dict(self.valid_payload, delta_weights=np.array([np.inf] * self.num_features))
        res_inf = self.gateway.process_update(p_inf, expected_round=1)
        rec2 = self.trust_engine.evaluate_update(res_inf)
        # 85.0 - 25.0 = 60.0
        self.assertEqual(rec2.trust_score, 60.0)
        self.assertEqual(rec2.consecutive_rejections, 2)
        self.assertEqual(rec2.status, TrustStatus.NORMAL)  # 50 <= score < 80 is NORMAL

        # 3. Third consecutive rejection
        p_bad_dim = dict(self.valid_payload, delta_weights=np.array([1.0, 2.0]))
        res_bad_dim = self.gateway.process_update(p_bad_dim, expected_round=1)
        rec3 = self.trust_engine.evaluate_update(res_bad_dim)
        # 60.0 - 25.0 = 35.0
        self.assertEqual(rec3.trust_score, 35.0)
        self.assertEqual(rec3.consecutive_rejections, 3)
        self.assertEqual(rec3.status, TrustStatus.DEGRADED)  # < 50 is DEGRADED

    def test_round_mismatch_penalty(self):
        """Verify out-of-sync or stale round submission incurs specific -10.0 penalty."""
        # Active round is 1, client sends round 99
        p_stale = dict(self.valid_payload, round_id=99)
        res_stale = self.gateway.process_update(p_stale, expected_round=1)
        self.assertEqual(res_stale.decision, GatewayDecision.REJECT)

        rec = self.trust_engine.evaluate_update(res_stale)
        # 100.0 - 10.0 = 90.0
        self.assertEqual(rec.trust_score, 90.0)
        self.assertIn("Round mismatch", rec.score_history[-1]["reason"])

    def test_floor_boundary_at_zero(self):
        """Verify trust score cannot fall below 0.0 even under severe repeated failures."""
        for r in range(1, 10):
            p_bad = dict(self.valid_payload, delta_weights=np.array([np.nan] * self.num_features), round_id=r)
            res = self.gateway.process_update(p_bad, expected_round=r)
            rec = self.trust_engine.evaluate_update(res)

        self.assertEqual(rec.trust_score, 0.0)
        self.assertEqual(rec.status, TrustStatus.DEGRADED)

    def test_multi_client_isolation(self):
        """Verify participants maintain completely independent trust state."""
        # BANK-001 sends valid updates
        res1 = self.gateway.process_update(self.valid_payload, expected_round=1)
        self.trust_engine.evaluate_update(res1)

        # BANK-002 sends malicious NaN update
        p2 = dict(self.valid_payload, client_id="BANK-002", delta_weights=np.array([np.nan] * self.num_features))
        res2 = self.gateway.process_update(p2, expected_round=1)
        self.trust_engine.evaluate_update(res2)

        # Verify BANK-001 remains 100.0
        self.assertEqual(self.trust_engine.get_trust_score("BANK-001"), 100.0)
        # Verify BANK-002 drops to 85.0
        self.assertEqual(self.trust_engine.get_trust_score("BANK-002"), 85.0)
        # Verify unobserved BANK-003 is unaffected (100.0)
        self.assertEqual(self.trust_engine.get_trust_score("BANK-003"), 100.0)

    def test_determinism_and_reproducibility(self):
        """Verify identical event sequences yield identical scores and history logs."""
        engine1 = TrustEngine(initial_trust=100.0)
        engine2 = TrustEngine(initial_trust=100.0)

        p_good = dict(self.valid_payload)
        p_bad = dict(self.valid_payload, delta_bias=float("nan"))

        res_good = self.gateway.process_update(p_good, expected_round=1)
        res_bad = self.gateway.process_update(p_bad, expected_round=1)

        rec1_a = engine1.evaluate_update(res_bad)
        rec1_b = engine1.evaluate_update(res_good)

        rec2_a = engine2.evaluate_update(res_bad)
        rec2_b = engine2.evaluate_update(res_good)

        self.assertEqual(rec1_b.trust_score, rec2_b.trust_score)
        self.assertEqual(len(rec1_b.score_history), len(rec2_b.score_history))
        for h1, h2 in zip(rec1_b.score_history, rec2_b.score_history):
            self.assertEqual(h1["delta"], h2["delta"])
            self.assertEqual(h1["score_after"], h2["score_after"])
            self.assertEqual(h1["reason"], h2["reason"])

    def test_coordinator_integration_and_audit(self):
        """Verify coordinator automatically updates trust through receive_update and aggregate_fedavg."""
        # 1. Valid update via coordinator.receive_update
        res = self.coordinator.receive_update(self.valid_payload)
        self.assertEqual(res.decision, GatewayDecision.ACCEPT)
        self.assertEqual(self.coordinator.get_client_trust("BANK-001"), 100.0)

        # 2. Aggregation summary includes client_trust_scores
        agg = self.coordinator.aggregate_fedavg([res])
        self.assertIn("client_trust_scores", agg)
        self.assertEqual(agg["client_trust_scores"]["BANK-001"], 100.0)

        # 3. All records access
        all_records = self.coordinator.get_all_trust_records()
        self.assertIn("BANK-001", all_records)
        self.assertEqual(all_records["BANK-001"].accepted_updates, 1)

    def test_idempotent_evaluation(self):
        """Verify evaluating the same GatewayResult multiple times does not duplicate penalties or rewards."""
        p_bad = dict(self.valid_payload, delta_bias=float("nan"))
        res_bad = self.gateway.process_update(p_bad, expected_round=1)

        rec_first = self.trust_engine.evaluate_update(res_bad)
        self.assertEqual(rec_first.trust_score, 85.0)

        # Evaluate again with same GatewayResult
        rec_second = self.trust_engine.evaluate_update(res_bad)
        self.assertEqual(rec_second.trust_score, 85.0)
        self.assertEqual(rec_second.rejected_updates, 1)


if __name__ == "__main__":
    unittest.main()
