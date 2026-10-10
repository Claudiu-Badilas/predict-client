# Predict Client

Predict Client is an Angular single-page application for personal finance tracking. It includes transaction, receipt, loan, and account screens. The client is in [`Predict.Client/`](Predict.Client/).

## Requirements

- Node.js 24 (also used by the GitHub Actions deployment workflow)
- npm

## Run locally

```powershell
cd Predict.Client
npm ci
npm start
```

The development server is available at `http://localhost:4200/`. The client expects its API services to be available separately; some requests currently target `https://localhost:8080` and account requests use relative `server/api/v1/...` paths.

## Build

```powershell
cd Predict.Client
npm run build
```

The production build is written to `Predict.Client/dist/predict.client/browser/`.

## Deploy to GitHub Pages

The repository includes [a GitHub Actions workflow](.github/workflows/deploy.yml) that builds and deploys the app when changes are pushed to `main`. The Angular base path is `/predict-client/`, matching this repository's Pages project URL:

<https://claudiu-badilas.github.io/predict-client/>

To enable deployment, open the repository's **Settings → Pages** and select **GitHub Actions** as the build and deployment source. Then push a commit to `main` and check the run in the **Actions** tab.

GitHub Pages serves only static frontend files. The backend APIs are not included in this repository's Pages deployment. To use login, transactions, receipts, or loan features for visitors, host the backend separately and configure the client to call its public API URL. Never put private API credentials in frontend code: browser assets are public.

## Project notes

- Routes use hash-based navigation, which works on static hosting without server rewrite rules.
- Browser data remains local to that browser and device; Pages does not provide shared storage or accounts.
- See [`Predict.Client/README.md`](Predict.Client/README.md) for client-specific deployment notes.
