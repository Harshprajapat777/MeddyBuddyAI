import { useEffect, useState } from "react";
import Landing from "./components/landing/Landing";
import AuthScreen from "./components/auth/AuthScreen";
import AppShell from "./components/layout/AppShell";
import AddMedicationModal from "./components/medications/AddMedicationModal";
import SettingsModal from "./components/settings/SettingsModal";
import { api, getToken, setToken, clearToken } from "./api/client";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm **MeddyBuddy** 💊 — your medication companion. Try things like:\n\n- *What am I on?*\n- *I just took my aspirin.*\n- *Is ibuprofen safe with my metformin?*\n- *How's my adherence this week?*",
};

const WELCOME_ONBOARDING = {
  role: "assistant",
  content:
    "Hi! I'm **MeddyBuddy** 💊 — your medication companion.\n\nLet's get your meds set up so I can start helping. Tell me about your **first medication** — the name, the dose, and roughly when you take it. For example: *\"Aspirin 81mg every morning\"*.",
};

const ONBOARDING_SUGGESTIONS = [
  "Aspirin 81mg every morning",
  "Metformin 500mg, 8am and 8pm",
  "Vitamin D 1000 IU, mornings",
  "That's all for now",
];

/**
 * Three views — no react-router needed for a single-user demo:
 *   "landing" → marketing page
 *   "auth"    → sign in / sign up
 *   "app"     → authenticated app (split into onboarding vs main chat by state)
 *
 * Onboarding mode is active while the user is still building their medication
 * list. A dedicated `meddy_onboarder` byLLM agent runs the focused setup flow;
 * once they tap "I'm done" we switch to the general `meddy_chat` agent.
 */
export default function App() {
  const [view, setView] = useState(getToken() ? "app" : "landing");
  const [authMode, setAuthMode] = useState("login");

  const [username, setUsername] = useState(localStorage.getItem("mb_username") ?? "");
  const [profile, setProfile] = useState(null);
  const [bootError, setBootError] = useState("");

  // Medications
  const [medications, setMedications] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Chat
  const [messages, setMessages] = useState([WELCOME]);
  const [sending, setSending] = useState(false);

  // Onboarding mode (true while the user is still adding their initial meds)
  const [onboardingMode, setOnboardingMode] = useState(false);

  // Digital Twin
  const [healthScore, setHealthScore] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(null);

  // ─── Refresh helpers ───────────────────────────────────────────────────
  async function refreshMedications() {
    try {
      const data = await api.getMedications(false);
      setMedications(data?.medications ?? []);
      return data?.medications ?? [];
    } catch (err) { console.error("getMedications failed:", err); return []; }
  }
  async function refreshHealthScore() {
    try {
      const data = await api.healthScore();
      if (data && typeof data.score === "number") setHealthScore(data);
    } catch (err) { console.error("healthScore failed:", err); }
  }
  async function refreshAlerts() {
    try {
      const data = await api.getAlerts(false);
      setAlerts(data?.alerts ?? []);
    } catch (err) { console.error("getAlerts failed:", err); }
  }

  // ─── Boot ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== "app") return;
    (async () => {
      try {
        let p = await api.getProfile();
        if (p?.status === "no_profile") {
          await api.initUser(username || "User");
          p = await api.getProfile();
        }
        if (p && !p.status) setProfile(p);
        const [meds] = await Promise.all([
          refreshMedications(),
          refreshHealthScore(),
          refreshAlerts(),
        ]);
        // Default to onboarding for users with no meds yet.
        const localFinished = localStorage.getItem("mb_onboarded") === "1";
        const shouldOnboard = (meds?.length ?? 0) === 0 && !localFinished;
        setOnboardingMode(shouldOnboard);
        setMessages([shouldOnboard ? WELCOME_ONBOARDING : WELCOME]);
        if (shouldOnboard) {
          try { await api.clearOnboarding(); } catch (_) {}
        }
      } catch (err) {
        if (err?.message === "Unauthorized") handleSignOut();
        else setBootError(err?.message ?? "Couldn't load your account data.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ─── Landing → auth nav ────────────────────────────────────────────────
  function handleGetStarted() { setAuthMode("register"); setView("auth"); }
  function handleSignInClick() { setAuthMode("login"); setView("auth"); }
  function handleBackToLanding() { setView("landing"); }

  // ─── Auth (real) ───────────────────────────────────────────────────────
  async function handleAuth(mode, uname, password) {
    const result = mode === "register"
      ? await api.register(uname, password)
      : await api.login(uname, password);
    if (!result?.token) throw new Error("Auth response is missing a token.");
    setToken(result.token);
    localStorage.setItem("mb_username", result.username ?? uname);
    setUsername(result.username ?? uname);
    try { await api.initUser(uname); } catch (_) {}
    try { await api.clearChat(); } catch (_) {}
    try { await api.clearOnboarding(); } catch (_) {}
    // Fresh signup → reset the "onboarded" flag so they get the guided flow
    if (mode === "register") localStorage.removeItem("mb_onboarded");
    setMessages([WELCOME]);
    setView("app");
  }

  function handleSignOut() {
    clearToken();
    localStorage.removeItem("mb_username");
    setUsername("");
    setProfile(null);
    setMedications([]);
    setMessages([WELCOME]);
    setHealthScore(null);
    setAlerts([]);
    setOnboardingMode(false);
    setView("landing");
  }

  // ─── Onboarding hand-off ───────────────────────────────────────────────
  async function handleFinishOnboarding() {
    setOnboardingMode(false);
    localStorage.setItem("mb_onboarded", "1");
    try { await api.clearChat(); } catch (_) {}
    setMessages([
      {
        role: "assistant",
        content:
          "Great — you're all set up. 🎉 From here on, just chat with me normally — log doses, ask about interactions, or check your weekly report any time. I'll also keep an eye on your adherence and ping you if anything looks off.",
      },
    ]);
    // Refresh once more so the score reflects whatever was just added.
    await Promise.all([refreshMedications(), refreshHealthScore(), refreshAlerts()]);
  }

  // ─── Chat (real, routes to onboarding or main agent) ───────────────────
  async function handleSend(text) {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    const useOnboarding = onboardingMode;
    try {
      const data = useOnboarding
        ? await api.onboardingChat(text)
        : await api.chat(text);
      const reply = data?.response ?? "_(Empty response from agent.)_";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ I hit an error reaching the LLM: \`${err?.message ?? "unknown"}\`. Try again, or restart the backend.`,
        },
      ]);
    } finally {
      setSending(false);
      await Promise.all([refreshMedications(), refreshHealthScore(), refreshAlerts()]);
    }
  }

  // ─── Medication actions (real) ─────────────────────────────────────────
  async function handleLogTaken(med_name) {
    try {
      await api.logDose(med_name, "taken");
      setMessages((m) => [...m, { role: "assistant", content: `Logged **${med_name}** as taken ✅` }]);
      await Promise.all([refreshMedications(), refreshHealthScore()]);
    } catch (err) { console.error("logDose taken failed:", err); }
  }
  async function handleLogSkipped(med_name) {
    try {
      await api.logDose(med_name, "skipped");
      setMessages((m) => [...m, { role: "assistant", content: `Logged **${med_name}** as skipped. Try not to skip too often.` }]);
      await Promise.all([refreshMedications(), refreshHealthScore()]);
    } catch (err) { console.error("logDose skipped failed:", err); }
  }
  async function handleSubmitNewMedication(payload) {
    await api.addMedication(
      payload.med_name,
      payload.dosage,
      payload.frequency,
      payload.times,
      payload.notes
    );
    await Promise.all([refreshMedications(), refreshHealthScore()]);
  }

  // ─── Alerts (real) ─────────────────────────────────────────────────────
  async function handleAcknowledgeAlert(alert_id) {
    try { await api.acknowledgeAlert(alert_id); await refreshAlerts(); }
    catch (err) { console.error("acknowledgeAlert failed:", err); }
  }
  async function handleRefreshAlerts() {
    try { await api.generateAlerts(); await refreshAlerts(); }
    catch (err) { console.error("generateAlerts failed:", err); }
  }

  // ─── Weekly report (real, byLLM) ───────────────────────────────────────
  async function handleOpenWeeklyReport() {
    setWeeklyReportOpen(true);
    setWeeklyReportLoading(true);
    setWeeklyReport(null);
    try {
      const data = await api.weeklyReport();
      setWeeklyReport(data);
    } catch (err) {
      setWeeklyReport({
        summary: `⚠️ Couldn't generate the report: \`${err?.message ?? "unknown"}\`. Try again in a moment.`,
        overall_score: 0, adherence_pct: 0, trend: "stable",
        taken: 0, expected: 0, wins: [], top_risks: [],
      });
    } finally {
      setWeeklyReportLoading(false);
    }
  }
  function handleCloseWeeklyReport() { setWeeklyReportOpen(false); }

  // ─── Settings + Brevo actions ──────────────────────────────────────────
  async function handleSaveSettings(patch) {
    await api.updateProfile(patch);
    try {
      const p = await api.getProfile();
      if (p && !p.status) setProfile(p);
    } catch (_) {}
  }
  async function handleSendTestEmail() {
    return api.sendTestEmail();
  }
  async function handleSendCaregiverDigest() {
    return api.sendCaregiverDigest();
  }
  async function handleSendReminder(med_name) {
    return api.sendReminder(med_name);
  }

  // ─── Render ────────────────────────────────────────────────────────────
  if (view === "landing") {
    return <Landing onGetStarted={handleGetStarted} onSignIn={handleSignInClick} />;
  }
  if (view === "auth") {
    return (
      <AuthScreen
        onAuth={handleAuth}
        defaultMode={authMode}
        onBack={handleBackToLanding}
      />
    );
  }

  return (
    <>
      {bootError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-3 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] shadow-md">
          {bootError}
        </div>
      )}
      <AppShell
        username={username}
        profile={profile}
        medications={medications}
        alerts={alerts}
        healthScore={healthScore}
        messages={messages}
        sending={sending}
        weeklyReport={weeklyReport}
        weeklyReportOpen={weeklyReportOpen}
        weeklyReportLoading={weeklyReportLoading}
        onboardingMode={onboardingMode}
        onboardingCanFinish={onboardingMode && medications.length >= 1}
        onFinishOnboarding={handleFinishOnboarding}
        chatSuggestions={onboardingMode ? ONBOARDING_SUGGESTIONS : undefined}
        chatPlaceholder={
          onboardingMode
            ? "Tell me about a medication — e.g. \"Aspirin 81mg mornings\""
            : "Talk to MeddyBuddy…"
        }
        onSignOut={handleSignOut}
        onSendMessage={handleSend}
        onLogTaken={handleLogTaken}
        onLogSkipped={handleLogSkipped}
        onAddMedication={() => setAddOpen(true)}
        onSendReminder={handleSendReminder}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onRefreshAlerts={handleRefreshAlerts}
        onOpenWeeklyReport={handleOpenWeeklyReport}
        onCloseWeeklyReport={handleCloseWeeklyReport}
        onOpenSettings={() => setSettingsOpen(true)}
        onSendToCaregiver={handleSendCaregiverDigest}
      />
      <AddMedicationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleSubmitNewMedication}
      />
      <SettingsModal
        open={settingsOpen}
        profile={profile}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        onSendTestEmail={handleSendTestEmail}
      />
    </>
  );
}
