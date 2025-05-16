import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userFeatureRoutes from './routes/userFeature';
import chatLogEvaluationRoutes from './routes/chatLogEvaluation';
import performanceRoutes from './routes/performance';
import path from 'path';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://3s058406-8080.euw.devtunnels.ms',
    'https://3s058406-3000.euw.devtunnels.ms',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
}));

// IMPORTANT: Override the default CSP that's causing the favicon.ico issue
app.use((req, res, next) => {
  // Remove any existing restrictive CSP headers
  res.removeHeader('Content-Security-Policy');
  
  // Set a more permissive CSP
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: wss: ws:; img-src 'self' data: https: *; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: wss: ws: *;"
  );
  
  // Handle preflight requests properly
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
  }
  
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Increase JSON payload size limit (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add a root route handler
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chat Scribe API</title>
        <link rel="icon" href="data:,"> <!-- Empty favicon to avoid 404 -->
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Chat Scribe API Server</h1>
          <p>This is the backend API server for Chat Scribe.</p>
          <p>API endpoints are available at:</p>
          <ul style="list-style-type: none;">
            <li>/api/auth</li>
            <li>/api/user-features</li>
            <li>/api/chat-log-evaluations</li>
            <li>/api/performance</li>
          </ul>
          <p>For the frontend application, please visit: <a href="http://localhost:8080">Chat Scribe Frontend</a></p>
        </div>
      </body>
    </html>
  `);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user-features', userFeatureRoutes);
app.use('/api/chat-log-evaluations', chatLogEvaluationRoutes);
app.use('/api/performance', performanceRoutes);

// Serve a static blank favicon to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // Send "No Content" status
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Share with others at: http://192.168.1.42:${PORT}`);
}); 