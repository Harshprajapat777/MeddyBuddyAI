import from datetime { datetime, timedelta }
import os;
import requests;
import from dotenv { load_dotenv }
import from byllm.lib { Model }


# ───────────────────────────────────────────────────────────────────────────
# byLLM model
# ───────────────────────────────────────────────────────────────────────────


glob _dotenv_loaded: bool = load_dotenv();
glob _model_name: str = os.environ.get("BYLLM_MODEL", "claude-sonnet-4-6");
glob llm = Model(model_name=_model_name);
glob chat_history: list = [];


# ───────────────────────────────────────────────────────────────────────────
# Graph models
# ───────────────────────────────────────────────────────────────────────────


node UserProfile {
    has name: str = "User";
    has email: str = "";
    has timezone: str = "Asia/Kolkata";
    has sleep_time: str = "23:00";
    has wake_time: str = "07:00";
    has created_at: str = "";
}


node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has notes: str = "";
    has active: bool = True;
    has added_at: str = "";
}


node DoseLog {
    has med_name: str = "";
    has timestamp: str = "";
    has status: str = "taken";
    has note: str = "";
}


node Reminder {
    has reminder_id: str = "";
    has reminder_type: str = "medication";
    has title: str = "";
    has message: str = "";
    has scheduled_time: str = "";
    has recurrence: str = "daily";
    has channel: str = "email";
    has active: bool = True;
    has created_at: str = "";
}


node NotificationLog {
    has reminder_id: str = "";
    has sent_at: str = "";
    has channel: str = "email";
    has status: str = "sent";
    has error: str = "";
}


node MedicalReport {
    has report_id: str = "";
    has filename: str = "";
    has uploaded_at: str = "";
    has raw_text: str = "";
    has summary: str = "";
    has severity: str = "normal";
    has report_type: str = "lab_report";
}


node ReportFinding {
    has entity: str = "";
    has value: str = "";
    has unit: str = "";
    has reference_range: str = "";
    has flag: str = "normal";
    has note: str = "";
}


node Alert {
    has alert_id: str = "";
    has severity: str = "info";
    has category: str = "general";
    has message: str = "";
    has suggested_action: str = "";
    has created_at: str = "";
    has acknowledged: bool = False;
}


node MoodEntry {
    has timestamp: str = "";
    has mood_score: int = 5;
    has stress_level: int = 5;
    has note: str = "";
}


node SleepEntry {
    has date: str = "";
    has hours_slept: float = 0.0;
    has sleep_quality: int = 5;
    has bedtime: str = "";
    has wake_time: str = "";
}


# ───────────────────────────────────────────────────────────────────────────
# User profile walkers
# ───────────────────────────────────────────────────────────────────────────


walker:pub init_user {
    has user_name: str = "User";
    has email: str = "";
    has timezone: str = "Asia/Kolkata";

    can run with entry {
        print(f"[init_user] firing, user_name={self.user_name}");
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            profile = UserProfile(
                name=self.user_name,
                email=self.email,
                timezone=self.timezone,
                created_at=str(datetime.now())
            );
            root ++> profile;
            report {"status": "created", "name": self.user_name};
        } else {
            p = existing[0];
            report {"status": "exists", "name": p.name, "email": p.email};
        }
    }
}


walker:pub get_profile {
    can run with entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            report {"status": "no_profile"};
        } else {
            p = existing[0];
            report {
                "name": p.name,
                "email": p.email,
                "timezone": p.timezone,
                "sleep_time": p.sleep_time,
                "wake_time": p.wake_time,
                "created_at": p.created_at
            };
        }
    }
}


walker:pub update_profile {
    has email: str = "";
    has timezone: str = "";
    has sleep_time: str = "";
    has wake_time: str = "";

    can run with entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            report {"status": "error", "message": "no profile"};
        } else {
            p = existing[0];
            if self.email != "" { p.email = self.email; }
            if self.timezone != "" { p.timezone = self.timezone; }
            if self.sleep_time != "" { p.sleep_time = self.sleep_time; }
            if self.wake_time != "" { p.wake_time = self.wake_time; }
            report {"status": "updated"};
        }
    }
}


# ───────────────────────────────────────────────────────────────────────────
# Medication CRUD walkers
# ───────────────────────────────────────────────────────────────────────────


walker:pub add_medication {
    has med_name: str;
    has dosage: str;
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has notes: str = "";

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"status": "error", "message": "No user profile. Call init_user first."};
        }
    }

    can add with UserProfile entry {
        already = False;
        for m in [here --> Medication] {
            if m.med_name.lower() == self.med_name.lower() and m.active {
                already = True;
                break;
            }
        }
        if already {
            report {"status": "exists", "med_name": self.med_name};
            disengage;
        }
        med = Medication(
            med_name=self.med_name,
            dosage=self.dosage,
            frequency=self.frequency,
            times=self.times,
            notes=self.notes,
            active=True,
            added_at=str(datetime.now())
        );
        here ++> med;
        report {"status": "added", "med_name": self.med_name, "dosage": self.dosage};
    }
}


walker:pub get_medications {
    has include_inactive: bool = False;

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"medications": [], "count": 0};
        }
    }

    can list with UserProfile entry {
        meds = [];
        for med in [here --> Medication] {
            if med.active or self.include_inactive {
                meds.append({
                    "med_name": med.med_name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "times": med.times,
                    "notes": med.notes,
                    "active": med.active,
                    "added_at": med.added_at
                });
            }
        }
        report {"medications": meds, "count": len(meds)};
    }
}


walker:pub log_dose {
    has med_name: str;
    has status: str = "taken";
    has note: str = "";

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        }
    }

    can record with UserProfile entry {
        target = None;
        for med in [here --> Medication] {
            if med.med_name.lower() == self.med_name.lower() and med.active {
                target = med;
                break;
            }
        }
        if target is None {
            report {"status": "error", "message": f"Medication not found: {self.med_name}"};
            disengage;
        }
        log = DoseLog(
            med_name=target.med_name,
            timestamp=str(datetime.now()),
            status=self.status,
            note=self.note
        );
        target ++> log;
        report {"status": "logged", "med_name": target.med_name, "dose_status": self.status};
    }
}


walker:pub get_dose_history {
    has med_name: str = "";
    has limit: int = 50;

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"logs": [], "count": 0};
        }
    }

    can gather with UserProfile entry {
        logs = [];
        for med in [here --> Medication] {
            if self.med_name != "" and med.med_name.lower() != self.med_name.lower() {
                continue;
            }
            for log in [med --> DoseLog] {
                logs.append({
                    "med_name": log.med_name,
                    "timestamp": log.timestamp,
                    "status": log.status,
                    "note": log.note
                });
            }
        }
        sorted_logs = sorted(logs, key=lambda x: dict : x["timestamp"], reverse=True);
        if len(sorted_logs) > self.limit {
            sorted_logs = sorted_logs[:self.limit];
        }
        report {"logs": sorted_logs, "count": len(sorted_logs)};
    }
}


walker:pub deactivate_medication {
    has med_name: str;

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        }
    }

    can deactivate with UserProfile entry {
        found = False;
        for med in [here --> Medication] {
            if med.med_name.lower() == self.med_name.lower() and med.active {
                med.active = False;
                found = True;
                break;
            }
        }
        if found {
            report {"status": "deactivated", "med_name": self.med_name};
        } else {
            report {"status": "error", "message": f"Active medication not found: {self.med_name}"};
        }
    }
}


walker:pub get_adherence {
    has med_name: str = "";
    has days: int = 7;

    can run with entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"days": self.days, "taken": 0, "skipped": 0, "overall_adherence_pct": 0.0, "per_medication": {}};
        }
    }

    can compute with UserProfile entry {
        cutoff = datetime.now() - timedelta(days=self.days);
        total_taken = 0;
        total_skipped = 0;
        total_missed = 0;
        per_med = {};

        for med in [here --> Medication] {
            if self.med_name != "" and med.med_name.lower() != self.med_name.lower() {
                continue;
            }
            if not med.active and self.med_name == "" {
                continue;
            }

            m_taken = 0;
            m_skipped = 0;
            for log in [med --> DoseLog] {
                ts = None;
                try {
                    ts = datetime.fromisoformat(log.timestamp);
                } except Exception as e {
                    continue;
                }
                if ts < cutoff {
                    continue;
                }
                if log.status == "taken" {
                    m_taken += 1;
                } elif log.status == "skipped" {
                    m_skipped += 1;
                }
            }

            doses_per_day = len(med.times);
            if med.frequency == "as_needed" {
                doses_per_day = 0;
            }
            expected = doses_per_day * self.days;
            m_missed = max(0, expected - m_taken - m_skipped);

            total_taken += m_taken;
            total_skipped += m_skipped;
            total_missed += m_missed;

            adherence = 100.0;
            if expected > 0 {
                adherence = round(100.0 * m_taken / expected, 1);
            }
            per_med[med.med_name] = {
                "taken": m_taken,
                "skipped": m_skipped,
                "missed_estimate": m_missed,
                "expected": expected,
                "adherence_pct": adherence
            };
        }

        denom = total_taken + total_skipped + total_missed;
        overall = 100.0;
        if denom > 0 {
            overall = round(100.0 * total_taken / denom, 1);
        }
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


# ───────────────────────────────────────────────────────────────────────────
# byLLM tools — direct graph access (no walker spawn-in-walker)
# ───────────────────────────────────────────────────────────────────────────


def tool_current_time() -> str {
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S");
}


def tool_get_my_medications() -> str {
    profiles = [root --> UserProfile];
    if len(profiles) == 0 {
        return "User profile not initialized. Ask the user to set it up first.";
    }
    p = profiles[0];
    lines = [];
    for med in [p --> Medication] {
        if med.active {
            times_str = ", ".join(med.times);
            lines.append(f"- {med.med_name} {med.dosage} ({med.frequency}) at {times_str}");
        }
    }
    if len(lines) == 0 {
        return "No active medications.";
    }
    return "\n".join(lines);
}


def tool_add_medication_from_chat(med_name: str, dosage: str, frequency: str = "daily") -> str {
    profiles = [root --> UserProfile];
    if len(profiles) == 0 {
        return "Error: no user profile yet.";
    }
    p = profiles[0];
    for m in [p --> Medication] {
        if m.med_name.lower() == med_name.lower() and m.active {
            return f"{med_name} is already in your active medications.";
        }
    }
    med = Medication(
        med_name=med_name,
        dosage=dosage,
        frequency=frequency,
        times=["08:00"],
        active=True,
        added_at=str(datetime.now())
    );
    p ++> med;
    return f"Added {med_name} {dosage} ({frequency}). Please confirm the schedule with your prescriber.";
}


def tool_log_dose_taken_from_chat(med_name: str) -> str {
    profiles = [root --> UserProfile];
    if len(profiles) == 0 {
        return "Error: no user profile.";
    }
    p = profiles[0];
    for med in [p --> Medication] {
        if med.med_name.lower() == med_name.lower() and med.active {
            log = DoseLog(
                med_name=med.med_name,
                timestamp=str(datetime.now()),
                status="taken",
                note=""
            );
            med ++> log;
            return f"Logged {med.med_name} as taken at {tool_current_time()}.";
        }
    }
    return f"I don't see {med_name} in your active medications.";
}


def tool_log_dose_skipped_from_chat(med_name: str, reason: str = "") -> str {
    profiles = [root --> UserProfile];
    if len(profiles) == 0 {
        return "Error: no user profile.";
    }
    p = profiles[0];
    for med in [p --> Medication] {
        if med.med_name.lower() == med_name.lower() and med.active {
            log = DoseLog(
                med_name=med.med_name,
                timestamp=str(datetime.now()),
                status="skipped",
                note=reason
            );
            med ++> log;
            return f"Logged {med.med_name} as skipped. Try not to skip too often — talk to your prescriber if this is recurring.";
        }
    }
    return f"I don't see {med_name} in your active medications.";
}


def tool_check_drug_interaction(drug_a: str, drug_b: str) -> str {
    url = f"https://api.fda.gov/drug/label.json?search=drug_interactions:{drug_a}+AND+drug_interactions:{drug_b}&limit=1";
    try {
        resp = requests.get(url, timeout=5);
        if resp.status_code == 200 {
            data = resp.json();
            results = data.get("results", []);
            if len(results) > 0 {
                interactions = results[0].get("drug_interactions", []);
                if len(interactions) > 0 {
                    snippet = str(interactions[0])[:500];
                    return f"OpenFDA reports an interaction note between {drug_a} and {drug_b}: {snippet}. Verify with a pharmacist before changing anything.";
                }
            }
        }
    } except Exception as e {
        return f"Couldn't reach OpenFDA right now. Please ask your pharmacist directly about {drug_a} + {drug_b}.";
    }
    return f"No interaction record found in OpenFDA for {drug_a} + {drug_b}. Absence of a record isn't proof of safety — confirm with your pharmacist.";
}


def tool_get_adherence_summary(days: int = 7) -> str {
    profiles = [root --> UserProfile];
    if len(profiles) == 0 {
        return "Error: no user profile.";
    }
    p = profiles[0];
    cutoff = datetime.now() - timedelta(days=days);
    total_taken = 0;
    total_expected = 0;
    per_lines = [];
    for med in [p --> Medication] {
        if not med.active {
            continue;
        }
        taken = 0;
        for log in [med --> DoseLog] {
            try {
                ts = datetime.fromisoformat(log.timestamp);
            } except Exception as e {
                continue;
            }
            if ts >= cutoff and log.status == "taken" {
                taken += 1;
            }
        }
        expected = len(med.times) * days;
        if med.frequency == "as_needed" {
            expected = 0;
        }
        total_taken += taken;
        total_expected += expected;
        pct = 100.0 if expected == 0 else round(100.0 * taken / expected, 1);
        per_lines.append(f"- {med.med_name}: {taken}/{expected} doses ({pct}%)");
    }
    if total_expected == 0 {
        return "No tracked doses yet for the last " + str(days) + " days.";
    }
    overall = round(100.0 * total_taken / total_expected, 1);
    header = f"Adherence over the last {days} days — {total_taken}/{total_expected} doses ({overall}% overall):";
    return header + "\n" + "\n".join(per_lines);
}


# ───────────────────────────────────────────────────────────────────────────
# Conversational medication agent (byLLM)
# ───────────────────────────────────────────────────────────────────────────


sem meddy_buddy = """
You are MeddyBuddy, a warm and careful medication management assistant.

What you help with:
- Listing the user's current medications and schedule
- Logging when a dose is taken or skipped
- Computing recent adherence
- Looking up potential drug interactions (OpenFDA, via tool)

Hard rules:
- You are NOT a doctor. Never diagnose, prescribe, or change dosages.
- For any clinical question, recommend the user contact their clinician or pharmacist.
- Never fabricate drug-interaction data. Only report what the interaction tool returns.
- If asked to change a dose or stop a medication, politely refuse and redirect to the prescriber.
- Keep replies short, warm, and practical. One short paragraph plus an action when relevant.
- Use the available tools whenever the user is asking about THEIR specific regimen (don't guess).
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


walker:pub meddy_chat {
    has user_message: str;

    can run with entry {
        if self.user_message is None or self.user_message.strip() == "" {
            report {"status": "error", "message": "Empty message"};
            disengage;
        }
        try {
            response = meddy_buddy(self.user_message);
            report {"status": "ok", "response": response};
        } except Exception as e {
            report {"status": "error", "message": f"LLM error: {str(e)[:200]}"};
        }
    }
}


walker:pub clear_chat_history {
    can run with entry {
        chat_history.clear();
        report {"status": "cleared"};
    }
}


with entry {
    print("MeddyBuddyAI backend booting…");
    print(f"LLM model: {_model_name}");
    print("API docs (auth required): http://localhost:8000/");
}
