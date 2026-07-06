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