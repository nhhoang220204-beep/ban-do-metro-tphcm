#!/usr/bin/env node
/**
 * estimate-stations-tam.mjs — sinh vị trí TẠM cho các ga chưa xác minh của
 * Metro số 2 Thủ Dầu Một (bd2) và Metro Bình Dương – Suối Tiên (bd1).
 *
 * Đây là dữ liệu cho CHẾ ĐỘ BIÊN TẬP GIS (xem js/features/gis-editor.js), không
 * phải dữ liệu công bố. Vị trí nội suy đều theo chiều dài hình học tuyến đã có
 * từ OpenStreetMap (data/metro.json) — không phải vị trí ga thật, chỉ là điểm
 * khởi đầu để Hoàng tự kéo vào đúng chỗ trong app. Mọi ga sinh ra ở đây đều
 * mang "tamThoi: true" và không bao giờ được coi là đã xác minh.
 *
 * Idempotent: chạy lại sẽ xoá các ga "tamThoi" cũ của bd1/bd2 rồi sinh lại,
 * KHÔNG đụng tới ga đã xác minh (kể cả ga1..ga23 hiện có).
 *
 * Chạy: node tools/estimate-stations-tam.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dST = join(ROOT, 'data', 'stations.json');
const dM = join(ROOT, 'data', 'metro.json');

const RAD = Math.PI / 180;
function hav(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Điểm nằm ở tỷ lệ t (0..1) theo chiều dài dọc một chuỗi [lat,lng]. */
function diemTheoTiLe(chuoi, t) {
  const doDai = [];
  let tong = 0;
  for (let i = 0; i < chuoi.length - 1; i++) {
    tong += hav(chuoi[i], chuoi[i + 1]);
    doDai.push(tong);
  }
  const dich = t * tong;
  for (let i = 0; i < doDai.length; i++) {
    if (dich <= doDai[i]) {
      const truoc = i === 0 ? 0 : doDai[i - 1];
      const doanTi = (dich - truoc) / (doDai[i] - truoc || 1);
      const a = chuoi[i], b = chuoi[i + 1];
      return [a[0] + (b[0] - a[0]) * doanTi, a[1] + (b[1] - a[1]) * doanTi];
    }
  }
  return chuoi.at(-1);
}

const stations = JSON.parse(readFileSync(dST, 'utf8'));
const metro = JSON.parse(readFileSync(dM, 'utf8'));

/* Bỏ các ga tamThoi cũ của bd1/bd2 trước khi sinh lại — tránh chạy hai lần
   thành trùng ga. Ga đã xác minh (ga22 S5, ga23 Hiệp Bình Phước) không đụng. */
stations.stations = stations.stations.filter(s => !(s.tamThoi && s.lines.some(l => l === 'bd1' || l === 'bd2')));

const KHAI_BAO = [
  { id: 'bd2', docStations: 24, tienTo: 'bd2', tenTuyen: 'Metro số 2 Thủ Dầu Một' },
  { id: 'bd1', docStations: 19, tienTo: 'bd1', tenTuyen: 'Metro Bình Dương – Suối Tiên' }
];

let idKe = 100; // dải id riêng cho ga tạm, không trùng ga1..ga40 hiện có

for (const cfg of KHAI_BAO) {
  const line = metro.lines.find(l => l.id === cfg.id);
  if (!line?.shape?.[0]?.length) { console.log(`✗ Không có hình học cho ${cfg.id}`); continue; }
  const chuoi = line.shape[0];
  const n = cfg.docStations;

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const c = diemTheoTiLe(chuoi, t);

    /* bd2: 2 đầu mút đã là ga thật (S5 và Hiệp Bình Phước) — giữ nguyên, không
       sinh ga tạm đè lên. */
    if (cfg.id === 'bd2' && (i === 0 || i === n - 1)) continue;

    stations.stations.push({
      id: `gatam${idKe++}`,
      name: `Ga tạm ${i + 1}/${n} · ${cfg.tenTuyen}`,
      slug: '',
      c: [+c[0].toFixed(5), +c[1].toFixed(5)],
      lines: [cfg.id],
      interchange: false,
      tamThoi: true,
      nguon: 'Ước lượng đều theo chiều dài hình học tuyến (OpenStreetMap) — CHƯA xác minh vị trí thật'
    });
  }
  console.log(`✓ ${cfg.tenTuyen}: sinh ${cfg.id === 'bd2' ? n - 2 : n} ga tạm`);
}

writeFileSync(dST, JSON.stringify(stations, null, 2) + '\n');
console.log(`\nTổng số ga trong stations.json: ${stations.stations.length}`);
