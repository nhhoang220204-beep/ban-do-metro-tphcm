/**
 * osm.mjs — thư viện dùng chung cho mọi công cụ dựng dữ liệu.
 *
 * NGUYÊN TẮC XUYÊN SUỐT DỰ ÁN: chỉ ghi ra dữ liệu OpenStreetMap thực sự có.
 * Không nội suy, không ước lượng, không tự đặt toạ độ. Thiếu thì để trống và
 * để ứng dụng hiển thị "Đang cập nhật".
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(HERE, '..', '..');
export const DATA = join(ROOT, 'data');
export const CACHE = join(HERE, '..', 'cache');

/* ─── §1 · GỌI OVERPASS ──────────────────────────────────────────────────── */

/* Máy chủ công cộng hay quá tải và trả 504. Xoay vòng nhiều máy chủ, chờ giữa
   các lần thử. Một truy vấn nặng có thể mất 90 giây — đừng hạ timeout. */
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const UA = 'ban-do-bds-hcm/2.0 (https://github.com/nhhoang220204-beep/ban-do-metro-tphcm)';

/** Ranh giới TP.HCM sau sáp nhập 2025 — relation 1973756, gồm 168 phường/xã. */
export const AREA_HCM =
  'area["boundary"="administrative"]["admin_level"="4"]["name"="Thành phố Hồ Chí Minh"]->.hcm;';

/* Khung bao TP.HCM mới, chỉ dùng cho lớp cần liền mạch qua ranh giới tỉnh
   (đường vành đai, cao tốc, quốc lộ chạy tiếp sang Đồng Nai / Bình Phước). */
export const BBOX = '10.20,106.20,11.60,107.70';

/**
 * @param {object} opts
 * @param {number} opts.toiThieu Số phần tử tối thiểu coi là kết quả hợp lệ.
 *   Máy chủ công cộng thỉnh thoảng trả HTTP 200 kèm mảng rỗng thay vì báo lỗi —
 *   đã gặp thật: một mirror trả về 0 tiện ích cho truy vấn mà mirror khác trả
 *   218. Nếu nhận rỗng mà không kiểm tra thì sẽ ghi đè dữ liệu tốt bằng dữ liệu
 *   rỗng và không ai biết. Đặt ngưỡng để ép đổi máy chủ và thử lại.
 */
export async function overpass(query, { tries = 9, label = '', toiThieu = 0 } = {}) {
  for (let i = 0; i < tries; i++) {
    const url = ENDPOINTS[i % ENDPOINTS.length];
    const t0 = Date.now();
    const giay = () => ((Date.now() - t0) / 1000).toFixed(0);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'text/plain', 'User-Agent': UA },
        body: query
      });
      const text = await res.text();
      if (text.trimStart().startsWith('{')) {
        const json = JSON.parse(text);
        const n = json.elements?.length ?? 0;
        if (n >= toiThieu) {
          log(`  ✓ ${label} ${giay()}s · ${kb(text.length)} · ${n} phần tử`);
          return json;
        }
        log(`  ! ${label} chỉ có ${n} phần tử (cần ≥ ${toiThieu})` +
            (json.remark ? ` · máy chủ báo: ${json.remark}` : '') + ' — đổi máy chủ');
      } else {
        log(`  ! ${label} HTTP ${res.status} sau ${giay()}s`);
      }
    } catch (err) {
      log(`  ! ${label} ${err.message}`);
    }
    await sleep(6000);
  }
  throw new Error(`Overpass không trả về dữ liệu dùng được cho truy vấn "${label}"`);
}

/** Gọi Overpass có nhớ đệm ra tools/cache — chạy lại không phải tải lại. */
export async function cached(name, query, useCache, toiThieu = 1) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (useCache && existsSync(file)) {
    const cu = JSON.parse(readFileSync(file, 'utf8'));
    if ((cu.elements?.length ?? 0) >= toiThieu) {
      log(`  → dùng lại cache/${name}.json · ${cu.elements.length} phần tử`);
      return cu;
    }
    log(`  ! cache/${name}.json rỗng — tải lại`);
  }
  const json = await overpass(query, { label: name, toiThieu });
  writeFileSync(file, JSON.stringify(json));
  return json;
}

/* ─── §2 · HÌNH HỌC ──────────────────────────────────────────────────────── */

const RAD = Math.PI / 180;

/** Khoảng cách chim bay giữa hai điểm [lat,lng], đơn vị mét. */
export function hav(a, b) {
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function bearing(a, b) {
  const y = Math.sin((b[1] - a[1]) * RAD) * Math.cos(b[0] * RAD);
  const x = Math.cos(a[0] * RAD) * Math.sin(b[0] * RAD) -
            Math.sin(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos((b[1] - a[1]) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** Làm tròn 5 chữ số thập phân ≈ 1 m — đủ chính xác, giảm kích thước file. */
export const round = p => [+(+p[0]).toFixed(5), +(+p[1]).toFixed(5)];

/** Douglas–Peucker: bớt điểm nhưng giữ nguyên độ cong. `tol` tính bằng mét. */
export function simplify(points, tol = 15) {
  if (points.length < 3) return points;
  const sqDist = (p, a, b) => {
    let x = a[1], y = a[0];
    const dx = b[1] - x, dy = b[0] - y;
    if (dx || dy) {
      const t = ((p[1] - x) * dx + (p[0] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b[1]; y = b[0]; } else if (t > 0) { x += dx * t; y += dy * t; }
    }
    const ex = (p[1] - x) * 109000, ey = (p[0] - y) * 110600;
    return ex * ex + ey * ey;
  };
  const tol2 = tol * tol, keep = [points[0]];
  (function step(first, last) {
    let max = tol2, idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = sqDist(points[i], points[first], points[last]);
      if (d > max) { max = d; idx = i; }
    }
    if (idx > -1) {
      if (idx - first > 1) step(first, idx);
      keep.push(points[idx]);
      if (last - idx > 1) step(idx, last);
    }
  })(0, points.length - 1);
  keep.push(points.at(-1));
  return keep;
}

/** Nối các đoạn way rời rạc thành chuỗi liên tục theo đầu–cuối gần nhau. */
export function chain(segments, maxGap = 300) {
  const pool = segments.map(s => s.slice());
  const out = [];
  while (pool.length) {
    const cur = pool.shift();
    let grew = true;
    while (grew) {
      grew = false;
      const head = cur[0], tail = cur.at(-1);
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        const options = [
          [hav(tail, s[0]),     () => cur.push(...s.slice(1))],
          [hav(tail, s.at(-1)), () => cur.push(...s.slice().reverse().slice(1))],
          [hav(head, s.at(-1)), () => cur.unshift(...s.slice(0, -1))],
          [hav(head, s[0]),     () => cur.unshift(...s.slice().reverse().slice(0, -1))]
        ].sort((a, b) => a[0] - b[0]);
        if (options[0][0] <= maxGap) { options[0][1](); pool.splice(i, 1); grew = true; break; }
      }
    }
    out.push(cur);
  }
  return out.sort((a, b) => b.length - a.length);
}

/**
 * BẪY ĐƯỜNG ĐÔI — chuỗi khép kín là đi và về của hai chiều đường; giữ một chiều.
 *
 * OSM vẽ đường đôi thành hai way riêng cho hai chiều. Hàm chain() nối chúng ở
 * chỗ giao nhau thành một chuỗi đi rồi quay về, làm chiều dài gấp đôi. Đã gặp
 * ở tuyến metro 1 (ra 33,8 km thay vì 19,7) và ở Vành đai 4 (393 km thay vì 207).
 */
export function motChieu(points) {
  if (points.length < 4 || hav(points[0], points.at(-1)) >= 150) return points;
  let far = 0, best = -1;
  points.forEach((p, i) => { const d = hav(points[0], p); if (d > best) { best = d; far = i; } });
  const a = points.slice(0, far + 1), b = points.slice(far).reverse();
  return a.length >= b.length ? a : b;
}

/** Cắt khúc gập ngược còn sót (> 150°), giữ nhánh dài hơn. */
export function boKhucGap(points) {
  for (let i = 0; i < points.length - 2; i++) {
    const diff = Math.abs(bearing(points[i], points[i + 1]) - bearing(points[i + 1], points[i + 2]));
    if (Math.min(diff, 360 - diff) > 150) {
      const a = points.slice(0, i + 2), b = points.slice(i + 1);
      return boKhucGap(a.length >= b.length ? a : b);
    }
  }
  return points;
}

/** Tổng chiều dài một chuỗi điểm, đơn vị mét. */
export function lengthOf(points) {
  let m = 0;
  for (let i = 0; i < points.length - 1; i++) m += hav(points[i], points[i + 1]);
  return m;
}

/** Tâm hình học của một vòng đa giác — dùng làm điểm đặt nhãn. */
export function centroid(ring) {
  let lat = 0, lng = 0;
  for (const p of ring) { lat += p[0]; lng += p[1]; }
  return round([lat / ring.length, lng / ring.length]);
}

/* ─── §3 · CHUYỂN PHẦN TỬ OSM ────────────────────────────────────────────── */

/** Toạ độ đại diện của một phần tử OSM, hoặc null nếu OSM không có. */
export function pointOf(el) {
  if (el.lat != null && el.lon != null) return round([el.lat, el.lon]);
  if (el.center) return round([el.center.lat, el.center.lon]);
  if (el.geometry?.length) return centroid(el.geometry.map(g => [g.lat, g.lon]));
  return null;
}

/** Vòng đa giác của way, đã giản lược. Trả null nếu không phải vùng khép kín. */
export function ringOf(el, tol = 25) {
  if (!el.geometry || el.geometry.length < 4) return null;
  const pts = el.geometry.map(g => [g.lat, g.lon]);
  if (hav(pts[0], pts.at(-1)) > 60) return null;
  return simplify(pts, tol).map(round);
}

/** Điểm có nằm trong vòng đa giác không — thuật toán ray casting. */
export function trongDaGiac(point, ring) {
  const [y, x] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* ─── §4 · GHI FILE ──────────────────────────────────────────────────────── */

export function writeData(name, payload) {
  mkdirSync(DATA, { recursive: true });
  const file = join(DATA, name);
  const body = JSON.stringify(payload);
  writeFileSync(file, body, 'utf8');
  log(`  ▸ data/${name} · ${kb(body.length)}`);
  return body.length;
}

export function readData(name) {
  const file = join(DATA, name);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/** Khối meta chung: nguồn và ngày chụp, để giao diện nói rõ dữ liệu từ đâu. */
export function meta(extra = {}) {
  return {
    nguon: 'OpenStreetMap · Overpass API',
    giay_phep: 'ODbL 1.0',
    ngay_chup: new Date().toISOString().slice(0, 10),
    ...extra
  };
}

/* ─── §5 · TIỆN ÍCH NHỎ ──────────────────────────────────────────────────── */

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const kb = n => `${(n / 1024).toFixed(0)} KB`;
export const log = s => process.stderr.write(s + '\n');

/** Bỏ dấu tiếng Việt — dùng cho khoá tìm kiếm không phân biệt dấu. */
export function slug(s) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}
