import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Resetting application to use localhost APIs...');

// Create fresh .env file with localhost settings
try {
  const envContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# API Configuration - LOCALHOST ONLY
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
`;
  
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log('✅ Created fresh .env file with localhost configuration');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}

// Force update axios.ts to use hardcoded localhost
try {
  const axiosPath = path.join(__dirname, 'src', 'lib', 'axios.ts');
  if (fs.existsSync(axiosPath)) {
    const axiosContent = `import axios from 'axios';

// HARDCODED API URL - USE LOCALHOST ONLY
const API_URL = 'http://localhost:3000/api';

console.log('Using HARDCODED API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    console.log('✅ Forcibly updated axios.ts to use hardcoded localhost URL');
  }
} catch (error) {
  console.error('❌ Error updating axios.ts:', error.message);
}

// Clean server CORS configuration
try {
  const serverIndexPath = path.join(__dirname, 'server', 'src', 'index.ts');
  if (fs.existsSync(serverIndexPath)) {
    const content = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Update CORS origins to include only localhost
    const updatedContent = content.replace(/origin:\s*\[[^\]]+\]/s, `origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ]`);
    
    fs.writeFileSync(serverIndexPath, updatedContent);
    console.log('✅ Updated server CORS configuration to use localhost only');
  }
} catch (error) {
  console.error('❌ Error updating server CORS:', error.message);
}

console.log('\n🚀 Reset complete!');
console.log('\nImportant next steps:');
console.log('1. Close ALL browser windows currently using the application');
console.log('2. Open a new browser window or use incognito mode');
console.log('3. Restart both frontend and backend servers');
console.log('4. Access your application at http://localhost:8080'); 