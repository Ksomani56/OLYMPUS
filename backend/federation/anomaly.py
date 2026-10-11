"""OLYMPUS Federation Subsystem — Anomaly & Update Telemetry Detection Engine (Stage 5).

Evaluates accepted client model updates against active federation peers within each round.
Detects statistical magnitude outliers and directional divergence without concluding malicious intent.

Stage 5 is an OBSERVATION and DETECTION layer only:
- Distinguishes ANOMALOUS from MALICIOUS.
- Computes L2 norm ratios against peer medians.
- Computes leave-one-out consensus cosine similarity.
- Produces normalized, explainable anomaly scores [0.0, 1.0].
- Handles small-consortium constraints gracefully (INSUFFICIENT_PEERS when N < min_peers).
- Does NOT perform automated responses (no update drops, no quarantining, no trust reduction).
"""

from dataclasses import dataclass, field
from enum import Enum
import time
from typing import Any, Dict, List, Optional
import numpy as np

from .gateway import GatewayResult


class DetectionStatus(str, Enum):
    """Statistical classification of an evaluated model update."""
    NORMAL = "NORMAL"
    ANOMALOUS = "ANOMALOUS"
    INSUFFICIENT_PEERS = "INSUFFICIENT_PEERS"


@dataclass
class AnomalyResult:
    """Structured detection outcome and diagnostic telemetry for an update."""
    client_id: str
    round_id: int
    update_hash: str
    status: DetectionStatus
    anomaly_score: float
    l2_norm: float
    peer_median_norm: float
    norm_ratio: float
    consensus_cosine_similarity: float
    peer_count: int = 0
    signals: Dict[str, bool] = field(default_factory=dict)
    reasons: List[str] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)

    @property
    def is_anomalous(self) -> bool:
        """Convenience property indicating whether status is ANOMALOUS."""
        return self.status == DetectionStatus.ANOMALOUS

    @property
    def cosine_similarity(self) -> float:
        """Alias for consensus_cosine_similarity."""
        return self.consensus_cosine_similarity

    def to_dict(self) -> Dict[str, Any]:
        """Convert anomaly result to dictionary representation."""
        return {
            "client_id": self.client_id,
            "round_id": self.round_id,
            "update_hash": self.update_hash,
            "status": self.status.value,
            "is_anomalous": self.is_anomalous,
            "anomaly_score": round(self.anomaly_score, 4),
            "l2_norm": round(self.l2_norm, 4),
            "peer_median_norm": round(self.peer_median_norm, 4),
            "norm_ratio": round(self.norm_ratio, 4),
            "consensus_cosine_similarity": round(self.consensus_cosine_similarity, 4),
            "cosine_similarity": round(self.consensus_cosine_similarity, 4),
            "peer_count": self.peer_count,
            "signals": self.signals,
            "reasons": self.reasons,
            "timestamp": self.timestamp,
        }


def compute_safe_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray, eps: float = 1e-12) -> float:
    """Compute cosine similarity safely, returning 0.0 for zero-magnitude vectors without NaN/Inf."""
    norm_a = float(np.linalg.norm(vec_a))
    norm_b = float(np.linalg.norm(vec_b))
    if norm_a < eps or norm_b < eps:
        return 0.0
    dot_prod = float(np.dot(vec_a, vec_b))
    cos_sim = dot_prod / (norm_a * norm_b)
    # Clip to valid numeric cosine range [-1.0, 1.0] to prevent floating point drift
    return max(-1.0, min(1.0, float(cos_sim)))


class AnomalyDetectionEngine:
    """Cross-peer statistical and directional anomaly detection engine."""

    def __init__(
        self,
        norm_ratio_threshold: float = 3.0,
        cosine_threshold: float = 0.1,
        anomaly_score_threshold: float = 0.50,
        min_peers: int = 3,
        cosine_similarity_threshold: Optional[float] = None,
        norm_ratio_low: Optional[float] = None,
        norm_ratio_high: Optional[float] = None,
    ):
        if cosine_similarity_threshold is not None:
            cosine_threshold = cosine_similarity_threshold
        if norm_ratio_high is not None:
            norm_ratio_threshold = norm_ratio_high

        self.norm_ratio_threshold = float(norm_ratio_threshold)
        self.norm_ratio_low = float(norm_ratio_low) if norm_ratio_low is not None else 0.1
        self.cosine_threshold = float(cosine_threshold)
        self.anomaly_score_threshold = float(anomaly_score_threshold)
        self.min_peers = int(min_peers)

    def evaluate_round(self, accepted_updates: List[GatewayResult]) -> Dict[str, AnomalyResult]:
        """Evaluate a batch of accepted updates for a specific federation round.

        Args:
            accepted_updates: List of valid GatewayResult objects for the round.

        Returns:
            Dict mapping client_id -> AnomalyResult.
        """
        now = time.time()
        results: Dict[str, AnomalyResult] = {}

        # Filter only accepted updates with valid parameter tensors
        valid_items = [
            upd for upd in accepted_updates
            if upd.is_valid and upd.delta_weights is not None
        ]
        n_clients = len(valid_items)

        # 1. Check small-federation constraint
        if n_clients < self.min_peers:
            for upd in valid_items:
                norm_val = float(np.linalg.norm(upd.delta_weights))
                results[upd.client_id] = AnomalyResult(
                    client_id=upd.client_id,
                    round_id=upd.round_id,
                    update_hash=upd.update_hash,
                    status=DetectionStatus.INSUFFICIENT_PEERS,
                    anomaly_score=0.0,
                    l2_norm=norm_val,
                    peer_median_norm=norm_val,
                    norm_ratio=1.0,
                    consensus_cosine_similarity=1.0,
                    peer_count=max(0, n_clients - 1),
                    signals={"insufficient_peers": True},
                    reasons=[
                        f"Insufficient peers for cross-client analysis (count {n_clients} < {self.min_peers})",
                        "insufficient_peers",
                    ],
                    timestamp=now,
                )
            return results

        # 2. Extract norms and vectors
        norms = [float(np.linalg.norm(upd.delta_weights)) for upd in valid_items]
        client_vectors = [np.ascontiguousarray(upd.delta_weights, dtype=np.float64) for upd in valid_items]

        # 3. Evaluate each client against leave-one-out peer consensus
        for idx, upd in enumerate(valid_items):
            cid = upd.client_id
            curr_vec = client_vectors[idx]
            curr_norm = norms[idx]

            # Construct leave-one-out peer statistics (excluding client itself)
            peer_norms = [norms[j] for j in range(n_clients) if j != idx]
            peer_vectors = [client_vectors[j] for j in range(n_clients) if j != idx]

            peer_median_norm = float(np.median(peer_norms))
            norm_ratio = curr_norm / (peer_median_norm + 1e-12)

            # Leave-one-out consensus vector: mean of other peers
            consensus_vec = np.mean(peer_vectors, axis=0)
            cos_sim = compute_safe_cosine_similarity(curr_vec, consensus_vec)

            # 4. Compute individual anomaly signals
            magnitude_outlier = (norm_ratio > self.norm_ratio_threshold) or (norm_ratio < self.norm_ratio_low)
            directional_divergence = cos_sim < self.cosine_threshold

            signals = {
                "magnitude_outlier": magnitude_outlier,
                "directional_divergence": directional_divergence,
            }

            reasons: List[str] = []
            if norm_ratio > self.norm_ratio_threshold:
                reasons.append(f"high_norm_ratio: L2 norm ratio ({norm_ratio:.2f}x) exceeds threshold ({self.norm_ratio_threshold:.2f}x)")
            elif norm_ratio < self.norm_ratio_low:
                reasons.append(f"low_norm_ratio: L2 norm ratio ({norm_ratio:.2f}x) is below lower threshold ({self.norm_ratio_low:.2f}x)")

            if directional_divergence:
                reasons.append(f"low_cosine_similarity: Consensus cosine similarity ({cos_sim:.3f}) is below threshold ({self.cosine_threshold:.2f})")

            # 5. Continuous Normalized Anomaly Score [0.0, 1.0]
            # Directional component: maps [-1.0, 1.0] -> [1.0, 0.0]
            s_direction = max(0.0, min(1.0, (1.0 - cos_sim) / 2.0))
            # Magnitude component: bounded scaling of absolute ratio deviation
            s_magnitude = max(0.0, min(1.0, abs(norm_ratio - 1.0) / 4.0))

            combined_anomaly_score = float(0.6 * s_direction + 0.4 * s_magnitude)

            # Determine final status (strictly statistical, no malicious labeling)
            is_anomalous = (
                combined_anomaly_score >= self.anomaly_score_threshold or
                magnitude_outlier or
                directional_divergence
            )

            status = DetectionStatus.ANOMALOUS if is_anomalous else DetectionStatus.NORMAL

            results[cid] = AnomalyResult(
                client_id=cid,
                round_id=upd.round_id,
                update_hash=upd.update_hash,
                status=status,
                anomaly_score=combined_anomaly_score,
                l2_norm=curr_norm,
                peer_median_norm=peer_median_norm,
                norm_ratio=norm_ratio,
                consensus_cosine_similarity=cos_sim,
                peer_count=n_clients - 1,
                signals=signals,
                reasons=reasons,
                timestamp=now,
            )

        return results
