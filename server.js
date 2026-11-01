const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const requestUrl = req.url === '/' ? '/demo/camera-demo.html' : req.url;
  const safePath = path.normalize(requestUrl).replace(/^\.+[\\/]+/, '');
  const filePath = path.join(rootDir, safePath);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Health-Fitness-AI-Analyzer demo running at http://localhost:${port}/demo/camera-demo.html`);
});
