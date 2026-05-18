node Alert {
    has alert_id: str = "";
    has severity: str = "info";
    has category: str = "general";
    has message: str = "";
    has suggested_action: str = "";
    has created_at: str = "";
    has acknowledged: bool = false;
}
