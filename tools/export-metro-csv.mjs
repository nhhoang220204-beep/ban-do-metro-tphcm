#!/usr/bin/env node
/**
 * export-metro-csv.mjs — xuất hồ sơ metro ra CSV để mở bằng Excel.
 *
 * Chạy sau build-metro-doc.mjs. Ghi ra data/metro/*.csv
 *
 * Dùng dấu chấm phẩy làm dấu phân cách vì Excel bản tiếng Việt mặc định đọc
 * dấu phẩy là dấu thập phân — để dấu phẩy thì mọi số bị tách cột sai.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, log, kb } from './lib/osm.mjs';

const RA = join(DATA, 'metro');
const doc = f => (existsSync(join(RA, f)) ? JSON.parse(readFileSync(join(RA, f), 'utf8')) : null);

/** Bọc ô CSV: nhân đôi dấu nháy kép, bọc ô nếu chứa ký tự phân cách. */
const o = v => {
  if (v == null) return '';
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const ghi = (ten, hang) => {
  /* BOM để Excel nhận đúng UTF-8, nếu không tiếng Việt ra ký tự lạ. */
  const csv = '﻿' + hang.map(r => r.map(o).join(';')).join('\r\n') + '\r\n';
  writeFileSync(join(RA, ten), csv, 'utf8');
  log(`▸ data/metro/${ten} · ${hang.length - 1} dòng · ${kb(csv.length)}`);
};

/* ─── 1 · Tuyến ─────────────────────────────────────────────────────────── */

const lines = doc('lines.json');
if (lines) {
  const hang = [[
    'Mã', 'Số', 'Số hiệu cũ', 'Tên', 'Loại', 'Màu', 'Hướng tuyến', 'Nguồn hướng tuyến', 'Tin cậy hướng tuyến',
    'Dài đến 2035 (km)', 'Dài toàn tuyến (km)', 'Nguồn chiều dài', 'Tin cậy chiều dài',
    'Trạng thái', 'Có hình học OSM', 'Km đo được', 'Số ga có toạ độ', 'Dữ liệu còn thiếu'
  ]];

  const themDong = (t, ngoai = false) => hang.push([
    t.ma, t.so ?? '', t.soHieuCu ?? '', t.ten, t.loai ?? '', t.mau ?? '',
    t.huongTuyen?.giaTri ?? (ngoai ? t.ghiChu : ''),
    t.huongTuyen?.nguon ?? '', t.huongTuyen?.tinCay ?? '',
    t.chieuDai?.den2035Km ?? '', t.chieuDai?.toanTuyenKm ?? '',
    t.chieuDai?.nguon ?? '', t.chieuDai?.tinCay ?? '',
    t.trangThai ?? '', t.hinhHocOSM?.co ? 'có' : 'không',
    t.hinhHocOSM?.kmDoDuoc ?? '', t.hinhHocOSM?.gaCoToaDo ?? '',
    (t.thieu ?? []).join(' | ')
  ]);

  for (const t of lines.tuyen) themDong(t);
  for (const t of lines.tuyen_ngoai_bo_10) themDong(t, true);
  ghi('tuyen.csv', hang);
}

/* ─── 2 · Hướng tuyến theo đường ────────────────────────────────────────── */

const ht = doc('huong-tuyen.json');
if (ht) {
  const hang = [['Tuyến', 'Tên tuyến', 'Đoạn', 'Thứ tự', 'Đường', 'Km đầu', 'Km cuối', 'Dài (km)', 'Lệch trung bình (m)', 'Ghi chú']];
  for (const [id, t] of Object.entries(ht.tuyen)) {
    for (const d of t.doan) {
      for (const p of d.phanDoan) {
        hang.push([id, t.ten, d.maDoan, p.thuTu, p.duong ?? '(không xác định)',
                   p.kmDau, p.kmCuoi, p.daiKm, p.lechTrungBinhM ?? '', p.ghiChu ?? '']);
      }
    }
  }
  ghi('huong-tuyen.csv', hang);
}

/* ─── 3 · Ga ────────────────────────────────────────────────────────────── */

const ga = doc('ga.geojson');
if (ga) {
  const hang = [['Mã ga', 'Tên ga', 'Vĩ độ', 'Kinh độ', 'Tuyến', 'Số tuyến', 'Ga trung chuyển', 'Nguồn', 'Ngày chụp', 'Google Maps']];
  for (const f of ga.features) {
    const [lng, lat] = f.geometry.coordinates;
    const p = f.properties;
    hang.push([p.ga_id, p.ten, lat, lng, p.tuyen, p.so_tuyen,
               p.trung_chuyen ? 'có' : 'không', p.nguon, p.ngay_chup,
               `https://www.google.com/maps?q=${lat},${lng}`]);
  }
  ghi('ga.csv', hang);
}

log('\nXong. Mở bằng Excel: dấu phân cách là chấm phẩy, mã hoá UTF-8 có BOM.');
