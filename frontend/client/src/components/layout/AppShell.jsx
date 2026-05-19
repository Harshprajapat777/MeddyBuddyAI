import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ChatPanel from "../chat/ChatPanel";
import WeeklyReportModal from "../twin/WeeklyReportModal";

/**
 * Main authenticated layout. Phase 1: receives mock data via props.
 * Module 3 will wrap this with API-driven state.
 */
export default function AppShell({
  username,
  profile,
  medications,
  alerts,
  healthScore,
  messages,
  sending,
  weeklyReport,
  weeklyReportOpen,
  weeklyReportLoading,
  onboardingMode = false,
  onboardingCanFinish = false,
  onFinishOnboarding,
  onNewChat,
  chatSuggestions,
  chatPlaceholder,
  onSignOut,
  onSendMessage,
  onLogTaken,
  onLogSkipped,
  onAddMedication,
  onSendReminder,
  onAcknowledgeAlert,
  onRefreshAlerts,
  onOpenWeeklyReport,
  onCloseWeeklyReport,
  onOpenSettings,
  onSendToCaregiver,
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <Header
        username={profile?.name ?? username}
        onSignOut={onSignOut}
        onOpenWeeklyReport={onOpenWeeklyReport}
        onOpenSettings={onOpenSettings}
      />

      <main className="flex-1 container-max w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">
          <Sidebar
            healthScore={healthScore}
            medications={medications}
            alerts={alerts}
            onLogTaken={onLogTaken}
            onLogSkipped={onLogSkipped}
            onAddMedication={onAddMedication}
            onSendReminder={onSendReminder}
            onAcknowledgeAlert={onAcknowledgeAlert}
            onRefreshAlerts={onRefreshAlerts}
          />

          <ChatPanel
            messages={messages}
            onSend={onSendMessage}
            sending={sending}
            onboardingMode={onboardingMode}
            onboardingCanFinish={onboardingCanFinish}
            onFinishOnboarding={onFinishOnboarding}
            onNewChat={onNewChat}
            suggestions={chatSuggestions}
            placeholder={chatPlaceholder}
          />
        </div>
      </main>

      <WeeklyReportModal
        open={weeklyReportOpen}
        report={weeklyReport}
        loading={weeklyReportLoading}
        onClose={onCloseWeeklyReport}
        caregiverEmail={profile?.caregiver_email}
        onSendToCaregiver={onSendToCaregiver}
      />
    </div>
  );
}
