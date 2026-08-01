/**
 * score.js — chấm điểm dự án.
 *
 * NGUYÊN TẮC: mỗi điểm thành phần phải truy ngược được về dữ liệu đo đạc thật.
 * Tiêu chí nào thiếu đầu vào thì trả null và giao diện hiện "Đang cập nhật" —
 * không hạ xuống 5/10 cho đủ hình, cũng không lấy điểm tiêu chí khác lấp vào.
 * Điểm tổng chỉ tính trên các tiêu chí có đủ dữ liệu, và luôn kèm số tiêu chí
 * đã chấm được để người tư vấn biết điểm đó dựa trên bao nhiêu phần thông tin.
 *
 * Đây là thang tham khảo do công cụ tính, không phải thẩm định giá.
 */

import { duLieu, tienIchCua, gaCua } from '../core/data.js';
import { distToShape } from '../core/geo.js';
import { co } from '../core/format.js';

/* ─── §1 · KHAI BÁO TIÊU CHÍ ────────────────────────────────────────────── */

export const TIEU_CHI = [
  { id: 'metro',      nhan: 'Metro',              trong: 1.15 },
  { id: 'haTang',     nhan: 'Hạ tầng',            trong: 1.10 },
  { id: 'tienIch',    nhan: 'Tiện ích',           trong: 1.00 },
  { id: 'choThue',    nhan: 'Khả năng cho thuê',  trong: 1.05 },
  { id: 'tangGia',    nhan: 'Khả năng tăng giá',  trong: 1.15 },
  { id: 'anCu',       nhan: 'An cư',              trong: 1.00 },
  { id: 'dauTu',      nhan: 'Đầu tư',             trong: 1.10 },
  { id: 'thanhKhoan', nhan: 'Thanh khoản',        trong: 0.95 }
];

/** Nội suy tuyến tính trên một bảng mốc [ngưỡng, điểm] xếp tăng dần. */
function theoMoc(x, moc) {
  if (x <= moc[0][0]) return moc[0][1];
  if (x >= moc.at(-1)[0]) return moc.at(-1)[1];
  for (let i = 0; i < moc.length - 1; i++) {
    const [x1, y1] = moc[i], [x2, y2] = moc[i + 1];
    if (x >= x1 && x <= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return moc.at(-1)[1];
}

const kep = n => Math.max(0, Math.min(10, n));

/* ─── §2 · TIÊU CHÍ METRO ───────────────────────────────────────────────────
   Đầu vào: khoảng cách ĐI BỘ THẬT tới ga gần nhất + tình trạng tuyến chạy qua
   ga đó. Ga quy hoạch trên giấy không đáng giá bằng ga đang chạy tàu.       */

const HE_SO_TRANG_THAI = { operating: 1, construction: 0.85, preparing: 0.7, planned: 0.55 };

function chamMetro(duAn) {
  const r = gaCua(duAn);
  const ga = r?.gaGanNhat;
  if (!ga) return { diem: null, vi: 'Chưa đo được đường tới ga metro nào' };

  /* Đi bộ chỉ là cách tiếp cận thật khi quãng đường còn đi bộ nổi. Quá ngưỡng
     này thì thực tế ai cũng đi xe, nên chấm theo quãng đi xe — nói "đi bộ 4,9
     km, 66 phút" với khách là nói một con số không ai dùng. */
  const DI_BO_TOI_DA = 2500;
  const coBo = !!ga.diBo && ga.diBo.m <= DI_BO_TOI_DA;
  const leg = coBo ? ga.diBo : (ga.diXe ?? ga.diBo);
  if (!leg) return { diem: null, vi: 'Chưa đo được đường tới ga metro nào' };
  const base = theoMoc(leg.m, coBo
    ? [[400, 10], [800, 9], [1200, 8], [2000, 6.5], [3000, 5], [5000, 3.5], [8000, 1.5]]
    : [[800, 9], [1500, 8], [2500, 6.5], [4000, 5], [7000, 3.5], [12000, 1.5]]);

  /* Ga trung chuyển nhiều tuyến thì giá trị đi lại cao hơn hẳn. */
  const tuyen = (ga.lines ?? []).map(id => duLieu.metro.lines.find(l => l.id === id)).filter(Boolean);
  const heSo = Math.max(...tuyen.map(l => HE_SO_TRANG_THAI[l.status] ?? 0.55), 0.55);
  const thuongDoi = tuyen.length > 1 ? 0.4 : 0;

  const tot = tuyen.reduce((a, l) => (HE_SO_TRANG_THAI[l.status] > (HE_SO_TRANG_THAI[a?.status] ?? 0) ? l : a), null);

  return {
    diem: kep(base * heSo + thuongDoi),
    vi: `Ga ${ga.name} · ${coBo ? 'đi bộ' : 'đi xe'} ${fmtM(leg.m)}, ${Math.round(leg.giay / 60)} phút` +
        (tot ? ` · ${tot.name} ${nhanTrangThai(tot.status)}` : '') +
        (tuyen.length > 1 ? ` · ga trung chuyển ${tuyen.length} tuyến` : '')
  };
}

const fmtM = m => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
const nhanTrangThai = s => duLieu.metro.trangThai[s]?.nhan?.toLowerCase() ?? s;

/* ─── §3 · TIÊU CHÍ HẠ TẦNG ─────────────────────────────────────────────────
   Đo tới CẠNH của hình tuyến đường bộ, không phải tới đỉnh. Con số này chỉ
   dùng để chấm điểm và xếp hạng gần/xa, không hiển thị ra như khoảng cách di
   chuyển — muốn nói quãng đường với khách thì lấy số trong tab Metro.       */

const HANG_TRUC = { ring: 'Vành đai', expressway: 'Cao tốc', highway: 'Quốc lộ' };

function chamHaTang(duAn) {
  if (!duLieu.roads) return { diem: null, vi: 'Chưa có dữ liệu đường bộ' };

  const gan = [];
  for (const r of duLieu.roads.roads) {
    const d = distToShape(duAn.toaDo, r.shape);
    if (d <= 5000) gan.push({ ten: r.name, kind: r.kind, d });
  }
  if (!gan.length) return { diem: 1.5, vi: 'Không có vành đai, cao tốc hay quốc lộ nào trong 5 km' };

  gan.sort((a, b) => a.d - b.d);
  const base = theoMoc(gan[0].d, [[600, 10], [1200, 8.7], [2000, 7.4], [3000, 6], [5000, 4.2]]);

  /* Nhiều trục khác nhau trong bán kính = nhiều hướng thoát, cộng thêm chút. */
  const soLoai = new Set(gan.map(g => g.kind)).size;
  const trong3km = gan.filter(g => g.d <= 3000);
  const ten = [...new Map(trong3km.map(g => [g.ten, g])).values()].slice(0, 3).map(g => g.ten);

  return {
    diem: kep(base + (soLoai - 1) * 0.45),
    vi: ten.length
      ? `Trong 3 km: ${ten.join(' · ')}`
      : `Trục gần nhất: ${gan[0].ten} (${HANG_TRUC[gan[0].kind]})`
  };
}

/* ─── §4 · TIÊU CHÍ TIỆN ÍCH ────────────────────────────────────────────────
   Đếm theo nhóm tiện ích có mặt trong 2 km ĐƯỜNG THẬT. Đếm theo nhóm chứ
   không theo tổng số điểm: 40 quán cà phê không bằng có đủ trường, chợ,
   bệnh viện, ngân hàng.                                                     */

const NGUONG_TIEN_ICH = 2000;

function chamTienIch(duAn) {
  const diem = tienIchCua(duAn.id);
  if (!diem.length) return { diem: null, vi: 'Chưa tải tiện ích quanh dự án' };

  const nhom = duLieu.amenities?.nhom ?? {};
  const tongNhom = Object.keys(nhom).length || 13;
  const cheDo = new Set();
  let trongNguong = 0;

  for (const d of diem) {
    const m = d.diXe?.m ?? d.diBo?.m;
    if (m != null && m <= NGUONG_TIEN_ICH) { cheDo.add(d.nhom); trongNguong++; }
  }
  if (!cheDo.size) return { diem: 1.5, vi: `Không có nhóm tiện ích nào trong ${NGUONG_TIEN_ICH / 1000} km` };

  const phu = (cheDo.size / tongNhom) * 8.2;
  const day = theoMoc(trongNguong, [[3, 0], [10, 0.8], [25, 1.4], [50, 1.8]]);

  return {
    diem: kep(phu + day),
    vi: `${cheDo.size}/${tongNhom} nhóm tiện ích có mặt trong ${NGUONG_TIEN_ICH / 1000} km · ${trongNguong} điểm`
  };
}

/* ─── §5 · KHẢ NĂNG CHO THUÊ ────────────────────────────────────────────────
   Nguồn cầu thuê ở trục Bình Dương chủ yếu là công nhân và chuyên gia khu
   công nghiệp, kế đến là sinh viên. Chấm theo số khu công nghiệp và cơ sở đào
   tạo trong 5 km, cộng phần đi lại bằng metro.                              */

function chamChoThue(duAn, phanMetro) {
  const diem = tienIchCua(duAn.id);
  if (!diem.length) return { diem: null, vi: 'Chưa tải tiện ích quanh dự án' };

  const trong5km = d => (d.diXe?.m ?? Infinity) <= 5000;
  const kcn = diem.filter(d => d.nhom === 'kcn' && trong5km(d)).length;
  const daoTao = diem.filter(d => d.nhom === 'giao-duc' && trong5km(d)).length;
  const anUong = diem.filter(d => ['an-uong', 'cafe', 'sieu-thi'].includes(d.nhom) && trong5km(d)).length;

  const dKcn    = theoMoc(kcn,    [[0, 1.5], [1, 5], [2, 6.8], [4, 8.3], [8, 9.5]]);
  const dDaoTao = theoMoc(daoTao, [[0, 0], [2, 0.6], [6, 1.1], [12, 1.5]]);
  const dSong   = theoMoc(anUong, [[0, 0], [5, 0.4], [15, 0.8], [30, 1.1]]);
  const dMetro  = phanMetro.diem != null ? phanMetro.diem * 0.12 : 0;

  return {
    diem: kep(dKcn * 0.72 + dDaoTao + dSong + dMetro),
    vi: `Trong 5 km: ${kcn} khu công nghiệp · ${daoTao} cơ sở giáo dục · ${anUong} điểm ăn uống, cà phê, siêu thị`
  };
}

/* ─── §6 · KHẢ NĂNG TĂNG GIÁ ────────────────────────────────────────────────
   Chấm theo hạ tầng SẮP hình thành chứ không phải hạ tầng đã có: tuyến metro
   đang thi công hoặc chuẩn bị khởi công đi ngang, và trục vành đai gần đó.
   Nơi đã đủ đầy hết rồi thì phần tăng thêm ít hơn nơi đang thay đổi.        */

function chamTangGia(duAn, phanMetro, phanTienIch) {
  const r = gaCua(duAn);
  if (!r?.cacGa?.length) return { diem: null, vi: 'Chưa đo được đường tới ga metro nào' };

  /* Tuyến sắp có trong 3 km đường xe — phần dư địa rõ ràng nhất. */
  const sapCo = new Map();
  for (const ga of r.cacGa) {
    if ((ga.diXe?.m ?? Infinity) > 3000) continue;
    for (const id of ga.lines ?? []) {
      const line = duLieu.metro.lines.find(l => l.id === id);
      if (line && (line.status === 'construction' || line.status === 'preparing')) sapCo.set(id, line);
    }
  }

  const dSapCo = theoMoc(sapCo.size, [[0, 0], [1, 3.4], [2, 4.6], [3, 5.2]]);
  const dDangChay = phanMetro.diem != null ? phanMetro.diem * 0.28 : 0;

  /* Vành đai và cao tốc mở ra thì vùng ven hưởng lợi nhiều hơn vùng lõi. */
  let dVanhDai = 0, tenVanhDai = null;
  if (duLieu.roads) {
    const vd = duLieu.roads.roads
      .filter(x => x.kind === 'ring' || x.kind === 'expressway')
      .map(x => ({ ten: x.name, d: distToShape(duAn.toaDo, x.shape) }))
      .sort((a, b) => a.d - b.d)[0];
    if (vd && vd.d <= 6000) { dVanhDai = theoMoc(vd.d, [[1000, 2.2], [3000, 1.5], [6000, 0.6]]); tenVanhDai = vd.ten; }
  }

  /* Nơi tiện ích còn mỏng thì dư địa cải thiện lớn hơn — nhưng chỉ cộng nhẹ,
     vì mỏng cũng có thể là do vùng đó vốn ít người ở. */
  const duDia = phanTienIch.diem != null ? theoMoc(phanTienIch.diem, [[3, 1.2], [6, 0.7], [9, 0.2]]) : 0;

  const moTa = [];
  if (sapCo.size) moTa.push(`${sapCo.size} tuyến metro đang thi công hoặc chuẩn bị khởi công trong 3 km`);
  if (tenVanhDai) moTa.push(`gần ${tenVanhDai}`);
  if (!moTa.length) moTa.push('Chưa thấy hạ tầng lớn nào đang hình thành trong bán kính gần');

  return { diem: kep(dSapCo + dDangChay + dVanhDai + duDia), vi: moTa.join(' · ') };
}

/* ─── §7 · AN CƯ ────────────────────────────────────────────────────────────
   Ưu tiên thứ người ở thật cần hằng ngày trong 2 km, và trừ điểm nếu sát khu
   công nghiệp — tiếng ồn, xe tải, không khí.                                */

function chamAnCu(duAn) {
  const diem = tienIchCua(duAn.id);
  if (!diem.length) return { diem: null, vi: 'Chưa tải tiện ích quanh dự án' };

  const trong = (nhom, m) => diem.filter(d => d.nhom === nhom && (d.diXe?.m ?? Infinity) <= m).length;

  const truong  = trong('giao-duc', 2000);
  const yTe     = trong('y-te', 2000);
  const cho     = trong('sieu-thi', 2000) + trong('mall', 2000);
  const cay     = trong('cong-vien', 2000);
  const kcnGan  = trong('kcn', 1000);

  const d =
    theoMoc(truong, [[0, 0], [2, 1.8], [5, 2.6], [10, 3.1]]) +
    theoMoc(yTe,    [[0, 0], [1, 1.4], [3, 2.1], [7, 2.5]]) +
    theoMoc(cho,    [[0, 0], [1, 1.2], [4, 1.9], [9, 2.3]]) +
    theoMoc(cay,    [[0, 0], [1, 1.1], [3, 1.7], [6, 2.1]]);

  const tru = theoMoc(kcnGan, [[0, 0], [1, 1.2], [3, 2.1]]);

  const ghi = `Trong 2 km: ${truong} trường · ${yTe} cơ sở y tế · ${cho} siêu thị, trung tâm thương mại · ${cay} công viên`;
  return { diem: kep(d - tru), vi: kcnGan ? `${ghi} · trừ điểm vì có ${kcnGan} khu công nghiệp trong 1 km` : ghi };
}

/* ─── §8 · THANH KHOẢN ──────────────────────────────────────────────────────
   Thanh khoản phụ thuộc pháp lý, mặt bằng giá và quy mô nguồn hàng. Ba thứ đó
   phải do người nhập, công cụ không đo được từ bản đồ. Thiếu thì trả null —
   đây là chỗ dễ bịa số nhất nên tuyệt đối không đoán.                       */

function chamThanhKhoan(duAn, phanMetro, phanTienIch) {
  const thieu = [];
  if (!co(duAn.phapLy)) thieu.push('pháp lý');
  if (!co(duAn.giaTu) && !co(duAn.giaTrungBinh)) thieu.push('giá');
  if (!co(duAn.tongSoCan)) thieu.push('tổng số căn');
  if (thieu.length) return { diem: null, vi: `Cần bổ sung: ${thieu.join(', ')}` };

  const soCan = parseInt(String(duAn.tongSoCan).replace(/\D/g, ''), 10);
  const phapLyTot = /sổ hồng|sổ đỏ|đã có sổ|cấp sổ/i.test(duAn.phapLy);

  /* Nguồn hàng quá lớn thì hàng ra nhiều, cạnh tranh bán lại cao hơn. */
  const dQuyMo = Number.isFinite(soCan)
    ? theoMoc(soCan, [[100, 8], [400, 8.6], [900, 7.6], [2000, 6.4], [4000, 5.2]])
    : 6.5;

  const dViTri = ((phanMetro.diem ?? 5) + (phanTienIch.diem ?? 5)) / 2;

  return {
    diem: kep(dQuyMo * 0.35 + dViTri * 0.45 + (phapLyTot ? 2 : 0.9)),
    vi: `${duAn.phapLy} · ${duAn.tongSoCan} căn`
  };
}

/* ─── §9 · TỔNG HỢP ─────────────────────────────────────────────────────── */

/**
 * Chấm toàn bộ một dự án.
 * @returns {{tong:number|null, soTieuChi:number, tongTieuChi:number, phan:Object}}
 */
export function chamDiem(duAn) {
  if (!duAn?.toaDo) {
    return { tong: null, soTieuChi: 0, tongTieuChi: TIEU_CHI.length, phan: {},
             vi: 'Dự án chưa có toạ độ nên không chấm được tiêu chí nào' };
  }

  const metro   = chamMetro(duAn);
  const haTang  = chamHaTang(duAn);
  const tienIch = chamTienIch(duAn);
  const choThue = chamChoThue(duAn, metro);
  const tangGia = chamTangGia(duAn, metro, tienIch);
  const anCu    = chamAnCu(duAn);

  /* Đầu tư là điểm tổng hợp của các trục đã chấm, không phải một phép đo mới.
     Chỉ tính khi có đủ ba trục nền, nếu không sẽ thành trung bình của một số. */
  const nen = [choThue, tangGia, metro, haTang];
  const dauTu = nen.every(p => p.diem != null)
    ? { diem: kep(choThue.diem * 0.3 + tangGia.diem * 0.35 + metro.diem * 0.2 + haTang.diem * 0.15),
        vi: 'Tổng hợp từ cho thuê, tăng giá, metro và hạ tầng' }
    : { diem: null, vi: 'Cần đủ điểm cho thuê, tăng giá, metro và hạ tầng' };

  const thanhKhoan = chamThanhKhoan(duAn, metro, tienIch);

  const phan = { metro, haTang, tienIch, choThue, tangGia, anCu, dauTu, thanhKhoan };

  let tuSo = 0, mauSo = 0, dem = 0;
  for (const tc of TIEU_CHI) {
    const p = phan[tc.id];
    if (p?.diem == null) continue;
    tuSo += p.diem * tc.trong; mauSo += tc.trong; dem++;
  }

  return {
    tong: mauSo ? +(tuSo / mauSo).toFixed(1) : null,
    soTieuChi: dem,
    tongTieuChi: TIEU_CHI.length,
    phan
  };
}

/** Sao đầy / nửa / rỗng theo thang 10 → 5 sao. */
export function sao(diem) {
  if (diem == null) return '☆☆☆☆☆';
  const n = Math.round((diem / 10) * 10) / 2;         // làm tròn tới nửa sao
  const day = Math.floor(n), nua = n % 1 >= 0.5;
  return '★'.repeat(day) + (nua ? '⯨' : '') + '☆'.repeat(Math.max(0, 5 - day - (nua ? 1 : 0)));
}

export function nhanDiem(diem) {
  if (diem == null) return { nhan: 'Chưa đủ dữ liệu', mau: 'var(--c-text-3)' };
  if (diem >= 8.5) return { nhan: 'Rất tốt',    mau: 'var(--c-ok)' };
  if (diem >= 7)   return { nhan: 'Tốt',        mau: 'var(--c-ok)' };
  if (diem >= 5.5) return { nhan: 'Khá',        mau: 'var(--c-warn)' };
  if (diem >= 4)   return { nhan: 'Trung bình', mau: 'var(--c-warn)' };
  return { nhan: 'Thấp', mau: 'var(--c-bad)' };
}

/* ─── §10 · BIỂU ĐỒ RA-ĐA ───────────────────────────────────────────────────
   Vẽ bằng SVG dựng tay thay vì nạp thư viện biểu đồ: chỉ có tám trục, và ràng
   buộc dự án là ngoài Leaflet không thêm thư viện nào.                      */

export function radar(ketQua, size = 260) {
  const cx = size / 2, cy = size / 2 + 4, R = size * 0.34;
  const truc = TIEU_CHI.map((tc, i) => {
    const goc = (Math.PI * 2 * i) / TIEU_CHI.length - Math.PI / 2;
    return { ...tc, goc, diem: ketQua.phan[tc.id]?.diem ?? null };
  });

  const toa = (goc, r) => [cx + Math.cos(goc) * r, cy + Math.sin(goc) * r];

  /* Lưới nền: 4 vòng đồng tâm ứng với 2,5 / 5 / 7,5 / 10 điểm. */
  const luoi = [0.25, 0.5, 0.75, 1].map(k => {
    const d = truc.map(t => toa(t.goc, R * k).join(',')).join(' ');
    return `<polygon points="${d}" fill="none" stroke="var(--c-border)" stroke-width="1"${k === 1 ? '' : ' stroke-dasharray="2 3"'}/>`;
  }).join('');

  const nan = truc.map(t => {
    const [x, y] = toa(t.goc, R);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--c-border)" stroke-width="1"/>`;
  }).join('');

  /* Tiêu chí chưa chấm được thì vẽ ở tâm và đánh dấu riêng, để hình không nói
     dối là "điểm 0" — nhìn vào chú thích dưới biểu đồ sẽ thấy ghi rõ. */
  const coDiem = truc.filter(t => t.diem != null);
  const vung = truc.map(t => toa(t.goc, R * ((t.diem ?? 0) / 10)).join(',')).join(' ');

  const cham = truc.map(t => {
    const [x, y] = toa(t.goc, R * ((t.diem ?? 0) / 10));
    const thieu = t.diem == null;
    return `<circle cx="${x}" cy="${y}" r="${thieu ? 2.5 : 3.5}" fill="${thieu ? 'var(--c-text-3)' : 'var(--c-brand)'}" stroke="var(--c-surface)" stroke-width="1.5"/>`;
  }).join('');

  const nhan = truc.map(t => {
    const [x, y] = toa(t.goc, R + 24);
    const neo = Math.abs(Math.cos(t.goc)) < 0.3 ? 'middle' : (Math.cos(t.goc) > 0 ? 'start' : 'end');
    const diem = t.diem == null ? '—' : t.diem.toFixed(1);
    return `<text x="${x}" y="${y}" text-anchor="${neo}" dominant-baseline="middle"
              font-size="9.5" font-weight="600" fill="var(--c-text-2)">${t.nhan}</text>
            <text x="${x}" y="${y + 11}" text-anchor="${neo}" dominant-baseline="middle"
              font-size="10" font-weight="700" fill="${t.diem == null ? 'var(--c-text-3)' : 'var(--c-brand)'}">${diem}</text>`;
  }).join('');

  return `<svg class="radar" viewBox="0 0 ${size} ${size + 16}" width="100%" role="img"
            aria-label="Biểu đồ ra-đa ${coDiem.length}/${TIEU_CHI.length} tiêu chí">
    ${luoi}${nan}
    <polygon points="${vung}" fill="var(--c-brand)" fill-opacity=".16" stroke="var(--c-brand)" stroke-width="2" stroke-linejoin="round"/>
    ${cham}${nhan}
  </svg>`;
}
