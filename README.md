# GrowEasy — AI-Powered CSV Lead Importer

Upload a CSV in *any* layout (Facebook Lead Ads export, Google Ads export, an
Excel-derived sheet, another CRM's export, a manual spreadsheet — anything)
and have it intelligently mapped into GrowEasy's CRM lead schema using an
LLM, with a clean preview → confirm → results flow.

## Live Demo

- **Frontend (Vercel):** https://groweasy-csv-importer-shailesh5.vercel.app/
- **Backend API (Render):** https://groweasy-csv-importer-68cy.onrender.com

> Note: the backend is on Render's free tier and spins down after periods of
> inactivity. If it's been idle, the first upload after that may take
> 30-50 seconds to wake up before processing starts — this is expected, not
> a bug.

> **Position applied for:** _Intern / Full-Time_ — <!-- update this line -->

---

## Architecture

```
groweasy-csv-importer/
├── backend/     Node.js + Express + TypeScript API
└── frontend/    Next.js 14 (App Router) + TypeScript + Tailwind
```

The two are separate services, talking over a plain REST API — the frontend
never touches the AI provider directly (no API keys in the browser).

### Why this shape

- **Frontend never sends the file to the AI.** It only parses the CSV
  client-side for the *preview* step (Papa Parse, `lib/csv.ts`). The actual
  file is uploaded to the backend only after the user clicks **Confirm**.
- **Backend does one job well.** `POST /api/import` accepts the raw CSV,
  parses it with no assumption about column names, splits it into batches,
  and asks Gemini to map each batch onto the CRM schema using a strict JSON
  response schema (`responseSchema` / `responseMimeType: application/json`)
  — no format-drift, no markdown fences to strip.
- **Business rules live outside the prompt.** The AI proposes values;
  `validator.service.ts` is the single source of truth that enforces the
  assignment's hard rules (allowed `crm_status` / `data_source` enums, "must
  have email or mobile" rule, date validity) so the system doesn't depend on
  the model always obeying instructions perfectly.
- **Per-batch fault isolation.** If one batch's AI call fails (rate limit,
  malformed response) after retries, only that batch's rows are marked
  skipped with a reason — the rest of the import still succeeds.

### Request flow

```
Browser                         Backend                         Gemini
   │  1. drag & drop CSV            │                               │
   │  2. parse client-side, preview │                               │
   │  3. user clicks Confirm        │                               │
   │ ── POST /api/import (file) ──▶ │                               │
   │                                │ parse CSV → rows              │
   │                                │ chunk rows into batches        │
   │                                │ ── batch N ─────────────────▶ │
   │                                │ ◀── mapped JSON records ───── │
   │                                │ validate + apply CRM rules     │
   │                                │ (retry batch on failure)       │
   │ ◀── { imported, skipped } ──── │                               │
   │  4. render results tables      │                               │
```

---

## Backend — `/backend`

**Stack:** Node.js, Express, TypeScript, Multer (upload), Papa Parse (CSV),
`@google/generative-ai` (Gemini), Zod-ready validation layer.

```
backend/src/
├── server.ts                     Express app entrypoint
├── routes/import.routes.ts       POST /api/import
├── controllers/import.controller.ts   orchestrates the pipeline
├── services/
│   ├── csvParser.service.ts      CSV → rows, batching helper
│   ├── gemini.service.ts         AI extraction, schema, retries
│   └── validator.service.ts      CRM business rules
├── middleware/
│   ├── upload.ts                 Multer config (5MB limit, .csv only)
│   └── errorHandler.ts           centralized error responses
├── types/crm.ts                  shared CRM types & enums
└── tests/validator.service.test.ts
```

### Setup

```bash
cd backend
cp .env.example .env
# edit .env and set GEMINI_API_KEY=your_key
npm install
npm run dev      # http://localhost:4000
```

### Scripts

| Script         | Purpose                              |
|----------------|---------------------------------------|
| `npm run dev`  | Run with ts-node + nodemon (hot reload) |
| `npm run build`| Compile TypeScript to `dist/`         |
| `npm start`    | Run the compiled build                |
| `npm test`     | Run unit tests (Node's built-in test runner) |
| `npm run lint` | Type-check only                       |

### API

**`POST /api/import`** — `multipart/form-data`, field name `file`

Response `200`:
```json
{
  "totalRows": 42,
  "totalImported": 39,
  "totalSkipped": 3,
  "imported": [ { "created_at": "...", "name": "...", "email": "...", "...": "..." } ],
  "skipped":  [ { "row": { "...": "..." }, "rowIndex": 7, "reason": "Record has neither an email address nor a mobile number." } ]
}
```

Errors return `4xx/5xx` with `{ "error": "message" }`.

**`GET /health`** — liveness check.

---

## Frontend — `/frontend`

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, react-dropzone,
Papa Parse.

```
frontend/
├── app/
│   ├── layout.tsx        root layout, Inter font
│   ├── page.tsx           step state machine (upload/preview/processing/results)
│   └── globals.css
├── components/
│   ├── UploadStep.tsx      drag & drop + file picker
│   ├── PreviewStep.tsx     raw CSV preview table (no AI yet)
│   ├── ProcessingStep.tsx  animated progress while AI runs
│   ├── ResultsStep.tsx     imported/skipped tables + summary cards
│   ├── Stepper.tsx / ThemeToggle.tsx
│   └── ui/DataTable.tsx, ui/StatusBadge.tsx
└── lib/
    ├── api.ts             fetch wrapper for POST /api/import
    ├── csv.ts             client-side preview parsing
    └── types.ts           shared CRM types
```

### Setup

```bash
cd frontend
cp .env.local.example .env.local
# edit .env.local if your backend isn't on localhost:4000
npm install
npm run dev      # http://localhost:3000
```

### UX flow

1. **Upload** — drag & drop or file picker, `.csv` only, 5MB max.
2. **Preview** — client-parsed table (sticky header, scrolls both ways).
   No AI call happens here.
3. **Confirm** — sends the file to the backend; an animated progress view
   shows staged messages while batches are extracted.
4. **Results** — summary cards (total / imported / skipped), a table of
   imported CRM records with status badges, and a table of skipped rows
   with the reason each was skipped. Imported records can be exported as
   JSON.

Dark mode is available via the toggle in the header (persisted per browser).

---

## Running everything together (Docker)

```bash
cp backend/.env.example backend/.env   # fill in GEMINI_API_KEY
GEMINI_API_KEY=your_key docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

---

## AI extraction rules implemented

- `crm_status` restricted to `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`,
  `BAD_LEAD`, `SALE_DONE` — anything else is blanked, never invented.
- `data_source` restricted to the five allowed project codes — same rule.
- `created_at` must be parseable by `new Date(...)`; unparseable values are
  blanked rather than guessed.
- Extra emails/phones beyond the primary one are appended to `crm_note`.
- A row with neither an email nor a mobile number is skipped, with the
  reason recorded and surfaced in the UI.
- CSV batches are retried (exponential backoff) before being marked skipped,
  so a transient API hiccup doesn't silently drop good leads.

## Deployment notes

This project is deployed as two separate services (see Live Demo links above):

- **Backend → Render.** Root directory `backend`, build command
  `npm install && npm run build`, start command `npm start`. Environment
  variables set in the Render dashboard: `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `FRONTEND_ORIGIN` (must exactly match the deployed frontend URL, no
  trailing slash — this is what CORS checks against), `MAX_FILE_SIZE_MB`,
  `AI_BATCH_SIZE`, `AI_MAX_RETRIES`.
- **Frontend → Vercel.** Root directory `frontend`. Environment variable
  `NEXT_PUBLIC_API_BASE_URL` set to the Render backend URL. Since this is a
  build-time (`NEXT_PUBLIC_*`) variable, any change to it requires a fresh
  deploy to take effect, not just a config save.

Both platforms redeploy automatically on push to `main`.
