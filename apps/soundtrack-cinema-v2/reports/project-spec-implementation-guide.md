# Agent Orchestration — Implementation Guide
## Soundtrack Cinema v2

This guide walks you through running the wave-based parallel build defined in
`PROJECT_SPEC.md`. It's written for a first-time orchestration run.

---

## 1. Mental Model

```
You (human)
  └── Orchestrator session  (Opus — 1 long-running Claude Code process)
        ├── Wave 1: spawns 5 subagents in parallel  (Sonnet each)
        ├── → build check
        ├── Wave 2: spawns 3 subagents in parallel  (Sonnet each)
        ├── → build check
        ├── Wave 3: spawns 4 subagents in parallel  (Sonnet each)
        ├── → build check
        └── Wave 4: spawns 1 subagent               (Sonnet)
              → final smoke test
```

- The orchestrator is **one Claude Code session** that runs for the entire build.
  It reads `PROJECT_SPEC.md`, launches agents, waits for results, runs `ng build`
  between waves, and proceeds automatically.
- Subagents are **short-lived child processes** spun up by the orchestrator's `Agent`
  tool calls. Each one gets a task file, writes its files, and exits.
- **You do not need to intervene between waves.** The orchestrator handles progression
  automatically within its `--max-turns` budget. Walk away once it starts.

---

## 2. Prerequisites

Before launching, do these manually (takes ~2 minutes):

```bash
cd apps/soundtrack-cinema-v2

# Install the two packages the spec requires that aren't in package.json yet
npm install @angular/cdk@^21.0.0 @anthropic-ai/sdk

# Copy the environment template (fill in your keys before running)
cp spec/contracts/env.md /dev/null   # just a reference — create the real file:
```

Create `src/environments/environment.ts` from the template in `spec/contracts/env.md`.
Fill in at minimum:
- `spotify.clientId` — from developer.spotify.com
- `tmdb.apiKey` — from themoviedb.org
- `anthropic.apiKey` — from console.anthropic.com (or leave `""` to disable LLM)

Also create a matching `src/environments/environment.prod.ts` with `production: true`
and the same values (or placeholders).

Verify the baseline compiles before handing off to the orchestrator:
```bash
ng build   # should succeed — it's just the scaffold right now
```

---

## 3. Launching the Orchestrator

Open a dedicated terminal tab for this. Run from `apps/soundtrack-cinema-v2/`:

```bash
claude \
  --model claude-opus-4-6 \
  --max-turns 100 \
  --allowedTools "Agent,Bash,Read,Write,Edit,Glob,Grep,TodoWrite,TodoRead" \
  2>&1 | tee reports/orchestration-log.log
```

Then at the prompt, paste this kick-off message:

```
Read PROJECT_SPEC.md and all files in spec/contracts/. Then execute the
orchestrator instructions in Section 8 of PROJECT_SPEC.md exactly as written.

Rules:
- Use model "claude-sonnet-4-6" for ALL subagents (pass it as the model
  parameter in every Agent tool call).
- Do NOT skip the ng build verification between waves.
- If a wave's build fails, stop and report the errors before proceeding.
- Each subagent must read its task file from spec/tasks/ before writing any code.
```

### Why these flags?

| Flag | Reason |
|---|---|
| `--model claude-opus-4-6` | Orchestration needs strong reasoning — understanding the dependency graph, handling failures, deciding whether to proceed |
| `--max-turns 100` | 4 waves × ~5 turns per wave (launch agents, wait, run build, check output, proceed) plus buffer for retries. 100 is safe. |
| `--allowedTools "..."` | Pre-approves every tool the orchestrator needs. Without this, it will pause and ask permission for each tool on first use — which will block indefinitely if you step away. |
| `2>&1 \| tee` | Writes everything (stdout + stderr) to the log file while still showing it live in your terminal. |

---

## 4. "Effort Level" — What This Actually Means

Claude Code doesn't have a named "effort level" setting. The closest concepts are:

- **Model choice is your effort dial.** Opus reasons more deeply, plans further
  ahead, and self-corrects better. Sonnet is fast and capable for focused
  implementation tasks. This split (Opus orchestrator / Sonnet workers) is the
  right choice here.
- **Avoid `/fast` mode.** `/fast` toggles faster output on the same model but
  can reduce quality. Don't use it for either the orchestrator or subagents on
  a build this complex.
- **Extended thinking.** Opus 4.6 uses extended thinking automatically for
  hard reasoning tasks. You can't tune the budget directly from the CLI, but
  Opus will invoke it when it decides it needs to. Let it.

**Short answer:** Opus for orchestrator, Sonnet for subagents, no `/fast`. That's
the correct effort configuration.

---

## 5. Permissions — Avoiding Blocks and Wasted Tokens

### The Problem

If any tool call requires a permission prompt and you're not at the terminal,
the session **blocks indefinitely**. Tokens aren't wasted while waiting — but
you're just stuck. Worse: if it's deep in Wave 3 when it blocks, you'd have to
restart from that wave.

### The Solution: `--allowedTools`

The flag in Section 3 pre-approves all tools the orchestrator needs:
```
Agent, Bash, Read, Write, Edit, Glob, Grep, TodoWrite, TodoRead
```

This means no permission prompts will appear during the run. The orchestrator
and all its subagents will operate without interruption.

> ⚠️ Only use `--allowedTools` (not `--dangerouslySkipPermissions`). The
> `--allowedTools` flag approves specific tools for this session only.
> `--dangerouslySkipPermissions` bypasses all safety checks permanently — avoid it.

### Are Subagent Permissions Separate?

**Yes and no.** Subagents spawned by the orchestrator's `Agent` tool run within
the same Claude Code process and **inherit the same `--allowedTools` list**. They
do not get separate permission prompts. Whatever you approved for the orchestrator
session, the subagents also have.

This means you only need to configure permissions once on the orchestrator launch
command — subagents get the same access automatically.

### What Happens If It Gets Stuck Anyway?

If the orchestrator pauses unexpectedly (e.g. an unexpected tool it needs):
1. Your terminal will show a permission prompt waiting for `y/n`
2. Type `y` to approve (or `n` to deny and let it find another way)
3. The log file captures everything up to that point, so nothing is lost

---

## 6. Monitoring Progress

### Live Terminal

With `tee` active, you'll see the orchestrator's output in real time. Look for
lines like:
```
Launching Wave 1 — 5 subagents in parallel...
[Agent] Starting task-002: App Shell...
[Agent] Starting task-004: Spotify API Service...
...
Wave 1 complete. Running ng build...
Build succeeded. Proceeding to Wave 2.
```

### Log File

```bash
# In a second terminal tab — tail the log
tail -f reports/orchestration-log.log

# Search for wave boundaries
grep -n "Wave\|build\|error\|Error" reports/orchestration-log.log

# See just the subagent task starts
grep -n "task-0" reports/orchestration-log.log
```

### Build Output as Checkpoints

The strongest signal that a wave completed successfully is a clean `ng build`.
The orchestrator is instructed to run it between every wave. If you see:
```
✔ Build completed successfully
```
in the log, that wave is done and the next one is starting.

---

## 7. Expected Timeline

These are rough estimates. API response speed varies.

| Phase | What's Happening | Est. Time |
|---|---|---|
| Wave 1 | 5 subagents in parallel (contracts, shell, auth, spotify, tmdb) | 8–15 min |
| Build check | `ng build` | 1–2 min |
| Wave 2 | 3 subagents in parallel (rec engine, state, shared UI) | 10–20 min |
| Build check | `ng build` | 1–2 min |
| Wave 3 | 4 subagents in parallel (home, track detail, movie detail, playlist pages) | 15–25 min |
| Build check | `ng build` | 1–2 min |
| Wave 4 | 1 subagent (integration wiring) | 8–12 min |
| Final smoke test | `ng build && ng serve` | 2–3 min |
| **Total** | | **~45–80 min** |

The biggest variable is API latency. If Anthropic's API is slow, agents that
would normally take 8 minutes might take 15. The parallelism in Waves 1–3
absorbs most of this.

---

## 8. Is It Fully Automatic or Do I Need to Approve Each Wave?

**Fully automatic.** Once you paste the kick-off message and the orchestrator
starts, it runs all four waves without you. You only need to intervene if:

1. A `ng build` fails — the orchestrator will stop and report errors. You'd
   fix the issue (or tell it to fix it) before Wave N+1 starts.
2. An unexpected permission prompt appears (see Section 5).
3. The orchestrator hits `--max-turns` before finishing. If this happens,
   check the log for where it stopped, then resume with a new session:
   ```
   claude --model claude-opus-4-6 --max-turns 50 --allowedTools "..."
   > Wave 1-3 are complete. The build is clean. Please execute Wave 4
   > (task-013) per PROJECT_SPEC.md Section 8.
   ```

---

## 9. If Something Goes Wrong

### Build fails mid-wave

```
# The log will show the TypeScript/Angular errors.
# Option A: Let the orchestrator fix it (tell it the errors in a follow-up message)
# Option B: Fix manually, then tell the orchestrator to re-run ng build and continue

> The build failed. Here are the errors: [paste errors]
> Please fix them and then proceed to Wave N.
```

### A subagent writes to the wrong directory

Check `git diff --stat` to see what was changed. The spec has strict file
ownership — if a file is in the wrong place, move it and update the import.

### Orchestrator loses track of what wave it's on

The log file is your source of truth. You can paste the last few completed
task IDs back to the orchestrator:
```
> Tasks 001-008 are complete and the build is clean.
> Please proceed with Wave 3: tasks 009, 010, 011, 012.
```

### Out of `--max-turns`

Resume in a fresh session (see end of Section 8). The files on disk persist —
only the orchestrator's in-memory context resets.

---

## 10. Cost Estimate

Very rough, based on typical code generation volumes:

| Component | Tokens (est.) | Model | Approx. Cost |
|---|---|---|---|
| Orchestrator session | ~80k in / ~20k out | Opus | ~$2.50 |
| 13 subagents × ~15k in / ~30k out avg | ~195k in / ~390k out | Sonnet | ~$3.00 |
| **Total** | | | **~$5–8** |

Costs scale with how much back-and-forth happens on build failures. A clean
first run is on the low end; multiple retries push toward the high end.

---

## 11. Quick-Reference Launch Checklist

```
□ npm install @angular/cdk@^21.0.0 @anthropic-ai/sdk  (done)
□ src/environments/environment.ts exists with your API keys
□ ng build passes on the current scaffold
□ You have a dedicated terminal tab ready
□ Run the claude command from apps/soundtrack-cinema-v2/
□ Paste the kick-off message
□ Open a second tab to tail the log file
□ Walk away — come back in ~60 minutes
```

---

## 12. The Exact Commands (Copy-Paste)

**Terminal tab 1 — Orchestrator:**
```bash
cd /Users/renaji/repos/soundtrack-cinema/apps/soundtrack-cinema-v2

claude \
  --model claude-opus-4-6 \
  --max-turns 100 \
  --allowedTools "Agent,Bash,Read,Write,Edit,Glob,Grep,TodoWrite,TodoRead" \
  2>&1 | tee reports/orchestration-log.log
```

**Kick-off message (paste at the prompt):**
```
Read PROJECT_SPEC.md and all files in spec/contracts/. Then execute the
orchestrator instructions in Section 8 of PROJECT_SPEC.md exactly as written.

Rules:
- Use model "claude-sonnet-4-6" for ALL subagents.
- Run ng build after each wave completes before starting the next.
- If a build fails, stop and report the errors — do not proceed to the next wave.
- Each subagent must read its task file from spec/tasks/ before writing any code.
```

**Terminal tab 2 — Monitor:**
```bash
tail -f /Users/renaji/repos/soundtrack-cinema/apps/soundtrack-cinema-v2/reports/orchestration-log.log
```
