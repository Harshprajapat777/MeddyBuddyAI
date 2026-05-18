# Jac 2.0 — Full Working Examples

## Example 1: Hello World

```jac
with entry {
    print("Hello from Jac!");
}
```
Run: `jac run hello.jac`

## Example 2: Basic Graph Traversal

```jac
node Person {
    has name: str;
    has visited: bool = false;
}

edge FriendsWith;

walker GreetFriends {
    can start with `root entry {
        visit [-->];
    }

    can greet with Person entry {
        if not here.visited {
            here.visited = true;
            print(f"Hello, {here.name}!");
            visit [-->:FriendsWith:-->];
        }
    }
}

with entry {
    alice = Person(name="Alice");
    bob   = Person(name="Bob");
    carol = Person(name="Carol");

    root ++> alice;
    alice +:FriendsWith:+> bob;
    alice +:FriendsWith:+> carol;

    root spawn GreetFriends();
}
```

## Example 3: Walker with Report

```jac
node Task {
    has title: str;
    has done: bool = false;
}

walker get_tasks {
    can run with `root entry {
        tasks = [];
        for task in [root --> Task] {
            tasks.append({"title": task.title, "done": task.done});
        }
        report {"tasks": tasks, "total": len(tasks)};
    }
}

with entry {
    root ++> Task(title="Take Aspirin");
    root ++> Task(title="Log blood pressure");
    root ++> Task(title="Doctor appointment", done=true);

    result = root spawn get_tasks();
    print(result.reports[0]);
}
```

## Example 4: Basic byLLM Function

```jac
import from byllm.lib { Model }

glob llm = Model(model_name="claude-sonnet-4-6");

def answer_question(question: str) -> str by llm();

sem answer_question = "Answer health questions clearly and helpfully. Always recommend consulting a doctor.";

with entry {
    resp = answer_question("What are common side effects of aspirin?");
    print(resp);
}
```

## Example 5: byLLM with Tools + Conversation

```jac
import from byllm.lib { Model }
import os;

glob llm = Model(model_name="claude-sonnet-4-6");
glob history: list = [];

def get_current_medications() -> list[str] {
    # In real app, fetch from graph
    return ["Aspirin 81mg (daily)", "Metformin 500mg (twice daily)"];
}

def log_dose_taken(medication: str) -> str {
    return f"Logged: {medication} taken at " + __import__("datetime").datetime.now().strftime("%H:%M");
}

sem chat_with_meddy = """
You are MeddyBuddy, a caring medication management AI assistant.
Help users track medications, log doses, and understand their health.
Use available tools when needed.
Always remind users that you are not a substitute for professional medical advice.
""";

def chat_with_meddy(message: str) -> str by llm(
    conversation=history,
    tools=[get_current_medications, log_dose_taken],
    temperature=0.7
);

with entry {
    print("MeddyBuddy: Hi! I'm here to help you manage your medications.");

    while true {
        user_input = input("You: ");
        if user_input.lower() in ["quit", "exit"] {
            break;
        }
        response = chat_with_meddy(user_input);
        print(f"MeddyBuddy: {response}");
    }
}
```

## Example 6: Full Medication Tracker (Graph + byLLM)

```jac
import from byllm.lib { Model }
import from datetime { datetime }
import os;
import requests;

glob llm = Model(model_name="claude-sonnet-4-6");
glob chat_history: list = [];

# ── Nodes ──────────────────────────────────────────────────────────────────

node UserProfile {
    has name: str = "User";
    has created_at: str = "";
}

node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has frequency: str = "daily";    # daily, twice_daily, as_needed
    has times: list[str] = ["08:00"];
    has active: bool = true;
    has added_at: str = "";
}

node DoseLog {
    has med_name: str = "";
    has timestamp: str = "";
    has status: str = "taken";       # taken | skipped
}

# ── Walkers ────────────────────────────────────────────────────────────────

walker init_user {
    has user_name: str = "User";

    can run with `root entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            profile = UserProfile(
                name=self.user_name,
                created_at=str(datetime.now())
            );
            root ++> profile;
            report {"status": "created"};
        } else {
            report {"status": "exists"};
        }
    }
}

walker add_medication {
    has med_name: str;
    has dosage: str;
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"status": "error", "message": "No user profile found"};
        }
    }

    can add with UserProfile entry {
        med = Medication(
            med_name=self.med_name,
            dosage=self.dosage,
            frequency=self.frequency,
            times=self.times,
            added_at=str(datetime.now())
        );
        here ++> med;
        report {"status": "added", "medication": self.med_name};
    }
}

walker get_medications {
    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        } else {
            report {"medications": []};
        }
    }

    can list with UserProfile entry {
        meds = [];
        for med in [here --> Medication] {
            if med.active {
                meds.append({
                    "name": med.med_name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "times": med.times
                });
            }
        }
        report {"medications": meds};
    }
}

walker log_dose {
    has med_name: str;
    has status: str = "taken";

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 {
            visit profiles[0];
        }
    }

    can log with UserProfile entry {
        found = false;
        for med in [here --> Medication] {
            if med.med_name.lower() == self.med_name.lower() and med.active {
                entry = DoseLog(
                    med_name=self.med_name,
                    timestamp=str(datetime.now()),
                    status=self.status
                );
                here ++> entry;
                found = true;
                break;
            }
        }
        if found {
            report {"status": "logged", "med_name": self.med_name};
        } else {
            report {"status": "error", "message": f"Medication not found: {self.med_name}"};
        }
    }
}

# ── Tool Functions for byLLM ───────────────────────────────────────────────

def get_my_medications() -> str {
    result = root spawn get_medications();
    meds = result.reports[0]["medications"] if len(result.reports) > 0 else [];
    if len(meds) == 0 {
        return "No medications currently tracked";
    }
    lines = [];
    for m in meds {
        lines.append(f"- {m['name']} {m['dosage']} ({m['frequency']}) at {', '.join(m['times'])}");
    }
    return "\n".join(lines);
}

def mark_dose_taken(medication_name: str) -> str {
    result = root spawn log_dose(med_name=medication_name, status="taken");
    r = result.reports[0] if len(result.reports) > 0 else {"status": "error"};
    return r.get("status", "error") + " for " + medication_name;
}

def mark_dose_skipped(medication_name: str) -> str {
    result = root spawn log_dose(med_name=medication_name, status="skipped");
    r = result.reports[0] if len(result.reports) > 0 else {"status": "error"};
    return r.get("status", "error");
}

def check_drug_interaction(drug1: str, drug2: str) -> str {
    try {
        url = f"https://api.fda.gov/drug/label.json?search=drug_interactions:{drug1}&limit=1";
        resp = requests.get(url, timeout=5);
        if resp.status_code == 200 {
            data = resp.json();
            if "results" in data and len(data["results"]) > 0 {
                interactions = data["results"][0].get("drug_interactions", []);
                if len(interactions) > 0 {
                    return str(interactions[0])[:300];
                }
            }
        }
    } except Exception as e {
        return f"Could not check interaction data. Please consult your pharmacist.";
    }
    return f"No interaction data found for {drug1}. Always consult your pharmacist.";
}

# ── Main Agent ──────────────────────────────────────────────────────────────

sem meddy_buddy = """
You are MeddyBuddy, a warm and caring medication management AI assistant.

You help users:
- View and manage their medications
- Log when they take or skip doses
- Check for potential drug interactions
- Understand their medication schedule
- Stay on track with their health

Always be empathetic and clear. Remind users to consult their healthcare 
provider for medical advice. You are an assistant, not a doctor.
""";

def meddy_buddy(message: str) -> str by llm(
    conversation=chat_history,
    tools=[get_my_medications, mark_dose_taken, mark_dose_skipped, check_drug_interaction],
    temperature=0.7
);

with entry {
    # Initialize user profile
    root spawn init_user(user_name="User");

    # Seed some medications (first run)
    root spawn add_medication(med_name="Aspirin", dosage="81mg", frequency="daily", times=["08:00"]);
    root spawn add_medication(med_name="Metformin", dosage="500mg", frequency="twice_daily", times=["08:00", "20:00"]);

    print("MeddyBuddy: Hi! I'm MeddyBuddy. How can I help you with your medications today?");

    while true {
        user_input = input("You: ");
        if user_input.strip() == "" {
            continue;
        }
        if user_input.lower() in ["quit", "exit", "bye"] {
            print("MeddyBuddy: Take care and remember to take your medications! Goodbye!");
            break;
        }
        response = meddy_buddy(user_input);
        print(f"MeddyBuddy: {response}");
    }
}
```

## Example 7: Structured Output from LLM

```jac
obj MedIntent {
    has action: str;          # "add_med", "log_dose", "check_interaction", "list_meds", "chat"
    has medication: str | None = None;
    has dosage: str | None = None;
    has frequency: str | None = None;
}

sem parse_intent = "Parse the user's message and determine their intent about medication management.";
def parse_intent(message: str) -> MedIntent by llm(temperature=0.0);

with entry {
    intent = parse_intent("I just took my morning aspirin");
    print(intent.action);     # "log_dose"
    print(intent.medication); # "aspirin"
}
```
