/**
 * dom.js — lớp mỏng bọc quanh DOM. Không phải framework, chỉ là những hàm lặp
 * đi lặp lại trong toàn bộ ứng dụng.
 */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Tạo phần tử.
 *   el('div.card', { id: 'x' }, 'nội dung')
 *   el('button.btn.btn--primary', { onclick: fn }, ['Lưu'])
 *
 * Thuộc tính bắt đầu bằng `on` gắn thành sự kiện, `dataset` gắn thành data-*,
 * `html` gán innerHTML (chỉ dùng cho chuỗi do chính ứng dụng dựng).
 */
export function el(spec, attrs = {}, children) {
  const [tagPart, ...classes] = spec.split('.');
  const node = document.createElement(tagPart || 'div');
  if (classes.length) node.className = classes.join(' ');

  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }

  append(node, children);
  return node;
}

/**
 * Ghép con vào một nút. Bỏ qua null, undefined và false để viết được
 * `dieuKien && el(...)` ngay trong danh sách con.
 *
 * ⚠ Số 0 KHÔNG bị bỏ qua, vì `el('span', {}, 0)` là cách hợp lệ để hiện số 0.
 * Nghĩa là `mang.length && el(...)` sẽ in ra chữ "0" khi mảng rỗng — đã gặp
 * thật một lần. Luôn viết `mang.length > 0 && el(...)` hoặc dùng toán tử ba ngôi.
 */
export function append(node, children) {
  if (children == null) return node;
  for (const c of [children].flat(9)) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Xoá sạch rồi đổ nội dung mới — dùng khi vẽ lại một vùng giao diện. */
export function fill(node, children) {
  node.replaceChildren();
  return append(node, children);
}

/**
 * Một trình xử lý cho cả vùng, phân nhánh theo `data-act`.
 * Tránh gắn hàng trăm listener rời rạc lên từng ghim, từng dòng danh sách.
 */
export function delegate(root, type, handlers) {
  root.addEventListener(type, ev => {
    const target = ev.target.closest('[data-act]');
    if (!target || !root.contains(target)) return;
    const fn = handlers[target.dataset.act];
    if (fn) fn(target, ev);
  });
}

/** Escape để nhét chuỗi người dùng nhập vào innerHTML một cách an toàn. */
export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* ─── Thông báo ngắn ────────────────────────────────────────────────────── */

let toastBox;
export function toast(message, kind = 'info', ms = 3200) {
  toastBox ??= document.body.appendChild(el('div.toastbox'));
  const node = el('div.toast', { dataset: { kind } }, message);
  toastBox.append(node);
  requestAnimationFrame(() => node.setAttribute('data-show', ''));
  setTimeout(() => {
    node.removeAttribute('data-show');
    setTimeout(() => node.remove(), 300);
  }, ms);
}

/* ─── Hoãn gọi ──────────────────────────────────────────────────────────── */

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
