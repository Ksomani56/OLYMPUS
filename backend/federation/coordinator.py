"""OLYMPUS Federation Subsystem — Federation Coordinator (Stage 1).

Implements the central aggregation server for OLYMPUS.
Validates structural integrity of client updates, performs sample-weighted FedAvg,
maintains the global model state across rounds, and evaluates on a held-out validation set.
"""

from typing import Dict, List, Tuple
import numpy as np
from sklearn.metrics import average_precision_score, accuracy_score


def _sigmoid(z: np.ndarray) -> np.ndarray:
    z_clipped = np.clip(z, -30.0, 30.0)
    return 1.0 / (1.0 + np.exp(-z_clipped))


def _binary_cross_entropy(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-12) -> float:
    p = np.clip(y_prob, eps, 1.0 - eps)
    return float(-np.mean(y_true * np.log(p) + (1.0 - y_true) * np.log(1.0 - p)))


class FederationCoordinator:
    """Federated learning coordinator executing rounds and FedAvg aggregation."""

    def __init__(self, num_features: int = 11, seed: int = 42):
        self.num_features = num_features
        rng = np.random.default_rng(seed)
        # Small random initialization
        self.global_weights = rng.normal(loc=0.0, scale=0.01, size=num_features)
        self.global_bias = 0.0
        self.current_round = 0
        self.round_history: List[Dict] = []

    def get_global_parameters(self) -> Tuple[np.ndarray, float]:
        """Return copies of current global model parameters."""
        return np.copy(self.global_weights), float(self.global_bias)

    def validate_update(self, update: Dict) -> bool:
        """Validate structural correctness of a client update payload."""
        if not isinstance(update, dict):
            return False
        required_keys = {"client_id", "sample_count", "delta_weights", "delta_bias"}
        if not required_keys.issubset(update.keys()):
            return False
        if not isinstance(update["sample_count"], (int, np.integer)) or update["sample_count"] <= 0:
            return False
        dw = update["delta_weights"]
        if not isinstance(dw, np.ndarray) or dw.shape != (self.num_features,):
            return False
        if np.isnan(dw).any() or np.isinf(dw).any():
            return False
        db = update["delta_bias"]
        if not isinstance(db, (float, int, np.floating)) or np.isnan(db) or np.isinf(db):
            return False
        return True

    def aggregate_fedavg(self, client_updates: List[Dict]) -> Dict:
        """Aggregate valid client updates using sample-weighted FedAvg."""
        if not client_updates:
            raise ValueError("No client updates provided for aggregation.")

        valid_updates = []
        for upd in client_updates:
            if self.validate_update(upd):
                valid_updates.append(upd)
            else:
                raise ValueError(f"Structural validation failed for update from client {upd.get('client_id')}")

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
