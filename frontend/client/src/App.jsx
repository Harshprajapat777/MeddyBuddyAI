import { useEffect, useState } from "react";
import Landing from "./components/landing/Landing";
import AuthScreen from "./components/auth/AuthScreen";
import AppShell from "./components/layout/AppShell";
import AddMedicationModal from "./components/medications/AddMedicationModal";
import { api, getToken, setToken, clearToken } from "./api/client";

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm **MeddyBuddy** 💊 — your medication companion. Try things like:\n\n- *What am I on?*\n- *I just took my aspirin.*\n- *Is ibuprofen safe with my metformin?*\n- *How's my adherence this week?*",
};

/**
 * Three views — no react-router needed for a single-user demo:
 *   "landing" → marketing page (Landing.jsx)
 *   "auth"    → sign in / sign up (AuthScreen.jsx) with defaultMode preset
 *               from whichever CTA the user clicked on the landing
 *   "app"     → authenticated app (AppShell.jsx)
 *
 * If a token already exists in localStorage we boot straight into "app".
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

  // Chat
  const [messages, setMessages] = useState([WELCOME]);
  const [sending, setSending] = useState(false);

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
    } catch (err) { console.error("getMedications failed:", err); }
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
        await Promise.all([refreshMedications(), refreshHealthScore(), refreshAlerts()]);
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
    setView("landing");
  }

  // ─── Chat (real) ───────────────────────────────────────────────────────
  async function handleSend(text) {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const data = await api.chat(text);
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
        onSignOut={handleSignOut}
        onSendMessage={handleSend}
        onLogTaken={handleLogTaken}
        onLogSkipped={handleLogSkipped}
        onAddMedication={() => setAddOpen(true)}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onRefreshAlerts={handleRefreshAlerts}
        onOpenWeeklyReport={handleOpenWeeklyReport}
        onCloseWeeklyReport={handleCloseWeeklyReport}
      />
      <AddMedicationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleSubmitNewMedication}
      />
    </>
  );
}
