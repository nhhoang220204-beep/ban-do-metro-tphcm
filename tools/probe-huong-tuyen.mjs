#!/usr/bin/env node
/**
 * probe-huong-tuyen.mjs — thử nghiệm: có suy ra được "tuyến metro đi dọc đường
 * nào" từ dữ liệu thật hay không.
 *
 * Cách làm: lấy hình học tuyến metro (đã kiểm định từ OSM), rải điểm mẫu dọc
 * tuyến, rồi tìm con đường có tên gần nhất mỗi điểm. Gom các điểm liên tiếp
 * cùng một tên đường lại thành một đoạn.
 *
 * Đây là SUY RA TỪ DỮ LIỆU, không phải viết theo trí nhớ. Chỗ nào không có
 * đường nào đủ gần thì ghi rõ là không xác định được, không đoán.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { overpass, hav, CACHE, log } from './lib/osm.mjs';

const geo = JSON.parse(readFileSync(join(CACHE, 'geo-verified.json'), 'utf8'));
const tuyen = process.argv[2] ?? 'm1';
const d = geo[tuyen];
if (!d) { log(`Không có tuyến "${tuyen}". Có: ${Object.keys(geo).join(' ')}`); process.exit(1); }

/* Lấy đoạn dài nhất của tuyến làm mẫu thử. */
const shape = d.s.slice().sort((a, b) => b.length - a.length)[0];
log(`Tuyến ${tuyen}: ${d.s.length} đoạn, đoạn dài nhất ${shape.length} điểm`);

/* Rải điểm mẫu cách nhau khoảng 150 m dọc tuyến. */
const BUOC_M = 150;
const mau = [];
let don = 0;
for (let i = 0; i < shape.length - 1; i++) {
  const a = shape[i], b = shape[i + 1];
  const len = hav(a, b);
  const n = Math.max(1, Math.round(len / BUOC_M));
  for (let k = 0; k < n; k++) {
    const t = k / n;
    mau.push({ c: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], km: (don + len * t) / 1000 });
  }
  don += len;
}
log(`  ${mau.length} điểm mẫu · tổng ${(don / 1000).toFixed(1)} km`);

/* Overpass `around` nhận cả một chuỗi toạ độ — lấy mọi đường có tên trong
   hành lang 60 m quanh tuyến. Chỉ gửi tối đa 300 điểm để thân truy vấn không
   quá dài. */
const buoc = Math.max(1, Math.ceil(mau.length / 300));
const chuoi = mau.filter((_, i) => i % buoc === 0)
                 .map(m => `${m.c[0].toFixed(5)},${m.c[1].toFixed(5)}`).join(',');

const q = `[out:json][timeout:180];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"]["name"]
  (around:60,${chuoi});
out geom tags;`;

log(`  truy vấn hành lang quanh ${chuoi.split(',').length / 2} điểm…`);
const json = await overpass(q, { label: `huong-tuyen-${tuyen}`, toiThieu: 1 });
log(`  ${json.elements.length} đoạn đường có tên trong hành lang`);

/* Với mỗi điểm mẫu, tìm đường gần nhất. */
const duong = json.elements
  .filter(e => e.geometry?.length > 1)
  .map(e => ({ ten: e.tags.name, pts: e.geometry.map(g => [g.lat, g.lon]) }));

function ganNhat(c) {
  let best = null, bestD = Infinity;
  for (const w of duong) {
    for (let i = 0; i < w.pts.length - 1; i++) {
      const a = w.pts[i], b = w.pts[i + 1];
      const dx = b[1] - a[1], dy = b[0] - a[0];
      let t = 0;
      if (dx || dy) t = Math.max(0, Math.min(1, ((c[1] - a[1]) * dx + (c[0] - a[0]) * dy) / (dx * dx + dy * dy)));
      const dist = hav(c, [a[0] + dy * t, a[1] + dx * t]);
      if (dist < bestD) { bestD = dist; best = w.ten; }
    }
  }
  return bestD <= 70 ? { ten: best, d: bestD } : null;
}

/* Gom các điểm liên tiếp cùng tên đường thành đoạn. */
const doan = [];
for (const m of mau) {
  const g = ganNhat(m.c);
  const ten = g?.ten ?? null;
  const cuoi = doan.at(-1);
  if (cuoi && cuoi.ten === ten) { cuoi.kmCuoi = m.km; cuoi.soDiem++; }
  else doan.push({ ten, kmDau: m.km, kmCuoi: m.km, soDiem: 1 });
}

/* Bỏ đoạn quá ngắn (dưới 300 m) — thường là lúc tuyến cắt ngang một con đường
   khác chứ không phải chạy dọc nó. */
const loc = doan.filter(x => (x.kmCuoi - x.kmDau) * 1000 >= 300 || x.soDiem >= 3);

log(`\n${'KM ĐẦU'.padStart(7)}  ${'KM CUỐI'.padStart(7)}  ${'DÀI'.padStart(6)}  ĐƯỜNG`);
for (const x of loc) {
  const dai = ((x.kmCuoi - x.kmDau)).toFixed(2);
  log(`${x.kmDau.toFixed(2).padStart(7)}  ${x.kmCuoi.toFixed(2).padStart(7)}  ${dai.padStart(6)}  ${x.ten ?? '— không có đường nào trong 70 m —'}`);
}
log(`\n${doan.length} đoạn thô → ${loc.length} đoạn sau khi bỏ đoạn ngắn`);
const khongXacDinh = loc.filter(x => !x.ten).reduce((a, x) => a + (x.kmCuoi - x.kmDau), 0);
log(`Không xác định được đường: ${khongXacDinh.toFixed(1)} km / ${(don / 1000).toFixed(1)} km`);
