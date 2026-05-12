# playwright-life

You are helping automate a homelab task using Playwright MCP and the TypeScript project at `/Users/matt/homelab-automation`.

The user has described what they want to automate:

> $ARGUMENTS

## Your workflow

### Step 1 — Explore with Playwright MCP

Use the Playwright MCP browser tools to navigate the relevant UI and discover:
- The correct URLs and navigation paths
- Selectors, element references, and interaction patterns
- What data is available and how it's structured
- Any auth requirements (HA uses a long-lived token stored in `.env` as `HA_TOKEN`; inject it via localStorage before navigating — see the existing `login()` method in `src/projects/HomeAssistant.ts` for the pattern)

Explore thoroughly before writing any code. Take snapshots, click around, and confirm you understand the full interaction flow.

### Step 2 — Write the TypeScript method(s)

Based on what you discovered, add one or more methods to the appropriate class in `src/projects/`. If the task is for a new service that doesn't have a class yet, create a new file in `src/projects/` extending `BasePage` from `src/base/BasePage.ts`, and export it from `src/index.ts`.

Rules:
- Use the REST API (`apiGet` / `apiPost` helpers) when possible — it's more reliable than browser clicks
- Use Playwright browser interaction only when the task genuinely requires UI manipulation
- Match the existing code style: no comments unless the WHY is non-obvious, no unnecessary error handling
- Entity IDs and selectors must be verified against the live instance, not guessed

### Step 3 — Confirm with the user

Show the user:
1. A summary of what you discovered during exploration
2. The exact code you wrote (show the full diff or new method bodies)
3. Ask explicitly: **"Does this look good? Should I push it to git?"**

Do not push until the user confirms.

### Step 4 — Push to git (only after confirmation)

Once the user confirms, run from `/Users/matt/homelab-automation`:

```bash
git add <files changed>
git commit -m "<concise message describing what was automated>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push
```

Then report the commit hash and what was pushed.
