# Navigation and responsive audit

## Changes

- Stopped document branding from deleting React/Next-managed favicon nodes on each page change. Existing development logs contain repeated `removeChild` exceptions; deleting reconciler-owned nodes is a concrete cause of this failure. Branding now updates existing links in place and sets the correct SVG MIME type.
- Removed the pathname key around the App Router subtree. Shared providers and layouts now retain their identity during client navigation rather than remounting for each URL.
- Preserved business IDs on dashboard links; prevented remembered business context from replacing the platform navigation on super-admin routes.
- Waited for credential hydration before the business provider redirects to login, and synchronized the fallback business ID after URL changes.
- Browser testing reproduced an SSR/client auth mismatch. Auth now starts with the same empty state on server and client; the provider restores token, role and business together after mount, with a stable React Redux server snapshot for suspended routes.
- Replaced the hamburger overlay with the existing Radix dialog primitive: focus containment and restoration, Escape/outside dismissal, background scroll locking, route-aware visibility, and dismissal at the desktop breakpoint.
- Added route loading feedback, current-page semantics and accessible names for collapsed sidebar links. Active links now also match the dark-theme CSS selector.
- Made header actions available on phones, constrained dialog height to the dynamic viewport, and added drawer motion with reduced-motion support.
- Enabled local horizontal scrolling for previously clipped tables in inventory primitives, retail sales, app updates, website pages, industry templates and template previews.
- Removed fixed minimum widths on narrow catalog search fields and installer selectors. Existing responsive grids and scroll wrappers were retained.

## Coverage and reproduction

Source audit covered dashboard route layouts, both sidebar variants, business context/authentication, section tabs, shared dialog/table/page primitives, dashboard grids, and table wrappers across restaurant, retail, pharmacy, snooker, platform, software and website areas. Static inspection is not equivalent to exercising every populated business workflow.

`scripts/navigation-audit.cjs` runs a browser regression against a local server at `http://127.0.0.1:3000`. Install Playwright in a separate test environment and set `PLAYWRIGHT_MODULE` to its module path, or make `playwright` available locally. Set `AUDIT_BROWSER_CHANNEL=msedge` to use installed Windows Edge; otherwise install Playwright Chromium. Override `AUDIT_URL` for another local port.

The script uses synthetic super-admin credentials and mocked API responses. It tests phone (375px), tablet (768px), laptop (1024px), and desktop (1440px) viewports; page navigation without document reload; selected navigation; back/forward; Escape and focus restoration; drawer cleanup on resize; horizontal overflow; and uncaught browser errors. Set `AUDIT_WORKSPACE=business` to exercise the impersonated business workspace and retained business query parameter. It does not validate live authorization, populated records, or physical iOS/Android devices.

## Completed checks

- `node --test scripts/document-branding.test.cjs`: passed. Verifies existing metadata nodes are retained, repeated updates do not duplicate links, default branding works, and SVG/data URL MIME types update correctly.
- Windows Edge platform and impersonated business navigation: passed at 375, 768, 1024 and 1440px on an isolated dev copy using mocked APIs. No uncaught browser errors, document reloads or viewport overflow in the tested pages. Business IDs persisted across categories, products, dashboard and browser history.
- Targeted ESLint: passed for DocumentBranding, ReduxProvider, shared dialog/alert-dialog/table components and dashboard loading UI.

## Validation limitations

TypeScript reported three errors outside this change: retail POS credit typing and two template `productionJobWork` declarations. The initial run also reported generated `.next/dev/types` errors which cleared on the subsequent run. Targeted ESLint on the older shell/auth components reported existing synchronous effect state updates in AdminShell and DashboardAuthGate. These checks do not currently provide a clean project baseline.

Live-data acceptance should include role-specific business navigation, business switching, long records, open dialogs, offline/reconnect behavior, and Safari/Firefox on supported devices. No production deployment was performed.
