"""OLYMPUS Federation Subsystem — Federation Client (Stage 1).

Implements an isolated federation client representing a participating bank.
Performs local SGD training on private tabular transactions without exposing raw data.
Returns parameter deltas (weight update vectors and bias updates).
"""

from typing import Dict, Tuple
import numpy as np
from sklearn.metrics import average_precision_score


def _sigmoid(z: np.ndarray) -> np.ndarray:
    """Numerically stable sigmoid function."""
    z_clipped = np.clip(z, -30.0, 30.0)
    return 1.0 / (1.0 + np.exp(-z_clipped))


def _binary_cross_entropy(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-12) -> float:
    """Compute binary cross-entropy loss."""
    p = np.clip(y_prob, eps, 1.0 - eps)
    return float(-np.mean(y_true * np.log(p) + (1.0 - y_true) * np.log(1.0 - p)))


class FederationClient:
    """Simulated banking participant in federated learning."""

    def __init__(self, client_id: str, X: np.ndarray, y: np.ndarray):
        self.client_id = client_id
        self.X = np.ascontiguousarray(X, dtype=np.float64)
        self.y = np.ascontiguousarray(y, dtype=np.float64)
        self.num_samples = len(self.y)
        self.num_features = self.X.shape[1]

    def local_train(
        self,
        global_weights: np.ndarray,
        global_bias: float,
        epochs: int = 5,
        lr: float = 0.05,
        batch_size: int = 64,
        seed: int = 42,
    ) -> Dict:
        """Perform local training using mini-batch SGD initialized from global parameters.

        Returns:
            Dict containing client_id, sample_count, delta_weights, delta_bias,
            local_loss, local_pr_auc, and gradient norm.
        """
        w = np.copy(global_weights)
        b = float(global_bias)

        rng = np.random.default_rng(seed)
        indices = np.arange(self.num_samples)

        for _ in range(epochs):
            rng.shuffle(indices)
            for start_idx in range(0, self.num_samples, batch_size):
                batch_idx = indices[start_idx : start_idx + batch_size]
                X_batch = self.X[batch_idx]
                y_batch = self.y[batch_idx]

                # Forward pass
                linear = np.dot(X_batch, w) + b
                probs = _sigmoid(linear)

                # Gradient computation for BCE
                # grad_z = probs - y_batch
                # grad_w = (X^T * grad_z) / batch_len
                # grad_b = mean(grad_z)
                batch_len = len(y_batch)
                error = probs - y_batch
                grad_w = np.dot(X_batch.T, error) / batch_len
                grad_b = float(np.mean(error))

                # Weight update
                w -= lr * grad_w
                b -= lr * grad_b

        # Compute parameter deltas relative to the received global model
        delta_w = w - global_weights
        delta_b = b - global_bias

        # Local evaluation on client's own data
        final_probs = _sigmoid(np.dot(self.X, w) + b)
        local_loss = _binary_cross_entropy(self.y, final_probs)
        # Avoid error if all labels in a tiny partition are 0
        if np.sum(self.y) > 0:
            local_pr_auc = float(average_precision_score(self.y, final_probs))
        else:
            local_pr_auc = 0.0

        return {
            "client_id": self.client_id,
            "sample_count": self.num_samples,
            "delta_weights": delta_w,
            "delta_bias": delta_b,
            "local_loss": local_loss,
            "local_pr_auc": local_pr_auc,
            "delta_norm": float(np.linalg.norm(delta_w)),
        }
