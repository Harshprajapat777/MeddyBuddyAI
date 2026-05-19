import HealthScoreCard from "../twin/HealthScoreCard";
import MedicationList from "../medications/MedicationList";
import AlertsInbox from "../twin/AlertsInbox";

export default function Sidebar({
  healthScore,
  medications,
  alerts,
  onLogTaken,
  onLogSkipped,
  onAddMedication,
  onAcknowledgeAlert,
  onRefreshAlerts,
}) {
  return (
    <aside className="w-full lg:w-[340px] shrink-0 space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)] pb-4">
      <HealthScoreCard healthScore={healthScore} />
      <MedicationList
        medications={medications}
        onLogTaken={onLogTaken}
        onLogSkipped={onLogSkipped}
        onAdd={onAddMedication}
      />
      <AlertsInbox
        alerts={alerts}
        onAcknowledge={onAcknowledgeAlert}
        onRefresh={onRefreshAlerts}
      />
    </aside>
  );
}
