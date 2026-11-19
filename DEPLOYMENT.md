# Local development and Vercel

Local and deployed builds use `baseUrl` from `src/environments/environment.ts`. Set it to the backend URL you want to use before starting or building the app.

`vercel.json` selects the Angular framework, installs with `npm ci --legacy-peer-deps`, runs `npm run build`, publishes `dist/crm16`, and serves `index.html` for application routes. Existing static files take precedence over the fallback rewrite.

The install flag preserves the existing lockfile while bypassing peer-version conflicts in this legacy dependency tree, including Angular 16 with angularx-qrcode 14. It is an installation workaround, not a dependency compatibility upgrade. A dry-run install with this flag and the production build both passed locally.

If deploying before this configuration reaches GitHub, expand **Build and Output Settings** and override:

- Install Command: `npm ci --legacy-peer-deps`
- Build Command: `npm run build`
- Output Directory: `dist/crm16`

Commit the desired `baseUrl` and push it to the branch Vercel builds before redeploying.

To deploy from Vercel's dashboard, import this repository and use this frontend directory as the project root. The checked-in configuration supplies the build command and output directory. To deploy from an authenticated CLI, run `vercel --prod` in this directory.

The production backend must allow the final frontend origin through its CORS configuration. Browser environment files contain public configuration, so never add secrets to them.
