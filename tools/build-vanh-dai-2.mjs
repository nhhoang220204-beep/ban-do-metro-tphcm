/**
 * build-vanh-dai-2.mjs — dựng lớp dữ liệu GIS Đường Vành đai 2 TP.HCM.
 *
 * ĐÂY LÀ DỮ LIỆU GIS, KHÔNG PHẢI SƠ ĐỒ MINH HOẠ.
 *
 * CÁCH DỰNG — đồ thị đường + tìm đường ngắn nhất:
 * Bản dựng trước cắt polyline theo kiểu "lấy chuỗi dài nhất của mỗi tên đường
 * rồi cắt theo chỉ số điểm gần nút". Cách đó SAI về bản chất: OSM chia một con
 * đường thành hàng trăm way rời, "chuỗi dài nhất" thường không phải khúc chạy
 * giữa hai nút cần cắt — kết quả ra 19,93/64 km và nhiều đoạn chỉ 2 điểm (tức
 * đường thẳng).
 *
 * Cách đúng, dùng ở đây:
 *   1. Gộp TẤT CẢ way trong hành lang thành MỘT đồ thị. Node dùng chung của
 *      OSM có toạ độ trùng khít nên khoá bằng chuỗi toạ độ là nối được.
 *   2. Mỗi node ghi lại thuộc những tên đường nào.
 *   3. Nút giao A×B = node có CẢ HAI tên trong tập tên → toạ độ chính xác,
 *      không ước lượng, không dò khoảng cách gần đúng.
 *   4. Đường đi giữa hai nút = Dijkstra trên đồ thị → bám tim đường thật theo
 *      đúng cấu trúc, không thể cắt góc hay nối tắt.
 *
 * VÌ SAO TÁCH KHỎI build-ring-roads.mjs:
 * công cụ đó ghi đè TOÀN BỘ ring_roads.json nên sẽ xoá hình học Vành đai 3 đã
 * chỉnh tay. File này chỉ thay đúng phần tử `vd2`, giữ nguyên vd3 và vd4.
 *
 * NGUỒN — đối chiếu nhiều nguồn, không dựa vào một nguồn:
 *   · OpenStreetMap (Overpass API) — hình học
 *   · Wikipedia tiếng Việt "Đường vành đai 2 (Thành phố Hồ Chí Minh)"
 *   · Google Maps — đối chiếu tên và vị trí nút giao
 *   · Báo chí dẫn Ban Giao thông TP.HCM (baodautu, PLO, SGT 2025–2026)
 * Tổng 64 km, đã khai thác ~50 km, còn 14 km chưa khép kín chia 4 đoạn.
 *
 * Chạy:  node tools/build-vanh-dai-2.mjs [--cache]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cached, log, hav, simplify, round, lengthOf, DATA, CACHE } from './lib/osm.mjs';

const USE_CACHE = process.argv.slice(2).includes('--cache');
const BBOX_VD2 = '10.63,106.56,10.95,106.85';
const NGAY = new Date().toISOString().slice(0, 10);

/* ─── §1 · HÀNH LANG: CHỈ NHỮNG ĐƯỜNG TẠO NÊN VÀNH ĐAI 2 ────────────────── */

/* Danh sách trắng này giữ Dijkstra không lách qua đường ngang ngõ tắt.
   Vành đai 2 hầu như không mang tên "Vành đai 2" trong OSM mà mang tên đường
   thật — cung tây đi trùng Quốc lộ 1 và chỉ nhận ra qua ref=QL.1. */
const HANH_LANG = new Set([
  'Nguyễn Văn Linh', 'Cầu Phú Mỹ', 'Võ Chí Công', 'Đồng Văn Cống', 'Cầu Phú Hữu',
  'Dự án đường Vành đai 2', 'Phạm Văn Đồng', 'Võ Nguyên Giáp', 'Xa lộ Hà Nội',
  'QL1', 'Hồ Học Lãm', 'Trịnh Quang Nghị', 'Cầu Phú Định'
]);

const TEN_TAI = ['Nguyễn Văn Linh', 'Võ Chí Công', 'Đồng Văn Cống', 'Phạm Văn Đồng',
                 'Cầu Phú Mỹ', 'Cầu Phú Hữu', 'Dự án đường Vành đai 2'];

const q = `[out:json][timeout:240];
(${TEN_TAI.map(t => `way["highway"]["name"="${t}"](${BBOX_VD2});`).join('')});
out geom tags;`;

log('▶ Vành đai 2 — nạp hình học OpenStreetMap');
const goc = await cached('vanh-dai-vd2-v2', q, USE_CACHE, 1);

const ways = [...(goc.elements ?? [])];
for (const f of ['vd2-bosung', 'vd2-nutgiao', 'vd2-taynam']) {
  const p = join(CACHE, f + '.json');
  if (existsSync(p)) ways.push(...(JSON.parse(readFileSync(p, 'utf8')).elements ?? []));
  else log(`  ! thiếu cache/${f}.json`);
}

/** Tên chuẩn hoá của một way; null nghĩa là không thuộc hành lang. */
function tenDuong(t = {}) {
  if (/^QL[. ]?1$/.test(t.ref ?? '')) return 'QL1';
  const n = (t.name ?? '').replace(/^Đường\s+/i, '').trim();
  if (/^Hẻm|^Bến |^Song Hành/i.test(n)) return null;
  if (n === 'Xa lộ Hà Nội') return 'Võ Nguyên Giáp';       // cùng một trục, OSM còn tên cũ
  return HANH_LANG.has(n) ? n : null;
}

/* ─── §2 · ĐỒ THỊ ───────────────────────────────────────────────────────── */

const K = p => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

/* Gom way theo tên đường. Đồ thị KHÔNG dựng chung cho cả hành lang: các nhánh
   rẽ ở nút giao lớn (Mỹ Thủy, Bình Thái, Gò Dưa) mang tên khác hoặc không tên
   nên bị lọc mất, làm đồ thị chung đứt đoạn. Mỗi đoạn dựng đồ thị riêng từ
   đúng những con đường nó chạy qua — trong cùng một tên đường thì các way của
   OSM nối liền nhau. */
const theoTen = new Map();
let soWay = 0;
for (const w of ways) {
  if (w.type !== 'way' || !w.geometry || w.geometry.length < 2) continue;
  const ten = tenDuong(w.tags);
  if (!ten) continue;
  soWay++;
  if (!theoTen.has(ten)) theoTen.set(ten, []);
  theoTen.get(ten).push(w.geometry.map(g => [g.lat, g.lon]));
}
log(`  ${soWay} way · ${theoTen.size} tên đường: ${[...theoTen.keys()].join(', ')}`);

/**
 * Dựng đồ thị từ danh sách tên đường.
 *
 * Nối thêm các node NẰM SÁT NHAU (≤ NOI_M) là bắt buộc: OSM vẽ đường đôi thành
 * hai way ngược chiều KHÔNG chạm nhau, và các way liền kề đôi khi lệch nhau vài
 * mét ở đầu mút. Không bắc cầu thì đồ thị đứt và Dijkstra không tìm được đường —
 * đúng lỗi làm mọi đoạn phải rơi về polyline tạm ở lần chạy trước.
 * Dùng lưới không gian để không phải so từng cặp node.
 */
const NOI_M = 70;

function dungDoThi(tens) {
  const ke = new Map(), toaDo = new Map();
  const them = (a, b, m) => { ke.get(a).push({ toi: b, m }); ke.get(b).push({ toi: a, m }); };

  for (const t of tens) for (const pts of theoTen.get(t) ?? []) {
    pts.forEach(p => { const k = K(p); toaDo.set(k, p); if (!ke.has(k)) ke.set(k, []); });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = K(pts[i]), b = K(pts[i + 1]);
      if (a !== b) them(a, b, hav(pts[i], pts[i + 1]));
    }
  }

  /* Lưới ~35 m: 0.0003° vĩ độ ≈ 33 m, kinh độ ở vĩ độ 10.8 cũng xấp xỉ vậy. */
  const O = 0.0003;
  const luoi = new Map();
  for (const [k, p] of toaDo) {
    const g = `${Math.floor(p[0] / O)},${Math.floor(p[1] / O)}`;
    if (!luoi.has(g)) luoi.set(g, []);
    luoi.get(g).push(k);
  }
  let cau = 0;
  for (const [k, p] of toaDo) {
    const gx = Math.floor(p[0] / O), gy = Math.floor(p[1] / O);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const k2 of luoi.get(`${gx + dx},${gy + dy}`) ?? []) {
        if (k2 <= k) continue;                       // mỗi cặp xét một lần
        const d = hav(p, toaDo.get(k2));
        if (d <= NOI_M) { them(k, k2, d); cau++; }
      }
    }
  }
  return { ke, toaDo, cau };
}

/** Node gần một toạ độ nhất trong đồ thị. */
function bamVao(g, diem) {
  let best = null, bd = Infinity;
  for (const [k, p] of g.toaDo) { const d = hav(p, diem); if (d < bd) { bd = d; best = k; } }
  return best ? { khoa: best, lech: bd } : null;
}

/** Dijkstra giữa hai node trong một đồ thị. Trả mảng toạ độ bám tim đường. */
function dijkstra(g, tu, den) {
  if (!g.ke.has(tu) || !g.ke.has(den)) return null;
  const d = new Map([[tu, 0]]), truoc = new Map(), xong = new Set();
  const cho = [[0, tu]];
  while (cho.length) {
    cho.sort((a, b) => a[0] - b[0]);
    const [dist, u] = cho.shift();
    if (xong.has(u)) continue;
    xong.add(u);
    if (u === den) break;
    for (const c of g.ke.get(u) ?? []) {
      if (xong.has(c.toi)) continue;
      const nd = dist + c.m;
      if (nd < (d.get(c.toi) ?? Infinity)) { d.set(c.toi, nd); truoc.set(c.toi, u); cho.push([nd, c.toi]); }
    }
  }
  if (!xong.has(den)) return null;
  const ra = [];
  for (let u = den; u; u = truoc.get(u)) { ra.push(g.toaDo.get(u)); if (u === tu) break; }
  return ra.reverse();
}

/* ─── §3 · NÚT GIAO = NODE MANG CẢ HAI TÊN ─────────────────────────────── */

/**
 * Nút giao = chỗ hai tuyến lại gần nhau nhất, xét TOÀN BỘ điểm của cả hai
 * (không chỉ chuỗi dài nhất — đó chính là lỗi làm bản trước lệch tới 19 km).
 * Sai số in ra để kiểm được: 0 m nghĩa là hai tuyến dùng chung node OSM.
 */
function nut(ten, a, b) {
  const A = (theoTen.get(a) ?? []).flat(), B = (theoTen.get(b) ?? []).flat();
  if (!A.length || !B.length) {
    log(`  ✗ ${ten}: thiếu hình học ${!A.length ? a : b}`);
    return null;
  }
  let best = { d: Infinity, p: null };
  for (const p of A) for (const q2 of B) {
    const d = hav(p, q2);
    if (d < best.d) best = { d, p };
  }
  log(`  · ${ten.padEnd(30)} [${best.p[0].toFixed(5)}, ${best.p[1].toFixed(5)}]  giao ${a} × ${b}, sai số ${Math.round(best.d)} m`);
  return { ten, toaDo: best.p, saiSo: Math.round(best.d) };
}

log('\n▶ Nút giao — giao điểm hình học thật giữa hai tuyến');
const N = {
  nvlNam:   nut('Nguyễn Văn Linh (nam)', 'Nguyễn Văn Linh', 'Trịnh Quang Nghị'),
  phuMy:    nut('Cầu Phú Mỹ',            'Cầu Phú Mỹ', 'Nguyễn Văn Linh'),
  myThuy:   nut('Nút giao Mỹ Thủy',      'Võ Chí Công', 'Đồng Văn Cống'),
  phuHuu:   nut('Cầu Phú Hữu',           'Cầu Phú Hữu', 'Võ Chí Công'),
  binhThai: nut('Nút giao Bình Thái',    'Dự án đường Vành đai 2', 'Võ Nguyên Giáp'),
  pvd:      nut('Giao Phạm Văn Đồng',    'Dự án đường Vành đai 2', 'Phạm Văn Đồng'),
  goDua:    nut('Nút giao Gò Dưa',       'QL1', 'Dự án đường Vành đai 2'),
  anLap:    nut('Nút giao An Lập',       'QL1', 'Hồ Học Lãm')
};

/* ─── §4 · ĐỊNH NGHĨA 8 ĐOẠN ────────────────────────────────────────────── */

const NGUON = 'OpenStreetMap (hình học) · Wikipedia · Google Maps · báo chí dẫn Ban Giao thông TP.HCM';

const DINH_NGHIA = [
  { id: 'vd2_001', seg: 'Nguyễn Văn Linh – Cầu Phú Mỹ', a: 'nvlNam', b: 'phuMy',
    duongOSM: ['Nguyễn Văn Linh'],
    tt: 'hoan-thanh', duong: 'Đường Nguyễn Văn Linh', tienDo: 'Đã khai thác' },
  { id: 'vd2_002', seg: 'Cầu Phú Mỹ – Nút giao Mỹ Thủy', a: 'phuMy', b: 'myThuy',
    duongOSM: ['Cầu Phú Mỹ', 'Võ Chí Công'],
    tt: 'hoan-thanh', duong: 'Cầu Phú Mỹ – Võ Chí Công', tienDo: 'Đã khai thác' },
  { id: 'vd2_003', seg: 'Nút giao Mỹ Thủy – Cầu Phú Hữu', a: 'myThuy', b: 'phuHuu',
    duongOSM: ['Võ Chí Công', 'Cầu Phú Hữu'],
    tt: 'hoan-thanh', duong: 'Đường Võ Chí Công', tienDo: 'Đã khai thác' },
  { id: 'vd2_004', seg: 'Cầu Phú Hữu – Nút giao Bình Thái', a: 'phuHuu', b: 'binhThai',
    duongOSM: ['Dự án đường Vành đai 2', 'Cầu Phú Hữu'],
    tt: 'dang-thi-cong', duong: 'Tuyến mới đang xây', daiHoSoKm: 3.5,
    ngayKhoiCong: '2025-12-19', duKienHoanThanh: '2027-12-31',
    tienDo: 'Khởi công 19/12/2025, dự kiến hoàn thành cuối 2027',
    ghiChu: 'Tổng mức đầu tư 9.328 tỷ đồng, vốn ngân sách. Phụ thuộc tiến độ bàn giao mặt bằng.' },
  { id: 'vd2_005', seg: 'Nút giao Bình Thái – Phạm Văn Đồng', a: 'binhThai', b: 'pvd',
    duongOSM: ['Dự án đường Vành đai 2'],
    tt: 'dang-thi-cong', duong: 'Tuyến mới đang xây', daiHoSoKm: 2.5,
    ngayKhoiCong: '2025-12-19', duKienHoanThanh: '2027-12-31',
    tienDo: 'Khởi công 19/12/2025, dự kiến hoàn thành cuối 2027',
    ghiChu: 'Tổng mức đầu tư 4.543 tỷ đồng, vốn ngân sách.' },
  { id: 'vd2_006', seg: 'Phạm Văn Đồng – Nút giao Gò Dưa', a: 'pvd', b: 'goDua',
    duongOSM: ['Dự án đường Vành đai 2'],
    tt: 'chuan-bi', duong: 'Tuyến mới, thi công dở dang', daiHoSoKm: 2.7,
    tienDo: 'Thi công dở dang rồi tạm dừng từ 2020, chờ tái khởi động',
    ghiChu: 'Đầu tư hình thức BT, tổng mức 2.765 tỷ đồng.' },
  { id: 'vd2_007', seg: 'Nút giao Gò Dưa – Nút giao An Lập', a: 'goDua', b: 'anLap',
    duongOSM: ['QL1'],
    tt: 'hoan-thanh', duong: 'Quốc lộ 1', tienDo: 'Đã khai thác, quy mô 6–8 làn xe',
    ghiChu: 'Cung tây đi TRÙNG Quốc lộ 1. Trong OpenStreetMap chỉ nhận ra qua ref=QL.1, không mang tên vành đai.' },
  { id: 'vd2_008', seg: 'Nút giao An Lập – Nguyễn Văn Linh', a: 'anLap', b: 'nvlNam',
    duongOSM: ['Hồ Học Lãm', 'Trịnh Quang Nghị', 'Cầu Phú Định', 'Nguyễn Văn Linh'],
    tt: 'quy-hoach', duong: 'Hồ Học Lãm – Trịnh Quang Nghị – cầu Phú Định', daiHoSoKm: 5.3,
    tienDo: 'Chưa bố trí được vốn, dự kiến triển khai trước 2030',
    ghiChu: 'Hướng tuyến quy hoạch bám các đường hiện hữu Hồ Học Lãm – Trịnh Quang Nghị – cầu Phú Định.' }
];

const TRANG_THAI = {
  'hoan-thanh':    { nhan: 'Hoàn thành',          mau: '#16a34a', net: 'lien', thuTu: 1 },
  'dang-thi-cong': { nhan: 'Đang thi công',       mau: '#f97316', net: 'lien', hieuUng: true, thuTu: 2 },
  'chuan-bi':      { nhan: 'Chuẩn bị triển khai', mau: '#eab308', net: 'lien', thuTu: 3 },
  'quy-hoach':     { nhan: 'Quy hoạch',           mau: '#dc2626', net: 'dut',  thuTu: 4 },
  'chua-xac-minh': { nhan: 'Chưa xác minh',       mau: '#94a3b8', net: 'dut',  thuTu: 5 }
};

const MA_TRANG_THAI = { 'hoan-thanh': 'completed', 'dang-thi-cong': 'under_construction',
  'chuan-bi': 'preparing', 'quy-hoach': 'planned', 'chua-xac-minh': 'unverified' };

/* Tên gọi khác, để tìm kiếm ra cùng một nút. */
const ALIAS = {
  'Nút giao An Lập': ['Ngã ba An Lập', 'Ngã ba Tân Tạo'],
  'Nút giao Bình Thái': ['Nút giao Võ Nguyên Giáp', 'Nút giao Xa lộ Hà Nội'],
  'Nút giao Gò Dưa': ['Cầu vượt Gò Dưa', 'Nút giao Quốc lộ 1'],
  'Cầu Phú Hữu': ['Cầu Rạch Chiếc 2'],
  'Nút giao Mỹ Thủy': ['Ngã tư Mỹ Thủy']
};

/* ─── §5 · DỰNG ĐOẠN ────────────────────────────────────────────────────── */

log('\n▶ Dựng đoạn bằng Dijkstra trên đồ thị');
const doan = [];
for (const d of DINH_NGHIA) {
  const A = N[d.a], B = N[d.b];
  let shape = null, canXacMinh = false, viSao = null;

  if (A && B) {
    const g = dungDoThi(d.duongOSM);
    const a = bamVao(g, A.toaDo), b = bamVao(g, B.toaDo);
    if (a && b) {
      shape = dijkstra(g, a.khoa, b.khoa);
      if (shape) log(`     ${d.id} bám nút lệch ${Math.round(a.lech)} m / ${Math.round(b.lech)} m`);
    }
  }

  if (!shape || shape.length < 3) {
    /* Công cụ nội bộ: KHÔNG bỏ trống. Vẽ polyline tạm nối hai nút đã biết và
       gắn cờ để hiệu chỉnh sau — nhãn hiện rõ trên bản đồ và trong popup. */
    canXacMinh = true;
    viSao = !A || !B
      ? `Chưa xác định được ${!A ? d.a : d.b} trong dữ liệu OSM hiện có.`
      : 'Đồ thị OSM không có đường liên tục giữa hai nút — nhiều khả năng đoạn này chưa được vẽ trong OSM vì chưa thi công.';
    if (A && B) shape = [A.toaDo, B.toaDo];
    else { log(`  ✗ ${d.id} ${d.seg} — thiếu cả nút, bỏ qua`); continue; }
    log(`  ⚠ ${d.id} ${d.seg} — POLYLINE TẠM (${viSao})`);
  }

  const s = simplify(shape, 6).map(round);   // giữ chi tiết cho zoom 20
  const km = +(lengthOf(shape) / 1000).toFixed(2);
  const tt = canXacMinh ? 'chua-xac-minh' : d.tt;

  doan.push({
    id: d.id,
    tuyenId: 'vd2',
    tenTuyen: 'Vành đai 2',
    name: 'Vành đai 2',
    segment: d.seg,
    tenDoan: d.seg,
    diemDau: A.ten, diemCuoi: B.ten,
    aliasDiemDau: ALIAS[A.ten] ?? null,
    aliasDiemCuoi: ALIAS[B.ten] ?? null,
    duongThucTe: d.duong,
    trangThai: tt,
    status: MA_TRANG_THAI[tt],
    trangThaiHoSo: d.tt,
    mau: TRANG_THAI[tt].mau,
    daiKm: km,
    daiHoSoKm: d.daiHoSoKm ?? null,
    tienDo: d.tienDo ?? null,
    tienDoPhanTram: null,
    ngayKhoiCong: d.ngayKhoiCong ?? null,
    duKienHoanThanh: d.duKienHoanThanh ?? null,
    ghiChu: [d.ghiChu, viSao].filter(Boolean).join(' '),
    canXacMinh,
    nhanTam: canXacMinh ? 'Tạm thời - cần hiệu chỉnh' : null,
    source: NGUON,
    nguonHoSo: 'Wikipedia · baodautu.vn · plo.vn · thesaigontimes.vn (2025–2026) dẫn Ban Giao thông TP.HCM',
    tinCayHoSo: canXacMinh ? 2 : 4,
    nguonHinhHoc: canXacMinh
      ? 'Polyline tạm nối hai nút giao — CHƯA bám tim đường, cần hiệu chỉnh'
      : 'OpenStreetMap · Overpass API — tim đường thật (Dijkstra trên đồ thị đường)',
    ngayChupOSM: NGAY,
    ngayCapNhat: NGAY,
    soDiem: s.length,
    polyline: s,
    coordinates: s
  });
  if (!canXacMinh)
    log(`  ✓ ${d.id}  ${km.toFixed(2).padStart(6)} km · ${String(s.length).padStart(4)} điểm · ${TRANG_THAI[tt].nhan.padEnd(20)} ${d.seg}`);
}

/* ─── §6 · GHÉP VÀO ring_roads.json ─────────────────────────────────────── */

const tong = doan.reduce((s, d) => s + d.daiKm, 0);
const theoTT = {};
doan.forEach(d => { theoTT[d.trangThai] = +((theoTT[d.trangThai] ?? 0) + d.daiKm).toFixed(2); });

const tuyen = {
  id: 'vd2', name: 'Vành đai 2', ten: 'Vành đai 2', mau: '#16a34a',
  tongDaiKm: { giaTri: 64, nguon: 'Wikipedia · quy hoạch giao thông TP.HCM — toàn tuyến khép kín', tinCay: 4 },
  tongDoDuocKm: +tong.toFixed(2),
  theoTrangThai: theoTT,
  tyLeHoanThanh: +(((theoTT['hoan-thanh'] ?? 0) / 64) * 100).toFixed(1),
  ghiChuTuyen:
    'Toàn tuyến 64 km, đã khai thác khoảng 50 km, còn 14 km chưa khép kín chia 4 đoạn. ' +
    'Hình học từng đoạn tìm bằng Dijkstra trên đồ thị đường dựng từ OpenStreetMap nên ' +
    'bám tim đường thật, KHÔNG nối thẳng và KHÔNG nội suy. Vành đai 2 hầu như không ' +
    'mang tên "Vành đai 2" trong OSM mà mang tên đường thật: cung nam là Nguyễn Văn Linh, ' +
    'cung đông là Võ Chí Công, cung tây đi trùng Quốc lộ 1 (chỉ nhận ra qua ref=QL.1).',
  tienDo: 'Hai đoạn Phú Hữu–Bình Thái và Bình Thái–Phạm Văn Đồng khởi công 19/12/2025, dự kiến ' +
          'hoàn thành cuối 2027. Đoạn Phạm Văn Đồng–Gò Dưa tạm dừng từ 2020. Đoạn An Lập–' +
          'Nguyễn Văn Linh chưa bố trí vốn.',
  canhBao:
    'Đoạn nào mang cờ "Cần xác minh" là polyline TẠM, chưa bám tim đường — dùng để hiệu ' +
    'chỉnh trong Chế độ biên tập GIS, không dùng để đo khoảng cách tư vấn khách. ' +
    'Nút giao An Lập còn có tên gọi địa phương "Ngã ba Tân Tạo"; hai tên này trong tài liệu ' +
    'không hoàn toàn trùng vị trí (lệch khoảng 3 km dọc Quốc lộ 1) — đang dùng tên quy hoạch.',
  nguon: NGUON, source: NGUON, tinCay: 4, ngayCapNhat: NGAY,
  soDoan: doan.length, doan
};

const f = join(DATA, 'ring_roads.json');
const cu = JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''));
for (const [k, v] of Object.entries(TRANG_THAI)) cu.trangThai[k] = v;
delete cu.trangThai['chua-hoan-thien'];
cu.tuyen = [tuyen, ...cu.tuyen.filter(t => t.id !== 'vd2')];
writeFileSync(f, JSON.stringify(cu, null, 2) + '\n', 'utf8');

log(`\n✓ Vành đai 2: ${doan.length} đoạn · ${tong.toFixed(2)} / 64 km hồ sơ`);
for (const [k, v] of Object.entries(theoTT)) log(`    ${TRANG_THAI[k].nhan.padEnd(22)} ${v.toFixed(2)} km`);
const tam = doan.filter(d => d.canXacMinh);
if (tam.length) log(`  ⚠ ${tam.length} đoạn cần hiệu chỉnh: ${tam.map(d => d.id).join(', ')}`);
log(`  Đã ghi ${f} — vd3, vd4 giữ nguyên`);
