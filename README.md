# MeddyBuddyAI

> **An agentic AI medication-management platform built with Jac 2.0 + byLLM + Claude Sonnet 4.6.**
> Submission for **JacHacks Spring 2026** — Agentic AI flagship track.

MeddyBuddyAI is a proactive health companion, not a chatbot. It tracks your medications, logs your doses, computes your adherence, surfaces proactive alerts when your routine slips, and writes you a weekly report — all through a single conversational agent that picks the right tool for each turn.

```
You → "I just took my aspirin"
       ↓
       meddy_chat walker
       ↓
       byLLM (Claude Sonnet 4.6)
       ↓                       ↘ picks tool
   composes warm reply           tool_log_dose_taken_from_chat("aspirin")
       ↓                       ↙ writes graph
"Great job staying on track! ✅ Logged at 9:40 AM."
```

---

## What's inside

| Layer | Implementation |
|-------|----------------|
| Language | **Jac 2.0** (`jaclang` 0.10.2) — every node, walker, edge, and entry point is native Jac. |
| LLM | **Claude Sonnet 4.6** via `byllm` 0.4.20 (LiteLLM under the hood). |
| Graph | Native Jac graph — `root → UserProfile → Medication → DoseLog` plus `→ Alert`, `→ Reminder`, `→ MedicalReport`. |
| Persistence | Auto-handled by `jac start` (per-user root, SQLite-backed memory). |
| API | `jac start` auto-exposes every `walker:pub` as `POST /walker/<name>` via FastAPI. |
| Auth | Built-in Bearer-token auth (register / login). |
| External | OpenFDA drug-interaction lookups; Brevo for email reminders. |

---

## Agents that actually do things

The submission focuses on **7 agentic capabilities**, each implemented as a clean Jac construct:

### 1. Conversational onboarding agent (`onboarding_chat`)
The moment a user signs up, a **dedicated** byLLM agent (`meddy_onboarder`, its own `glob onboarding_history`) walks them through adding their medications in plain English — one question at a time, no forms. The agent calls `tool_add_medication_from_chat` with structured arguments (`med_name`, `dosage`, `frequency`, `times[]`) parsed from natural phrases like *"Metformin 500mg, 8am and 8pm"*. When the user says *"that's all"*, it warmly hands off to the main chat.

### 2. Conversational medication agent (`meddy_chat`)
A `walker:pub` that wraps `meddy_buddy(message)`, a byLLM function with `conversation=chat_history` (multi-turn memory) and `tools=[…7 tools…]`. The LLM picks tools — `tool_get_my_medications`, `tool_add_medication_from_chat`, `tool_log_dose_taken_from_chat`, `tool_log_dose_skipped_from_chat`, `tool_check_drug_interaction` (OpenFDA), `tool_get_adherence_summary`, `tool_current_time` — and the tools read/write the user's graph directly.

### 3. Medication CRUD walkers
`init_user`, `get_profile`, `update_profile`, `add_medication`, `get_medications`, `log_dose`, `get_dose_history`, `deactivate_medication`, `get_adherence`. Same data the agent uses, exposed as plain REST so a frontend can drive the graph without going through chat.

### 4. Digital Health Twin (the differentiator)
- `health_score` → 0–100 score with trend vs prior week, per-medication top risks, wins.
- `generate_alerts` → reads risks from the score function, attaches them as `Alert` nodes — duplicate-guarded.
- `get_alerts` / `acknowledge_alert` → manage the alert inbox.
- `weekly_report` → structured report **plus** a byLLM-generated natural-language summary, framed by a strict `sem` prompt that leads with the headline number, acknowledges wins before risks, ends with one actionable step, and never diagnoses.

### 5. Proactive email layer (Brevo)
- `send_test_email` → sanity-check the wiring.
- `send_reminder(med_name)` → sends a styled HTML reminder for a specific med to the user's profile email, writes a `NotificationLog` node for the audit trail.
- `send_caregiver_digest` → sends the polished weekly digest (score, adherence table, trend, wins, risks) to the `caregiver_email` set on the profile — closes the family-care loop without surveillance.

### 6. Drug-interaction tool
`tool_check_drug_interaction(a, b)` hits the OpenFDA drug-label API and returns the interaction snippet — or a safe "ask your pharmacist" fallback. Wired into the conversational agent so the user can ask "is ibuprofen safe with metformin?" and get a real reference, never a fabrication.

### 7. Safety rails (cross-cutting)
Every byLLM call is gated by a `sem` block:
- Never diagnose, prescribe, or change dosages.
- Never fabricate interactions — only report what OpenFDA returns.
- Always recommend the user contact their clinician for clinical questions.
- Politely refuse dose changes — redirect to the prescriber.

---

## Quickstart

### Prerequisites
- **Python 3.12+** (jaclang requires `typing.override` which only exists in 3.12+)
- **Node 20+** for the React frontend
- Windows 11 (tested), Mac, or Linux
- An `ANTHROPIC_API_KEY` (Claude Sonnet 4.6) — required for chat + weekly report
- A `BREVO_API_KEY` — required for the reminder + caregiver-digest demo flow

### Install

```powershell
git clone https://github.com/Harshprajapat777/MeddyBuddyAI.git
cd MeddyBuddyAI

python -m venv jac-env
./jac-env/Scripts/activate    # PowerShell:  .\jac-env\Scripts\Activate.ps1
pip install jaclang byllm python-dotenv requests

# Add your API keys
copy .env.example .env
# Edit .env — see "Brevo setup" below for the email keys
```

### Brevo setup (so the reminder + caregiver emails actually fire)

1. Sign up at [brevo.com](https://brevo.com) → free tier gives you 300 emails/day forever.
2. **Settings → Senders, Domains & Dedicated IPs** → add and verify the sender email you want emails to come from (e.g. `meddybuddy@yourdomain.com`). Brevo will send you a confirmation email.
3. **Settings → SMTP & API → API Keys** → click *Generate a new API key*, copy it.
4. Paste into `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=meddybuddy@yourdomain.com   # must match what you verified
   BREVO_SENDER_NAME=MeddyBuddy
   ```
5. Restart `jac start main.jac` so dotenv picks up the new vars.
6. Sanity check: in the app, open Settings → *Send test email*. It should land in the user's inbox in ~5 seconds.

If you don't add the Brevo key, every email walker fails gracefully with `"BREVO_API_KEY not set in .env"` — the UI displays the error inline. Chat, CRUD, and the Digital Twin keep working.

### Run

```powershell
# IMPORTANT on Windows: force UTF-8 — the LLM returns emoji in replies,
# default cp1252 stdout will UnicodeEncodeError otherwise.
$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"
python -m jaclang start main.jac --port 8000
```

The server prints every endpoint at startup. The full set is also generated by `--faux` mode:

```powershell
python -m jaclang start main.jac --faux
# → TOTAL: 25 functions × 21 walkers × 0 client functions × 98 endpoints
```

---

## Demo flow (curl)

Every walker requires a Bearer token. Register once, reuse the token.

### 1. Register and login

```bash
curl -X POST http://localhost:8000/user/register \
  -H "Content-Type: application/json" \
  -d '{"identities":[{"type":"username","value":"harsh"}],"credential":{"type":"password","password":"hackathon123"}}'

# Save the token from the response:
TOKEN="<paste data.token here>"
```

### 2. Create the user profile

```bash
curl -X POST http://localhost:8000/walker/init_user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_name":"Harsh","email":"harsh@example.com"}'

# → {"reports":[{"status":"created","name":"Harsh"}]}
```

### 3. Add medications

```bash
curl -X POST http://localhost:8000/walker/add_medication \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"med_name":"Aspirin","dosage":"81mg","frequency":"daily","times":["08:00"]}'

curl -X POST http://localhost:8000/walker/add_medication \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"med_name":"Metformin","dosage":"500mg","frequency":"twice_daily","times":["08:00","20:00"]}'
```

### 4. Talk to the agent (the marquee demo)

```bash
curl -X POST http://localhost:8000/walker/meddy_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_message":"What medications am I on?"}'
# → LLM picks tool_get_my_medications, returns a Markdown table

curl -X POST http://localhost:8000/walker/meddy_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_message":"I just took my aspirin"}'
# → LLM picks tool_log_dose_taken_from_chat, confirms with timestamp

curl -X POST http://localhost:8000/walker/meddy_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"user_message":"Is ibuprofen safe with my metformin?"}'
# → LLM picks tool_check_drug_interaction, returns OpenFDA reference
```

### 5. Digital Twin — proactive alerts + weekly report

```bash
curl -X POST http://localhost:8000/walker/health_score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# → {"score":10,"trend":"stable","top_risks":["Aspirin: 28.6% adherence …", "Metformin: 0.0% adherence …"],"wins":[]}

curl -X POST http://localhost:8000/walker/generate_alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# → creates Alert nodes for any risks not already in the user's inbox

curl -X POST http://localhost:8000/walker/get_alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# → returns the alert inbox with severity, message, suggested action

curl -X POST http://localhost:8000/walker/weekly_report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# → structured stats + byLLM-generated 5-sentence narrative summary
```

---

## API surface

| Endpoint | Body | What it does |
|----------|------|--------------|
| `POST /user/register` | `{identities, credential}` | Create account, return Bearer token |
| `POST /user/login` | `{identity, credential}` | Login, return Bearer token |
| `POST /walker/init_user` | `{user_name?, email?, timezone?}` | Create UserProfile (idempotent) |
| `POST /walker/get_profile` | `{}` | Return user profile (incl. `caregiver_email`) |
| `POST /walker/update_profile` | `{email?, caregiver_email?, timezone?, sleep_time?, wake_time?}` | Partial profile update |
| `POST /walker/add_medication` | `{med_name, dosage, frequency?, times?, notes?}` | Attach a Medication |
| `POST /walker/get_medications` | `{include_inactive?}` | List meds |
| `POST /walker/log_dose` | `{med_name, status, note?}` | Append a DoseLog |
| `POST /walker/get_dose_history` | `{med_name?, limit?}` | Recent dose log |
| `POST /walker/deactivate_medication` | `{med_name}` | Soft-delete a med |
| `POST /walker/get_adherence` | `{med_name?, days?}` | Adherence breakdown |
| `POST /walker/meddy_chat` | `{user_message}` | Main conversational agent |
| `POST /walker/clear_chat_history` | `{}` | Reset main-chat memory |
| `POST /walker/onboarding_chat` | `{user_message}` | Dedicated first-time setup agent |
| `POST /walker/clear_onboarding_history` | `{}` | Reset onboarding-agent memory |
| `POST /walker/health_score` | `{}` | 0–100 Digital Twin score |
| `POST /walker/get_alerts` | `{include_acknowledged?}` | Alert inbox |
| `POST /walker/generate_alerts` | `{}` | Refresh proactive alerts |
| `POST /walker/acknowledge_alert` | `{alert_id}` | Resolve an alert |
| `POST /walker/weekly_report` | `{}` | Structured + LLM-narrated weekly report |
| `POST /walker/send_test_email` | `{to_email?}` | Send a sanity-check Brevo email |
| `POST /walker/send_reminder` | `{med_name}` | Email a styled dose reminder to the user |
| `POST /walker/send_caregiver_digest` | `{}` | Email the polished weekly digest to `caregiver_email` |

---

## Project layout

```
MeddyBuddyAI/
├── main.jac              ← single source of truth — all nodes, walkers, tools, agents
├── jac.toml              ← project config (model = claude-sonnet-4-6, port 8000)
├── requirements.txt
├── .env.example          ← ANTHROPIC_API_KEY, BREVO_API_KEY templates
├── .gitignore
├── README.md             ← (this file)
├── SUBMISSION.md         ← step-by-step submission + demo-recording guide
├── JAC_USAGE.md          ← Best-Use-of-Jac essay (10 primitives, line refs)
├── jac/                  ← internal Jac reference notes (study material)
└── frontend/
    └── client/           ← React 19 + Vite + Tailwind v4 single-page app
        ├── src/
        │   ├── api/client.js                   ← Bearer-token API client
        │   ├── components/
        │   │   ├── auth/AuthScreen.jsx         ← login / register
        │   │   ├── layout/                     ← Header, Sidebar, AppShell
        │   │   ├── chat/                       ← ChatPanel, MessageBubble, MessageInput
        │   │   ├── medications/                ← MedicationList, AddMedicationModal
        │   │   └── twin/                       ← HealthScoreCard, AlertsInbox, WeeklyReportModal
        │   ├── App.jsx
        │   └── index.css                       ← Tailwind v4 + warm earthy palette
        ├── package.json
        └── vite.config.js
```

## Running the full stack

You need **two terminals** — backend (Jac) and frontend (Vite).

### Terminal 1 — backend

```powershell
cd MeddyBuddyAI
.\jac-env\Scripts\Activate.ps1            # if you haven't yet
$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"
python -m jaclang start main.jac --port 8000
```

Backend on `http://localhost:8000` — Bearer-token auth, CORS enabled for the Vite dev server.

### Terminal 2 — frontend

```powershell
cd MeddyBuddyAI\frontend\client
npm install                                # first time only
npm run dev
```

Frontend on `http://localhost:5173`. Open it, hit **Create account**, pick any username + password, and you're in. The app fetches your meds, alerts, and health score on mount, and every chat message goes to the live Claude Sonnet 4.6 agent.

### Frontend tech stack

| Layer | Choice |
|-------|--------|
| Build | Vite 8, React 19 |
| Styling | Tailwind CSS v4 (Instrument Serif + DM Sans, warm earthy palette) |
| Animation | Framer Motion |
| Markdown | `react-markdown` + `remark-gfm` (for LLM chat responses and weekly reports) |
| Icons | Lucide React |
| State | React `useState` + `localStorage` (token persisted across refreshes) |
| API | `src/api/client.js` — small fetch wrapper that handles the response envelope and Bearer auth |

`main.jac` is intentionally single-file. We tried a multi-file `models/`+`walkers/` layout first, but `cl import from "./file.jac"` registers walkers as client-side only (not as server REST endpoints). Single-file is the working path for `jac start` until Jac picks up proper Python-package-style imports.

---

## Architecture notes (and gotchas we discovered)

A few things that bit us during the 24-hour build — useful for anyone trying this:

1. **Install `jaclang` directly**, not `jaseci`. The `jaseci` meta-package pulls in legacy Jaseci 1.x which uses Linux-only `SIGALRM` and breaks on Windows.
2. **Python 3.12+ required.** jaclang's runtime imports `typing.override`, which only landed in 3.12. Python 3.11 → `ImportError`.
3. **Walker entry abilities:** `can run with \`root entry { ... }` does NOT fire on spawn — typed entries only fire on explicit `visit`. Use plain `can run with entry { ... }` for the dispatcher ability; keep typed triggers (e.g. `can add with UserProfile entry`) for the second ability invoked via `visit profiles[0]`.
4. **Booleans:** lowercase `true` / `false` in Jac source compile but don't transpile — they emit literal `true`/`false` in the generated Python and raise `NameError`. Use `True` / `False`.
5. **`[node --> NodeType]` does not filter by type at runtime** — it returns all outgoing children. Guard every traversal with `if not isinstance(VAR, NodeType) { continue; }`.
6. **`walker:pub` is required** to expose a walker as a REST endpoint. Plain `walker` is private.
7. **Bearer auth is mandatory** — every walker (including the "public" ones) needs `Authorization: Bearer <token>` from `POST /user/register` or `POST /user/login`.
8. **Windows: force UTF-8.** The LLM replies with emoji; default cp1252 stdout chokes. Set `PYTHONIOENCODING=utf-8 PYTHONUTF8=1` before `jac start`.

---

## Hackathon context

- **Event:** JacHacks Spring 2026 (online, May 15–19)
- **Track:** Agentic AI (flagship) — `$600` / `$400`
- **Devpost:** https://jachacks-spring.devpost.com
- **Why this fits the flagship track:** real multi-step reasoning (LLM tool picking), persistent memory across sessions (per-user Jac graph + global chat history), proactive behavior (alerts surface without the user asking), structured outputs (`obj HealthScore`, `obj WeeklyReport`), and deep use of Jac primitives (nodes, walkers, abilities, `by llm` functions, `sem` annotations) — not just a UI wrapping an API call.

---

## License

MIT.

---

*Built with Jac + byLLM + Claude Sonnet 4.6 by Harsh Prajapat.*
*This is a demo project, not medical advice. Always talk to a real clinician.*
