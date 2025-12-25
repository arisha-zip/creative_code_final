/**
 * Walk Score API Proxy Server (Render-ready)
 */

const http = require('http');
const https = require('https');
const url = require('url');

const WALKSCORE_API_KEY = process.env.WALKSCORE_API_KEY;

// Render sets PORT for you; locally you can still use 3001
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Basic health check endpoint (nice for testing)
  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (parsedUrl.pathname === '/walkscore') {
    const { lat, lon, address } = parsedUrl.query;

    if (!WALKSCORE_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server missing WALKSCORE_API_KEY' }));
      return;
    }

    if (!lat || !lon || !address) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required parameters: lat, lon, address' }));
      return;
    }

    const wsUrl =
      `https://api.walkscore.com/score?format=json` +
      `&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lon)}` +
      `&address=${encodeURIComponent(address)}` +
      `&transit=1&bike=1` +
      `&wsapikey=${encodeURIComponent(WALKSCORE_API_KEY)}`;

    https.get(wsUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode || 200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      console.error('Walk Score API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch Walk Score', details: err.message }));
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Use /walkscore?lat=...&lon=...&address=...' }));
});

// IMPORTANT: bind to 0.0.0.0 for hosting platforms
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Walk Score proxy server running on port ${PORT}`);
});
