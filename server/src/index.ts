import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userFeatureRoutes from './routes/userFeature';
import chatLogEvaluationRoutes from './routes/chatLogEvaluation';

const app = express();

// Middleware
app.use(cors({
  origin: ([process.env.CLIENT_URL, 'http://localhost:8080', 'http://localhost:8081'].filter(Boolean) as (string | boolean | RegExp)[]),
  credentials: true,
}));

// Increase JSON payload size limit (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/user-features', userFeatureRoutes);
app.use('/api/chat-log-evaluations', chatLogEvaluationRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '127.0.0.1';

app.listen(PORT, HOST, (error?: Error) => {
  if (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
  console.log(`Server is running on http://${HOST}:${PORT}`);
}).on('error', (error: Error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 