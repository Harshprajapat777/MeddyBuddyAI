# MeddyBuddyAI — Jac Quick Reference Index

## All Reference Files

| File | Contents |
|------|---------|
| [01_syntax_basics.md](01_syntax_basics.md) | node, walker, edge, has, can, import, loops, conditionals, strings |
| [02_graph_operations.md](02_graph_operations.md) | ++>, visit, report, disengage, spawn, traversal, delete |
| [03_byllm_integration.md](03_byllm_integration.md) | by llm(), tools, conversation history, Model, jac.toml |
| [04_installation_and_running.md](04_installation_and_running.md) | pip install, jac run, jac start/serve, project structure |
| [05_full_examples.md](05_full_examples.md) | Complete working programs (graph + byLLM + tools) |
| [06_jac_serve_api.md](06_jac_serve_api.md) | Walker → REST endpoints, curl, JS fetch calls |
| [07_project_setup.md](07_project_setup.md) | jac create, jac.toml full config, .env, .gitignore |
| [08_multi_file_imports.md](08_multi_file_imports.md) | import from, include, multi-file project layout |
| [09_walker_api_and_persistence.md](09_walker_api_and_persistence.md) | walker:pub, response format, graph persistence, CORS |
| [10_structured_output_and_intent.md](10_structured_output_and_intent.md) | obj return types, enum, list, intent parsing, sem annotations |

---

## 30-Second Cheat Sheet

### Node
```jac
node Medication {
    has med_name: str = "";
    has dosage: str = "";
    has active: bool = true;
}
```

### Walker
```jac
walker add_medication {
    has med_name: str;
    has dosage: str;

    can run with `root entry {
        profiles = [root --> UserProfile];
        if len(profiles) > 0 { visit profiles[0]; }
    }

    can add with UserProfile entry {
        here ++> Medication(med_name=self.med_name, dosage=self.dosage);
        report {"status": "added"};
    }
}
```

### Spawn & read result
```jac
result = root spawn add_medication(med_name="Aspirin", dosage="81mg");
print(result.reports[0]);
```

### LLM agent with memory + tools
```jac
import from byllm.lib { Model }
glob llm = Model(model_name="claude-sonnet-4-6");
glob history: list = [];

def my_tool() -> str { return "tool result"; }

sem chat = "You are a helpful assistant.";
def chat(message: str) -> str by llm(conversation=history, tools=[my_tool]);
```

### Run as API server
```bash
jac start main.jac --port 8000
# Endpoint: POST http://localhost:8000/walker/add_medication
# Docs:     http://localhost:8000/docs
```

### Call from JS
```javascript
const resp = await fetch("http://localhost:8000/walker/meddy_chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({user_message: "What meds am I on?"})
});
const data = await resp.json();
const reports = data.reports ?? data.data?.reports ?? [];
console.log(reports[0].response);
```

---

## Install Everything

```bash
pip install jaseci byllm python-dotenv requests
```

## jac.toml (minimal)

```toml
[plugins.byllm.model]
default_model = "claude-sonnet-4-6"
api_key = "${ANTHROPIC_API_KEY}"

[plugins.byllm.call_params]
temperature = 0.7
```

## 10 Key Rules

1. `here` = current node (inside walker ability)
2. `self` = walker's own fields
3. `report value;` = send data back (non-stopping)
4. `disengage;` = stop walker immediately
5. `visit [-->]` = traverse to all connected nodes
6. `root ++> node` = attach node to graph
7. `[root --> NodeType]` = get all nodes of type
8. `by llm()` = LLM implements the function at runtime
9. `conversation=history` = multi-turn chat memory
10. `jac start main.jac` = walkers → REST endpoints automatically
