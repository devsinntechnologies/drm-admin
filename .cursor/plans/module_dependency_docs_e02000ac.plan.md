---
name: Module Dependency Docs
overview: Create a clear configuration-style document listing, for every industry, which module dependencies can be set—what each module requires when enabled, and what related modules clear when it is turned off.
todos:
  - id: write-rules
    content: Write how dependency setting works (enable pulls deps, disable clears dependents)
    status: pending
  - id: write-settable-deps
    content: For all 15 industries, list each module and the dependencies you can set on it
    status: pending
  - id: write-cascade-guide
    content: Add reverse view—turning off a hub module clears which settable dependents
    status: pending
isProject: false
---

# Module Dependency Configuration Document

## Goal

Create a document that answers: **for each industry, which dependencies can you set on each module?**

Format is configuration-oriented (not a long narrative): for every module that has dependencies, list the modules it is allowed/required to depend on. Also show the reverse effect when that module is turned off.

## Source of truth (documentation only — no code changes)

- [`src/templates/module-dependencies.ts`](src/templates/module-dependencies.ts)
- [`src/templates/industries.ts`](src/templates/industries.ts)
- [`src/templates/modules.ts`](src/templates/modules.ts)

## Output file

[`docs/industry-module-dependencies.md`](docs/industry-module-dependencies.md)

## How “setting a dependency” works in DigiNizam

Document these rules up front:

1. **You set dependencies as:** `Module A depends on [B, C, …]`
2. **When A is enabled:** B and C (and their nested deps) are also selected
3. **When B is disabled:** every module that depends on B (including A) is also unselected
4. **Cannot set dependencies on shell:** `dashboard` and `settings` are always on and are not dependency-driven
5. **Modules with no dependency entry** (or empty list) have no required links — they can be set independently

## Document structure

### Section A — Dependency setting guide

Short explanation with one concrete example:

- Set: `Kitchen depends on [Orders, Menu]`
- Enable Kitchen → Orders + Menu turn on
- Disable Menu → Kitchen (and Orders, POS, etc. that depend on Menu) turn off

### Section B — Per industry: settable dependencies

For each of the 15 industries, use this fixed layout:

**Industry: Name (`id`)**

- Compulsory (always on): Dashboard, Settings
- Default modules: …
- Optional packs: …

**Dependencies you can set**

For every module that has a non-empty dependency list:

- `pos` → depends on: `products` (Products)
- `purchases` → depends on: `suppliers`, `inventory`, `products`
- …

Also list independent modules (no settable deps) in one short bullet group so it’s clear what can stand alone.

**If you turn off this hub, these dependents clear**

Focus on main hubs (Products/Menu/Services/BOM/etc.):

- Turn off Products → clears: POS, Sales, Inventory, Categories, …
- Turn off Customers → clears: … (only where that industry links them)

### Industries to include

1. Retail Store  
2. Pharmacy  
3. Restaurant  
4. Boutique  
5. Salon / SPA  
6. Bakery POS  
7. Electric Store  
8. Jewellery Shop  
9. Toys Store  
10. Food / Cafe  
11. Furniture Store  
12. Supermarkets  
13. Manufacturing  
14. Auto Parts  
15. Book Store  

### Section C — One visual example

Restaurant dependency graph (Menu/Orders hub) as a mermaid flowchart so “settable links” are easy to see.

## Acceptance

- Document is explicitly about **settable module dependencies**
- Every industry lists each configurable `module → depends on […]` relationship from code
- Enable/disable cascade is explained once and shown per industry for main hubs
- No application code changes in this task
