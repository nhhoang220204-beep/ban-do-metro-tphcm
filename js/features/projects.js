/**
 * projects.js — ghim dự án trên bản đồ, chọn dự án, và ghim thủ công.
 *
 * QUY TẮC VỊ TRÍ (đã thống nhất, đừng tự đổi):
 *   Ứng dụng KHÔNG BAO GIỜ tự sinh toạ độ cho một dự án. Toạ độ chỉ đến từ hai
 *   nguồn: đối tượng cùng tên trong OpenStreetMap, hoặc do người dùng tự bấm
 *   lên bản đồ. Dự án chưa có toạ độ vẫn nằm trong danh sách, có nút "Ghim vị
 *   trí", nhưng không xuất hiện trên bản đồ và không được chấm điểm.
 *
 *   Lý do: bản dựng đầu tiên của dự án này tự suy vị trí từ trí nhớ mô hình và
 *   đặt sai tới gần 1 km. Đây là công cụ đưa thông tin tới khách hàng thật.
 */

import { el, toast } from '../core/dom.js';
import { state, set, on, luuGhim, taiCaiDat, luuCaiDat } from '../core/store.js';
import { tronDuAn, tenLoaiHinh, quenChiTiet } from '../core/data.js';
import { hopLe, docToaDo } from '../core/geo.js';
import { locDuAn } from '../core/loc.js';
import { map, bayToi } from '../map/engine.js';
import { ghimDuAn, ghimCum } from '../map/icons.js';
import { popupDuAn } from './popup.js';
import { datToaDoTam, banNhap } from './project-editor.js';

let lop = null;
const markers = new Map();

/** Marker đang vẽ của một dự án — Live Mode dùng để làm nổi dự án đang nói. */
export const markerCua = id => markers.get(id) ?? null;

/* ─── §1 · VẼ GHIM Ở QUY MÔ LỚN ─────────────────────────────────────────────
   Ba lớp bảo vệ để hàng nghìn dự án không làm chết trình duyệt:

     1. Lọc theo khung nhìn — chỉ xét dự án đang nằm trong màn hình.
     2. Gom cụm — dưới mức phóng nhất định, các ghim sát nhau gộp thành một
        vòng tròn ghi số lượng. 3.000 dự án toàn thành phố rút còn vài chục cụm.
     3. Trần số ghim — kể cả khi phóng sát, không bao giờ dựng quá TRAN_GHIM
        nút DOM cùng lúc.

   Mỗi ghim là một nút DOM thật (divIcon có nhãn tên), nên số lượng ghim là thứ
   quyết định độ mượt, không phải số dự án trong bộ nhớ.                     */

/** Từ mức phóng này trở lên thì hiện ghim riêng lẻ, dưới thì gom cụm. */
const ZOOM_TACH_CUM = 15;

/** Cạnh ô gom cụm nhỏ nhất, tính bằng pixel màn hình. */
const O_CUM_PX = 64;

/**
 * Số cụm tối đa nên hiện cùng lúc.
 *
 * Với ô cố định 64px, một màn hình 1280×720 chia ra hơn 200 ô — dự án rải đều
 * thì gần như ô nào cũng có một cụm, nhìn thành một bức tường chấm tròn không
 * đọc được gì. Nới cạnh ô cho tới khi số cụm về mức nhìn ra được chỗ nào dày.
 */
const CUM_TOI_DA = 90;

/** Trần số ghim riêng lẻ dựng cùng lúc. */
const TRAN_GHIM = 300;

export function khoiTaoDuAn() {
  lop = L.layerGroup();
  if (state.lop.duan !== false) lop.addTo(map);
  /* Vẽ lại khi khung nhìn đổi — đây là điều kiện để lọc theo khung nhìn có tác dụng. */
  map.on('moveend zoomend resize', veLai);
  /* whenReady chứ không gọi thẳng: lúc khởi tạo, ô bản đồ có thể chưa được bố
     trí xong nên getBounds() trả về một khung rỗng, lọc theo khung nhìn loại
     sạch mọi dự án và bản đồ trống trơn cho tới lần kéo đầu tiên. */
  map.whenReady(veLai);
  /* Bật/tắt chế độ sửa phải vẽ lại để marker đổi giữa kéo-được/bấm-mở-popup. */
  on('sua-du-an-doi', veLai);
  on('bien-tap-doi', veLai);
}

/** Dự án có toạ độ hợp lệ VÀ lọt bộ lọc đang bật. */
function duAnHienThi() {
  return locDuAn().filter(p => hopLe(p.toaDo));
}

export function veLai() {
  if (!lop) return;
  lop.clearLayers();
  markers.clear();

  const trongKhung = duAnHienThi().filter(p => map.getBounds().pad(0.3).contains(p.toaDo));

  if (map.getZoom() < ZOOM_TACH_CUM && trongKhung.length > 24) {
    veCum(trongKhung);
    return;
  }

  /* Dự án đang chọn và dự án trong bảng so sánh luôn được vẽ, kể cả khi vượt
     trần — chúng là thứ người dùng đang nhìn. */
  const uuTien = trongKhung.filter(p => p.id === state.chon || state.soSanh.includes(p.id));
  const conLai = trongKhung.filter(p => !uuTien.includes(p));
  for (const p of [...uuTien, ...conLai.slice(0, TRAN_GHIM - uuTien.length)]) veMotGhim(p);
}

function veMotGhim(p) {
  const thuTu = state.soSanh.indexOf(p.id);
  /* Kéo được khi Chế độ biên tập GIS đang mở form sửa đúng dự án này — xem
     project-editor.js. Kéo chỉ cập nhật bản nháp, chưa ghi file cho tới khi
     bấm "Lưu" trong sidebar. */
  const coTheKeo = state.bienTap && state.suaDuAn && state.chon === p.id;
  /* Vẽ marker đang sửa theo TOẠ ĐỘ BẢN NHÁP, không phải toạ độ đã lưu — nếu
     không, mỗi lần kéo xong bản đồ vẽ lại (moveend/sua-du-an-doi) sẽ kéo
     marker bật ngược về vị trí cũ vì dữ liệu gốc chưa đổi cho tới khi Lưu. */
  const toaDo = coTheKeo ? (banNhap()?.toaDo ?? p.toaDo) : p.toaDo;
  const m = L.marker(toaDo, {
    icon: ghimDuAn(p, { active: state.chon === p.id, thuTuSoSanh: thuTu >= 0 ? thuTu + 1 : 0 }),
    zIndexOffset: state.chon === p.id ? 1000 : 500,
    riseOnHover: true,
    draggable: coTheKeo
  });
  m.on('click', () => { if (!coTheKeo) chonDuAn(p.id, { bay: false }); });
  if (coTheKeo) {
    m.on('dragend', () => {
      const c = m.getLatLng();
      datToaDoTam([+c.lat.toFixed(6), +c.lng.toFixed(6)]);
    });
  } else {
    m.bindPopup(() => popupDuAn(p), { maxWidth: 320, autoPanPadding: [24, 80] });
  }
  m.addTo(lop);
  markers.set(p.id, m);
}

/**
 * Gom theo lưới pixel chứ không theo lưới toạ độ: ô toạ độ cố định thì ở mức
 * phóng nhỏ mỗi ô to bằng cả quận, còn ở mức lớn thì lại vụn ra vô nghĩa.
 * Lưới pixel luôn cho cụm có kích thước nhìn thấy như nhau ở mọi mức phóng.
 */
function veCum(danhSach) {
  /* Chiếu sẵn một lần rồi mới thử các cạnh ô — chiếu lại cho mỗi lần thử là
     lãng phí, và với vài nghìn điểm thì thấy rõ. */
  const diem = danhSach.map(p => ({ p, px: map.project(p.toaDo, map.getZoom()) }));

  let o;
  for (let canh = O_CUM_PX; ; canh *= 1.6) {
    o = new Map();
    for (const { p, px } of diem) {
      const khoa = `${Math.floor(px.x / canh)}|${Math.floor(px.y / canh)}`;
      if (!o.has(khoa)) o.set(khoa, []);
      o.get(khoa).push(p);
    }
    if (o.size <= CUM_TOI_DA || canh > 600) break;
  }

  for (const nhom of o.values()) {
    if (nhom.length === 1) { veMotGhim(nhom[0]); continue; }

    /* Đặt cụm ở tâm các dự án trong ô, không đặt ở tâm ô — nhìn đúng chỗ hơn. */
    const tam = [
      nhom.reduce((a, p) => a + p.toaDo[0], 0) / nhom.length,
      nhom.reduce((a, p) => a + p.toaDo[1], 0) / nhom.length
    ];

    const dem = {};
    for (const p of nhom) dem[p.loaiHinh] = (dem[p.loaiHinh] ?? 0) + 1;
    const tomTat = Object.entries(dem)
      .sort((a, b) => b[1] - a[1])
      .map(([ma, n]) => `${tenLoaiHinh(ma) || 'Chưa phân loại'}: ${n}`)
      .join('<br>');

    L.marker(tam, { icon: ghimCum(nhom.length), zIndexOffset: 100 })
      .bindTooltip(`<b>${nhom.length} dự án</b><br>${tomTat}`, { direction: 'top' })
      /* Bấm vào cụm thì phóng vào vừa khít các dự án trong đó. */
      .on('click', () => map.flyToBounds(L.latLngBounds(nhom.map(p => p.toaDo)),
                                         { padding: [60, 60], maxZoom: ZOOM_TACH_CUM + 1 }))
      .addTo(lop);
  }
}

export function hienLopDuAn(bat) {
  if (!lop) return;
  bat ? lop.addTo(map) : map.removeLayer(lop);
}

/* ─── §2 · CHỌN DỰ ÁN ───────────────────────────────────────────────────── */

export function chonDuAn(id, { bay = true, moPopup = false } = {}) {
  const p = state.duAn.find(x => x.id === id);
  if (!p) return;

  set({ chon: id, tab: 'thong-tin' }, 'chon-doi');
  ghiNhoDaXem(id);
  veLai();

  if (hopLe(p.toaDo)) {
    if (bay) bayToi(p.toaDo, Math.max(map.getZoom(), 15));
    if (moPopup) markers.get(id)?.openPopup();
  }
}

export function boChon() {
  set({ chon: null }, 'chon-doi');
  map.closePopup();
  veLai();
}

/** Danh sách xem gần đây, để mở lại nhanh khi đang tư vấn nhiều khách. */
function ghiNhoDaXem(id) {
  const truoc = taiCaiDat().xemGanDay.filter(x => x !== id);
  luuCaiDat({ xemGanDay: [id, ...truoc].slice(0, 8) });
}

/* ─── §3 · GHIM THỦ CÔNG ────────────────────────────────────────────────────
   Bấm "Ghim vị trí" → bản đồ chuyển sang con trỏ chữ thập → bấm một điểm →
   lưu vào máy. Không có bước nào ứng dụng tự chọn điểm giúp.               */

let huyGhim = null;

export function batDauGhim(id) {
  const p = state.duAn.find(x => x.id === id);
  if (!p) return;

  ketThucGhim();
  set({ ghim: id }, 'ghim-doi');
  document.querySelector('.app').dataset.pinning = '';

  const thanh = el('div.pinbar', {}, [
    el('span', {}, `Bấm lên bản đồ để đặt vị trí "${p.ten}"`),
    el('button.btn.btn--sm', { type: 'button', onclick: () => ketThucGhim() }, 'Huỷ')
  ]);
  document.querySelector('.app').append(thanh);

  const nhan = ev => {
    const c = [+ev.latlng.lat.toFixed(5), +ev.latlng.lng.toFixed(5)];
    if (!hopLe(c)) return toast('Toạ độ nằm ngoài phạm vi cho phép', 'bad');
    luuGhim(id, c);
    quenChiTiet(id);
    set({ duAn: tronDuAn(), ghim: null }, 'du-an-doi');
    ketThucGhim();
    veLai();
    chonDuAn(id, { bay: false });
    toast(`Đã ghim "${p.ten}". Chạy lại tools/build-around.mjs để đo tiện ích và ga metro quanh điểm này.`, 'ok', 6000);
  };

  map.on('click', nhan);
  huyGhim = () => { map.off('click', nhan); thanh.remove(); };
}

/**
 * Ghim bằng toạ độ dán từ Google Maps.
 *
 * Chính xác hơn hẳn bấm tay lên bản đồ: bấm tay ở mức phóng 15 sai vài chục
 * mét, còn toạ độ chép từ Google Maps đúng tới từng mét.
 *
 * ⚠ Ô nhập phải là type="text" kèm inputmode="decimal". Để type="number" thì
 * dán chuỗi "10.98, 106.65" vào bị trình duyệt xoá trắng vì không phải một số.
 */
export function ghimTheoToaDo(id, text) {
  const p = state.duAn.find(x => x.id === id);
  if (!p) return false;

  const c = docToaDo(text);
  if (!c) {
    toast('Không đọc được toạ độ. Dán dạng "10.9705, 106.6845" — vĩ độ trước, kinh độ sau.', 'bad', 5000);
    return false;
  }
  /* BR-2 · chặn toạ độ ngoài vùng. Lỗi hay gặp nhất là đảo hai cột, nên gợi ý
     thẳng khả năng đó thay vì chỉ báo "không hợp lệ". */
  if (!hopLe(c)) {
    const daoLai = hopLe([c[1], c[0]]);
    toast(daoLai
      ? `Toạ độ ngoài phạm vi. Có phải bạn đảo nhầm thứ tự? Thử "${c[1]}, ${c[0]}".`
      : `Toạ độ ${c.join(', ')} nằm ngoài khu vực TP.HCM và vùng lân cận.`, 'bad', 6000);
    return false;
  }

  luuGhim(id, c);
  quenChiTiet(id);
  set({ duAn: tronDuAn() }, 'du-an-doi');
  veLai();
  chonDuAn(id, { bay: true });
  toast(`Đã ghim "${p.ten}" tại ${c.join(', ')}. Chạy lại tools/build-around.mjs để đo tiện ích và ga metro.`, 'ok', 6000);
  return true;
}

export function ketThucGhim() {
  huyGhim?.();
  huyGhim = null;
  delete document.querySelector('.app').dataset.pinning;
  if (state.ghim) set({ ghim: null }, 'ghim-doi');
}

/** Bỏ ghim thủ công, trả dự án về toạ độ gốc (nếu có) hoặc về trạng thái chưa ghim. */
export function xoaGhim(id) {
  luuGhim(id, null);
  quenChiTiet(id);
  set({ duAn: tronDuAn() }, 'du-an-doi');
  veLai();
  toast('Đã bỏ ghim thủ công', 'info');
}

/* ─── §4 · BẢNG SO SÁNH ─────────────────────────────────────────────────── */

export const TOI_DA_SO_SANH = 3;

export function themSoSanh(id) {
  if (state.soSanh.includes(id)) return boSoSanh(id);
  if (state.soSanh.length >= TOI_DA_SO_SANH) {
    return toast(`Chỉ so sánh được tối đa ${TOI_DA_SO_SANH} dự án cùng lúc`, 'warn');
  }
  set({ soSanh: [...state.soSanh, id] }, 'so-sanh-doi');
  veLai();
}

export function boSoSanh(id) {
  set({ soSanh: state.soSanh.filter(x => x !== id) }, 'so-sanh-doi');
  veLai();
}

export function xoaSoSanh() {
  set({ soSanh: [] }, 'so-sanh-doi');
  veLai();
}
