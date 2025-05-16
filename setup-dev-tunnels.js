import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dev Tunnel URLs
const BACKEND_URL = 'https://3s058406-3000.euw.devtunnels.ms';
const FRONTEND_URL = 'https://3s058406-8080.euw.devtunnels.ms';

// Environment variables content
const envContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# Dev Tunnels configuration
VITE_API_URL=${BACKEND_URL}/api
VITE_BACKEND_URL=${BACKEND_URL}
VITE_FRONTEND_URL=${FRONTEND_URL}
VITE_LIVESHARE_MODE=true

# For backend server
CLIENT_URL=${FRONTEND_URL}
`;

console.log('Setting up Dev Tunnels environment...');

// Update .env file in root directory
try {
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('✅ Updated .env file in root directory');
} catch (error) {
  console.error('❌ Failed to update .env file:', error.message);
}

// Update .tunnel-config.json
try {
  const tunnelConfig = {
    frontend: FRONTEND_URL,
    backend: BACKEND_URL,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(__dirname, '.tunnel-config.json'),
    JSON.stringify(tunnelConfig, null, 2)
  );
  console.log('✅ Updated .tunnel-config.json');
} catch (error) {
  console.error('❌ Failed to update .tunnel-config.json:', error.message);
}

// Also ensure the API URL is updated in src/lib/axios.ts
try {
  const axiosPath = path.join(__dirname, 'src', 'lib', 'axios.ts');
  if (fs.existsSync(axiosPath)) {
    let axiosContent = fs.readFileSync(axiosPath, 'utf-8');
    
    // Replace any hardcoded API URLs with environment variable
    axiosContent = axiosContent.replace(
      /baseURL:\s*['"]https?:\/\/[^'"]+['"]/,
      `baseURL: import.meta.env.VITE_API_URL || '${BACKEND_URL}/api'`
    );
    
    fs.writeFileSync(axiosPath, axiosContent);
    console.log('✅ Updated src/lib/axios.ts');
  }
} catch (error) {
  console.error('❌ Failed to update axios.ts:', error.message);
}

// Create server/.env file if server directory exists
try {
  const serverDir = path.join(__dirname, 'server');
  if (fs.existsSync(serverDir)) {
    const serverEnvContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# Client URL for CORS
CLIENT_URL=${FRONTEND_URL}
`;
    fs.writeFileSync(path.join(serverDir, '.env'), serverEnvContent);
    console.log('✅ Updated server/.env file');
  }
} catch (error) {
  console.error('❌ Failed to update server/.env file:', error.message);
}

console.log('\n🚀 Dev Tunnels environment setup complete!');
console.log('\nRemember to:');
console.log('1. Restart both your frontend and backend servers');
console.log(`2. Access your frontend at: ${FRONTEND_URL}`);
console.log(`3. Backend API will be available at: ${BACKEND_URL}/api`); 