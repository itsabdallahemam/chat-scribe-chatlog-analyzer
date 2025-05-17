#!/usr/bin/env node

/**
 * Chat-Scribe Chatlog Analyzer Setup Script
 * 
 * This script helps resolve common setup issues when cloning the project.
 * It focuses on fixing React version and react-wordcloud compatibility issues.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    // Remove patch-package as we'll directly modify the file
    if (packageJson.dependencies['patch-package']) {
      delete packageJson.dependencies['patch-package'];
    }
    
    // Remove postinstall script if it exists
    if (packageJson.scripts && packageJson.scripts.postinstall === "patch-package") {
      delete packageJson.scripts.postinstall;
    }
    
    // Add resolutions if not present
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    packageJson.resolutions['d3-selection'] = "^2.0.0";
    packageJson.resolutions['tippy.js'] = "^6.3.7";
    
    // Make sure setup script is present
    packageJson.scripts.setup = "node setup-project.js";
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}Updated package.json with fixed versions.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Could not find package.json in the current directory.${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.red}Failed to update package.json: ${error.message}${colors.reset}\n`);
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
  
  // Directly patch the react-wordcloud file
  console.log(`\n${colors.yellow}Directly patching react-wordcloud for React 18 compatibility...${colors.reset}`);
  
  const wordcloudPath = path.join(process.cwd(), 'node_modules/react-wordcloud/dist/index.js');
  
  if (fs.existsSync(wordcloudPath)) {
    let content = fs.readFileSync(wordcloudPath, 'utf8');
    
    // Make the necessary replacements
    content = content.replace(
      'callbacks.onInitialize();',
      'callbacks.onInitialize && callbacks.onInitialize();'
    );
    
    content = content.replace(
      'if (callbacks.onWordLayoutComplete) {',
      'if (callbacks.onWordLayoutComplete && typeof callbacks.onWordLayoutComplete === \'function\') {'
    );
    
    content = content.replace(
      'if (callbacks.onWordLayoutComplete) {',
      'if (callbacks.onWordLayoutComplete && typeof callbacks.onWordLayoutComplete === \'function\') {'
    );
    
    content = content.replace(
      '.on(\'end\', callbacks.onRenderComplete)',
      '.on(\'end\', callbacks.onRenderComplete || (() => {}))'
    );
    
    // Write the modified content back
    fs.writeFileSync(wordcloudPath, content);
    console.log(`${colors.green}Successfully patched react-wordcloud for React 18 compatibility.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Could not find react-wordcloud module. The patching step is skipped.${colors.reset}\n`);
  }
  
  console.log(`\n${colors.green}Dependencies installed successfully!${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Failed during dependency installation or patching: ${error.message}${colors.reset}\n`);
  console.log(`${colors.yellow}You may need to run these commands manually:${colors.reset}`);
  console.log(`npm cache clean --force`);
  console.log(`npm install --legacy-peer-deps\n`);
  console.log(`And then manually edit the file: node_modules/react-wordcloud/dist/index.js\n`);
}

// Clean up patches directory if it exists
try {
  const patchesDir = path.join(process.cwd(), 'patches');
  if (fs.existsSync(patchesDir)) {
    if (process.platform === 'win32') {
      try {
        execSync(`rmdir /s /q "${patchesDir}"`, { stdio: 'inherit' });
      } catch (e) {
        console.log(`${colors.yellow}Could not remove patches directory. You may delete it manually if desired.${colors.reset}`);
      }
    } else {
      execSync(`rm -rf "${patchesDir}"`, { stdio: 'inherit' });
    }
    console.log(`${colors.green}Removed patches directory as it's no longer needed.${colors.reset}\n`);
  }
} catch (error) {
  console.error(`${colors.red}Error removing patches directory: ${error.message}${colors.reset}\n`);
}

console.log(`${colors.bright}${colors.green}===== Setup Complete =====\n${colors.reset}`);
console.log(`${colors.blue}You can now run the project:${colors.reset}`);
console.log(`npm run dev\n`);
console.log(`${colors.blue}If you encounter any issues, refer to the Troubleshooting section in README.md${colors.reset}\n`); 