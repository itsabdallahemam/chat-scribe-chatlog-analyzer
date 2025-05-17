import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Read environment variables from different .env files
function getEnvConfig() {
  const files = [
    '.env.development.local',
    '.env.local',
    '.env.development',
    '.env'
  ];
  
  const envVars = {};
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      log(`Reading from ${file}:`, colors.blue);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) continue;
        
        const match = line.match(/^(VITE_[A-Z0-9_]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          envVars[key] = value;
          log(`  ${key}=${value}`, colors.yellow);
        }
      }
    }
  }
  
  return envVars;
}

// Check if API URL is accessible
async function checkAPIConnection(url) {
  if (!url) {
    log('No API URL found in environment variables', colors.red);
    return false;
  }
  
  try {
    log(`Testing connection to API: ${url}`, colors.blue);
    const response = await axios.get(url, { timeout: 5000 });
    log(`Connection successful! Status: ${response.status}`, colors.green);
    return true;
  } catch (error) {
    log(`Connection failed: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
async function main() {
  log('===== Live Share Connection Status =====', colors.cyan);
  
  const config = getEnvConfig();
  const apiUrl = config.VITE_API_URL;
  
  if (!apiUrl) {
    log('\nNo API URL found. Please add VITE_API_URL to your .env file.', colors.red);
    log('\nHere\'s what you should add to your .env file:', colors.yellow);
    log('\nVITE_API_URL=https://your-liveshare-url-for-port-3000/api');
    log('VITE_BACKEND_URL=https://your-liveshare-url-for-port-3000');
    log('VITE_LIVESHARE_MODE=true');
    return;
  }
  
  log('\nTrying to connect to API...', colors.blue);
  const success = await checkAPIConnection(apiUrl);
  
  if (success) {
    log('\n✅ Your setup is working correctly!', colors.green);
  } else {
    log('\n❌ Connection failed. Make sure:', colors.red);
    log('1. Your backend server is running (port 3000)', colors.yellow);
    log('2. VS Code Live Share is active and sharing port 3000', colors.yellow);
    log('3. The URL in your .env file matches the Live Share URL', colors.yellow);
  }
}

main().catch(err => {
  log(`Error: ${err.message}`, colors.red);
}); 