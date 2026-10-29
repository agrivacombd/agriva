-- Two-person, MFA-gated approval for commission payouts.
-- This migration is additive. Apply only after reviewing the matching application flow.
CREATE TABLE IF NOT EXISTS public.admin_action_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('commission_payout.approve')),
  target_id uuid NOT NULL,
  initiated_by uuid NOT NULL REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_reason text NOT NULL CHECK (char_length(btrim(request_reason)) BETWEEN 10 AND 1000),
  approval_reason text CHECK (approval_reason IS NULL OR char_length(btrim(approval_reason)) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT admin_action_approvals_distinct_actors
    CHECK (approved_by IS NULL OR approved_by <> initiated_by),
  CONSTRAINT admin_action_approvals_approval_state
    CHECK (
      (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
      OR status <> 'approved'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_action_approvals_one_pending_per_target
  ON public.admin_action_approvals (action_type, target_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS admin_action_approvals_initiated_by_created_at_idx
  ON public.admin_action_approvals (initiated_by, created_at DESC);

ALTER TABLE public.admin_action_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_action_approvals FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_commission_payout_approval(
  p_payout_id uuid,
  p_reason text
)
RETURNS public.admin_action_approvals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_payout public.commission_payouts;
  v_approval public.admin_action_approvals;
BEGIN
  IF v_uid IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'MFA step-up required' USING ERRCODE = '42501';
  END IF;
  IF p_payout_id IS NULL OR p_reason IS NULL
     OR char_length(btrim(p_reason)) < 10 OR char_length(btrim(p_reason)) > 1000 THEN
    RAISE EXCEPTION 'A reason between 10 and 1000 characters is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_payout
  FROM public.commission_payouts
  WHERE id = p_payout_id
  FOR UPDATE;
  IF NOT FOUND OR v_payout.status <> 'requested' THEN
    RAISE EXCEPTION 'Payout is not awaiting approval' USING ERRCODE = '55000';
  END IF;

  INSERT INTO public.admin_action_approvals
    (action_type, target_id, initiated_by, request_reason)
  VALUES ('commission_payout.approve', p_payout_id, v_uid, btrim(p_reason))
  RETURNING * INTO v_approval;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (v_uid, 'payout.approval_requested', 'commission_payout', p_payout_id,
    jsonb_build_object('approval_id', v_approval.id, 'reason', btrim(p_reason)));

  RETURN v_approval;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A pending approval already exists for this payout'
      USING ERRCODE = '23505';
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_commission_payout_approval(
  p_approval_id uuid,
  p_approval_reason text
)
RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_approval public.admin_action_approvals;
  v_payout public.commission_payouts;
BEGIN
  IF v_uid IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'MFA step-up required' USING ERRCODE = '42501';
  END IF;
  IF p_approval_id IS NULL OR p_approval_reason IS NULL
     OR char_length(btrim(p_approval_reason)) < 10
     OR char_length(btrim(p_approval_reason)) > 1000 THEN
    RAISE EXCEPTION 'An approval reason between 10 and 1000 characters is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_approval
  FROM public.admin_action_approvals
  WHERE id = p_approval_id
    AND action_type = 'commission_payout.approve'
  FOR UPDATE;
  IF NOT FOUND OR v_approval.status <> 'pending' THEN
    RAISE EXCEPTION 'Pending payout approval not found' USING ERRCODE = '55000';
  END IF;
  IF v_approval.initiated_by = v_uid THEN
    RAISE EXCEPTION 'A different administrator must approve this payout'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payout
  FROM public.commission_payouts
  WHERE id = v_approval.target_id
  FOR UPDATE;
  IF NOT FOUND OR v_payout.status <> 'requested' THEN
    RAISE EXCEPTION 'Payout is no longer awaiting approval' USING ERRCODE = '55000';
  END IF;

  UPDATE public.commission_payouts
  SET status = 'approved', approved_at = now(), approved_by = v_uid
  WHERE id = v_payout.id
  RETURNING * INTO v_payout;

  UPDATE public.admin_action_approvals
  SET status = 'approved',
      approved_by = v_uid,
      approval_reason = btrim(p_approval_reason),
      approved_at = now()
  WHERE id = v_approval.id;

  INSERT INTO public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  VALUES (v_uid, 'payout.approved_two_person', 'commission_payout', v_payout.id,
    jsonb_build_object(
      'approval_id', v_approval.id,
      'initiated_by', v_approval.initiated_by,
      'request_reason', v_approval.request_reason,
      'approval_reason', btrim(p_approval_reason)
    ));

  RETURN v_payout;
END;
$function$;

-- Close the legacy one-step approval path so it cannot bypass the new workflow.
CREATE OR REPLACE FUNCTION public.approve_commission_payout(p_payout_id uuid)
RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  RAISE EXCEPTION 'One-step payout approval is disabled; use the two-person approval workflow'
    USING ERRCODE = '42501';
END;
$function$;

REVOKE ALL ON FUNCTION public.request_commission_payout_approval(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_commission_payout_approval(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.approve_commission_payout_approval(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_commission_payout_approval(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.approve_commission_payout(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_commission_payout(uuid) TO authenticated, service_role;
