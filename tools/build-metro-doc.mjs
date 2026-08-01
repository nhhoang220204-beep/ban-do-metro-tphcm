#!/usr/bin/env node
/**
 * build-metro-doc.mjs — dựng hồ sơ hình học chi tiết cho mạng metro.
 *
 * Chạy:
 *   node tools/build-metro-doc.mjs           → tất cả tuyến
 *   node tools/build-metro-doc.mjs m1 m2     → chỉ tuyến được nêu
 *   node tools/build-metro-doc.mjs --cache   → dùng lại ảnh chụp Overpass
 *
 * XUẤT RA data/metro/:
 *   alignment.geojson   hình học tuyến, EPSG:4326, FeatureCollection LineString
 *   huong-tuyen.json    tuyến đi dọc đường nào, chia đoạn kèm mốc km
 *   ga.geojson          ga đã xác minh toạ độ, EPSG:4326, Point
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CÁCH SUY RA "TUYẾN ĐI DỌC ĐƯỜNG NÀO"
 *
 * Rải điểm mẫu cách nhau 150 m dọc hình tuyến, tìm con đường CÓ TÊN gần nhất mỗi
 * điểm, rồi gom các điểm liên tiếp cùng tên thành một đoạn kèm mốc km.
 *
 * Đây là SUY RA TỪ DỮ LIỆU ĐO ĐƯỢC, không phải mô tả theo trí nhớ. Điểm nào
 * không có đường nào trong 70 m thì ghi thẳng là "không xác định được" — thường
 * là đoạn cắt đồng ruộng, vượt sông, hoặc chui dưới khu dân cư không theo trục
 * đường nào.
 *
 * GIỚI HẠN PHẢI BIẾT: hình tuyến lấy từ OpenStreetMap, KHÔNG phải hồ sơ MAUR.
 * Với tuyến đang khai thác thì OSM khớp thực địa. Với tuyến quy hoạch thì OSM
 * là do người dùng vẽ lại từ bản đồ công bố — sai số có thể hàng chục mét, và
 * hướng tuyến còn thay đổi. Mọi kết quả ở đây gắn mức tin cậy tương ứng.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { overpass, hav, CACHE, DATA, log, kb } from './lib/osm.mjs';

const argv = process.argv.slice(2);
const USE_CACHE = argv.includes('--cache');
const only = new Set(argv.filter(a => !a.startsWith('--')));

const RA = join(DATA, 'metro');
mkdirSync(RA, { recursive: true });

const geo = JSON.parse(readFileSync(join(CACHE, 'geo-verified.json'), 'utf8'));
const metro = JSON.parse(readFileSync(join(DATA, 'metro.json'), 'utf8'));
const stations = JSON.parse(readFileSync(join(DATA, 'stations.json'), 'utf8'));

/* ─── §1 · THAM SỐ SUY ĐOẠN ─────────────────────────────────────────────── */

const BUOC_M = 150;      // khoảng cách giữa hai điểm mẫu
const BAN_KINH_M = 70;   // xa hơn ngần này thì coi như không chạy dọc đường đó
const DOAN_TOI_THIEU_M = 300;   // ngắn hơn thì là cắt ngang, không phải chạy dọc

/* ─── §2 · TIỆN ÍCH HÌNH HỌC ────────────────────────────────────────────── */

function raiDiem(shape) {
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
  mau.push({ c: shape.at(-1), km: don / 1000 });
  return { mau, tongM: don };
}

function khoangCachToiDuong(c, w) {
  let best = Infinity;
  for (let i = 0; i < w.pts.length - 1; i++) {
    const a = w.pts[i], b = w.pts[i + 1];
    const dx = b[1] - a[1], dy = b[0] - a[0];
    let t = 0;
    if (dx || dy) t = Math.max(0, Math.min(1, ((c[1] - a[1]) * dx + (c[0] - a[0]) * dy) / (dx * dx + dy * dy)));
    const d = hav(c, [a[0] + dy * t, a[1] + dx * t]);
    if (d < best) best = d;
    if (best < 1) return best;
  }
  return best;
}

/* ─── §3 · TẢI ĐƯỜNG TRONG HÀNH LANG ────────────────────────────────────── */

async function taiDuong(id, mau) {
  /* Overpass nhận cả chuỗi toạ độ cho `around`. Giới hạn 300 điểm để thân
     truy vấn không quá dài; hành lang vẫn phủ kín vì bán kính 60 m lớn hơn
     khoảng cách giữa các điểm được gửi. */
  const buoc = Math.max(1, Math.ceil(mau.length / 300));
  const chuoi = mau.filter((_, i) => i % buoc === 0)
                   .map(m => `${m.c[0].toFixed(5)},${m.c[1].toFixed(5)}`).join(',');

  const q = `[out:json][timeout:180];
    way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"]["name"]
      (around:${BAN_KINH_M + 20},${chuoi});
    out geom tags;`;

  const { cached } = await import('./lib/osm.mjs');
  const json = await cached(`huong-tuyen-${id}`, q, USE_CACHE, 1);
  return json.elements.filter(e => e.geometry?.length > 1)
             .map(e => ({ ten: e.tags.name.trim(), pts: e.geometry.map(g => [g.lat, g.lon]) }));
}

/* ─── §4 · SUY ĐOẠN ─────────────────────────────────────────────────────── */

function suyDoan(mau, duong) {
  const tho = [];
  for (const m of mau) {
    let ten = null, gan = Infinity;
    for (const w of duong) {
      const d = khoangCachToiDuong(m.c, w);
      if (d < gan) { gan = d; ten = w.ten; }
    }
    if (gan > BAN_KINH_M) ten = null;

    const cuoi = tho.at(-1);
    if (cuoi && cuoi.duong === ten) { cuoi.kmCuoi = m.km; cuoi.soDiem++; }
    else tho.push({ duong: ten, kmDau: m.km, kmCuoi: m.km, soDiem: 1, lech: Math.round(gan) });
  }

  return tho
    .filter(x => (x.kmCuoi - x.kmDau) * 1000 >= DOAN_TOI_THIEU_M)
    .map((x, i) => ({
      thuTu: i + 1,
      duong: x.duong,
      kmDau: +x.kmDau.toFixed(2),
      kmCuoi: +x.kmCuoi.toFixed(2),
      daiKm: +(x.kmCuoi - x.kmDau).toFixed(2),
      lechTrungBinhM: x.duong ? x.lech : null,
      ghiChu: x.duong ? null : 'Không có đường có tên nào trong 70 m — có thể là đoạn vượt sông, cắt đồng, hoặc đi dưới khu dân cư'
    }));
}

/* ─── §5 · CHẠY ─────────────────────────────────────────────────────────── */

const ketQua = {};
const features = [];

for (const line of metro.lines) {
  if (only.size && !only.has(line.id)) continue;
  const g = geo[line.id];
  if (!g?.s?.length) { log(`▶ ${line.id}: không có hình học, bỏ qua`); continue; }

  log(`\n▶ ${line.id} · ${line.name} — ${line.route}`);

  const doanTuyen = [];
  for (const [k, shape] of g.s.entries()) {
    const { mau, tongM } = raiDiem(shape);
    if (tongM < 500) continue;           // mẩu vụn, không đáng phân tích

    let duong = [];
    try { duong = await taiDuong(`${line.id}-${k}`, mau); }
    catch (err) { log(`  ! đoạn ${k}: ${err.message}`); }

    const doan = suyDoan(mau, duong);
    const khongRo = doan.filter(x => !x.duong).reduce((a, x) => a + x.daiKm, 0);
    log(`  đoạn ${k}: ${(tongM / 1000).toFixed(1)} km · ${duong.length} đường trong hành lang · ` +
        `${doan.length} phân đoạn · ${khongRo.toFixed(1)} km không xác định`);

    doanTuyen.push({ maDoan: k, daiKm: +(tongM / 1000).toFixed(2), phanDoan: doan });

    /* GeoJSON: [kinh độ, vĩ độ] theo đúng thứ tự của chuẩn. */
    features.push({
      type: 'Feature',
      properties: {
        line_id: line.id, ten: line.name, huong: line.route,
        trang_thai: line.status, doan: k, dai_km: +(tongM / 1000).toFixed(2),
        nguon: 'OpenStreetMap · Overpass API', ngay_chup: '2026-07-29'
      },
      geometry: { type: 'LineString', coordinates: shape.map(([lat, lng]) => [lng, lat]) }
    });
  }

  ketQua[line.id] = {
    ten: line.name, huongTuyen: line.route, trangThai: line.status,
    kmTheoHinhHoc: g.km, soDoan: doanTuyen.length, doan: doanTuyen
  };
}

/* ─── §6 · GHI ──────────────────────────────────────────────────────────── */

const ghi = (ten, obj) => {
  const s = JSON.stringify(obj, null, 1);
  writeFileSync(join(RA, ten), s + '\n', 'utf8');
  log(`▸ data/metro/${ten} · ${kb(s.length)}`);
};

ghi('alignment.geojson', { type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'EPSG:4326' } }, features });

ghi('huong-tuyen.json', {
  meta: {
    nguon_hinh_hoc: 'OpenStreetMap · Overpass API · ảnh chụp 29/07/2026',
    phuong_phap: `Rải điểm mẫu cách ${BUOC_M} m dọc hình tuyến, tìm đường có tên gần nhất ` +
                 `trong bán kính ${BAN_KINH_M} m, gom điểm liên tiếp cùng tên thành đoạn. ` +
                 `Bỏ đoạn ngắn hơn ${DOAN_TOI_THIEU_M} m vì đó là cắt ngang chứ không phải chạy dọc.`,
    canh_bao: 'Hình tuyến từ OpenStreetMap, KHÔNG phải hồ sơ MAUR. Tuyến quy hoạch có sai số ' +
              'hàng chục mét và hướng tuyến còn thay đổi. Không dùng thay bản vẽ thiết kế.',
    he_toa_do: 'EPSG:4326 (WGS84)'
  },
  tuyen: ketQua
});

ghi('ga.geojson', {
  type: 'FeatureCollection',
  crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  features: stations.stations.map(s => ({
    type: 'Feature',
    properties: {
      ga_id: s.id, ten: s.name, tuyen: s.lines.join(','),
      trung_chuyen: s.interchange, so_tuyen: s.lines.length,
      nguon: 'OpenStreetMap · Overpass API', ngay_chup: '2026-07-29'
    },
    geometry: { type: 'Point', coordinates: [s.c[1], s.c[0]] }
  }))
});

log('\nXong.');
