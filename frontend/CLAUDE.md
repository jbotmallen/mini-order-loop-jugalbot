# Frontend — React 18 + Vite SPA

React 18 + Vite (TypeScript) SPA consuming the Laravel JSON API in `backend/`. Styling:
Tailwind CSS v4 (via `@tailwindcss/vite` plugin). **The state machine, roles, and
domain rules live in the root `CLAUDE.md`** — this file covers only frontend-specific
detail. Covers **Part 4** (UI) and the export UI of **Part 5**.

React is pinned to 18.x per the brief — do not upgrade to React 19.

## Commands

```bash
npm run dev     # Vite dev server (http://localhost:5173)
npm run build   # typecheck (tsc -b) + production build (dist/ stays gitignored)
npm run lint    # oxlint
```

## Architecture rules

- SPA is fully separate from the backend; talks to it only via the JSON REST API
  (Sanctum auth). Client-side routing only — no SSR.
- The UI must know the current user's **role** (from login response) and render
  accordingly — but the UI is convenience only; **the server is the enforcement layer**.
- After any action, the visible state updates **without a manual page reload**
  (refetch or update from the response).

## Pages (Part 4)

| Page | Requirements |
|------|--------------|
| **Login** | Email + password for the two seeded users; store auth + role |
| **Orders list** | Columns: order no., requester, status badge, total amount, line count, created date. Filter by status + text search by order number |
| **Create / edit order** | Only for `draft` orders owned by the user. Pick items, set quantities, live line totals and live order total |
| **Order detail** | Lines, remarks, activity log, and **only the action buttons valid for the current user + current status** (submit / approve / reject / fulfill / close / cancel / revise) |

### Action button behavior

- Show a button only when both the role/ownership AND the current status allow the
  transition (see the table in root `CLAUDE.md`).
- **Destructive or final actions** (cancel, fulfill, close, reject) get a confirmation
  dialog.
- **Reject** prompts for the required reason; **cancel** offers an optional note.
- Surface API 422 messages to the user clearly (e.g. overstock on approve).

## CSV export (Part 5)

Export button on the orders list that downloads the CSV **with the currently applied
filters** (status + search) passed to the backend export endpoint.
