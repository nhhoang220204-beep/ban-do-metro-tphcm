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
 *
 * CHẾ ĐỘ BIÊN TẬP GIS: máy chủ này còn nhận POST /__luu-du-lieu để ghi thẳng
 * xuống data/stations.json và data/ring_roads.json khi bấm "Lưu" trong ứng
 * dụng — chỉ dùng cho việc tự dựng dữ liệu trên máy Hoàng, KHÔNG bao giờ chạy
 * trên GitHub Pages (site tĩnh không có máy chủ này). Vì có khả năng GHI file
 * nên chỉ lắng nghe trên 127.0.0.1, không mở ra mạng LAN, và chỉ nhận đúng hai
 * tên file trong danh sách cho phép bên dưới.
 */

import { createServer } from 'node:http';
import { readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 5173;

/** Chỉ các file cố định này được phép ghi qua /__luu-du-lieu — không nhận đường dẫn tuỳ ý. */
const FILE_DUOC_GHI = {
  'stations': join(ROOT, 'data', 'stations.json'),
  'ring_roads': join(ROOT, 'data', 'ring_roads.json'),
  'projects-index': join(ROOT, 'data', 'projects', 'index.json')
};

/** projects-chi-tiet có id động (1.148 file khác nhau) — kiểm bằng regex thay vì liệt kê hết. */
const ID_HOP_LE = /^[a-z0-9][a-z0-9-]{0,80}$/;
const THU_MUC_CHI_TIET = join(ROOT, 'data', 'projects', 'chi-tiet');

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

/** Đọc thân request, chặn body quá lớn (phòng lỗi gõ nhầm gửi vòng lặp). */
async function docThan(req, gioiHan = 20 * 1024 * 1024) {
  const phan = [];
  let tong = 0;
  for await (const doan of req) {
    tong += doan.length;
    if (tong > gioiHan) throw new Error('Body quá lớn');
    phan.push(doan);
  }
  return Buffer.concat(phan).toString('utf8');
}

function duongGhi(file, id) {
  if (file === 'projects-chi-tiet') {
    if (!id || !ID_HOP_LE.test(id)) return null;
    return join(THU_MUC_CHI_TIET, `${id}.json`);
  }
  return FILE_DUOC_GHI[file] ?? null;
}

async function xuLyLuuDuLieu(req, res) {
  try {
    const than = await docThan(req);
    const { file, id, noiDung, xoa } = JSON.parse(than);
    const duong = duongGhi(file, id);
    if (!duong) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
         .end(JSON.stringify({ loi: `Tên file hoặc id không hợp lệ: "${file}" / "${id ?? ''}"` }));
      return;
    }

    /* xoa:true dùng để xoá hẳn một file chi-tiet dự án (khi Hoàng xoá dự án). */
    if (xoa) {
      await unlink(duong).catch(() => {});
      console.log(`  → đã xoá ${duong}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({ ok: true }));
      return;
    }

    /* noiDung phải là JSON hợp lệ trước khi ghi — không để một lần lưu hỏng làm
       mất trắng cả file. */
    const parsed = JSON.parse(noiDung);
    await writeFile(duong, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
    console.log(`  → đã lưu ${duong}`);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
       .end(JSON.stringify({ loi: err.message }));
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && url.pathname === '/__luu-du-lieu') {
      return xuLyLuuDuLieu(req, res);
    }

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

/* Chỉ 127.0.0.1: máy chủ này giờ có khả năng ghi file, không để lộ ra mạng LAN. */
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Bản đồ đang chạy tại  http://localhost:${PORT}`);
  console.log('Chế độ biên tập GIS: bấm "Lưu" trong ứng dụng sẽ ghi thẳng vào data/*.json');
  console.log('Dừng bằng Ctrl+C');
});
