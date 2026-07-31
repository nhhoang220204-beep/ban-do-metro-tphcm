#!/usr/bin/env node
/**
 * build-geo.mjs — tái tạo khối dữ liệu GEO trong index.html từ OpenStreetMap.
 *
 * Chạy:  node tools/build-geo.mjs            (tải mới từ Overpass rồi ghi vào index.html)
 *        node tools/build-geo.mjs --dry      (chỉ in kết quả, không ghi file)
 *        node tools/build-geo.mjs --cache    (dùng lại tools/cache/planned.json, không gọi mạng)
 *
 * NGUYÊN TẮC: chỉ lấy dữ liệu OSM thực sự có. Không nội suy, không ước lượng,
 * không tự đặt ga ở nơi OSM không có node. Tuyến nào OSM thiếu ga thì xuất `g: []`
 * và ứng dụng sẽ hiện "Chưa có ga" thay vì ghim bừa.
 *
 * Ba bẫy đã gặp, đừng bỏ các bước xử lý tương ứng:
 *   1. OSM vẽ đường sắt hai chiều thành hai way riêng → nối lại thành vòng khép kín,
 *      tuyến dài gấp đôi (tuyến 1 ra 33,8 km thay vì 19,7). Xử lý: singleTrack().
 *   2. Còn sót khúc gập ngược ~180° sau khi tách chiều. Xử lý: unfold().
 *   3. Một ga có thể thuộc nhiều tuyến (ga trung chuyển). Gán theo ngưỡng khoảng cách,
 *      không gán độc quyền cho tuyến gần nhất.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const CACHE = join(HERE, 'cache');
const TARGET = join(ROOT, 'index.html');
const argv = new Set(process.argv.slice(2));
const DRY = argv.has('--dry');
const USE_CACHE = argv.has('--cache');

/* ══ 1 · TẢI DỮ LIỆU OSM ══════════════════════════════════════════════════ */
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];
const BBOX = '10.30,106.30,11.30,107.20';   // TP.HCM + Bình Dương + Đồng Nai

/** Gọi Overpass, đổi máy chủ và thử lại vì các máy chủ công cộng hay quá tải. */
async function overpass(query, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const url = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'text/plain', 'User-Agent': 'metro-hcm-map/1.0' },
        body: query
      });
      const text = await res.text();
      if (text.trimStart().startsWith('{')) return JSON.parse(text);
      process.stderr.write(`  ! ${url} → HTTP ${res.status}\n`);
    } catch (err) {
      process.stderr.write(`  ! ${url} → ${err.message}\n`);
    }
    await new Promise(r => setTimeout(r, 7000));
  }
  throw new Error('Overpass không phản hồi sau nhiều lần thử');
}

/** Hướng tuyến (way) + ga (node) của mọi tuyến đường sắt đô thị trong vùng. */
const QUERY_RAIL = `[out:json][timeout:180];
(
 way["railway"~"^(construction|proposed|subway|light_rail|monorail)$"](${BBOX});
 node["railway"~"^(construction|proposed)$"]["name"](${BBOX});
 node["railway"="station"]["station"~"subway|light_rail"](${BBOX});
 node["proposed:railway"="station"](${BBOX});
 node["construction:railway"="station"](${BBOX});
);
out geom tags;`;

/** Ga đường sắt đang khai thác — nguồn toạ độ chuẩn cho 14 ga tuyến 1. */
const QUERY_STATIONS = `[out:json][timeout:120];
(
 node["railway"~"^(station|halt)$"](${BBOX});
 way["railway"~"^(station|halt)$"](${BBOX});
);
out center tags;`;

async function fetchOsm() {
  mkdirSync(CACHE, { recursive: true });
  const files = { planned: join(CACHE, 'planned.json'), stations: join(CACHE, 'stations.json') };
  if (USE_CACHE && existsSync(files.planned) && existsSync(files.stations)) {
    process.stderr.write('→ dùng lại dữ liệu trong tools/cache\n');
    return { planned: JSON.parse(readFileSync(files.planned, 'utf8')),
             stations: JSON.parse(readFileSync(files.stations, 'utf8')) };
  }
  process.stderr.write('→ tải hướng tuyến và ga từ Overpass\n');
  const planned = await overpass(QUERY_RAIL);
  const stations = await overpass(QUERY_STATIONS);
  writeFileSync(files.planned, JSON.stringify(planned));
  writeFileSync(files.stations, JSON.stringify(stations));
  process.stderr.write(`  ✓ ${planned.elements.length} phần tử tuyến · ${stations.elements.length} ga\n`);
  return { planned, stations };
}

/* ══ 2 · HÌNH HỌC ═════════════════════════════════════════════════════════ */
const RAD = Math.PI / 180;
const hav = (a, b) => {
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
const bearing = (a, b) => {
  const y = Math.sin((b[1] - a[1]) * RAD) * Math.cos(b[0] * RAD);
  const x = Math.cos(a[0] * RAD) * Math.sin(b[0] * RAD) - Math.sin(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.cos((b[1] - a[1]) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
};
const round = p => [+p[0].toFixed(5), +p[1].toFixed(5)];

/** Nối các đoạn way rời rạc thành chuỗi liên tục theo đầu–cuối gần nhau. */
function chain(segments, maxGap = 400) {
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
          [hav(tail, s[0]),      () => cur.push(...s.slice(1))],
          [hav(tail, s.at(-1)),  () => cur.push(...s.slice().reverse().slice(1))],
          [hav(head, s.at(-1)),  () => cur.unshift(...s.slice(0, -1))],
          [hav(head, s[0]),      () => cur.unshift(...s.slice().reverse().slice(0, -1))]
        ].sort((a, b) => a[0] - b[0]);
        if (options[0][0] <= maxGap) { options[0][1](); pool.splice(i, 1); grew = true; break; }
      }
    }
    out.push(cur);
  }
  return out.sort((a, b) => b.length - a.length);
}

/** BẪY 1 — chuỗi khép kín là đi–về hai chiều đường ray; chỉ giữ một chiều. */
function singleTrack(points) {
  if (points.length < 4 || hav(points[0], points.at(-1)) >= 150) return points;
  let far = 0, best = -1;
  points.forEach((p, i) => { const d = hav(points[0], p); if (d > best) { best = d; far = i; } });
  const a = points.slice(0, far + 1), b = points.slice(far).reverse();
  return a.length >= b.length ? a : b;
}

/** BẪY 2 — cắt khúc gập ngược còn sót (> 150°), giữ nhánh dài hơn. */
function unfold(points) {
  for (let i = 0; i < points.length - 2; i++) {
    const diff = Math.abs(bearing(points[i], points[i + 1]) - bearing(points[i + 1], points[i + 2]));
    if (Math.min(diff, 360 - diff) > 150) {
      const a = points.slice(0, i + 2), b = points.slice(i + 1);
      return unfold(a.length >= b.length ? a : b);
    }
  }
  return points;
}

/** Douglas–Peucker: giảm số điểm nhưng giữ nguyên độ cong. */
function simplify(points, tol = 15) {
  if (points.length < 3) return points;
  const sqDist = (p, a, b) => {
    let x = a[1], y = a[0], dx = b[1] - x, dy = b[0] - y;
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
    for (let i = first + 1; i < last; i++) { const d = sqDist(points[i], points[first], points[last]); if (d > max) { max = d; idx = i; } }
    if (idx > -1) { if (idx - first > 1) step(first, idx); keep.push(points[idx]); if (last - idx > 1) step(idx, last); }
  })(0, points.length - 1);
  keep.push(points.at(-1));
  return keep;
}

/** Khoảng cách từ điểm tới hình tuyến — đo tới CẠNH, không phải tới đỉnh. */
function distToShape(c, segments) {
  let best = Infinity;
  for (const s of segments) for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1], dx = b[1] - a[1], dy = b[0] - a[0];
    let t = 0;
    if (dx || dy) t = Math.max(0, Math.min(1, ((c[1] - a[1]) * dx + (c[0] - a[0]) * dy) / (dx * dx + dy * dy)));
    const d = hav(c, [a[0] + dy * t, a[1] + dx * t]);
    if (d < best) best = d;
  }
  return best;
}

/** Sắp thứ tự ga dọc hành lang: bắt đầu từ một đầu rồi lần lượt sang ga gần nhất. */
function orderAlong(list) {
  if (list.length < 3) return list;
  let start = list[0], far = -1;
  for (const p of list) for (const q of list) { const d = hav(p.c, q.c); if (d > far) { far = d; start = p; } }
  const rest = list.filter(s => s !== start), path = [start];
  let cur = start;
  while (rest.length) {
    let idx = 0, best = Infinity;
    rest.forEach((s, i) => { const d = hav(cur.c, s.c); if (d < best) { best = d; idx = i; } });
    cur = rest.splice(idx, 1)[0];
    path.push(cur);
  }
  return path;
}

/* ══ 3 · KHAI BÁO TUYẾN ═══════════════════════════════════════════════════
   `names` phải khớp CHÍNH XÁC thẻ name của way trong OSM. Nếu một tuyến bỗng
   mất hình học, gần như chắc chắn là người dùng OSM đã đổi tên — tra lại bằng:
     node tools/build-geo.mjs --dry   rồi xem cảnh báo "0 điểm".            */
const LINE_DEFS = [
  { id:'m1',   names:['Đường sắt đô thị số 1 Thành phố Hồ Chí Minh (Phân đoạn Bến Thành - Suối Tiên)','Tuyến metro số 1 Bến Thành - Suối Tiên'] },
  { id:'m2',   names:['Đường sắt đô thị số 2 Thành phố Hồ Chí Minh (Phân đoạn Bến Thành -Tham Lương)','Tuyến số 2 (Phân đoạn Bến Thành - Tham Lương)','Tuyến Metro Số 2 (Bến Thành - Tham Lương) - Đang xây dựng'] },
  { id:'m2tt', names:['Tuyến số 2 (Phân đoạn Bến Thành - Thủ Thiêm)'] },
  { id:'bd2',  names:['Tuyến số 2 (Thủ Dầu Một - Thành phố Hồ Chí Minh)'] },
  { id:'bd1',  names:['Tuyến Metro Thành phố mới Bình Dương – Suối Tiên'] },
  { id:'m6',   names:['Tuyến số 6 (Phân đoạn Phú Hữu - Sân bay Tân Sơn Nhất)'] },
  { id:'m3',   names:['Tuyến số 3 (Hiệp Bình Phước - An Hạ)'] },
  { id:'m7',   names:['Tuyến số 7 (Tân Kiên - Vinhomes Grand Park)'] },
  { id:'tt',   names:['Đường sắt Thủ Thiêm-Long Thành'] },
  { id:'cg',   names:['Đường sắt đô thị Bến Thành-Cần Giờ','Đường sắt đô thị Bến Thành-Cầu Giờ'] }
];

/* OSM viết hoa không thống nhất — chuẩn hoá về chính tả tiếng Việt. */
const RENAME = {
  'Nhà Hát Thành Phố':'Nhà hát Thành phố', 'Khu Công Nghệ Cao':'Khu Công nghệ cao',
  'Bệnh Viện Quốc Tế':'Bệnh viện Quốc tế', 'Đại Lộ Vòng Cung':'Đại lộ Vòng Cung',
  'Cung Thiếu Nhi':'Cung Thiếu nhi',
  'S5':'Ga S5', 'S16':'Ga S16', 'S17':'Ga S17', 'S19':'Ga S19'
};
/* Tuyến cần đảo chiều để danh sách ga đọc từ trung tâm ra ngoại vi. */
const REVERSE = new Set(['m1', 'm2tt']);

/* ══ 4 · DỰNG DỮ LIỆU ═════════════════════════════════════════════════════ */
async function build() {
  const { planned, stations } = await fetchOsm();

  const ways = planned.elements.filter(e => e.type === 'way' && e.geometry && e.tags?.name);
  const plannedNodes = planned.elements.filter(e => e.type === 'node' && e.tags?.name);
  const liveStations = stations.elements.filter(e => e.tags?.name && e.tags.subway === 'yes');
  const nodes = [...plannedNodes, ...liveStations.filter(r => !plannedNodes.some(p => p.tags.name === r.tags.name))]
    .map(e => ({ name: e.tags.name.replace(/^Ga /, '').replace(/ \(dự kiến\)$/, ''),
                 c: [e.lat ?? e.center.lat, e.lon ?? e.center.lon] }));

  // hình học thô, đã tách một chiều và cắt khúc gập
  const raw = {};
  for (const def of LINE_DEFS) {
    const segs = ways.filter(w => def.names.includes(w.tags.name)).map(w => w.geometry.map(g => [g.lat, g.lon]));
    raw[def.id] = chain(segs).map(singleTrack).map(unfold).filter(s => {
      let len = 0; for (let i = 0; i < s.length - 1; i++) len += hav(s[i], s[i + 1]);
      return len > 300;                    // bỏ nhánh vụn, đoạn nối depot
    });
  }

  // BẪY 3 — một ga có thể thuộc nhiều tuyến; gán theo ngưỡng, không độc quyền
  const assigned = {};
  for (const node of nodes) {
    const hits = LINE_DEFS.map(d => ({ id: d.id, dist: distToShape(node.c, raw[d.id]) })).sort((a, b) => a.dist - b.dist);
    if (!hits.length || hits[0].dist > 150) continue;
    for (const h of hits) if (h.dist <= Math.max(80, hits[0].dist)) (assigned[h.id] ??= []).push(node);
  }

  const out = {};
  for (const def of LINE_DEFS) {
    const shape = raw[def.id].map(s => simplify(s)).filter(s => s.length > 1).map(s => s.map(round));
    let list = orderAlong(assigned[def.id] ?? []).map(s => ({ n: RENAME[s.name] ?? s.name, c: round(s.c) }));
    if (REVERSE.has(def.id)) list.reverse();
    let km = 0; raw[def.id].forEach(s => { for (let i = 0; i < s.length - 1; i++) km += hav(s[i], s[i + 1]); });
    out[def.id] = { km: +(km / 1000).toFixed(1), s: shape, g: list.map(x => [x.n, x.c[0], x.c[1]]) };
  }
  return out;
}

/* ══ 5 · KIỂM TRA CHẤT LƯỢNG ══════════════════════════════════════════════
   Chạy sau mỗi lần dựng. Nếu số khúc gấp tăng vọt thì thuật toán tách chiều
   đã hỏng — đừng ghi đè index.html, sửa xong hãy ghi.                     */
function audit(geo) {
  let sharp = 0, offLine = 0;
  console.log('\nTUYẾN     KM     GA   ĐOẠN  KHÚC>60°  GẤP NHẤT');
  for (const [id, d] of Object.entries(geo)) {
    let s = 0, maxTurn = 0;
    for (const p of d.s) for (let i = 0; i < p.length - 2; i++) {
      const diff = Math.abs(bearing(p[i], p[i + 1]) - bearing(p[i + 1], p[i + 2]));
      const t = Math.min(diff, 360 - diff);
      if (t > 60) s++;
      if (t > maxTurn) maxTurn = t;
    }
    sharp += s;
    for (const [, lat, lng] of d.g) if (distToShape([lat, lng], d.s) > 200) offLine++;
    console.log(`${id.padEnd(8)} ${String(d.km).padStart(5)} ${String(d.g.length).padStart(4)} ${String(d.s.length).padStart(5)} ${String(s).padStart(8)} ${maxTurn.toFixed(0).padStart(8)}°`);
  }
  const total = Object.values(geo).reduce((a, d) => a + d.g.length, 0);
  console.log(`\nTổng ${total} ga · ${sharp} khúc gấp >60° · ${offLine} ga lệch khỏi tuyến >200 m`);
  console.log('Mốc đối chiếu: tuyến 1 phải ra ~19,6 km / 14 ga · toàn mạng ~4 khúc gấp · 0 ga lệch.');
  if (offLine) console.error('CẢNH BÁO: có ga không nằm trên hình tuyến — kiểm tra lại trước khi ghi file.');
  return { total, sharp, offLine };
}

/* ══ 6 · GHI VÀO index.html ═══════════════════════════════════════════════ */
function writeIntoApp(geo) {
  const html = readFileSync(TARGET, 'utf8');
  const start = html.indexOf('const GEO = ');
  if (start < 0) throw new Error('Không tìm thấy dòng "const GEO = " trong index.html');
  const end = html.indexOf('\n', start);
  const block = `const GEO = ${JSON.stringify(geo)};`;
  writeFileSync(TARGET, html.slice(0, start) + block + html.slice(end), 'utf8');
  console.log(`\nĐã ghi ${block.length} ký tự vào ${TARGET}`);
}

/* ══ CHẠY ═════════════════════════════════════════════════════════════════ */
const geo = await build();
const report = audit(geo);
if (DRY) console.log('\n--dry: không ghi file.');
else if (report.offLine) console.error('\nBỏ qua bước ghi file vì có ga lệch khỏi tuyến.');
else writeIntoApp(geo);
