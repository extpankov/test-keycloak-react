# Keycloak Test Application

This is a simple Node.js application that demonstrates authentication using Keycloak.

## Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- Access to a Keycloak server

## Setup

1. Clone this repository
2. Navigate to the server directory:
   ```
   cd server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Configure the `.env` file in the server directory with your Keycloak settings.

## Keycloak Configuration

1. Log in to your Keycloak admin console at `http://46.149.69.28:8080`
2. Create a new realm or use an existing one
3. Create a new client with the following settings:
   - Client ID: `test-client`
   - Client Protocol: `openid-connect`
   - Root URL: `http://localhost:3000`
   - Valid Redirect URIs: 
     - `http://localhost:3000/*`
     - `http://localhost:3000/oauth2/callback*`
   - Web Origins: `*` (for development only)
   - Access Type: `confidential`
   - Standard Flow Enabled: `ON`
   - Direct Access Grants Enabled: `ON`
   - Save and go to the Credentials tab to get the client secret
   - Update the `KEYCLOAK_CLIENT_SECRET` in `.env` with this value

4. Ensure you have a user created in Keycloak with a password
5. Make sure the user has the necessary roles assigned if you're using role-based access control

## Running the Application

1. Start the server:
   ```
   cd server
   node index.js
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Click the "Login with Keycloak" button to authenticate

## Project Structure

- `server/` - Backend server code
  - `index.js` - Main server file
  - `.env` - Environment variables
  - `public/` - Static files
    - `index.html` - Frontend page

## Security Notes

- This is a basic implementation for demonstration purposes only
- In production, use proper HTTPS configuration
- Store secrets securely (not in version control)
- Configure proper CORS and security headers
