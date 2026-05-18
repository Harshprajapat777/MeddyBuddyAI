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
