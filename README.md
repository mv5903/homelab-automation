# homelab-automation

TypeScript automation framework for homelab services using Playwright and the Home Assistant REST API. Each service gets its own class with typed methods — browser interaction where the UI is the only option, REST API calls everywhere else.

## Structure

```
src/
├── base/
│   └── BasePage.ts          # Abstract base: browser lifecycle, navigate, screenshot, run()
└── projects/
    └── HomeAssistant.ts     # HA methods: lights, climate, modes, media, stats, Tesla, running
skills/
└── playwright-life.md       # Claude Code skill for adding new automations interactively
```

## Setup

```bash
npm install
cp .env.example .env
# fill in .env with your credentials
```

## Adding automations with `/playwright-life`

This repo ships a Claude Code skill that handles the full authoring loop:

1. You describe what you want to automate in plain English
2. Claude explores the live UI with Playwright MCP to verify selectors and entity IDs
3. Claude writes the TypeScript method and shows you the code
4. You confirm, then it commits and pushes

**Usage** (from within this repo in Claude Code):

```
/playwright-life <description of what you want to automate>
```

Examples:
```
/playwright-life show a notification when NAS disk usage exceeds 85%
/playwright-life turn on away mode and set lights to off when Matt's PC goes offline
/playwright-life take a screenshot of the running dashboard and save it to disk
```

The skill file is at `.claude/commands/playwright-life.md` (picked up automatically by Claude Code) and mirrored at `skills/playwright-life.md` for reference.

## Services

| Class | File | Auth |
|---|---|---|
| Home Assistant | `src/projects/HomeAssistant.ts` | Long-lived access token (`HA_TOKEN`) |

## Environment variables

See `.env.example` for the full list. Never commit `.env`.
