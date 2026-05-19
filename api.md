# MeddyBuddyAI — API Reference

Base URL (local dev): `http://localhost:8000`

Every walker endpoint requires `Authorization: Bearer <token>`. Get a token from `/user/register` or `/user/login`.

---

## Universal response envelope

**Every** response from `/walker/*` and `/user/*` is wrapped in this shape:

```jsonc
{
  "ok": true,                    // boolean — true on success
  "type": "response",            // "response" on success, "error" on failure
  "data": {                      // payload (see per-endpoint shapes below)
    "result": { ... },           // the walker instance (use for echo of input fields)
    "reports": [ ... ]           // ← THIS is what the UI should read for output
  },
  "error": null,                 // null on success, error string on failure
  "meta": { "extra": { "http_status": 200 } }
}
```

### Reading the payload (frontend pattern)

```ts
// Always go through data.reports[0] for the walker's actual output
const resp = await fetch(`${BASE}/walker/init_user`, { ... });
const json = await resp.json();
if (!json.ok) {
  // Show error: json.error or json.data?.error
  return;
}
const payload = json.data?.reports?.[0];     // ← the real data
```

### Error response

If a walker throws, the wrapper still returns HTTP 200 but with `data.error`:

```jsonc
{
  "ok": true,
  "type": "response",
  "data": {
    "error": "AttributeError: 'Foo' object has no attribute 'bar'",
    "traceback": "Traceback (most recent call last)..."
  },
  "error": null,
  "meta": { "extra": { "http_status": 200 } }
}
```

Auth failures return HTTP 200 with `{"error": "Unauthorized"}` at the **top level** (no `ok`/`data` wrapper):

```jsonc
{ "error": "Unauthorized" }
```

---

## Authentication

### POST `/user/register`

Create a new user. Returns a Bearer token and the user's `root_id` (their personal graph root).

**Request body:**
```jsonc
{
  "identities": [{ "type": "username", "value": "harsh" }],
  "credential": { "type": "password", "password": "hackathon123" }
}
```

**Success response (HTTP 201):**
```jsonc
{
  "ok": true,
  "type": "response",
  "data": {
    "username": "harsh",
    "token": "BsViAnH3w2H1Tv6i-Uz9ITAdqzEAc7IXMhYGqD-eIW8",
    "root_id": "19319367d5614b4688543a114b2b9817"
  },
  "error": null,
  "meta": { "extra": { "http_status": 201 } }
}
```

**Error:** `{"error": "Username already exists"}` if duplicate.

### POST `/user/login`

**Request body:**
```jsonc
{
  "identity": { "type": "username", "value": "harsh" },
  "credential": { "type": "password", "password": "hackathon123" }
}
```

**Success response (HTTP 200):** Same shape as register — returns `token` and `root_id`.

### GET `/user/info`

Returns the authenticated user. Requires `Authorization: Bearer <token>`.

**Response:**
```jsonc
{
  "ok": true,
  "data": { "username": "harsh", "root_id": "1931..." },
  ...
}
```

---

## User profile walkers

All walker endpoints below require `Authorization: Bearer <token>`. POST body is JSON.

### POST `/walker/init_user`

Creates a `UserProfile` node under the user's root. Idempotent — calling twice returns `"exists"`.

**Request:**
```jsonc
{
  "user_name": "Harsh",           // optional, default "User"
  "email": "harsh@example.com",   // optional, default ""
  "timezone": "Asia/Kolkata"      // optional, default "Asia/Kolkata"
}
```

**`data.reports[0]` — first run:**
```jsonc
{ "status": "created", "name": "Harsh" }
```

**`data.reports[0]` — subsequent calls:**
```jsonc
{ "status": "exists", "name": "Harsh", "email": "harsh@example.com" }
```

### POST `/walker/get_profile`

**Request:** `{}`

**`data.reports[0]` — when profile exists:**
```jsonc
{
  "name": "Harsh",
  "email": "harsh@example.com",
  "timezone": "Asia/Kolkata",
  "sleep_time": "23:00",
  "wake_time": "07:00",
  "created_at": "2026-05-19 09:20:47.825149"
}
```

**`data.reports[0]` — when no profile:**
```jsonc
{ "status": "no_profile" }
```

### POST `/walker/update_profile`

Partial update — only provided fields are written.

**Request (all fields optional):**
```jsonc
{
  "email": "new@example.com",
  "timezone": "America/New_York",
  "sleep_time": "22:30",
  "wake_time": "06:30"
}
```

**`data.reports[0]`:**
```jsonc
{ "status": "updated" }
```

---

## Medication CRUD walkers

### POST `/walker/add_medication`

**Request:**
```jsonc
{
  "med_name": "Aspirin",                   // required
  "dosage": "81mg",                        // required
  "frequency": "daily",                    // optional, default "daily" — also "twice_daily", "three_times_daily", "as_needed", "weekly"
  "times": ["08:00"],                      // optional, default ["08:00"]
  "notes": "Take with food"                // optional, default ""
}
```

**`data.reports[0]` — success:**
```jsonc
{ "status": "added", "med_name": "Aspirin", "dosage": "81mg" }
```

**`data.reports[0]` — duplicate:**
```jsonc
{ "status": "exists", "med_name": "Aspirin" }
```

**`data.reports[0]` — no profile:**
```jsonc
{ "status": "error", "message": "No user profile. Call init_user first." }
```

### POST `/walker/get_medications`

**Request:**
```jsonc
{ "include_inactive": false }              // optional, default false
```

**`data.reports[0]`:**
```jsonc
{
  "medications": [
    {
      "med_name": "Aspirin",
      "dosage": "81mg",
      "frequency": "daily",
      "times": ["08:00"],
      "notes": "",
      "active": true,
      "added_at": "2026-05-19 09:22:48.921677"
    },
    {
      "med_name": "Metformin",
      "dosage": "500mg",
      "frequency": "twice_daily",
      "times": ["08:00", "20:00"],
      "notes": "",
      "active": true,
      "added_at": "2026-05-19 09:22:49.030375"
    }
  ],
  "count": 2
}
```

### POST `/walker/log_dose`

**Request:**
```jsonc
{
  "med_name": "Aspirin",        // required
  "status": "taken",            // optional, default "taken" — also "skipped"
  "note": ""                    // optional, default ""
}
```

**`data.reports[0]` — success:**
```jsonc
{ "status": "logged", "med_name": "Aspirin", "dose_status": "taken" }
```

**`data.reports[0]` — med not found:**
```jsonc
{ "status": "error", "message": "Medication not found: XYZ" }
```

### POST `/walker/get_dose_history`

Newest-first dose log, optionally filtered to one medication.

**Request:**
```jsonc
{
  "med_name": "",                          // optional, "" returns all
  "limit": 50                              // optional, default 50
}
```

**`data.reports[0]`:**
```jsonc
{
  "logs": [
    {
      "med_name": "Aspirin",
      "timestamp": "2026-05-19 09:40:12.345678",
      "status": "taken",                   // "taken" or "skipped"
      "note": ""
    }
  ],
  "count": 1
}
```

### POST `/walker/deactivate_medication`

Soft-delete (sets `active = false`).

**Request:**
```jsonc
{ "med_name": "Aspirin" }
```

**`data.reports[0]`:**
```jsonc
{ "status": "deactivated", "med_name": "Aspirin" }
```
or
```jsonc
{ "status": "error", "message": "Active medication not found: XYZ" }
```

### POST `/walker/get_adherence`

**Request:**
```jsonc
{
  "med_name": "",                          // optional, "" = all meds
  "days": 7                                // optional, default 7
}
```

**`data.reports[0]`:**
```jsonc
{
  "days": 7,
  "taken": 2,
  "skipped": 0,
  "missed_estimate": 19,
  "overall_adherence_pct": 9.5,
  "per_medication": {
    "Aspirin": {
      "taken": 1,
      "skipped": 0,
      "missed_estimate": 6,
      "expected": 7,
      "adherence_pct": 14.3
    },
    "Metformin": {
      "taken": 0,
      "skipped": 0,
      "missed_estimate": 14,
      "expected": 14,
      "adherence_pct": 0.0
    }
  }
}
```

---

## Conversational agent (byLLM)

### POST `/walker/meddy_chat`

The marquee endpoint. Sends a message to Claude Sonnet 4.6 with 7 tools attached. The LLM picks tools, the tools read/write the user's graph, and the LLM composes a warm reply. Multi-turn memory is preserved server-side via a global `chat_history` list.

**Request:**
```jsonc
{ "user_message": "What medications am I on?" }
```

**`data.reports[0]` — success:**
```jsonc
{
  "status": "ok",
  "response": "Here's your current medication schedule! 💊\n\n| Medication | Dose | …"
}
```

The `response` field is **markdown** and may contain emojis. Render with `react-markdown` + `remark-gfm`. Always treat it as untrusted (it comes from an LLM), so sanitize before rendering as HTML.

**`data.reports[0]` — error:**
```jsonc
{ "status": "error", "message": "LLM error: rate limit / auth / etc" }
```

**`data.reports[0]` — empty input:**
```jsonc
{ "status": "error", "message": "Empty message" }
```

**Example exchanges** (user input → LLM-picked tool → reply summary):

| User says | LLM picks tool | Effect |
|-----------|----------------|--------|
| "What am I on?" | `tool_get_my_medications` | Markdown table of meds |
| "I just took my aspirin" | `tool_log_dose_taken_from_chat("aspirin")` | Logs DoseLog, confirms with timestamp |
| "I skipped metformin because I felt nauseous" | `tool_log_dose_skipped_from_chat("metformin", "nauseous")` | Logs skipped + reason |
| "Add lisinopril 10mg daily" | `tool_add_medication_from_chat(…)` | Creates Medication node |
| "Is ibuprofen safe with metformin?" | `tool_check_drug_interaction` | OpenFDA lookup |
| "How am I doing?" | `tool_get_adherence_summary` | Last-7-days breakdown |

### POST `/walker/clear_chat_history`

Resets the global `chat_history`. Use this when starting a fresh demo.

**Request:** `{}`

**`data.reports[0]`:**
```jsonc
{ "status": "cleared" }
```

---

## Digital Health Twin walkers

### POST `/walker/health_score`

**Request:** `{}`

**`data.reports[0]`:**
```jsonc
{
  "score": 10,                                       // integer 0-100
  "trend": "stable",                                 // "improving" | "stable" | "declining"
  "adherence_pct": 9.5,                              // float 0.0-100.0 (last 7 days)
  "top_risks": [                                     // string list, may be empty
    "Aspirin: 28.6% adherence this week",
    "Metformin: 0.0% adherence this week"
  ],
  "wins": [                                          // string list, may be empty
    "Aspirin: 95.0% adherence — strong consistency"
  ],
  "computed_at": "2026-05-19 09:44:01.131471"        // ISO-ish datetime
}
```

### POST `/walker/generate_alerts`

Refreshes the proactive-alert inbox. Reads current risks from `health_score`, attaches them as `Alert` nodes to the UserProfile, skipping any whose message text matches an existing un-acknowledged alert. Call this on a timer (e.g., daily) or before showing the alert inbox.

**Request:** `{}`

**`data.reports[0]`:**
```jsonc
{
  "status": "ok",
  "score": 10,
  "trend": "stable",
  "new_alerts": [                                    // list of newly-created alert messages
    "Aspirin: 28.6% adherence this week",
    "Metformin: 0.0% adherence this week"
  ],
  "count": 2
}
```

### POST `/walker/get_alerts`

**Request:**
```jsonc
{ "include_acknowledged": false }                    // optional, default false
```

**`data.reports[0]`:**
```jsonc
{
  "alerts": [
    {
      "alert_id": "1779164131.873687",               // string (timestamp-derived)
      "severity": "warning",                         // "info" | "warning" | "high"
      "category": "adherence",                       // "adherence" | "trend" | "general"
      "message": "Aspirin: 28.6% adherence this week",
      "suggested_action": "Open MeddyBuddy and log your next dose on time…",
      "created_at": "2026-05-19 09:45:31.873687",
      "acknowledged": false
    }
  ],
  "count": 1
}
```

### POST `/walker/acknowledge_alert`

**Request:**
```jsonc
{ "alert_id": "1779164131.873687" }                  // from get_alerts
```

**`data.reports[0]` — success:**
```jsonc
{ "status": "acknowledged", "alert_id": "1779164131.873687" }
```

**`data.reports[0]` — not found:**
```jsonc
{ "status": "error", "message": "Alert not found: …" }
```

### POST `/walker/weekly_report`

The combined "wow" endpoint — structured stats + a byLLM-generated natural-language summary.

**Request:** `{}`

**`data.reports[0]`:**
```jsonc
{
  "period_days": 7,
  "overall_score": 10,                               // int 0-100, same as health_score
  "adherence_pct": 9.5,
  "taken": 2,
  "expected": 21,
  "skipped": 0,
  "missed": 19,
  "trend": "stable",                                 // "improving" | "stable" | "declining"
  "top_risks": [ "Aspirin: 28.6% …", "Metformin: 0.0% …" ],
  "wins": [],
  "patterns": [ "19 expected doses never logged" ],  // string list
  "recommendations": [                                // string list
    "Set a phone reminder at your usual dose time.",
    "If the pattern continues, talk to your prescriber."
  ],
  "summary": "Here's your weekly medication report:\n\n---\n\n**Your Weekly..."
}
```

The `summary` field is **markdown** (LLM-generated, multi-paragraph). Render with `react-markdown` + `remark-gfm`. Always includes a "not medical advice" footer.

---

## Field reference (graph node shapes)

What's stored in the graph (for context — these are the underlying types the walkers manipulate):

### UserProfile
```ts
{ name: string; email: string; timezone: string; sleep_time: string; wake_time: string; created_at: string }
```

### Medication
```ts
{ med_name: string; dosage: string; frequency: string; times: string[]; notes: string; active: boolean; added_at: string }
```

### DoseLog
```ts
{ med_name: string; timestamp: string; status: "taken" | "skipped"; note: string }
```

### Alert
```ts
{
  alert_id: string;
  severity: "info" | "warning" | "high";
  category: "adherence" | "trend" | "general";
  message: string;
  suggested_action: string;
  created_at: string;
  acknowledged: boolean;
}
```

---

## Status / severity enums (full list for UI styling)

- **DoseLog.status:** `"taken"` (green), `"skipped"` (yellow), `"missed"` (red — derived, not stored)
- **Medication.frequency:** `"daily"`, `"twice_daily"`, `"three_times_daily"`, `"as_needed"`, `"weekly"`
- **Alert.severity:** `"info"` (blue), `"warning"` (amber), `"high"` (red)
- **HealthScore.trend:** `"improving"` (green), `"stable"` (gray), `"declining"` (red)

---

## Minimal frontend client

A copy-paste TypeScript client that handles auth, the response envelope, and Bearer-token plumbing:

```ts
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

let token: string | null = localStorage.getItem("token");

async function call(path: string, body: Record<string, unknown> = {}, method: "POST" = "POST") {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json?.error === "Unauthorized") {
    token = null;
    localStorage.removeItem("token");
    throw new Error("Unauthorized");
  }
  if (!json.ok) {
    throw new Error(json.error ?? json.data?.error ?? "Unknown error");
  }
  if (json.data?.error) {
    throw new Error(json.data.error);
  }
  return json.data?.reports?.[0] ?? json.data;   // walker payload OR top-level data (for /user/*)
}

export const api = {
  register: (username: string, password: string) =>
    call("/user/register", {
      identities: [{ type: "username", value: username }],
      credential: { type: "password", password }
    }),
  login: (username: string, password: string) =>
    call("/user/login", {
      identity: { type: "username", value: username },
      credential: { type: "password", password }
    }),
  initUser: (user_name: string, email?: string) =>
    call("/walker/init_user", { user_name, email: email ?? "" }),
  getProfile: () => call("/walker/get_profile"),
  updateProfile: (patch: Partial<{ email: string; timezone: string; sleep_time: string; wake_time: string }>) =>
    call("/walker/update_profile", patch),

  addMedication: (med_name: string, dosage: string, frequency = "daily", times = ["08:00"], notes = "") =>
    call("/walker/add_medication", { med_name, dosage, frequency, times, notes }),
  getMedications: (include_inactive = false) =>
    call("/walker/get_medications", { include_inactive }),
  logDose: (med_name: string, status: "taken" | "skipped" = "taken", note = "") =>
    call("/walker/log_dose", { med_name, status, note }),
  getDoseHistory: (med_name = "", limit = 50) =>
    call("/walker/get_dose_history", { med_name, limit }),
  deactivateMedication: (med_name: string) =>
    call("/walker/deactivate_medication", { med_name }),
  getAdherence: (med_name = "", days = 7) =>
    call("/walker/get_adherence", { med_name, days }),

  chat: (user_message: string) =>
    call("/walker/meddy_chat", { user_message }),
  clearChat: () => call("/walker/clear_chat_history"),

  healthScore: () => call("/walker/health_score"),
  getAlerts: (include_acknowledged = false) =>
    call("/walker/get_alerts", { include_acknowledged }),
  generateAlerts: () => call("/walker/generate_alerts"),
  acknowledgeAlert: (alert_id: string) =>
    call("/walker/acknowledge_alert", { alert_id }),
  weeklyReport: () => call("/walker/weekly_report")
};

export function setToken(t: string) {
  token = t;
  localStorage.setItem("token", t);
}
```

---

## CORS

`jac start` enables CORS for all origins by default (dev). If your frontend runs on `http://localhost:5173` (Vite default), it Just Works. No extra config needed.

---

## Demo flow for the React UI

1. **Auth screen:** username + password, calls `register` (with fallback to `login`).
2. **First-run init:** if `getProfile()` returns `status: "no_profile"`, call `initUser()`.
3. **Sidebar:** call `getMedications()` and `getAlerts()` on mount. Refresh after every chat turn or CRUD action.
4. **Health score badge:** call `healthScore()` on mount and after dose logs.
5. **Chat:** send to `chat()`, push the response to the message list, render `response` as markdown.
6. **Weekly report modal:** call `weeklyReport()`; render the `summary` field as markdown.
7. **Proactive alerts banner:** poll `generateAlerts()` every N minutes (or on mount), then `getAlerts()` to populate the inbox.

---

*Backend on `localhost:8000`. Token in `localStorage`. Every walker response: read `data.reports[0]`.*
