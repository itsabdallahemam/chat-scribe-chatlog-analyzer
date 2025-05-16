// Run this file with: node check-env.js
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

console.log('Checking environment variables for Vue/React app');
console.log('\nLocal environment variables:');

// Get all environment variables that start with VITE_
const viteEnv = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

console.log(viteEnv);

console.log('\nChecking .env file:');

try {
  const envPath = join(__dirname, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    console.log('Content of .env file:');
    console.log(envContent);
  } else {
    console.log('.env file not found');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Check for Vite configuration
try {
  const viteConfigPath = join(__dirname, 'vite.config.ts');
  if (existsSync(viteConfigPath)) {
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');
    console.log('\nVite config exists');
  } else {
    console.log('\nVite config not found');
  }
} catch (error) {
  console.error('Error reading vite config:', error);
}

// Check tunnel config
try {
  const tunnelConfigPath = join(__dirname, '.tunnel-config.json');
  if (existsSync(tunnelConfigPath)) {
    const tunnelConfig = JSON.parse(readFileSync(tunnelConfigPath, 'utf-8'));
    console.log('\nTunnel configuration:');
    console.log(tunnelConfig);
  } else {
    console.log('\nTunnel config not found');
  }
} catch (error) {
  console.error('Error reading tunnel config:', error);
} 