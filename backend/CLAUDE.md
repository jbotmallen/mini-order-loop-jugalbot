# Backend — Laravel 12 JSON REST API

Laravel 12 (PHP 8.2+) API for the mini order approval system. **The state machine,
guards, seeded users, and cross-cutting rules live in the root `CLAUDE.md`** — that is
the single source of truth; this file covers only backend-specific detail.

Covers **Parts 1–3** (data, API core, the loop) and the tests + CSV export of **Part 5**.

## Stack decisions

- Database: **PostgreSQL** (configure in `.env`; keep `.env.example` in sync).
- Auth: **Laravel Sanctum**, email + password login for the two seeded users only.
- API is JSON-only. Every error response is JSON with the proper status code
  (401 unauthenticated, 403 wrong role/not owner, 422 invalid transition or guard
  failure) — never an HTML error page, never a crash.

## Commands

```bash
php artisan serve                 # run the API
php artisan migrate:fresh --seed  # rebuild DB from scratch — must always work
php artisan test                  # run feature tests
```

## Data model (Part 1)

| Table | Key columns |
|-------|-------------|
| `users` | name, email, password, `role` (`requester` \| `approver`) |
| `items` | `name`, `sku`, `unit_price`, `stock_qty` — seed ~10 |
| `orders` | `number` (`ORD-00001`, sequential auto-generated), `status`, `remarks` (nullable), owner (requester) FK |
| `order_lines` | order FK, item FK, `qty`, `unit_price` (snapshot at line-add time), `line_total` |
| activity log | order FK, actor FK, `from_status`, `to_status`, `note` (reject reason / cancel note), timestamp — **append-only**, no updates or deletes |

Seeders: exactly the 2 users from the root CLAUDE.md table + ~10 catalog items.
`migrate:fresh --seed` must work from a completely clean database.

## API core (Part 2)

- Login endpoint for seeded users (Sanctum); response must let the SPA know the user's role.
- Order CRUD — create/edit/delete lines and remarks — allowed **only while `draft` and
  only by the owner**.
- Orders list endpoint: status filter + text search by order number. Must return what
  the list UI needs: order no., requester, status, total amount, line count, created date.

## The loop (Part 3)

Implement all 8 transitions from the root CLAUDE.md table. Backend enforcement notes:

- Every transition endpoint checks: authenticated → correct role → owner (where
  applicable) → valid current status → guards. Wrong role/owner ⇒ 403; wrong state or
  failed guard ⇒ 422 with a clear JSON message.
- **fulfill** runs inside a DB transaction: re-check every line qty against current
  stock, then deduct. Insufficient stock at that moment ⇒ 422 and **no partial
  deduction** (transaction rolls back).
- **approve** guard checks stock but does **not** deduct — deduction happens only at fulfill.
- Every successful transition appends one activity-log row.
- Price snapshot: `order_lines.unit_price` is copied from the item when the line is
  added and never re-read from the catalog.
- The whole loop must be exercisable via curl/Postman before any UI exists.

## CSV export (Part 5)

Endpoint exporting the orders list, **respecting the same filters as the list endpoint**
(status + search). Columns: order no., requester, status, total, created at, last
activity at.

## Tests (Part 5) — minimum two feature tests, more welcome

1. **Happy loop via the API:** create → submit → approve → fulfill → close, asserting
   status after each step and the stock deduction.
2. **One forbidden case:** e.g. requester attempts approve (expect 403), or approving
   with qty > stock (expect 422 and status unchanged).
