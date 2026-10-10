# Predict.Client

Predict.Client is an Angular single-page application. It builds to static files and can be hosted on GitHub Pages; it does not include a server or API.

## Deploy to GitHub Pages

The Angular build uses `/predict/` as its base path, matching the GitHub Pages project URL `https://<owner>.github.io/predict/`. Keep this base path when deploying to that URL. For a custom domain or a different repository name, update `baseHref` in `angular.json` to the URL path where the app will be hosted.

1. Install dependencies with `npm install` (as in the workflow).
2. Build the production site with `npm run build -- --configuration production`.
3. Generate the deployment marker with `node generate-version.js` after the build. In GitHub Actions, `GITHUB_SHA` makes the marker unique to the deployed commit.
4. Upload the contents of `dist/predict.client/browser/` as the Pages artifact. This folder contains both the app and `version.json`.
5. In the repository settings, open **Pages** and choose **GitHub Actions** as the source. After the workflow deploys, open `https://<owner>.github.io/predict/`.

The app uses hash-based routes, so page navigation works on static hosting without server rewrite rules. It checks `version.json` once when opened and then every 10 seconds. When it detects a different deployment version, it displays a **New version available** banner with the version, GitHub Actions workflow run number, deployment time, and a refresh button. Make sure the workflow runs `node generate-version.js` after building; without that step the marker will be missing and open tabs cannot detect deployments.

## Static hosting limitations

Static hosting serves the UI only. It cannot run the APIs this app currently calls: account login and registration use relative `server/api/v1/...` endpoints, while transactions, receipts, and loan data call `https://localhost:8080`. Those requests will not work for visitors to the deployed site until a backend is hosted separately and the frontend API URLs are configured to use that backend. Do not put private API secrets in the frontend build; static assets are public.

Data stored in the browser remains local to that browser and device. Deploying the UI does not create shared accounts or shared storage.
