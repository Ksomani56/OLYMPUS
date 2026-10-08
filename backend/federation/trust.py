"""OLYMPUS Federation Subsystem — Dynamic Trust Engine (Stage 4).

Maintains deterministic, explainable, and bounded trust scores for federation participants
based on observed behavior across training rounds.

Evaluates GatewayResult outputs emitted by the Security Gateway:
- Successful gateway submissions gradually reinforce participant trust (capped at 100.0).
- Gateway validation failures (NaN/Inf, shape mismatches, missing fields) impose deterministic penalties.
- Mismatched or stale round submissions incur specific timing penalties.
- Trust scores are strictly bounded between 0.0 and 100.0.

At Stage 4, trust serves as an intelligence, behavioral auditing, and telemetry layer.
It does NOT autonomously quarantine clients or modify FedAvg aggregation weights.
"""

from dataclasses import dataclass, field
from enum import Enum
import time
from typing import Any, Dict, List, Optional

from .gateway import GatewayDecision, GatewayResult


class TrustStatus(str, Enum):
    """Informational categorization of participant trust standing."""
    TRUSTED = "TRUSTED"       # Score >= 80.0
    NORMAL = "NORMAL"         # 50.0 <= Score < 80.0
    DEGRADED = "DEGRADED"     # Score < 50.0


@dataclass
class ClientTrustRecord:
    """Historical trust state and audit trail for a single federation participant."""
    client_id: str
    trust_score: float
    rounds_seen: int = 0
    accepted_updates: int = 0
    rejected_updates: int = 0
    consecutive_rejections: int = 0
    score_history: List[Dict[str, Any]] = field(default_factory=list)
    last_updated_timestamp: float = field(default_factory=time.time)
    status: TrustStatus = TrustStatus.TRUSTED

    def to_dict(self) -> Dict[str, Any]:
        """Convert trust record to structured dictionary representation."""
        return {
            "client_id": self.client_id,
            "trust_score": round(self.trust_score, 2),
            "rounds_seen": self.rounds_seen,
            "accepted_updates": self.accepted_updates,
            "rejected_updates": self.rejected_updates,
            "consecutive_rejections": self.consecutive_rejections,
            "status": self.status.value,
            "last_updated_timestamp": self.last_updated_timestamp,
            "history_count": len(self.score_history),
        }


class TrustEngine:
    """Central dynamic trust evaluation engine."""

    def __init__(
        self,
        initial_trust: float = 100.0,
        reward_step: float = 2.0,
        penalty_first: float = 15.0,
        penalty_consecutive: float = 25.0,
        penalty_round_mismatch: float = 10.0,
    ):
        self.initial_trust = float(np_clip_bound(initial_trust))
        self.reward_step = float(reward_step)
        self.penalty_first = float(penalty_first)
        self.penalty_consecutive = float(penalty_consecutive)
        self.penalty_round_mismatch = float(penalty_round_mismatch)
        self._records: Dict[str, ClientTrustRecord] = {}
        self._evaluated_event_ids: set = set()

    def _resolve_status(self, score: float) -> TrustStatus:
        """Resolve informational trust status from numeric score."""
        if score >= 80.0:
            return TrustStatus.TRUSTED
        elif score >= 50.0:
            return TrustStatus.NORMAL
        else:
            return TrustStatus.DEGRADED

    def get_or_register_client(self, client_id: str, timestamp: Optional[float] = None) -> ClientTrustRecord:
        """Retrieve existing client trust record or register new participant at initial trust."""
        if client_id not in self._records:
            now = timestamp if timestamp is not None else time.time()
            record = ClientTrustRecord(
                client_id=client_id,
                trust_score=self.initial_trust,
                rounds_seen=0,
                accepted_updates=0,
                rejected_updates=0,
                consecutive_rejections=0,
                score_history=[{
                    "round_id": 0,
                    "delta": 0.0,
                    "score_after": self.initial_trust,
                    "reason": "Initial participant registration",
                    "timestamp": now,
                }],
                last_updated_timestamp=now,
                status=self._resolve_status(self.initial_trust),
            )
            self._records[client_id] = record
        return self._records[client_id]

    def evaluate_update(self, gateway_result: GatewayResult) -> ClientTrustRecord:
        """Evaluate a gateway result and apply deterministic trust adjustments.

        Args:
            gateway_result: Authoritative GatewayResult emitted by SecurityGateway.

        Returns:
            Updated ClientTrustRecord for the client.
        """
        # Idempotence: avoid double-scoring the exact same gateway event
        if gateway_result.event_id and gateway_result.event_id in self._evaluated_event_ids:
            return self.get_or_register_client(gateway_result.client_id)
        if gateway_result.event_id:
            self._evaluated_event_ids.add(gateway_result.event_id)

        client_id = gateway_result.client_id
        record = self.get_or_register_client(client_id, timestamp=gateway_result.timestamp)

        record.rounds_seen += 1
        record.last_updated_timestamp = gateway_result.timestamp
        current_score = record.trust_score

        if gateway_result.decision == GatewayDecision.ACCEPT and gateway_result.is_valid:
            # Positive behavioral reinforcement
            record.accepted_updates += 1
            record.consecutive_rejections = 0
            delta = self.reward_step
            reason = "Valid gateway update accepted"
        else:
            # Gateway rejection penalty
            record.rejected_updates += 1
            record.consecutive_rejections += 1

            if "round mismatch" in gateway_result.reason.lower():
                delta = -self.penalty_round_mismatch
                reason = f"Stale/mismatched round submission: {gateway_result.reason}"
            elif record.consecutive_rejections > 1:
                delta = -self.penalty_consecutive
                reason = f"Repeated validation failure ({record.consecutive_rejections}x): {gateway_result.reason}"
            else:
                delta = -self.penalty_first
                reason = f"Validation failure: {gateway_result.reason}"

        new_score = np_clip_bound(current_score + delta)
        record.trust_score = float(new_score)
        record.status = self._resolve_status(record.trust_score)

        record.score_history.append({
            "round_id": gateway_result.round_id,
            "delta": delta,
            "score_after": record.trust_score,
            "reason": reason,
            "update_hash": gateway_result.update_hash,
            "timestamp": gateway_result.timestamp,
        })

        return record

    def get_trust_score(self, client_id: str) -> float:
        """Return the current trust score for a client (or initial_trust if unobserved)."""
        if client_id in self._records:
            return self._records[client_id].trust_score
        return self.initial_trust

    def get_client_record(self, client_id: str) -> Optional[ClientTrustRecord]:
        """Return full audit record for a participant, if registered."""
        return self._records.get(client_id)

    def get_all_records(self) -> Dict[str, ClientTrustRecord]:
        """Return shallow copy of all registered client trust records."""
        return dict(self._records)


def np_clip_bound(score: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Helper to strictly clamp trust scores between 0.0 and 100.0."""
    return max(min_val, min(max_val, float(score)))
