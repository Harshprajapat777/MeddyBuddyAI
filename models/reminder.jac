node Reminder {
    has reminder_id: str = "";
    has reminder_type: str = "medication";
    has title: str = "";
    has message: str = "";
    has scheduled_time: str = "";
    has recurrence: str = "daily";
    has channel: str = "email";
    has active: bool = true;
    has created_at: str = "";
}

node NotificationLog {
    has reminder_id: str = "";
    has sent_at: str = "";
    has channel: str = "email";
    has status: str = "sent";
    has error: str = "";
}
