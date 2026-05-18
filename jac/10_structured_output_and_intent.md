# Jac 2.0 — Structured Output & Intent Parsing

## Structured Output (LLM → Object)

```jac
obj MedIntent {
    has action: str;         # "add_med", "log_dose", "list_meds", "check_interaction", "chat"
    has medication: str | None = None;
    has dosage: str | None = None;
    has frequency: str | None = None;
    has status: str | None = None;   # "taken" or "skipped"
    has drug2: str | None = None;    # for interaction checks
}

sem parse_intent = """
Parse the user's natural language message about medication management.
Determine their intent and extract relevant fields.
Actions: add_med, log_dose, list_meds, check_interaction, get_adherence, chat
""";

def parse_intent(message: str) -> MedIntent by llm(temperature=0.0);
```

Usage:
```jac
intent = parse_intent("I just took my morning aspirin");
# intent.action = "log_dose"
# intent.medication = "aspirin"
# intent.status = "taken"
```

## Enum Output

```jac
enum MedFrequency {
    DAILY,
    TWICE_DAILY,
    THREE_TIMES_DAILY,
    AS_NEEDED,
    WEEKLY
}

sem parse_frequency = "Parse the medication frequency from natural language.";
def parse_frequency(text: str) -> MedFrequency by llm(temperature=0.0);
```

## List Output

```jac
def extract_medications(text: str) -> list[str] by llm();
sem extract_medications = "Extract all medication names mentioned in the text.";

meds = extract_medications("I take aspirin in the morning and metformin twice a day");
# meds = ["aspirin", "metformin"]
```

## Nested Structured Output

```jac
obj SideEffect {
    has name: str;
    has severity: str;   # mild, moderate, severe
}

obj MedicationInfo {
    has generic_name: str;
    has purpose: str;
    has common_side_effects: list[SideEffect];
    has max_daily_dose: str;
    has take_with_food: bool;
}

sem get_med_info = "Provide general information about this medication. Not medical advice.";
def get_med_info(medication_name: str) -> MedicationInfo by llm();
```

## Object Method as byLLM

```jac
obj MedicationProfile {
    has name: str;
    has dosage: str;
    has frequency: str;
    has allergies: list[str];
    has current_conditions: list[str];

    # LLM automatically sees all fields as context
    def get_safety_advice() -> str by llm();
    def suggest_best_time() -> str by llm();
}
```

## Semantic Annotations for Better Results

```jac
obj AdherenceReport {
    has medication: str;
    has taken_count: int;
    has missed_count: int;
    has adherence_percent: float;
    has recommendation: str;
}

sem AdherenceReport.adherence_percent = "Percentage of doses taken on time (0-100)";
sem AdherenceReport.recommendation = "Brief personalized advice to improve adherence";

sem generate_adherence_report = "Generate a medication adherence report with recommendations.";
def generate_adherence_report(medication: str, taken: int, missed: int) -> AdherenceReport by llm();
```
