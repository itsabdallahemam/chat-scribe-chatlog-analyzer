import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Resetting application to LOCAL mode...');

// Create fresh .env file with localhost settings
try {
  const envContent = `# Database Configuration
DATABASE_URL="postgresql://prisma_user:Test123@localhost:5432/chatscribev3"

# API Configuration - LOCAL MODE
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
VITE_MODE=LOCAL
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

// LOCAL MODE - LOCALHOST ONLY
const API_URL = 'http://localhost:3000/api';

console.log('Using API URL:', API_URL);

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

// Create server/.env file
try {
  const serverDir = path.join(__dirname, 'server');
  if (fs.existsSync(serverDir)) {
    const serverEnvContent = `# Database Configuration
DATABASE_URL="postgresql://prisma_user:Test123@localhost:5432/chatscribev3"

# Client URL for CORS
CLIENT_URL="http://localhost:8080"
`;
    
    fs.writeFileSync(path.join(serverDir, '.env'), serverEnvContent);
    console.log('✅ Created server/.env file for local development');
  }
} catch (error) {
  console.error('❌ Error creating server/.env file:', error.message);
}

console.log('\n🚀 Local mode setup complete!');
console.log('\nNext steps:');
console.log('1. Restart both frontend and backend servers');
console.log('2. Access your application at http://localhost:8080');
console.log('3. Backend API will be available at http://localhost:3000/api'); 