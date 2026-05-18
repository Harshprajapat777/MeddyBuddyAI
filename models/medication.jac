node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has frequency: str = "daily";
    has times: list[str] = ["08:00"];
    has notes: str = "";
    has active: bool = true;
    has added_at: str = "";
}

node DoseLog {
    has med_name: str = "";
    has timestamp: str = "";
    has status: str = "taken";
    has note: str = "";
}
