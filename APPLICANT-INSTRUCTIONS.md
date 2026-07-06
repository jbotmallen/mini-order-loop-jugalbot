# Coding Exam — Mini Order Approval System (Full Process Loop)

**Position:** Junior IT Developer (Laravel + React)
**Format:** Take-home exercise built and run **locally only** (no hosting or deployment),
followed by a **Google Meet** session where we go through it together.
**Expected effort:** ~6–10 focused hours.
**Deadline:** 3 calendar days after you receive this brief — if you need more time, just ask. <!-- adjust per applicant -->

You will build a small internal ordering tool that carries one order through a complete
process loop — from creation to closure — with two roles, server-enforced rules, and an
audit trail. It is deliberately small; what we care about is **correctness, clear
thinking, and how you work**, not feature count.

**Questions are welcome at any time.** If anything in this brief is unclear, seems
contradictory, or turns out to be impossible on your machine, just reach out (section 9)
— we're happy to help, and asking counts in your favor, never against you.

**It's okay if you don't finish everything.** Submit whatever you have — the evaluation
is a Google Meet session where we look at your work together, and if some parts are
missing we'll guide you through them on the call. An honestly half-finished project you
understand beats a complete one you can't explain.

---

## 1. Ground rules

- Individual work. Documentation and AI tools are fine to use — just make sure you
  understand what you ship, since we'll walk through the code together on the
  Google Meet afterwards.
- Please build it yourself rather than adapting an existing tutorial project — we'd
  much rather see your own thinking, even if it's simpler.
- It only needs to run on your own machine — you'll demo it live on the Meet.
- We look at your git history as part of the review — see section 3 before you start.
- Stuck, unsure, or blocked at any point? Email us (section 9) — we're happy to help.

## 2. Required stack

| Layer    | Requirement |
|----------|-------------|
| Backend  | PHP 8.2+, Laravel 10/11/12, exposing a **JSON REST API** |
| Frontend | **React 18 + Vite** SPA, separate from the backend, consuming the API (this mirrors our production architecture) |
| Database | PostgreSQL preferred; SQLite accepted for simplicity |
| Auth     | Simple email + password login for the two seeded users. Sanctum, JWT, or session — your choice. No registration or password reset needed. |

No paid services. Tailwind or plain CSS — your choice.

## 3. Repository & pushing per part — read before you start

1. Create a **new GitHub repository** named `mini-order-loop-<yourlastname>`.
   Make it **public**, or private with GitHub user **`LhumianGP`** invited as collaborator. <!-- adjust -->
2. Your **first commit and push must happen before you write any application code**:
   a README containing your name, chosen stack, and a short plan (a few bullets).
3. Build the project in the **6 parts** listed in section 6, in order.
   **At the end of every part: commit and push.** Commit messages start with `Part N:`.
   More commits per part are very welcome — aim for at least one per part.
4. Please push as you go rather than saving everything for one big final commit, and
   try to avoid rewriting or force-pushing history — we read the commit history to see
   how you approached the work, and a story told in steps is far more convincing.
5. Hygiene: `.gitignore` must exclude `vendor/`, `node_modules/`, and build output.
   Commit a `.env.example`; never commit `.env`.

## 4. The system to build

Two seeded users:

| User | Email | Password | Role |
|------|-------|----------|------|
| Rita Requester | `requester@demo.test` | `password` | `requester` |
| Alan Approver  | `approver@demo.test`  | `password` | `approver`  |

Seeded catalog: ~10 items, each with `name`, `sku`, `unit_price`, `stock_qty`.

An **order** belongs to a requester and has: an auto-generated number (`ORD-00001`,
sequential), a status, optional remarks, and one or more **lines** (item, qty,
unit price snapshot, line total).

### The process loop (state machine)

```
draft → submitted → approved → fulfilled → closed
           │            
           └→ rejected → (revise) → draft
draft / submitted → cancelled
```

| # | Action  | From → To             | Who                  | Rules / guards |
|---|---------|-----------------------|----------------------|----------------|
| 1 | create  | — → `draft`           | requester            | Order starts empty or with lines; editable only in `draft`, only by its owner |
| 2 | submit  | `draft` → `submitted` | owner requester      | Must have ≥ 1 line; every qty is an integer ≥ 1 |
| 3 | approve | `submitted` → `approved` | approver          | **Guard:** every line qty ≤ current item stock, else reject the request with 422 and a clear message |
| 4 | reject  | `submitted` → `rejected` | approver          | A reason is **required** and stored |
| 5 | revise  | `rejected` → `draft`  | owner requester      | Lines are kept; order becomes editable again |
| 6 | fulfill | `approved` → `fulfilled` | approver          | **Deduct stock inside a DB transaction.** Re-check stock at this moment; if now insufficient, 422 and no partial deduction |
| 7 | close   | `fulfilled` → `closed` | owner requester     | "Received & confirmed" — end of the loop |
| 8 | cancel  | `draft` or `submitted` → `cancelled` | owner requester | Optional note |

Key requirements:

- **The rules above are enforced server-side.** Hiding a button in the UI isn't enough
  on its own — during review we'll also try a few API calls directly (wrong role,
  invalid transition, overstock), and the API should refuse politely with proper
  status codes (401/403/422) and a JSON error message.
- **Price snapshot:** a line stores the item's `unit_price` at the moment the line is
  added. Changing the catalog price later must not change existing orders.
- **Activity log:** every transition writes an append-only row — order, actor,
  `from_status`, `to_status`, note (reject reason / cancel note), timestamp — shown on
  the order detail page.
- Invalid transitions (e.g. approving a `draft`, submitting twice) must return 422,
  never crash and never silently succeed.

### Frontend (React SPA)

- **Login page** for the seeded users; the UI must know the current user's role.
- **Orders list**: order no., requester, status badge, total amount, line count,
  created date. Filter by status + text search by order number.
- **Create / edit order** (draft only): pick items, set quantities, live line totals and
  order total.
- **Order detail**: lines, remarks, activity log, and **only the action buttons valid
  for the current user + current status** (submit / approve / reject / fulfill / close /
  cancel / revise). Destructive or final actions get a confirmation dialog; reject
  prompts for the reason.
- After any action the visible state updates without a manual page reload.

### Export

- **CSV export** of the orders list that **respects the currently applied filters**.
  Columns: order no., requester, status, total, created at, last activity at.

### Automated tests

Minimum **two backend feature tests** (more welcome):

1. **The full happy loop** through the API: create → submit → approve → fulfill →
   close, asserting status after each step and the stock deduction.
2. **One forbidden case**: e.g. requester attempts to approve (expect 403), or approving
   an order whose qty exceeds stock (expect 422 and unchanged status).

## 5. Things you decide (document them)

Some details are deliberately unspecified — decide, and record each decision under
**"Assumptions"** in your README. Examples: what happens with duplicate item lines
(merge vs. reject), pagination or not, how you structure the API routes, token vs.
session auth.

## 6. The 6 parts — each one ends with a commit + push

| Part | Deliverable — done means |
|------|--------------------------|
| **Part 0 — Boot** | Repo created, first README pushed **before any code**; Laravel skeleton and React skeleton both boot locally |
| **Part 1 — Data** | Migrations + models + seeders (2 users, ~10 items). `migrate --seed` works from scratch |
| **Part 2 — API core** | Login, order CRUD while in `draft`, orders list endpoint with status filter + search |
| **Part 3 — The loop** | All 8 transitions with role gates + guards, price snapshot, stock deduction in a transaction, activity log. The whole loop works via curl/Postman |
| **Part 4 — UI** | Login, list with filters/badges, order form, detail page with role-aware actions + confirmations + activity log. The whole loop works by clicking |
| **Part 5 — Finish** | CSV export honoring filters, the ≥2 feature tests passing, final README (see below) |

Final README should contain: prerequisites, **exact setup commands** (backend + frontend,
copy-pasteable), the seeded logins, a short walkthrough of the loop, your Assumptions
list, and roughly how many hours you spent.

## 7. Self-check before you submit

Run this exact sequence on a fresh setup (`migrate:fresh --seed`) — it's the same
walkthrough we'll do together on the Meet, so it doubles as your rehearsal. If a step
doesn't work yet, that's okay; just note it in your submission:

1. Log in as **Rita**, create an order with 2 different items, submit it.
2. Log in as **Alan**, **reject** it with a reason.
3. As Rita: revise, edit a quantity, resubmit.
4. As Alan: approve, then fulfill → verify the items' stock actually dropped.
5. As Rita: close it. Open the detail page — the activity log shows the whole story,
   including the rejection reason.
6. As Rita: create a second order with qty `999999`, submit; as Alan, approving it must
   fail with a clear message and the order stays `submitted`.
7. Cancel that order as Rita. Export the CSV filtered to `cancelled` — it contains only
   that order.
8. With curl: try to approve an order using Rita's credentials → must be refused.

## 8. How we evaluate — a Google Meet session, together

After you submit, we'll schedule a relaxed **Google Meet** (roughly 30–45 minutes) and
go through your work together. **We won't clone or run your code ourselves** — you'll
demo the system from your own machine over screen share, so just have it running
before the call. Together we will:

- Walk the loop in your running app — the self-check in section 7 is the rehearsal.
- Try a few direct API calls together (wrong role, wrong state, overstock).
- Look at the code and your **git history**, and chat about your decisions and your
  Assumptions list.
- **If something isn't finished, no problem** — tell us where you stopped and we'll
  guide you through it on the call. How you think it through with us counts just as
  much as what's already built.

Before the call we may browse your repository on GitHub — the code and the per-part
commit history — which is why the pushes in section 3 still matter.

## 9. Submission

Reply to the email thread that sent you this brief (or to **gerald_espadilla@globalpacific.com.ph**) <!-- adjust -->
— the same address happily answers questions while you work — with:

1. The repository URL (and confirmation that `LhumianGP` has access if private).
2. Total hours spent.
3. Anything unfinished or that you'd do differently with more time — remember,
   unfinished is fine; we'll walk through it together.
4. A few time slots when you're free for the Google Meet walkthrough.

We'll reply with a Meet invite for the evaluation session.

And once more: if anything here is unclear or looks impossible, don't sit on it —
email us. Asking questions is part of the job, and we're happy to help.

Good luck, and have fun with it — build it small, build it correct.
