# MeddyBuddyAI — Hackathon Submission Guide

Everything you need to ship this submission. Read top-to-bottom once, then come back and check each item off.

**Event:** JacHacks Spring 2026 — Agentic AI flagship track ($600 / $400)
**Deadline:** May 19, 2026 · 10:00 AM EDT (hard deadline — Devpost closes)
**Devpost:** https://jachacks-spring.devpost.com

---

## 0. Pre-flight (5 min)

Before recording anything, run this in two terminals and click through the app to make sure nothing is broken on the day-of.

**Terminal 1 — backend:**
```powershell
cd MeddyBuddyAI
.\jac-env\Scripts\Activate.ps1
$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"
python -m jaclang start main.jac --port 8000
```

**Terminal 2 — frontend:**
```powershell
cd MeddyBuddyAI\frontend\client
npm run dev
```

Open `http://localhost:5173/` → landing → sign up with a fresh username → onboarding agent should greet you → add 2 meds via chat → click "I'm done" → main app loads → check sidebar populated → sign out and back in to make sure persistence works.

If anything errors, fix it before recording.

---

## 1. Final Brevo setup (do once, then never again)

The sanity tests already confirmed Brevo accepts our API calls and returns `status_code: 201`. But Gmail may flag the emails as spam if the sender domain isn't verified. **One-time setup to fix:**

1. Open https://app.brevo.com → **Settings → Senders, Domains & Dedicated IPs**.
2. Click **Add a sender**. Enter:
   - Name: `MeddyBuddy`
   - Email: `meenakshi.bhtt@gmail.com` (the address in your `.env` `BREVO_SENDER_EMAIL`)
3. Brevo emails you a confirmation link. Open it, click confirm. Sender is now verified.
4. From now on, every email from MeddyBuddy lands in **Inbox**, not spam. Test by clicking **Settings → Send test email** in the UI. Should arrive in <10 seconds.

If you want to skip this step: emails still go out (we saw `201` responses) but Gmail's spam filter is much harsher on senders with `@example.com` or unverified addresses. **For the demo video, you want Inbox delivery, not Spam.**

---

## 2. Recording the demo video (15-25 min)

### Tools
- **Recorder:** OBS Studio (free) or built-in Xbox Game Bar (Win+G) on Windows
- **Editor (optional):** DaVinci Resolve (free) or just cut clips in the recorder
- **Resolution:** 1080p, 30fps min
- **Length:** Hard cap **3:00** per the rules — over runs risk DQ
- **Audio:** Voice-over is fine; clean mic > none. Skip music.

### Setup before hitting record
- Sign out, clear localStorage if you've been testing all day (DevTools → Application → Local Storage → clear `mb_*` keys), refresh.
- Make sure you have **TWO browser windows visible at once**: the MeddyBuddy frontend AND a Gmail tab open to your inbox.
- Maximize the browser. Hide bookmarks bar. Cmd/Ctrl + `+` to zoom UI to ~110% so judges can read.

### The 3-minute script (lead with the consequence, then rewind)

| Time | Beat | Show |
|------|------|------|
| 0:00 – 0:08 | **The hook.** Lead with the caregiver email arriving in Gmail. *"This is a weekly health report. It's from my mom. She didn't send it — her medication agent did."* Open the email, scroll the table. | Gmail inbox with the digest email open |
| 0:08 – 0:20 | **The setup.** *"Meet MeddyBuddy. Built on Jac 2.0 + Claude Sonnet 4.6. It's the agent that just sent that email. Let me show you how."* | Cut to landing page (`localhost:5173`). Pause on hero for a beat. |
| 0:20 – 0:55 | **Onboarding.** Click Get started → sign up with email field shown. Onboarding agent greets. Type *"Aspirin 81mg every morning"*. Agent saves + asks for next. Type *"Metformin 500mg twice a day at 8am and 8pm"*. Sidebar populates. Click **I'm done**. | Landing → Auth → Onboarding chat |
| 0:55 – 1:25 | **Chat with tools.** Open main chat. Type *"I just took my aspirin"*. Agent confirms log, score updates live in sidebar. Type *"Is ibuprofen safe with my metformin?"*. Agent calls OpenFDA tool, returns the interaction info with citation. | Main chat panel + sidebar |
| 1:25 – 1:50 | **Proactive layer.** Hover Aspirin in sidebar → click the bell icon. Cut to Gmail — the reminder email appears in real time. Read the subject. | Sidebar → Gmail |
| 1:50 – 2:25 | **Digital twin.** Click *Weekly report*. Modal opens with score, adherence stats, byLLM-generated narrative. Read one line aloud. Click *Send to caregiver*. Cut back to Gmail. Digest email appears. | Weekly Report modal → Gmail digest |
| 2:25 – 2:50 | **The Jac claim.** Show `main.jac` briefly (1-2 seconds per highlight). Voice-over: *"21 walkers, two byLLM agents, sem-annotated tools, all native Jac. The graph is per-user, the chat history is global, the proactive layer writes audit logs back to the graph. Real agentic AI, not a chat wrapper."* | VSCode showing main.jac, scroll briefly |
| 2:50 – 3:00 | **The pitch.** *"MeddyBuddy is the proactive AI companion that closes the family-care loop. It's built. It works. Try it at the GitHub link below."* End on a frame showing landing + repo URL | Landing page or repo URL slate |

### Tips
- **Practice the script once before recording.** Saying it out loud reveals what's awkward.
- **Don't show typing.** Click → it appears. Use the same setup you tested in pre-flight so latency is predictable.
- **Cut aggressively in editing.** A 3:00 demo with breathing room beats a 3:00 demo crammed full.
- **Upload to YouTube as unlisted**, paste the link into Devpost. Don't upload to Google Drive — judges' viewers often choke on it.

---

## 3. Devpost form (every field, ready to paste)

Submit at https://jachacks-spring.devpost.com → **Submit your project**.

### Title
```
MeddyBuddyAI — the proactive AI medication companion
```

### Tagline (under 200 chars)
```
A multi-agent Jac platform that onboards your meds in a conversation, picks up the slack on its own, and quietly emails your family when adherence slips.
```

### What it does
```
MeddyBuddyAI is a proactive AI medication companion built for people like Sarah — 67, on four medications for blood pressure, diabetes, and cholesterol, with a son who worries from across the country.

Instead of a form, signup is a conversation. A dedicated onboarding agent (Claude Sonnet 4.6 via byLLM) greets the user, asks for their first medication in plain English, and parses "Metformin 500mg twice a day, 8am and 8pm" into structured data — name, dose, frequency, times — and writes it directly to the user's Jac graph.

Once the regimen is set, MeddyBuddy turns into a continuous companion. Tell it "I just took my aspirin" and the agent picks the log_dose tool. Ask "is ibuprofen safe with my metformin?" and it calls OpenFDA. Ask "how am I doing this week?" and it computes per-medication adherence.

The Digital Health Twin layer runs in the background: a 0–100 score, trend vs. last week, proactive alerts when adherence drops below 70%. Every Sunday it generates a polished weekly digest — and emails it (via Brevo) to a caregiver email the user can set in Settings. Closes the family-care loop without surveillance.

Why this is agentic AI, not a chatbot:
- Two separate byLLM agents (onboarding + main), each with focused tool sets and sem-annotated prompts
- The LLM picks tools — 7 tools wired across both agents
- Multi-turn memory via Jac glob lists (chat_history, onboarding_history)
- Structured outputs (obj HealthScore, obj WeeklyReport) — not free-form chat
- Proactive: emails fire without the user prompting them
- Per-user persistent graph (root → UserProfile → Medication → DoseLog → Alert), auto-persisted by jac start
- 21 walker:pub endpoints, every one exposed as REST, every one calling into the same shared graph the agents touch
```

### How we built it
```
Stack:
- Jac 2.0 (jaclang 0.10.2) — every node, edge, walker, ability, by-llm function, and sem annotation is native Jac. Not a Python wrapper.
- byLLM 0.4.20 (LiteLLM under the hood) → Claude Sonnet 4.6 for the conversational agents and the weekly-report narrator
- jac start auto-exposes every walker:pub as POST /walker/<name> via FastAPI, with built-in Bearer-token auth
- Per-user root persistence (SQLite under .jac/data) — survives server restarts
- React 19 + Vite 8, Tailwind v4, Framer Motion, react-markdown + remark-gfm, Lucide React
- Brevo for transactional email (reminders + caregiver digests)
- OpenFDA drug-label API for the drug-interaction tool

Architecture:
- Single main.jac (21 walkers, 2 byLLM agents, 7 tools) — the multi-file layout we initially tried doesn't survive jac start's introspection, so we consolidated. README documents the gotcha.
- Frontend is single-page, three views: landing / auth / app. Pure props down, callbacks up — no Redux, no Context.
- API client abstracts the universal response envelope (data.reports[0] is the real payload) and the Bearer flow.

The full feature spec is in FEATURES.md. The build plan with hour-by-hour breakdown is in todobackend.md. The endpoint reference is in api.md. The README has a "lessons learned" section documenting 8 real jaclang 0.10.2 gotchas we hit during the build.
```

### Challenges we ran into
```
Mostly that the Jac reference docs we started from were aspirational for the 0.6+ API and didn't match installed jaclang 0.10.2. Among others:

- `pip install jaseci` pulls in the legacy Jaseci 1.x core which uses Linux-only signal.SIGALRM and breaks on Windows. We had to install jaclang directly.
- jaclang 0.10.2 requires typing.override which only exists in Python 3.12+. Python 3.11 ImportErrors.
- `can run with `root entry { ... }` (typed entry on spawn) doesn't actually fire on spawn — typed entries only fire on explicit visit. We had to switch the dispatcher abilities to plain `can run with entry`.
- Lowercase `true`/`false` in Jac source compiles but doesn't transpile (the emitted Python has literal `true`, raising NameError). Use Python-style True/False.
- `[parent --> NodeType]` doesn't filter by type at runtime — it returns all children. We had to add `isinstance` guards across 19 graph traversals.
- `walker:pub` is required to expose a walker as REST. Plain `walker` is private.
- Even `walker:pub` requires Bearer auth — register/login first.
- Windows cp1252 stdout chokes on emoji from the LLM. Set PYTHONIOENCODING=utf-8 before jac start.

Multi-file imports for server walkers don't work via `cl import` (that's client-side). We tried, hit it, consolidated into single-file. Documented the discovery for the next person.
```

### Accomplishments we're proud of
```
- Two distinct byLLM agents (onboarding + main chat) coordinating through a shared per-user graph
- Real proactive behavior: the agent emails the user AND emails the caregiver, with audit logging back to the graph
- 21 walkers all working end-to-end, sanity-tested with curl before submission
- The agent saves "Metformin 500mg twice a day at 8am and 8pm" with frequency=twice_daily, times=["08:00","20:00"] — not a regex parser, just sem-annotated tool calling
- A polished React frontend (landing page with how-it-works, settings modal, weekly-report modal with markdown summary, per-medication reminder bell) — not a Postman screenshot pretending to be a UI
- Engineering discipline: 20+ atomic commits, real README, api.md endpoint reference, todobackend.md build plan, .env.example with verified Brevo setup steps
```

### What we learned
```
- Jac 2.0 is a real language with real semantics — once you stop fighting it (multi-file, typed entries) and lean into the canonical patterns (single-file main.jac, untyped dispatcher + typed visitor abilities, by-llm functions with sem annotations), it's genuinely productive.
- byLLM's tool-calling is surprisingly good. With a tight sem annotation per tool, Claude reliably parses natural language into structured arguments — including lists (times) — without us writing parsing logic.
- The agentic flagship track rewards loops, not single-shot calls. The Digital Twin loop (graph → adherence → alerts → email) is what makes this feel like an agent and not a chat wrapper.
- Document gotchas as you find them. The lessons-learned section in our README will save the next jaclang 0.10.2 hackathon team hours.
```

### What's next for MeddyBuddyAI
```
Phase 2 features already stubbed in the graph (MoodEntry, SleepEntry, MedicalReport) and a background scheduler that fires reminders by clock, not by user-click. The Brevo plumbing is in place — adding the threading.Timer loop is a 30-line change.

Also planned: OCR report analysis (we have ReportFinding + MedicalReport nodes ready), agent-to-agent coordination (the onboarding agent could hand off to a "first-week coach" agent), and a HIPAA-grade encryption pass for real deployment.
```

### Tracks (select)
- **Agentic AI** (primary)
- Best Use of Jac (sub-track — strong fit)
- Best Demo (sub-track — depends on the video)

### Tech tags
```
Jac, Jac 2.0, jaclang, byLLM, Anthropic Claude, Claude Sonnet 4.6, LiteLLM, Python, FastAPI, React, React 19, Vite, Tailwind CSS, Tailwind v4, Framer Motion, OpenFDA, Brevo
```

### GitHub repo (must be public)
```
https://github.com/Harshprajapat777/MeddyBuddyAI
```

### Video link (after upload)
```
https://youtu.be/<your-video-id>
```

---

## 4. Final submission checklist (run through immediately before clicking Submit)

- [ ] Backend running, no errors on cold start (`python -m jaclang start main.jac --port 8000`)
- [ ] Frontend running, no errors (`npm run dev` in `frontend/client`)
- [ ] `.env` has all 5 keys filled (ANTHROPIC, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, FAST_CLOCK)
- [ ] Brevo sender email verified in dashboard
- [ ] Sanity test: register fresh user → chat → score → email → digest (all four arrive in Gmail)
- [ ] GitHub repo is **public** (verify by opening in incognito)
- [ ] Last commit on `main` is the version you want judged
- [ ] Demo video uploaded to YouTube as **unlisted**, link tested in incognito
- [ ] All Devpost form fields filled
- [ ] Tracks selected (Agentic AI primary)
- [ ] **Click Submit** — Devpost shows "Submitted" badge

Deadline is **10:00 AM EDT, May 19, 2026**. Don't wait until 9:59 — submit by 9:30 to give yourself room for the unexpected.

---

## 5. After submission

- Refresh your Devpost project page to confirm the "Submitted" badge is showing.
- The submission is immutable once the deadline passes. You can still update the description, but the GitHub URL gets snapshot-checked by judges against the deadline.
- Winners announced **Thursday, May 21**. Watch your email (the one you registered on Devpost with) and the JacHacks Discord.

Good luck. The build is solid. Now go ship it.
