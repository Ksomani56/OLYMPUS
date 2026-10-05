"""OLYMPUS Federation Subsystem — Security Gateway (Stage 3).

Establishes the authoritative cybersecurity control boundary between federation
clients and the central coordinator.

Every client model update must be processed by the Security Gateway before reaching
the coordinator/aggregator. The gateway is responsible for:
1. Strict structural and numerical validation (dimensions, NaN/Inf checks).
2. Round freshness verification.
3. Cryptographic integrity fingerprinting via SHA-256.
4. Delta telemetry calculation (L2 norm, parameter count).
5. Structured security event logging (ACCEPT / REJECT).
"""

from dataclasses import dataclass, field
from enum import Enum
import hashlib
import struct
import time
import uuid
from typing import Any, Dict, List, Optional
import numpy as np


class GatewayDecision(str, Enum):
    """Authoritative gateway decision on an incoming model update."""
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"


@dataclass
class GatewayResult:
    """Normalized internal representation and evaluation result of an update."""
    decision: GatewayDecision
    client_id: str
    round_id: int
    is_valid: bool
    reason: str
    update_hash: str
    timestamp: float
    sample_count: int = 0
    delta_weights: Optional[np.ndarray] = None
    delta_bias: float = 0.0
    telemetry: Dict[str, Any] = field(default_factory=dict)
    event_id: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to a structured dictionary."""
        return {
            "decision": self.decision.value,
            "client_id": self.client_id,
            "round_id": self.round_id,
            "is_valid": self.is_valid,
            "reason": self.reason,
            "update_hash": self.update_hash,
            "timestamp": self.timestamp,
            "sample_count": self.sample_count,
            "telemetry": self.telemetry,
            "event_id": self.event_id,
        }


class SecurityGateway:
    """Centralized cybersecurity control point for federation ingress."""

    def __init__(self, num_features: int = 11):
        self.num_features = num_features
        self._security_events: List[Dict[str, Any]] = []

    @property
    def security_events(self) -> List[Dict[str, Any]]:
        """Return audit trail of gateway security events."""
        return list(self._security_events)

    def compute_update_hash(
        self,
        client_id: str,
        round_id: int,
        sample_count: int,
        delta_weights: np.ndarray,
        delta_bias: float,
    ) -> str:
        """Compute a deterministic SHA-256 fingerprint for a model update payload."""
        hasher = hashlib.sha256()
        hasher.update(str(client_id).encode("utf-8"))
        hasher.update(struct.pack(">q", int(round_id)))
        hasher.update(struct.pack(">q", int(sample_count)))
        
        # Ensure contiguous 64-bit float representation for deterministic hashing
        weights_bytes = np.ascontiguousarray(delta_weights, dtype=np.float64).tobytes()
        hasher.update(weights_bytes)
        hasher.update(struct.pack(">d", float(delta_bias)))
        
        return hasher.hexdigest()

    def _compute_fallback_hash(self, payload: Any) -> str:
        """Fallback SHA-256 hash for malformed payloads that cannot be unpacked."""
        hasher = hashlib.sha256()
        hasher.update(repr(payload).encode("utf-8", errors="replace"))
        return hasher.hexdigest()

    def process_update(self, payload: Dict[str, Any], expected_round: int) -> GatewayResult:
        """Inspect, validate, hash, and extract telemetry for an incoming update.

        Args:
            payload: Raw dictionary submitted by a federation client.
            expected_round: Current active federation round ID on the coordinator.

        Returns:
            GatewayResult containing ACCEPT/REJECT decision, telemetry, and payload.
        """
        now = time.time()
        event_id = f"SEC-{uuid.uuid4().hex[:8].upper()}"

        # 1. Structural Sanity: Payload must be a dictionary
        if not isinstance(payload, dict):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id="UNKNOWN",
                round_id=expected_round,
                reason="Payload must be a dictionary",
                update_hash=fallback_hash,
                timestamp=now,
            )

        client_id = payload.get("client_id")
        if not isinstance(client_id, str) or not client_id.strip():
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=str(client_id) if client_id else "UNKNOWN",
                round_id=expected_round,
                reason="Missing or invalid client_id; must be non-empty string",
                update_hash=fallback_hash,
                timestamp=now,
            )
        client_id = client_id.strip()

        # 2. Round Freshness Validation
        # If client did not explicitly provide round_id, evaluate as missing
        if "round_id" not in payload:
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=-1,
                reason="Missing required field: round_id",
                update_hash=fallback_hash,
                timestamp=now,
            )

        round_id = payload.get("round_id")
        if not isinstance(round_id, (int, np.integer)):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=-1,
                reason="Invalid round_id type; must be integer",
                update_hash=fallback_hash,
                timestamp=now,
            )

        if int(round_id) != int(expected_round):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason=f"Round mismatch: update round {round_id} does not match expected round {expected_round}",
                update_hash=fallback_hash,
                timestamp=now,
            )

        # 3. Sample Count Validation
        sample_count = payload.get("sample_count")
        if not isinstance(sample_count, (int, np.integer)) or isinstance(sample_count, bool) or sample_count <= 0:
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="sample_count must be a positive integer > 0",
                update_hash=fallback_hash,
                timestamp=now,
            )
        sample_count = int(sample_count)

        # 4. Parameter Deltas Presence & Tensor Structure
        if "delta_weights" not in payload:
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="Missing required field: delta_weights",
                update_hash=fallback_hash,
                timestamp=now,
            )

        dw = payload.get("delta_weights")
        if not isinstance(dw, np.ndarray):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_weights must be a numpy ndarray",
                update_hash=fallback_hash,
                timestamp=now,
            )

        if dw.shape != (self.num_features,):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason=f"delta_weights dimension mismatch: expected ({self.num_features},), got {dw.shape}",
                update_hash=fallback_hash,
                timestamp=now,
            )

        if not np.issubdtype(dw.dtype, np.number):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_weights elements must be numeric",
                update_hash=fallback_hash,
                timestamp=now,
            )

        # 5. Numerical Integrity Checks (NaN / Inf)
        if np.isnan(dw).any():
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_weights contains NaN values",
                update_hash=fallback_hash,
                timestamp=now,
            )

        if np.isinf(dw).any():
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_weights contains infinite values",
                update_hash=fallback_hash,
                timestamp=now,
            )

        # 6. Bias Delta Validation
        if "delta_bias" not in payload:
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="Missing required field: delta_bias",
                update_hash=fallback_hash,
                timestamp=now,
            )

        db = payload.get("delta_bias")
        if not isinstance(db, (int, float, np.floating, np.integer)) or isinstance(db, bool):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_bias must be a numeric scalar",
                update_hash=fallback_hash,
                timestamp=now,
            )

        db = float(db)
        if np.isnan(db) or np.isinf(db):
            fallback_hash = self._compute_fallback_hash(payload)
            return self._record_rejection(
                event_id=event_id,
                client_id=client_id,
                round_id=int(round_id),
                reason="delta_bias cannot be NaN or infinite",
                update_hash=fallback_hash,
                timestamp=now,
            )

        # 7. Compute Deterministic SHA-256 Hash
        update_hash = self.compute_update_hash(
            client_id=client_id,
            round_id=int(round_id),
            sample_count=sample_count,
            delta_weights=dw,
            delta_bias=db,
        )

        # 8. Compute Delta Telemetry (Measurement Only)
        l2_norm = float(np.linalg.norm(dw))
        telemetry = {
            "l2_norm": l2_norm,
            "dimension": int(self.num_features),
            "bias_magnitude": abs(db),
            "is_finite": True,
        }

        # 9. Record Accepted Security Event
        event = {
            "event_id": event_id,
            "timestamp": now,
            "client_id": client_id,
            "round_id": int(round_id),
            "event_type": "GATEWAY_UPDATE_INGRESS",
            "decision": GatewayDecision.ACCEPT.value,
            "reason": "All structural and numerical checks passed",
            "update_hash": update_hash,
            "telemetry": telemetry,
        }
        self._security_events.append(event)

        # 10. Return Validated Representation
        return GatewayResult(
            decision=GatewayDecision.ACCEPT,
            client_id=client_id,
            round_id=int(round_id),
            is_valid=True,
            reason="Update accepted by Security Gateway",
            update_hash=update_hash,
            timestamp=now,
            sample_count=sample_count,
            delta_weights=dw,
            delta_bias=db,
            telemetry=telemetry,
            event_id=event_id,
        )

    def _record_rejection(
        self,
        event_id: str,
        client_id: str,
        round_id: int,
        reason: str,
        update_hash: str,
        timestamp: float,
    ) -> GatewayResult:
        """Record a structured security rejection event and return the GatewayResult."""
        event = {
            "event_id": event_id,
            "timestamp": timestamp,
            "client_id": client_id,
            "round_id": round_id,
            "event_type": "GATEWAY_VALIDATION_FAILURE",
            "decision": GatewayDecision.REJECT.value,
            "reason": reason,
            "update_hash": update_hash,
        }
        self._security_events.append(event)

        return GatewayResult(
            decision=GatewayDecision.REJECT,
            client_id=client_id,
            round_id=round_id,
            is_valid=False,
            reason=reason,
            update_hash=update_hash,
            timestamp=timestamp,
            sample_count=0,
            delta_weights=None,
            delta_bias=0.0,
            telemetry={},
            event_id=event_id,
        )
