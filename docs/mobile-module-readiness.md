# Mobile module readiness

How portal modules become available on Flutter without blocking web enablement.

## Status badges (Software Control)

| Status | Meaning | Where defined |
|--------|---------|----------------|
| **Mobile** (`ready`) | Flutter bottom-nav screen exists | `SOFTWARE_SUPPORTED_MODULES` + `ModuleScreenRegistry` |
| **Mobile capability** (`capability`) | Gated inside another screen (no tab) | `MOBILE_CAPABILITY_MODULES` (e.g. `categories`) |
| **Portal only** (`planned`) | Enable on web; Flutter skips until a screen ships | Default for all other catalog modules |

Helpers: `drm-admin/src/lib/software-supported-modules.ts` → `getMobileReadiness()`.

## Expansion playbook (portal → mobile)

Repeat for each module (example: `vehicle-compatibility`):

1. **Portal** — page already exists (or add under business workspace routes).
2. **Flutter screen** — implement the screen under `diginizam-flutter/lib/views/…`.
3. **Register**
   - Add id to `ModuleScreenRegistry` (`module_screen_registry.dart`).
   - Add id to `SOFTWARE_SUPPORTED_MODULES` (`software-supported-modules.ts`).
4. **Optional features** — add defs to `module-feature-registry.ts` + parse/serialize in `module-feature-settings.ts` + Flutter getters on `ModuleConfig`.
5. **Role matrix** — once registered as `ready`, “Opens on” can land on that tab; Mobile badge appears automatically.
6. **Verify** — Software → Preview as each role; save Control; refresh Flutter.

## Capability modules (no tab)

Use `MOBILE_CAPABILITY_MODULES` when the feature already lives inside another screen (Categories inside Products/Orders). Gate UI with `enabledModules` ∩ roleAccess + `moduleSettings.<id>` flags. Do **not** add capability ids to `ModuleScreenRegistry`.

## Non-goals

- Enabling a portal-only module must never fail save.
- Do not fake a Mobile badge until a screen (or capability gate) exists.
