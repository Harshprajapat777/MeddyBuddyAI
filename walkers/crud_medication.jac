import from "../models/user.jac" { UserProfile }
import from "../models/medication.jac" { Medication, DoseLog }
import from "../models/edges.jac" { has_medication, has_log }
import from datetime { datetime, timedelta }


walker add_medication {
    has med_name: str;
    has dosage: str;
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has notes: str = "";

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"status": "error", "message": "No user profile. Call init_user first."};
        }
    }

    can add with UserProfile entry {
        already = false;
        for m in [here -:has_medication:-> Medication] {
            if m.med_name.lower() == self.med_name.lower() and m.active {
                already = true;
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
            active=true,
            added_at=str(datetime.now())
        );
        here +:has_medication:+> med;
        report {"status": "added", "med_name": self.med_name, "dosage": self.dosage};
    }
}


walker get_medications {
    has include_inactive: bool = false;

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"medications": [], "count": 0};
        }
    }

    can list with UserProfile entry {
        meds = [];
        for med in [here -:has_medication:-> Medication] {
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


walker log_dose {
    has med_name: str;
    has status: str = "taken";
    has note: str = "";

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        }
    }

    can record with UserProfile entry {
        target = None;
        for med in [here -:has_medication:-> Medication] {
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
        target +:has_log:+> log;
        report {"status": "logged", "med_name": target.med_name, "dose_status": self.status};
    }
}


walker get_dose_history {
    has med_name: str = "";
    has limit: int = 50;

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"logs": [], "count": 0};
        }
    }

    can gather with UserProfile entry {
        logs = [];
        for med in [here -:has_medication:-> Medication] {
            if self.med_name != "" and med.med_name.lower() != self.med_name.lower() {
                continue;
            }
            for log in [med -:has_log:-> DoseLog] {
                logs.append({
                    "med_name": log.med_name,
                    "timestamp": log.timestamp,
                    "status": log.status,
                    "note": log.note
                });
            }
        }
        logs.sort(key=lambda x: x["timestamp"], reverse=true);
        if len(logs) > self.limit {
            logs = logs[:self.limit];
        }
        report {"logs": logs, "count": len(logs)};
    }
}


walker deactivate_medication {
    has med_name: str;

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        }
    }

    can deactivate with UserProfile entry {
        found = false;
        for med in [here -:has_medication:-> Medication] {
            if med.med_name.lower() == self.med_name.lower() and med.active {
                med.active = false;
                found = true;
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


walker get_adherence {
    has med_name: str = "";
    has days: int = 7;

    can run with `root entry {
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

        for med in [here -:has_medication:-> Medication] {
            if self.med_name != "" and med.med_name.lower() != self.med_name.lower() {
                continue;
            }
            if not med.active and self.med_name == "" {
                continue;
            }

            m_taken = 0;
            m_skipped = 0;
            for log in [med -:has_log:-> DoseLog] {
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
