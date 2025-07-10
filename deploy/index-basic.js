// index.js - SiftPilot Backend
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'SiftPilot backend is working!',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    oauth: {
      google: process.env.GOOGLE_CLIENT_ID ? 'configured' : 'not configured',
      microsoft: process.env.MICROSOFT_CLIENT_ID ? 'configured' : 'not configured'
    }
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 SiftPilot - Email Automation Platform</h1>
    <p>Status: ${process.env.NODE_ENV || 'development'}</p>
    <p>Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
    <br>
    <a href="/test">Test API</a><br>
    <a href="/health">Health Check</a>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SiftPilot server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
