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
