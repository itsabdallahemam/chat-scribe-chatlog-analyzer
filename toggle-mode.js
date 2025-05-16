import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dev Tunnel URLs 
const BACKEND_TUNNEL_URL = 'https://3s058406-3000.euw.devtunnels.ms';
const FRONTEND_TUNNEL_URL = 'https://3s058406-8080.euw.devtunnels.ms';

// Local URLs
const BACKEND_LOCAL_URL = 'http://localhost:3000';
const FRONTEND_LOCAL_URL = 'http://localhost:8080';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Chat Scribe Environment Mode Toggle');
console.log('====================================');
console.log('1) Local Mode (http://localhost:8080)');
console.log('2) Dev Tunnels Mode (https://3s058406-8080.euw.devtunnels.ms)');
console.log('====================================');

rl.question('Select mode (1 or 2): ', (answer) => {
  const useLocalMode = answer === '1';
  
  const mode = useLocalMode ? 'LOCAL' : 'DEV_TUNNELS';
  const backendUrl = useLocalMode ? BACKEND_LOCAL_URL : BACKEND_TUNNEL_URL;
  const frontendUrl = useLocalMode ? FRONTEND_LOCAL_URL : FRONTEND_TUNNEL_URL;
  
  console.log(`\nSetting up ${mode} mode...`);
  
  // 1. Update axios.ts
  try {
    const axiosPath = path.join(__dirname, 'src', 'lib', 'axios.ts');
    if (fs.existsSync(axiosPath)) {
      const axiosContent = `import axios from 'axios';

// ${mode} MODE - ${useLocalMode ? 'LOCALHOST' : 'DEV TUNNELS'}
const API_URL = '${backendUrl}/api';

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for CORS when using different domains
  withCredentials: ${!useLocalMode},
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use((config) => {
  console.log(\`🔍 Making request to: \${config.baseURL}\${config.url}\`);
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Add a response interceptor for error logging
api.interceptors.response.use(
  (response) => {
    console.log(\`✅ Response received from: \${response.config.url}\`);
    return response;
  },
  (error) => {
    console.error(\`❌ Error in request to \${error.config?.url}:\`, error);
    return Promise.reject(error);
  }
);

export default api;`;
      
      fs.writeFileSync(axiosPath, axiosContent);
      console.log(`✅ Updated axios.ts to use ${mode} mode`);
    }
  } catch (error) {
    console.error(`❌ Error updating axios.ts:`, error.message);
  }
  
  // 2. Update .env file
  try {
    const envContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# API Configuration - ${mode} MODE
VITE_API_URL=${backendUrl}/api
VITE_BACKEND_URL=${backendUrl}
VITE_FRONTEND_URL=${frontendUrl}
VITE_MODE=${mode}
`;
    
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log(`✅ Created .env file for ${mode} mode`);
  } catch (error) {
    console.error(`❌ Error creating .env file:`, error.message);
  }
  
  // 3. Update server side CORS configuration
  try {
    const serverIndexPath = path.join(__dirname, 'server', 'src', 'index.ts');
    if (fs.existsSync(serverIndexPath)) {
      let content = fs.readFileSync(serverIndexPath, 'utf-8');
      
      // Update CORS origins based on mode
      const origins = useLocalMode ? 
        `[
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ]` : 
        `[
    '${FRONTEND_TUNNEL_URL}',
    '${BACKEND_TUNNEL_URL}',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ]`;
      
      content = content.replace(/origin:\s*\[[^\]]+\]/s, `origin: ${origins}`);
      
      // Also update preflight handling
      const preflightSection = useLocalMode ?
        `  // Handle preflight requests properly
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('localhost')) {
    // Also allow any localhost origin
    res.setHeader('Access-Control-Allow-Origin', origin);
  }` :
        `  // Handle preflight requests properly
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    '${FRONTEND_TUNNEL_URL}'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && (origin.includes('localhost') || origin.includes('devtunnels.ms'))) {
    // Allow any localhost or devtunnels origin
    res.setHeader('Access-Control-Allow-Origin', origin);
  }`;
      
      content = content.replace(/\/\/ Handle preflight requests properly[\s\S]*?else if \([^\)]+\) \{[\s\S]*?res\.setHeader\([^\)]+\)[^\}]*\}/s, preflightSection);
      
      fs.writeFileSync(serverIndexPath, content);
      console.log(`✅ Updated server CORS configuration for ${mode} mode`);
    }
  } catch (error) {
    console.error(`❌ Error updating server CORS:`, error.message);
  }

  // 4. Update server .env file
  try {
    const serverDir = path.join(__dirname, 'server');
    if (fs.existsSync(serverDir)) {
      const serverEnvContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# Client URL for CORS
CLIENT_URL=${frontendUrl}
`;
      
      fs.writeFileSync(path.join(serverDir, '.env'), serverEnvContent);
      console.log(`✅ Updated server .env file for ${mode} mode`);
    }
  } catch (error) {
    console.error(`❌ Error updating server .env:`, error.message);
  }
  
  console.log(`\n🚀 ${mode} mode setup complete!`);
  console.log('\nNext steps:');
  
  if (useLocalMode) {
    console.log('1. Restart both frontend and backend servers');
    console.log('2. Clear browser cache or use the reset-browser.html tool');
    console.log(`3. Access your application at ${FRONTEND_LOCAL_URL}`);
  } else {
    console.log('1. Restart both frontend and backend servers');
    console.log('2. Make sure your Dev Tunnels are active and running');
    console.log('3. Clear browser cache or use the reset-browser.html tool');
    console.log(`4. Access your application at ${FRONTEND_TUNNEL_URL}`);
  }
  
  rl.close();
}); 