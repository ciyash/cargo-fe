# Frontend / backend contract review

Reviewed the frontend environment setup, login/account forms, role model, guards, request authentication, report pagination, literal navigation destinations and service URL construction. Static scans covered 261 TypeScript files including specs and 109 recognizable HTTP calls against 261 backend route declarations. Dynamic runtime requests and every shipment/report flow were not exhaustively exercised.

## Fixed

- Admin self-profile used PATCH `/subadmin-auth/update-profile` without an account ID. The registered self-profile route is PATCH `/subadmin-auth/admin-profile`.
- Branch-to-branch unloading filters used POST `/parcel-unloading/branch-to-branch-load`. The registered backend route is POST `/parcel-unloading/branch-to-branch-unload`. The shared method is used by Company Admin, Branch Admin and Staff screens.
- Staff frontend permissions honored an old saved subset before Staff defaults. The backend deliberately grants Staff all five work permissions. The frontend now matches bookings, loading, delivery, accounts and reports, while company setup/team permissions remain restricted. Branch Admin explicit permission subsets are preserved.
- Header contained undefined `/aprofile`, `/tasks`, `/delivery` destinations. These now use existing `/profile`, `/booking`, `/parcel-delivery` routes.
- Team login trims identifier whitespace; password whitespace is preserved.

## Company Admin creation

The company form sends `role: company_admin` and `branchId: null` to `/subadmin-auth/signup-by-company`, with the company session token. No legacy `superadmin` or `subadmin` role options were found in the HTML forms. Backend signup accepts `company_admin`; its company-creation regression test passes. Form HTTP contract regression tests cover the exact role and the branch requirement for Branch Admin.

The public hosted frontend bundle also contains the canonical Company Admin / Branch Admin / Staff options. Its API base is `https://nestcargo-be.onrender.com`. Development uses `http://localhost:4000`; Angular development file replacement is configured. No hardcoded backend host was found in application TypeScript outside the environment files.

## Hosting observation

During this review the hosted backend continued to serve the old owner page and a health response without the newly pushed `revision` field. Current GitHub backend code accepts Company Admin, but the observed hosted version is stale. Frontend role downgrades would change account meaning and are not a deployment fix. Render deployment logs/settings are still needed to identify why the latest backend commit has not become live. No production account creation/login requests or database changes were used for this review.

## Validation

Production Angular build passed (existing stylesheet budget warnings remain). Focused headless Chrome tests exercise login API contracts, role permissions, guards, headers, report handling, stored reports, account profile update, branch unloading and the real Company Admin form request. These changes are local frontend updates; this review did not push or deploy the frontend repository.
