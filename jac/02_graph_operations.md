# Jac 2.0 — Graph Operations

## Creating Nodes

```jac
# Create node (not attached to graph yet)
alice = Person(name="Alice", age=30);

# Create and immediately attach to root
root ++> Person(name="Alice", age=30);
```

## Connecting Nodes with Edges

```jac
# Simple untyped edge  (root --> alice)
root ++> alice;

# Chain connections
root ++> alice ++> bob ++> charlie;

# Typed edge (no data)
alice +:FriendsWith:+> bob;

# Typed edge (with data)
alice +:FriendsWith(since="2020", closeness=9):+> bob;

# Bidirectional
alice <++> bob;

# Disconnect
alice del --> bob;      # remove edge from alice to bob
```

## Traversal with visit

```jac
# Visit ALL connected nodes (untyped)
visit [-->];

# Visit connected nodes of a specific type
visit [-->][Person];                  # only Person nodes

# Visit via specific edge type
visit [-->:FriendsWith:-->];          # only FriendsWith edges

# Visit specific node
visit alice;

# Visit all from root
visit [root -->];
```

## Reading Connected Nodes

```jac
# Get all direct children
children = [here -->];

# Get all children of a specific type
friends = [here --> Person];

# Get via specific edge type
colleagues = [here -:WorksWith:-> Person];

# Get from root
all_meds = [root --> Medication];

# Filter with condition
active = [here --> Medication][?active == true];
# or:
active_meds = [];
for med in [here --> Medication] {
    if med.active {
        active_meds.append(med);
    }
}
```

## Spawn (Running Walkers)

```jac
# Spawn walker starting at root
root spawn FindPerson(target="Alice");

# Spawn and capture result
result = root spawn MyWalker(param="value");

# Access reports
for item in result.reports {
    print(item);
}
```

## Report

```jac
# Send data to caller without stopping
report {"status": "ok", "name": here.name};

# Can report multiple times during traversal
walker CollectAll {
    can gather with Person entry {
        report {"name": here.name, "age": here.age};
        visit [-->];
    }
}
```

## Complete Walker + Spawn Example

```jac
node Medication {
    has med_name: str;
    has dosage: str;
    has active: bool = true;
}

walker list_meds {
    can run with `root entry {
        meds = [];
        for med in [root --> Medication] {
            if med.active {
                meds.append({"name": med.med_name, "dosage": med.dosage});
            }
        }
        report {"medications": meds};
    }
}

with entry {
    root ++> Medication(med_name="Aspirin", dosage="81mg");
    root ++> Medication(med_name="Metformin", dosage="500mg");

    result = root spawn list_meds();
    print(result.reports[0]);
}
```

## Graph Persistence (Memory Across Sessions)

Jac automatically persists the graph when using `jac serve`. For `jac run`, you can use the `--persist` flag or manage state manually.

```bash
# Run and persist graph state to a file
jac run main.jac --persist myapp.jsdb

# Serve with automatic persistence
jac serve main.jac
```

## Checking Node Existence

```jac
profiles = [root --> UserProfile];
if len(profiles) == 0 {
    # Create first time
    profile = UserProfile(name="User");
    root ++> profile;
} else {
    profile = profiles[0];
}
```

## Deleting Nodes / Edges

```jac
# Soft delete (set field)
here.active = false;

# Disconnect edge
here del --> target_node;

# Destroy node (removes from graph)
destroy here;
```
