#!/usr/bin/env node
/**
 * estimate-ring-gaps-tam.mjs — nối các khúc hở NGẮN giữa các đoạn vành đai
 * bằng đoạn thẳng tạm, để 3 vòng vành đai khép lại trong CHẾ ĐỘ BIÊN TẬP GIS.
 *
 * Chỉ nối khúc hở ≤ NGUONG_M — thường là chỗ giao lộ/nút giao mà OSM vẽ rời
 * thành hai way. Khúc hở lớn hơn (ví dụ Vành đai 4 có hai khúc 27km và 41km,
 * xuyên nhiều tỉnh) TUYỆT ĐỐI không vẽ thẳng — đó là bịa cả chục km đường,
 * không phải "số hoá sơ bộ". Khúc hở lớn bị bỏ qua, in ra để Hoàng tự xử lý
 * (tra quy hoạch chính thức hoặc tự vẽ tay bằng chế độ biên tập).
 *
 * Mỗi đoạn nối mang trạng thái "tam-so-hoa" — khác hẳn 4 trạng thái chính thức,
 * để không ai nhầm đây là dữ liệu đã kiểm.
 *
 * Idempotent: xoá các đoạn "tam-so-hoa" cũ trước khi sinh lại.
 *
 * Chạy: node tools/estimate-ring-gaps-tam.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dRR = join(ROOT, 'data', 'ring_roads.json');

const NGUONG_M = 6000; // khúc hở trên ngưỡng này KHÔNG nối tự động

const RAD = Math.PI / 180;
function hav(a, b) {
  const R = 6371000;
  const dLat = (b[0] - a[0]) * RAD, dLng = (b[1] - a[1]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const r = JSON.parse(readFileSync(dRR, 'utf8'));

/* Thêm trạng thái "tam-so-hoa" vào bảng nếu chưa có. */
if (!r.trangThai['tam-so-hoa']) {
  r.trangThai['tam-so-hoa'] = {
    nhan: 'Tạm số hoá (chế độ biên tập)',
    mau: '#eab308',
    net: 'cham',
    thuTu: 6
  };
}

let idKe = 1;
const boBoQua = [];

for (const t of r.tuyen) {
  /* Xoá đoạn tạm cũ của tuyến này trước khi sinh lại. */
  t.doan = t.doan.filter(d => d.trangThai !== 'tam-so-hoa');

  const ends = [];
  for (const d of t.doan) {
    ends.push({ seg: d.id, end: 'dau', c: d.polyline[0] });
    ends.push({ seg: d.id, end: 'cuoi', c: d.polyline.at(-1) });
  }

  const daXuLy = new Set();
  const capNoi = [];
  for (const e of ends) {
    if (daXuLy.has(e.seg + '.' + e.end)) continue;
    let best = null, bestD = Infinity;
    for (const e2 of ends) {
      if (e2.seg === e.seg) continue;
      const d = hav(e.c, e2.c);
      if (d < bestD) { bestD = d; best = e2; }
    }
    if (bestD > 300) {
      daXuLy.add(e.seg + '.' + e.end);
      daXuLy.add(best.seg + '.' + best.end);
      capNoi.push({ a: e, b: best, m: Math.round(bestD) });
    }
  }

  for (const cap of capNoi) {
    if (cap.m > NGUONG_M) {
      boBoQua.push({ tuyen: t.ten, ...cap });
      continue;
    }
    const idMoi = `${t.id}-tam${idKe++}`;
    t.doan.push({
      id: idMoi,
      tuyenId: t.id,
      tenTuyen: t.ten,
      tenDoan: `Đoạn nối tạm ${cap.a.seg} ↔ ${cap.b.seg}`,
      diemDau: null, diemCuoi: null,
      trangThai: 'tam-so-hoa',
      mau: r.trangThai['tam-so-hoa'].mau,
      daiKm: +(cap.m / 1000).toFixed(2),
      daiHoSoKm: null, tienDoPhanTram: null, ngayKhoiCong: null, duKienHoanThanh: null,
      ghiChu: 'Đoạn nối tạm do chế độ biên tập GIS sinh ra — nối thẳng hai đầu mút gần nhau ' +
              'giữa hai đoạn đã có, KHÔNG dựa trên hình học đường thật. Cần tự vẽ lại theo ' +
              'thực địa hoặc quy hoạch công bố.',
      nguonHoSo: null, tinCayHoSo: null,
      nguonHinhHoc: 'Nội suy đường thẳng — chế độ biên tập GIS',
      ngayChupOSM: null,
      polyline: [cap.a.c, cap.b.c]
    });
  }
  console.log(`✓ ${t.ten}: nối ${capNoi.filter(c => c.m <= NGUONG_M).length} khúc hở, ` +
              `bỏ qua ${capNoi.filter(c => c.m > NGUONG_M).length} khúc hở quá lớn`);
}

writeFileSync(dRR, JSON.stringify(r, null, 2) + '\n');

if (boBoQua.length) {
  console.log(`\n⚠ ${boBoQua.length} khúc hở KHÔNG được nối tự động vì quá lớn (>${NGUONG_M / 1000} km):`);
  for (const b of boBoQua) {
    console.log(`  ${b.tuyen}: ${b.a.seg}.${b.a.end} ↔ ${b.b.seg}.${b.b.end} — ${(b.m / 1000).toFixed(1)} km`);
  }
  console.log('  → Cần tra quy hoạch chính thức hoặc tự vẽ tay bằng chế độ biên tập.');
}
