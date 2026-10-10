// Predict.Client/generate-version.js
const fs = require('fs');
const path = require('path');

// Get the latest git commit hash or use package.json version
const { execSync } = require('child_process');
let version;

try {
  // Prefer the commit that triggered the deployment.
  version = process.env.GITHUB_SHA
    ? process.env.GITHUB_SHA.slice(0, 7)
    : execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  // Fallback to package.json version + timestamp
  const pkg = require('./package.json');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  version = `${pkg.version}-${timestamp}`;
}

const versionFile = {
  version: version,
  timestamp: new Date().toISOString(),
  workflowRunNumber: process.env.GITHUB_RUN_NUMBER || null,
};

// The browser folder is the root of the GitHub Pages artifact.
const outputPath = path.join(
  process.cwd(),
  'dist',
  'predict.client',
  'browser',
  'version.json',
);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(versionFile, null, 2));

console.log(`✅ Version file generated at: ${outputPath}`);
console.log(`📦 Version: ${version}`);
