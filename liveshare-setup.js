import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 8080;
const VSCODE_DIR = path.join(__dirname, '.vscode');
const LAUNCH_JSON_PATH = path.join(VSCODE_DIR, 'launch.json');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for input with promise wrapper
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('===== VS Code Live Share Setup =====', colors.cyan);
  log('This script will help you configure VS Code Live Share for development.\n');

  // Get Live Share port forwarding URL for backend
  log('Before running this script, make sure you have:', colors.yellow);
  log('1. Started a VS Code Live Share session');
  log('2. Shared port 3000 (backend) as a public server');
  log('3. Shared port 8080 (frontend) as a public server\n');

  const backendURL = await prompt('Enter the shared URL for port 3000 (from VS Code Live Share): ');
  
  if (!backendURL || !backendURL.startsWith('https://')) {
    log('Invalid URL. It should start with https://', colors.yellow);
    process.exit(1);
  }

  // Generate environment variable suggestions
  log('\n===== .env File Configuration =====', colors.cyan);
  log('Add the following to your .env file:', colors.green);
  log('');
  log('# Live Share configuration');
  log(`VITE_API_URL=${backendURL}/api`);
  log(`VITE_BACKEND_URL=${backendURL}`);
  log(`VITE_LIVESHARE_MODE=true`);
  log('');

  // Create .vscode folder if it doesn't exist
  if (!existsSync(VSCODE_DIR)) {
    mkdirSync(VSCODE_DIR);
  }
  
  // Add VS Code Live Share configuration to settings.json
  const settingsPath = path.join(VSCODE_DIR, 'settings.json');
  let settings = {};
  
  // Read existing settings if file exists
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch (e) {
      log('Warning: Could not parse settings.json. Creating a new one.', colors.yellow);
    }
  }

  // Add Live Share settings
  settings['liveshare.shareExternalFiles'] = true;
  settings['liveshare.alwaysFollowHost'] = false;
  settings['liveshare.autoShareServers'] = true;
  settings['liveshare.publishWorkspaceInfo'] = true;
  
  // Write settings back
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  log('\nUpdated VS Code settings at .vscode/settings.json', colors.green);

  log('\n===== Next Steps =====', colors.cyan);
  log('1. Update your .env file with the variables above');
  log('2. Make sure your backend server is running on port 3000');
  log('3. Make sure your frontend server is running on port 8080');
  log('4. Access your application via the VS Code Live Share URL for port 8080');
  
  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 