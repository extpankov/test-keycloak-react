require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const cors = require('cors');

const app = express();

// Enable CORS for development
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Session configuration
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Keycloak configuration
const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'master',
  'auth-server-url': process.env.KEYCLOAK_URL || 'http://46.149.69.28:8080',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'test-client',
  'public-client': true,
  'confidential-port': 0,
  'bearer-only': false,
  'use-resource-role-mappings': true,
  'verify-token-audience': false
};

// Log the Keycloak configuration for debugging
console.log('Keycloak Configuration:', keycloakConfig);

// Initialize Keycloak
const keycloak = new Keycloak({
  store: memoryStore,
  scope: 'openid'
}, keycloakConfig);

// Simple middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add Keycloak middleware
app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/',
  protected: '/protected/resource'
}));

// Add a callback endpoint for Keycloak
app.get('/oauth2/callback', keycloak.protect(), (req, res) => {
  console.log('OAuth2 Callback - Redirecting to /protected');
  res.redirect('/protected');
});

// Serve static files from the public directory
app.use(express.static('public'));

// Public route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Login route - redirects to Keycloak
app.get('/login', keycloak.protect(), (req, res) => {
  // This will redirect to Keycloak for authentication
  // After successful authentication, it will redirect to the protected route
  res.redirect('/protected');
});

// Protected route
app.get('/protected', keycloak.protect(), (req, res) => {
  try {
    if (!req.kauth || !req.kauth.grant) {
      console.log('No authentication found, redirecting to login');
      return res.redirect('/login');
    }
    
    const token = req.kauth.grant.access_token;
    const username = token.content.preferred_username || 'User';
    
    console.log(`User ${username} accessed protected route`);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Protected Page</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; text-align: center; }
          .btn { 
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            margin-top: 20px;
          }
          .btn:hover { background-color: #45a049; }
          .token { 
            text-align: left; 
            margin: 20px auto; 
            padding: 10px; 
            background: #f5f5f5; 
            border-radius: 4px; 
            max-width: 800px; 
            word-break: break-all;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${username}!</h1>
          <p>You have successfully authenticated with Keycloak.</p>
          <div class="token">
            <h3>Access Token:</h3>
            <pre>${JSON.stringify(token.content, null, 2)}</pre>
          </div>
          <a href="/logout" class="btn">Logout</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in protected route:', error);
    res.status(500).send('An error occurred while processing your request');
  }
});

// Logout route
app.get('/logout', keycloak.protect(), (req, res) => {
  const redirectUri = process.env.APP_URL || `http://${req.headers.host}`;
  const logoutUrl = new URL(
    `/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
    process.env.KEYCLOAK_URL
  );
  
  logoutUrl.searchParams.append('redirect_uri', redirectUri);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error during logout');
    }
    res.redirect(logoutUrl.toString());
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
