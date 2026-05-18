# MeddyBuddyAI — Feature Spec

A conversational AI agent for medication management, built with **Jac 2.0** + **byLLM** + **Claude Sonnet 4.6**. The agent remembers your meds across sessions (graph persistence), logs doses, and answers questions about your regimen using tools.

---

## 1. Goal

A single backend (`jac start`) that exposes a chat endpoint + structured CRUD endpoints. Users can talk to MeddyBuddy naturally ("I just took my aspirin", "what am I on?", "is ibuprofen safe with my metformin?") and the agent picks the right tool — or answer CRUD calls directly from a frontend.

---

## 2. User Stories

| # | As a user… | I want to… | So that… |
|---|------------|-----------|----------|
| 1 | Patient | Add a medication with dose + schedule | The agent knows my regimen |
| 2 | Patient | Log when I take or skip a dose | I can track adherence |
| 3 | Patient | Ask "what am I on?" in plain English | I don't need to remember |
| 4 | Patient | Ask about drug interactions | I avoid harmful combinations |
| 5 | Patient | See my adherence (taken vs missed) | I know if I'm slipping |
| 6 | Patient | Have the agent remember context across turns | I don't repeat myself |
| 7 | Patient | Deactivate a medication I no longer take | It stops cluttering my list |

---

## 3. Feature List

### 3.1 Graph Data Model (`models.jac`)
- **`UserProfile`** — name, created_at
- **`Medication`** — med_name, dosage, frequency, times[], notes, active, added_at
- **`DoseLog`** — med_name, timestamp, status (taken | skipped | missed), note
- **Edges:** `has_medication`, `has_log`
- **Shape:** `root --> UserProfile -[has_medication]-> Medication -[has_log]-> DoseLog`

### 3.2 CRUD Walkers (`walkers.jac`) — auto-exposed as REST
| Walker | Method | Purpose |
|--------|--------|---------|
| `init_user` | POST `/walker/init_user` | Create UserProfile on first run (idempotent) |
| `add_medication` | POST `/walker/add_medication` | Attach a new Medication node |
| `get_medications` | POST `/walker/get_medications` | List active medications |
| `log_dose` | POST `/walker/log_dose` | Append DoseLog (taken / skipped) |
| `get_dose_history` | POST `/walker/get_dose_history` | Return logs for a med or all |
| `deactivate_medication` | POST `/walker/deactivate_medication` | Soft-delete (`active = false`) |
| `get_adherence` | POST `/walker/get_adherence` | taken / missed counts + % |

### 3.3 Conversational Agent (`agent.jac`)
- **`meddy_buddy(message)`** — `by llm()` function with:
  - **`conversation=chat_history`** — multi-turn memory
  - **`tools=[…]`** — see 3.4
  - **`temperature=0.7`** — warm but consistent
  - **`sem`** annotation — persona: caring, medication-focused, always defers to clinicians
- **`meddy_chat` walker** — POST `/walker/meddy_chat` body `{user_message: str}` → wraps `meddy_buddy()`

### 3.4 LLM Tools (`agent.jac`)
Tools bridge the agent to the graph + the outside world.

| Tool | What it does |
|------|--------------|
| `tool_get_my_medications()` | Reads graph → human-readable med list |
| `tool_add_medication(name, dose, freq)` | Adds a med to the graph from chat |
| `tool_log_dose_taken(name)` | Appends DoseLog status=taken |
| `tool_log_dose_skipped(name, reason)` | Appends DoseLog status=skipped |
| `tool_check_drug_interaction(d1, d2)` | OpenFDA `/drug/label.json` lookup |
| `tool_get_adherence(name)` | Computes % adherence for the last N logs |
| `tool_current_time()` | "Now" for the LLM (avoids hallucinated times) |

### 3.5 Structured Output (`agent.jac`)
- **`obj MedIntent`** — action enum + medication + dosage + status fields
- **`parse_intent(message)`** — `by llm(temperature=0.0)` — optional fast-path classifier the frontend can call when it wants structured JSON instead of free-form chat

### 3.6 Persistence
- `jac start` auto-persists the graph in SQLite under `.jac/data/`
- Survives server restarts → MeddyBuddy "remembers" your regimen

### 3.7 Safety Rails (prompt)
- Always recommends consulting a clinician
- Never claims to be a doctor
- Never fabricates drug-interaction data (only reports what OpenFDA returns)
- Politely refuses dosing changes — directs user to their provider

---

## 4. File Layout

```
MeddyBuddyAI/
├── main.jac              # entry point — init_user on cold start
├── models.jac            # nodes + edges
├── walkers.jac           # CRUD walkers (REST endpoints)
├── agent.jac             # byLLM agent + tools + chat walker
├── jac.toml              # model = claude-sonnet-4-6, port 8000
├── .env.example          # ANTHROPIC_API_KEY=...
├── .gitignore            # (already present)
├── requirements.txt      # jaseci, byllm, requests, python-dotenv
├── FEATURES.md           # ← this file
├── README.md             # quickstart + curl examples
└── jac/                  # (existing reference docs)
```

---

## 5. API Surface (after `jac start main.jac`)

```bash
# CRUD
POST /walker/add_medication       {med_name, dosage, frequency, times}
POST /walker/get_medications      {}
POST /walker/log_dose             {med_name, status}
POST /walker/get_dose_history     {med_name?}
POST /walker/deactivate_medication {med_name}
POST /walker/get_adherence        {med_name}

# Chat
POST /walker/meddy_chat           {user_message}
POST /walker/parse_intent_walker  {user_message}   # optional structured route

# Docs
GET  /docs                        Swagger UI
GET  /graph                       Graph visualizer
```

---

## 6. Tech Stack

| Layer | Choice |
|-------|--------|
| Language | Jac 2.0 |
| LLM | Claude Sonnet 4.6 (via byLLM) |
| Backend server | `jac start` (FastAPI under the hood) |
| Persistence | Auto SQLite (`.jac/data/graph.db`) |
| External API | OpenFDA drug label (free, no key) |
| Frontend | Not in scope this round — any client can `fetch` the walker endpoints |

---

## 7. Out of Scope (v1)

- Authentication / multi-user (single graph, single user for now)
- Push notifications / reminders (no scheduler yet — could add via cron walker later)
- Frontend UI (a React/HTML frontend can be layered on after the API is stable)
- HIPAA-grade encryption (this is a demo)

---

## 8. Acceptance Criteria

- `jac start main.jac` boots without errors
- `curl /walker/init_user` creates a UserProfile (idempotent on restart)
- Adding a med via REST and via chat both land in the same graph
- `meddy_chat` correctly invokes `tool_get_my_medications` when asked "what am I on?"
- Drug-interaction tool returns OpenFDA text or a safe fallback message
- Graph survives a server restart (data persists)
