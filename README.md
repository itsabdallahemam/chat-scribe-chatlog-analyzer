# Chat-Scribe Clarity Analyzer

A powerful AI-driven tool for analyzing and improving customer service chat interactions. Transform your customer service quality through advanced analytics and insights.

## Features

### Core Functionality
- **Chatlog Evaluation**: Upload or paste chatlogs for AI-powered analysis
- **Comprehensive Dashboard**: Interactive visualizations and analytics
- **CPR Analysis**: Detailed metrics for Coherence, Politeness, and Relevance
- **Resolution Tracking**: Monitor customer issue resolution rates
- **Customer Satisfaction**: Track and visualize satisfaction metrics
- **Export Capabilities**: Export analysis results in various formats

### Technical Features
- **Secure Authentication**: JWT-based user authentication
- **Database Integration**: MSSQL with Prisma ORM
- **Real-time Processing**: Instant feedback and analysis
- **Responsive Design**: Works seamlessly on all devices
- **Dark/Light Mode**: User-friendly theme switching

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- React Router for navigation
- React Query for data fetching

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- MSSQL Database
- JWT Authentication

## Prerequisites

- Node.js (v18 or higher)
- Microsoft SQL Server
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-scribe-clarity-analyzer
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

3. Set up environment variables:
Create a `.env` file in the server directory with the following variables:
```env
DATABASE_URL="sqlserver://localhost:1433;database=chatscribe;user=your_username;password=your_password;trustServerCertificate=true"
JWT_SECRET="your_jwt_secret"
CLIENT_URL="http://localhost:5173"
PORT=3000
```

4. Set up the database:
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

## Development

1. Start the frontend development server:
```bash
npm run dev
```

2. Start the backend development server:
```bash
cd server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Building for Production

1. Build the frontend:
```bash
npm run build
```

2. Build the backend:
```bash
cd server
npm run build
```

## Project Structure

```
chat-scribe-clarity-analyzer/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── contexts/         # React contexts
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── server/               # Backend source code
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # Server source code
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   └── utils/       # Utility functions
│   └── dist/            # Compiled backend code
└── public/              # Static assets
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile

### Evaluation Endpoints
- `POST /api/evaluations` - Create new evaluation
- `GET /api/evaluations` - Get user evaluations
- `GET /api/evaluations/:id` - Get specific evaluation

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/metrics` - Get evaluation metrics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the amazing tools and libraries
