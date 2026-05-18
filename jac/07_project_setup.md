# Jac 2.0 — New Project Setup from Scratch

## Install

```bash
pip install jaseci byllm python-dotenv requests
```

Or full one-liner (Linux/Mac):
```bash
curl -fsSL https://raw.githubusercontent.com/jaseci-labs/jaseci/main/scripts/install.sh | bash
```

Windows virtual env:
```bash
python -m venv jac-env
jac-env\Scripts\activate
pip install jaseci byllm python-dotenv requests
```

## Create a New Project

```bash
jac create my-app --use client     # Full-stack (Jac backend + React frontend)
jac create my-app --use fullstack  # Alternative fullstack template
cd my-app
jac install                        # Install dependencies
jac start                          # Start dev server
```

Or manually (hackathon-friendly):
```
my-project/
├── main.jac          # entry point
├── jac.toml          # project config (LLM, server, deps)
├── .env              # API keys — NEVER commit
├── .gitignore
├── requirements.txt
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

## Minimal Project Files

### .env
```
ANTHROPIC_API_KEY=sk-ant-...
```

### .gitignore
```
.env
__pycache__/
*.pyc
.jac/
jac-env/
node_modules/
```

### jac.toml (minimal)
```toml
[project]
name = "MeddyBuddyAI"
version = "0.1.0"

[plugins.byllm.model]
default_model = "claude-sonnet-4-6"
api_key = "${ANTHROPIC_API_KEY}"

[plugins.byllm.call_params]
temperature = 0.7
max_tokens = 2000

[serve]
port = 8000
```

### jac.toml (full options)
```toml
[project]
name = "MeddyBuddyAI"
version = "0.1.0"
entry-point = "main.jac"
description = "AI-powered medication management agent"

[dependencies]
byllm = ">=0.6.0"
requests = ">=2.31.0"

[serve]
port = 8000

[run]
session = "default"
cache = true

[plugins.byllm.model]
default_model = "claude-sonnet-4-6"
api_key = "${ANTHROPIC_API_KEY}"

[plugins.byllm.call_params]
temperature = 0.7
max_tokens = 2000

[plugins.byllm]
system_prompt = "You are MeddyBuddy, a medication management assistant."

[environments.production]
[environments.production.plugins.byllm.model]
default_model = "claude-opus-4-7"
```

## Environment Variable Syntax in jac.toml
- `${VAR}` — required, error if missing
- `${VAR:-default}` — optional with fallback
- `${VAR:?custom error}` — required with custom error message

## Start Commands

```bash
# Run once (executes `with entry` block)
jac run main.jac

# Start as API server
jac start main.jac              # http://localhost:8000
jac start main.jac --dev        # with hot reload
jac start main.jac --port 3000  # custom port

# Alternative (older)
jac serve main.jac --reload
```

Auto-generated docs: `http://localhost:8000/docs`
Graph visualizer: `http://localhost:8000/graph`

## requirements.txt

```
jaseci>=2.0.0
byllm>=0.6.0
python-dotenv>=1.0.0
requests>=2.31.0
```
