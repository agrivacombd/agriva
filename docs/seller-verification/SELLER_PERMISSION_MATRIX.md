# Seller Permission Matrix

## 1. Authorization principles

1. Authentication identifies the account; it does not grant seller access.
2. Identity verification and market/business approval are separate decisions.
3. Marketplace and Plant Market approvals are independent.
4. Grants are issued only through trusted database/server review workflows.
5. Product APIs and RLS independently enforce module and scope.
6. Admin reviewer capabilities are separate from seller capabilities.
7. A revoked or expired grant must deny access even if the UI still displays an old badge.

## 2. Seller access matrix

| Actor / state | Identity | Marketplace | Plant Market |
|---|---|---|---|
| Anonymous | No application | No create access | No create access |
| Authenticated, no application | May start identity/application workflow | No create access | No create access |
| Pending application | Evidence under review | No create access | No create access |
| Rejected application | May correct/resubmit under policy | No create access | No create access |
| Approved Marketplace | Shared identity evidence retained | Organization-scoped read/create/update grants as issued | Unchanged |
| Approved Plant Market | Shared identity evidence retained | Unchanged | Global read/create/update grants as issued |
| Approved in both | Shared identity evidence retained | Organization-scoped | Global |
| Suspended/revoked | Historical review retained | Denied for affected market/scope | Denied for affected market |
| Expired grant | Historical review retained | Denied | Denied |

## 3. Existing scope semantics

| Module | Domain record | Scope | Current server enforcement |
|---|---|---|---|
| Marketplace | `organizations` | `organization` + organization UUID | `findMarketplaceOrganizationWithAccess()`, Marketplace product API, RLS |
| Plant Market | `gardener_profiles` | `global` | `checkModuleAccess()`, Plant Market product API, RLS |

Current `admin_review_module_application` issues `read` and `create` grants. The identity status synchronization trigger also maintains the `update` grant and Plant Market `gardener_profiles` state. Preserve this behavior and test it as one transaction; do not add a second grant-writing code path.

## 4. Admin capability matrix

| Capability | Read application | View identity evidence | Review / decide | Revoke seller access | Configure requirements |
|---|---:|---:|---:|---:|---:|
| Applicant | Own status only | Own evidence only | No | No | No |
| Identity reviewer | Assigned / permitted queue | Only when authorized | Identity decision within scope | No by default | No |
| Marketplace reviewer | Marketplace queue | Only when authorized | Marketplace application | No by default | No |
| Plant Market reviewer | Plant Market queue | Only when authorized | Plant Market application | No by default | No |
| Seller-access manager | Permission summary | No by default | No | Scoped, reason required | No |
| Verification administrator | All permitted queues | Break-glass / audited | According to delegated role | According to delegated role | Yes |
| Super Admin | Explicitly authorized | Audited access | Explicitly authorized | Explicitly authorized | Yes |

Map these logical capabilities to the existing AGRIVA Admin RBAC/capability system after auditing the actual seeded roles and grants. Do not invent capability strings or fall back to broad `catalog.moderate` authorization for sensitive identity review.

## 5. Required enforcement checks

- Every applicant API derives user ID from `supabase.auth.getUser()`.
- Every Admin action calls the existing server-side authorization helper.
- The review RPC verifies Admin identity from the database session, locks the application row and accepts only valid decisions.
- No client insert/update/delete on `user_module_grants` or append-only application events.
- Marketplace API must resolve an organization owned by the caller and check an active organization-scoped grant.
- Plant Market API must check verified gardener profile and active global grant.
- Product table restrictive RLS policies remain in place so legacy permissive policies cannot bypass approval.
- Seller access revocation must be market- and scope-specific, reasoned, audited and idempotent.
- JWT user-editable metadata must never be used as an authorization source.

## 6. State transition authority

| Transition | Allowed authority |
|---|---|
| Create application | Authenticated applicant; API validates and forces pending |
| Edit draft / resubmit rejected | Applicant-owned API, only allowed states |
| Submit | Applicant-owned API; server validates evidence and terms |
| Approve / reject | Authorized reviewer via existing transactional RPC |
| Request more information | Only after a distinct server-supported transition is designed |
| Withdraw | Applicant-owned server action, only eligible states |
| Suspend / revoke grant | Authorized seller-access manager via audited server action/RPC |
| Reinstate | Authorized reviewer/manager with reason and fresh checks |

Never grant access from a client-side status value, profile role, URL query, local storage or untrusted user metadata.
