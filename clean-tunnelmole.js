import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Searching for and removing tunnelmole references...');

// Delete tunnelmole log files
const tunnelmoleFiles = [
  'cloudflared-log.txt',
  'cloudflared-frontend-log.txt',
  'cloudflared-backend-log.txt',
];

tunnelmoleFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted ${file}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${file}: ${error.message}`);
    }
  }
});

// Find all .ts, .tsx, .js, .jsx, and .json files in the project
console.log('\n🔍 Scanning code files for tunnelmole references...');

function findFilesRecursively(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      // Recurse into subdirectories, skipping node_modules and .git
      results = results.concat(findFilesRecursively(filePath, extensions));
    } else if (stat.isFile() && extensions.includes(path.extname(filePath))) {
      results.push(filePath);
    }
  });
  
  return results;
}

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.env'];
const filesToCheck = findFilesRecursively(__dirname, fileExtensions);
const tunnelmoleRegex = /tunnelmole\.net/gi;

let filesCleaned = 0;

filesToCheck.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (tunnelmoleRegex.test(content)) {
      // Clean src/lib/axios.ts completely from tunnelmole URLs
      if (filePath.includes('src/lib/axios.ts')) {
        content = content.replace(/baseURL:\s*['"]https?:\/\/[^'"]+tunnelmole\.net[^'"]*['"]/gi, 
          `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'`);
      }
      
      // Clean other files
      content = content.replace(/https?:\/\/[a-z0-9-]+\.tunnelmole\.net/gi, 'http://localhost:3000');
      content = content.replace(/tunnelmole\.net/gi, 'localhost');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned tunnelmole references from: ${filePath}`);
      filesCleaned++;
    }
  } catch (error) {
    console.error(`❌ Failed to process ${filePath}: ${error.message}`);
  }
});

// Update server's CORS configuration
try {
  const serverIndexPath = path.join(__dirname, 'server', 'src', 'index.ts');
  if (fs.existsSync(serverIndexPath)) {
    let content = fs.readFileSync(serverIndexPath, 'utf-8');
    
    // Update CORS origins
    content = content.replace(/origin:\s*\[[^\]]+\]/s, `origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
    // Dev Tunnels URLs
    'https://3s058406-8080.euw.devtunnels.ms',
    'https://3s058406-3000.euw.devtunnels.ms',
    'http://3s058406-8080.euw.devtunnels.ms',
    'http://3s058406-3000.euw.devtunnels.ms'
  ]`);
    
    fs.writeFileSync(serverIndexPath, content);
    console.log(`✅ Updated CORS configuration in server/src/index.ts`);
  }
} catch (error) {
  console.error(`❌ Failed to update server CORS: ${error.message}`);
}

// Update Vite config
try {
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    let content = fs.readFileSync(viteConfigPath, 'utf-8');
    
    // Remove tunnelmole references
    if (content.includes('tunnelmole')) {
      content = content.replace(/['"][^'"]*tunnelmole[^'"]*['"],?\s*/g, '');
      content = content.replace(/['"]\.tunnelmole\.net['"],?\s*/g, '');
      
      fs.writeFileSync(viteConfigPath, content);
      console.log(`✅ Removed tunnelmole references from vite.config.ts`);
    }
  }
} catch (error) {
  console.error(`❌ Failed to update vite config: ${error.message}`);
}

// Create proper .env files
try {
  const envContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# API Configuration for local development
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
`;
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);
  console.log(`✅ Created local .env file`);
  
  // Server env
  const serverDir = path.join(__dirname, 'server');
  if (fs.existsSync(serverDir)) {
    const serverEnvContent = `# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=chatscribev3;user=prisma_user;password=Test123;trustServerCertificate=true"

# Client URL for CORS
CLIENT_URL=http://localhost:8080
`;
    fs.writeFileSync(path.join(serverDir, '.env'), serverEnvContent);
    console.log(`✅ Created server/.env file`);
  }
} catch (error) {
  console.error(`❌ Failed to create .env files: ${error.message}`);
}

console.log(`\n🎉 Cleanup complete! Cleaned ${filesCleaned} files.`);
console.log(`\nNext steps:`);
console.log(`1. Restart both frontend and backend servers`);
console.log(`2. Clear your browser cache or use incognito mode`);
console.log(`3. Use http://localhost:8080 for frontend`);
console.log(`4. Backend should be running at http://localhost:3000/api`); 