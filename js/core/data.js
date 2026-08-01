/**
 * data.js — nạp toàn bộ dữ liệu từ thư mục data/.
 *
 * Không có dữ liệu nào nằm trong mã nguồn. Muốn sửa nội dung thì sửa file JSON
 * hoặc chạy lại công cụ trong tools/, không phải sửa JavaScript.
 *
 * Vì sao có nhánh xử lý riêng cho giao thức file://: trình duyệt chặn fetch
 * sang "tên miền khác", mà mở file thẳng từ ổ đĩa thì mỗi file là một nguồn
 * riêng. Mở kiểu đó sẽ ra trang trắng và không có thông báo gì. Ứng dụng phát
 * hiện trường hợp này và nói rõ bằng tiếng Việt phải làm gì.
 */

import { taiCaiDat } from './store.js';
import { hopLe, trongDaGiac } from './geo.js';

/** Lớp bắt buộc phải có; thiếu là dừng hẳn vì không dựng nổi bản đồ. */
const BAT_BUOC = ['metro', 'stations'];

/**
 * Lớp nạp ngay lúc mở: cần để chấm điểm và hiện hồ sơ dự án.
 * routes + amenities cho khoảng cách, roads cho tiêu chí hạ tầng, boundaries
 * cho phường/xã. Thiếu thì tắt phần liên quan, ứng dụng vẫn chạy.
 */
const NAP_NGAY = ['routes', 'amenities', 'roads', 'boundaries'];

/**
 * Lớp nạp khi người dùng bật lên.
 *
 * Gộp lại chúng chiếm khoảng 1 MB — hơn hai phần ba toàn bộ dữ liệu — mà phần
 * lớn phiên tư vấn không bật tới. Nạp sẵn hết làm lần mở đầu chậm hẳn trên
 * mạng điện thoại, đúng lúc đang ngồi với khách.
 */
const NAP_SAU = ['industrial', 'schools', 'hospitals', 'shopping', 'parks', 'water'];

export const duLieu = {};
/** Lớp nạp hỏng — giao diện dùng để tắt nút bật/tắt tương ứng. */
export const thieu = new Set();
/** Lớp chưa nạp nhưng nạp được — chờ người dùng bật. */
export const chuaNap = new Set(NAP_SAU);

export class LoiFileProtocol extends Error {}

async function tai(ten) {
  const res = await fetch(`data/${ten}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`data/${ten}.json → HTTP ${res.status}`);
  return res.json();
}

export async function napTatCa() {
  if (location.protocol === 'file:') {
    throw new LoiFileProtocol(
      'Đang mở tệp trực tiếp từ ổ đĩa. Trình duyệt chặn đọc dữ liệu ở chế độ này ' +
      'nên bản đồ không nạp được. Mở bằng đường dẫn web, hoặc chạy một máy chủ ' +
      'cục bộ trong thư mục dự án: npx serve'
    );
  }

  const danhSach = [...BAT_BUOC, ...NAP_NGAY];
  const [ketQua] = await Promise.all([
    Promise.allSettled(danhSach.map(ten => tai(ten))),
    napDanhMucDuAn()
  ]);

  for (const [i, r] of ketQua.entries()) {
    const ten = danhSach[i];
    if (r.status === 'fulfilled') duLieu[ten] = r.value;
    else {
      thieu.add(ten);
      console.warn(`Không nạp được lớp "${ten}":`, r.reason?.message);
      if (BAT_BUOC.includes(ten)) throw new Error(`Thiếu dữ liệu bắt buộc: data/${ten}.json`);
    }
  }

  return duLieu;
}

/* ─── Danh mục dự án ────────────────────────────────────────────────────────
   Tách làm hai tầng để chịu được hàng nghìn dự án:

     manifest.json + index.json   chỉ mục gọn, khoảng 220 byte mỗi dự án. Đủ để
                                  vẽ ghim, lọc, tìm kiếm. 5.000 dự án ≈ 1,1 MB
                                  thô, khoảng 150 KB sau khi máy chủ nén.
     chi-tiet/<id>.json           hồ sơ đầy đủ, CHỈ tải khi người dùng mở dự án
                                  đó. Không bao giờ tải hàng nghìn hồ sơ.

   Nạp cả nghìn hồ sơ đầy đủ ngay lúc mở là cách chắc chắn làm ứng dụng chết
   trên điện thoại. Chỉ mục thì lúc nào cũng cần, hồ sơ thì mỗi lần chỉ cần một. */

export const danhMuc = { manifest: null, duAn: [] };

async function napDanhMucDuAn() {
  try {
    danhMuc.manifest = await tai('projects/manifest');
  } catch (err) {
    thieu.add('projects');
    console.warn('Không nạp được data/projects/manifest.json:', err.message);
    throw new Error('Thiếu dữ liệu bắt buộc: data/projects/manifest.json');
  }

  /* Nhiều file chỉ mục thì tải song song rồi gộp — chia mảnh chỉ là chuyện khai
     báo thêm tên file trong manifest, không phải sửa mã. */
  const manh = danhMuc.manifest.chiMuc ?? ['index.json'];
  const ketQua = await Promise.allSettled(
    manh.map(f => tai(`projects/${f.replace(/\.json$/, '')}`))
  );

  const gop = [];
  for (const [i, r] of ketQua.entries()) {
    if (r.status === 'fulfilled') gop.push(...(Array.isArray(r.value) ? r.value : r.value.duAn ?? []));
    else console.warn(`Không nạp được chỉ mục ${manh[i]}:`, r.reason?.message);
  }
  if (!gop.length) throw new Error('Chỉ mục dự án rỗng — kiểm tra data/projects/index.json');

  danhMuc.duAn = gop;
  return gop;
}

/* ─── Hồ sơ đầy đủ, tải theo yêu cầu ────────────────────────────────────── */

const boNhoChiTiet = new Map();

/**
 * Hồ sơ đầy đủ của một dự án.
 *
 * Trả về chính bản ghi chỉ mục nếu dự án chưa có file chi tiết — như vậy giao
 * diện luôn có thứ để vẽ, các trường thiếu hiện "Đang cập nhật" như thường lệ.
 */
export async function chiTietDuAn(id) {
  if (boNhoChiTiet.has(id)) return boNhoChiTiet.get(id);

  const chiMuc = danhMuc.duAn.find(p => p.id === id) ?? null;
  if (!chiMuc?.coChiTiet) {
    boNhoChiTiet.set(id, chiMuc);
    return chiMuc;
  }

  const mau = danhMuc.manifest?.chiTiet ?? 'chi-tiet/{id}.json';
  const duong = `projects/${mau.replace('{id}', id)}`.replace(/\.json$/, '');

  const nap = tai(duong).then(
    json => ({ ...chiMuc, ...json }),
    err => {
      console.warn(`Không nạp được hồ sơ "${id}":`, err.message);
      return chiMuc;   // vẫn hiện được phần có trong chỉ mục
    }
  );
  boNhoChiTiet.set(id, nap);
  const kq = await nap;
  boNhoChiTiet.set(id, kq);
  return kq;
}

/** Xoá bộ nhớ đệm hồ sơ — gọi khi toạ độ ghim tay thay đổi. */
export function quenChiTiet(id) {
  id ? boNhoChiTiet.delete(id) : boNhoChiTiet.clear();
}

/* ─── Bảng tra từ manifest ──────────────────────────────────────────────── */

export const cacLoaiHinh  = () => danhMuc.manifest?.loaiHinh ?? {};
export const cacTrangThai = () => danhMuc.manifest?.trangThai ?? {};
export const cacNguon     = () => danhMuc.manifest?.nguon ?? {};

export const tenLoaiHinh = ma => cacLoaiHinh()[ma]?.nhan ?? '';

/* ─── Nạp theo yêu cầu ────────────────────────────────────────────────────── */

const dangNap = new Map();

/**
 * Nạp một lớp hoãn lại. Gọi nhiều lần cùng lúc vẫn chỉ tải một lần.
 * @returns {Promise<boolean>} true nếu lớp đã sẵn sàng để vẽ.
 */
export async function napLop(ten) {
  if (duLieu[ten]) return true;
  if (thieu.has(ten)) return false;
  if (!chuaNap.has(ten)) return false;

  if (!dangNap.has(ten)) {
    dangNap.set(ten, tai(ten).then(
      json => { duLieu[ten] = json; chuaNap.delete(ten); return true; },
      err => {
        thieu.add(ten); chuaNap.delete(ten);
        console.warn(`Không nạp được lớp "${ten}":`, err.message);
        return false;
      }
    ));
  }
  return dangNap.get(ten);
}

/**
 * Nạp nốt các lớp còn lại ở chế độ nền, sau khi giao diện đã hiện.
 *
 * Mục đích: lần mở đầu nhanh, nhưng chỉ vài giây sau là đủ dữ liệu cho ô tìm
 * kiếm tìm được cả khu công nghiệp, trường học, trung tâm thương mại. Nếu chỉ
 * nạp khi bật lớp thì tìm kiếm sẽ thiếu kết quả mà người dùng không hiểu vì sao.
 *
 * Tải lần lượt chứ không song song, để không tranh băng thông với ảnh nền bản đồ.
 */
export async function napPhanConLai() {
  for (const ten of [...chuaNap]) await napLop(ten);
  return chuaNap.size === 0;
}

/* ─── Trộn danh mục dự án ───────────────────────────────────────────────────
   Ba nguồn, thứ tự ưu tiên từ dưới lên:
     1. data/projects/index.json — danh mục gốc, chung cho mọi máy
     2. ghimTay             — toạ độ người dùng tự ghim, lưu trên máy
     3. duAnRieng           — dự án người dùng tự thêm, lưu trên máy         */

export function tronDuAn() {
  const goc = danhMuc.duAn;
  const { ghimTay, duAnRieng } = taiCaiDat();

  const list = goc.map(p => {
    const ghim = ghimTay[p.id];
    if (!ghim || !hopLe(ghim.c)) return { ...p, nguonGoc: 'chung' };
    /* Ghim tay đè lên toạ độ gốc, kể cả khi gốc đã có toạ độ từ OSM — người
       đứng tại chỗ biết rõ hơn cơ sở dữ liệu. Nhưng phải ghi rõ là ghim tay. */
    return { ...p, nguonGoc: 'chung', toaDo: ghim.c, xacMinh: 'thu-cong',
             nguonToaDo: `Tự ghim lúc ${new Date(ghim.luc).toLocaleString('vi-VN')}`,
             toaDoGoc: p.toaDo ?? null };
  });

  for (const p of duAnRieng) {
    const ghim = ghimTay[p.id];
    list.push({
      ...p,
      nguonGoc: 'rieng',
      toaDo: ghim?.c ?? p.toaDo ?? null,
      xacMinh: (ghim?.c ?? p.toaDo) ? 'thu-cong' : 'chua-ghim'
    });
  }

  /* Thứ tự: hồ sơ đã kiểm → đã ghim vị trí → tên.
     Hồ sơ đã kiểm phải lên đầu, nếu không 11 dự án đang bán sẽ chìm giữa hơn
     một nghìn ứng viên chưa kiểm và người tư vấn phải tìm mới thấy việc của mình. */
  const uuTien = p => (p.nguon === 'osm' ? 1 : 0);
  return list.sort((a, b) =>
    uuTien(a) - uuTien(b) ||
    Number(!a.toaDo) - Number(!b.toaDo) ||
    a.ten.localeCompare(b.ten, 'vi'));
}

/* ─── Tra cứu nhanh ─────────────────────────────────────────────────────── */

export const tienIchCua = id => duLieu.amenities?.duLieu?.[id]?.diem ?? [];

/* ─── Số liệu ga metro ──────────────────────────────────────────────────────
   Hai nguồn, cùng một định dạng:

     data/routes.json   tiền tính bằng tools/build-around.mjs — chính xác nhất,
                        đo tới 8 ga, dùng cho danh mục đã kiểm.
     kho đo tại chỗ     do trình duyệt tự đo khi người dùng mở một dự án chưa
                        được tiền tính. Cần thiết vì danh mục hàng nghìn dự án
                        không thể tiền tính hết.

   Cả hai đều là ĐƯỜNG THẬT qua OSRM. Chỗ lưu nằm ở đây thay vì trong module đo
   để mọi nơi đọc số liệu không phải biết nó đến từ đâu.                     */

const KHO_DO_DAC = 'bds-map-do-dac';

export function docDoDac() {
  try { return JSON.parse(localStorage.getItem(KHO_DO_DAC) ?? '{}'); }
  catch { return {}; }
}

export function ghiDoDac(id, banGhi) {
  try {
    const kho = docDoDac();
    kho[id] = banGhi;
    localStorage.setItem(KHO_DO_DAC, JSON.stringify(kho));
  } catch { /* chế độ riêng tư chặn lưu — vẫn chạy, chỉ là mỗi phiên đo lại */ }
}

export function xoaDoDac() {
  try { localStorage.removeItem(KHO_DO_DAC); } catch { /* không sao */ }
}

/**
 * Số liệu ga metro của một dự án.
 * @param {string|object} duAnHoacId
 */
export function gaCua(duAnHoacId) {
  const id = typeof duAnHoacId === 'string' ? duAnHoacId : duAnHoacId?.id;
  if (!id) return null;

  const tienTinh = duLieu.routes?.duLieu?.[id];
  if (tienTinh) return { ...tienTinh, nguonSo: 'tien-tinh' };

  const nho = docDoDac()[id];
  if (!nho) return null;

  /* Ghim lại chỗ khác thì số đo cũ hết hiệu lực — không được dùng khoảng cách
     của vị trí cũ cho vị trí mới. */
  const p = typeof duAnHoacId === 'object' ? duAnHoacId : danhMuc.duAn.find(x => x.id === id);
  if (p?.toaDo && nho.c && (p.toaDo[0] !== nho.c[0] || p.toaDo[1] !== nho.c[1])) return null;

  return { ...nho, nguonSo: 'do-tai-cho' };
}
export const nhomTienIch = () => duLieu.amenities?.nhom ?? {};
export const cacBanKinh  = () => duLieu.amenities?.banKinh ?? [500, 1000, 2000, 5000];

/**
 * Phường/xã chứa một toạ độ — tra bằng địa giới hành chính, không đoán.
 *
 * Có bước loại nhanh bằng khung bao trước khi chạy phép kiểm điểm-trong-đa-giác.
 * TP.HCM có 168 phường/xã, mỗi phường vài chục tới vài trăm đỉnh; tra thẳng cho
 * 5.000 dự án mất hơn 400 ms và thấy rõ khựng khi mở bảng lọc. So khung bao
 * trước loại được gần hết ngay ở phép so sánh số đơn giản.
 */
let khungBaoPhuong = null;

function dungKhungBao() {
  khungBaoPhuong = [];
  for (const u of duLieu.boundaries?.units ?? []) {
    if (u.level !== 6) continue;
    for (const ring of u.rings) {
      let s = 90, w = 180, n = -90, e = -180;
      for (const [lat, lng] of ring) {
        if (lat < s) s = lat; if (lat > n) n = lat;
        if (lng < w) w = lng; if (lng > e) e = lng;
      }
      khungBaoPhuong.push({ ten: u.name, ring, s, w, n, e });
    }
  }
}

export function phuongXa(c) {
  if (!khungBaoPhuong) dungKhungBao();
  const [lat, lng] = c;
  for (const b of khungBaoPhuong) {
    if (lat < b.s || lat > b.n || lng < b.w || lng > b.e) continue;
    if (trongDaGiac(c, b.ring)) return b.ten;
  }
  return null;
}
