"""OLYMPUS Federation Subsystem — Federation Coordinator (Stage 1).

Implements the central aggregation server for OLYMPUS.
Validates structural integrity of client updates, performs sample-weighted FedAvg,
maintains the global model state across rounds, and evaluates on a held-out validation set.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from sklearn.metrics import average_precision_score, accuracy_score

from .gateway import SecurityGateway, GatewayDecision, GatewayResult
from .trust import TrustEngine, ClientTrustRecord, TrustStatus
from .anomaly import AnomalyDetectionEngine, AnomalyResult, DetectionStatus


def _sigmoid(z: np.ndarray) -> np.ndarray:
    z_clipped = np.clip(z, -30.0, 30.0)
    return 1.0 / (1.0 + np.exp(-z_clipped))


def _binary_cross_entropy(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-12) -> float:
    p = np.clip(y_prob, eps, 1.0 - eps)
    return float(-np.mean(y_true * np.log(p) + (1.0 - y_true) * np.log(1.0 - p)))


class FederationCoordinator:
    """Federated learning coordinator executing rounds, gateway inspection, trust evaluation, anomaly detection, and FedAvg aggregation."""

    def __init__(
        self,
        num_features: int = 11,
        seed: int = 42,
        gateway: Optional[SecurityGateway] = None,
        trust_engine: Optional[TrustEngine] = None,
        anomaly_engine: Optional[AnomalyDetectionEngine] = None,
    ):
        self.num_features = num_features
        self.gateway = gateway or SecurityGateway(num_features=num_features)
        self.trust_engine = trust_engine or TrustEngine(initial_trust=100.0)
        self.anomaly_engine = anomaly_engine or AnomalyDetectionEngine()
        rng = np.random.default_rng(seed)
        # Small random initialization
        self.global_weights = rng.normal(loc=0.0, scale=0.01, size=num_features)
        self.global_bias = 0.0
        self.current_round = 0
        self.round_history: List[Dict] = []

    def get_global_parameters(self) -> Tuple[np.ndarray, float]:
        """Return copies of current global model parameters."""
        return np.copy(self.global_weights), float(self.global_bias)

    def receive_update(self, payload: Dict[str, Any]) -> GatewayResult:
        """Route client update through the authoritative Security Gateway and Trust Engine."""
        expected_round = self.current_round + 1
        res = self.gateway.process_update(payload, expected_round=expected_round)
        self.trust_engine.evaluate_update(res)
        return res

    def get_client_trust(self, client_id: str) -> float:
        """Return current trust score for participant."""
        return self.trust_engine.get_trust_score(client_id)

    def get_all_trust_records(self) -> Dict[str, ClientTrustRecord]:
        """Return all participant trust records from the trust engine."""
        return self.trust_engine.get_all_records()

    def validate_update(self, update: Dict) -> bool:
        """Validate structural correctness via the Security Gateway."""
        if not isinstance(update, dict):
            return False
        probe = dict(update)
        probe.setdefault("round_id", self.current_round + 1)
        res = self.gateway.process_update(probe, expected_round=self.current_round + 1)
        return res.is_valid

    def evaluate_round_anomalies(self, accepted_updates: List[GatewayResult]) -> Dict[str, AnomalyResult]:
        """Evaluate cross-peer statistical and directional anomalies for accepted updates."""
        return self.anomaly_engine.evaluate_round(accepted_updates)

    def aggregate_fedavg(self, client_updates: List[Union[Dict[str, Any], GatewayResult]]) -> Dict:
        """Aggregate valid client updates using sample-weighted FedAvg.

        Guarantees that all updates are processed and vetted by the Security Gateway
        before being admitted into aggregation.
        """
        if not client_updates:
            raise ValueError("No client updates provided for aggregation.")

        expected_round = self.current_round + 1
        valid_updates = []
        accepted_gateway_results: List[GatewayResult] = []

        for item in client_updates:
            if isinstance(item, GatewayResult):
                self.trust_engine.evaluate_update(item)
                if item.decision != GatewayDecision.ACCEPT or not item.is_valid:
                    raise ValueError(
                        f"Security Gateway rejected update from client '{item.client_id}': {item.reason}"
                    )
                accepted_gateway_results.append(item)
                valid_updates.append({
                    "client_id": item.client_id,
                    "sample_count": item.sample_count,
                    "delta_weights": item.delta_weights,
                    "delta_bias": item.delta_bias,
                    "update_hash": item.update_hash,
                })
            elif isinstance(item, dict):
                # Mandatory pass through Security Gateway
                probe = dict(item)
                probe.setdefault("round_id", expected_round)
                res = self.gateway.process_update(probe, expected_round=expected_round)
                self.trust_engine.evaluate_update(res)
                if res.decision != GatewayDecision.ACCEPT or not res.is_valid:
                    raise ValueError(
                        f"Security Gateway rejected update from client '{item.get('client_id')}': {res.reason}"
                    )
                accepted_gateway_results.append(res)
                valid_updates.append({
                    "client_id": res.client_id,
                    "sample_count": res.sample_count,
                    "delta_weights": res.delta_weights,
                    "delta_bias": res.delta_bias,
                    "update_hash": res.update_hash,
                })
            else:
                raise ValueError(f"Unsupported update type: {type(item)}")

        # Cross-peer anomaly evaluation (Stage 5 detection layer: observation only)
        round_anomalies = self.anomaly_engine.evaluate_round(accepted_gateway_results)

        total_samples = sum(upd["sample_count"] for upd in valid_updates)
        if total_samples == 0:
            raise ValueError("Total sample count across valid updates is zero.")

        # Compute weighted average of parameter deltas
        aggregated_dw = np.zeros(self.num_features, dtype=np.float64)
        aggregated_db = 0.0

        for upd in valid_updates:
            weight_factor = upd["sample_count"] / total_samples
            aggregated_dw += weight_factor * upd["delta_weights"]
            aggregated_db += weight_factor * upd["delta_bias"]

        # Apply update to global model parameters
        self.global_weights += aggregated_dw
        self.global_bias += aggregated_db
        self.current_round += 1

        agg_summary = {
            "round": self.current_round,
            "participating_clients": [upd["client_id"] for upd in valid_updates],
            "client_hashes": {upd["client_id"]: upd["update_hash"] for upd in valid_updates},
            "client_trust_scores": {upd["client_id"]: self.trust_engine.get_trust_score(upd["client_id"]) for upd in valid_updates},
            "anomaly_results": {cid: a.to_dict() for cid, a in round_anomalies.items()},
            "total_samples": total_samples,
            "aggregated_dw_norm": float(np.linalg.norm(aggregated_dw)),
            "aggregated_db": float(aggregated_db),
            "global_weights_norm": float(np.linalg.norm(self.global_weights)),
            "global_bias": float(self.global_bias),
        }
        return agg_summary

    def evaluate(self, X_val: np.ndarray, y_val: np.ndarray) -> Dict:
        """Evaluate the current global model on a validation dataset."""
        linear = np.dot(X_val, self.global_weights) + self.global_bias
        probs = _sigmoid(linear)
        preds = (probs >= 0.5).astype(np.float64)

        loss = _binary_cross_entropy(y_val, probs)
        pr_auc = float(average_precision_score(y_val, probs))
        acc = float(accuracy_score(y_val, preds))

        eval_result = {
            "round": self.current_round,
            "val_loss": loss,
            "val_pr_auc": pr_auc,
            "val_accuracy": acc,
            "global_weights_norm": float(np.linalg.norm(self.global_weights)),
        }
        return eval_result
