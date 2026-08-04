/**
 * project-editor.js — Project Edit Mode: sửa/thêm/xoá dự án BĐS trực tiếp,
 * phần của Chế độ biên tập GIS (xem gis-editor.js).
 *
 * Công cụ nội bộ để Hoàng tự dựng danh mục — KHÔNG áp QĐ-1 (chỉ vẽ dữ liệu
 * xác minh) cho việc NHẬP liệu ở đây, vì đây chính là nơi Hoàng NHẬP dữ liệu
 * xác minh vào hệ thống. Lưu ghi thẳng xuống data/projects/index.json và
 * data/projects/chi-tiet/<id>.json qua máy chủ cục bộ (xem core/luu-local.js)
 * — chỉ chạy khi mở app bằng `node tools/serve.mjs`.
 *
 * Dự án MỚI chỉ được tạo với loaiHinh nằm trong manifest.json (Chung cư, Căn
 * hộ, Nhà phố, Nhà phố thương mại, Shophouse, Biệt thự, Khu đô thị) — không
 * còn lựa chọn nào khác trong <select>, nhờ vậy không cần lọc lại sau này.
 */

import { el, toast } from '../core/dom.js';
import { state, set, on, emit } from '../core/store.js';
import { danhMuc, tronDuAn, quenChiTiet, cacLoaiHinh, cacTrangThai } from '../core/data.js';
import { luuFile, xoaFile } from '../core/luu-local.js';
import { map } from '../map/engine.js';
import { hopLe } from '../core/geo.js';

/** Trường thuộc chỉ mục index.json — phần còn lại chỉ nằm trong chi-tiet/<id>.json. */
const TRUONG_CHI_MUC = ['id', 'ma', 'ten', 'loaiHinh', 'toaDo', 'xacMinh', 'trangThai',
  'chuDauTu', 'giaTu', 'donViGia', 'nguon', 'coChiTiet', 'nguonToaDo'];

const DON_VI_GIA = ['trđ/m²', 'trđ/căn'];

let nhap = null; // bản nháp đang sửa — clone của dự án hiện tại, mất khi Huỷ/Lưu

export const dangSua = () => state.suaDuAn;
export const banNhap = () => nhap;

/* ─── §1 · BẮT ĐẦU / HUỶ SỬA ────────────────────────────────────────────── */

export function batDauSua(p) {
  if (!state.bienTap) return;
  nhap = structuredClone(p);
  set({ suaDuAn: true }, 'sua-du-an-doi');
}

export function huySua() {
  nhap = null;
  set({ suaDuAn: false }, 'sua-du-an-doi');
}

/** Gọi từ projects.js khi kéo marker trong lúc đang sửa — cập nhật bản nháp, không lưu ngay. */
export function datToaDoTam(c) {
  if (!nhap) return;
  nhap.toaDo = c;
  set({}, 'sua-du-an-doi'); // chỉ để sidebar vẽ lại ô lat/lng, không đổi trạng thái
}

export function datTruong(key, value) {
  if (!nhap) return;
  nhap[key] = value;
}

/* ─── §2 · LƯU ──────────────────────────────────────────────────────────── */

export async function luuSua() {
  if (!nhap) return false;
  if (!nhap.ten?.trim()) { toast('Tên dự án không được để trống', 'warn'); return false; }
  if (nhap.toaDo && !hopLe(nhap.toaDo)) { toast('Toạ độ nằm ngoài phạm vi cho phép', 'warn'); return false; }

  nhap.coChiTiet = true;

  const chiMuc = {};
  for (const k of TRUONG_CHI_MUC) if (nhap[k] !== undefined) chiMuc[k] = nhap[k];

  const list = danhMuc.duAn;
  const idx = list.findIndex(x => x.id === nhap.id);
  if (idx === -1) list.push(chiMuc); else list[idx] = chiMuc;

  const okIndex = await luuFile('projects-index', list, { imMang: true });
  const okChiTiet = await luuFile('projects-chi-tiet', nhap, { id: nhap.id, imMang: true });

  if (!okIndex || !okChiTiet) {
    toast('Không lưu được xuống file — chỉ hoạt động khi chạy "node tools/serve.mjs" trên máy.', 'warn', 7000);
    return false;
  }

  const idDaLuu = nhap.id;
  quenChiTiet(idDaLuu);
  set({ duAn: tronDuAn() }, 'du-an-doi');
  toast(`Đã lưu "${nhap.ten}"`, 'ok');
  nhap = null;
  set({ suaDuAn: false }, 'sua-du-an-doi');
  /* sidebar.js giữ bản hồ sơ đầy đủ (dayDu) trong biến cục bộ, không tự đọc
     lại chỉ vì danh mục đổi — phải báo riêng để nó tải lại đúng dự án vừa lưu,
     nếu không hồ sơ vẫn hiện dữ liệu cũ dù file đã ghi đúng. */
  emit('du-an-luu-xong', idDaLuu);
  return true;
}

/* ─── §3 · XOÁ ──────────────────────────────────────────────────────────── */

let choXacNhanXoa = null;

/** Bấm lần 1 để hỏi lại, bấm lần 2 trong 4 giây mới thực sự xoá — không dùng confirm() của trình duyệt. */
export function xacNhanXoa(id, onCanXacNhan) {
  if (choXacNhanXoa === id) {
    clearTimeout(choXacNhanXoa.t);
    choXacNhanXoa = null;
    xoaDuAn(id);
    return;
  }
  choXacNhanXoa = id;
  onCanXacNhan?.();
  setTimeout(() => { if (choXacNhanXoa === id) choXacNhanXoa = null; }, 4000);
}

export const dangChoXacNhanXoa = id => choXacNhanXoa === id;

async function xoaDuAn(id) {
  const list = danhMuc.duAn;
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return;
  const p = list[idx];
  list.splice(idx, 1);

  const okIndex = await luuFile('projects-index', list, { imMang: true });
  if (p.coChiTiet) await xoaFile('projects-chi-tiet', id);

  if (!okIndex) { toast('Không xoá được — chưa ghi xuống file.', 'warn', 6000); return; }

  quenChiTiet(id);
  nhap = null;
  set({ suaDuAn: false, chon: null }, 'chon-doi');
  set({ duAn: tronDuAn() }, 'du-an-doi');
  toast(`Đã xoá "${p.ten}"`, 'info');
}

/* ─── §4 · THÊM DỰ ÁN MỚI ───────────────────────────────────────────────── */

let huyThemMoi = null;

export function themDuAnMoi() {
  if (!state.bienTap) return;
  huyThemMoi?.();
  toast('Bấm lên bản đồ để đặt vị trí dự án mới', 'info', 5000);

  const nhan = ev => {
    const c = [+ev.latlng.lat.toFixed(5), +ev.latlng.lng.toFixed(5)];
    if (!hopLe(c)) { toast('Toạ độ nằm ngoài phạm vi cho phép', 'warn'); return; }
    huyThemMoi = null;

    const id = 'du-an-moi-' + Date.now().toString(36);
    const loaiMacDinh = Object.keys(cacLoaiHinh())[0] ?? 'chung-cu';
    const moi = {
      id, ma: '', ten: 'Dự án mới — bấm Sửa để đặt tên', loaiHinh: loaiMacDinh,
      toaDo: c, xacMinh: 'thu-cong', trangThai: 'chua-ro', chuDauTu: '',
      giaTu: null, donViGia: 'trđ/m²', nguon: 'thu-cong', coChiTiet: false,
      nguonToaDo: `Tự thêm qua Chế độ biên tập lúc ${new Date().toLocaleString('vi-VN')}`
    };
    danhMuc.duAn.push(moi);
    set({ duAn: tronDuAn() }, 'du-an-doi');
    /* Mở hồ sơ và vào thẳng chế độ sửa để Hoàng điền thông tin ngay. */
    set({ chon: id, tab: 'thong-tin' }, 'chon-doi');
    batDauSua(moi);
    toast('Đã đặt marker. Điền thông tin rồi bấm "Lưu".', 'ok', 5000);
  };

  map.once('click', nhan);
  huyThemMoi = () => map.off('click', nhan);
}

on('bien-tap-doi', () => { if (!state.bienTap) { huyThemMoi?.(); huyThemMoi = null; huySua(); } });

/* Chuyển sang xem dự án khác trong lúc đang sửa dở dự án này — thoát sửa để
   không hiện nhầm bản nháp cũ lên hồ sơ mới. Không tự lưu — coi như Huỷ. */
on('chon-doi', () => { if (nhap && nhap.id !== state.chon) huySua(); });

export const NHAN_LOAI_HINH = () => cacLoaiHinh();
export const NHAN_TRANG_THAI = () => cacTrangThai();
export const DS_DON_VI_GIA = DON_VI_GIA;
