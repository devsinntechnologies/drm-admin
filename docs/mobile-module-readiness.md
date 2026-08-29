# Mobile module readiness

How Software Control maps to Flutter.

## Source of truth

Software Control section **1. Mobile app modules** lists only what Flutter ships:

| Kind | Modules | Defined in |
|------|---------|------------|
| App tabs | dashboard, menu, products, orders, kitchen, sales, tables, staff, inventory, reports | `ModuleScreenRegistry` (Flutter) + `SOFTWARE_SUPPORTED_MODULES` |
| In-app capability | categories | `MOBILE_CAPABILITY_MODULES` — tools inside Products / Orders |

Industry helper: `mobileModulesForIndustry(industryId)` picks the right subset (retail vs restaurant vs pharmacy).

Portal Reports and the Flutter Reports tab share the same `reports` module id and the same APIs. Turn it on in Software Control (Super Admin or Business Admin) — it stays visible on the portal and appears as an app tab after save + refresh.

Portal-only modules (suppliers, purchases, …) are **not** shown here. They stay on the web portal and are preserved when you save.

## How on / off works

1. Check a module → it is added to `enabledModules` and appears as a Flutter tab (or category tools).
2. Uncheck → removed from the app on next sync / login.
3. **Role access** (section below) chooses which *roles* see each *enabled* module.
4. Tab **order** is controlled in Navigation order (drag).

Categories: enable the Categories capability, then use **Allow adding / editing categories** for create/edit/delete.

## Save behavior

- Mobile toggles are merged into the business template without wiping portal modules.
- Backend accepts Flutter mobile modules even if the industry portal catalog omitted them (fixes “Module X is not available for industry auto-parts”).

## Adding a new Flutter screen later

1. Build the screen in Flutter and register it in `ModuleScreenRegistry`.
2. Add the id to `SOFTWARE_SUPPORTED_MODULES` / `mobileModulesForIndustry`.
3. Optionally add feature flags in `module-feature-settings.ts`.
