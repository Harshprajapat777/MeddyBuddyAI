# Jac 2.0 — Installation & Running

## Install (Full Stack)

```bash
# Full ecosystem (recommended for hackathon)
pip install jaseci

# Or install individually
pip install jaclang      # core language
pip install byllm        # LLM integration (by llm())
pip install jac-client   # frontend client tools
pip install jac-scale    # production server (replaces jac-cloud)
```

## Windows Virtual Environment

```bash
python -m venv jac-env
jac-env\Scripts\activate
pip install jaseci
pip install byllm
```

## Verify Installation

```bash
jac --version
```

## Running Jac Programs

```bash
# Run a .jac file (executes `with entry` block)
jac run main.jac

# Run with arguments (accessible via sys.argv)
jac run main.jac '{"action": "add_med"}'

# Run and persist graph state
jac run main.jac --persist myapp.jsdb
```

## Serving as an API (jac serve)

```bash
# Start as a web server (walkers become REST endpoints)
jac serve main.jac

# Custom port
jac serve main.jac --port 8080

# With hot reload (dev mode)
jac serve main.jac --reload

# Print API docs without starting server
jac serve main.jac --faux
```

API auto-docs available at: `http://localhost:8000/docs`

Walker endpoints auto-generated at: `http://localhost:8000/walker/<walker_name>`

## Project Structure (Hackathon)

```
MeddyBuddyAI/
├── main.jac              # entry point + walker definitions
├── models.jac            # node/edge definitions
├── agent.jac             # LLM agent logic
├── jac.toml              # Jac config (LLM model, etc.)
├── .env                  # API keys (never commit)
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

## jac.toml (Project Config)

```toml
[project]
name = "MeddyBuddyAI"
version = "0.1.0"

[plugins.byllm.model]
default_model = "claude-sonnet-4-6"

[plugins.byllm.call_params]
temperature = 0.7

[plugins.byllm]
system_prompt = "You are MeddyBuddy, a medication management assistant."
```

## Environment Variables

```bash
# .env file (never commit to git)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Load in Jac:
```jac
import os;
api_key = os.environ.get("ANTHROPIC_API_KEY", "");
```

Or load via python-dotenv:
```jac
import from dotenv { load_dotenv }
load_dotenv();
import os;
api_key = os.environ.get("ANTHROPIC_API_KEY", "");
```

## Walker as API Endpoint

When using `jac serve`, each walker becomes a POST endpoint:

```
POST http://localhost:8000/walker/add_medication
Content-Type: application/json

{
  "med_name": "Aspirin",
  "dosage": "81mg",
  "frequency": "daily"
}
```

Response contains `reports` array:
```json
{
  "status": "success",
  "reports": [{"status": "added", "medication": {...}}]
}
```

## Walker with __specs__ (Custom HTTP Method)

```jac
walker get_medications {
    class __specs__ {
        methods: list = ["get"];
        path: str = "/medications";
    }

    can run with `root entry {
        meds = [root --> Medication];
        report {"medications": [{"name": m.med_name} for m in meds]};
    }
}
```

## Running with Python Interop (server.py approach)

If you prefer a Python FastAPI wrapper calling Jac:

```python
# server.py
import subprocess
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

def run_walker(walker: str, args: dict) -> dict:
    cmd = ["jac", "run", "main.jac"]
    # Pass args via env or stdin
    result = subprocess.run(cmd, capture_output=True, text=True,
                           env={"JAC_WALKER": walker, "JAC_ARGS": json.dumps(args)})
    return json.loads(result.stdout)

@app.post("/chat")
def chat(body: dict):
    return run_walker("meddy_chat", body)
```

## Requirements File

```
# requirements.txt
jaseci>=2.0.0
byllm>=0.6.0
python-dotenv>=1.0.0
fastapi>=0.110.0
uvicorn>=0.27.0
requests>=2.31.0
anthropic>=0.25.0
```

## Run the Full App (Dev)

```bash
# Terminal 1: Start Jac backend
jac serve main.jac --port 8000 --reload

# Terminal 2: Serve frontend (Python)
cd frontend
python -m http.server 3000
# Then open http://localhost:3000
```
