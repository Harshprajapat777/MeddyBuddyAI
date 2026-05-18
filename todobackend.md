# MeddyBuddyAI — Backend Build Plan (todobackend.md)

> Multi-agent AI healthcare platform built on **Jac 2.0 + byLLM + Claude Sonnet 4.6**.
> Submission deadline: **2026-05-19 10:00 AM EDT** (JacHacks Spring, Agentic AI track).

---

## 0. Reality Check — Scope vs Deadline

The full vision below is **9 agents + RAG + OCR + scheduler + email**. Honest estimate: 4–6 weeks of focused work for a team. We have ~24 hours.

To win the **Agentic AI flagship track**, judges care about:
- **Real autonomous behavior** (planning, tool use, memory across sessions, multi-step reasoning)
- **Creative/deep use of Jac** — not minimal usage
- **Technical execution** — does it actually work end-to-end in the demo?

A polished 3-agent system with real orchestration beats a half-broken 9-agent system every time. The plan below is structured so we **ship Phase 1, demo it, then keep building** if time allows.

### Phase 1 — Hackathon MVP (ship by 10 AM EDT, May 19)
Must work end-to-end in the 3-min demo video:

| # | Agent | Why it's in MVP |
|---|-------|----------------|
| 1 | **Orchestrator Agent** | Core "agentic" claim — routes to sub-agents |
| 2 | **Conversational Health Chatbot** | The user-facing surface, multi-turn memory |
| 3 | **Medication Agent** (original MeddyBuddy core) | Already spec'd in detail in FEATURES.md |
| 4 | **Smart Reminder Agent** (basic) | Schedules + Brevo email delivery |
| 5 | **OCR Report Analysis Agent** (single-shot) | Visually impressive in demo, judges love it |
| 6 | **Digital Health Twin** (lightweight) | The "wow" differentiator |

### Phase 2 — Post-hackathon (cut from MVP)
- Health Coach Agent (#5 in vision)
- Mood Tracker Agent (#6)
- Sleep Intelligence Agent (#7)
- Elder Care / Mental Health / Corporate Wellness Agent (#8)
- Vector DB-backed RAG (Phase 1 uses simple in-memory retrieval)
- Behavioral trend analysis, weekly reports, family alerts

### What we will simulate (not fully build) for the demo
- Real-time event-driven notifications → demo as Brevo emails on a 1-minute "fast clock"
- Long-term behavioral data → seed the graph with 7 days of fake history at startup
- Vector DB RAG → small JSON corpus of medical Q&A with simple embedding lookup

---

## 1. System Architecture

```
                          ┌─────────────────────────────┐
                          │   Frontend (separate folder) │
                          └──────────────┬──────────────┘
                                         │ POST /walker/*
                          ┌──────────────▼──────────────┐
                          │      Orchestrator Agent     │
                          │   (intent → sub-agent)      │
                          └──┬───┬───┬───┬───┬───┬──────┘
                             │   │   │   │   │   │
              ┌──────────────┘   │   │   │   │   └──────────────┐
              ▼                  ▼   ▼   ▼   ▼                  ▼
        Chatbot Agent     Medication   Reminder  OCR      Digital Twin
                            Agent       Agent    Agent      Agent
              │                  │       │        │            │
              └──────────────────┴───────┴────────┴────────────┘
                                         │
                                ┌────────▼──────────┐
                                │  Shared Graph     │
                                │  (Jac persistence)│
                                │  + RAG corpus     │
                                │  + Brevo client   │
                                └───────────────────┘
```

**Single Jac backend** — `jac start main.jac` spins up FastAPI with all walkers exposed at `POST /walker/<name>`. Frontend talks to this one server.

---

## 2. File Layout

```
MeddyBuddyAI/
├── main.jac                    # entry point — seeds graph, mounts walkers
├── jac.toml                    # claude-sonnet-4-6, port 8000
├── .env.example                # ANTHROPIC_API_KEY, BREVO_API_KEY
├── requirements.txt            # jaseci, byllm, requests, python-dotenv, pytesseract, pdfplumber, sentence-transformers
├── README.md                   # quickstart + demo curl examples
│
├── models/
│   ├── user.jac                # UserProfile, HealthSnapshot
│   ├── medication.jac          # Medication, DoseLog
│   ├── reminder.jac            # Reminder, NotificationLog
│   ├── report.jac              # MedicalReport, ReportFinding
│   ├── mood.jac                # MoodEntry (Phase 2)
│   ├── sleep.jac               # SleepEntry (Phase 2)
│   └── edges.jac               # has_medication, has_log, has_reminder, has_report, has_twin
│
├── agents/
│   ├── orchestrator.jac        # master agent — routes intent to sub-agents
│   ├── chatbot.jac             # conversational agent + multi-turn memory
│   ├── medication_agent.jac    # 7 tools (from original spec)
│   ├── reminder_agent.jac      # scheduling logic + Brevo dispatch
│   ├── ocr_agent.jac           # PDF/image → text → structured findings
│   └── digital_twin.jac        # health-score engine + predictive insights
│
├── walkers/
│   ├── crud_user.jac           # init_user, get_profile
│   ├── crud_medication.jac     # add/get/log/deactivate medication
│   ├── crud_reminder.jac       # create/list/cancel reminder
│   ├── crud_report.jac         # upload_report, get_reports
│   ├── chat.jac                # POST /walker/chat → orchestrator
│   └── twin.jac                # GET /walker/health_score, /weekly_report
│
├── lib/
│   ├── rag.jac                 # tiny RAG: load med Q&A, embed, cosine search
│   ├── brevo.jac               # Brevo email client wrapper
│   ├── ocr.jac                 # pytesseract + pdfplumber wrapper
│   ├── scheduler.jac           # cron-like reminder firing (background thread)
│   └── safety.jac              # safety-rail prompt fragments
│
├── data/
│   ├── seed_history.json       # fake 7-day mood/sleep/dose data for demo
│   └── med_corpus.json         # ~50 medical Q&A pairs for RAG
│
├── FEATURES.md                 # (already exists)
└── todobackend.md              # (this file)
```

---

## 3. Phase 1 MVP — Agents & Submodules

### 3.1 Orchestrator Agent (`agents/orchestrator.jac`)

**Purpose:** Master agent. Receives user message, decides which sub-agent(s) to call, composes final response.

**Submodules:**
- `parse_intent(message) -> Intent` — `by llm(temperature=0.0)`; returns enum {medication, reminder, report, chat, twin_query, multi}
- `route_to_agent(intent, message)` — dispatch table to sub-agent walkers
- `compose_response(sub_agent_outputs) -> str` — `by llm()`; merges multiple sub-agent outputs into one human reply
- `glob orchestrator_history: list` — top-level conversation memory shared across agents

**Walker:** `chat_walker` → `POST /walker/chat` body `{user_message: str}`

---

### 3.2 Conversational Health Chatbot Agent (`agents/chatbot.jac`)

**Purpose:** General health Q&A with RAG-backed answers + citations.

**Submodules:**
- `chatbot_respond(message) -> ChatResponse` — `by llm(conversation=chat_hist, tools=[rag_search, current_time])`
- `obj ChatResponse { has answer: str; has citations: list[str]; has followups: list[str]; has risk_level: str; }` — structured output
- `tool_rag_search(query) -> list[Citation]` — calls `lib/rag.jac`
- `sem chatbot_respond = "…"` — persona prompt with safety rails (always refers to clinician, never diagnoses)

---

### 3.3 Medication Agent (`agents/medication_agent.jac`)

**Already fully spec'd in [FEATURES.md](FEATURES.md).** Build as defined there. Summary:

**Submodules:**
- Graph: `UserProfile -[has_medication]→ Medication -[has_log]→ DoseLog`
- 7 CRUD walkers: `init_user`, `add_medication`, `get_medications`, `log_dose`, `get_dose_history`, `deactivate_medication`, `get_adherence`
- 7 LLM tools: `tool_get_my_medications`, `tool_add_medication`, `tool_log_dose_taken`, `tool_log_dose_skipped`, `tool_check_drug_interaction` (OpenFDA), `tool_get_adherence`, `tool_current_time`
- `obj MedIntent` structured output for the fast-path classifier

---

### 3.4 Smart Reminder & Notification Agent (`agents/reminder_agent.jac`)

**Purpose:** Conversational scheduling + actual email delivery via Brevo.

**Submodules:**
- **Onboarding flow** — `ask_lifestyle_questions()` walker that asks 3–5 questions (sleep time, meds taken daily, forgetfulness) and seeds reminders
- **Schedule engine** — `lib/scheduler.jac` background thread checks every 30s for due reminders, fires them
- **Reminder types** — medication, hydration, sleep, exercise, doctor-followup (enum)
- **Personalization** — `personalize_reminder_text(reminder) -> str` `by llm()` — generates warm, custom message
- **Brevo dispatcher** — `lib/brevo.jac` calls Brevo transactional email API
- **Notification log** — `NotificationLog` node tracks sent/delivered/opened
- **Demo mode** — env var `FAST_CLOCK=1` makes reminders fire on 1-minute granularity so the demo video can show real notifications

**Walkers:**
- `POST /walker/schedule_reminder` `{type, time, message?}`
- `POST /walker/list_reminders`
- `POST /walker/cancel_reminder {id}`
- `POST /walker/onboarding_chat` — conversational reminder setup

---

### 3.5 OCR Medical Report Analysis Agent (`agents/ocr_agent.jac`)

**Purpose:** Upload a PDF/image of a medical report → structured findings with citations.

**Submodules:**
- **Upload walker** — `POST /walker/upload_report` accepts base64 PDF/image, stores under `data/uploads/`
- **OCR pipeline** — `lib/ocr.jac`: `pytesseract` for images, `pdfplumber` for PDFs → raw text
- **Entity extraction** — `extract_medical_entities(text) -> list[Entity]` `by llm()`; pulls lab values, drug names, diagnoses
- **Abnormality detection** — `flag_abnormal_values(entities) -> list[Flag]` (rule-based + LLM)
- **Structured report output** — `obj ReportAnalysis { has summary; has symptoms_found; has medical_flags; has followup_recs; has precautions; has citations; has severity: str; }`
- **Graph storage** — saves as `MedicalReport` node attached to user with `ReportFinding` children

**Demo:** Upload a sample blood report PDF → instant structured analysis on screen.

---

### 3.6 Digital Health Twin Agent (`agents/digital_twin.jac`) — **the differentiator**

**Purpose:** Predictive + proactive layer. Computes a health score and surfaces patterns.

**Submodules:**
- **Health score engine** — `compute_health_score(user) -> HealthScore` (0–100) — weighted blend of: medication adherence %, recent mood (Phase 2 stub), reminder compliance, report severity flags
- **Pattern detector** — `detect_patterns(history) -> list[Insight]` `by llm()`; reads last 7 days of dose/mood/sleep graph data
- **Proactive alert generator** — `generate_alerts() -> list[Alert]` — runs daily, posts to graph as `Alert` nodes for the frontend to surface
- **Weekly report** — `generate_weekly_report() -> WeeklyReport` `by llm()` — structured object with score, trends, recommendations, citations
- **`obj HealthScore { has score: int; has trend: str; has top_risks: list[str]; has wins: list[str]; }`**
- **`obj Alert { has severity: str; has message: str; has suggested_action: str; }`**

**Walkers:**
- `POST /walker/health_score`
- `POST /walker/weekly_report`
- `POST /walker/alerts`

**Demo angle:** "Your adherence dropped 18% this week. Your stress pattern suggests burnout risk." — said proactively, without the user asking.

---

## 4. Phase 1 MVP — Shared Infrastructure

### 4.1 RAG Pipeline (`lib/rag.jac`)
- **Corpus:** `data/med_corpus.json` — ~50 hand-curated medical Q&A entries (sourced from OpenFDA + WHO patient leaflets)
- **Embedding:** `sentence-transformers/all-MiniLM-L6-v2` (small, runs on CPU, no API call)
- **Storage:** on-disk pickle of `{text, embedding}` list — no real vector DB needed for 50 docs
- **Search:** cosine-similarity top-3
- **Citations:** each retrieved chunk has a `source_url` field passed to the LLM
- **Tool:** `tool_rag_search(query) -> list[Citation]`

### 4.2 Brevo Email (`lib/brevo.jac`)
- Wraps `POST https://api.brevo.com/v3/smtp/email`
- Reads `BREVO_API_KEY` from env
- `send_email(to, subject, html_body) -> bool`
- Used by reminder agent + weekly digital-twin report

### 4.3 OCR (`lib/ocr.jac`)
- `extract_text_from_pdf(path) -> str` via `pdfplumber`
- `extract_text_from_image(path) -> str` via `pytesseract`
- `extract_text(path) -> str` — sniffs extension, dispatches

### 4.4 Scheduler (`lib/scheduler.jac`)
- Background thread (Python `threading.Timer` loop)
- Polls graph for due `Reminder` nodes every 30s
- Fires Brevo email + writes `NotificationLog`
- Started from `with entry` block in `main.jac`

### 4.5 Safety Rails (`lib/safety.jac`)
- Shared prompt fragments injected via `sem` annotations:
  - "Never diagnose. Always recommend consulting a clinician."
  - "Never fabricate drug interactions — only report what OpenFDA / RAG returns."
  - "Refuse dosing-change requests. Redirect to provider."

---

## 5. Phase 1 MVP — Walker → Endpoint Map

| Walker | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| `init_user` | `POST /walker/init_user` | `{user_name?}` | Create UserProfile (idempotent) |
| `chat_walker` | `POST /walker/chat` | `{user_message}` | Main entry — orchestrator routes |
| `add_medication` | `POST /walker/add_medication` | `{med_name, dosage, frequency, times}` | CRUD |
| `get_medications` | `POST /walker/get_medications` | `{}` | CRUD |
| `log_dose` | `POST /walker/log_dose` | `{med_name, status}` | CRUD |
| `get_dose_history` | `POST /walker/get_dose_history` | `{med_name?}` | CRUD |
| `deactivate_medication` | `POST /walker/deactivate_medication` | `{med_name}` | CRUD |
| `get_adherence` | `POST /walker/get_adherence` | `{med_name?}` | Analytics |
| `schedule_reminder` | `POST /walker/schedule_reminder` | `{type, time, message?}` | Scheduling |
| `list_reminders` | `POST /walker/list_reminders` | `{}` | Scheduling |
| `cancel_reminder` | `POST /walker/cancel_reminder` | `{id}` | Scheduling |
| `onboarding_chat` | `POST /walker/onboarding_chat` | `{user_message}` | Conversational reminder setup |
| `upload_report` | `POST /walker/upload_report` | `{filename, base64_content}` | OCR |
| `get_reports` | `POST /walker/get_reports` | `{}` | OCR |
| `health_score` | `POST /walker/health_score` | `{}` | Digital Twin |
| `weekly_report` | `POST /walker/weekly_report` | `{}` | Digital Twin |
| `alerts` | `POST /walker/alerts` | `{}` | Digital Twin |

**17 endpoints. All auto-documented at `http://localhost:8000/docs`.**

---

## 6. Phase 1 MVP — Build Order (24-hour timeline)

Estimated effort; adjust as we go.

| Hour | Task | Deliverable |
|------|------|-------------|
| 0–1 | Project scaffold | `jac.toml`, `requirements.txt`, `.env.example`, empty stubs |
| 1–3 | Models + Medication agent CRUD | All 7 medication walkers working via curl |
| 3–4 | Medication agent LLM tools + chat | `meddy_chat` works in isolation |
| 4–5 | Brevo client + Scheduler skeleton | Can fire a test email |
| 5–7 | Reminder agent + walkers | Conversational reminder onboarding works |
| 7–9 | OCR pipeline + upload walker | Upload PDF → structured findings |
| 9–11 | RAG corpus + Chatbot agent | RAG-backed answers with citations |
| 11–13 | Orchestrator agent | Single `/walker/chat` routes to all sub-agents |
| 13–15 | Digital Twin agent | Health score + weekly report + alerts |
| 15–16 | Seed data + end-to-end smoke test | Demo flow runs clean |
| 16–18 | README + demo video script | Both ready |
| 18–20 | Record + edit 3-min demo video | Submitted on Devpost |
| 20–24 | Buffer / polish / frontend if time | — |

---

## 7. Phase 2 — Deferred Agents (NOT in MVP)

These stay in the spec but are stubbed-out node types only, no walkers, no demo coverage:

| Agent | Stub status |
|-------|-------------|
| AI Health Coach | `HealthCoachSession` node defined, no walker |
| Mood Tracker | `MoodEntry` node defined, no walker |
| Sleep Intelligence | `SleepEntry` node defined, no walker |
| Elder Care / Mental Health / Corporate Wellness | combined node `WellnessProfile`, no walker |

Why kept as stubs: lets Digital Twin reference them (e.g., reads `MoodEntry` if any exist from seeded demo data) without committing to building the agent. Easy to expand post-hackathon.

---

## 8. Submission Checklist (Tuesday, May 19, 10 AM EDT)

- [ ] All Phase 1 walkers return correct JSON via curl
- [ ] `jac start main.jac` boots clean from a fresh `pip install`
- [ ] `.env.example` documents required keys
- [ ] README has 5-line quickstart + `curl` examples for each demo step
- [ ] GitHub repo pushed, public
- [ ] 3-min demo video shows: onboarding chat → med added → dose logged → OCR upload → digital-twin alert → Brevo email arrives
- [ ] Devpost submission filled in (description, what-it-does, how-built, challenges, tech tags = Jac, byLLM, Anthropic, Brevo, FastAPI)
- [ ] Track selected: **Agentic AI** (flagship, $600/$400)
- [ ] Optional track also: **Consumer Healthcare** (only if rules allow dual submission — re-read the rules)

---

## 9. Decisions Locked (2026-05-18)

| # | Question | Decision | Implication |
|---|----------|----------|-------------|
| 1 | MVP scope | **5-agent cut approved** (orchestrator + chatbot + medication + reminder + OCR + twin) | Phase 2 agents stay as stub node types only |
| 2 | Brevo email | **User will set up, key pasted later** | Build reminder agent expecting `BREVO_API_KEY`; code gracefully degrades to console-log if key missing during dev |
| 3 | OCR strategy | **PDF-only via pdfplumber** — no Tesseract | OCR agent rejects image uploads with a clear error; demo uses a sample PDF report. Drop `pytesseract` from `requirements.txt` |
| 4 | Frontend | **Backend-first, minimal HTML+JS chat UI in buffer hours** | Hours 0–16 = backend depth. Hours 18–22 buffer = single-page chat UI if backend is solid |
| 5 | Auth | **Single-user, no auth** | One graph = one user. Skip session management |

---

**Status:** spec reviewed and approved. Decisions locked. Code generation cleared to start.
**Next:** scaffold `jac.toml`, `requirements.txt`, `.env.example`, `models/`.
