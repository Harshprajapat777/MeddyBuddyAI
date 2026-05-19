# Best Use of Jac — MeddyBuddyAI

A focused look at *how* MeddyBuddyAI uses the Jac language, for the **Best Use of Jac** sub-track of JacHacks Spring 2026.

The thesis: **MeddyBuddyAI is not a Python application that happens to be written in `.jac`. It's a Jac application — it leans on every primitive the language gives you, and most of the architecture only makes sense because Jac exists.** Below is the evidence, with line references into [`main.jac`](main.jac).

---

## 1. The graph IS the database

There's no `models.py`. There's no SQLAlchemy. There's no Postgres connection string. The persistent state of every user lives in their per-user Jac graph, automatically persisted by `jac start`.

```jac
node UserProfile {
    has name: str = "User";
    has email: str = "";
    has caregiver_email: str = "";
    has timezone: str = "Asia/Kolkata";
    ...
}

node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has active: bool = True;
    ...
}

node DoseLog { has med_name: str; has timestamp: str; has status: str; ... }
node Alert { has alert_id: str; has severity: str; has message: str; ... }
node NotificationLog { has reminder_id: str; has sent_at: str; ... }
```

The shape of a user's data:
```
root → UserProfile
        ├→ Medication → DoseLog
        ├→ Alert
        └→ NotificationLog
```

When the user logs a dose, we don't write a row to a table — we attach a `DoseLog` node to the relevant `Medication` with `target ++> log;`. When the agent fires a reminder email, the audit trail is a new `NotificationLog` node connected to the profile. The graph IS the database, and walking it is how every analytics query works.

**Why this matters for Jac specifically:** the same nodes are read by the byLLM tools, the CRUD walkers, the Digital Twin functions, AND surfaced in the REST API. One declaration, four consumers, zero ORM glue.

---

## 2. Walkers as REST endpoints (the `walker:pub` pattern)

Every external API endpoint in MeddyBuddyAI is a `walker:pub` archetype. `jac start` introspects them and exposes each as `POST /walker/<name>` automatically — with Bearer-token auth bolted in for free.

```jac
walker:pub add_medication {
    has med_name: str;
    has dosage: str;
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"status": "error", "message": "No user profile."};
        }
    }

    can add with UserProfile entry {
        already = False;
        for m in [here --> Medication] {
            if not isinstance(m, Medication) { continue; }
            if m.med_name.lower() == self.med_name.lower() and m.active {
                already = True;
                break;
            }
        }
        if already {
            report {"status": "exists", "med_name": self.med_name};
            disengage;
        }
        med = Medication(med_name=self.med_name, dosage=self.dosage, ...);
        here ++> med;
        report {"status": "added"};
    }
}
```

This walker is **21 lines and gives us a full REST endpoint with a dispatcher pattern**: untyped `can run with entry` fires on spawn (visits the user's UserProfile), then the typed `can add with UserProfile entry` fires when the visit lands. We have **21 of these** in `main.jac`, each a self-contained REST endpoint.

Compare to a FastAPI handler: you'd write the route, the request model, the response model, the dependency injection for the user, and the graph-access logic separately. Here, the walker IS all of those.

---

## 3. `by llm()` functions — declarative AI behavior

Jac lets you write a function signature and append `by llm()` instead of a body. The LLM implements the function at call time, with the signature as its contract.

```jac
sem meddy_buddy = """
You are MeddyBuddy, a warm and careful medication management assistant.
Hard rules:
- You are NOT a doctor. Never diagnose, prescribe, or change dosages.
- For any clinical question, recommend the user contact their clinician...
""";

def meddy_buddy(message: str) -> str
    by llm(
        conversation=chat_history,
        tools=[
            tool_get_my_medications,
            tool_add_medication_from_chat,
            tool_log_dose_taken_from_chat,
            tool_log_dose_skipped_from_chat,
            tool_check_drug_interaction,
            tool_get_adherence_summary,
            tool_current_time
        ],
        temperature=0.7
    );
```

There's no `function meddy_buddy` body in main.jac. There IS a `sem` block that becomes the system prompt, a `conversation=` argument that gives multi-turn memory, and a `tools=` list that gives the LLM the ability to call back into our graph. byLLM (the standard Jac LLM plugin) wires this into LiteLLM → Claude Sonnet 4.6.

We use **two such functions** in production:
- `meddy_buddy` — the main chat agent (uses `chat_history`)
- `meddy_onboarder` — a dedicated onboarding agent with its own focused `sem` prompt and its own `onboarding_history` glob list

And a **third** one for byLLM-generated *structured* output:
```jac
sem weekly_summary = """
Write a short, warm, plain-English weekly medication-management report...
- 4–6 sentences total.
- Lead with the most important number.
- Acknowledge wins before risks.
- End with one specific, achievable next step.
- Never diagnose. Never recommend dose changes.
""";

def weekly_summary(
    overall_score: int, adherence_pct: float,
    taken: int, expected: int, missed: int, skipped: int,
    top_risks: list[str], wins: list[str], trend: str
) -> str by llm(temperature=0.4);
```

That's it. No `OpenAI()` client, no message format wrangling, no JSON-schema-coercing. The function signature IS the prompt contract.

---

## 4. `sem` annotations on tools — telling the LLM the rules

Jac lets you attach a `sem` block to *any* declaration, and byLLM passes those annotations to the LLM as part of the tool description. That's how the LLM learns to call our tools correctly.

```jac
sem tool_add_medication_from_chat = """
Add a new medication for the user. Call this whenever the user
describes a med (name + dose + when to take it).

IMPORTANT — `times` is a LIST of 24-hour clock strings and you MUST
pass every clock time the user mentioned:
  - "every morning"      → times=["08:00"]
  - "8am and 8pm"        → times=["08:00", "20:00"]
  - "morning, noon, night" → times=["08:00", "12:00", "20:00"]
Do not rely on the default — explicitly pass the list.
""";

def tool_add_medication_from_chat(
    med_name: str,
    dosage: str,
    frequency: str = "daily",
    times: list[str] = ["08:00"]
) -> str {
    ...
}
```

This is what makes the LLM correctly parse *"Metformin 500mg twice a day at 8am and 8pm"* into `times=["08:00", "20:00"]` instead of just `["08:00"]`. The `sem` annotation is the few-shot prompt for that specific tool. No prompt-engineering code, no message templates — it's part of the function declaration.

The same pattern is used for:
- `sem meddy_buddy` — the main agent persona + safety rails
- `sem meddy_onboarder` — the onboarding flow's behaviour contract
- `sem weekly_summary` — the byLLM narrator's structural rules

Every safety rail in the project is one `sem` block. Add the rule once, every model call respects it.

---

## 5. Two byLLM agents, shared graph, isolated memory

The most "agentic" pattern in the codebase: **two separate byLLM agents that share the user's persistent graph but have isolated conversation histories.**

```jac
# Main chat agent
glob chat_history: list = [];
def meddy_buddy(message: str) -> str by llm(conversation=chat_history, tools=[...]);

# Dedicated onboarding agent — its own conversation, its own tools
glob onboarding_history: list = [];
def meddy_onboarder(message: str) -> str by llm(conversation=onboarding_history, tools=[
    tool_add_medication_from_chat,
    tool_get_my_medications,
    tool_current_time
]);
```

When a new user signs up, the frontend routes their chat to `onboarding_chat`, which calls `meddy_onboarder`. That agent has a focused tool set (just the ones needed to set up meds) and a tight `sem` prompt. Once the user taps "I'm done", the frontend switches to `meddy_chat`, which calls `meddy_buddy` — the full 7-tool main agent. Both agents see the same `Medication` and `DoseLog` nodes via direct graph reads in their tools — but they don't see each other's conversation history.

This is what "real agent orchestration" looks like in Jac. Each agent is a function. The function signatures + sem blocks are the contracts. The graph is the shared state.

---

## 6. `obj` for structured agent outputs

When we want a *structured* response (not free-form chat), we declare an `obj` and use it as the return type:

```jac
obj HealthScore {
    has score: int;
    has trend: str;
    has adherence_pct: float;
    has top_risks: list[str];
    has wins: list[str];
    has computed_at: str;
}

obj WeeklyReport {
    has period_days: int;
    has overall_score: int;
    has adherence_pct: float;
    has missed_doses: int;
    has top_patterns: list[str];
    has recommendations: list[str];
    has summary_text: str;
}
```

These objects are returned from walker reports and read by the React frontend (e.g., `HealthScoreCard.jsx` renders `top_risks` and `wins` directly). The Jac `obj` is a dataclass that round-trips through JSON for free — no Pydantic schema, no serializer.

---

## 7. Walker abilities — the dispatcher / visitor pattern

Every walker that needs to operate on a specific node type uses Jac's dispatcher + visitor pattern. The dispatcher fires on spawn, finds the right node, and visits it; the typed ability then does the work.

```jac
walker:pub log_dose {
    has med_name: str;
    has status: str = "taken";
    has note: str = "";

    can run with entry {                            # dispatcher (untyped — fires on spawn)
        profiles = [root --> UserProfile];
        if len(profiles) > 0 { visit profiles[0]; }
    }

    can record with UserProfile entry {             # visitor (typed — fires on visit)
        target = None;
        for med in [here --> Medication] {
            if not isinstance(med, Medication) { continue; }
            if med.med_name.lower() == self.med_name.lower() and med.active {
                target = med;
                break;
            }
        }
        if target is None {
            report {"status": "error"};
            disengage;
        }
        log = DoseLog(med_name=target.med_name, timestamp=str(datetime.now()), status=self.status);
        target ++> log;
        report {"status": "logged", "med_name": target.med_name};
    }
}
```

Inside the visitor:
- `here` = the current node being visited (`UserProfile`)
- `self` = the walker instance (has `med_name`, `status`, etc. from the request body)
- `[here --> Medication]` = traverse the graph
- `target ++> log` = attach a new node to an existing one via an outgoing edge

This pattern shows up in every walker that mutates a sub-node. Pure Python would need explicit pattern-matching, route-handler scaffolding, and ORM session management. In Jac it's three lines.

---

## 8. `report` — the walker's structured response channel

Walkers don't `return` — they `report`. Each `report` call adds an item to a queue that becomes `data.reports[]` in the HTTP response.

```jac
walker:pub get_adherence {
    has med_name: str = "";
    has days: int = 7;

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 { visit profiles[0]; }
        else { report {"days": self.days, "overall_adherence_pct": 0.0}; }
    }

    can compute with UserProfile entry {
        # ... compute per-med stats ...
        report {
            "days": self.days,
            "taken": total_taken,
            "skipped": total_skipped,
            "missed_estimate": total_missed,
            "overall_adherence_pct": overall,
            "per_medication": per_med
        };
    }
}
```

Two interesting properties:
1. **`report` is non-stopping** — a walker can report multiple times during a traversal, and all reports land in the response array. The collector walker pattern uses this to enumerate matching nodes.
2. **The HTTP response shape is the same for every walker** — `{ok, type, data: {result, reports}, error, meta}`. The frontend reads `data.reports[0]` and gets a typed payload. Uniform contract, zero per-endpoint serialization.

---

## 9. `++>` and `[here --> Type]` — graph mutation and traversal as one-liners

The whole language is built around the fact that you operate on a graph constantly. Two one-liners that show up everywhere in `main.jac`:

```jac
here ++> new_node;                  # attach new_node to here via an outgoing edge
profile ++> Medication(med_name="Aspirin", dosage="81mg");   # one-liner: create + attach
```

```jac
meds = [here --> Medication];                # all Medications connected from here
profiles = [root --> UserProfile];           # the user's profile node
logs = [med --> DoseLog];                    # all dose logs for a medication
```

These reads + writes are how the Digital Twin computes scores, how the chat tools answer "what am I on?", how the reminder walker finds the medication to remind about, how the caregiver-digest walker enumerates everything for the email. **Python equivalents would need at least an ORM session and a relationship spec.**

---

## 10. Per-user persistence, for free

Because `jac start` registers per-user roots, every authenticated request runs in the context of that user's graph. `root` inside a walker refers to *that user's* root — not a global one. `walker spawn` happens at the user's root by default.

This means:
- No `user_id` foreign keys to thread through every query
- No row-level security gymnastics
- A returning user logs in, gets their old token (we persist it in localStorage), and `[root --> UserProfile]` returns *their* profile — automatically scoped

The implementation is part of jaclang's runtime, but the **pattern** is uniquely Jac. We don't have a single `WHERE user_id = ?` anywhere in `main.jac`. Every query is implicitly scoped to the current user's root.

---

## Summary of Jac primitives in use

| Primitive | Where in main.jac | Count |
|-----------|------------------|-------|
| `node` | UserProfile, Medication, DoseLog, Reminder, NotificationLog, MedicalReport, ReportFinding, Alert, MoodEntry, SleepEntry | **10** |
| `walker:pub` | init_user, get_profile, update_profile, add_medication, get_medications, log_dose, get_dose_history, deactivate_medication, get_adherence, meddy_chat, clear_chat_history, onboarding_chat, clear_onboarding_history, health_score, get_alerts, generate_alerts, acknowledge_alert, weekly_report, send_test_email, send_reminder, send_caregiver_digest | **21** |
| `def ... by llm(...)` | meddy_buddy, meddy_onboarder, weekly_summary | **3** |
| `sem` annotation | meddy_buddy, meddy_onboarder, weekly_summary, tool_add_medication_from_chat | **4 (plus more inline)** |
| `obj` (structured output) | HealthScore, WeeklyReport | **2** |
| `glob` (shared state) | _model_name, llm, chat_history, onboarding_history | **4** |
| `can ... with NodeType entry` (typed visitor) | every multi-node walker | **15+** |
| `++>` graph mutation | every walker that writes | **20+ sites** |
| `[here --> NodeType]` traversal | every walker that reads | **30+ sites** |

That's the case for Best Use of Jac. The language isn't a syntactic skin over Python — it shaped every architectural decision in this project, and the project would look fundamentally different (and worse) without it.
