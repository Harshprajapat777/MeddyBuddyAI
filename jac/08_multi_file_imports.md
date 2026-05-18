# Jac 2.0 — Multi-File Projects & Imports

## Import Syntax

```jac
# Import specific names from another .jac file
import from "./models/nodes.jac" { Medication, DoseLog, UserProfile }

# Import from a subdirectory
import from "./walkers/agent.jac" { meddy_chat, add_medication }

# Import Python module
import os;
import json;
import requests;

# Import specific Python names
import from datetime { datetime, date, timedelta }
import from pathlib { Path }
import from dotenv { load_dotenv }

# Import Python with alias
import from byllm.lib { Model, ModelPool }
```

## Include (imports ALL public symbols)

```jac
# Include all public symbols from a file
include "./models/nodes.jac";
include "./walkers/agent.jac";
```

## Relative Paths

- `"./file.jac"` — same directory
- `"./subdir/file.jac"` — subdirectory
- `"../shared/nodes.jac"` — parent directory

## Multi-File Structure (Recommended for MeddyBuddyAI)

```
MeddyBuddyAI/
├── main.jac              ← entry point + server
├── models.jac            ← node/edge definitions
├── walkers.jac           ← walker definitions
├── agent.jac             ← byLLM agent logic
├── tools.jac             ← tool functions for LLM
├── jac.toml
├── .env
└── frontend/
```

### models.jac
```jac
node UserProfile {
    has name: str = "User";
    has created_at: str = "";
}

node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has active: bool = true;
    has added_at: str = "";
}

node DoseLog {
    has med_name: str = "";
    has timestamp: str = "";
    has status: str = "taken";
}

edge has_medication {}
edge has_log {}
```

### walkers.jac
```jac
import from "./models.jac" { UserProfile, Medication, DoseLog }
import from datetime { datetime }

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
        }
        report {"status": "ok"};
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
            report {"error": "no profile"};
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
        report {"status": "added", "name": self.med_name};
    }
}
```

### agent.jac
```jac
import from "./walkers.jac" { add_medication, init_user }
import from "./tools.jac" { get_meds_text, log_dose_tool, check_interaction }
import from byllm.lib { Model }

glob llm = Model(model_name="claude-sonnet-4-6");
glob chat_history: list = [];

sem meddy_buddy = """
You are MeddyBuddy, a caring medication management assistant.
Help users track medications, log doses, and check interactions.
Always remind users to consult their healthcare provider.
""";

def meddy_buddy(message: str) -> str by llm(
    conversation=chat_history,
    tools=[get_meds_text, log_dose_tool, check_interaction],
    temperature=0.7
);

walker meddy_chat {
    has user_message: str;

    can run with `root entry {
        response = meddy_buddy(self.user_message);
        report {"response": response};
    }
}
```

### main.jac (entry point)
```jac
include "./walkers.jac";
include "./agent.jac";

with entry {
    # Initialize on first run
    root spawn init_user(user_name="User");
    print("MeddyBuddyAI backend ready.");
    print("Run: jac start main.jac");
}
```

## Single-File Approach (Simpler for Hackathon)

For a 24-hour hackathon, putting everything in one `main.jac` is fine and easier to debug:

```jac
# main.jac — everything in one file
import from byllm.lib { Model }
import from datetime { datetime }
import os;
import requests;

# Nodes
node UserProfile { ... }
node Medication { ... }
node DoseLog { ... }

# Walkers
walker init_user { ... }
walker add_medication { ... }
walker get_medications { ... }
walker log_dose { ... }
walker meddy_chat { ... }

# LLM tools
def get_my_medications() -> str { ... }
def mark_dose_taken(med: str) -> str { ... }
def check_interaction(d1: str, d2: str) -> str { ... }

# Agent
glob llm = Model(model_name="claude-sonnet-4-6");
glob history: list = [];
def meddy_agent(msg: str) -> str by llm(
    conversation=history,
    tools=[get_my_medications, mark_dose_taken, check_interaction]
);

with entry {
    root spawn init_user();
}
```
