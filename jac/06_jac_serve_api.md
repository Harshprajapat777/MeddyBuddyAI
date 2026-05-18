# Jac 2.0 — jac serve & Walker API Endpoints

## How It Works

`jac serve main.jac` starts a FastAPI server where each walker becomes a REST endpoint automatically.

```
Walker name: add_medication
→ Endpoint: POST /walker/add_medication
```

## Starting the Server

```bash
jac serve main.jac                    # default port 8000
jac serve main.jac --port 8080
jac serve main.jac --reload           # hot reload for dev
jac serve main.jac --host 0.0.0.0     # expose to network
```

API docs: `http://localhost:8000/docs`

## Calling Walker Endpoints

### Add Medication

```bash
curl -X POST http://localhost:8000/walker/add_medication \
  -H "Content-Type: application/json" \
  -d '{"med_name": "Aspirin", "dosage": "81mg", "frequency": "daily", "times": ["08:00"]}'
```

Response:
```json
{
  "status": "success",
  "reports": [{"status": "added", "medication": "Aspirin"}]
}
```

### Chat with Agent

```bash
curl -X POST http://localhost:8000/walker/meddy_chat \
  -H "Content-Type: application/json" \
  -d '{"user_message": "What medications am I on?"}'
```

Response:
```json
{
  "status": "success",
  "reports": [{"response": "You are currently on: Aspirin 81mg...", "medications": [...]}]
}
```

## Custom HTTP Method / Path (jac-cloud style)

```jac
walker get_medications {
    class __specs__ {
        methods: list = ["get"];
        path: str = "/medications";
    }

    can run with `root entry {
        # ...
        report {"medications": meds};
    }
}
```

```bash
curl http://localhost:8000/medications
```

## Frontend JavaScript (Fetch API)

```javascript
const API_BASE = "http://localhost:8000";

async function chat(message) {
    const resp = await fetch(`${API_BASE}/walker/meddy_chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({user_message: message})
    });
    const data = await resp.json();
    return data.reports[0].response;
}

async function addMedication(name, dosage, frequency) {
    const resp = await fetch(`${API_BASE}/walker/add_medication`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({med_name: name, dosage, frequency, times: ["08:00"]})
    });
    return await resp.json();
}

async function getMedications() {
    const resp = await fetch(`${API_BASE}/walker/get_medications`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({})
    });
    const data = await resp.json();
    return data.reports[0].medications;
}

async function logDose(medName, status = "taken") {
    const resp = await fetch(`${API_BASE}/walker/log_dose`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({med_name: medName, status})
    });
    return await resp.json();
}
```

## CORS Configuration

By default `jac serve` enables CORS. If you need to configure it manually:

```jac
# In your main.jac, add CORS settings via jac.toml or env vars
# Most dev setups work out of the box with jac serve
```

## Health Check

```bash
curl http://localhost:8000/healthz
# or
curl http://localhost:8000/
```

## Notes for Hackathon

- `jac serve` = your backend, no extra server.py needed
- Walker parameters become the POST body JSON fields
- `report` values appear in the response `reports` array
- Graph state persists automatically between requests
- Frontend just calls `http://localhost:8000/walker/<name>`
