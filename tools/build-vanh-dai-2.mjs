/**
 * build-vanh-dai-2.mjs — dựng lại RIÊNG Vành đai 2 theo mô hình sơ đồ vòng
 * (8 mốc nút giao, hai trạng thái: đã hoàn thiện / chưa hoàn thiện).
 *
 * VÌ SAO TÁCH RA KHỎI build-ring-roads.mjs:
 * build-ring-roads.mjs ghi đè TOÀN BỘ data/ring_roads.json, tức là sẽ xoá mất
 * hình học Vành đai 3 đã chỉnh tay trong Chế độ biên tập GIS. Công cụ này chỉ
 * dựng vd2 rồi THAY ĐÚNG phần tử vd2 trong file, giữ nguyên vd3 và vd4.
 *
 * NGUYÊN TẮC GIỮ NGUYÊN (QĐ-1, QĐ-2):
 * - Hình học lấy từ OpenStreetMap qua Overpass, KHÔNG tự vẽ theo sơ đồ.
 *   Sơ đồ chỉ dùng để biết tuyến đi qua đường nào và đoạn nào đã/chưa xong.
 * - Đoạn nào OSM không có thì để thiếu, không nội suy cho kín vòng.
 *
 * VÌ SAO THÊM QUỐC LỘ 1 VÀO DANH SÁCH TÊN:
 * Bản dựng trước chỉ đo được 50,96/64 km hồ sơ (thiếu ~20%) vì cung phía tây
 * của Vành đai 2 đi TRÙNG Quốc lộ 1 và trong OSM mang tên "Quốc lộ 1", không
 * mang tên vành đai. Sơ đồ tham chiếu ghi rõ cung tây là Quốc lộ 1A.
 *
 * Chạy:  node tools/build-vanh-dai-2.mjs [--cache]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  cached, log, hav, chain, simplify, round, lengthOf, motChieu, boKhucGap, DATA
} from './lib/osm.mjs';

const USE_CACHE = process.argv.slice(2).includes('--cache');

/* ─── §1 · HÀNH LANG TUYẾN ──────────────────────────────────────────────── */

const BBOX_VD2 = '10.63,106.56,10.95,106.85';

/* Tên đường trong OSM tạo thành vòng Vành đai 2, theo đúng sơ đồ tham chiếu.
   Vành đai 2 hầu như không mang tên "Vành đai 2" trong OSM mà mang tên đường
   thật, nên phải liệt kê từng tên. */
const OSM_TEN = [
  'Dự án đường Vành đai 2',   // các đoạn chưa khép kín, OSM gắn construction
  'Đường Vành Đai 2',
  'Phạm Văn Đồng',            // cung bắc — Gò Dưa → Bình Thái
  'Võ Chí Công',              // cung đông — Phú Hữu → Phú Mỹ
  'Đồng Văn Cống',
  'Nguyễn Văn Linh',          // cung nam
  'Quốc lộ 1',                // cung tây — Gò Dưa → Ngã ba Tân Tạo (trùng QL1A)
  'Quốc lộ 1A',
  'Đường Vành Đai Trong'
];

/* Cầu Phú Mỹ nằm trên trục Võ Chí Công nhưng OSM tách tên riêng. */
const OSM_TEN_PHU = ['Cầu Phú Mỹ', 'Cầu Phú Hữu'];

/* ─── §2 · MỐC NÚT GIAO THEO SƠ ĐỒ ──────────────────────────────────────── */

/* Toạ độ mốc chỉ dùng để ĐẶT TÊN đoạn (khớp đoạn OSM gần mốc nào nhất),
   KHÔNG dùng để vẽ. Lấy từ nút giao có thật trên bản đồ nền. */
const MOC = {
  goDua:      { ten: 'Cầu vượt Gò Dưa',      toaDo: [10.86180, 106.72860] },
  phamVanDong:{ ten: 'Phạm Văn Đồng',        toaDo: [10.83310, 106.75610] },
  binhThai:   { ten: 'Nút giao Bình Thái',   toaDo: [10.82060, 106.76680] },
  phuHuu:     { ten: 'Cầu Phú Hữu',          toaDo: [10.79630, 106.77700] },
  phuMy:      { ten: 'Cầu Phú Mỹ',           toaDo: [10.74100, 106.75300] },
  nguyenVanLinh: { ten: 'Nguyễn Văn Linh',   toaDo: [10.72900, 106.70200] },
  tanTao:     { ten: 'Ngã ba Tân Tạo',       toaDo: [10.75200, 106.59600] },
  ql1a:       { ten: 'Quốc lộ 1A',           toaDo: [10.82000, 106.62000] }
};

/* ─── §3 · TRẠNG THÁI ───────────────────────────────────────────────────── */

/* Sơ đồ tham chiếu chỉ chia hai mức. Giữ đúng hai mức đó cho Vành đai 2,
   nhưng vẫn ghi trạng thái chi tiết theo thẻ OSM vào `trangThaiOSM` của từng
   đoạn để không mất thông tin (đang thi công / mới quy hoạch). */
const TT_XONG  = 'hoan-thanh';
const TT_CHUA  = 'chua-hoan-thien';

function tuOSM(tags) {
  const h = tags.highway;
  if (h === 'construction') return 'dang-thi-cong';
  if (h === 'proposed') return 'quy-hoach';
  if (['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential'].includes(h)
      || h?.endsWith('_link')) return 'hoan-thanh';
  return 'chua-xac-minh';
}
const daXong = ttOSM => ttOSM === 'hoan-thanh';

/* ─── §4 · HỒ SƠ 4 ĐOẠN CHƯA HOÀN THIỆN ─────────────────────────────────── */

/* Bốn đoạn hở đúng như sơ đồ: ba đoạn cung đông bắc + một đoạn cung tây nam. */
const HO_SO = [
  {
    gan: [10.7963, 106.7770],
    ten: 'Đoạn 1: Cầu Phú Hữu – nút giao Bình Thái',
    diemDau: MOC.phuHuu.ten, diemCuoi: MOC.binhThai.ten,
    daiHoSoKm: 3.6, ngayKhoiCong: '2025-11', duKienHoanThanh: '2027-04-30',
    nguon: 'Báo Người Lao Động / VnEconomy 11–12/2025 dẫn Ban Giao thông TP.HCM', tinCay: 3
  },
  {
    gan: [10.8331, 106.7561],
    ten: 'Đoạn 2: Nút giao Bình Thái – đường Phạm Văn Đồng',
    diemDau: MOC.binhThai.ten, diemCuoi: MOC.phamVanDong.ten,
    daiHoSoKm: 2.44, ngayKhoiCong: '2025-11', duKienHoanThanh: '2027-04-30',
    nguon: 'Báo Người Lao Động / VnEconomy 11–12/2025 dẫn Ban Giao thông TP.HCM', tinCay: 3
  },
  {
    gan: [10.8618, 106.7286],
    ten: 'Đoạn 3: Đường Phạm Văn Đồng – cầu vượt Gò Dưa',
    diemDau: MOC.phamVanDong.ten, diemCuoi: MOC.goDua.ten,
    daiHoSoKm: null, ngayKhoiCong: '2025-12', duKienHoanThanh: null,
    ghiChu: 'Đoạn khởi công lại sau nhiều năm dừng thi công.',
    nguon: 'Báo Người Lao Động 11/2025', tinCay: 3
  },
  {
    gan: [10.7520, 106.5960],
    ten: 'Đoạn 4: Ngã ba Tân Tạo – đường Nguyễn Văn Linh',
    diemDau: MOC.tanTao.ten, diemCuoi: MOC.nguyenVanLinh.ten,
    daiHoSoKm: 5.3, ngayKhoiCong: null, duKienHoanThanh: null,
    ghiChu: 'Đoạn cung tây nam, chưa khép kín theo sơ đồ tham chiếu.',
    nguon: 'Sơ đồ Vành đai 2 TP.HCM (mô hình tham chiếu Hoàng cung cấp)', tinCay: 2
  }
];

/* ─── §5 · TẢI VÀ DỰNG ──────────────────────────────────────────────────── */

const ten = [...OSM_TEN, ...OSM_TEN_PHU];
const q = `[out:json][timeout:240];
(${ten.map(t => `way["highway"]["name"="${t}"](${BBOX_VD2});`).join('')});
out geom tags;`;

log('▶ Vành đai 2 — tải hình học từ OpenStreetMap');
const json = await cached('vanh-dai-vd2-v2', q, USE_CACHE, 1);

const ways = json.elements.filter(w =>
  w.type === 'way' && w.geometry?.length > 1 && ten.includes(w.tags?.name));
log(`  ${ways.length} way trong hành lang`);

/* Gom theo trạng thái OSM rồi mới nối — nối trước sẽ trộn hai trạng thái. */
const theoTT = new Map();
for (const w of ways) {
  const tt = tuOSM(w.tags);
  if (!theoTT.has(tt)) theoTT.set(tt, []);
  theoTT.get(tt).push(w.geometry.map(g => [g.lat, g.lon]));
}

const tho = [];
for (const [tt, segs] of theoTT) {
  for (const c of chain(segs, 120)) {
    /* BẮT BUỘC: OSM vẽ đường đôi thành hai way, chain() nối ở nút giao thành
       chuỗi đi–về làm chiều dài gấp đôi. */
    const chuoi = boKhucGap(motChieu(c));
    const m = lengthOf(chuoi);
    if (m < 400) continue;
    tho.push({ ttOSM: tt, m, shape: simplify(chuoi, 20).map(round) });
  }
}
tho.sort((a, b) => b.m - a.m);
log(`  ${tho.length} đoạn sau khi nối`);

/* Gắn hồ sơ cho các đoạn CHƯA hoàn thiện, khớp theo điểm gần mốc. */
const daDung = new Set();
const doan = tho.map((d, i) => {
  const xong = daXong(d.ttOSM);
  let khop = null;
  if (!xong) {
    for (const [k, h] of HO_SO.entries()) {
      if (daDung.has(k)) continue;
      const gan = Math.min(...d.shape.map(p => hav(p, h.gan)));
      if (gan <= 2500) { khop = h; daDung.add(k); break; }
    }
  }
  /* Đặt tên đoạn đã hoàn thiện theo hai mốc gần hai đầu mút nhất. */
  const ganNhat = p => Object.values(MOC)
    .map(m => ({ m, d: hav(p, m.toaDo) })).sort((a, b) => a.d - b.d)[0];
  const a = ganNhat(d.shape[0]), b = ganNhat(d.shape[d.shape.length - 1]);
  const tenTuMoc = a.m.ten === b.m.ten
    ? `Đoạn qua ${a.m.ten}`
    : `Đoạn ${a.m.ten} – ${b.m.ten}`;

  return {
    id: `vd2-${String(i + 1).padStart(2, '0')}`,
    tuyenId: 'vd2',
    tenTuyen: 'Vành đai 2',
    tenDoan: khop?.ten ?? `${tenTuMoc} — ${xong ? 'đã hoàn thiện' : 'chưa hoàn thiện'}`,
    diemDau: khop?.diemDau ?? a.m.ten,
    diemCuoi: khop?.diemCuoi ?? b.m.ten,
    trangThai: xong ? TT_XONG : TT_CHUA,
    trangThaiOSM: d.ttOSM,
    mau: xong ? '#0e7490' : '#dc2626',
    daiKm: +(d.m / 1000).toFixed(2),
    daiHoSoKm: khop?.daiHoSoKm ?? null,
    tienDoPhanTram: null,
    ngayKhoiCong: khop?.ngayKhoiCong ?? null,
    duKienHoanThanh: khop?.duKienHoanThanh ?? null,
    ghiChu: khop?.ghiChu ?? null,
    nguonHoSo: khop?.nguon ?? null,
    tinCayHoSo: khop?.tinCay ?? null,
    nguonHinhHoc: 'OpenStreetMap · Overpass API',
    ngayChupOSM: new Date().toISOString().slice(0, 10),
    polyline: d.shape
  };
});

const tong = doan.reduce((s, d) => s + d.daiKm, 0);
const xongKm = doan.filter(d => d.trangThai === TT_XONG).reduce((s, d) => s + d.daiKm, 0);
const chuaKm = tong - xongKm;

const tuyenVD2 = {
  id: 'vd2',
  ten: 'Vành đai 2',
  mau: '#0e7490',
  tongDaiKm: { giaTri: 64, nguon: 'Quy hoạch giao thông TP.HCM — chiều dài toàn tuyến khép kín', tinCay: 3 },
  tongDoDuocKm: +tong.toFixed(2),
  theoTrangThai: { [TT_XONG]: +xongKm.toFixed(2), [TT_CHUA]: +chuaKm.toFixed(2) },
  tyLeHoanThanh: +((xongKm / 64) * 100).toFixed(1),
  ghiChuTuyen:
    'Dựng theo sơ đồ vòng Vành đai 2 với 8 mốc nút giao (Gò Dưa · Phạm Văn Đồng · ' +
    'Bình Thái · Phú Hữu · Phú Mỹ · Nguyễn Văn Linh · Tân Tạo · Quốc lộ 1A), chia ' +
    'hai mức: đã hoàn thiện và chưa hoàn thiện. Vành đai 2 hầu như không mang tên ' +
    '"Vành đai 2" trong OpenStreetMap mà mang tên đường thật — cung tây đi trùng ' +
    'Quốc lộ 1, cung bắc là Phạm Văn Đồng, cung đông là Võ Chí Công, cung nam là ' +
    'Nguyễn Văn Linh. Mỗi đoạn giữ thêm trường trangThaiOSM cho biết OSM gắn thẻ ' +
    'đang thi công hay mới quy hoạch.',
  tienDo: null,
  canhBao:
    'Bốn đoạn chưa hoàn thiện đều phụ thuộc tiến độ bàn giao mặt bằng — mốc khởi ' +
    'công từng bị lùi nhiều lần. Trạng thái lấy theo thẻ OSM và sơ đồ tham chiếu, ' +
    'có thể trễ so với thực địa. Phải kiểm lại trước khi nói với khách.',
  nguon: 'Sơ đồ Vành đai 2 TP.HCM (mô hình tham chiếu) · Báo Người Lao Động 11/2025',
  tinCay: 3,
  soDoan: doan.length,
  doan
};

/* ─── §6 · GHÉP VÀO FILE, GIỮ NGUYÊN VD3/VD4 ────────────────────────────── */

const f = join(DATA, 'ring_roads.json');
const cu = JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''));

cu.trangThai[TT_CHUA] ??= { nhan: 'Chưa hoàn thiện', mau: '#dc2626', net: 'lien', hieuUng: true, thuTu: 2 };
cu.trangThai[TT_XONG].mau = '#0e7490';   // xanh mòng két, đúng sơ đồ tham chiếu
cu.trangThai[TT_XONG].nhan = 'Đã hoàn thiện';

cu.tuyen = [tuyenVD2, ...cu.tuyen.filter(t => t.id !== 'vd2')];
writeFileSync(f, JSON.stringify(cu, null, 2) + '\n', 'utf8');

log(`\n✓ Vành đai 2: ${doan.length} đoạn · ${tong.toFixed(2)} km ` +
    `(đã hoàn thiện ${xongKm.toFixed(2)} km, chưa ${chuaKm.toFixed(2)} km)`);
log(`  Hồ sơ khớp được ${daDung.size}/${HO_SO.length} đoạn chưa hoàn thiện`);
log(`  Đã ghi ${f} — vd3 và vd4 giữ nguyên`);
