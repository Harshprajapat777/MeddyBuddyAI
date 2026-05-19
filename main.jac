import from datetime { datetime, timedelta }


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


with entry {
    print("MeddyBuddyAI backend booting…");
    print("API docs (auth required): http://localhost:8000/");
}
