# Jac 2.0 — byLLM Integration (AI Functions)

## Core Concept

Declare a function signature → append `by llm()` → LLM implements it at runtime.

```jac
def translate(text: str) -> str by llm();
```

## Installation

```bash
pip install byllm
# or (includes everything)
pip install jaseci
```

## Configuration — jac.toml

```toml
[plugins.byllm.model]
default_model = "claude-sonnet-4-6"

[plugins.byllm.call_params]
temperature = 0.7

[plugins.byllm]
system_prompt = "You are a helpful assistant."
```

Other model options:
```toml
default_model = "gpt-4o-mini"
default_model = "gpt-4o"
default_model = "gemini/gemini-2.5-flash"
default_model = "ollama/llama3:70b"
```

## Per-Module Model Override

```jac
import from byllm.lib { Model }
glob llm = Model(model_name="claude-sonnet-4-6");

def summarize(text: str) -> str by llm();
```

## Multiple Models

```jac
import from byllm.lib { Model }

glob fast_model  = Model(model_name="gpt-4o-mini");
glob smart_model = Model(model_name="claude-sonnet-4-6");

def quick_label(text: str) -> str by fast_model();
def deep_analyze(text: str) -> str by smart_model();
```

## Semantic Annotations (sem)

Give the LLM context about what a function/field does:

```jac
sem translate = "Translate the given text to French. Preserve formatting and tone.";
def translate(text: str) -> str by llm();

sem analyze.text = "The raw input text to analyze.";
sem analyze.return = "A structured analysis with key points.";
def analyze(text: str) -> str by llm();
```

## Return Types

```jac
# Primitives
def get_summary(text: str) -> str by llm();
def count_items(text: str) -> int by llm();
def is_valid(text: str) -> bool by llm();

# Enum
enum Sentiment { POSITIVE, NEGATIVE, NEUTRAL }
def analyze_sentiment(text: str) -> Sentiment by llm();

# Object (structured output)
obj MedicationInfo {
    has name: str;
    has purpose: str;
    has common_side_effects: list[str];
    has interactions: list[str];
}
def get_med_info(med_name: str) -> MedicationInfo by llm();

# List
def extract_keywords(text: str) -> list[str] by llm();
def find_medications(text: str) -> list[str] by llm();

# Optional
def find_date(text: str) -> str | None by llm();
```

## Tool Calling (ReAct Pattern)

```jac
def get_current_time() -> str {
    import from datetime { datetime }
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S");
}

def search_openfda(drug_name: str) -> str {
    import requests;
    url = f"https://api.fda.gov/drug/label.json?search=openfda.brand_name:{drug_name}&limit=1";
    resp = requests.get(url);
    if resp.status_code == 200 {
        data = resp.json();
        if "results" in data and len(data["results"]) > 0 {
            return str(data["results"][0].get("warnings", ["No warnings found"]));
        }
    }
    return "No information found";
}

def answer_med_question(question: str) -> str by llm(
    tools=[get_current_time, search_openfda]
);
```

## Invocation Parameters

```jac
# Temperature
def creative_response(prompt: str) -> str by llm(temperature=0.9);
def factual_extract(text: str) -> str by llm(temperature=0.0);

# Max tokens
def short_summary(text: str) -> str by llm(max_tokens=100);

# Additional context injection
def personalized_greeting(name: str) -> str by llm(
    incl_info={"current_time": get_time(), "user_meds": get_meds()}
);

# Multi-turn conversation (memory)
glob history: list = [];
def chat(message: str) -> str by llm(
    conversation=history
);
```

## Conversation History (Multi-turn)

```jac
glob chat_history: list = [];

def meddy_chat(message: str) -> str by llm(
    conversation=chat_history,
    tools=[get_meds, log_dose, check_interaction]
);

sem meddy_chat = """
You are MeddyBuddy, a medication management assistant.
Help users track medications, log doses, and check interactions.
Always recommend consulting a doctor for medical advice.
""";

with entry {
    # Each call updates the history automatically
    resp1 = meddy_chat("What medications am I on?");
    resp2 = meddy_chat("I just took my Aspirin");
    resp3 = meddy_chat("Can I take ibuprofen too?");
}
```

## Object Context (LLM sees all fields)

```jac
obj MedicationProfile {
    has name: str;
    has dosage: str;
    has frequency: str;
    has allergies: list[str];

    # LLM sees all fields of this object automatically
    def get_safety_advice() -> str by llm();
    def suggest_schedule() -> str by llm();
}
```

## Error Handling

```jac
import from byllm.lib { ByLLMError }

try {
    result = meddy_chat("question");
} except e: ByLLMError {
    print(f"LLM error: {e}");
    result = "Sorry, I encountered an error. Please try again.";
}
```

## Full Example: Medication Agent with byLLM

```jac
import from byllm.lib { Model }
import requests;

glob llm = Model(model_name="claude-sonnet-4-6");
glob conversation_history: list = [];

# Tool: check drug interactions via OpenFDA
def check_drug_interaction(drug1: str, drug2: str) -> str {
    url = f"https://api.fda.gov/drug/label.json?search=drug_interactions:{drug1}&limit=1";
    try {
        resp = requests.get(url, timeout=5);
        if resp.status_code == 200 {
            data = resp.json();
            if "results" in data {
                interactions = data["results"][0].get("drug_interactions", ["No data"]);
                return str(interactions[0])[:500];
            }
        }
    } except Exception as e {
        return f"Could not fetch interaction data: {e}";
    }
    return "No interaction data found";
}

sem meddy_agent = """
You are MeddyBuddy, a caring medication management assistant.
Help users manage their medications, track doses, and stay safe.
Use tools to check drug interactions when asked.
Always remind users to consult their healthcare provider.
""";

def meddy_agent(user_message: str) -> str by llm(
    conversation=conversation_history,
    tools=[check_drug_interaction],
    temperature=0.7
);

with entry {
    print(meddy_agent("I take Aspirin 81mg and Metformin 500mg. Any interactions?"));
}
```
