#!/usr/bin/env node
/**
 * build-projects.mjs — bổ sung ứng viên dự án bất động sản từ OpenStreetMap
 * vào danh mục.
 *
 * Chạy:
 *   node tools/build-projects.mjs           → tải mới rồi gộp vào chỉ mục
 *   node tools/build-projects.mjs --cache   → dùng lại ảnh chụp đã tải
 *   node tools/build-projects.mjs --dry     → chỉ in ra, không ghi file
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ĐIỀU CÔNG CỤ NÀY LÀM VÀ KHÔNG LÀM
 *
 * LÀM: lấy những đối tượng CÓ THẬT trong OpenStreetMap — có tên, có toạ độ —
 * mà nhiều khả năng là một khu nhà ở: chung cư, khu dân cư, khu đô thị.
 *
 * KHÔNG LÀM: không khẳng định đó là dự án đang bán, không đoán giá, không đoán
 * chủ đầu tư, không đoán pháp lý, không đoán quy mô. Mọi bản ghi sinh ra đều
 * mang `nguon: "osm"` và `trangThai: "chua-ro"`, và giao diện hiện nhãn
 * "Chưa kiểm" ở mọi chỗ chúng xuất hiện.
 *
 * Một toà nhà tên "Chung cư Sunrise" trong OSM là một toà nhà có thật. Nhưng nó
 * đang bán hay đã bàn giao mười năm trước thì OSM không biết, và công cụ này
 * cũng không được phép đoán. Người tư vấn phải tự kiểm trước khi nói với khách.
 *
 * KHÔNG BAO GIỜ GHI ĐÈ dữ liệu đã có. Bản ghi nào đã nằm trong chỉ mục thì giữ
 * nguyên, kể cả khi OSM có thông tin khác.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AREA_HCM, cached, log, hav, pointOf, slug, DATA } from './lib/osm.mjs';

const argv = process.argv.slice(2);
const USE_CACHE = argv.includes('--cache');
const DRY = argv.includes('--dry');

const THU_MUC = join(DATA, 'projects');
const F_INDEX = join(THU_MUC, 'index.json');

/* ─── §1 · NGUỒN LẤY TỪ OSM ─────────────────────────────────────────────────
   Chỉ ba loại đối tượng. Cố tình KHÔNG lấy place=neighbourhood (4.137 cái):
   đó là tên khu phố, phường, xóm — không phải dự án bất động sản. Đưa vào là
   nhồi danh mục bằng thứ không phải dự án.                                  */

const NGUON = {
  'chung-cu-toa-nha': {
    loc: 'nwr["building"="apartments"]["name"](area.hcm);',
    loaiMacDinh: 'chung-cu',
    moTa: 'Toà nhà chung cư'
  },
  'nha-o-toa-nha': {
    loc: 'nwr["building"="residential"]["name"](area.hcm);',
    loaiMacDinh: 'chung-cu',
    moTa: 'Toà nhà để ở'
  },
  'khu-dan-cu': {
    loc: 'nwr["landuse"="residential"]["name"](area.hcm);',
    loaiMacDinh: 'khu-do-thi',
    moTa: 'Khu dân cư · khu đô thị'
  }
};

/* ─── §2 · PHÂN LOẠI THEO TÊN ───────────────────────────────────────────────
   Suy loại hình từ chính tên gọi, không suy từ thứ gì khác. Tên không nói gì
   thì giữ loại mặc định của nguồn.                                          */

const THEO_TEN = [
  [/\b(shophouse|shop house)\b/i,                        'shophouse'],
  [/(nhà phố thương mại|nhà phố tm)/i,                   'nha-pho-thuong-mai'],
  [/(nhà phố|liền kề|liên kế|townhouse)/i,               'nha-pho'],
  [/(biệt thự|villa|compound)/i,                         'biet-thu'],
  [/(đất nền|phân lô)/i,                                 'dat-nen'],
  [/(chung cư|apartment|tower|residence|căn hộ)/i,       'chung-cu'],
  [/(khu đô thị|khu dân cư|kđt|residential area)/i,      'khu-do-thi']
];

function suyLoaiHinh(ten, macDinh) {
  for (const [re, ma] of THEO_TEN) if (re.test(ten)) return ma;
  return macDinh;
}

/* ─── §3 · LỌC NHIỄU ────────────────────────────────────────────────────────
   OSM có nhiều đối tượng mang tên vô nghĩa với người tư vấn: số nhà, ký hiệu
   lô, tên chung chung. Loại chúng ra thay vì nhồi vào danh mục.             */

/* Mã ký hiệu, không phải tên: "S3.02", "A1", "R1-12", "12", "B2/3". */
const LA_MA_KY_HIEU = /^[a-z]{0,3}[\d\s\-./]+[a-z]?$/i;

/* Từ chung chỉ bộ phận hoặc thể loại. Tên chỉ gồm những từ này cộng một mã
   ngắn thì là tên bộ phận toà nhà, không phải tên dự án: "Tháp A", "Tòa T1",
   "Block D-E", "Lô E2-2", "Liền Kề 2", "Đơn nguyên 3". */
const TU_CHUNG = new RegExp(
  '^(lô|lo|tháp|thap|toà|tòa|toa|block|khối|khoi|dãy|day|cụm|cum|đơn nguyên|' +
  'liền kề|lien ke|căn hộ|can ho|chung cư|chung cu|nhà|nha|khu|building|' +
  'apartment|apartments|tower|residence|ký túc xá|ky tuc xa|khu tập thể|' +
  'cư xá|cu xa|khu dân cư|khu đô thị|residential|nhà ở|nha o|căn|can)$', 'i');

/**
 * Tên có dùng được làm tên dự án không.
 *
 * Yêu cầu: sau khi bỏ hết từ chung và mã ký hiệu, phải còn lại ít nhất một từ
 * riêng dài từ 3 ký tự. "Chung cư Vista Verde" còn "Vista Verde" → nhận.
 * "Chung cư" trơ trọi, "Tháp A", "S3.02" → không còn gì → loại.
 *
 * Lọc theo cách này thay vì liệt kê từng mẫu xấu, vì OSM có vô số biến thể mà
 * liệt kê không xuể — và liệt kê thiếu thì rác lọt thẳng vào danh mục tư vấn.
 */
/* OSM gắn nhầm thẻ nhà ở cho cả trụ sở, trường, khách sạn. Tên đã nói rõ nó là
   thứ khác thì loại thẳng, đừng để lọt vào danh mục tư vấn bất động sản. */
const KHONG_PHAI_NHA_O = new RegExp(
  '(công an|ubnd|uỷ ban|ủy ban|trụ sở|bệnh viện|trường|đại học|khách sạn|hotel|' +
  'nhà thờ|chùa |bưu điện|ngân hàng|chi cục|phòng khám|ktx|nhà máy|xí nghiệp|' +
  'nhà khách|doanh trại)', 'i');

/* Mã căn hộ đứng đầu tên: "A40.05 Aspen Tower", "С3.1", "B12-04". Một căn hộ
   cụ thể không phải một dự án. */
const MA_CAN_HO = /^\p{L}\s?\d+[.\-]\d/u;

/* Địa chỉ chứ không phải tên: "72 đường 12", "246/4a Nguyễn thị Đặng". */
const LA_DIA_CHI = /^\d+[a-z]?(\/\d+[a-z]?)*\s+(đường|duong|ngõ|ngo|hẻm|hem|street|đ\.)/i;

function tenDungDuoc(ten) {
  const t = (ten ?? '').trim();
  if (t.length < 3 || t.length > 120) return false;
  /* Bắt đầu bằng ký hiệu lạ ("#3b-7") thì không phải tên do người đặt. */
  if (!/^[\p{L}\p{N}]/u.test(t)) return false;
  if (LA_MA_KY_HIEU.test(t) || MA_CAN_HO.test(t) || LA_DIA_CHI.test(t)) return false;
  if (KHONG_PHAI_NHA_O.test(t)) return false;
  /* Chuỗi dài kèm nhiều dấu phẩy là một địa chỉ đầy đủ đã bị nhét vào ô tên. */
  if (t.length > 60 && (t.match(/,/g) ?? []).length >= 2) return false;

  const conLai = t.split(/[\s,\-–—/()]+/)
    .filter(w => w && !TU_CHUNG.test(w) && !LA_MA_KY_HIEU.test(w) && w.length >= 3);

  return conLai.length > 0;
}

/* ─── §4 · TẠO MÃ ID ────────────────────────────────────────────────────── */

function taoId(ten, daDung) {
  const goc = slug(ten).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'du-an';
  let id = goc, n = 2;
  while (daDung.has(id)) id = `${goc}-${n++}`;
  daDung.add(id);
  return id;
}

/* ─── §5 · CHẠY ─────────────────────────────────────────────────────────── */

if (!existsSync(F_INDEX)) {
  log(`Không tìm thấy ${F_INDEX}. Chạy migrate hoặc tạo chỉ mục trước.`);
  process.exit(1);
}

let chiMuc = JSON.parse(readFileSync(F_INDEX, 'utf8'));
log(`Chỉ mục hiện có ${chiMuc.length} dự án ` +
    `(${chiMuc.filter(p => p.nguon === 'thu-cong').length} đã kiểm, ` +
    `${chiMuc.filter(p => p.nguon === 'osm').length} ứng viên OSM)`);

/* Dựng lại toàn bộ phần ứng viên — dùng khi đổi luật lọc. CHỈ xoá bản ghi mang
   nguon="osm"; bản ghi đã kiểm không bao giờ bị đụng tới. */
if (argv.includes('--reset-osm')) {
  const truoc = chiMuc.length;
  chiMuc = chiMuc.filter(p => p.nguon !== 'osm');
  log(`--reset-osm: bỏ ${truoc - chiMuc.length} ứng viên cũ, giữ ${chiMuc.length} bản ghi đã kiểm`);
}

const daDungId = new Set(chiMuc.map(p => p.id));
/* Đối chiếu trùng theo tên đã bỏ dấu + vị trí, vì OSM và người nhập viết tên
   khác nhau ("HT Pearl" vs "Căn hộ HT Pearl"). */
const daCo = chiMuc.map(p => ({ slug: slug(p.ten), toaDo: p.toaDo }));

function daTonTai(ten, c) {
  const s = slug(ten);
  return daCo.some(x => {
    const trungTen = x.slug === s || x.slug.includes(s) || s.includes(x.slug);
    if (!trungTen) return false;
    /* Trùng tên mà cách nhau xa thì là hai nơi khác nhau, không phải một. */
    if (!x.toaDo || !c) return true;
    return hav(x.toaDo, c) < 600;
  });
}

const moi = [];
const thongKe = {};

for (const [khoa, cfg] of Object.entries(NGUON)) {
  let json;
  try {
    json = await cached(
      `du-an-${khoa}`,
      `[out:json][timeout:240];${AREA_HCM}${cfg.loc}out center tags;`,
      USE_CACHE, 1
    );
  } catch (err) {
    log(`  ✗ ${cfg.moTa}: ${err.message}`);
    continue;
  }

  let nhan = 0, boTen = 0, boTrung = 0, boToaDo = 0;

  for (const el of json.elements) {
    const ten = el.tags?.name?.trim();
    if (!tenDungDuoc(ten)) { boTen++; continue; }

    const c = pointOf(el);
    if (!c) { boToaDo++; continue; }

    if (daTonTai(ten, c)) { boTrung++; continue; }

    const id = taoId(ten, daDungId);
    const ban = {
      id,
      ma: '',
      ten,
      loaiHinh: suyLoaiHinh(ten, cfg.loaiMacDinh),
      toaDo: c,
      xacMinh: 'osm',
      /* OSM không biết dự án đang bán hay đã bàn giao. Không đoán. */
      trangThai: 'chua-ro',
      chuDauTu: el.tags.operator?.trim() || '',
      giaTu: null,
      donViGia: 'trđ/m²',
      nguon: 'osm',
      nguonToaDo: `OpenStreetMap · ${el.type}/${el.id}`,
      coChiTiet: false
    };

    moi.push(ban);
    daCo.push({ slug: slug(ten), toaDo: c });
    nhan++;
  }

  thongKe[cfg.moTa] = { nhan, boTen, boTrung, boToaDo, tong: json.elements.length };
  log(`  ${cfg.moTa}: nhận ${nhan} · bỏ ${boTen} tên không dùng được · ` +
      `${boTrung} trùng danh mục · ${boToaDo} không có toạ độ`);
}

/* ─── §6 · BÁO CÁO VÀ GHI ───────────────────────────────────────────────── */

const theoLoai = {};
for (const p of moi) theoLoai[p.loaiHinh] = (theoLoai[p.loaiHinh] ?? 0) + 1;

log('\nỨng viên mới theo loại hình:');
for (const [k, v] of Object.entries(theoLoai).sort((a, b) => b[1] - a[1])) {
  log(`  ${String(v).padStart(5)}  ${k}`);
}

if (!moi.length) { log('\nKhông có ứng viên mới.'); process.exit(0); }

if (DRY) {
  log('\n--dry: không ghi file. Mười ứng viên đầu:');
  for (const p of moi.slice(0, 10)) log(`  ${p.ten}  [${p.loaiHinh}]  ${p.toaDo}`);
  process.exit(0);
}

/* Ứng viên nối vào SAU danh mục đã kiểm, không xen vào giữa, không đụng bản ghi
   nào đang có. Chạy lại lần nữa cũng không sinh trùng vì đã lọc theo tên+vị trí. */
const ketQua = [...chiMuc, ...moi];

mkdirSync(THU_MUC, { recursive: true });
writeFileSync(F_INDEX, JSON.stringify(ketQua, null, 1) + '\n', 'utf8');

const kb = (JSON.stringify(ketQua).length / 1024).toFixed(0);
log(`\n▸ data/projects/index.json · ${ketQua.length} dự án · ${kb} KB ` +
    `(${(JSON.stringify(ketQua).length / ketQua.length).toFixed(0)} byte/dự án)`);
log(`  ${chiMuc.length} giữ nguyên · ${moi.length} thêm mới`);
log('\nMọi bản ghi mới đều mang nhãn "Chưa kiểm". Kiểm chứng trước khi tư vấn khách.');
