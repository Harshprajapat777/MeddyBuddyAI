# Jac 2.0 — Syntax Basics

## Node Definition

```jac
node Person {
    has name: str;
    has age: int = 0;
    has active: bool = true;
    has tags: list[str] = [];
    has meta: dict = {};
}

node Task {
    has title: str;
    has done: bool = false;
    has priority: int = 1;
}
```

## Edge Definition

```jac
# Simple edge (no data)
edge FriendsWith;

# Edge with data
edge FriendsWith {
    has since: str = "";
    has closeness: int = 0;
}
```

## Walker Definition

```jac
walker FindPerson {
    has target: str;        # walker parameters (set at spawn time)

    # Entry on root
    can start with `root entry {
        visit [-->];        # traverse all outgoing edges from root
    }

    # Entry on a specific node type
    can search with Person entry {
        if here.name == self.target {
            print(f"Found {here.name}!");
            disengage;      # stop the walker immediately
        }
        visit [-->];        # keep traversing
    }
}
```

## Key Keywords

| Keyword | Meaning |
|---------|---------|
| `here`  | The current node the walker is visiting |
| `self`  | The walker instance itself |
| `visit [-->]` | Continue traversal to all connected nodes |
| `visit [-->:EdgeType:-->]` | Traverse only specific edge types |
| `report value;` | Send data back to the caller (like return, but non-stopping) |
| `disengage;` | Stop the walker immediately |
| `root` | The global root node of the graph |
| `spawn` | Run a walker starting at a node |

## Abilities in Nodes (can … with walker entry)

Nodes can also define abilities that run when a walker visits them:

```jac
node Greeter {
    has greeting: str = "Hello";

    can say_hi with FindPerson entry {
        # visitor is the walker
        print(f"{self.greeting}, {visitor.target}!");
    }
}
```

## Python Imports

```jac
# Import whole module
import os;
import json;
import datetime;

# Import specific names
import from datetime { datetime, date, timedelta }
import from pathlib { Path }
import from typing { Optional, List }

# Old-style (also works)
import:py from datetime, datetime;
import:py from os.path, join, exists;
```

## Global Variables

```jac
glob counter: int = 0;
glob config: dict = {};
glob llm = Model(model_name="claude-sonnet-4-6");
```

## Object (like a dataclass)

```jac
obj Address {
    has street: str;
    has city: str;
    has zip: str = "";
}
```

## Functions (top-level)

```jac
def add(a: int, b: int) -> int {
    return a + b;
}

def greet(name: str) -> str {
    return f"Hello, {name}!";
}
```

## Entry Point

```jac
with entry {
    # Runs when file is executed with `jac run main.jac`
    alice = Person(name="Alice", age=30);
    root ++> alice;
    root spawn FindPerson(target="Alice");
}
```

## Conditionals

```jac
if x > 0 {
    print("positive");
} elif x == 0 {
    print("zero");
} else {
    print("negative");
}
```

## Loops

```jac
for item in my_list {
    print(item);
}

for i in range(10) {
    print(i);
}

while condition {
    do_something();
}
```

## Error Handling

```jac
try {
    result = risky_call();
} except Exception as e {
    print(f"Error: {e}");
}
```

## String Operations

```jac
name = "Alice";
upper = name.upper();
lower = name.lower();
stripped = name.strip();
contains = "lic" in name;          # True
split_parts = "a,b,c".split(",");
joined = ", ".join(["a", "b"]);
formatted = f"Hello, {name}!";
```

## List/Dict Operations

```jac
items = [1, 2, 3];
items.append(4);
length = len(items);
first = items[0];
last = items[-1];
sliced = items[1:3];

my_dict = {"key": "value"};
val = my_dict.get("key", "default");
has_key = "key" in my_dict;
keys = list(my_dict.keys());
```
