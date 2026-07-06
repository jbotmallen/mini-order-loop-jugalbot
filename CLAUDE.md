# Mini Order Loop — Coding Exam (Jugalbot)

Take-home exercise for Junior IT Developer (Laravel + React) position. A small internal
ordering tool that carries one order through a complete process loop — creation to
closure — with two roles, server-enforced rules, and an audit trail. Runs **locally
only** (no hosting/deployment); demoed live over Google Meet from this machine.

Source of truth for requirements: `APPLICANT-INSTRUCTIONS.md`. This file distills it;
if they ever conflict, the instructions win.

**Priorities: correctness, clear thinking, small and correct — not feature count.**

## Repository layout

| Path | What |
|------|------|
| `backend/` | Laravel 12 JSON REST API — see `backend/CLAUDE.md` |
| `frontend/` | React 18 + Vite SPA consuming the API — see `frontend/CLAUDE.md` |

## Stack (fixed by the brief)

| Layer | Choice |
|-------|--------|
| Backend | PHP 8.2+, Laravel 12, JSON REST API only |
| Frontend | React 18 + Vite SPA, fully separate from backend |
| Database | PostgreSQL |
| Auth | Laravel Sanctum — email + password login for the two seeded users only. No registration, no password reset. |
| Styling | Tailwind CSS |

No paid services.

## Build order — 6 parts, strictly in sequence

Each part ends with **commit + push**. Do not start a part before the previous one is
committed. Commit messages start with `Part N:`. More commits per part welcome (≥1 each).

| Part | Done means | Status |
|------|-----------|--------|
| **Part 0 — Boot** | README pushed before any code; Laravel + React skeletons boot locally | ✅ Both skeletons boot; `Part 0:` skeleton commit pending |
| **Part 1 — Data** | Migrations + models + seeders (2 users, ~10 items); `migrate --seed` works from scratch | ⬜ |
| **Part 2 — API core** | Login, order CRUD while in `draft`, orders list endpoint with status filter + text search | ⬜ |
| **Part 3 — The loop** | All 8 transitions with role gates + guards, price snapshot, stock deduction in a transaction, activity log; whole loop works via curl/Postman | ⬜ |
| **Part 4 — UI** | Login, list with filters/badges, order form, detail page with role-aware actions + confirmations + activity log; whole loop works by clicking | ⬜ |
| **Part 5 — Finish** | CSV export honoring filters, ≥2 feature tests passing, final README (setup commands, logins, walkthrough, Assumptions, hours spent) | ⬜ |

> Update the Status column as parts complete.

## Git rules (senior dev reads the history)

- Push as you go — never save everything for one big final commit.
- **Never rewrite or force-push history.** Prefer new commits over amending.
- `.gitignore` excludes `vendor/`, `node_modules/`, and build output.
- Commit `.env.example`; **never commit `.env`**.

## The domain

### Seeded users

| User | Email | Password | Role |
|------|-------|----------|------|
| Rita Requester | `requester@demo.test` | `password` | `requester` |
| Alan Approver | `approver@demo.test` | `password` | `approver` |

Seeded catalog: ~10 items with `name`, `sku`, `unit_price`, `stock_qty`.

An **order** belongs to a requester and has: an auto-generated sequential number
(`ORD-00001`), a status, optional remarks, and one or more **lines**
(item, qty, unit price snapshot, line total).

### The process loop (state machine) — single source of truth

```
draft → submitted → approved → fulfilled → closed
           │
           └→ rejected → (revise) → draft
draft / submitted → cancelled
```

| # | Action | From → To | Who | Rules / guards |
|---|--------|-----------|-----|----------------|
| 1 | create | — → `draft` | requester | Starts empty or with lines; editable only in `draft`, only by its owner |
| 2 | submit | `draft` → `submitted` | owner requester | ≥ 1 line; every qty is an integer ≥ 1 |
| 3 | approve | `submitted` → `approved` | approver | **Guard:** every line qty ≤ current item stock, else 422 with clear message |
| 4 | reject | `submitted` → `rejected` | approver | Reason **required** and stored |
| 5 | revise | `rejected` → `draft` | owner requester | Lines kept; order editable again |
| 6 | fulfill | `approved` → `fulfilled` | approver | **Deduct stock inside a DB transaction.** Re-check stock at this moment; if insufficient, 422 and no partial deduction |
| 7 | close | `fulfilled` → `closed` | owner requester | "Received & confirmed" — end of loop |
| 8 | cancel | `draft`/`submitted` → `cancelled` | owner requester | Optional note |

### Cross-cutting rules (non-negotiable)

- **All rules enforced server-side.** Hiding UI buttons is not enough — reviewers will
  hit the API directly (wrong role, invalid transition, overstock). Refuse politely
  with proper status codes (401/403/422) and a JSON error message.
- **Price snapshot:** a line stores the item's `unit_price` at the moment the line is
  added. Later catalog price changes must not affect existing orders.
- **Activity log:** every transition writes an append-only row — order, actor,
  `from_status`, `to_status`, note (reject reason / cancel note), timestamp. Shown on
  the order detail page.
- Invalid transitions (approving a `draft`, submitting twice) return 422 — never crash,
  never silently succeed.

## Assumptions — document every judgment call

Deliberately unspecified details (duplicate item lines merge vs. reject, pagination,
API route structure, etc.): decide, then record each decision under **"Assumptions"**
in the root `README.md`. Do this at the time of the decision, not at the end.

## Definition of done — the self-check walkthrough

Run on a fresh `migrate:fresh --seed`; this is the exact rehearsal for the evaluation
Meet:

1. Log in as Rita, create an order with 2 different items, submit it.
2. Log in as Alan, reject it with a reason.
3. As Rita: revise, edit a quantity, resubmit.
4. As Alan: approve, then fulfill → verify item stock actually dropped.
5. As Rita: close it. Detail page activity log shows the whole story incl. rejection reason.
6. As Rita: create a second order with qty `999999`, submit; Alan's approval must fail
   with a clear message and the order stays `submitted`.
7. Cancel that order as Rita. Export CSV filtered to `cancelled` — contains only that order.
8. With curl: approve an order using Rita's credentials → must be refused.
