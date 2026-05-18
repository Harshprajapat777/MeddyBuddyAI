# Jac 2.0 — Walker API Endpoints & Graph Persistence

## Walker → REST Endpoint (Automatic)

When you run `jac start main.jac`, every walker becomes a POST endpoint:

```
Walker name:   add_medication
→ Endpoint:    POST /walker/add_medication
```

## Public vs Private Walkers

```jac
# Public (accessible via API) — use walker:pub
walker:pub add_medication {
    has med_name: str;
    has dosage: str;
    ...
}

# Private (internal only) — use walker
walker internal_helper {
    ...
}
```

> **Note:** If `walker:pub` syntax doesn't work in your version, try plain `walker` — older versions expose all walkers.

## Request Format

POST body is JSON with walker's `has` fields:

```bash
curl -X POST http://localhost:8000/walker/add_medication \
  -H "Content-Type: application/json" \
  -d '{
    "med_name": "Aspirin",
    "dosage": "81mg",
    "frequency": "daily",
    "times": ["08:00"]
  }'
```

## Response Format

```json
{
  "ok": true,
  "type": "walker:pub:add_medication",
  "data": {
    "result": null,
    "reports": [
      {"status": "added", "name": "Aspirin"}
    ]
  },
  "error": null,
  "meta": {}
}
```

Access reports in JavaScript:
```javascript
const data = await resp.json();
const result = data.reports[0];           // older format
// or
const result = data.data.reports[0];      // newer format
// Safe access:
const reports = data.reports ?? data.data?.reports ?? [];
```

## Graph State Persistence

**`jac start` automatically persists the graph** using SQLite in `.jac/data/`.

- Nodes and edges survive between requests
- No extra configuration needed for local dev
- State is maintained across server restarts

```bash
# Data stored here (auto-created)
.jac/
└── data/
    └── graph.db    # SQLite database
```

## Checking Existing State (Init Pattern)

Always guard against re-initializing on restart:

```jac
walker init_user {
    can run with `root entry {
        existing = [root --> UserProfile];
        if len(existing) == 0 {
            # First run — create profile
            root ++> UserProfile(name="User", created_at=str(datetime.now()));
            report {"status": "created"};
        } else {
            # Already exists — skip
            report {"status": "exists"};
        }
    }
}
```

## Custom HTTP Method / Path

```jac
walker get_medications {
    class __specs__ {
        methods: list = ["get"];
        path: str = "/medications";
    }

    can run with `root entry {
        meds = [];
        for med in [root --> UserProfile --> Medication] {
            if med.active { meds.append({"name": med.med_name}); }
        }
        report {"medications": meds};
    }
}
```

```bash
curl http://localhost:8000/medications
```

## CORS (Cross-Origin for Frontend)

`jac start` enables CORS by default for local development. If you need explicit CORS config, add to `jac.toml`:

```toml
[serve]
port = 8000
cors_origins = ["*"]             # allow all (dev only)
# cors_origins = ["http://localhost:3000"]  # production
```

## Auto-Generated API Docs

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/openapi.json`
- **Graph Visualizer:** `http://localhost:8000/graph`

## JavaScript Fetch Patterns

```javascript
const BASE = "http://localhost:8000";

// Generic walker caller
async function callWalker(name, args = {}) {
    const resp = await fetch(`${BASE}/walker/${name}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(args)
    });
    const data = await resp.json();
    // Handle both response formats
    return data.reports ?? data.data?.reports ?? [];
}

// Usage
const reports = await callWalker("add_medication", {
    med_name: "Aspirin",
    dosage: "81mg",
    frequency: "daily"
});

const chatReports = await callWalker("meddy_chat", {
    user_message: "What medications am I on?"
});
console.log(chatReports[0].response);
```

## jac-scale vs jac-cloud

| | jac-cloud (deprecated) | jac-scale (current) | Local dev |
|--|---|---|---|
| Status | Deprecated | Current/recommended | Built-in |
| Database | Custom | MongoDB | SQLite |
| Deployment | Docker | Kubernetes | localhost |
| Install | `pip install jac-cloud` | `pip install jac-scale` | Included in jaseci |
| Use for | — | Production | Development/Demo |

**For the hackathon: just use `jac start main.jac` — no jac-scale needed.**

## Production (jac-scale, optional)

```bash
pip install jac-scale
export MONGODB_URI="mongodb://localhost:27017/jac_db"
jac start main.jac --scale
# → Kubernetes manifests auto-generated
# → http://localhost:8000
```
