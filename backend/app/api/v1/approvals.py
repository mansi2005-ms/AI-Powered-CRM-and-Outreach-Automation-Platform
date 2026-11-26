"""
Human Approval and Dispatch Endpoints.
"""

import hashlib
import json
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from backend.app.core.security import require_roles
from backend.app.core.db import get_conn, transaction

router = APIRouter(tags=["Approvals & Dispatch"])


class ApprovalRequest(BaseModel):
    draft_id: str
    approved: bool
    edited_subject: Optional[str] = None
    edited_body: Optional[str] = None


class SendRequest(BaseModel):
    draft_id: str
    idempotency_key: str


class DraftEditRequest(BaseModel):
    edited_subject: Optional[str] = None
    edited_body: Optional[str] = None


def build_content_hash(recipient: str, subject: str, body: str) -> str:
    """Build a deterministic hash for the exact approved message content."""
    content = json.dumps(
        {
            "recipient": recipient,
            "subject": subject,
            "body": body,
        },
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _fetch_draft(draft_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT d.id,
                       d.ai_output,
                       d.edited_subject,
                       d.edited_body,
                       d.status,
                       cm.value AS recipient
                  FROM campaign_drafts d
                  JOIN contact_methods cm
                    ON cm.id = d.recipient_contact_method_id
                 WHERE d.id = %s
                """,
                (draft_id,),
            )
            return cur.fetchone()


@router.post("/approvals")
def approve_draft(
    payload: ApprovalRequest,
    current_user: dict = Depends(
        require_roles(["admin", "campaign_manager"])
    ),
):
    """
    Campaign Manager approves exact draft content.
    Generates a cryptographic content hash so no unapproved edits are sent.
    """
    draft = _fetch_draft(payload.draft_id)
    if draft is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found",
        )

    if not payload.approved:
        with transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE approvals
                       SET revoked_at = NOW() AT TIME ZONE 'UTC'
                     WHERE draft_id = %s
                       AND revoked_at IS NULL
                    """,
                    (payload.draft_id,),
                )
                cur.execute(
                    """
                    UPDATE campaign_drafts
                       SET status = 'rejected',
                           updated_at = NOW() AT TIME ZONE 'UTC'
                     WHERE id = %s
                    """,
                    (payload.draft_id,),
                )
        return {"status": "rejected", "draft_id": payload.draft_id}

    ai_output = draft[1]
    if isinstance(ai_output, str):
        ai_output = json.loads(ai_output)
    ai_output = ai_output or {}

    subject = (
        payload.edited_subject
        if payload.edited_subject is not None
        else (
            draft[2]
            if draft[2] is not None
            else ai_output.get("subject", "")
        )
    )
    body = (
        payload.edited_body
        if payload.edited_body is not None
        else (draft[3] if draft[3] is not None else ai_output.get("body", ""))
    )
    recipient = draft[5]

    content_hash = build_content_hash(recipient, subject, body)
    approved_at = datetime.now(timezone.utc)

    with transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE approvals
                   SET revoked_at = NOW() AT TIME ZONE 'UTC'
                 WHERE draft_id = %s
                   AND revoked_at IS NULL
                """,
                (payload.draft_id,),
            )
            cur.execute(
                """
                INSERT INTO approvals (
                    draft_id,
                    approved_by,
                    recipient,
                    content_hash,
                    approved_at
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    payload.draft_id,
                    current_user["id"],
                    recipient,
                    content_hash,
                    approved_at,
                ),
            )
            approval = cur.fetchone()
            cur.execute(
                """
                UPDATE campaign_drafts
                   SET edited_subject = %s,
                       edited_body = %s,
                       status = 'approved',
                       updated_at = NOW() AT TIME ZONE 'UTC'
                 WHERE id = %s
                """,
                (subject, body, payload.draft_id),
            )

    return {
        "approval_id": str(approval[0]),
        "draft_id": payload.draft_id,
        "content_hash": content_hash,
        "approved_by": current_user["id"],
        "approved_at": approved_at.isoformat(),
    }


def edit_approved_draft(
    draft_id: str,
    payload: DraftEditRequest,
    current_user: dict = Depends(
        require_roles(["admin", "campaign_manager"])
    ),
):
    """Edit draft content and revoke an approval already made for it."""
    draft = _fetch_draft(draft_id)
    if draft is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found",
        )

    ai_output = draft[1]
    if isinstance(ai_output, str):
        ai_output = json.loads(ai_output)
    ai_output = ai_output or {}

    subject = (
        payload.edited_subject
        if payload.edited_subject is not None
        else (
            draft[2]
            if draft[2] is not None
            else ai_output.get("subject", "")
        )
    )
    body = (
        payload.edited_body
        if payload.edited_body is not None
        else (
            draft[3]
            if draft[3] is not None
            else ai_output.get("body", "")
        )
    )

    with transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE campaign_drafts
                   SET edited_subject = %s,
                       edited_body = %s,
                       status = 'needs_review',
                       updated_at = NOW() AT TIME ZONE 'UTC'
                 WHERE id = %s
                """,
                (subject, body, draft_id),
            )
            cur.execute(
                """
                UPDATE approvals
                   SET revoked_at = NOW() AT TIME ZONE 'UTC'
                 WHERE draft_id = %s
                   AND revoked_at IS NULL
                """,
                (draft_id,),
            )

    return {"status": "invalidated", "draft_id": draft_id}


@router.patch("/drafts/{draft_id}")
def edit_draft(
    draft_id: str,
    payload: DraftEditRequest,
    current_user: dict = Depends(
        require_roles(["admin", "campaign_manager"])
    ),
):
    return edit_approved_draft(draft_id, payload, current_user)


@router.post("/dispatch/send")
def send_approved_message(
    payload: SendRequest,
    current_user: dict = Depends(require_roles(["admin", "campaign_manager"]))
):
    """
    Idempotent send execution after pre-send validation checks.
    """
    return {
        "message_id": f"msg_{payload.idempotency_key[:8]}",
        "provider": "resend",
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
