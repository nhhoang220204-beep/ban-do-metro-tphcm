/**
 * analysis.js — tự sinh phần nhận định: điểm mạnh, điểm yếu, đối tượng phù hợp,
 * rủi ro.
 *
 * Mỗi câu nhận định phải sinh ra từ một điều kiện đo được trên dữ liệu, và câu
 * nào cũng kèm dẫn chứng là con số đã dùng. Không có câu quảng cáo viết sẵn kiểu
 * "vị trí vàng", "tiềm năng vượt trội".
 *
 * Giọng văn theo đúng cách chủ dự án tư vấn khách: nêu cả mặt hạn chế, không
 * khẳng định chắc chắn về tương lai, và luôn nói rõ nhận định dựa trên cái gì.
 */

import { duLieu, tienIchCua, gaCua } from '../core/data.js';
import { co } from '../core/format.js';

/* ─── §1 · SINH NHẬN ĐỊNH ───────────────────────────────────────────────── */

/**
 * @param {Object} duAn
 * @param {Object} diem  kết quả của chamDiem()
 * @returns {{manh:Object[], yeu:Object[], hopVoi:string[], ruiRo:Object[], thieuDuLieu:string[]}}
 */
export function phanTich(duAn, diem) {
  const manh = [], yeu = [], ruiRo = [], hopVoi = [], thieuDuLieu = [];
  const p = diem.phan;
  const tienIch = tienIchCua(duAn.id);
  const route = gaCua(duAn);

  /* ─ Metro ─ */
  const ga = route?.gaGanNhat;
  if (ga) {
    /* Cùng ngưỡng với score.js: quá 2,5 km thì không coi là "đi bộ được". */
    const bo = ga.diBo && ga.diBo.m <= 2500 ? ga.diBo : null;
    const tuyen = (ga.lines ?? []).map(id => duLieu.metro.lines.find(l => l.id === id)).filter(Boolean);
    const dangChay = tuyen.filter(l => l.status === 'operating');
    const sapCo = tuyen.filter(l => l.status === 'construction' || l.status === 'preparing');

    if (bo && bo.m <= 1200 && dangChay.length) {
      manh.push({ y: `Đi bộ được tới ga metro đang khai thác`,
                  vi: `Ga ${ga.name} · ${Math.round(bo.m)} m, khoảng ${Math.round(bo.giay / 60)} phút đi bộ · ${dangChay[0].name}` });
    } else if (bo && bo.m <= 1200 && sapCo.length) {
      manh.push({ y: 'Đi bộ được tới ga metro sắp có',
                  vi: `Ga ${ga.name} · ${Math.round(bo.m)} m đi bộ · ${sapCo[0].name} ${sapCo[0].statusLabel.toLowerCase()}` });
      ruiRo.push({ y: 'Giá trị metro phụ thuộc tiến độ tuyến',
                   vi: `${sapCo[0].name} chưa vận hành. Tiến độ và hướng tuyến vẫn có thể điều chỉnh — dẫn kèm "theo hồ sơ đang niêm yết" khi tư vấn.` });
    } else if (ga.diXe && ga.diXe.m > 5000) {
      yeu.push({ y: 'Xa ga metro',
                 vi: `Ga gần nhất ${ga.name} cách ${(ga.diXe.m / 1000).toFixed(1)} km đường xe, khoảng ${Math.round(ga.diXe.giay / 60)} phút` });
    }
    if (!ga.diBo && ga.diXe) {
      yeu.push({ y: 'Không có lối đi bộ thuận tiện tới ga',
                 vi: `Dữ liệu bản đồ không tìm được tuyến đi bộ tới ga ${ga.name}; chỉ đo được đường đi xe` });
    }
  } else {
    thieuDuLieu.push('Chưa đo được khoảng cách tới ga metro');
  }

  /* ─ Hạ tầng đường bộ ─ */
  if (p.haTang?.diem != null) {
    if (p.haTang.diem >= 8) manh.push({ y: 'Bám trục giao thông lớn', vi: p.haTang.vi });
    else if (p.haTang.diem <= 4.5) yeu.push({ y: 'Cách xa trục giao thông lớn', vi: p.haTang.vi });
  }

  /* ─ Tiện ích ─ */
  if (p.tienIch?.diem != null) {
    if (p.tienIch.diem >= 7.5) manh.push({ y: 'Tiện ích quanh dự án đã đủ đầy', vi: p.tienIch.vi });
    else if (p.tienIch.diem <= 4.5) {
      yeu.push({ y: 'Tiện ích quanh dự án còn mỏng', vi: p.tienIch.vi });
      const thieu = nhomThieu(tienIch);
      if (thieu.length) yeu.push({ y: 'Chưa có trong bán kính 2 km', vi: thieu.join(' · ') });
    }
  }

  /* ─ Cho thuê ─ */
  const kcn5 = tienIch.filter(d => d.nhom === 'kcn' && (d.diXe?.m ?? Infinity) <= 5000);
  if (kcn5.length >= 2) {
    manh.push({ y: 'Nguồn cầu thuê từ khu công nghiệp',
                vi: `${kcn5.length} khu công nghiệp trong 5 km: ${kcn5.slice(0, 3).map(k => k.name).join(' · ')}` });
    hopVoi.push('Nhà đầu tư mua để cho thuê (công nhân, chuyên gia khu công nghiệp)');
  }

  const kcn1 = tienIch.filter(d => d.nhom === 'kcn' && (d.diXe?.m ?? Infinity) <= 1000);
  if (kcn1.length) {
    ruiRo.push({ y: 'Sát khu công nghiệp',
                 vi: `${kcn1.length} khu công nghiệp trong 1 km (${kcn1[0].name}). Cần kiểm tra thực địa về tiếng ồn, xe tải và không khí trước khi chốt với khách mua ở.` });
  }

  /* ─ An cư ─ */
  if (p.anCu?.diem != null) {
    if (p.anCu.diem >= 7.5) {
      manh.push({ y: 'Đủ hạ tầng cho gia đình ở thật', vi: p.anCu.vi });
      hopVoi.push('Gia đình mua để ở');
    } else if (p.anCu.diem <= 4.5) {
      yeu.push({ y: 'Hạ tầng cho người ở còn thiếu', vi: p.anCu.vi });
    }
  }

  /* ─ Tăng giá ─ */
  if (p.tangGia?.diem != null) {
    if (p.tangGia.diem >= 7) {
      manh.push({ y: 'Có hạ tầng lớn đang hình thành quanh khu vực', vi: p.tangGia.vi });
      hopVoi.push('Nhà đầu tư trung hạn theo hạ tầng');
    } else if (p.tangGia.diem <= 4) {
      yeu.push({ y: 'Chưa thấy động lực hạ tầng rõ ràng', vi: p.tangGia.vi });
    }
  }

  /* ─ Pháp lý và giá: đây là phần dữ liệu người nhập, thiếu thì nói thẳng ─ */
  if (!co(duAn.phapLy)) thieuDuLieu.push('Chưa có thông tin pháp lý');
  else if (/sổ hồng|sổ đỏ|đã có sổ/i.test(duAn.phapLy)) manh.push({ y: 'Pháp lý rõ ràng', vi: duAn.phapLy });

  if (!co(duAn.giaTu) && !co(duAn.giaTrungBinh)) thieuDuLieu.push('Chưa có bảng giá');
  if (!co(duAn.banGiao)) thieuDuLieu.push('Chưa có mốc bàn giao');
  if (!co(duAn.tongSoCan)) thieuDuLieu.push('Chưa có quy mô nguồn hàng');

  if (/nhà thô/i.test(duAn.banGiao ?? '') || /nhà thô/i.test(duAn.ghiChu ?? '')) {
    ruiRo.push({ y: 'Bàn giao nhà thô',
                 vi: 'Chi phí hoàn thiện là khoản tiền thật khách phải chuẩn bị thêm — đưa vào bảng tính vốn ngay từ đầu, đừng để giá trông rẻ hơn thực tế.' });
  }

  /* ─ Đối tượng phù hợp suy từ loại hình và mặt bằng giá ─ */
  if (duAn.loaiHinh === 'nha-pho-thuong-mai' || duAn.loaiHinh === 'shophouse') {
    hopVoi.push('Khách vừa ở vừa kinh doanh nhỏ');
  }
  if (co(duAn.giaTu) && duAn.donViGia === 'trđ/căn' && duAn.giaTu <= 2600) {
    hopVoi.push('Khách mua căn đầu tiên, ngân sách dưới 2,6 tỷ');
  }

  /* ─ Rủi ro chung, luôn nêu ─ */
  ruiRo.push({ y: 'Số liệu thay đổi theo thời gian',
               vi: 'Giá, chính sách chiết khấu và tiến độ đổi liên tục. Đối chiếu bảng giá mới nhất của chủ đầu tư trước khi báo khách.' });

  if (duAn.xacMinh === 'thu-cong') {
    ruiRo.push({ y: 'Vị trí do người dùng tự ghim',
                 vi: 'Toạ độ này không lấy từ nguồn bản đồ nào mà do tự đánh dấu. Mọi khoảng cách tính từ đây đều phụ thuộc điểm ghim có đúng không.' });
  }

  return {
    manh, yeu, ruiRo,
    hopVoi: [...new Set(hopVoi)],
    thieuDuLieu
  };
}

/** Những nhóm tiện ích không có mặt nào trong 2 km. */
function nhomThieu(tienIch) {
  const nhom = duLieu.amenities?.nhom ?? {};
  const co2km = new Set(tienIch.filter(d => (d.diXe?.m ?? Infinity) <= 2000).map(d => d.nhom));
  return Object.entries(nhom).filter(([k]) => !co2km.has(k)).map(([, v]) => `${v.icon} ${v.nhan}`);
}
