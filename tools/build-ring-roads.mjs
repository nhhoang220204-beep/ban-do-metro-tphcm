#!/usr/bin/env node
/**
 * build-ring-roads.mjs — dựng data/ring_roads.json cho hệ thống đường vành đai.
 *
 * Chạy:
 *   node tools/build-ring-roads.mjs           → tải mới từ Overpass
 *   node tools/build-ring-roads.mjs --cache   → dùng lại ảnh chụp
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TRẠNG THÁI TỪNG ĐOẠN LẤY TỪ ĐÂU
 *
 * OpenStreetMap gắn trạng thái ngay trong thẻ `highway` của từng way:
 *   highway=motorway|trunk|primary|…  → đã thông xe
 *   highway=construction              → đang thi công
 *   highway=proposed                  → mới quy hoạch
 *
 * Nhờ vậy trạng thái là CỦA TỪNG ĐOẠN chứ không phải gán chung cho cả tuyến.
 * Công cụ nối các way liền nhau CÙNG trạng thái thành một đoạn, nên ranh giới
 * đoạn là ranh giới trạng thái thật trên thực địa.
 *
 * Mốc thời gian và phần trăm tiến độ thì OSM không có — lấy từ bảng khai báo
 * `HO_SO` bên dưới, mỗi mục kèm nguồn và ngày. Đoạn nào không khớp được với
 * hồ sơ nào thì để trống, KHÔNG suy đoán.
 *
 * ⚠ OSM có độ trễ: một đoạn đã thông xe ngoài thực địa có thể vẫn còn thẻ
 * `construction` vì chưa ai cập nhật. Vì vậy mỗi đoạn đều ghi `ngayChupOSM`
 * và giao diện phải hiện ngày đó cho người dùng tự cân nhắc.
 */

import { cached, writeData, meta, log, hav, chain, simplify, round, lengthOf, motChieu, boKhucGap, BBOX }
  from './lib/osm.mjs';

const argv = process.argv.slice(2);
const USE_CACHE = argv.includes('--cache');
const NGAY_CHUP = new Date().toISOString().slice(0, 10);

/* ─── §1 · KHAI BÁO TUYẾN ───────────────────────────────────────────────────
   `ten` là các giá trị thẻ name trong OSM. `loaiTru` để bỏ way trùng tên nhưng
   không phải tuyến vành đai.                                               */

const TUYEN = [
  {
    id: 'vd2',
    ten: 'Vành đai 2',
    /* Vành đai 2 nằm gọn trong nội đô — thu hẹp khung bao cho truy vấn nhẹ đi. */
    bbox: '10.63,106.56,10.95,106.85',
    mau: '#f97316',
    tongDaiKm: { giaTri: 64, nguon: 'Quy hoạch giao thông TP.HCM — chiều dài toàn tuyến khép kín', tinCay: 3 },
    osmTen: [
      'Dự án đường Vành đai 2',   // các đoạn chưa khép kín, OSM gắn construction
      'Phạm Văn Đồng',            // đoạn đã thông xe
      'Võ Chí Công',
      'Nguyễn Văn Linh',
      'Đường Vành Đai Trong'
    ],
    ghiChu: 'Các đoạn đã hoàn thành của Vành đai 2 KHÔNG mang tên "Vành đai 2" trong ' +
            'OpenStreetMap mà mang tên đường thật (Phạm Văn Đồng, Võ Chí Công, ' +
            'Nguyễn Văn Linh…). Đây là lý do phải liệt kê từng tên một.'
  },
  {
    id: 'vd3',
    ten: 'Vành đai 3',
    bbox: '10.60,106.30,11.15,107.10',
    mau: '#dc2626',
    tongDaiKm: { giaTri: 76.3, nguon: 'Nghị quyết 57/2022/QH15 · dự án Vành đai 3 TP.HCM', tinCay: 4 },
    osmTen: [
      'Đường vành đai 3 Thành phố Hồ Chí Minh',
      'Cầu cạn Đường vành đai 3 Thành phố Hồ Chí Minh',
      'Đường vành đai 3 Thành phố Hồ Chí Minh giai đoạn 2'
    ],
    /* Đường song hành là đường gom hai bên, không phải tim tuyến cao tốc.
       Đưa vào sẽ nhân đôi chiều dài và sai hẳn tỷ lệ hoàn thành. */
    ghiChu: 'Không tính "Đường song hành Vành đai 3" — đó là đường gom hai bên, ' +
            'không phải tim tuyến. Tính vào sẽ nhân đôi chiều dài.'
  },
  {
    id: 'vd4',
    ten: 'Vành đai 4',
    bbox: '10.30,106.15,11.50,107.40',
    mau: '#7c3aed',
    tongDaiKm: { giaTri: 207, nguon: 'Quy hoạch — Vành đai 4 TP.HCM qua 5 tỉnh thành', tinCay: 3 },
    osmTen: [
      'Đường Vành đai 4 Thành phố Hồ Chí Minh',
      'Đường cao tốc Vành Đai 4 Thành phố Hồ Chí Minh',
      'Đường cao tốc Vành Đai 4 TPHCM',
      'Đường vành đai 4 Thành phố Hồ Chí Minh'
    ],
    /* "Đường Vành Đai 4" trơ trọi là một đường nội bộ cấp secondary/residential,
       trùng tên nhưng không phải tuyến vành đai. */
    loaiTru: ['Đường Vành Đai 4'],
    ghiChu: 'OSM có hai bản vẽ chồng nhau cho cùng hành lang ("Đường Vành đai 4…" và ' +
            '"Đường cao tốc Vành Đai 4…"). Công cụ loại đoạn nằm đè lên đoạn dài hơn.'
  }
];

/* ─── §2 · HỒ SƠ CHÍNH THỨC ─────────────────────────────────────────────────
   Mốc thời gian, tiến độ, tên đoạn. OSM không có những thứ này.
   Mỗi mục PHẢI có nguồn. Không có nguồn thì không đưa vào.                  */

const HO_SO = {
  vd2: [
    {
      khop: { trangThai: 'dang-thi-cong', gan: [10.7963, 106.7770] },
      ten: 'Đoạn 1: Cầu Phú Hữu – đường Võ Nguyên Giáp',
      diemDau: 'Cầu Phú Hữu', diemCuoi: 'Đường Võ Nguyên Giáp (nút giao Bình Thái)',
      daiHoSoKm: 3.6,
      ngayKhoiCong: '2025-11', duKienHoanThanh: '2027-04-30',
      nguon: 'Báo Người Lao Động / VnEconomy 11–12/2025 dẫn Ban Giao thông TP.HCM',
      tinCay: 3
    },
    {
      khop: { trangThai: 'dang-thi-cong', gan: [10.8331, 106.7561] },
      ten: 'Đoạn 2: Đường Võ Nguyên Giáp – đường Phạm Văn Đồng',
      diemDau: 'Đường Võ Nguyên Giáp', diemCuoi: 'Đường Phạm Văn Đồng',
      daiHoSoKm: 2.44,
      ngayKhoiCong: '2025-11', duKienHoanThanh: '2027-04-30',
      nguon: 'Báo Người Lao Động / VnEconomy 11–12/2025 dẫn Ban Giao thông TP.HCM',
      tinCay: 3
    },
    {
      khop: { trangThai: 'dang-thi-cong', gan: [10.8618, 106.7286] },
      ten: 'Đoạn 3: Đường Phạm Văn Đồng – nút giao Gò Dưa (Quốc lộ 1)',
      diemDau: 'Đường Phạm Văn Đồng', diemCuoi: 'Nút giao Gò Dưa – Quốc lộ 1',
      daiHoSoKm: null,
      ngayKhoiCong: '2025-12', duKienHoanThanh: null,
      ghiChu: 'Đoạn khởi công lại sau nhiều năm dừng thi công.',
      nguon: 'Báo Người Lao Động 11/2025',
      tinCay: 3
    }
  ],
  vd3: [],
  vd4: []
};

/* Thông tin áp cho cả tuyến, không gắn được vào một đoạn cụ thể. */
const GHI_CHU_TUYEN = {
  vd3: {
    tienDo: 'Bốn dự án thành phần xây lắp đạt 36,3% / 30,0% / 31,5% / 71,4% khối lượng ' +
            'tại thời điểm nguồn công bố. Mục tiêu thông xe toàn tuyến 30/06/2026.',
    canhBao: 'Mốc 30/06/2026 ĐÃ QUA nhưng KHÔNG tra được nguồn nào xác nhận đã thông xe ' +
             'toàn tuyến. Trạng thái từng đoạn dưới đây lấy theo thẻ OSM, có thể trễ so ' +
             'với thực địa. Phải kiểm lại trước khi nói với khách.',
    nguon: 'Trung tâm Báo chí TP.HCM · Báo Pháp Luật TP.HCM, các bài 2025',
    tinCay: 3
  },
  vd2: {
    tienDo: null,
    canhBao: 'Đoạn 1 và 2 phụ thuộc tiến độ bàn giao mặt bằng — mốc khởi công từng bị lùi nhiều lần.',
    nguon: 'Báo Người Lao Động 11/2025',
    tinCay: 3
  },
  vd4: {
    tienDo: null,
    canhBao: 'Phần lớn tuyến còn ở bước quy hoạch. Hình học trong OSM là do cộng đồng vẽ ' +
             'lại từ bản đồ công bố, sai số có thể hàng trăm mét.',
    nguon: null,
    tinCay: 2
  }
};

/* ─── §3 · BẢNG TRẠNG THÁI ──────────────────────────────────────────────── */

const TRANG_THAI = {
  'hoan-thanh':    { nhan: 'Đã hoàn thành',     mau: '#16a34a', net: 'lien', thuTu: 1 },
  'dang-thi-cong': { nhan: 'Đang thi công',     mau: '#f97316', net: 'lien', hieuUng: true, thuTu: 2 },
  'chuan-bi':      { nhan: 'Chuẩn bị thi công', mau: '#eab308', net: 'lien', thuTu: 3 },
  'quy-hoach':     { nhan: 'Quy hoạch',         mau: '#dc2626', net: 'dut',  thuTu: 4 },
  'chua-xac-minh': { nhan: 'Chưa xác minh',     mau: '#94a3b8', net: 'cham', thuTu: 5 }
};

/** Suy trạng thái từ thẻ OSM của một way. */
function trangThaiTuOSM(tags) {
  const h = tags.highway;
  if (h === 'construction') return 'dang-thi-cong';
  if (h === 'proposed') return 'quy-hoach';
  if (['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential']
      .includes(h)) return 'hoan-thanh';
  if (h?.endsWith('_link')) return 'hoan-thanh';
  return 'chua-xac-minh';
}

/* ─── §4 · TẢI VÀ DỰNG ──────────────────────────────────────────────────── */

/**
 * Tải theo TỪNG TUYẾN, không gộp một truy vấn.
 *
 * Gộp cả 14 bộ lọc tên trên khung bao 1,4° × 1,5° làm Overpass chạy quá 45 phút
 * không trả lời. Tách ra thì mỗi truy vấn chỉ vài chục giây, và tuyến nào hỏng
 * cũng không kéo hai tuyến kia đi theo.
 */
async function taiTuyen(cfg) {
  /* Mỗi vành đai có phạm vi riêng — dùng khung bao chung của cả vùng thì truy
     vấn tên phố phổ biến ("Phạm Văn Đồng", "Nguyễn Văn Linh") quét cả Đồng Nai,
     Long An và không bao giờ trả lời. Thu hẹp theo tuyến làm nó xuống vài chục giây. */
  const bb = cfg.bbox ?? BBOX;
  const q = `[out:json][timeout:240];
(${cfg.osmTen.map(t => `way["highway"]["name"="${t}"](${bb});`).join('')});
out geom tags;`;
  return cached(`vanh-dai-${cfg.id}`, q, USE_CACHE, 1);
}

/** Tỷ lệ điểm của hình a nằm sát hình b — dùng phát hiện bản vẽ chồng nhau. */
function tyLeTrung(a, b, nguong = 120) {
  const pts = a.filter((_, i) => i % 4 === 0);
  if (!pts.length) return 0;
  let hit = 0;
  for (const p of pts) {
    let best = Infinity;
    for (const s of b) for (let i = 0; i < s.length - 1; i++) {
      const x = s[i], y = s[i + 1], dx = y[1] - x[1], dy = y[0] - x[0];
      let t = 0;
      if (dx || dy) t = Math.max(0, Math.min(1, ((p[1] - x[1]) * dx + (p[0] - x[0]) * dy) / (dx * dx + dy * dy)));
      const d = hav(p, [x[0] + dy * t, x[1] + dx * t]);
      if (d < best) best = d;
      if (best <= 1) break;
    }
    if (best <= nguong) hit++;
  }
  return hit / pts.length;
}

const ketQua = [];

for (const cfg of TUYEN) {
  log(`\n▶ ${cfg.ten}`);

  let json;
  try { json = await taiTuyen(cfg); }
  catch (err) { log(`  ✗ không tải được: ${err.message}`); continue; }

  const ways = json.elements.filter(w =>
    w.type === 'way' && w.geometry?.length > 1 &&
    cfg.osmTen.includes(w.tags?.name) &&
    !(cfg.loaiTru ?? []).includes(w.tags?.name));
  log(`  ${ways.length} way trong hành lang`);

  /* Gom theo trạng thái rồi mới nối — nối trước sẽ trộn lẫn hai trạng thái
     vào một đoạn và mất đúng cái thông tin cần nhất. */
  const theoTT = new Map();
  for (const w of ways) {
    const tt = trangThaiTuOSM(w.tags);
    if (!theoTT.has(tt)) theoTT.set(tt, []);
    theoTT.get(tt).push(w.geometry.map(g => [g.lat, g.lon]));
  }

  const doan = [];
  for (const [tt, segs] of theoTT) {
    /* maxGap nhỏ để hai đoạn rời nhau thật sự không bị nối liền qua khoảng trống. */
    for (const tho of chain(segs, 120)) {
      /* BẮT BUỘC hai bước này: OSM vẽ đường đôi thành hai way, chain() nối
         chúng ở nút giao thành chuỗi đi–về làm chiều dài gấp đôi. Bỏ hai bước
         là Vành đai 4 ra 393 km thay vì 207 km. */
      const chuoi = boKhucGap(motChieu(tho));
      const m = lengthOf(chuoi);
      if (m < 400) continue;                    // mẩu vụn, nhánh nối
      doan.push({ trangThai: tt, m, shape: simplify(chuoi, 20).map(round) });
    }
  }

  /* Loại bản vẽ chồng nhau: đoạn ngắn nằm đè lên đoạn dài hơn CÙNG trạng thái. */
  doan.sort((a, b) => b.m - a.m);
  const giu = [];
  let daTrung = 0;
  for (const d of doan) {
    const trung = giu.find(x => x.trangThai === d.trangThai && tyLeTrung(d.shape, [x.shape]) >= 0.7);
    if (trung) { daTrung++; continue; }
    giu.push(d);
  }

  /* Gắn hồ sơ chính thức: khớp theo trạng thái + điểm gần nhất. */
  const hoSo = HO_SO[cfg.id] ?? [];
  const daDung = new Set();

  const segments = giu.map((d, i) => {
    let khop = null;
    for (const [k, h] of hoSo.entries()) {
      if (daDung.has(k) || h.khop.trangThai !== d.trangThai) continue;
      const gan = Math.min(...d.shape.map(p => hav(p, h.khop.gan)));
      if (gan <= 2500) { khop = h; daDung.add(k); break; }
    }

    const daiKm = +(d.m / 1000).toFixed(2);
    return {
      id: `${cfg.id}-${String(i + 1).padStart(2, '0')}`,
      tuyenId: cfg.id,
      tenTuyen: cfg.ten,
      tenDoan: khop?.ten ?? `Đoạn ${i + 1} — ${TRANG_THAI[d.trangThai].nhan.toLowerCase()}`,
      diemDau: khop?.diemDau ?? null,
      diemCuoi: khop?.diemCuoi ?? null,
      trangThai: d.trangThai,
      mau: TRANG_THAI[d.trangThai].mau,
      daiKm,
      daiHoSoKm: khop?.daiHoSoKm ?? null,
      tienDoPhanTram: null,
      ngayKhoiCong: khop?.ngayKhoiCong ?? null,
      duKienHoanThanh: khop?.duKienHoanThanh ?? null,
      ghiChu: khop?.ghiChu ?? null,
      nguonHoSo: khop?.nguon ?? null,
      tinCayHoSo: khop?.tinCay ?? null,
      nguonHinhHoc: 'OpenStreetMap · Overpass API',
      ngayChupOSM: NGAY_CHUP,
      polyline: d.shape
    };
  });

  segments.sort((a, b) => TRANG_THAI[a.trangThai].thuTu - TRANG_THAI[b.trangThai].thuTu || b.daiKm - a.daiKm);

  const theoTrangThai = {};
  for (const s of segments) theoTrangThai[s.trangThai] = +((theoTrangThai[s.trangThai] ?? 0) + s.daiKm).toFixed(2);
  const tongDoDuoc = +segments.reduce((a, s) => a + s.daiKm, 0).toFixed(2);

  log(`  ${segments.length} đoạn · ${tongDoDuoc} km đo được · loại ${daTrung} đoạn vẽ chồng`);
  for (const [tt, km] of Object.entries(theoTrangThai)) log(`    ${TRANG_THAI[tt].nhan}: ${km} km`);

  ketQua.push({
    id: cfg.id, ten: cfg.ten, mau: cfg.mau,
    tongDaiKm: cfg.tongDaiKm,
    tongDoDuocKm: tongDoDuoc,
    theoTrangThai,
    tyLeHoanThanh: cfg.tongDaiKm.giaTri
      ? +(((theoTrangThai['hoan-thanh'] ?? 0) / cfg.tongDaiKm.giaTri) * 100).toFixed(1)
      : null,
    ghiChuTuyen: cfg.ghiChu,
    ...GHI_CHU_TUYEN[cfg.id],
    soDoan: segments.length,
    doan: segments
  });
}

writeData('ring_roads.json', {
  meta: meta({
    ghi_chu: 'Trạng thái từng đoạn suy từ thẻ highway trong OpenStreetMap ' +
             '(motorway=đã thông xe, construction=đang thi công, proposed=quy hoạch). ' +
             'Mốc thời gian và tiến độ lấy từ nguồn báo chí dẫn cơ quan chủ quản, ghi kèm từng đoạn.',
    canh_bao: 'OSM có độ trễ so với thực địa. Mỗi đoạn ghi ngayChupOSM để người dùng tự cân nhắc. ' +
              'Hình học tuyến quy hoạch do cộng đồng vẽ lại, không phải hồ sơ thiết kế.',
    he_toa_do: 'EPSG:4326 (WGS84)',
    them_tuyen_moi: 'Thêm Vành đai 5 chỉ cần thêm một mục vào mảng TUYEN trong ' +
                    'tools/build-ring-roads.mjs rồi chạy lại. Giao diện tự cập nhật.'
  }),
  trangThai: TRANG_THAI,
  tuyen: ketQua
});

log('\nXong.');
