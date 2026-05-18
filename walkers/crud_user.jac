import from "../models/user.jac" { UserProfile }
import from datetime { datetime }


walker init_user {
    has user_name: str = "User";
    has email: str = "";
    has timezone: str = "Asia/Kolkata";

    can run with `root entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            profile = UserProfile(
                name=self.user_name,
                email=self.email,
                timezone=self.timezone,
                created_at=str(datetime.now())
            );
            root ++> profile;
            report {"status": "created", "name": self.user_name};
        } else {
            p = existing[0];
            report {"status": "exists", "name": p.name, "email": p.email};
        }
    }
}


walker get_profile {
    can run with `root entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            report {"status": "no_profile"};
        } else {
            p = existing[0];
            report {
                "name": p.name,
                "email": p.email,
                "timezone": p.timezone,
                "sleep_time": p.sleep_time,
                "wake_time": p.wake_time,
                "created_at": p.created_at
            };
        }
    }
}


walker update_profile {
    has email: str = "";
    has timezone: str = "";
    has sleep_time: str = "";
    has wake_time: str = "";

    can run with `root entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            report {"status": "error", "message": "no profile"};
        } else {
            p = existing[0];
            if self.email != "" { p.email = self.email; }
            if self.timezone != "" { p.timezone = self.timezone; }
            if self.sleep_time != "" { p.sleep_time = self.sleep_time; }
            if self.wake_time != "" { p.wake_time = self.wake_time; }
            report {"status": "updated"};
        }
    }
}
