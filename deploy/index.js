// index.js - Enhanced SiftPilot Backend with OAuth
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization (simplified for now)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    // In production, save user to database
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      provider: 'google',
      avatarUrl: profile.photos[0].value
    };
    return done(null, user);
  }));
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

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
    },
    session: req.session ? 'active' : 'not active',
    user: req.user ? req.user.email : 'not logged in'
  });
});

// Authentication routes
app.get('/auth/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/login-failed', (req, res) => {
  res.send(`
    <h1>❌ Login Failed</h1>
    <p>OAuth configuration might be incorrect.</p>
    <a href="/">Go back home</a>
  `);
});

// Protected routes
app.get('/dashboard', requireAuth, (req, res) => {
  res.send(`
    <h1>✅ Welcome ${req.user.name}!</h1>
    <p>Email: ${req.user.email}</p>
    <p>Provider: ${req.user.provider}</p>
    <img src="${req.user.avatarUrl}" width="50" height="50">
    <br><br>
    <a href="/api/user">View User API</a><br>
    <a href="/auth/logout">Logout</a><br>
    <a href="/">Home</a>
  `);
});

app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    provider: req.user.provider,
    avatarUrl: req.user.avatarUrl
  });
});

// Logout
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// Home page
app.get('/', (req, res) => {
  const isLoggedIn = req.isAuthenticated();
  res.send(`
    <h1>🚀 SiftPilot - Email Automation Platform</h1>
    <p>Status: ${process.env.NODE_ENV || 'development'}</p>
    <p>Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
    <p>User: ${isLoggedIn ? req.user.email : 'Not logged in'}</p>
    <br>
    ${isLoggedIn ? 
      `<a href="/dashboard">Dashboard</a><br>
       <a href="/auth/logout">Logout</a><br>` : 
      `<a href="/auth/google">Login with Google</a><br>`
    }
    <a href="/test">Test API</a><br>
    <a href="/health">Health Check</a>
  `);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SiftPilot server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
