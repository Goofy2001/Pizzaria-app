import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const indexFile = path.join(distDir, 'index.html')
const PORT = Number(process.env.PORT || 5174)

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  const safePath = urlPath === '/' ? '/index.html' : urlPath
  const filePath = path.join(distDir, safePath)

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
      fs.createReadStream(filePath).pipe(res)
      return
    }

    // SPA fallback
    fs.readFile(indexFile, (indexErr, indexData) => {
      if (indexErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Frontend build not found. Run npm run build first.')
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(indexData)
    })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Frontend running on http://0.0.0.0:${PORT}`)
})
