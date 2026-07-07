# Mini Order Loop

## Applicant

Mark Allen Jugalbot

## Stack

Backend
- PHP 8.2
- Laravel 12

Frontend
- React 18
- Vite

Database
- PostgreSQL

Authentication
- Laravel Sanctum

## Initial Plan

1. Bootstrap backend
2. Bootstrap frontend
3. Create database schema
4. Implement authentication
5. Draft order CRUD
6. Workflow/state transitions
7. React UI
8. CSV export
9. Feature tests

## Assumptions

Decisions on details the brief leaves open, recorded as they are made.

**Part 1 — Data**

- **Order number**: derived from the primary key after insert
  (`ORD-` + id zero-padded to 5). Race-safe with no extra locking; gaps can
  occur if a create ever rolls back, which is acceptable here.
- **Duplicate item lines**: one line per item per order, enforced by a
  unique constraint on `(order_id, item_id)`. The API will return 422 and
  point the user to editing the existing line's quantity instead.
- **Money**: `decimal(10,2)` columns (PostgreSQL `numeric`), not integer
  cents — exact arithmetic with simpler, more readable code.
- **Status & role storage**: plain string columns backed by PHP enums
  (`OrderStatus`, `UserRole`) instead of DB enum types, which are painful
  to alter in Postgres.
- **Activity log covers creation too**: order creation writes a row with
  `from_status = null`, `to_status = draft`, so the detail page tells the
  full story from the start. The log table is append-only (`created_at`
  only, no updates).
- **`users.role`** was added directly to Laravel's default create-users
  migration rather than a separate alter migration — the schema has never
  been deployed anywhere, so a clean single migration is clearer.
- **`line_total`** is stored (per the brief) but always derived: the
  `OrderLine` model recomputes `qty × unit_price` on every save so it can
  never drift.

**Part 2 — API core**

- **Auth**: Sanctum personal access tokens (bearer), not SPA cookie/session
  auth — simplest fit for a fully separate Vite SPA hitting a JSON API.
- **Order visibility**: a requester sees only their own orders; an approver
  sees all orders (they need submitted ones to act on, and the whole
  pipeline is their business). Editing stays owner-only regardless.
- **Routes**: RESTful `apiResource` for order CRUD plus one POST
  `/orders/{id}/{action}` per transition. Errors are always
  `{ "message": ... }` JSON with 401/403/404/422.
- **Line updates replace the whole array**: a PUT with a `lines` key
  deletes the draft's lines and recreates them from the payload, with a
  fresh price snapshot — acceptable because the order is still `draft`;
  prices only need to freeze from submission onward.
- **Draft deletion is allowed** (owner only, `draft` only) — a requester
  should be able to discard an order they never submitted. Cancelled is
  for orders that entered the pipeline.
- **No pagination**: two users and a demo-sized dataset; filters + search
  cover the list's needs. Easy to add later without breaking the contract.
- **Client-sent prices are ignored**: line payloads carry only `item_id`
  and `qty`; `unit_price` always comes from the catalog server-side.

**Part 3 — The loop**

- **Transitions are one nested resource** — `POST /orders/{order}/transitions`
  with `{ "action": ... }` — instead of one route per action; the action name
  is validated against the 7 allowed transitions.
- **Reject reason field is `reason`; cancel note field is `note`** — both
  stored in the activity log's `note` column.
- **Fulfill locks item rows** (`SELECT ... FOR UPDATE`) while re-checking
  and deducting stock, so two concurrent fulfills can't oversell; a
  failed re-check throws inside the transaction, rolling back any
  partial work.
- **Approve re-checks but never deducts** — stock only moves at fulfill,
  so approving reserves nothing (per the brief's fulfill-time re-check).
- **Guard error messages name the offending items** (name, SKU, requested
  vs. available) so the approver knows exactly what failed.
- **Line qty is capped at 1000** by CRUD validation, so the brief's
  qty-999999 walkthrough step is demoed with a qty within the cap that
  still exceeds stock — same guard, same 422.