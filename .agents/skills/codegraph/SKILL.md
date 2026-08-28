---
name: codegraph
description: >-
  Use CodeGraph to semantically explore the codebase, search symbols (functions, classes,
  routes, interfaces), inspect AST nodes with caller/callee hierarchy, analyze change impact/blast
  radius, and identify affected tests/dependents.
---

# 🧠 CodeGraph Skill

This skill guides you on using **CodeGraph** for fast, high-accuracy codebase exploration, dependency graph traversal, call-hierarchy tracing, and impact analysis.

---

## ⚡ When to Use CodeGraph

Always prioritize CodeGraph over raw ripgrep/file-search when:
1. **Navigating Architecture & Flows**: Tracing end-to-end execution paths (e.g. from Controller -> Service -> Repository / DB).
2. **Finding Callers / Callees**: Understanding everywhere a function, class, or method is invoked or what it depends on.
3. **Assessing Change Impact (Blast Radius)**: Before modifying an existing function/interface, checking what downstream consumers might break.
4. **Targeted Symbol Lookup**: Viewing a symbol's exact definition along with its context, caller/callee trails, and line numbers in one shot.
5. **Identifying Affected Tests**: Finding which unit/integration tests cover modified files.

---

## 🛠️ CLI Quick Reference

Run these commands using `run_command` in the project root:

### 1. Semantic Area Exploration (`explore`)
Explores an area of interest and retrieves relevant symbols, source code blocks, and call paths in a single pass:
```bash
codegraph explore "<query or feature name>"
```
*Example:* `codegraph explore "auth guard token validation"`

### 2. Symbol Node Deep-Dive (`node`)
Inspects a symbol's source code, definitions, caller trail, and callee trail:
```bash
codegraph node <symbol_name>
```
*Example:* `codegraph node SupabaseAuthGuard` or `codegraph node getDraft`

### 3. Symbol Search (`query`)
Searches the indexed knowledge graph for matching classes, interfaces, functions, routes, types:
```bash
codegraph query <term>
```
*Example:* `codegraph query Resume`

### 4. Call Hierarchy (`callers` & `callees`)
- Find all functions/methods that **call** a target symbol:
  ```bash
  codegraph callers <symbol_name>
  ```
- Find all functions/methods that a target symbol **calls**:
  ```bash
  codegraph callees <symbol_name>
  ```

### 5. Impact & Blast Radius Analysis (`impact`)
Analyzes the entire dependency graph to see what code and components will be affected if a symbol changes:
```bash
codegraph impact <symbol_name>
```

### 6. Affected Tests & Dependents (`affected`)
Finds test files and modules affected by modified source files:
```bash
codegraph affected path/to/file.ts
```

### 7. Index Status & Sync (`status` / `sync`)
- Check graph health and node counts:
  ```bash
  codegraph status
  ```
- Sync recent changes manually (note: file watcher auto-syncs in background):
  ```bash
  codegraph sync
  ```

---

## 🔌 MCP Integration

CodeGraph is configured in `mcp_config.json` as an MCP server with `codegraph serve --mcp`. When active, you can also access the tools via MCP or direct CLI execution.

---

## 💡 Best Practices

1. **Start with `explore` or `query`** when beginning a new feature or debugging to quickly map out the relevant files without manual grep scanning.
2. **Run `impact <symbol>`** before refactoring or removing functions/types to avoid unexpected breakage.
3. **Use `callers` / `callees`** to build precise architecture mental models and trace data flow.
