/**
 * Walk Score API Proxy Server
 * 
 * The Walk Score API requires server-side calls (no CORS support for browsers).
 * Run this proxy locally with: node walkscore-proxy.js
 * Then your frontend can call http://localhost:3001/walkscore?lat=...&lon=...&address=...
 */

const http = require('http');
const https = require('https');
const url = require('url');

const WALKSCORE_API_KEY = 'ebe31fa02cd93e633a140e545dfc1444';
const PORT = 3001;

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

  if (parsedUrl.pathname === '/walkscore') {
    const { lat, lon, address } = parsedUrl.query;

    if (!lat || !lon || !address) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required parameters: lat, lon, address' }));
      return;
    }

    // Build Walk Score API URL
    const wsUrl = `https://api.walkscore.com/score?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&address=${encodeURIComponent(address)}&transit=1&bike=1&wsapikey=${WALKSCORE_API_KEY}`;

    https.get(wsUrl, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => data += chunk);
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      console.error('Walk Score API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch Walk Score', details: err.message }));
    });

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use /walkscore?lat=...&lon=...&address=...' }));
  }
});

server.listen(PORT, () => {
  console.log(`Walk Score proxy server running at http://localhost:${PORT}`);
  console.log(`Example: http://localhost:${PORT}/walkscore?lat=47.6085&lon=-122.3295&address=Seattle%20WA`);
});
