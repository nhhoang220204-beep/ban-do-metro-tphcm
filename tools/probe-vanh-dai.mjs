#!/usr/bin/env node
/**
 * probe-vanh-dai.mjs — dò xem OpenStreetMap có hình học cho từng đoạn vành đai
 * hay không, TRƯỚC khi dựng dữ liệu.
 *
 * Chạy trước build-ring-roads.mjs. Đoạn nào OSM không có thì đánh
 * "chưa xác minh" chứ không vẽ bừa.
 */

import { overpass, BBOX, hav, log } from './lib/osm.mjs';

/* Tên way cần dò, gom theo tuyến. Lấy cả tên trục đã hoàn thành lẫn tên
   "dự án" của đoạn chưa xây — OSM đặt tên hai kiểu khác nhau. */
const CAN_DO = {
  'Vành đai 2 — đoạn đã hoàn thành': [
    'Phạm Văn Đồng', 'Võ Chí Công', 'Nguyễn Văn Linh',
    'Đường Vành Đai Trong', 'Vành Đai Trong'
  ],
  'Vành đai 2 — đoạn chưa xây': [
    'Dự án đường Vành đai 2'
  ],
  'Vành đai 3': [
    'Đường vành đai 3 Thành phố Hồ Chí Minh',
    'Đường song hành Vành đai 3 Thành phố Hồ Chí Minh',
    'Cầu cạn Đường vành đai 3 Thành phố Hồ Chí Minh',
    'Đường vành đai 3 Thành phố Hồ Chí Minh giai đoạn 2'
  ],
  'Vành đai 4': [
    'Đường Vành đai 4 Thành phố Hồ Chí Minh',
    'Đường cao tốc Vành Đai 4 Thành phố Hồ Chí Minh',
    'Đường Vành Đai 4',
    'Đường cao tốc Vành Đai 4 TPHCM'
  ]
};

const tenTatCa = [...new Set(Object.values(CAN_DO).flat())];
const dieuKien = tenTatCa.map(t => `way["highway"]["name"="${t}"](${BBOX});`).join('\n  ');

const json = await overpass(
  `[out:json][timeout:300];\n(\n  ${dieuKien}\n);\nout geom tags;`,
  { label: 'vanh-dai', toiThieu: 1 }
);

/* Gom theo tên, đo tổng chiều dài và đếm số way. */
const theoTen = new Map();
for (const w of json.elements) {
  if (!w.geometry || w.geometry.length < 2) continue;
  const ten = w.tags.name;
  let m = 0;
  for (let i = 0; i < w.geometry.length - 1; i++) {
    m += hav([w.geometry[i].lat, w.geometry[i].lon],
             [w.geometry[i + 1].lat, w.geometry[i + 1].lon]);
  }
  if (!theoTen.has(ten)) theoTen.set(ten, { soWay: 0, m: 0, cap: new Set(), trangThaiOSM: new Set() });
  const g = theoTen.get(ten);
  g.soWay++; g.m += m;
  g.cap.add(w.tags.highway);
  /* OSM ghi đoạn đang xây bằng highway=construction hoặc proposed. */
  if (w.tags.construction) g.trangThaiOSM.add('construction:' + w.tags.construction);
  if (w.tags.proposed) g.trangThaiOSM.add('proposed:' + w.tags.proposed);
  if (w.tags.lanes) g.trangThaiOSM.add('lanes=' + w.tags.lanes);
}

for (const [nhom, tens] of Object.entries(CAN_DO)) {
  log(`\n═══ ${nhom}`);
  for (const t of tens) {
    const g = theoTen.get(t);
    if (!g) { log(`   ✗ KHÔNG CÓ TRONG OSM: "${t}"`); continue; }
    log(`   ✓ ${(g.m / 1000).toFixed(1).padStart(7)} km · ${String(g.soWay).padStart(4)} way · ` +
        `cấp: ${[...g.cap].join(',')} ${g.trangThaiOSM.size ? '· ' + [...g.trangThaiOSM].slice(0, 3).join(' ') : ''}`);
    log(`     "${t}"`);
  }
}

log(`\nTổng: ${json.elements.length} way trong ${tenTatCa.length} tên đã dò`);
