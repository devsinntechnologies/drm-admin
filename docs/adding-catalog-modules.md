# Adding a catalog module

New business modules are **catalog extensions**, not runtime inventions. Follow this path so portal, seed data, roles, and (optionally) mobile stay aligned.

## Checklist

1. **Type + catalog (admin)**
   - Add the id to the `ModuleId` union in `src/templates/types.ts`.
   - Add an entry to `MODULE_CATALOG` in `src/templates/modules.ts` (label, description, category).
   - Wire dependencies in `src/templates/module-dependencies.ts` if needed.
   - Add to the relevant industry `modules` / `optionalModules` in `src/templates/industries.ts`.

2. **Backend seed**
   - Add the module to `vendor_backend/src/industry-template/seed/industry-template.seed-data.ts` (and re-seed / migrate catalog rows as your env requires).
   - Confirm `GET /industry-template/modules` lists the new id.

3. **Portal UI**
   - Add a workspace route / page under business admin (and mark implemented in `src/lib/module-implementation.ts` when ready).
   - Entitlements: super-admin can include the module via `BusinessEntitlements` once it is in the industry list.

4. **Software Control**
   - No extra work for enable/role toggles — enabled modules appear in step 1 and the role matrix automatically.
   - Badge will show **Portal only** until mobile readiness is set (see `docs/mobile-module-readiness.md`).

5. **Module features (optional)**
   - Declare features in `src/lib/module-feature-registry.ts`.
   - Parse/serialize in `src/lib/module-feature-settings.ts`.
   - Persist under `moduleSettings.<moduleId>` from Software Control.
   - Read in Flutter via `ModuleConfig` getters.

6. **Mobile (optional)**
   - Follow the expansion playbook in `docs/mobile-module-readiness.md`.

## Out of scope

Admins cannot invent arbitrary module IDs in the UI that auto-generate Nest + Flutter screens. Draft/request metadata can be added later; shipping still requires the steps above.
