const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const app = express();

app.use(cors());

// Add Security Headers
app.use((req, res, next) => {
  // Remove any existing CSP headers that might be too restrictive
  res.removeHeader('Content-Security-Policy');
  
  // Set a more permissive CSP
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https:;"
  );
  next();
});

// Proxy API requests to the backend
app.use("/api", createProxyMiddleware({
  target: "http://localhost:3000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": ""
  },
  onProxyRes: (proxyRes, req, res) => {
    // Remove CSP headers from backend responses to prevent conflicts
    proxyRes.headers['content-security-policy'] = undefined;
  }
}));

// Proxy all other requests to the frontend
app.use("/", createProxyMiddleware({
  target: "http://localhost:8080",
  changeOrigin: true,
  onProxyRes: (proxyRes, req, res) => {
    // Remove CSP headers from frontend responses to prevent conflicts
    proxyRes.headers['content-security-policy'] = undefined;
  }
}));

const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

