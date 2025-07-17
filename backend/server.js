const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '.env'),
  debug: true 
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'devboard-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  optionsSuccessStatus: 200
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// MongoDB Connection with advanced options
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    logger.info('MongoDB connected successfully');
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  console.log(`👤 User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    logger.info(`User ${userId} joined personal room`);
  });

  // Join project room for collaboration
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    socket.to(`project-${projectId}`).emit('user-joined-project', { 
      userId: socket.userId,
      timestamp: new Date() 
    });
    logger.info(`User joined project: ${projectId}`);
  });

  // Handle real-time task updates
  socket.on('task-updated', (data) => {
    socket.to(`project-${data.projectId}`).emit('task-update', data);
    logger.info(`Task updated in project: ${data.projectId}`);
  });

  // Handle real-time comments
  socket.on('new-comment', (data) => {
    socket.to(`project-${data.projectId}`).emit('comment-added', data);
    logger.info(`New comment in project: ${data.projectId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`project-${data.projectId}`).emit('user-typing', {
      userId: socket.userId,
      userName: data.userName
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`project-${data.projectId}`).emit('user-stopped-typing', {
      userId: socket.userId
    });
  });

  // Handle pomodoro session broadcasts
  socket.on('pomodoro-started', (data) => {
    socket.to(`user-${data.userId}`).emit('pomodoro-notification', {
      type: 'started',
      duration: data.duration,
      timestamp: new Date()
    });
  });

  socket.on('pomodoro-completed', (data) => {
    socket.to(`user-${data.userId}`).emit('pomodoro-notification', {
      type: 'completed',
      sessionNumber: data.sessionNumber,
      totalTime: data.totalTime,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Swagger/OpenAPI configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DevBoard API',
      version: '1.0.0',
      description: 'A comprehensive productivity dashboard API with real-time features',
      contact: {
        name: 'DevBoard Team',
        email: 'contact@devboard.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DevBoard API Documentation'
}));

// Health check with system info
app.get('/', (req, res) => {
  res.json({ 
    message: 'DevBoard backend running',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'Real-time WebSocket support',
      'Advanced security',
      'Performance optimization',
      'AI-powered insights',
      'Comprehensive API documentation'
    ],
    endpoints: {
      health: '/',
      api: '/api',
      docs: '/api-docs',
      metrics: '/metrics'
    }
  });
});

// System metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/tasks', require('./routes/task'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/comments', require('./routes/comment'));
app.use('/api/users', require('./routes/user'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🔌 WebSocket server ready for real-time connections`);
});

module.exports = { app, server, io }; 