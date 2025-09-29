// Main API entry point for Vercel deployment
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-domain.vercel.app']
        : ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true
}));

// Health check endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'TaskFlow API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notion', require('./routes/notion'));
app.use('/api/supabase', require('./routes/supabase'));

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

module.exports = app;