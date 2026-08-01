#!/usr/bin/env node
/**
 * serve.mjs — máy chủ tĩnh nhỏ để mở ứng dụng trên máy.
 *
 * Chạy:  node tools/serve.mjs          → http://localhost:5173
 *        node tools/serve.mjs 8080     → đổi cổng
 *
 * Vì sao cần: ứng dụng nạp dữ liệu bằng fetch và dùng module JavaScript. Mở
 * thẳng file từ ổ đĩa (giao thức file://) thì trình duyệt chặn cả hai, ra trang
 * trắng. Không cần cài gì thêm, chỉ dùng thư viện có sẵn của Node.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 5173;

const KIEU = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';

    /* Chặn đi ngược lên thư mục cha: /../../etc/passwd và tương tự. */
    const file = join(ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end('Cấm'); return; }

    const info = await stat(file);
    if (info.isDirectory()) { res.writeHead(301, { Location: rel + '/' }).end(); return; }

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': KIEU[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache'
    }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
       .end('<h1>404</h1><p>Không tìm thấy tệp.</p>');
  }
});

server.listen(PORT, () => {
  console.log(`Bản đồ đang chạy tại  http://localhost:${PORT}`);
  console.log('Dừng bằng Ctrl+C');
});
