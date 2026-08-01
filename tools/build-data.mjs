#!/usr/bin/env node
/**
 * build-data.mjs — dựng các lớp dữ liệu nền của bản đồ từ OpenStreetMap.
 *
 * Chạy:
 *   node tools/build-data.mjs                 → dựng tất cả
 *   node tools/build-data.mjs roads parks     → chỉ dựng lớp được nêu
 *   node tools/build-data.mjs --cache         → dùng lại tools/cache, không gọi mạng
 *
 * Mỗi lớp ghi ra một file trong data/. Ứng dụng không nhúng dữ liệu nào trong mã.
 *
 * Vì sao lọc theo `area` chứ không theo khung bao: khung bao 10,2–11,6 vĩ độ kéo
 * theo cả Long An, Đồng Nai, Lâm Đồng. Lọc theo relation ranh giới TP.HCM mới
 * (rel/1973756) cho đúng phạm vi và truy vấn cũng nhẹ hơn. Riêng lớp đường bộ
 * dùng khung bao để trục vành đai / cao tốc / quốc lộ không bị cắt cụt ở ranh tỉnh.
 */

import {
  AREA_HCM, BBOX, cached, writeData, readData, meta, log,
  pointOf, ringOf, simplify, round, chain, lengthOf, hav, slug, trongDaGiac, CACHE
} from './lib/osm.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const USE_CACHE = argv.includes('--cache');
const only = new Set(argv.filter(a => !a.startsWith('--')));
const want = name => only.size === 0 || only.has(name);

/* ─── §1 · METRO ─────────────────────────────────────────────────────────────
   Hình học tuyến và toạ độ ga lấy từ ảnh chụp OSM đã qua kiểm định chất lượng
   (tuyến 1 = 19,6 km / 14 ga · 0 ga lệch khỏi hình tuyến). Dùng lại ảnh chụp
   thay vì tải mới để không phá vỡ mốc đã đối chiếu — muốn cập nhật thì chạy
   tools/build-geo.mjs rồi kiểm định lại trước.                              */

/** Hồ sơ tuyến: phần con người biết, không suy ra được từ OSM. */
const LINES = [
  { id:'m1',   name:'Metro số 1',              route:'Bến Thành – Suối Tiên',                 color:'#e11d48', status:'operating',    docStations:14, docKm:19.7, alias:'tuyen 1 ben thanh suoi tien bến thành suối tiên' },
  { id:'m2',   name:'Metro số 2',              route:'Bến Thành – Tham Lương',                color:'#2563eb', status:'construction', docStations:10, docKm:11.3, alias:'tuyen 2 tham luong tham lương' },
  { id:'m2tt', name:'Metro số 2 (nhánh)',      route:'Bến Thành – Thủ Thiêm',                 color:'#7c3aed', status:'planned',      docStations:null, docKm:null, alias:'tuyen 2 thu thiem thủ thiêm' },
  { id:'bd2',  name:'Metro số 2 Thủ Dầu Một',  route:'Thủ Dầu Một – TP.HCM',                  color:'#0891b2', status:'preparing',    docStations:24, docKm:null, alias:'binh duong thu dau mot bình dương thủ dầu một' },
  { id:'bd1',  name:'Metro Bình Dương',        route:'Thành phố mới Bình Dương – Suối Tiên',  color:'#0d9488', status:'preparing',    docStations:19, docKm:null, alias:'binh duong suoi tien thanh pho moi bình dương' },
  { id:'m6',   name:'Metro số 6',              route:'Phú Hữu – Sân bay Tân Sơn Nhất',        color:'#ea580c', status:'planned',      docStations:null, docKm:null, alias:'tuyen 6 tan son nhat san bay tân sơn nhất sân bay' },
  { id:'m3',   name:'Metro số 3',              route:'Hiệp Bình Phước – An Hạ',               color:'#16a34a', status:'planned',      docStations:null, docKm:null, alias:'tuyen 3 hiep binh phuoc an ha hiệp bình phước' },
  { id:'m7',   name:'Metro số 7',              route:'Tân Kiên – Vinhomes Grand Park',        color:'#c026d3', status:'planned',      docStations:null, docKm:null, alias:'tuyen 7 tan kien vinhomes grand park tân kiên' },
  { id:'tt',   name:'Thủ Thiêm – Long Thành',  route:'Thủ Thiêm – Sân bay Long Thành',        color:'#475569', status:'planned',      docStations:null, docKm:null, alias:'long thanh san bay thu thiem long thành sân bay' },
  { id:'cg',   name:'Bến Thành – Cần Giờ',     route:'Bến Thành – Cần Giờ',                   color:'#0284c7', status:'planned',      docStations:null, docKm:null, alias:'can gio cần giờ ben thanh bến thành' }
];

/** Nhãn trạng thái dùng chung cho giao diện. */
const STATUS = {
  operating:    { nhan:'Đang khai thác',            mau:'#16a34a' },
  construction: { nhan:'Đang thi công',             mau:'#f59e0b' },
  preparing:    { nhan:'Chuẩn bị khởi công 2026',   mau:'#0ea5e9' },
  planned:      { nhan:'Quy hoạch',                 mau:'#94a3b8' }
};

/**
 * Đọc khối GEO đã qua kiểm định chất lượng.
 *
 * File này là ảnh chụp OSM ngày 29/07/2026 đã đối chiếu: tuyến 1 ra 19,6 km /
 * 14 ga (con số chính thức 19,7 km), toàn mạng 4 khúc gấp trên 60° đều là góc
 * rẽ thật, 0 ga lệch khỏi hình tuyến. Muốn cập nhật thì chạy tools/build-geo.mjs
 * rồi đối chiếu lại các mốc trên TRƯỚC KHI ghi đè file này.
 */
function readVerifiedGeo() {
  const file = join(CACHE, 'geo-verified.json');
  if (!existsSync(file)) {
    throw new Error('Thiếu tools/cache/geo-verified.json — ảnh chụp hình tuyến metro đã kiểm định');
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

function buildMetro() {
  const geo = readVerifiedGeo();

  const lines = LINES.map(def => {
    const g = geo[def.id];
    if (!g) throw new Error(`Khối GEO thiếu tuyến ${def.id}`);
    return {
      ...def,
      km: g.km,
      shape: g.s,
      soGa: g.g.length,
      statusLabel: STATUS[def.status].nhan
    };
  });

  /* Ga trung chuyển: cùng một ga xuất hiện trong nhiều tuyến. OSM cho toạ độ
     lệch vài chục mét giữa các tuyến nên gộp theo ngưỡng 80 m, không theo tên. */
  const raw = [];
  for (const def of LINES) for (const [name, lat, lng] of geo[def.id].g) {
    const near = raw.find(s => hav(s.c, [lat, lng]) <= 80);
    if (near) { if (!near.lines.includes(def.id)) near.lines.push(def.id); }
    else raw.push({ name, c: [lat, lng], lines: [def.id] });
  }

  const stations = raw.map((s, i) => ({
    id: `ga${i + 1}`,
    name: s.name,
    slug: slug(s.name),
    c: s.c,
    lines: s.lines,
    interchange: s.lines.length > 1
  }));

  writeData('metro.json', { meta: meta({ ghi_chu: 'Hình học tuyến đã kiểm định, mốc: tuyến 1 = 19,6 km / 14 ga' }), trangThai: STATUS, lines });
  writeData('stations.json', { meta: meta(), stations });
  log(`  ${lines.length} tuyến · ${stations.length} ga · ${stations.filter(s => s.interchange).length} ga trung chuyển`);
}

/* ─── §2 · ĐƯỜNG BỘ ─────────────────────────────────────────────────────────
   Ba nhóm tách riêng để bật/tắt độc lập: vành đai, cao tốc, quốc lộ.        */

const ROAD_QUERIES = {
  ring: `[out:json][timeout:300];
    way["highway"]["name"~"[Vv]ành ?[Đđ]ai ?[1234]"](${BBOX});
    out geom tags;`,
  expressway: `[out:json][timeout:300];
    (way["highway"="motorway"](${BBOX}); way["highway"]["ref"~"^CT\\\\."](${BBOX}););
    out geom tags;`,
  highway: `[out:json][timeout:300];
    way["highway"]["ref"~"^QL[\\\\. ]"](${BBOX});
    out geom tags;`
};

const ROAD_KIND = {
  ring:       { nhan:'Đường Vành đai', mau:'#f97316', rong:5 },
  expressway: { nhan:'Cao tốc',        mau:'#dc2626', rong:5 },
  highway:    { nhan:'Quốc lộ',        mau:'#a16207', rong:4 }
};

/* OSM gắn thẻ highway=motorway cho cả cầu, nhánh rẽ và biển chỉ đường. Những
   thứ này không phải một trục giao thông riêng, vẽ lên chỉ làm rối bản đồ. */
const TEN_KHONG_PHAI_TRUC =
  /^(đi |cầu |nhánh |hầm chui|cầu vượt|cầu cạn|đường dẫn|đường nối|đường song hành|đường số |đường t\d|đường ne\d)/i;

/** Đưa các biến thể tên của cùng một trục về một khoá gộp duy nhất. */
function khoaTruc(name) {
  return slug(name)
    .replace(/tp\.?\s*hcm|tphcm/g, 'thanh pho ho chi minh')
    .replace(/\(.*?\)/g, '')
    .replace(/giai doan \d+/g, '')
    .replace(/\bmo rong\b/g, '')
    .replace(/^duong\s+/, '')
    .replace(/^cao toc\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Tỷ lệ điểm của `a` nằm sát hình tuyến `b` — dùng để phát hiện trùng lặp. */
function tyLeTrung(a, b, nguong = 90) {
  const pts = a.flat().filter((_, i) => i % 3 === 0);   // lấy mẫu cho nhanh
  if (!pts.length) return 0;
  let hit = 0;
  for (const p of pts) if (distToShapeLocal(p, b) <= nguong) hit++;
  return hit / pts.length;
}

function distToShapeLocal(c, segments) {
  let best = Infinity;
  for (const s of segments) for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1], dx = b[1] - a[1], dy = b[0] - a[0];
    let t = 0;
    if (dx || dy) t = Math.max(0, Math.min(1, ((c[1] - a[1]) * dx + (c[0] - a[0]) * dy) / (dx * dx + dy * dy)));
    const d = hav(c, [a[0] + dy * t, a[1] + dx * t]);
    if (d < best) best = d;
    if (best <= 1) return best;
  }
  return best;
}

async function buildRoads() {
  /* Một way có thể khớp nhiều truy vấn (Vành đai 4 vừa mang tên vành đai vừa
     gắn thẻ motorway). Gán mỗi way vào ĐÚNG MỘT nhóm theo thứ tự ưu tiên
     vành đai → cao tốc → quốc lộ, nếu không sẽ vẽ chồng hai lần lên nhau. */
  const daNhan = new Set();
  const nhom = [];

  for (const [kind, query] of Object.entries(ROAD_QUERIES)) {
    const json = await cached(`roads-${kind}`, query, USE_CACHE);
    const groups = new Map();

    for (const w of json.elements) {
      if (w.type !== 'way' || !(w.geometry?.length > 1) || daNhan.has(w.id)) continue;
      const ten = w.tags.name ?? '';
      const ref = (w.tags.ref ?? '').split(';')[0].replace(/\s+/g, '');
      if (kind !== 'highway' && TEN_KHONG_PHAI_TRUC.test(ten)) continue;

      /* Vành đai 4 được OSM gắn cả thẻ motorway nên lọt vào truy vấn cao tốc.
         Phân loại theo TÊN chứ không theo truy vấn nào bắt được nó, nếu không
         một trục sẽ nằm ở hai lớp và người dùng tắt lớp vành đai vẫn thấy nó. */
      if (kind === 'expressway' && /vành\s*đai\s*[1234]/i.test(ten)) continue;

      const key = kind === 'highway' ? ref : khoaTruc(ten || ref);
      if (!key) continue;
      daNhan.add(w.id);

      if (!groups.has(key)) groups.set(key, { ref, tenGoc: new Map(), segs: [] });
      const g = groups.get(key);
      /* Giữ mọi biến thể tên rồi chọn tên xuất hiện nhiều nhất làm tên hiển thị. */
      if (ten) g.tenGoc.set(ten, (g.tenGoc.get(ten) ?? 0) + 1);
      g.segs.push(w.geometry.map(p => [p.lat, p.lon]));
    }

    /* Trục cùng nhóm phải dài tối thiểu mới coi là một trục. Quốc lộ gom theo
       ref nên luôn hợp lệ; vành đai và cao tốc mới cần ngưỡng này. */
    const toiThieuKm = kind === 'highway' ? 0 : 3;

    for (const [key, g] of groups) {
      const shape = chain(g.segs, 250).filter(s => lengthOf(s) > 500).map(s => simplify(s, 30).map(round));
      if (!shape.length) continue;
      const km = +(shape.reduce((a, s) => a + lengthOf(s), 0) / 1000).toFixed(1);
      if (km < toiThieuKm) continue;
      const ten = [...g.tenGoc.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      nhom.push({
        id: `${kind}-${key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        name: kind === 'highway' ? `Quốc lộ ${key.replace(/^QL[.\s]*/i, '')}` : ten,
        ref: g.ref || null, kind, km, shape
      });
    }
  }

  /* Bỏ trục nằm hoàn toàn ngoài TP.HCM mới (cao tốc Bảo Lộc, Phan Thiết…).
     Dùng ranh giới hành chính thật chứ không cắt theo khung bao vuông. */
  const ranh = readData('boundaries.json')?.units?.find(u => u.level === 4)?.rings;
  let daLoc = 0;
  const trongThanhPho = r => {
    if (!ranh) return true;
    return r.shape.some(seg => seg.some(p =>
      ranh.some(ring => trongDaGiac(p, ring)) || ranh.some(ring => distToShapeLocal(p, [ring]) <= 4000)));
  };
  const loc = nhom.filter(r => { const ok = trongThanhPho(r); if (!ok) daLoc++; return ok; });
  if (!ranh) log('  ! chưa có boundaries.json — bỏ qua bước cắt theo địa giới');

  /* Loại trục trùng: đoạn ngắn nằm đè lên đoạn dài (Vành đai 4 bị OSM tách
     thành nhiều tên khác nhau) thì chỉ giữ đoạn dài. */
  loc.sort((a, b) => b.km - a.km);
  const roads = [];
  let daTrung = 0;
  for (const r of loc) {
    const trung = roads.find(x => x.kind === r.kind && tyLeTrung(r.shape, x.shape) >= 0.75);
    if (trung) { daTrung++; continue; }
    roads.push(r);
  }

  writeData('roads.json', {
    meta: meta({
      ghi_chu_km: 'Trường "km" là tổng chiều dài các đoạn tuyến có trong dữ liệu OSM. ' +
        'Đường đôi được OSM vẽ thành hai chiều riêng nên con số này LỚN HƠN chiều dài ' +
        'thực của trục. Không dùng nó như chiều dài chính thức của tuyến.'
    }),
    loai: ROAD_KIND, roads
  });
  for (const k of Object.keys(ROAD_KIND)) {
    const g = roads.filter(r => r.kind === k);
    log(`  ${ROAD_KIND[k].nhan}: ${g.length} trục · ${g.reduce((a, r) => a + r.km, 0).toFixed(0)} km`);
  }
  log(`  đã loại ${daLoc} trục ngoài địa giới · ${daTrung} trục trùng lặp`);
}

/* ─── §3 · LỚP ĐIỂM VÀ VÙNG ─────────────────────────────────────────────────
   Mỗi lớp một truy vấn riêng để một lớp lỗi không kéo cả mẻ đi.

   Vì sao lớp toàn thành phố chỉ lấy cấp lớn (trường phổ thông trở lên, bệnh
   viện chứ không lấy phòng khám): mật độ điểm cấp nhỏ ở TP.HCM lên tới hàng
   nghìn, ghim hết thì bản đồ nhiễu và nặng. Cấp nhỏ vẫn có đủ trong lớp
   "tiện ích quanh dự án" do build-amenities.mjs dựng theo bán kính.        */

const POI_LAYERS = {
  industrial: {
    file: 'industrial.json', nhan: 'Khu công nghiệp',
    query: `[out:json][timeout:300];${AREA_HCM}
      (way["landuse"="industrial"]["name"](area.hcm); rel["landuse"="industrial"]["name"](area.hcm););
      out geom tags;`,
    keep: el => !!el.tags.name,
    shape: 'area'
  },
  schools: {
    file: 'schools.json', nhan: 'Trường học',
    query: `[out:json][timeout:300];${AREA_HCM}
      nwr["amenity"~"^(school|college|university)$"]["name"](area.hcm);
      out center tags;`,
    keep: el => !!el.tags.name,
    kindOf: t => t.amenity === 'university' ? 'Đại học'
              : t.amenity === 'college' ? 'Cao đẳng · Trung cấp' : 'Trường phổ thông'
  },
  hospitals: {
    file: 'hospitals.json', nhan: 'Bệnh viện',
    query: `[out:json][timeout:300];${AREA_HCM}
      nwr["amenity"="hospital"]["name"](area.hcm);
      out center tags;`,
    keep: el => !!el.tags.name,
    kindOf: () => 'Bệnh viện'
  },
  shopping: {
    file: 'shopping.json', nhan: 'Trung tâm thương mại',
    query: `[out:json][timeout:300];${AREA_HCM}
      nwr["shop"~"^(mall|department_store|supermarket)$"]["name"](area.hcm);
      out center tags;`,
    keep: el => !!el.tags.name,
    kindOf: t => t.shop === 'supermarket' ? 'Siêu thị'
              : t.shop === 'department_store' ? 'Bách hoá tổng hợp' : 'Trung tâm thương mại'
  },
  parks: {
    file: 'parks.json', nhan: 'Công viên',
    query: `[out:json][timeout:300];${AREA_HCM}
      (way["leisure"~"^(park|nature_reserve)$"]["name"](area.hcm);
       rel["leisure"~"^(park|nature_reserve)$"]["name"](area.hcm);
       node["leisure"="park"]["name"](area.hcm););
      out geom tags;`,
    keep: el => !!el.tags.name,
    shape: 'area',
    kindOf: t => t.leisure === 'nature_reserve' ? 'Khu bảo tồn' : 'Công viên'
  }
};

async function buildPoi(key) {
  const cfg = POI_LAYERS[key];
  const json = await cached(`poi-${key}`, cfg.query, USE_CACHE);

  const items = [];
  const seen = new Set();
  for (const el of json.elements) {
    if (!cfg.keep(el)) continue;
    const c = pointOf(el);
    if (!c) continue;                                  // OSM không có toạ độ → bỏ, không đoán
    const name = el.tags.name.trim();
    const dedupe = `${slug(name)}|${c[0].toFixed(3)},${c[1].toFixed(3)}`;
    if (seen.has(dedupe)) continue;                    // rel và way trùng nhau
    seen.add(dedupe);

    const item = {
      id: `${el.type[0]}${el.id}`,
      name,
      slug: slug(name),
      c,
      kind: cfg.kindOf ? cfg.kindOf(el.tags) : cfg.nhan
    };
    if (cfg.shape === 'area') {
      const ring = ringOf(el, 30);
      if (ring) item.poly = ring;
    }
    const dc = el.tags['addr:street'] || el.tags['addr:full'];
    if (dc) item.diaChi = dc;
    items.push(item);
  }

  items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  writeData(cfg.file, { meta: meta(), nhan: cfg.nhan, items });
  log(`  ${cfg.nhan}: ${items.length} điểm · ${items.filter(i => i.poly).length} có ranh vùng`);
}

/* ─── §4 · SÔNG VÀ HỒ ───────────────────────────────────────────────────────
   Tách hai lớp riêng vì yêu cầu bật/tắt độc lập.                            */

async function buildWater() {
  const rivers = await cached('water-rivers', `[out:json][timeout:300];${AREA_HCM}
    way["waterway"~"^(river|canal)$"]["name"](area.hcm);
    out geom tags;`, USE_CACHE);

  const lakes = await cached('water-lakes', `[out:json][timeout:300];${AREA_HCM}
    (way["natural"="water"]["name"](area.hcm); rel["natural"="water"]["name"](area.hcm);
     way["landuse"="reservoir"]["name"](area.hcm););
    out geom tags;`, USE_CACHE);

  /* Gom các way cùng tên thành một dòng sông liền mạch. */
  const byName = new Map();
  for (const w of rivers.elements) {
    if (!w.geometry || w.geometry.length < 2) continue;
    const n = w.tags.name.trim();
    if (!byName.has(n)) byName.set(n, { name: n, kind: w.tags.waterway === 'canal' ? 'Kênh' : 'Sông', segs: [] });
    byName.get(n).segs.push(w.geometry.map(g => [g.lat, g.lon]));
  }
  const song = [];
  for (const [name, g] of byName) {
    const shape = chain(g.segs, 200).filter(s => lengthOf(s) > 400).map(s => simplify(s, 40).map(round));
    if (!shape.length) continue;
    song.push({ id: `s-${slug(name).replace(/[^a-z0-9]+/g, '-')}`, name, slug: slug(name), kind: g.kind,
                km: +(shape.reduce((a, s) => a + lengthOf(s), 0) / 1000).toFixed(1), shape });
  }
  song.sort((a, b) => b.km - a.km);

  const ho = [];
  const seen = new Set();
  for (const el of lakes.elements) {
    const ring = ringOf(el, 25);
    if (!ring || !el.tags.name) continue;
    const c = pointOf(el);
    const key = `${slug(el.tags.name)}|${c[0].toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    ho.push({ id: `h${el.id}`, name: el.tags.name.trim(), slug: slug(el.tags.name), c, poly: ring });
  }
  ho.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  writeData('water.json', { meta: meta(), song, ho });
  log(`  Sông/kênh: ${song.length} · Hồ: ${ho.length}`);
}

/* ─── §5 · ĐỊA GIỚI HÀNH CHÍNH ──────────────────────────────────────────────
   TP.HCM sau sáp nhập 01/07/2025 chỉ còn hai cấp: thành phố và 168 phường/xã.
   Không còn cấp quận/huyện — đừng cố dựng lại cấp đó.                       */

async function buildBoundaries() {
  /* Bộ lọc `area` phải khai báo thành biến trước rồi mới dùng — viết lồng
     thẳng vào trong ngoặc thì Overpass trả về rỗng mà không báo lỗi. */
  const json = await cached('boundaries', `[out:json][timeout:300];${AREA_HCM}
    (rel["boundary"="administrative"]["admin_level"="4"]["name"="Thành phố Hồ Chí Minh"];
     rel["boundary"="administrative"]["admin_level"="6"](area.hcm););
    out geom;`, USE_CACHE);
  /* Chú ý: phải là `out geom`, KHÔNG phải `out geom tags`. Thêm `tags` làm
     Overpass bỏ hẳn mảng members, trả về relation rỗng mà không báo lỗi. */

  const units = [];
  for (const rel of json.elements) {
    if (rel.type !== 'relation' || !rel.members) continue;
    const outer = rel.members.filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry?.length > 1)
                             .map(m => m.geometry.map(g => [g.lat, g.lon]));
    if (!outer.length) continue;
    const level = +rel.tags.admin_level;
    /* Cấp thành phố vẽ mảnh hơn nhiều → giản lược mạnh tay hơn cho nhẹ file. */
    const rings = chain(outer, 500).map(s => simplify(s, level === 4 ? 120 : 60).map(round))
                                   .filter(s => s.length > 2);
    if (!rings.length) continue;
    units.push({
      id: `r${rel.id}`,
      name: rel.tags.name,
      slug: slug(rel.tags.name),
      level,
      rings
    });
  }
  units.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'vi'));
  writeData('boundaries.json', { meta: meta({ ghi_chu: 'TP.HCM sau sáp nhập 01/07/2025 — hai cấp: thành phố và phường/xã' }), units });
  log(`  Địa giới: ${units.filter(u => u.level === 4).length} cấp thành phố · ${units.filter(u => u.level === 6).length} phường/xã`);
}

/* ─── §6 · CHẠY ─────────────────────────────────────────────────────────── */

const TARGETS = [
  ['metro',       buildMetro],
  ['roads',       buildRoads],
  ['industrial',  () => buildPoi('industrial')],
  ['schools',     () => buildPoi('schools')],
  ['hospitals',   () => buildPoi('hospitals')],
  ['shopping',    () => buildPoi('shopping')],
  ['parks',       () => buildPoi('parks')],
  ['water',       buildWater],
  ['boundaries',  buildBoundaries]
];

let failed = 0;
for (const [name, fn] of TARGETS) {
  if (!want(name)) continue;
  log(`\n▶ ${name}`);
  try { await fn(); }
  catch (err) { failed++; log(`  ✗ ${name} thất bại: ${err.message}`); }
}
log(failed ? `\nXong, ${failed} lớp thất bại — chạy lại riêng lớp đó.` : '\nXong tất cả các lớp.');
process.exit(failed ? 1 : 0);
