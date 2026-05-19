/**
 * Mock data — mirrors api.md exactly so Module 3 can swap to real API
 * calls with zero shape changes.
 */

export const mockProfile = {
  name: "Harsh",
  email: "harsh@example.com",
  timezone: "Asia/Kolkata",
  sleep_time: "23:00",
  wake_time: "07:00",
  created_at: "2026-05-19 09:20:47.825149",
};

export const mockMedications = [
  {
    med_name: "Aspirin",
    dosage: "81mg",
    frequency: "daily",
    times: ["08:00"],
    notes: "Take with food",
    active: true,
    added_at: "2026-05-19 09:22:48.921677",
  },
  {
    med_name: "Metformin",
    dosage: "500mg",
    frequency: "twice_daily",
    times: ["08:00", "20:00"],
    notes: "",
    active: true,
    added_at: "2026-05-19 09:22:49.030375",
  },
  {
    med_name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "daily",
    times: ["09:00"],
    notes: "",
    active: true,
    added_at: "2026-05-19 09:23:00.000000",
  },
];

export const mockHealthScore = {
  score: 72,
  trend: "improving",
  adherence_pct: 78.5,
  top_risks: [
    "Metformin: 65% adherence this week",
  ],
  wins: [
    "Aspirin: 95% adherence — strong consistency",
  ],
  computed_at: "2026-05-19 10:00:00.000000",
};

export const mockAlerts = [
  {
    alert_id: "1779164131.873687",
    severity: "warning",
    category: "adherence",
    message: "Metformin: 65% adherence this week",
    suggested_action:
      "Open MeddyBuddy and log your next dose on time. Talk to your prescriber if the pattern continues.",
    created_at: "2026-05-19 09:45:31.873687",
    acknowledged: false,
  },
];

export const mockMessages = [
  {
    role: "assistant",
    content:
      "Hi! I'm **MeddyBuddy** 💊 — your medication companion. You can ask me things like:\n\n- *What am I on?*\n- *I just took my aspirin.*\n- *Is ibuprofen safe with my metformin?*\n- *How's my adherence this week?*\n\nWhat would you like to do?",
    timestamp: "2026-05-19 10:00:00",
  },
];

export const mockWeeklyReport = {
  period_days: 7,
  overall_score: 72,
  adherence_pct: 78.5,
  taken: 15,
  expected: 21,
  skipped: 1,
  missed: 5,
  trend: "improving",
  top_risks: ["Metformin: 65% adherence this week"],
  wins: ["Aspirin: 95% adherence — strong consistency"],
  patterns: ["5 expected doses never logged"],
  recommendations: [
    "Set an evening reminder for Metformin's 20:00 dose.",
    "Keep doing what you're doing with the morning routine.",
  ],
  summary:
    "Here's your weekly check-in:\n\n**Overall adherence: 78.5%** (15 of 21 expected doses) — a small but real *improvement* over last week. Your Aspirin routine is locked in at **95%**, that's the kind of consistency that compounds over time. Metformin needs more attention — the evening dose at 8 PM is where most of the misses are happening. **One next step:** set a phone alarm for 8 PM tomorrow and keep it on for a week. Small wins build momentum.\n\n---\n\n*This report is for personal tracking only and is not medical advice. Please speak with your prescriber about any concerns.*",
};
