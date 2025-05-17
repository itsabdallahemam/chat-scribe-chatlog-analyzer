#!/usr/bin/env node

/**
 * Chat-Scribe Chatlog Analyzer Setup Script
 * 
 * This script helps resolve common setup issues when cloning the project.
 * It focuses on fixing React version and react-wordcloud compatibility issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.blue}=== Chat-Scribe Chatlog Analyzer Setup ====${colors.reset}\n`);

// Check Node.js version
try {
  console.log(`${colors.yellow}Checking Node.js version...${colors.reset}`);
  const nodeVersion = execSync('node -v').toString().trim();
  const versionNumber = nodeVersion.replace('v', '').split('.');
  const majorVersion = parseInt(versionNumber[0], 10);
  
  if (majorVersion < 18) {
    console.log(`${colors.red}Warning: This project requires Node.js v18 or higher.${colors.reset}`);
    console.log(`Current version: ${nodeVersion}`);
    console.log(`Please update Node.js from https://nodejs.org/\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Node version ${nodeVersion} is compatible.${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to check Node.js version: ${error.message}${colors.reset}\n`);
  process.exit(1);
}

// Ensure fixed React version in package.json
try {
  console.log(`${colors.yellow}Updating package.json with fixed React version...${colors.reset}`);
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Fix React versions
    packageJson.dependencies.react = "18.2.0";
    packageJson.dependencies['react-dom'] = "18.2.0";
    
    // Fix react-wordcloud version
    packageJson.dependencies['react-wordcloud'] = "1.2.7";
    
    // Make sure d3 dependencies and patch-package are included
    packageJson.dependencies['d3-scale'] = "^3.3.0";
    packageJson.dependencies['d3-cloud'] = "^1.2.5";
    packageJson.dependencies['patch-package'] = "^8.0.0";
    
    // Add resolutions if not present
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    packageJson.resolutions['d3-selection'] = "^2.0.0";
    packageJson.resolutions['tippy.js'] = "^6.3.7";
    
    // Make sure both scripts are present
    packageJson.scripts.setup = "node setup-project.js";
    packageJson.scripts.postinstall = "patch-package";
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}Updated package.json with fixed versions.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Could not find package.json in the current directory.${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to update package.json: ${error.message}${colors.reset}\n`);
}

// Check if patches directory exists and create if needed
try {
  console.log(`${colors.yellow}Ensuring patches directory and files exist...${colors.reset}`);
  const patchesDir = path.join(process.cwd(), 'patches');
  if (!fs.existsSync(patchesDir)) {
    fs.mkdirSync(patchesDir);
  }
  
  const patchFilePath = path.join(patchesDir, 'react-wordcloud+1.2.7.patch');
  if (!fs.existsSync(patchFilePath)) {
    // Create the patch file
    const patchContent = `diff --git a/node_modules/react-wordcloud/dist/index.js b/node_modules/react-wordcloud/dist/index.js
index 1ed9cde..2dc9399 100644
--- a/node_modules/react-wordcloud/dist/index.js
+++ b/node_modules/react-wordcloud/dist/index.js
@@ -82,7 +82,7 @@ var WordCloud = function (_a) {
     // initialize the cloud with useCallback
     var initializeCloud = React.useCallback(function () {
         if (callbacks.onInitialize) {
-            callbacks.onInitialize();
+            callbacks.onInitialize && callbacks.onInitialize();
         }
         if (containerRef.current) {
             var selection = d3Selection.select(containerRef.current);
@@ -100,7 +100,7 @@ var WordCloud = function (_a) {
             var wordCloudPlacement = layout.start();
             // only set ref if cloud placed words
             if (!wordCloudPlacement.length) {
-                if (callbacks.onWordLayoutComplete) {
+                if (callbacks.onWordLayoutComplete && typeof callbacks.onWordLayoutComplete === 'function') {
                     callbacks.onWordLayoutComplete([]);
                 }
                 return;
@@ -142,7 +142,7 @@ var WordCloud = function (_a) {
                 .text(function (word) {
                 return word.text;
             });
-            if (callbacks.onWordLayoutComplete) {
+            if (callbacks.onWordLayoutComplete && typeof callbacks.onWordLayoutComplete === 'function') {
                 // callbacks.onWordLayoutComplete(words);
                 callbacks.onWordLayoutComplete(wordCloudPlacement);
             }
@@ -150,7 +150,7 @@ var WordCloud = function (_a) {
             // render actual words
             textSelection
                 .transition()
-                .on('end', callbacks.onRenderComplete)
+                .on('end', callbacks.onRenderComplete || (() => {}))
                 .duration(options.transitionDuration || 0)
                 .attr('font-size', function (word) { return word.size + "px"; })
                 .attr('transform', function (word) {`;
                 
    fs.writeFileSync(patchFilePath, patchContent);
    console.log(`${colors.green}Created patch file for react-wordcloud.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}Patch file already exists.${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to set up patches: ${error.message}${colors.reset}\n`);
}

// Clean install dependencies
try {
  console.log(`${colors.yellow}Cleaning npm cache and node_modules...${colors.reset}`);
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log(`Removing old node_modules folder...`);
    // Using platform-specific commands for removing node_modules
    if (process.platform === 'win32') {
      try {
        execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
      } catch (e) {
        console.log(`${colors.yellow}Could not remove node_modules folder automatically. You may need to delete it manually.${colors.reset}`);
      }
    } else {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
  }
  
  console.log(`\n${colors.yellow}Installing dependencies with --legacy-peer-deps...${colors.reset}`);
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Apply patches explicitly in case postinstall didn't run
  try {
    console.log(`\n${colors.yellow}Applying patches to react-wordcloud...${colors.reset}`);
    execSync('npx patch-package', { stdio: 'inherit' });
    console.log(`${colors.green}Patches applied successfully.${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Failed to apply patches: ${error.message}${colors.reset}\n`);
    console.log(`${colors.yellow}You may need to run 'npx patch-package' manually.${colors.reset}\n`);
  }
  
  console.log(`\n${colors.green}Dependencies installed successfully!${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Failed during dependency installation: ${error.message}${colors.reset}\n`);
  console.log(`${colors.yellow}You may need to run these commands manually:${colors.reset}`);
  console.log(`npm cache clean --force`);
  console.log(`npm install --legacy-peer-deps`);
  console.log(`npx patch-package\n`);
}

console.log(`${colors.bright}${colors.green}===== Setup Complete =====\n${colors.reset}`);
console.log(`${colors.blue}You can now run the project:${colors.reset}`);
console.log(`npm run dev\n`);
console.log(`${colors.blue}If you encounter any issues, refer to the Troubleshooting section in README.md${colors.reset}\n`); 