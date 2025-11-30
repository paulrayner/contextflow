# AGENTS.md

Instructions for AI coding agents working on ContextFlow.

## Issue Tracking with bd (beads)

This project uses **bd (beads)** for tactical issue tracking during AI coding sessions. The human-readable roadmap and backlog remain in [docs/TODO.md](docs/TODO.md).

### Usage Model

| Tool | Purpose | Maintainer |
|------|---------|------------|
| `docs/TODO.md` | Human-readable roadmap, backlog, completed work | Human (Paul) |
| `.beads/` | Active work tracking, discovered bugs, follow-ups | AI (Claude) |

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Found bug while working" -p 1 --deps discovered-from:contextflow-123 --json
```

**Claim and update:**
```bash
bd update contextflow-42 --status in_progress --json
bd update contextflow-42 --priority 1 --json
```

**Complete work:**
```bash
bd close contextflow-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit `.beads/issues.jsonl` with code changes

### Session End Protocol

Before ending a session:
1. Close completed issues
2. Update in-progress status on unfinished work
3. File any discovered bugs or follow-ups
4. Run `bd sync` to flush changes
5. Commit and push

### Important Rules

- Use bd for tactical work tracking during sessions
- Always use `--json` flag for programmatic use
- Link discovered work with `discovered-from` dependencies
- Check `bd ready` before asking "what should I work on?"
- Do NOT duplicate tracking - bd is for session work, TODO.md is for roadmap
