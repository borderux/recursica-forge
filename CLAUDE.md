# CLAUDE.md

Entry point for Claude Code. The project's agent guidance lives in `.agents/`, which other tools
also read, so this file imports it rather than restating it. Edit the imported files, not copies
here.

@agents.md
@.agents/rules/coding-standards.md

## Verifying your work

```bash
npx tsc -b          # types
npx vitest run      # tests
npm run build       # production build
```

Run dev servers through the Browser pane, never `npm run dev` in a shell.

## Never create changeset files

Aaron writes them himself at release time. Do not add anything under `.changeset/`.

## Task playbooks

`.agents/skills/` holds eight playbooks for the design-token pipeline. Claude Code does not offer
them as slash commands from that path — read the relevant `SKILL.md` directly when the task matches.

| Playbook | Read it when |
| --- | --- |
| `orchestrator` | A token file or `recursica_ui-kit.json` changed and you need the full downstream sequence |
| `dtcg-compliance-agent` | Editing `recursica_tokens.json`, `recursica_brand.json`, or `recursica_ui-kit.json` |
| `toolbar-configurator-agent` | Toolbar definitions (`*.toolbar.json`) need to match new token structure |
| `css-vars-sync-agent` | Stylesheets or the variable-name helpers need regenerating |
| `adapter-sync-agent` | React adapters in `src/components/adapters/` need to follow a schema change |
| `import-export-flows-agent` | Converters, parsers, or serializers are affected |
| `doc-sync-agent` | `src/components/COMPONENT_DEVELOPMENT_GUIDE.md` needs to reflect a change |
| `qa-automation-agent` | Verifying build integrity, types, schema compliance, and references |

The orchestrator ends by running `npx tsx .agents/scripts/verify-workspace.ts`.

## Reference documentation

| Document | Covers |
| --- | --- |
| `src/components/COMPONENT_DEVELOPMENT_GUIDE.md` | Building and auditing components; the long-form guide |
| `docs/RECURSICA_JSON_SPEC.md` | The three JSON files and how they map to DTCG |
| `docs/SCOPED_CSS_ARCHITECTURE.md` | How the exported CSS is structured, and the two naming tiers |
| `docs/EXPORT_PIPELINE_REFACTOR_PLAN.md` | Why the transforms are self-contained single files |
| `TESTING.md` | Test layout and how to run them |
| `CONTRIBUTING.md`, `RELEASE.md` | Branching and the release process |
