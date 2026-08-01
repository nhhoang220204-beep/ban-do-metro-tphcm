#!/usr/bin/env node
/**
 * build-around.mjs — dựng dữ liệu "quanh dự án": tiện ích trong bán kính 5 km
 * và khoảng cách tới ga metro, tất cả đo theo ĐƯỜNG THẬT.
 *
 * Chạy:
 *   node tools/build-around.mjs                → mọi dự án đã có toạ độ
 *   node tools/build-around.mjs ht-pearl       → chỉ một dự án
 *   node tools/build-around.mjs --cache        → dùng lại POI đã tải, chỉ tính lại đường
 *
 * Ghi ra data/amenities.json và data/routes.json.
 *
 * CHẠY LẠI SAU KHI GHIM DỰ ÁN MỚI. Dự án chưa có toạ độ thì bỏ qua — không
 * có toạ độ thì không có gì để đo, và tuyệt đối không đoán vị trí.
 */

import { cached, writeData, readData, meta, log, hav, pointOf, slug, sleep } from './lib/osm.mjs';
import { bothModes } from './lib/route.mjs';

const argv = process.argv.slice(2);
const USE_CACHE = argv.includes('--cache');
const only = new Set(argv.filter(a => !a.startsWith('--')));

/** Bán kính lọc trong giao diện, đơn vị mét. Bán kính lớn nhất = phạm vi tải. */
const BAN_KINH = [500, 1000, 2000, 5000];
const R_MAX = BAN_KINH.at(-1);

/* ─── §1 · NHÓM TIỆN ÍCH ────────────────────────────────────────────────────
   Mỗi nhóm là một bộ lọc Overpass. Thứ tự ở đây cũng là thứ tự hiển thị.   */

/** `tag`+`gia_tri` sinh ra cả bộ lọc Overpass lẫn hàm khớp — một nguồn sự thật,
    không có chuyện truy vấn và cách phân nhóm lệch nhau. */
const def = (nhan, icon, mau, tag, giaTri, batBuocTen = true) => ({
  nhan, icon, mau, tag, giaTri, batBuocTen,
  loc: `nwr["${tag}"${giaTri.length > 1 ? `~"^(${giaTri.join('|')})$"` : `="${giaTri[0]}"`}]` +
       (batBuocTen ? '["name"]' : ''),
  khop: t => giaTri.includes(t?.[tag])
});

const NHOM = {
  'giao-duc':   def('Giáo dục', '🏫', '#2563eb', 'amenity', ['school', 'kindergarten', 'college', 'university']),
  'y-te':       def('Y tế', '🏥', '#dc2626', 'amenity', ['hospital', 'clinic', 'doctors', 'pharmacy']),
  'sieu-thi':   def('Siêu thị', '🛒', '#16a34a', 'shop', ['supermarket', 'convenience']),
  'kcn':        def('Khu công nghiệp', '🏢', '#7c3aed', 'landuse', ['industrial']),
  'hanh-chinh': def('Cơ quan hành chính', '🏛', '#0891b2', 'amenity', ['townhall']),
  'ngan-hang':  def('Ngân hàng', '🏦', '#ca8a04', 'amenity', ['bank']),
  'cay-xang':   def('Cây xăng', '⛽', '#ea580c', 'amenity', ['fuel'], false),
  'an-uong':    def('Ăn uống', '🍜', '#e11d48', 'amenity', ['restaurant', 'fast_food']),
  'cafe':       def('Cà phê', '☕', '#a16207', 'amenity', ['cafe']),
  'gym':        def('Gym', '🏋', '#0d9488', 'leisure', ['fitness_centre']),
  'cong-vien':  def('Công viên', '🌳', '#22c55e', 'leisure', ['park']),
  'rap-phim':   def('Rạp phim', '🎬', '#9333ea', 'amenity', ['cinema']),
  'mall':       def('Trung tâm thương mại', '🛍', '#db2777', 'shop', ['mall', 'department_store'])
};

/* Mỗi nhóm chỉ đo đường thật cho N điểm gần nhất. Lý do: trong bán kính 5 km ở
   TP.HCM có thể có hàng trăm quán ăn — đo hết vừa chậm vừa vô nghĩa với người
   tư vấn. N = 12 đủ phủ kín cả bốn mức bán kính 500 m → 5 km.               */
const SO_DIEM_DO = 12;

/* ─── §2 · TẢI TIỆN ÍCH QUANH MỘT DỰ ÁN ─────────────────────────────────── */

/**
 * Tải tiện ích quanh một dự án.
 *
 * MỖI NHÓM MỘT TRUY VẤN RIÊNG, đừng gộp lại. Gộp cả 13 bộ lọc `nwr` với
 * `around:5000` vào một truy vấn làm Overpass chạy quá 180 giây rồi trả về
 * HTTP 200 kèm mảng RỖNG và một dòng `remark` — nhìn như thành công. Tách ra
 * thì mỗi truy vấn chỉ vài giây, và nhóm nào hỏng cũng không kéo cả mẻ đi.
 */
async function taiTienIch(du_an) {
  const [lat, lng] = du_an.toaDo;
  const diem = [];
  const seen = new Set();

  for (const [key, n] of Object.entries(NHOM)) {
    let json;
    try {
      /* toiThieu = 0 vì có nhóm vắng thật: quanh dự án có thể không có rạp
         phim nào. Ở đây phân biệt "rỗng thật" với "máy chủ hỏng" bằng cách
         đọc `remark` thay vì bằng số lượng phần tử. */
      json = await cached(
        `around-${du_an.id}-${key}`,
        `[out:json][timeout:120];${n.loc}(around:${R_MAX},${lat},${lng});out center tags;`,
        USE_CACHE, 0
      );
      if (json.remark) throw new Error(json.remark);
    } catch (err) {
      log(`    ! nhóm ${n.nhan}: ${err.message}`);
      continue;
    }

    for (const el of json.elements) {
      const c = pointOf(el);
      if (!c) continue;
      /* Một đối tượng có thể khớp nhiều nhóm (siêu thị nằm trong trung tâm
         thương mại). Gán vào nhóm ĐẦU TIÊN khớp để không đếm trùng. */
      const nhom = phanNhom(el.tags) ?? key;
      const name = el.tags.name?.trim() || NHOM[nhom].nhan;
      const dedupe = `${slug(name)}|${c[0].toFixed(4)},${c[1].toFixed(4)}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      diem.push({ id: `${el.type[0]}${el.id}`, name, nhom, c, chimBay: Math.round(hav([lat, lng], c)) });
    }
    await sleep(800);
  }
  return diem;
}

/** Nhóm ĐẦU TIÊN khớp theo thứ tự khai báo, để siêu thị nằm trong trung tâm
    thương mại không bị đếm hai lần. */
function phanNhom(tags = {}) {
  for (const [key, n] of Object.entries(NHOM)) if (n.khop(tags)) return key;
  return null;
}

/* ─── §3 · ĐO ĐƯỜNG THẬT ────────────────────────────────────────────────── */

/** Đo cho `SO_DIEM_DO` điểm gần nhất mỗi nhóm; điểm còn lại giữ nguyên, không đo. */
async function doTienIch(du_an, diem) {
  const chon = [];
  for (const key of Object.keys(NHOM)) {
    chon.push(...diem.filter(d => d.nhom === key)
                     .sort((a, b) => a.chimBay - b.chimBay)
                     .slice(0, SO_DIEM_DO));
  }
  log(`    đo đường thật cho ${chon.length}/${diem.length} điểm`);
  const kq = await bothModes(du_an.toaDo, chon.map(d => d.c));
  chon.forEach((d, i) => { d.diBo = kq[i].diBo; d.diXe = kq[i].diXe; });
  /* Điểm không được đo thì xoá khoảng cách chim bay luôn, tránh có người nhầm
     nó là khoảng cách di chuyển. Vẫn giữ trong danh sách để đếm số lượng. */
  for (const d of diem) if (!('diBo' in d)) d.chuaDo = true;
  return diem;
}

/* ─── §4 · GA METRO GẦN NHẤT ────────────────────────────────────────────── */

async function doGaMetro(du_an, stations) {
  /* Sàng sơ bộ bằng chim bay để chọn 8 ga đáng đo, rồi mới đo đường thật.
     Sàng sơ bộ chỉ để CHỌN, con số hiển thị luôn là đường thật.            */
  const gan = stations
    .map(s => ({ s, d: hav(du_an.toaDo, s.c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);

  const kq = await bothModes(du_an.toaDo, gan.map(g => g.s.c));
  const cacGa = gan.map((g, i) => ({
    id: g.s.id, name: g.s.name, lines: g.s.lines, c: g.s.c,
    diBo: kq[i].diBo, diXe: kq[i].diXe
  }))
  /* Xếp theo đường đi xe thật, không theo chim bay — sông và đường một chiều
     làm ga "gần nhất trên bản đồ" nhiều khi không phải ga dễ tới nhất. */
    .sort((a, b) => (a.diXe?.m ?? Infinity) - (b.diXe?.m ?? Infinity));

  return { gaGanNhat: cacGa[0] ?? null, cacGa };
}

/* ─── §5 · CHẠY ─────────────────────────────────────────────────────────── */

/* Đọc chỉ mục dự án. Chỉ đo cho bản ghi đã kiểm (`nguon: "thu-cong"`): ứng viên
   OSM có hàng nghìn, tiền tính hết là bất khả thi và cũng không đáng — ứng dụng
   tự đo tại chỗ khi người dùng mở một trong số đó (xem js/features/dodac.js). */
const chiMuc = readData('projects/index.json') ?? [];
const duAn = chiMuc.filter(p => p.nguon !== 'osm' || only.has(p.id));
const stations = readData('stations.json')?.stations ?? [];
if (!stations.length) log('! Chưa có data/stations.json — chạy build-data.mjs metro trước.');

const danhSach = duAn.filter(p =>
  Array.isArray(p.toaDo) && p.toaDo.length === 2 && (only.size === 0 || only.has(p.id)));

if (!danhSach.length) {
  log('Không có dự án nào đã ghim toạ độ. Ghim dự án trên bản đồ rồi chạy lại.');
  process.exit(0);
}

const amenities = readData('amenities.json')?.duLieu ?? {};
const routes = readData('routes.json')?.duLieu ?? {};

for (const p of danhSach) {
  log(`\n▶ ${p.ten}`);
  try {
    const diem = await doTienIch(p, await taiTienIch(p));
    amenities[p.id] = { capNhat: new Date().toISOString().slice(0, 10), diem };
    const dem = Object.keys(NHOM).map(k => `${NHOM[k].icon}${diem.filter(d => d.nhom === k).length}`).join(' ');
    log(`    ${diem.length} tiện ích · ${dem}`);

    if (stations.length) {
      routes[p.id] = await doGaMetro(p, stations);
      const g = routes[p.id].gaGanNhat;
      log(g ? `    ga gần nhất: ${g.name} · đi xe ${(g.diXe?.m / 1000).toFixed(1)} km · đi bộ ${g.diBo ? Math.round(g.diBo.giay / 60) + ' phút' : 'không có lối đi bộ'}`
            : '    không đo được ga nào');
    }
  } catch (err) {
    log(`    ✗ ${err.message}`);
  }
  await sleep(1500);
}

writeData('amenities.json', {
  meta: meta({ ghi_chu: `Khoảng cách đo theo đường thật qua OSRM. Chỉ ${SO_DIEM_DO} điểm gần nhất mỗi nhóm được đo.` }),
  banKinh: BAN_KINH,
  /* Chỉ xuất phần giao diện cần; bộ lọc Overpass và hàm khớp là việc nội bộ. */
  nhom: Object.fromEntries(Object.entries(NHOM).map(([k, n]) =>
    [k, { nhan: n.nhan, icon: n.icon, mau: n.mau }])),
  duLieu: amenities
});
writeData('routes.json', {
  meta: meta({ ghi_chu: 'Khoảng cách dự án → ga metro theo đường thật (OSRM driving + foot).' }),
  duLieu: routes
});
log('\nXong.');
