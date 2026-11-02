/* =====================================================================
   AJANTA PAVER – Billing web app
   Plain JavaScript, no build step. Works on GitHub Pages.
   Data: Supabase (when js/config.js is filled) or browser storage (demo).
   ===================================================================== */
'use strict';

const CFG = window.APP_CONFIG || {};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const TYPES = {
  quote:   { label: 'Quotation',        plural: 'Quotations',        short: 'QUO', title: ['Quotation'],             numLabel: 'Quotation#',        dateLabel: 'Date:',         side: 'sale',     items: true },
  pi:      { label: 'Proforma Invoice', plural: 'Proforma Invoices', short: 'PI',  title: ['PROFORMA', 'INVOICE'],   numLabel: 'Proforma Invoice#', dateLabel: 'Date:',         side: 'sale',     items: true },
  invoice: { label: 'Tax Invoice',      plural: 'Invoices',          short: 'INV', title: ['TAX', 'INVOICE'],        numLabel: 'Invoice#',          dateLabel: 'Invoice Date:', side: 'sale',     items: true },
  dn:      { label: 'Delivery Note',    plural: 'Delivery Notes',    short: 'DN',  title: ['DELIVERY', 'NOTE'],      numLabel: 'Delivery#',         dateLabel: 'Date:',         side: 'sale',     items: true },
  receipt: { label: 'Payment Receipt',  plural: 'Receipts',          short: 'REC', title: ['Receipt'],               numLabel: 'Receipt#',          dateLabel: 'Receipt Date:', side: 'sale',     items: false },
  po:      { label: 'Purchase Order',   plural: 'Purchase Orders',   short: 'PO',  title: ['Purchase', 'Order'],     numLabel: 'PO#',               dateLabel: 'Date:',         side: 'purchase', items: true },
  purchase:{ label: 'Purchase Entry',   plural: 'Purchases',         short: 'PUR', title: ['Purchase', 'Entry'],     numLabel: 'Entry#',            dateLabel: 'Bill Date:',    side: 'purchase', items: true },
  payment: { label: 'Payment Voucher',  plural: 'Payments Made',     short: 'PAY', title: ['Payment', 'Voucher'],    numLabel: 'Voucher#',          dateLabel: 'Date:',         side: 'purchase', items: false },
};
const TYPE_ORDER = ['quote', 'pi', 'invoice', 'dn', 'receipt', 'po', 'purchase', 'payment'];

// "What comes next" buttons shown at the bottom of each document
const NEXT = {
  quote:   ['invoice', 'pi'],
  pi:      ['invoice'],
  invoice: ['dn', 'receipt'],
  po:       ['purchase'],
  purchase: ['payment'],
};

const STATES = [['01','Jammu & Kashmir'],['02','Himachal Pradesh'],['03','Punjab'],['04','Chandigarh'],['05','Uttarakhand'],['06','Haryana'],['07','Delhi'],['08','Rajasthan'],['09','Uttar Pradesh'],['10','Bihar'],['11','Sikkim'],['12','Arunachal Pradesh'],['13','Nagaland'],['14','Manipur'],['15','Mizoram'],['16','Tripura'],['17','Meghalaya'],['18','Assam'],['19','West Bengal'],['20','Jharkhand'],['21','Odisha'],['22','Chhattisgarh'],['23','Madhya Pradesh'],['24','Gujarat'],['26','Dadra & Nagar Haveli and Daman & Diu'],['27','Maharashtra'],['29','Karnataka'],['30','Goa'],['31','Lakshadweep'],['32','Kerala'],['33','Tamil Nadu'],['34','Puducherry'],['35','Andaman & Nicobar Islands'],['36','Telangana'],['37','Andhra Pradesh'],['38','Ladakh'],['97','Other Territory']];

const DEFAULT_SETTINGS = {
  company: {
    name: 'AJANTA PAVER',
    phones: '9377927995, 7041679595',
    address1: 'Ajanta Paver beside Vraj Kathiyawadi',
    address2: 'Near Parul University, Wagodiya, 391760',
    mobile: '8154085638',
    email: 'ajantapaver@gmail.com',
    state: 'GUJARAT',
    state_code: '24',
    gstin: '24ABCPP2236J2ZS',
  },
  payment_instructions: 'Bank of Baroda\nACCOUNT.NO.70960200001615\nIFSC CODE . BARB0DBWAGH',
  logo: '',       // data URL – empty = assets/logo.png
  signature: '',  // data URL – empty = assets/signature.png
  texts: {
    quote_intro: 'Dear Sir/Mam,\n\nThank you for your valuable inquiry. We are pleased to quote as below',
    quote_closing: 'We hope you find our offer to be in line with your requirement.',
    po_intro: 'Dear Sir/Mam,\n\nWe are pleased to submit the purchase order as below.',
    po_footer: 'E-Signature is not required for computer generated purchase order.',
  },
  design: {
    titles: {},            // custom title per document type, e.g. { invoice: 'TAX\nINVOICE' }
    hsn: 'auto',           // auto | always | never
    show_sign: true, show_bank: true, show_words: true, show_state: true, show_intro: true,
    head_color: '#f2f3f5', accent: '#1f2328',
    font_size: 11.5,
  },
  lists: {
    units: 'Sqft, Sqm, Nos, Pcs, Foot, Rft, Kg, Ton, Bag, Brass, Cft, Ltr, Set, Lot, Trip',
    methods: 'UPI, Cash, NEFT / RTGS, IMPS, Cheque, Bank Transfer, Card, Other',
    charges: 'Freight Charges, Transport Charges, Loading / Unloading, Packing Charges, Labour Charges, Other Charges',
    gst_rates: '0, 5, 12, 18, 28',
    default_unit: 'Sqft', default_gst: 18,
  },
  numbering: {
    quote:   { prefix: 'Quote-',   start: 11 },
    pi:      { prefix: 'PI-',      start: 7 },
    invoice: { prefix: 'INV-',     start: 21 },
    dn:      { prefix: 'DN-',      start: 3 },
    receipt: { prefix: 'RECEIPT-', start: 5 },
    po:      { prefix: 'PO-',      start: 4 },
    purchase:{ prefix: 'PUR-',     start: 1 },
    payment: { prefix: 'PAY-',     start: 1 },
  },
};

const lst = (k) => String(S.settings.lists?.[k] ?? DEFAULT_SETTINGS.lists[k]).split(',').map((x) => x.trim()).filter(Boolean);
const TERM_SCOPE = { quote: 'sales', pi: 'sales', invoice: 'sales', po: 'purchase' };
const SCOPE_TYPES = { sales: ['quote', 'pi', 'invoice'], purchase: ['po'] };
const bySort = (a, b) => (num(a.sort) - num(b.sort)) || String(a.created_at).localeCompare(String(b.created_at));

const SEED = {
  terms: () => [
    term({ scope: 'sales', title: 'Transport', content: 'Transport, Loading & Unloading included.', auto: ['quote'], sort: 1 }),
    term({ scope: 'sales', title: 'Payment', content: '30% Advance, 70% on Delivery.', auto: ['quote'], sort: 2 }),
  ],
  parties: () => [
    party({ name: 'Integrity Infrabuild Developers Ltd.', contact_person: 'Akshat Shah', phone: '7069759849', address: 'Indiabulls Megamall, T-02, Jetalpur Rd, Anand Nagar,\nAkota, Vadodara, Gujarat 390007', state_code: '24', gstin: '24AAHCI7013H1ZS', is_customer: true }),
    party({ name: 'PURUSHADANIYA PARAS ENTERPRISE', contact_person: 'NIKET SHAH', address: '9th Floor, P 901, Amber Heights, Gotri GERI Bansal Road,\nVadodara, Gujarat, 390021', state_code: '24', gstin: '24CHYPS8856H1Z9', is_customer: true }),
    party({ name: 'HK ENTERPRISES', contact_person: 'MD Khan', phone: '9999438141', state_code: '24', is_customer: true }),
    party({ name: 'DINESH STEEL AND ALLOYS', contact_person: 'Lokesh Soni', phone: '9714441905', address: '238A, New Lehripura, Gendigate Road\nVadodara, Gujarat, 390001', state_code: '24', gstin: '24AYLPM3961D1ZF', is_vendor: true }),
  ],
  products: () => [
    product({ name: 'Uni Paver Block', description: '80 mm Thickness,\nIncludes Loading-Unloading and transportation.\nGrade: M35+', unit: 'Sqft', rate: 65, tax_rate: 18 }),
    product({ name: 'Paver Block 60mm', unit: 'Sqft', rate: 35, tax_rate: 18 }),
    product({ name: 'SS304 Stud M10 1mtr Long', hsn: '73181500', unit: 'Nos', rate: 117, tax_rate: 18 }),
  ],
};

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');
const num = (v) => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); }));
const nowIso = () => new Date().toISOString();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = String(s).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const inr = (v) => '₹' + num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (v) => '₹' + Math.round(num(v)).toLocaleString('en-IN');
const pct = (v) => num(v).toFixed(2) + '%';
const clone = (o) => JSON.parse(JSON.stringify(o));
const stateName = (code) => (STATES.find((s) => s[0] === code) || [, ''])[1];
const gstState = (g) => (g && /^\d{2}/.test(g) ? g.slice(0, 2) : '');
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function deepMerge(base, over) {
  const out = clone(base);
  for (const k in over || {}) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && typeof out[k] === 'object') out[k] = deepMerge(out[k], over[k]);
    else if (over[k] !== undefined && over[k] !== null) out[k] = over[k];
  }
  return out;
}

function party(p) {
  return {
    id: p.id || uid(), name: p.name || '', contact_person: p.contact_person || '', phone: p.phone || '', email: p.email || '',
    address: p.address || '', shipping_address: p.shipping_address || '', state_code: p.state_code || '', gstin: (p.gstin || '').toUpperCase(),
    is_customer: !!p.is_customer, is_vendor: !!p.is_vendor, opening_balance: num(p.opening_balance), opening_type: p.opening_type === 'cr' ? 'cr' : 'dr',
    notes: p.notes || '', created_at: p.created_at || nowIso(), updated_at: nowIso(),
  };
}
function term(t) {
  return { id: t.id || uid(), scope: t.scope === 'purchase' ? 'purchase' : 'sales', title: t.title || '', content: t.content || '', auto: Array.isArray(t.auto) ? t.auto : [], sort: num(t.sort), created_at: t.created_at || nowIso() };
}
function product(p) {
  return { id: p.id || uid(), name: p.name || '', description: p.description || '', hsn: p.hsn || '', unit: p.unit || '', rate: num(p.rate), tax_rate: p.tax_rate === undefined || p.tax_rate === '' ? num(S.settings?.lists?.default_gst ?? 18) : num(p.tax_rate), created_at: p.created_at || nowIso() };
}

/* Indian-style amount in words: "Three Thousand Six Hundred Thirty-four Rupees And Forty Paisa Only/-" */
function inWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10].toLowerCase() : '');
  const three = (n) => { const h = Math.floor(n / 100), r = n % 100; return [h ? ones[h] + ' Hundred' : '', r ? two(r) : ''].filter(Boolean).join(' '); };
  const words = (n) => {
    if (n === 0) return 'Zero';
    const parts = [];
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const th = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push(words(crore) + ' Crore');
    if (lakh) parts.push(two(lakh) + ' Lakh');
    if (th) parts.push(two(th) + ' Thousand');
    if (n) parts.push(three(n));
    return parts.join(' ');
  };
  const a = r2(Math.abs(num(amount)));
  const rupees = Math.floor(a);
  const paise = Math.round((a - rupees) * 100);
  return words(rupees) + ' Rupees' + (paise ? ' And ' + words(paise) + ' Paisa' : '') + ' Only/-';
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-1.5-5-4-5.7"/>',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3z"/><path d="M4 18a3 3 0 0 1 3-3h11"/><path d="M8 8h6M8 11h4"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  share: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  rupee: '<path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10"/>',
  truck: '<path d="M1 4h14v12H1zM15 9h4l4 4v3h-8"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 7H6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
  zip: '<path d="M4 4h16v16H4z"/><path d="M12 4v2M12 8v2M12 12v2"/><rect x="10.5" y="14" width="3" height="3" rx=".6"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  clip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  ca: '<path d="M4 3h16v18H4z"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="M15 17l2 2 3-4"/>',
};
const icon = (n, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;
const TYPE_ICON = { quote: 'file', pi: 'file', invoice: 'rupee', dn: 'truck', receipt: 'download', po: 'cart', purchase: 'box', payment: 'rupee' };

/* ------------------------------------------------------------------ */
/*  Data layer (Supabase or browser storage)                           */
/* ------------------------------------------------------------------ */
const LS_KEY = 'ajanta_billing_v1';
const Local = {
  read() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; } },
  write(d) { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch (e) { toast('Could not save in this browser: ' + e.message, 'err'); throw e; } },
  async loadAll() {
    let d = this.read();
    if (!d) { d = { parties: SEED.parties(), products: SEED.products(), documents: [], terms: SEED.terms(), settings: {} }; this.write(d); }
    if (!d.terms) { d.terms = SEED.terms(); this.write(d); }
    return d;
  },
  async save(table, row) { const d = this.read(); d[table] = d[table] || []; const i = d[table].findIndex((r) => r.id === row.id); if (i >= 0) d[table][i] = row; else d[table].push(row); this.write(d); return row; },
  async bulk(table, rows) { for (const r of rows) await this.save(table, r); },
  async remove(table, id) { const d = this.read(); d[table] = d[table].filter((r) => r.id !== id); this.write(d); },
  async saveSettings(s) { const d = this.read(); d.settings = s; this.write(d); },
};
const Remote = {
  sb: null,
  init() { this.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); },
  async all(table) {
    let out = [], from = 0; const size = 1000;
    for (;;) {
      const { data, error } = await this.sb.from(table).select('*').order('created_at').range(from, from + size - 1);
      if (error) throw error;
      out = out.concat(data); if (data.length < size) break; from += size;
    }
    return out;
  },
  async loadAll() {
    const [parties, products, documents, terms, st] = await Promise.all([this.all('parties'), this.all('products'), this.all('documents'), this.all('terms'), this.sb.from('settings').select('*').eq('id', 1).maybeSingle()]);
    if (st.error) throw st.error;
    return { parties, products, documents, terms, settings: (st.data && st.data.data) || {} };
  },
  async save(table, row) { const { data, error } = await this.sb.from(table).upsert(row).select().single(); if (error) throw error; return data; },
  async bulk(table, rows) { for (let i = 0; i < rows.length; i += 200) { const { error } = await this.sb.from(table).upsert(rows.slice(i, i + 200)); if (error) throw error; } },
  async remove(table, id) { const { error } = await this.sb.from(table).delete().eq('id', id); if (error) throw error; },
  async saveSettings(s) { const { error } = await this.sb.from('settings').upsert({ id: 1, data: s, updated_at: nowIso() }); if (error) throw error; },
};

/* Attachments: Supabase Storage bucket "attachments" (cloud) or inline data (demo) */
const Files = {
  async prepare(file) {
    // shrink large photos so uploads are quick and PDFs stay small
    if (!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type) || file.size < 600 * 1024) return file;
    try {
      const url = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const sc = Math.min(1, 1800 / Math.max(im.width, im.height));
      const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch (e) { return file; }
  },
  async upload(docId, file) {
    file = await this.prepare(file);
    if (MODE === 'cloud') {
      const path = `purchase/${docId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
      const { error } = await Remote.sb.storage.from('attachments').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      return { name: file.name, type: file.type, size: file.size, path };
    }
    if (file.size > 1.5 * 1024 * 1024) throw new Error('in demo mode files must be under 1.5 MB (no limit once Supabase is connected)');
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    return { name: file.name, type: file.type, size: file.size, data };
  },
  async blob(a) {
    if (a.path) { const { data, error } = await Remote.sb.storage.from('attachments').download(a.path); if (error) throw error; return data; }
    return (await fetch(a.data)).blob();
  },
  async open(a) { const w = window.open('', '_blank'); const b = await this.blob(a); const u = URL.createObjectURL(b); if (w) w.location = u; else window.location = u; },
  async remove(a) { if (a.path && MODE === 'cloud') await Remote.sb.storage.from('attachments').remove([a.path]); },
};

const S = { parties: [], products: [], documents: [], terms: [], settings: clone(DEFAULT_SETTINGS) };
let DB = Local, MODE = 'demo', USER = null;

async function loadData() {
  const d = await DB.loadAll();
  S.parties = d.parties || []; S.products = d.products || []; S.documents = d.documents || []; S.terms = d.terms || [];
  S.settings = deepMerge(DEFAULT_SETTINGS, d.settings || {});
}
async function saveRow(table, row) {
  const saved = await DB.save(table, row);
  const arr = S[table]; const i = arr.findIndex((r) => r.id === saved.id);
  if (i >= 0) arr[i] = saved; else arr.push(saved);
  return saved;
}
async function removeRow(table, id) { await DB.remove(table, id); S[table] = S[table].filter((r) => r.id !== id); }

/* ------------------------------------------------------------------ */
/*  Business logic                                                     */
/* ------------------------------------------------------------------ */
const getParty = (id) => S.parties.find((p) => p.id === id);
const getDoc = (id) => S.documents.find((d) => d.id === id);
const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
const docsOf = (pid) => S.documents.filter((d) => d.party_id === pid);
const childrenOf = (id) => S.documents.filter((d) => d.ref_id === id);

function nextNo(type) {
  const n = S.settings.numbering[type] || { prefix: type.toUpperCase() + '-', start: 1 };
  let max = 0;
  S.documents.filter((d) => d.doc_type === type && String(d.doc_no).startsWith(n.prefix)).forEach((d) => {
    const v = parseInt(String(d.doc_no).slice(n.prefix.length), 10); if (v > max) max = v;
  });
  return n.prefix + Math.max(max + 1, num(n.start) || 1);
}

function calc(doc) {
  const cs = S.settings.company.state_code || '24';
  const p = doc.party || {};
  const ps = p.state_code || gstState(p.gstin) || cs;
  let mode = (doc.data && doc.data.tax_mode) || 'auto';
  if (mode === 'auto') mode = ps === cs ? 'split' : 'igst';
  const lines = (doc.items || []).filter((i) => (i.name || i.description || num(i.qty))).map((it, i) => {
    const qty = num(it.qty), rate = num(it.rate), tr = mode === 'none' ? 0 : num(it.tax_rate);
    const taxable = r2(qty * rate);
    let cgst = 0, sgst = 0, igst = 0;
    if (mode === 'split') { cgst = r2(taxable * tr / 200); sgst = cgst; } else if (mode === 'igst') { igst = r2(taxable * tr / 100); }
    const tax = r2(cgst + sgst + igst);
    return { ...it, idx: i + 1, qty, rate, tr, taxable, cgst, sgst, igst, tax, total: r2(taxable + tax) };
  });
  const charges = [], extras = [];
  if (doc.doc_type !== 'dn') (doc.data?.charges || []).filter((c) => c.label || num(c.amount)).forEach((c) => {
    const amt = r2(num(c.amount));
    if (c.taxable) {
      const tr = mode === 'none' ? 0 : num(c.tax_rate);
      let cgst = 0, sgst = 0, igst = 0;
      if (mode === 'split') { cgst = r2(amt * tr / 200); sgst = cgst; } else if (mode === 'igst') { igst = r2(amt * tr / 100); }
      const tax = r2(cgst + sgst + igst);
      charges.push({ name: c.label || 'Other Charges', description: '', charge: true, qty: 0, rate: amt, tr, taxable: amt, cgst, sgst, igst, tax, total: r2(amt + tax) });
    } else extras.push({ label: c.label || 'Other Charges', amount: amt });
  });
  charges.forEach((c, i) => { c.idx = lines.length + i + 1; lines.push(c); });
  const g = {};
  lines.forEach((l) => { if (!l.tr) return; const x = g[l.tr] || (g[l.tr] = { rate: l.tr, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 }); x.taxable += l.taxable; x.cgst += l.cgst; x.sgst += l.sgst; x.igst += l.igst; x.tax += l.tax; });
  const sum = (k) => r2(lines.reduce((a, l) => a + l[k], 0));
  const subtotal = sum('taxable'), tax = sum('tax');
  const extra = r2(extras.reduce((a, e) => a + e.amount, 0));
  return { mode, lines, extras, groups: Object.values(g).sort((a, b) => a.rate - b.rate), subtotal, tax, cgst: sum('cgst'), sgst: sum('sgst'), igst: sum('igst'), grand: r2(subtotal + tax + extra) };
}

function paidAgainst(doc) {
  const payType = doc.doc_type === 'purchase' || doc.doc_type === 'po' ? 'payment' : 'receipt';
  return r2(S.documents.filter((d) => d.doc_type === payType && d.ref_id === doc.id).reduce((a, d) => a + num(d.grand_total), 0));
}
function dueOf(doc) { return r2(num(doc.grand_total) - paidAgainst(doc)); }
function payStatus(doc) {
  const paid = paidAgainst(doc), due = r2(num(doc.grand_total) - paid);
  if (due <= 0.004 && num(doc.grand_total) > 0) return { k: 'ok', t: 'Paid' };
  if (paid > 0) return { k: 'warn', t: 'Partly paid' };
  return { k: 'bad', t: 'Unpaid' };
}
function statusTag(d) {
  if (d.doc_type === 'invoice' || d.doc_type === 'purchase') { const s = payStatus(d); return `<span class="tag ${s.k}">${s.t}</span>`; }
  if (d.doc_type === 'quote') {
    const conv = childrenOf(d.id).some((c) => c.doc_type === 'invoice' || c.doc_type === 'pi');
    if (d.status === 'rejected') return '<span class="tag bad">Rejected</span>';
    if (conv || d.status === 'accepted') return '<span class="tag ok">Accepted</span>';
    return '<span class="tag grey">Open</span>';
  }
  if (d.doc_type === 'pi') return childrenOf(d.id).some((c) => c.doc_type === 'invoice') ? '<span class="tag ok">Invoiced</span>' : '<span class="tag grey">Open</span>';
  if (d.doc_type === 'po') return childrenOf(d.id).some((c) => c.doc_type === 'purchase') ? '<span class="tag ok">Purchased</span>' : '<span class="tag grey">Open</span>';
  return '';
}

/* Ledger: Dr = they owe us (receivable), Cr = we owe them (payable) */
function ledgerEntries(pid) {
  const p = getParty(pid); if (!p) return [];
  const rows = [];
  if (num(p.opening_balance)) rows.push({ date: '', sort: '0000', part: 'Opening Balance', dr: p.opening_type === 'dr' ? num(p.opening_balance) : 0, cr: p.opening_type === 'cr' ? num(p.opening_balance) : 0 });
  docsOf(pid).forEach((d) => {
    const base = { date: d.doc_date, sort: d.doc_date + (d.created_at || ''), no: d.doc_no, id: d.id, type: d.doc_type };
    if (d.doc_type === 'invoice') rows.push({ ...base, part: 'Sales – Tax Invoice', dr: num(d.grand_total), cr: 0 });
    else if (d.doc_type === 'receipt') rows.push({ ...base, part: 'Payment Received' + (d.data?.method ? ' (' + d.data.method + ')' : '') + (d.data?.payment_for ? ' – for ' + d.data.payment_for : ''), dr: 0, cr: num(d.grand_total) });
    else if (d.doc_type === 'purchase') rows.push({ ...base, part: 'Purchase' + (d.data?.bill_no ? ' – Bill ' + d.data.bill_no : ''), dr: 0, cr: num(d.grand_total) });
    else if (d.doc_type === 'payment') rows.push({ ...base, part: 'Payment Made' + (d.data?.method ? ' (' + d.data.method + ')' : '') + (d.data?.payment_for ? ' – for ' + d.data.payment_for : ''), dr: num(d.grand_total), cr: 0 });
  });
  rows.sort((a, b) => a.sort.localeCompare(b.sort));
  let bal = 0; rows.forEach((r) => { bal = r2(bal + r.dr - r.cr); r.bal = bal; });
  return rows;
}
function balanceOf(pid) { const e = ledgerEntries(pid); return e.length ? e[e.length - 1].bal : 0; }
function balText(b) {
  if (Math.abs(b) < 0.005) return '<span class="muted amt">₹0.00</span>';
  return b > 0 ? `<span class="amt dr">${inr(b)} Dr</span>` : `<span class="amt cr">${inr(-b)} Cr</span>`;
}
function tagsOf(p) {
  return (p.is_customer ? '<span class="tag cust">Customer</span> ' : '') + (p.is_vendor ? '<span class="tag vend">Vendor</span>' : '');
}

/* ------------------------------------------------------------------ */
/*  UI plumbing                                                        */
/* ------------------------------------------------------------------ */
function toast(msg, kind = '') {
  const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), kind === 'err' ? 6000 : 2600);
}
function errMsg(e) { return (e && (e.message || e.error_description || e.details)) || String(e); }

function setPage(title, actions = '', back = null) {
  $('#pageTitle').textContent = title;
  $('#topActions').innerHTML = actions;
  const b = $('#backBtn');
  b.innerHTML = icon('back'); b.style.visibility = back ? 'visible' : 'hidden';
  b.onclick = () => { if (back) location.hash = back; };
  document.title = title + ' · ' + (S.settings.company.name || 'Billing');
}
const main = () => $('#main');

function openModal(title, body, foot = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="m-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">✕</button></div><div class="m-body">${body}</div>${foot ? `<div class="m-foot">${foot}</div>` : ''}`;
  $$('[data-close]', m).forEach((b) => b.onclick = () => m.close());
  if (!m.open) m.showModal();
  return m;
}
const closeModal = () => $('#modal').open && $('#modal').close();

function navHTML() {
  const L = [
    ['', 'home', 'Dashboard'], ['docs', 'file', 'Documents'],
    ['sep', 'Create'],
    ...TYPE_ORDER.map((t) => [`doc/new?type=${t}`, TYPE_ICON[t], TYPES[t].label]),
    ['sep', 'Accounts'],
    ['parties?f=customer', 'users', 'Customers'], ['parties?f=vendor', 'users', 'Vendors'], ['ledger', 'book', 'Ledger'], ['ca', 'ca', 'CA Export'],
    ['products', 'box', 'Products'], ['terms', 'list', 'Terms & Conditions'], ['export', 'zip', 'Export / Backup'], ['settings', 'gear', 'Settings'],
  ];
  NAV_LIST = L;
  $('#sidenav').innerHTML = L.map((x) => x[0] === 'sep' ? `<div class="sep">${x[1]}</div>` : `<a href="#/${x[0]}" data-nav="${x[0]}" title="${esc(x[2])}">${icon(x[1])}<span>${x[2]}</span></a>`).join('');
  const mb = $('#menuBtn'); if (mb) { mb.innerHTML = icon('menu'); mb.onclick = menuSheet; }
  $('#bottomnav').innerHTML = [
    ['', 'home', 'Home'], ['docs', 'file', 'Docs'], ['#new', 'plus', 'New'], ['parties', 'users', 'Parties'], ['ledger', 'book', 'Ledger'],
  ].map((x) => x[0] === '#new' ? `<a href="javascript:void 0" class="plus" id="mNew">${icon('plus')}<span>${x[2]}</span></a>` : `<a href="#/${x[0]}" data-nav="${x[0]}">${icon(x[1])}<span>${x[2]}</span></a>`).join('');
  $('#mNew').onclick = newDocSheet;
  $('#sidefoot').innerHTML = MODE === 'cloud'
    ? `<div>${esc(USER?.email || '')}</div><button id="logoutBtn">Sign out</button>`
    : `<div>Demo mode – data saved in this browser only</div>`;
  const lo = $('#logoutBtn'); if (lo) lo.onclick = logout;
}
let NAV_LIST = [];
function menuSheet() {
  openModal('Menu', `<div class="menu-sheet">${NAV_LIST.map((x) => x[0] === 'sep' ? `<div class="sep">${x[1]}</div>` : `<a href="#/${x[0]}">${icon(x[1])}<span>${x[2]}</span></a>`).join('')}</div>${MODE === 'cloud' ? `<button class="btn block" id="mLogout" style="margin-top:12px">${icon('logout')} Sign out ${esc(USER?.email || '')}</button>` : ''}`);
  $$('#modal .menu-sheet a').forEach((a) => a.addEventListener('click', closeModal));
  const lo = $('#mLogout'); if (lo) lo.onclick = logout;
}
function setActiveNav() {
  const h = location.hash.replace(/^#\/?/, '');
  const base = h.split('?')[0].split('/')[0];
  $$('[data-nav]').forEach((a) => {
    const n = a.dataset.nav;
    const on = n.includes('?') ? h === n : (n === '' ? h === '' : base === n);
    a.classList.toggle('active', on);
  });
}
function newDocSheet() {
  openModal('Create new', `<div class="quick">${TYPE_ORDER.map((t) => `<a href="#/doc/new?type=${t}" data-close><span class="qi">${icon(TYPE_ICON[t])}</span><b>${TYPES[t].label}</b></a>`).join('')}</div>`);
  $$('#modal .quick a').forEach((a) => a.addEventListener('click', closeModal));
}

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */
function route() {
  closeModal();
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const q = new URLSearchParams(qs || '');
  setActiveNav(); window.scrollTo(0, 0);
  try {
    switch (parts[0]) {
      case undefined: return viewDashboard();
      case 'docs': return viewDocs(q.get('type') || 'all', q.get('q') || '');
      case 'doc':
        if (parts[1] === 'new') return viewDocForm(null, q);
        if (parts[2] === 'edit') return viewDocForm(parts[1], q);
        return viewDoc(parts[1]);
      case 'parties': return viewParties(q.get('f') || 'all');
      case 'ledger': return parts[1] ? viewLedger(parts[1]) : viewLedgerIndex();
      case 'products': return viewProducts();
      case 'settings': return viewSettings();
      case 'ca': return viewCA();
      case 'terms': return viewTerms(q.get('s') || 'sales');
      case 'export': return viewExport();
      case 'import': return viewImport();
      default: return viewDashboard();
    }
  } catch (e) { console.error(e); main().innerHTML = `<div class="card">Something went wrong: ${esc(errMsg(e))}</div>`; }
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
function viewDashboard() {
  setPage('Dashboard', `<button class="btn primary hide-m" id="dNew">${icon('plus')} New document</button>`);
  const ym = today().slice(0, 7);
  const inMonth = (t) => S.documents.filter((d) => d.doc_type === t && String(d.doc_date).startsWith(ym)).reduce((a, d) => a + num(d.grand_total), 0);
  let recv = 0, pay = 0; S.parties.forEach((p) => { const b = balanceOf(p.id); if (b > 0) recv += b; else pay -= b; });
  const openQuotes = S.documents.filter((d) => d.doc_type === 'quote' && d.status !== 'rejected' && d.status !== 'accepted' && !childrenOf(d.id).some((c) => c.doc_type === 'invoice' || c.doc_type === 'pi'));
  const unpaid = S.documents.filter((d) => d.doc_type === 'invoice' && dueOf(d) > 0.004).sort((a, b) => dueOf(b) - dueOf(a));
  const recent = [...S.documents].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 8);
  main().innerHTML = `
    ${MODE === 'demo' ? '<div class="demo-banner"><b>Demo mode.</b> Data is saved only in this browser. Fill in <code>js/config.js</code> with your Supabase details to save everything online.</div>' : ''}
    <div class="stats">
      <div class="stat"><div class="k">Sales this month</div><div class="v amt">${inr0(inMonth('invoice'))}</div></div>
      <div class="stat"><div class="k">Received this month</div><div class="v amt">${inr0(inMonth('receipt'))}</div></div>
      <div class="stat"><div class="k">To receive (all customers)</div><div class="v amt dr">${inr0(recv)}</div></div>
      <div class="stat"><div class="k">To pay (all vendors)</div><div class="v amt cr">${inr0(pay)}</div></div>
    </div>
    <div class="tiles">
      <a class="ledger-tile" href="#/ledger"><span class="li">${icon('book')}</span><span><b>Ledger</b><span style="opacity:.85">All customers &amp; vendors, A–Z, with balances</span></span><span class="spacer"></span>${icon('arrow')}</a>
      <a class="ledger-tile ca" href="#/ca"><span class="li">${icon('ca')}</span><span><b>CA Export</b><span style="opacity:.85">Sales &amp; purchase PDFs for your CA by date range</span></span><span class="spacer"></span>${icon('arrow')}</a>
      <a class="ledger-tile terms" href="#/terms"><span class="li">${icon('list')}</span><span><b>Terms &amp; Conditions</b><span style="opacity:.85">${S.terms.length} saved · add or edit your terms</span></span><span class="spacer"></span>${icon('arrow')}</a>
      <a class="ledger-tile exp" href="#/export"><span class="li">${icon('zip')}</span><span><b>Export / Backup</b><span style="opacity:.85">All documents + attachments as ZIP, data in Excel</span></span><span class="spacer"></span>${icon('arrow')}</a>
    </div>
    <h2 style="font-size:15px;margin:20px 0 10px">Create</h2>
    <div class="quick">${TYPE_ORDER.map((t) => `<a href="#/doc/new?type=${t}"><span class="qi">${icon(TYPE_ICON[t])}</span><b>${TYPES[t].label}</b></a>`).join('')}</div>
    <div class="dash-cols">
      <div><h2 style="font-size:15px;margin-bottom:10px">Recent documents</h2>${docList(recent) || '<div class="list"><div class="empty">No documents yet. Start with a quotation or invoice.</div></div>'}</div>
      <div>
        <h2 style="font-size:15px;margin-bottom:10px">Unpaid invoices</h2>
        <div class="list">${unpaid.slice(0, 6).map((d) => `<a class="li-row" href="#/doc/${d.id}"><div class="li-main"><b>${esc(d.party?.name)}</b><div class="sub">${esc(d.doc_no)} · ${fmtDate(d.doc_date)}</div></div><div class="li-right amt dr">${inr(dueOf(d))}</div></a>`).join('') || '<div class="empty">All invoices are paid 🎉</div>'}</div>
        <h2 style="font-size:15px;margin:16px 0 10px">Open quotations <span class="muted small">(${openQuotes.length})</span></h2>
        <div class="list">${openQuotes.slice(0, 5).map((d) => `<a class="li-row" href="#/doc/${d.id}"><div class="li-main"><b>${esc(d.party?.name)}</b><div class="sub">${esc(d.doc_no)} · ${fmtDate(d.doc_date)}</div></div><div class="li-right amt">${inr(d.grand_total)}</div></a>`).join('') || '<div class="empty">No open quotations</div>'}</div>
      </div>
    </div>`;
  const dn = $('#dNew'); if (dn) dn.onclick = newDocSheet;
}

function docList(docs) {
  if (!docs.length) return '';
  return `<div class="list">${docs.map((d) => `
    <a class="li-row" href="#/doc/${d.id}">
      <span class="doc-ico t-${d.doc_type}">${TYPES[d.doc_type].short}</span>
      <div class="li-main"><b>${esc(d.party?.name || '—')}</b><div class="sub">${esc(d.doc_no)} · ${fmtDate(d.doc_date)} · ${TYPES[d.doc_type].label}</div></div>
      <div class="li-right"><div class="amt"><b>${d.doc_type === 'dn' ? '' : inr(d.grand_total)}</b></div><div>${statusTag(d)}</div></div>
    </a>`).join('')}</div>`;
}

/* ------------------------------------------------------------------ */
/*  Documents list                                                     */
/* ------------------------------------------------------------------ */
function viewDocs(type, q) {
  setPage('Documents', `<a class="btn primary" href="#/doc/new?type=${type === 'all' ? 'invoice' : type}">${icon('plus')} New ${type === 'all' ? '' : TYPES[type].label}</a>`);
  main().innerHTML = `
    <div class="chips">${['all', ...TYPE_ORDER].map((t) => `<a class="chip ${t === type ? 'active' : ''}" href="#/docs?type=${t}">${t === 'all' ? 'All' : TYPES[t].plural}</a>`).join('')}</div>
    <div class="row" style="margin-bottom:12px"><input class="search" id="dq" placeholder="Search number or party…" value="${esc(q)}"></div>
    <div id="dlist"></div>`;
  const draw = () => {
    const s = $('#dq').value.trim().toLowerCase();
    const docs = S.documents.filter((d) => (type === 'all' || d.doc_type === type) && (!s || (d.doc_no + ' ' + (d.party?.name || '')).toLowerCase().includes(s)))
      .sort((a, b) => (b.doc_date + b.created_at).localeCompare(a.doc_date + a.created_at));
    $('#dlist').innerHTML = docList(docs) || '<div class="list"><div class="empty">Nothing here yet.</div></div>';
  };
  $('#dq').oninput = debounce(draw, 120); draw();
}

/* ------------------------------------------------------------------ */
/*  Document form (create / edit)                                      */
/* ------------------------------------------------------------------ */
const blankItem = () => ({ name: '', description: '', hsn: '', qty: '', unit: S.settings.lists?.default_unit || 'Sqft', rate: '', tax_rate: num(S.settings.lists?.default_gst ?? 18) });

function blankDoc(type) {
  const t = S.settings.texts;
  const data = { tax_mode: 'auto' };
  if (type === 'quote') Object.assign(data, { intro: t.quote_intro, closing: t.quote_closing });
  if (TERM_SCOPE[type]) data.terms_list = S.terms.filter((x) => x.scope === TERM_SCOPE[type] && (x.auto || []).includes(type)).sort(bySort).map((x) => ({ title: x.title, content: x.content }));
  if (type === 'po') Object.assign(data, { intro: t.po_intro, footer: t.po_footer });
  if (type === 'invoice') data.ship_same = true;
  if (TYPES[type].items && type !== 'dn') data.charges = [];
  if (type === 'purchase') data.attachments = [];
  if (type === 'receipt' || type === 'payment') Object.assign(data, { method: lst('methods')[0] || 'UPI', reference: '', payment_for: '' });
  return {
    id: uid(), doc_type: type, doc_no: nextNo(type), doc_date: today(), party_id: null, party: null,
    items: TYPES[type].items ? [blankItem()] : [], data, subtotal: 0, tax_total: 0, grand_total: 0,
    ref_id: null, status: type === 'quote' ? 'open' : null, created_at: null, updated_at: null,
  };
}

function convertDoc(src, type, asCopy) {
  const d = blankDoc(type);
  d.party_id = src.party_id; d.party = src.party ? clone(src.party) : null;
  if (!asCopy) d.ref_id = src.id;
  if (TYPES[type].items && TYPES[src.doc_type].items) d.items = clone(src.items);
  d.data.tax_mode = src.data?.tax_mode || 'auto';
  if (asCopy) { d.data = { ...clone(src.data || {}), }; }
  if (type === 'invoice' && src.data?.ship_to) { d.data.ship_to = src.data.ship_to; d.data.ship_same = src.data.ship_same; }
  if (type === 'dn') d.data.vehicle_no = src.data?.vehicle_no || '';
  if (type !== 'dn' && TYPES[type].items && src.data?.charges) d.data.charges = clone(src.data.charges);
  if (type === 'invoice' && src.data?.po_no) d.data.po_no = src.data.po_no;
  if (!asCopy && TERM_SCOPE[type] && TERM_SCOPE[type] === TERM_SCOPE[src.doc_type]) { const tl = termsOf(src); if (tl.length) d.data.terms_list = clone(tl); }
  if (asCopy) { d.data.attachments = []; delete d.data.bill_no; }
  if (type === 'purchase' && src.doc_type === 'po') d.data.po_ref = src.doc_no;
  if ((type === 'receipt' && src.doc_type === 'invoice') || (type === 'payment' && (src.doc_type === 'purchase' || src.doc_type === 'po'))) {
    d.data.payment_for = src.doc_no; d.grand_total = Math.max(0, dueOf(src));
  }
  return d;
}

let F = null; // the document being edited

function viewDocForm(id, q) {
  let isNew = !id;
  if (id) { const d = getDoc(id); if (!d) return notFound(); F = clone(d); F.data = F.data || {}; F.items = F.items || []; }
  else {
    const type = q.get('type') || 'invoice';
    if (!TYPES[type]) return notFound();
    const from = q.get('from') && getDoc(q.get('from'));
    const copy = q.get('copy') && getDoc(q.get('copy'));
    F = from ? convertDoc(from, type) : copy ? convertDoc(copy, type, true) : blankDoc(type);
    if (q.get('party')) { const p = getParty(q.get('party')); if (p) { F.party_id = p.id; F.party = snapParty(p); } }
  }
  const T = TYPES[F.doc_type];
  setPage((isNew ? 'New ' : 'Edit ') + T.label, '', isNew ? '' : '/doc/' + F.id);
  $('#backBtn').style.visibility = 'visible'; $('#backBtn').onclick = () => history.back();

  const src = F.ref_id && getDoc(F.ref_id);
  main().innerHTML = `
    <div class="editor with-preview">
      <div>
        ${src ? `<div class="doc-links"><span class="muted small">Created from</span> <a class="tag grey" href="#/doc/${src.id}">${esc(TYPES[src.doc_type].label)} ${esc(src.doc_no)}</a></div>` : ''}
        <div class="card"><h2>${esc(T.label)} details</h2><div class="fgrid" id="fHead"></div></div>
        <div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">${T.side === 'sale' ? 'Customer' : 'Vendor'}</h2><span class="spacer"></span><button class="btn sm" id="fNewParty">${icon('plus')} New ${T.side === 'sale' ? 'customer' : 'vendor'}</button></div><div id="fParty"></div></div>
        ${T.items ? `<div class="card"><div class="row" style="margin-bottom:12px"><h2 style="margin:0">Items</h2><span class="spacer"></span>${F.doc_type !== 'dn' ? `<label class="f" style="flex-direction:row;align-items:center;gap:6px">GST <select id="fTaxMode" style="width:auto"><option value="auto">Auto (by state)</option><option value="split">CGST + SGST</option><option value="igst">IGST</option><option value="none">No GST</option></select></label>` : ''}</div><div class="items" id="fItems"></div><button class="btn" id="fAddItem" style="margin-top:12px">${icon('plus')} Add item</button></div>` : ''}
        ${T.items && F.doc_type !== 'dn' ? `<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Other charges</h2><span class="spacer"></span><button class="btn sm" id="fAddCharge">${icon('plus')} Add charge</button></div><div class="muted small" id="fChargeHint">Freight, transport, loading/unloading, packing etc.</div><div class="items" id="fCharges"></div></div>` : ''}
        ${F.doc_type === 'purchase' ? `<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Attachments</h2><span class="spacer"></span><label class="btn sm gold">${icon('clip')} Attach bill / file<input type="file" id="fFiles" multiple accept="image/*,application/pdf" hidden></label></div><div class="muted small">Attach the supplier's invoice copy (photo or PDF). These are included in the CA export.</div><div id="fAtt" style="margin-top:10px"></div></div>` : ''}
        ${!T.items ? `<div class="card"><h2>Payment details</h2><div class="fgrid" id="fPay"></div></div>` : ''}
        ${TERM_SCOPE[F.doc_type] ? `<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Terms &amp; conditions</h2><span class="spacer"></span><a class="btn sm" href="#/terms?s=${TERM_SCOPE[F.doc_type]}" target="_blank" rel="noopener">Manage saved terms</a></div><div id="fTerms"></div></div>` : ''}
        <div class="card" id="fTextsCard"><h2>Text on document</h2><div class="fgrid" id="fTexts"></div></div>
        <div class="savebar">
          <div class="totals-box" id="fTotals" style="margin-right:auto;min-width:200px"></div>
          <button class="btn" id="fPreviewBtn">Preview</button>
          <button class="btn primary" id="fSave">Save ${esc(T.label)}</button>
        </div>
      </div>
      <div class="pv-col"><div class="pv-sticky"><div class="muted small" style="margin-bottom:6px">Live preview</div><div class="paper-wrap" id="fPreview"></div></div></div>
    </div>`;

  if (TERM_SCOPE[F.doc_type] && !F.data.terms_list) F.data.terms_list = termsOf(F);
  delete F.data.terms;
  drawHead(); drawParty(); if (T.items) drawItems(); else drawPay(); drawTexts(); drawTerms(); refresh();
  if ($('#fCharges')) { drawCharges(); $('#fAddCharge').onclick = () => { F.data.charges = F.data.charges || []; F.data.charges.push({ label: lst('charges')[0] || 'Freight Charges', amount: '', taxable: true, tax_rate: num(S.settings.lists?.default_gst ?? 18) }); drawCharges(); refresh(); }; }
  REMOVED_FILES = [];
  if ($('#fAtt')) { drawAtt(); $('#fFiles').onchange = addFiles; }
  const tm = $('#fTaxMode'); if (tm) { tm.value = F.data.tax_mode || 'auto'; tm.onchange = () => { F.data.tax_mode = tm.value; refresh(); }; }
  const ai = $('#fAddItem'); if (ai) ai.onclick = () => { F.items.push(blankItem()); drawItems(); refresh(); const ins = $$('#fItems .item'); ins[ins.length - 1].querySelector('input').focus(); };
  $('#fNewParty').onclick = () => partyModal(null, (p) => { F.party_id = p.id; F.party = snapParty(p); drawParty(); if (!T.items) drawPay(); refresh(); }, T.side === 'sale' ? 'customer' : 'vendor');
  $('#fSave').onclick = saveDoc;
  $('#fPreviewBtn').onclick = () => {
    openModal('Preview', '<div class="paper-wrap" id="mPrev"></div>');
    $('#modal').style.width = 'min(860px,96vw)';
    mountPaper($('#mPrev'), F);
  };
}

function snapParty(p) { return { name: p.name, contact_person: p.contact_person, phone: p.phone, email: p.email, address: p.address, shipping_address: p.shipping_address || '', state_code: p.state_code || gstState(p.gstin), gstin: p.gstin }; }

function bindInputs(root, obj, after) {
  $$('[data-k]', root).forEach((el) => {
    const k = el.dataset.k;
    const ev = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input';
    el.addEventListener(ev, () => { obj[k] = el.type === 'checkbox' ? el.checked : el.value; after && after(k, el); });
  });
}

function drawHead() {
  const t = F.doc_type, el = $('#fHead');
  el.innerHTML = `
    <label class="f">${esc(TYPES[t].numLabel.replace('#', ' No.'))}<input data-k="doc_no" value="${esc(F.doc_no)}"></label>
    <label class="f">Date<input type="date" data-k="doc_date" value="${esc(F.doc_date)}"></label>
    ${t === 'quote' ? `<label class="f">Status<select data-k="status"><option value="open">Open</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label>` : ''}
    ${t === 'purchase' ? `<label class="f">Vendor invoice / bill no.<input data-dk="bill_no" value="${esc(F.data.bill_no || '')}" placeholder="Supplier's bill number"></label><label class="f">Against PO<input data-dk="po_ref" value="${esc(F.data.po_ref || '')}"></label>` : ''}
    ${t === 'invoice' ? `<label class="f">Customer PO no. (optional)<input data-dk="po_no" value="${esc(F.data.po_no || '')}"></label><label class="f">Due date (optional)<input type="date" data-dk="due_date" value="${esc(F.data.due_date || '')}"></label>` : ''}`;
  if (t === 'dn' || t === 'invoice') el.insertAdjacentHTML('beforeend', `<label class="f">Vehicle number${t === 'invoice' ? ' (optional)' : ''}<input data-dk="vehicle_no" value="${esc(F.data.vehicle_no || '')}" placeholder="GJ06AB1234"></label>`);
  const st = $('[data-k="status"]', el); if (st) st.value = F.status || 'open';
  bindInputs(el, F, refresh);
  bindData(el);
}
function bindData(root) {
  $$('[data-dk]', root).forEach((el) => {
    const k = el.dataset.dk;
    const ev = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input';
    el.addEventListener(ev, () => { F.data[k] = el.type === 'checkbox' ? el.checked : el.value; refresh(); if (k === 'ship_same') drawParty(); });
  });
}

function drawParty() {
  const T = TYPES[F.doc_type]; const flag = T.side === 'sale' ? 'is_customer' : 'is_vendor';
  const primary = S.parties.filter((p) => p[flag]).sort(byName), other = S.parties.filter((p) => !p[flag]).sort(byName);
  const p = F.party_id && getParty(F.party_id);
  const shipSame = F.data.ship_same !== false;
  $('#fParty').innerHTML = `
    <select id="fPartySel">
      <option value="">— Select ${T.side === 'sale' ? 'customer' : 'vendor'} —</option>
      <optgroup label="${T.side === 'sale' ? 'Customers' : 'Vendors'}">${primary.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>
      ${other.length ? `<optgroup label="${T.side === 'sale' ? 'Vendors (will also be tagged Customer)' : 'Customers (will also be tagged Vendor)'}">${other.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>` : ''}
    </select>
    ${F.party ? `<div class="party-info">${[F.party.contact_person, F.party.address, F.party.phone && 'Ph: ' + F.party.phone, F.party.gstin && 'GSTIN: ' + F.party.gstin].filter(Boolean).map(esc).join('\n')}</div>
      <div class="row" style="margin-top:6px">${p ? tagsOf(p) : ''}<span class="spacer"></span>${p ? `<button class="btn sm" id="fEditParty">${icon('edit')} Edit details</button>` : ''}</div>` : ''}
    ${F.doc_type === 'invoice' ? `<div style="margin-top:12px"><label class="check"><input type="checkbox" data-dk="ship_same" ${shipSame ? 'checked' : ''}> Ship to same as bill to address</label>
      ${!shipSame ? `<label class="f" style="margin-top:8px">Ship to address<textarea data-dk="ship_to" rows="3">${esc(F.data.ship_to || '')}</textarea></label>` : ''}</div>` : ''}`;
  const sel = $('#fPartySel'); sel.value = F.party_id || '';
  sel.onchange = () => {
    const np = getParty(sel.value); F.party_id = np ? np.id : null; F.party = np ? snapParty(np) : null;
    if (F.doc_type === 'invoice') { if (np && np.shipping_address) { F.data.ship_same = false; F.data.ship_to = np.shipping_address; } else { F.data.ship_same = true; F.data.ship_to = ''; } }
    if (!TYPES[F.doc_type].items) { F.ref_id = null; F.data.payment_for = ''; drawPay(); }
    drawParty(); refresh();
  };
  const ep = $('#fEditParty'); if (ep) ep.onclick = () => partyModal(p, (np) => { F.party = snapParty(np); drawParty(); refresh(); });
  bindData($('#fParty'));
}

function drawItems() {
  const dn = F.doc_type === 'dn';
  const showHsn = F.doc_type !== 'dn';
  $('#fItems').innerHTML = F.items.map((it, i) => `
    <div class="item" data-i="${i}">
      <span class="no">${i + 1}</span>
      ${F.items.length > 1 ? `<button class="icon-btn rm" data-rm="${i}" title="Remove">${icon('trash')}</button>` : ''}
      <div class="ig">
        <label class="f c4">Item<input data-ik="name" list="prodList" value="${esc(it.name)}" placeholder="e.g. Uni Paver Block"></label>
        ${showHsn ? `<label class="f c2">HSN / SAC<input data-ik="hsn" value="${esc(it.hsn)}"></label>` : '<span class="c2"></span>'}
        <label class="f c6">Description<textarea data-ik="description" rows="2" placeholder="Size, thickness, grade, inclusions…">${esc(it.description)}</textarea></label>
        <label class="f">Qty<input data-ik="qty" type="number" inputmode="decimal" step="any" value="${esc(it.qty)}"></label>
        <label class="f">Unit<input data-ik="unit" list="unitList" value="${esc(it.unit)}"></label>
        ${dn ? '' : `<label class="f">Rate ₹<input data-ik="rate" type="number" inputmode="decimal" step="any" value="${esc(it.rate)}"></label>
        <label class="f">GST %<input data-ik="tax_rate" type="number" inputmode="decimal" step="any" list="taxList" value="${esc(it.tax_rate)}"></label>
        <div class="lt c2" data-lt="${i}"></div>`}
      </div>
    </div>`).join('') +
    `<datalist id="prodList">${S.products.map((p) => `<option value="${esc(p.name)}">`).join('')}</datalist>
     <datalist id="unitList">${lst('units').map((u) => `<option value="${esc(u)}">`).join('')}</datalist>
     <datalist id="taxList">${lst('gst_rates').map((u) => `<option value="${esc(u)}">`).join('')}</datalist>`;
  $$('#fItems .item').forEach((row) => {
    const i = +row.dataset.i;
    $$('[data-ik]', row).forEach((el) => el.addEventListener('input', () => {
      const k = el.dataset.ik; F.items[i][k] = el.value;
      if (k === 'name') {
        const pr = S.products.find((p) => p.name.toLowerCase() === el.value.trim().toLowerCase());
        if (pr) {
          Object.assign(F.items[i], { name: pr.name, description: F.items[i].description || pr.description, hsn: pr.hsn || F.items[i].hsn, unit: pr.unit || F.items[i].unit, rate: F.items[i].rate || pr.rate, tax_rate: pr.tax_rate });
          drawItems(); const inp = $(`#fItems .item[data-i="${i}"] [data-ik="qty"]`); inp && inp.focus();
        }
      }
      refresh();
    }));
  });
  $$('#fItems [data-rm]').forEach((b) => b.onclick = () => { F.items.splice(+b.dataset.rm, 1); drawItems(); refresh(); });
}

function drawCharges() {
  const list = F.data.charges || [];
  $('#fChargeHint').style.display = list.length ? 'none' : '';
  $('#fCharges').innerHTML = list.map((c, i) => `
    <div class="item" data-ci="${i}"><button class="icon-btn rm" data-crm="${i}" title="Remove">${icon('trash')}</button>
      <div class="ig">
        <label class="f c3">Charge<input data-ck="label" list="chargeList" value="${esc(c.label)}"></label>
        <label class="f">Amount ₹<input data-ck="amount" type="number" inputmode="decimal" step="any" value="${esc(c.amount)}"></label>
        <label class="f">GST %<input data-ck="tax_rate" type="number" step="any" list="taxList2" value="${esc(c.tax_rate)}" ${c.taxable ? '' : 'disabled'}></label>
        <label class="check c6"><input type="checkbox" data-ck="taxable" ${c.taxable ? 'checked' : ''}> Taxable (GST applies)</label>
      </div></div>`).join('') + `<datalist id="chargeList">${lst('charges').map((x) => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="taxList2">${lst('gst_rates').map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
  $$('#fCharges [data-ci]').forEach((row) => {
    const c = list[+row.dataset.ci];
    $$('[data-ck]', row).forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
      c[el.dataset.ck] = el.type === 'checkbox' ? el.checked : el.value;
      if (el.type === 'checkbox') drawCharges();
      refresh();
    }));
  });
  $$('#fCharges [data-crm]').forEach((b) => b.onclick = () => { list.splice(+b.dataset.crm, 1); drawCharges(); refresh(); });
}

let REMOVED_FILES = [];
function drawAtt() {
  const list = F.data.attachments || [];
  $('#fAtt').innerHTML = list.length ? `<div class="list">${list.map((a, i) => `<div class="li-row"><span class="doc-ico t-purchase">${a.type === 'application/pdf' ? 'PDF' : 'IMG'}</span><div class="li-main"><b>${esc(a.name)}</b><div class="sub">${(num(a.size) / 1024).toFixed(0)} KB</div></div><button class="btn sm" data-aopen="${i}">Open</button><button class="icon-btn" data-arm="${i}" title="Remove">${icon('trash')}</button></div>`).join('')}</div>` : '';
  $$('#fAtt [data-aopen]').forEach((b) => b.onclick = () => Files.open(list[+b.dataset.aopen]).catch((e) => toast(errMsg(e), 'err')));
  $$('#fAtt [data-arm]').forEach((b) => b.onclick = () => { REMOVED_FILES.push(list[+b.dataset.arm]); list.splice(+b.dataset.arm, 1); drawAtt(); refresh(); });
}
async function addFiles(e) {
  const files = Array.from(e.target.files || []); e.target.value = '';
  F.data.attachments = F.data.attachments || [];
  for (const f of files) {
    try { toast('Uploading ' + f.name + '…'); F.data.attachments.push(await Files.upload(F.id, f)); drawAtt(); }
    catch (err) { toast(`Could not attach ${f.name}: ${errMsg(err)}`, 'err'); }
  }
}

function drawPay() {
  const isRec = F.doc_type === 'receipt';
  const againstType = isRec ? 'invoice' : 'purchase';
  const cands = F.party_id ? S.documents.filter((d) => d.party_id === F.party_id && d.doc_type === againstType && (d.id === F.ref_id || dueOf(d) > 0.004)) : [];
  $('#fPay').innerHTML = `
    <label class="f span2">Against ${isRec ? 'invoice' : 'purchase'}<select id="fAgainst">
      <option value="">${F.party_id ? 'On account / advance (no specific ' + (isRec ? 'invoice' : 'purchase') + ')' : 'Select ' + (isRec ? 'customer' : 'vendor') + ' first'}</option>
      ${cands.map((d) => `<option value="${d.id}">${esc(d.doc_no)}${d.data?.bill_no ? ' (bill ' + esc(d.data.bill_no) + ')' : ''} · ${fmtDate(d.doc_date)} · due ${inr(dueOf(d) + (d.id === F.ref_id && F.created_at ? num(F.grand_total) : 0))}</option>`).join('')}
    </select></label>
    <label class="f">Payment for (printed)<input data-dk="payment_for" value="${esc(F.data.payment_for || '')}" placeholder="INV-15 / Advance"></label>
    <label class="f">Amount ₹<input id="fAmt" type="number" inputmode="decimal" step="any" value="${F.grand_total ? esc(F.grand_total) : ''}"></label>
    <label class="f">Payment method<select data-dk="method">${[...new Set([...lst('methods'), F.data.method].filter(Boolean))].map((m) => `<option>${esc(m)}</option>`).join('')}</select></label>
    <label class="f">Reference # (UTR / cheque no.)<input data-dk="reference" value="${esc(F.data.reference || '')}"></label>`;
  $('#fAgainst').value = F.ref_id || '';
  $('[data-dk="method"]', $('#fPay')).value = F.data.method || 'UPI';
  $('#fAgainst').onchange = (e) => {
    const d = getDoc(e.target.value);
    F.ref_id = d ? d.id : null;
    if (d) { F.data.payment_for = d.data?.bill_no ? `${d.doc_no} / Bill ${d.data.bill_no}` : d.doc_no; if (!num(F.grand_total) || !F.created_at) F.grand_total = Math.max(0, dueOf(d)); }
    drawPay(); refresh();
  };
  $('#fAmt').oninput = (e) => { F.grand_total = num(e.target.value); refresh(); };
  bindData($('#fPay'));
}

function drawTexts() {
  const t = F.doc_type, el = $('#fTexts');
  const ta = (k, label, rows = 3) => `<label class="f full">${label}<textarea data-dk="${k}" rows="${rows}">${esc(F.data[k] || '')}</textarea></label>`;
  let h = '';
  if (t === 'quote') h = ta('intro', 'Opening text') + ta('closing', 'Closing line', 2);
  else if (t === 'po') h = ta('intro', 'Opening text') + ta('footer', 'Footer note', 2);
  h += ta('notes', 'Notes (optional – printed on document)', 2);
  el.innerHTML = h; bindData(el);
}

function termsOf(doc) {
  const D = doc.data || {};
  if (Array.isArray(D.terms_list)) return D.terms_list;
  if (D.terms) return [{ title: '', content: D.terms }];   // older documents
  return [];
}

function drawTerms() {
  const el = $('#fTerms'); if (!el) return;
  const scope = TERM_SCOPE[F.doc_type];
  const list = F.data.terms_list = F.data.terms_list || [];
  const saved = S.terms.filter((t) => t.scope === scope).sort(bySort);
  el.innerHTML = (list.length ? `<div class="items">${list.map((t, i) => `
      <div class="item" data-ti="${i}">
        <span class="no">${i + 1}</span>
        <div class="term-tools"><button class="icon-btn" data-tmv="-1" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button><button class="icon-btn" data-tmv="1" title="Move down" ${i === list.length - 1 ? 'disabled' : ''}>↓</button><button class="icon-btn" data-trm title="Remove" style="color:var(--bad)">${icon('trash')}</button></div>
        <label class="f">Title<input data-tk="title" value="${esc(t.title)}" placeholder="e.g. Payment"></label>
        <label class="f" style="margin-top:6px">Content<textarea data-tk="content" rows="2">${esc(t.content)}</textarea></label>
      </div>`).join('')}</div>` : '<div class="muted small" style="margin-bottom:10px">No terms on this document yet. Pick from your saved list below.</div>') + `
    <select id="fTermAdd" class="term-add" style="margin-top:10px">
      <option value="">＋ Add terms &amp; conditions…</option>
      ${saved.length ? `<optgroup label="Saved terms (${scope === 'sales' ? 'Quotation / PI / Invoice' : 'Purchase Order'})">${saved.map((t) => `<option value="${t.id}">${esc(t.title || t.content.slice(0, 50))}${t.title && t.content ? ' — ' + esc(t.content.replace(/\n/g, ' ').slice(0, 45)) : ''}</option>`).join('')}</optgroup>` : ''}
      <option value="__all">＋ Add all saved terms</option>
      <option value="__new">✚ Add new terms…</option>
    </select>`;
  $$('#fTerms [data-ti]').forEach((row) => {
    const i = +row.dataset.ti;
    $$('[data-tk]', row).forEach((inp) => inp.addEventListener('input', () => { list[i][inp.dataset.tk] = inp.value; refresh(); }));
    $('[data-trm]', row).onclick = () => { list.splice(i, 1); drawTerms(); refresh(); };
    $$('[data-tmv]', row).forEach((b) => b.onclick = () => { const j = i + +b.dataset.tmv; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; drawTerms(); refresh(); });
  });
  $('#fTermAdd').onchange = (e) => {
    const v = e.target.value; e.target.value = '';
    if (!v) return;
    if (v === '__new') return termModal(null, scope, (t, keep) => { list.push({ title: t.title, content: t.content }); drawTerms(); refresh(); }, true);
    if (v === '__all') saved.forEach((t) => list.push({ title: t.title, content: t.content }));
    else { const t = S.terms.find((x) => x.id === v); if (t) list.push({ title: t.title, content: t.content }); }
    drawTerms(); refresh();
  };
}

const refresh = debounce(() => {
  if (!F || !$('#fTotals')) return;
  const T = TYPES[F.doc_type];
  if (T.items) {
    const k = calc(F);
    F.subtotal = k.subtotal; F.tax_total = k.tax; F.grand_total = F.doc_type === 'dn' ? 0 : k.grand;
    $$('[data-lt]').forEach((el) => { const it = F.items[+el.dataset.lt]; el.textContent = inr(r2(num(it.qty) * num(it.rate))); });
    if (F.doc_type === 'dn') { const q = F.items.reduce((a, i) => a + num(i.qty), 0); $('#fTotals').innerHTML = `<div class="tr"><span>Total qty</span><b>${q.toLocaleString('en-IN')}</b></div>`; }
    else $('#fTotals').innerHTML = `<div class="tr"><span>Taxable</span><span class="amt">${inr(k.subtotal)}</span></div><div class="tr"><span>GST ${k.mode === 'igst' ? '(IGST)' : k.mode === 'split' ? '(CGST+SGST)' : ''}</span><span class="amt">${inr(k.tax)}</span></div><div class="tr g"><span>Total</span><span class="amt">${inr(k.grand)}</span></div>`;
  } else {
    $('#fTotals').innerHTML = `<div class="tr g" style="border:none;margin:0;padding:0"><span>Amount</span><span class="amt">${inr(F.grand_total)}</span></div>`;
  }
  const pv = $('#fPreview'); if (pv && pv.offsetParent) mountPaper(pv, F);
}, 150);

async function saveDoc() {
  const T = TYPES[F.doc_type];
  F.doc_no = String(F.doc_no || '').trim();
  if (!F.doc_no) return toast('Please enter a document number', 'err');
  if (S.documents.some((d) => d.doc_type === F.doc_type && d.doc_no === F.doc_no && d.id !== F.id)) return toast(`${F.doc_no} already exists. Use a different number.`, 'err');
  if (!F.party_id) return toast(`Please select a ${T.side === 'sale' ? 'customer' : 'vendor'}`, 'err');
  if (T.items) {
    F.items = F.items.filter((i) => i.name || i.description || num(i.qty));
    if (!F.items.length) { F.items = [blankItem()]; drawItems(); return toast('Add at least one item', 'err'); }
    const k = calc(F); F.subtotal = k.subtotal; F.tax_total = k.tax; F.grand_total = F.doc_type === 'dn' ? 0 : k.grand;
  } else {
    F.grand_total = r2(num(F.grand_total)); F.subtotal = F.grand_total; F.tax_total = 0;
    if (F.grand_total <= 0) return toast('Enter the amount', 'err');
  }
  const btn = $('#fSave'); btn.disabled = true;
  try {
    // tag party as customer / vendor automatically
    const p = getParty(F.party_id); const flag = T.side === 'sale' ? 'is_customer' : 'is_vendor';
    if (p && !p[flag]) await saveRow('parties', { ...p, [flag]: true, updated_at: nowIso() });
    F.party = snapParty(getParty(F.party_id));
    if (!F.created_at) F.created_at = nowIso();
    F.updated_at = nowIso();
    const old = getDoc(F.id);
    const saved = await saveRow('documents', F);
    if (old && old.doc_no !== saved.doc_no) await renumberLinks(old.doc_no, saved);
    for (const a of REMOVED_FILES) { try { await Files.remove(a); } catch (e) { console.warn(e); } }
    REMOVED_FILES = [];
    toast(`${T.label} ${saved.doc_no} saved`, 'ok');
    location.hash = '/doc/' + saved.id;
  } catch (e) { toast('Could not save: ' + errMsg(e), 'err'); btn.disabled = false; }
}

// when a document number changes, update linked documents that mention it
async function renumberLinks(oldNo, doc) {
  const rx = new RegExp('(^|[^\\w-])' + oldNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])', 'g');
  const changed = [];
  S.documents.forEach((d) => {
    if (d.id === doc.id) return;
    const D = d.data || {}; let hit = false; const nd = clone(D);
    ['payment_for', 'po_ref'].forEach((k) => { if (typeof nd[k] === 'string' && rx.test(nd[k])) { rx.lastIndex = 0; nd[k] = nd[k].replace(rx, (m, pre) => pre + doc.doc_no); hit = true; } rx.lastIndex = 0; });
    if (hit) changed.push({ ...d, data: nd, updated_at: nowIso() });
  });
  for (const d of changed) await saveRow('documents', d);
  if (changed.length) toast(`Updated ${changed.length} linked document(s) to ${doc.doc_no}`);
}

/* ------------------------------------------------------------------ */
/*  Document view                                                      */
/* ------------------------------------------------------------------ */
function notFound() { setPage('Not found', '', '/'); main().innerHTML = '<div class="card empty">This item was not found. It may have been deleted.</div>'; }

function viewDoc(id) {
  const d = getDoc(id); if (!d) return notFound();
  const T = TYPES[d.doc_type];
  setPage(`${T.label} ${d.doc_no}`, `
    <a class="btn sm" href="#/doc/${d.id}/edit">${icon('edit')}<span class="hide-m">Edit</span></a>
    <button class="btn sm" id="vPrint">${icon('print')}<span class="hide-m">Print / PDF</span></button>
    <button class="btn sm" id="vShare">${icon('share')}<span class="hide-m">WhatsApp</span></button>
    <button class="btn sm" id="vCopy" title="Duplicate">${icon('copy')}</button>
    <button class="btn sm danger" id="vDel" title="Delete">${icon('trash')}</button>`, '/docs?type=' + d.doc_type);

  const src = d.ref_id && getDoc(d.ref_id);
  const kids = childrenOf(d.id);
  let pay = '';
  if (d.doc_type === 'invoice' || d.doc_type === 'purchase') {
    const paid = paidAgainst(d), s = payStatus(d);
    pay = `<div class="card paystat"><span class="tag ${s.k}">${s.t}</span><span>Total <b class="amt">${inr(d.grand_total)}</b></span><span>${d.doc_type === 'purchase' ? 'Paid' : 'Received'} <b class="amt cr">${inr(paid)}</b></span><span>Balance <b class="amt dr">${inr(dueOf(d))}</b></span></div>`;
  }
  const nexts = (NEXT[d.doc_type] || []).filter((t) => !(t === 'receipt' && dueOf(d) <= 0.004) && !(t === 'payment' && dueOf(d) <= 0.004) && !(t === 'purchase' && childrenOf(d.id).some((c) => c.doc_type === 'purchase')));
  main().innerHTML = `
    ${(src || kids.length) ? `<div class="doc-links">
      ${src ? `<span class="muted small">Created from</span> <a class="tag grey" href="#/doc/${src.id}">${esc(TYPES[src.doc_type].label)} ${esc(src.doc_no)}</a>` : ''}
      ${kids.length ? `<span class="muted small" style="margin-left:8px">Linked</span> ${kids.map((k) => `<a class="tag grey" href="#/doc/${k.id}">${esc(TYPES[k.doc_type].label)} ${esc(k.doc_no)}</a>`).join(' ')}` : ''}
    </div>` : ''}
    ${pay}
    <div class="paper-wrap" id="vPaper"></div>
    <div class="nextbar ${nexts.length ? '' : 'hide-m'}">
      <span class="lbl hide-m">${nexts.length ? 'Next step' : 'Actions'}</span>
      ${nexts.map((t) => `<a class="btn ${t === 'invoice' ? 'primary' : 'gold'}" href="#/doc/new?type=${t}&from=${d.id}">${icon(TYPE_ICON[t])} Make ${TYPES[t].label}</a>`).join('')}
      ${d.doc_type === 'purchase' && (d.data?.attachments || []).length ? (d.data.attachments.map((a, i) => `<button class="btn" data-vatt="${i}">${icon('clip')} ${esc(a.name.length > 22 ? a.name.slice(0, 20) + '…' : a.name)}</button>`).join('')) : ''}
      <a class="btn hide-m" href="#/ledger/${d.party_id}">${icon('book')} Ledger</a>
      <button class="btn hide-m" id="vPrint2">${icon('print')} Print / PDF</button>
    </div>`;
  mountPaper($('#vPaper'), d);
  const pr = () => printDoc(d);
  $('#vPrint').onclick = pr; $('#vPrint2').onclick = pr;
  $('#vShare').onclick = () => shareWhatsApp(d);
  $('#vCopy').onclick = () => { location.hash = `/doc/new?type=${d.doc_type}&copy=${d.id}`; };
  $('#vDel').onclick = async () => {
    if (kids.length && !confirm(`${d.doc_no} has linked documents (${kids.map((k) => k.doc_no).join(', ')}). They will stay but lose the link. Continue?`)) return;
    if (!confirm(`Delete ${T.label} ${d.doc_no}? This cannot be undone.`)) return;
    try { await removeRow('documents', d.id); for (const a of d.data?.attachments || []) { try { await Files.remove(a); } catch (e) { console.warn(e); } } toast('Deleted', 'ok'); location.hash = '/docs?type=' + d.doc_type; } catch (e) { toast('Could not delete: ' + errMsg(e), 'err'); }
  };
  $$('[data-vatt]').forEach((b) => b.onclick = () => Files.open(d.data.attachments[+b.dataset.vatt]).catch((e) => toast(errMsg(e), 'err')));
}

function mountPaper(wrap, doc, html) {
  wrap.innerHTML = html || paperHTML(doc);
  const paper = wrap.querySelector('.paper');
  const fit = () => {
    const w = wrap.clientWidth || 794; const s = Math.min(1, w / 794);
    paper.style.transform = `scale(${s})`; wrap.style.height = paper.offsetHeight * s + 'px';
  };
  fit(); requestAnimationFrame(fit);
  const imgs = $$('img', paper); imgs.forEach((im) => im.complete || im.addEventListener('load', fit));
  wrap._fit = fit;
  if (!wrap._ro && window.ResizeObserver) { wrap._ro = new ResizeObserver(() => wrap._fit && wrap._fit()); wrap._ro.observe(wrap); }
}

function printHTML(html, title) {
  $('#printArea').innerHTML = html;
  const old = document.title; document.title = title;
  const imgs = $$('#printArea img');
  Promise.all(imgs.map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; }))).then(() => {
    setTimeout(() => { window.print(); document.title = old; }, 50);
  });
}
function printDoc(d) { printHTML(paperHTML(d), `${d.doc_no} ${d.party?.name || ''}`.trim()); }

function shareWhatsApp(d) {
  const T = TYPES[d.doc_type], c = S.settings.company;
  let phone = String(d.party?.phone || '').replace(/\D/g, ''); if (phone.length === 10) phone = '91' + phone;
  const amt = d.doc_type === 'dn' ? '' : `\nAmount: ${inr(d.grand_total)}`;
  const txt = `Dear ${d.party?.contact_person || d.party?.name || 'Sir/Madam'},\n\nPlease find our ${T.label} *${d.doc_no}* dated ${fmtDate(d.doc_date)}.${amt}\n\nThank you,\n${c.name}\n${c.mobile}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(txt)}`, '_blank');
  toast('Tip: use Print / PDF → Save as PDF, then attach the PDF in WhatsApp');
}

/* ------------------------------------------------------------------ */
/*  Printed document (matches your existing formats)                   */
/* ------------------------------------------------------------------ */
function pIcon(n) { return `<svg class="ic" viewBox="0 0 24 24">${ICONS[n]}</svg>`; }

function paperHead(doc) {
  const c = S.settings.company, T = TYPES[doc.doc_type];
  const showState = (doc.doc_type === 'invoice' || doc.doc_type === 'pi') && S.settings.design?.show_state !== false;
  const logo = S.settings.logo || 'assets/logo.png';
  return `<div class="pp-head">
    <div class="pp-logo"><img src="${esc(logo)}" alt=""></div>
    <div class="pp-co">
      <div class="pp-name">${esc(c.name)}</div>
      ${c.phones ? `<div>${esc(c.phones)}</div>` : ''}
      ${c.address1 ? `<div>${esc(c.address1)}</div>` : ''}
      ${c.address2 ? `<div>${esc(c.address2)}</div>` : ''}
      <div>${c.mobile ? pIcon('phone') + ' ' + esc(c.mobile) : ''}&nbsp;&nbsp;${c.email ? pIcon('mail') + ' ' + esc(c.email) : ''}</div>
      ${showState ? `<div><b>State Name</b> ${esc(c.state)} - ${esc(c.state_code)}</div>` : ''}
      ${c.gstin ? `<div><b>GSTIN:</b> ${esc(c.gstin)}</div>` : ''}
    </div>
    <div class="pp-title">${docTitle(doc.doc_type).map(esc).join('<br>')}</div>
  </div>`;
}

function partyBlock(p, label, o = {}) {
  p = p || {};
  const sc = p.state_code || gstState(p.gstin);
  return `<div>
    <div class="pp-lbl">${esc(label)}</div>
    <div class="pp-pname">${esc(p.name || '')}</div>
    ${p.contact_person ? `<div>${esc(p.contact_person)}</div>` : ''}
    ${p.address ? `<div class="pp-pre">${esc(p.address)}</div>` : ''}
    ${o.phone !== false && p.phone ? `<div>${pIcon('phone')} ${esc(p.phone)}</div>` : ''}
    ${p.gstin ? `<div><b>GSTIN:</b> ${esc(p.gstin)}</div>` : ''}
    ${o.state && sc ? `<div><b>State Name:</b> ${esc(stateName(sc).toUpperCase())} - ${esc(sc)}</div>` : ''}
  </div>`;
}

function metaBlock(doc) {
  const T = TYPES[doc.doc_type];
  const rows = [[T.numLabel, doc.doc_no], [T.dateLabel, fmtDate(doc.doc_date)]];
  const D = doc.data || {};
  if (doc.doc_type === 'invoice' && D.po_no) rows.push(['PO No:', D.po_no]);
  if (doc.doc_type === 'invoice' && D.due_date) rows.push(['Due Date:', fmtDate(D.due_date)]);
  if (doc.doc_type === 'purchase' && D.bill_no) rows.push(['Vendor Bill No:', D.bill_no]);
  if (doc.doc_type === 'purchase' && D.po_ref) rows.push(['Against PO:', D.po_ref]);
  if (D.vehicle_no && (doc.doc_type === 'dn' || doc.doc_type === 'invoice')) rows.push(['Vehicle Number', D.vehicle_no]);
  return `<table class="pp-meta">${rows.map((r) => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table>`;
}

function docTitle(type) {
  const c = S.settings.design?.titles?.[type];
  return c && c.trim() ? c.split('\n') : (TYPES[type]?.title || ['']);
}
function signBlock(withImg = true) {
  if (S.settings.design?.show_sign === false) withImg = false;
  const c = S.settings.company; const sig = S.settings.signature || 'assets/signature.png';
  return `<div class="pp-sign"><div class="for">For, ${esc(c.name)}</div>${withImg ? `<img src="${esc(sig)}" alt="">` : '<div class="blank"></div>'}<div class="as">AUTHORIZED SIGNATURE</div></div>`;
}

function itemsTable(doc, k) {
  const t = doc.doc_type;
  const hm = S.settings.design?.hsn || 'auto';
  const showHsn = t !== 'dn' && hm !== 'never' && (hm === 'always' || k.lines.some((l) => l.hsn));
  const H = [['#', 'c-no'], ['DESCRIPTION', '']];
  if (showHsn) H.push(['HSN', 'c-hsn']);
  H.push(['QTY', 'c-qty']);
  if (t !== 'dn') {
    H.push(['PRICE', 'c-num']);
    if (t === 'quote' && k.mode !== 'none') H.push(['TAX', 'c-num']);
    if (t === 'pi' && k.mode !== 'none') { H.push(['TAXABLE<br>AMOUNT', 'c-num']); if (k.mode === 'split') H.push(['CGST', 'c-num'], ['SGST', 'c-num']); else H.push(['IGST', 'c-num']); }
    H.push(['TOTAL', 'c-num']);
  }
  const rows = k.lines.map((l) => {
    const c = [`<td class="c-no">${l.idx}</td>`, `<td><div class="pp-iname">${esc(l.name)}</div>${l.description ? `<div class="pp-idesc">${esc(l.description)}</div>` : ''}</td>`];
    if (showHsn) c.push(`<td class="c-hsn">${esc(l.hsn || '')}</td>`);
    c.push(l.charge ? '<td class="c-qty"></td>' : `<td class="c-qty">${esc(fmtQty(l.qty))}<div class="pp-unit">${esc(l.unit || '')}</div></td>`);
    if (t !== 'dn') {
      c.push(`<td class="c-num">${l.charge ? '' : inr(l.rate)}</td>`);
      if (t === 'quote' && k.mode !== 'none') c.push(`<td class="c-num">${inr(l.tax)}<div class="pp-rate">${pct(l.tr)}</div></td>`);
      if (t === 'pi' && k.mode !== 'none') {
        c.push(`<td class="c-num">${inr(l.taxable)}</td>`);
        if (k.mode === 'split') c.push(`<td class="c-num">${inr(l.cgst)}<div class="pp-rate">${pct(l.tr / 2)}</div></td>`, `<td class="c-num">${inr(l.sgst)}<div class="pp-rate">${pct(l.tr / 2)}</div></td>`);
        else c.push(`<td class="c-num">${inr(l.igst)}<div class="pp-rate">${pct(l.tr)}</div></td>`);
      }
      c.push(`<td class="c-num">${inr(t === 'quote' || t === 'pi' ? l.total : l.taxable)}</td>`);
    }
    return `<tr>${c.join('')}</tr>`;
  }).join('');
  return `<table class="pp-items"><thead><tr>${H.map((h) => `<th class="${h[1]}">${h[0]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}
const fmtQty = (q) => Number.isInteger(q) ? String(q) : String(r2(q));

function totalsTable(doc, k) {
  const t = doc.doc_type, R = [];
  const row = (a, b, cls = '') => `<tr class="${cls}"><td>${a}</td><td>${b}</td></tr>`;
  if (k.mode === 'none') { R.push(row('SUB TOTAL', inr(k.subtotal))); }
  else if (t === 'quote') { R.push(row('SUB TOTAL', inr(k.subtotal)), row('TAX', inr(k.tax))); }
  else if (t === 'pi') {
    R.push(row('TAXABLE AMOUNT', inr(k.subtotal)));
    if (k.mode === 'split') R.push(row('CGST', inr(k.cgst)), row('SGST', inr(k.sgst))); else R.push(row('IGST', inr(k.igst)));
  } else if (t === 'invoice' || t === 'purchase') {
    R.push(row('TAXABLE AMOUNT', inr(k.subtotal)));
    k.groups.forEach((g) => {
      if (k.mode === 'split') R.push(row(`CGST <small>(${pct(g.rate / 2)})</small>`, inr(g.cgst)), row(`SGST <small>(${pct(g.rate / 2)})</small>`, inr(g.sgst)));
      else R.push(row(`IGST <small>(${pct(g.rate)})</small>`, inr(g.igst)));
    });
  } else if (t === 'po') {
    R.push(row('SUB TOTAL', inr(k.subtotal)));
    if (k.groups.length === 1) R.push(row(`TAX (${pct(k.groups[0].rate)})`, inr(k.tax))); else R.push(row('TAX', inr(k.tax)));
  }
  (k.extras || []).forEach((e) => R.push(row(esc(e.label.toUpperCase()), inr(e.amount))));
  R.push(row('GRAND TOTAL', inr(k.grand), 'g'));
  return `<table class="pp-tot">${R.join('')}</table>`;
}

function bullets(s) { return String(s || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => '• ' + esc(x.replace(/^[•\-*]\s*/, ''))).join('<br>'); }

function paperHTML(doc) {
  const t = doc.doc_type;
  if (t === 'receipt' || t === 'payment') return receiptPaper(doc);
  const k = calc(doc); const D = doc.data || {};
  const DS = S.settings.design || {};
  const payIns = S.settings.payment_instructions && DS.show_bank !== false ? `<div class="pp-block"><b>PAYMENT INSTRUCTIONS</b><div class="pp-pre">${esc(S.settings.payment_instructions)}</div></div>` : '<div></div>';
  const words = DS.show_words === false ? '<div></div>' : `<div class="pp-words"><b>AMOUNT IN WORDS:</b>${esc(inWords(k.grand))}</div>`;
  const terms = termsBlock(doc);
  const notes = D.notes ? `<div class="pp-note"><b>NOTES:</b><br>${esc(D.notes)}</div>` : '';
  let top, body = '', foot = '';
  if (t === 'invoice') {
    const ship = D.ship_same === false ? `<div><div class="pp-lbl">SHIP TO</div><div class="pp-pre">${esc(D.ship_to)}</div></div>` : `<div><div class="pp-lbl">SHIP TO</div><div class="pp-pre">${esc(doc.party?.address || '')}</div></div>`;
    top = `<div class="pp-top c3">${partyBlock(doc.party, 'BILL TO', { state: true, phone: false })}${ship}<div>${metaBlock(doc)}</div></div>`;
  } else {
    const label = t === 'pi' || t === 'dn' ? 'BILL TO' : t === 'purchase' ? 'VENDOR' : 'To,';
    top = `<div class="pp-top c2">${partyBlock(doc.party, label, { state: t === 'pi' })}<div>${metaBlock(doc)}</div></div>`;
  }
  if (D.intro && DS.show_intro !== false && (t === 'quote' || t === 'po')) body += `<div class="pp-intro">${esc(D.intro)}</div>`;
  body += itemsTable(doc, k);
  if (t === 'quote') {
    body += `<div class="pp-sum"><div></div>${totalsTable(doc, k)}</div>`;
    if (D.closing) body += `<div class="pp-intro" style="margin-top:26px">${esc(D.closing)}</div>`;
    body += notes;
    foot = `<div class="pp-foot2"><div>${terms}</div>${payIns}</div><div class="pp-foot" style="margin-top:14px"><div></div>${signBlock()}</div>`;
  } else if (t === 'pi' || t === 'invoice') {
    body += `<div class="pp-sum">${words}${totalsTable(doc, k)}</div>` + notes;
    if (terms) body += `<div style="margin-top:18px">${terms}</div>`;
    foot = `<div class="pp-foot">${payIns}${signBlock()}</div>`;
  } else if (t === 'po') {
    body += `<div class="pp-sum">${words}${totalsTable(doc, k)}</div>`;
    if (terms) body += `<div style="margin-top:16px">${terms}</div>`;
    body += notes;
    if (D.footer) body += `<div class="pp-intro" style="margin-top:22px">${esc(D.footer)}</div>`;
    foot = `<div class="pp-foot"><div></div>${signBlock()}</div>`;
  } else if (t === 'purchase') {
    body += `<div class="pp-sum">${words}${totalsTable(doc, k)}</div>` + notes;
    const att = D.attachments || [];
    if (att.length) body += `<div class="pp-note"><b>ATTACHMENTS:</b><br>${att.map((a) => esc(a.name)).join('<br>')}</div>`;
    foot = `<div class="pp-foot"><div></div>${signBlock()}</div>`;
  } else if (t === 'dn') {
    body += notes;
    foot = `<div class="pp-foot" style="margin-top:34px"><div class="pp-recv"><b>Received By:</b><br>Name: __________________________<br>Date: ___________________________<br><br>Signature: ______________________</div>${signBlock()}</div>`;
  }
  return `<div class="paper" style="${paperStyle()}">${paperHead(doc)}${top}${body}${foot}</div>`;
}
function paperStyle() {
  const d = S.settings.design || {};
  return `--th:${esc(d.head_color || '#f2f3f5')};--ink:${esc(d.accent || '#1f2328')};font-size:${num(d.font_size) || 11.5}px`;
}
function termsBlock(doc) {
  const L = termsOf(doc).filter((t) => (t.title || '').trim() || (t.content || '').trim());
  if (!L.length) return '';
  const line = (t) => {
    const lines = String(t.content || '').split('\n').map((x) => x.trim()).filter(Boolean);
    if (!t.title) return lines.map((l) => `<div>• ${esc(l.replace(/^[•\-*]\s*/, ''))}</div>`).join('');
    if (lines.length <= 1) return `<div>• <b class="tt">${esc(t.title)}:</b> ${esc(lines[0] || '')}</div>`;
    return `<div style="margin-bottom:2px">• <b class="tt">${esc(t.title)}</b><div class="pp-pre" style="padding-left:10px">${esc(lines.join('\n'))}</div></div>`;
  };
  return `<div class="pp-block pp-terms"><b>TERMS &amp; CONDITIONS:</b>${L.map(line).join('')}</div>`;
}

function receiptPaper(doc) {
  const D = doc.data || {}, isPay = doc.doc_type === 'payment';
  const top = `<div class="pp-top c2">${partyBlock(doc.party, isPay ? 'PAID TO,' : 'TO,', {})}<div>${metaBlock(doc)}</div></div>`;
  const rows = [['Payment For', D.payment_for || '—'], ['Payment Method', D.method || ''], ['Reference #', D.reference || '']];
  if (D.notes) rows.push(['Notes', D.notes]);
  return `<div class="paper short" style="${paperStyle()}">${paperHead(doc)}${top}
    <table class="pp-pay"><tr><th colspan="2">Payment Details</th></tr>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${nl(r[1])}</td></tr>`).join('')}</table>
    <div class="pp-foot" style="grid-template-columns:1fr 220px;margin-top:30px">
      <div><div class="pp-paid"><span>Paid Amount</span><span>${inr(doc.grand_total)}</span></div><div class="pp-paidw"><b>Amount In Words</b><span>${esc(inWords(doc.grand_total))}</span></div></div>
      ${signBlock()}
    </div></div>`;
}

/* ------------------------------------------------------------------ */
/*  Parties (customers & vendors)                                      */
/* ------------------------------------------------------------------ */
function viewParties(f) {
  const title = f === 'customer' ? 'Customers' : f === 'vendor' ? 'Vendors' : 'Customers & Vendors';
  setPage(title, `<button class="btn primary" id="pAdd">${icon('plus')} Add ${f === 'vendor' ? 'vendor' : 'customer'}</button>`);
  main().innerHTML = `
    <div class="chips">
      <a class="chip ${f === 'all' ? 'active' : ''}" href="#/parties">All</a>
      <a class="chip ${f === 'customer' ? 'active' : ''}" href="#/parties?f=customer">Show customers</a>
      <a class="chip ${f === 'vendor' ? 'active' : ''}" href="#/parties?f=vendor">Show vendors</a>
    </div>
    <div class="row" style="margin-bottom:12px"><input class="search" id="pq" placeholder="Search name, contact, phone, GSTIN…"></div>
    <div id="plist"></div>`;
  const draw = () => {
    const s = $('#pq').value.trim().toLowerCase();
    const list = S.parties.filter((p) => (f === 'all' || (f === 'customer' ? p.is_customer : p.is_vendor)) && (!s || [p.name, p.contact_person, p.phone, p.gstin].join(' ').toLowerCase().includes(s))).sort(byName);
    $('#plist').innerHTML = list.length ? `<div class="list">${list.map((p) => `
      <div class="li-row" data-id="${p.id}">
        <div class="li-main" data-open><b>${esc(p.name)} ${tagsOf(p)}</b><div class="sub">${esc([p.contact_person, p.phone, p.gstin].filter(Boolean).join(' · ') || '—')}</div></div>
        <div class="li-right hide-m">${balText(balanceOf(p.id))}</div>
        <div class="row" style="gap:4px;flex-wrap:nowrap">
          ${!p.is_vendor ? `<button class="btn sm" data-tag="is_vendor" title="Also add as vendor">+ Vendor</button>` : ''}
          ${!p.is_customer ? `<button class="btn sm" data-tag="is_customer" title="Also add as customer">+ Customer</button>` : ''}
          <button class="icon-btn" data-edit title="Edit">${icon('edit')}</button>
        </div>
      </div>`).join('')}</div>` : '<div class="list"><div class="empty">No parties found.</div></div>';
    $$('#plist .li-row').forEach((row) => {
      const p = getParty(row.dataset.id);
      $('[data-open]', row).onclick = () => { location.hash = '/ledger/' + p.id; };
      $('[data-edit]', row).onclick = () => partyModal(p, draw);
      $$('[data-tag]', row).forEach((b) => b.onclick = async () => {
        try { await saveRow('parties', { ...p, [b.dataset.tag]: true, updated_at: nowIso() }); toast(`${p.name} is now also a ${b.dataset.tag === 'is_vendor' ? 'vendor' : 'customer'}`, 'ok'); draw(); } catch (e) { toast(errMsg(e), 'err'); }
      });
    });
  };
  $('#pq').oninput = debounce(draw, 120); draw();
  $('#pAdd').onclick = () => partyModal(null, draw, f === 'vendor' ? 'vendor' : 'customer');
}

function partyModal(p, onSaved, kind) {
  const isNew = !p;
  p = p ? clone(p) : party({ is_customer: kind !== 'vendor', is_vendor: kind === 'vendor', state_code: '24' });
  openModal(isNew ? `Add ${kind === 'vendor' ? 'vendor' : 'customer'}` : 'Edit ' + p.name, `
    <div class="fgrid" id="pForm">
      <label class="f full">Company / party name *<input data-k="name" value="${esc(p.name)}" autofocus></label>
      <label class="f">Contact person<input data-k="contact_person" value="${esc(p.contact_person)}"></label>
      <label class="f">Phone<input data-k="phone" inputmode="tel" value="${esc(p.phone)}"></label>
      <label class="f">Email<input data-k="email" type="email" value="${esc(p.email)}"></label>
      <label class="f">GSTIN<input data-k="gstin" value="${esc(p.gstin)}" maxlength="15" style="text-transform:uppercase"></label>
      <label class="f full">Billing address<textarea data-k="address" rows="3">${esc(p.address)}</textarea></label>
      <label class="f full">Shipping address (if different)<textarea data-k="shipping_address" rows="2">${esc(p.shipping_address || '')}</textarea></label>
      <label class="f">State<select data-k="state_code"><option value="">—</option>${STATES.map((s) => `<option value="${s[0]}">${s[0]} – ${esc(s[1])}</option>`).join('')}</select></label>
      <div class="f"><span>Type</span><div class="row"><label class="check"><input type="checkbox" data-k="is_customer" ${p.is_customer ? 'checked' : ''}> Customer</label><label class="check"><input type="checkbox" data-k="is_vendor" ${p.is_vendor ? 'checked' : ''}> Vendor</label></div></div>
      <label class="f">Opening balance ₹<input data-k="opening_balance" type="number" step="any" value="${p.opening_balance || ''}"></label>
      <label class="f">Balance type<select data-k="opening_type"><option value="dr">Dr – they owe us</option><option value="cr">Cr – we owe them</option></select></label>
      <label class="f full">Notes<textarea data-k="notes" rows="2">${esc(p.notes)}</textarea></label>
      ${!isNew && docsOf(p.id).length ? `<label class="check full"><input type="checkbox" id="pUpdDocs"> Also update these details on all ${docsOf(p.id).length} existing document(s) of this party</label>` : ''}
    </div>`,
    `${!isNew ? `<button class="btn danger" id="pDel" style="margin-right:auto">${icon('trash')} Delete</button>` : ''}<button class="btn" data-close>Cancel</button><button class="btn primary" id="pSave">Save</button>`);
  const m = $('#modal'); $$('[data-close]', m).forEach((b) => b.onclick = () => m.close());
  $('[data-k="state_code"]', m).value = p.state_code || '';
  $('[data-k="opening_type"]', m).value = p.opening_type || 'dr';
  bindInputs($('#pForm'), p, (k, el) => {
    if (k === 'gstin') { p.gstin = el.value.toUpperCase().trim(); const sc = gstState(p.gstin); if (sc && STATES.some((s) => s[0] === sc)) { p.state_code = sc; $('[data-k="state_code"]', m).value = sc; } }
  });
  $('#pSave').onclick = async () => {
    p.name = p.name.trim();
    if (!p.name) return toast('Name is required', 'err');
    if (!p.is_customer && !p.is_vendor) return toast('Tick Customer, Vendor or both', 'err');
    if (p.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(p.gstin) && !confirm('GSTIN format looks wrong. Save anyway?')) return;
    const dup = S.parties.find((x) => x.id !== p.id && x.name.trim().toLowerCase() === p.name.toLowerCase());
    if (dup && !confirm(`"${dup.name}" already exists. Save another with the same name?`)) return;
    try {
      const upd = $('#pUpdDocs') && $('#pUpdDocs').checked;
      const saved = await saveRow('parties', party({ ...p, opening_balance: num(p.opening_balance) }));
      if (upd) {
        const docs = docsOf(saved.id).map((d) => ({ ...d, party: snapParty(saved), updated_at: nowIso() }));
        await DB.bulk('documents', docs);
        docs.forEach((d) => { const i = S.documents.findIndex((x) => x.id === d.id); if (i >= 0) S.documents[i] = d; });
        toast(`Updated ${docs.length} document(s)`, 'ok');
      }
      m.close(); toast('Saved', 'ok'); onSaved && onSaved(saved);
    }
    catch (e) { toast('Could not save: ' + errMsg(e), 'err'); }
  };
  const del = $('#pDel'); if (del) del.onclick = async () => {
    if (docsOf(p.id).length) return toast(`Cannot delete – ${docsOf(p.id).length} document(s) use this party`, 'err');
    if (!confirm(`Delete ${p.name}?`)) return;
    try { await removeRow('parties', p.id); m.close(); toast('Deleted', 'ok'); route(); } catch (e) { toast(errMsg(e), 'err'); }
  };
}

/* ------------------------------------------------------------------ */
/*  Ledger                                                             */
/* ------------------------------------------------------------------ */
function viewLedgerIndex() {
  setPage('Ledger', `<button class="btn sm" id="lPrintAll">${icon('print')}<span class="hide-m">Print summary</span></button>`);
  main().innerHTML = `
    <div class="chips" id="lf">
      <button class="chip active" data-f="all">All</button><button class="chip" data-f="customer">Customers</button><button class="chip" data-f="vendor">Vendors</button><button class="chip" data-f="both">Both</button><button class="chip" data-f="due">With balance</button>
    </div>
    <div class="row" style="margin-bottom:12px"><input class="search" id="lq" placeholder="Search…"><span class="spacer"></span><span class="small muted" id="lsum"></span></div>
    <div id="llist"></div>`;
  let f = 'all';
  const draw = () => {
    const s = $('#lq').value.trim().toLowerCase();
    const list = S.parties.filter((p) => !s || p.name.toLowerCase().includes(s))
      .filter((p) => f === 'all' || (f === 'customer' && p.is_customer) || (f === 'vendor' && p.is_vendor) || (f === 'both' && p.is_customer && p.is_vendor) || (f === 'due' && Math.abs(balanceOf(p.id)) > 0.004))
      .sort(byName);
    let recv = 0, pay = 0; list.forEach((p) => { const b = balanceOf(p.id); if (b > 0) recv += b; else pay -= b; });
    $('#lsum').innerHTML = `Receivable <b class="dr">${inr0(recv)}</b> · Payable <b class="cr">${inr0(pay)}</b>`;
    let last = '', h = '';
    list.forEach((p) => {
      const L = /[a-z]/i.test(p.name[0]) ? p.name[0].toUpperCase() : '#';
      if (L !== last) { h += `<div class="letter">${L}</div>`; last = L; }
      h += `<a class="li-row" href="#/ledger/${p.id}"><div class="li-main"><b>${esc(p.name)} ${tagsOf(p)}</b><div class="sub">${esc([p.contact_person, p.phone].filter(Boolean).join(' · ') || '—')}</div></div><div class="li-right">${balText(balanceOf(p.id))}</div></a>`;
    });
    $('#llist').innerHTML = h ? `<div class="list">${h}</div>` : '<div class="list"><div class="empty">No parties</div></div>';
  };
  $$('#lf .chip').forEach((b) => b.onclick = () => { f = b.dataset.f; $$('#lf .chip').forEach((x) => x.classList.toggle('active', x === b)); draw(); });
  $('#lq').oninput = debounce(draw, 120); draw();
  $('#lPrintAll').onclick = () => {
    const list = S.parties.slice().sort(byName).filter((p) => Math.abs(balanceOf(p.id)) > 0.004);
    const rows = list.map((p, i) => { const b = balanceOf(p.id); return `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td>${[p.is_customer && 'Customer', p.is_vendor && 'Vendor'].filter(Boolean).join(' / ')}</td><td class="c-num">${b > 0 ? inr(b) : ''}</td><td class="c-num">${b < 0 ? inr(-b) : ''}</td></tr>`; }).join('');
    const doc = { doc_type: 'invoice' };
    printHTML(`<div class="paper long">${paperHead(doc).replace(/TAX<br>INVOICE/, 'LEDGER<br>SUMMARY')}<div style="margin:12px 0">As on ${fmtDate(today())}</div><table class="pp-items pp-ledger"><thead><tr><th>#</th><th>PARTY</th><th>TYPE</th><th class="c-num">RECEIVABLE (Dr)</th><th class="c-num">PAYABLE (Cr)</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No balances</td></tr>'}</tbody></table></div>`, 'Ledger summary ' + today());
  };
}

function viewLedger(pid) {
  const p = getParty(pid); if (!p) return notFound();
  setPage(p.name, `<button class="btn sm" id="lEdit">${icon('edit')}<span class="hide-m">Edit</span></button><button class="btn sm" id="lPrint">${icon('print')}<span class="hide-m">Print statement</span></button><button class="btn sm" id="lCsv">${icon('download')}<span class="hide-m">CSV</span></button>`, '/ledger');
  const all = ledgerEntries(pid);
  const docs = docsOf(pid).sort((a, b) => (b.doc_date + b.created_at).localeCompare(a.doc_date + a.created_at));
  const sum = (t) => docs.filter((d) => d.doc_type === t).reduce((a, d) => a + num(d.grand_total), 0);
  main().innerHTML = `
    <div class="card">
      <div class="row"><div><h2 style="margin:0 0 4px">${esc(p.name)} ${tagsOf(p)}</h2>
      <div class="muted small" style="white-space:pre-line">${esc([p.contact_person, p.phone, p.address, p.gstin && 'GSTIN: ' + p.gstin].filter(Boolean).join('\n'))}</div></div>
      <span class="spacer"></span>
      <div style="text-align:right"><div class="muted small">Closing balance</div><div style="font-size:22px;font-weight:700">${balText(balanceOf(pid))}</div><div class="muted small">${balanceOf(pid) > 0.004 ? 'They owe us' : balanceOf(pid) < -0.004 ? 'We owe them' : 'Settled'}</div></div></div>
      <div class="row" style="margin-top:12px">
        ${p.is_customer ? `<a class="btn sm" href="#/doc/new?type=quote&party=${p.id}">+ Quotation</a><a class="btn sm" href="#/doc/new?type=invoice&party=${p.id}">+ Invoice</a><a class="btn sm" href="#/doc/new?type=receipt&party=${p.id}">+ Receipt</a>` : `<button class="btn sm" id="lMkC">+ Add as customer</button>`}
        ${p.is_vendor ? `<a class="btn sm" href="#/doc/new?type=po&party=${p.id}">+ Purchase order</a><a class="btn sm" href="#/doc/new?type=payment&party=${p.id}">+ Payment made</a>` : `<button class="btn sm" id="lMkV">+ Add as vendor</button>`}
      </div>
    </div>
    <div class="stats" style="margin-top:14px">
      ${p.is_customer ? `<div class="stat"><div class="k">Total invoiced</div><div class="v amt">${inr0(sum('invoice'))}</div></div><div class="stat"><div class="k">Total received</div><div class="v amt cr">${inr0(sum('receipt'))}</div></div>` : ''}
      ${p.is_vendor ? `<div class="stat"><div class="k">Total purchases</div><div class="v amt">${inr0(sum('purchase'))}</div></div><div class="stat"><div class="k">Total paid</div><div class="v amt">${inr0(sum('payment'))}</div></div>` : ''}
    </div>
    <div class="card">
      <div class="row" style="margin-bottom:10px"><h2 style="margin:0">Ledger account</h2><span class="spacer"></span>
        <label class="f" style="flex-direction:row;align-items:center;gap:6px">From <input type="date" id="lFrom" style="width:auto"></label>
        <label class="f" style="flex-direction:row;align-items:center;gap:6px">To <input type="date" id="lTo" style="width:auto"></label></div>
      <div class="tbl-wrap" id="lTable"></div>
    </div>
    <div class="card"><h2>All documents (${docs.length})</h2>${docList(docs) || '<div class="empty">No documents yet</div>'}</div>`;

  const filtered = () => ledgerRows(pid, $('#lFrom').value, $('#lTo').value);
  const tableHTML = ledgerTable;
  const draw = () => { $('#lTable').innerHTML = tableHTML(filtered(), false); };
  $('#lFrom').onchange = draw; $('#lTo').onchange = draw; draw();
  $('#lEdit').onclick = () => partyModal(p, () => viewLedger(pid));
  const mk = (flag) => async () => { try { await saveRow('parties', { ...p, [flag]: true, updated_at: nowIso() }); toast('Updated', 'ok'); viewLedger(pid); } catch (e) { toast(errMsg(e), 'err'); } };
  const mc = $('#lMkC'); if (mc) mc.onclick = mk('is_customer');
  const mv = $('#lMkV'); if (mv) mv.onclick = mk('is_vendor');
  $('#lPrint').onclick = () => printHTML(ledgerPaper(p, $('#lFrom').value, $('#lTo').value), `Ledger ${p.name}`);
  $('#lCsv').onclick = () => {
    const rows = filtered();
    const csv = [['Date', 'Particulars', 'Doc No', 'Debit', 'Credit', 'Balance']].concat(rows.map((r) => [fmtDate(r.date), r.part, r.no || '', r.dr || '', r.cr || '', r.bal]))
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`Ledger-${p.name}.csv`, csv, 'text/csv');
  };
}

function ledgerRows(pid, from, to) {
  let open = 0; const rows = [];
  ledgerEntries(pid).forEach((r) => {
    if (from && r.date && r.date < from) { open = r.bal; return; }
    if (to && r.date && r.date > to) return;
    if (!r.date && from) { open = r.bal; return; }
    rows.push(r);
  });
  if (from) rows.unshift({ date: from, part: 'Opening Balance (b/f)', dr: open > 0 ? open : 0, cr: open < 0 ? -open : 0, bal: open });
  return rows;
}
function ledgerTable(rows, printMode) {
  const td = rows.reduce((a, r) => a + r.dr, 0), tc = rows.reduce((a, r) => a + r.cr, 0);
  const bal = rows.length ? rows[rows.length - 1].bal : 0;
  const balStr = (b) => Math.abs(b) < 0.005 ? inr(0) : inr(Math.abs(b)) + (b > 0 ? ' Dr' : ' Cr');
  const cls = printMode ? 'pp-items pp-ledger' : 'tbl';
  const n = printMode ? 'c-num' : 'n';
  return `<table class="${cls}"><thead><tr><th>Date</th><th>Particulars</th><th>Doc No.</th><th class="${n}">Debit (Dr)</th><th class="${n}">Credit (Cr)</th><th class="${n}">Balance</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${fmtDate(r.date)}</td><td>${esc(r.part)}</td><td>${r.id && !printMode ? `<a href="#/doc/${r.id}">${esc(r.no)}</a>` : esc(r.no || '')}</td><td class="${n} amt">${r.dr ? inr(r.dr) : ''}</td><td class="${n} amt">${r.cr ? inr(r.cr) : ''}</td><td class="${n} amt">${balStr(r.bal)}</td></tr>`).join('') || `<tr><td colspan="6" class="muted">No entries</td></tr>`}
    <tr class="total"><td></td><td><b>Total</b></td><td></td><td class="${n} amt"><b>${inr(td)}</b></td><td class="${n} amt"><b>${inr(tc)}</b></td><td class="${n} amt"><b>${balStr(bal)}</b></td></tr>
  </tbody></table>`;
}
function ledgerPaper(p, from, to) {
  const period = from || to ? `Period: ${from ? fmtDate(from) : 'Start'} to ${to ? fmtDate(to) : fmtDate(today())}` : `As on ${fmtDate(today())}`;
  const head = paperHead({ doc_type: 'invoice' }).replace(/TAX<br>INVOICE/, 'LEDGER<br>STATEMENT');
  return `<div class="paper long">${head}<div class="pp-top c2">${partyBlock(snapParty(p), 'ACCOUNT OF', { state: true })}<div style="text-align:right">${period}</div></div>${ledgerTable(ledgerRows(p.id, from, to), true)}<div class="pp-foot"><div></div>${signBlock()}</div></div>`;
}

function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(text instanceof Blob ? text : new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */
function viewProducts() {
  setPage('Products', `<button class="btn primary" id="prAdd">${icon('plus')} Add product</button>`);
  const draw = () => {
    const list = S.products.slice().sort(byName);
    main().innerHTML = `<p class="muted small" style="margin-top:0">Saved products fill in description, HSN, unit, rate and GST automatically when you type the item name in a document.</p>` +
      (list.length ? `<div class="list">${list.map((p) => `<div class="li-row" data-id="${p.id}"><div class="li-main"><b>${esc(p.name)}</b><div class="sub">${esc([p.description && p.description.replace(/\n/g, ' '), p.hsn && 'HSN ' + p.hsn].filter(Boolean).join(' · ') || '—')}</div></div><div class="li-right"><b class="amt">${inr(p.rate)}</b><div class="small muted">per ${esc(p.unit || 'unit')} · GST ${num(p.tax_rate)}%</div></div></div>`).join('')}</div>` : '<div class="list"><div class="empty">No products yet</div></div>');
    $$('#main .li-row').forEach((r) => r.onclick = () => productModal(getProductById(r.dataset.id), draw));
  };
  draw();
  $('#prAdd').onclick = () => productModal(null, draw);
}
const getProductById = (id) => S.products.find((p) => p.id === id);
function productModal(p, onSaved) {
  const isNew = !p; p = p ? clone(p) : product({ unit: 'Sqft' });
  openModal(isNew ? 'Add product' : 'Edit product', `<div class="fgrid" id="prForm">
    <label class="f full">Name *<input data-k="name" value="${esc(p.name)}"></label>
    <label class="f full">Description<textarea data-k="description" rows="3">${esc(p.description)}</textarea></label>
    <label class="f">HSN / SAC<input data-k="hsn" value="${esc(p.hsn)}"></label>
    <label class="f">Unit<input data-k="unit" list="unitList2" value="${esc(p.unit)}"><datalist id="unitList2">${lst('units').map((u) => `<option value="${esc(u)}">`).join('')}</datalist></label>
    <label class="f">Rate ₹<input data-k="rate" type="number" step="any" value="${esc(p.rate)}"></label>
    <label class="f">GST %<input data-k="tax_rate" type="number" step="any" value="${esc(p.tax_rate)}"></label></div>`,
  `${!isNew ? `<button class="btn danger" id="prDel" style="margin-right:auto">${icon('trash')} Delete</button>` : ''}<button class="btn" data-close>Cancel</button><button class="btn primary" id="prSave">Save</button>`);
  const m = $('#modal'); $$('[data-close]', m).forEach((b) => b.onclick = () => m.close());
  bindInputs($('#prForm'), p);
  $('#prSave').onclick = async () => {
    if (!p.name.trim()) return toast('Name is required', 'err');
    try { await saveRow('products', product(p)); m.close(); toast('Saved', 'ok'); onSaved(); } catch (e) { toast(errMsg(e), 'err'); }
  };
  const d = $('#prDel'); if (d) d.onclick = async () => { if (!confirm('Delete ' + p.name + '?')) return; try { await removeRow('products', p.id); m.close(); onSaved(); } catch (e) { toast(errMsg(e), 'err'); } };
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */
function viewSettings() {
  setPage('Settings', '');
  const st = clone(S.settings);
  const c = st.company, ds = st.design, ls = st.lists;
  const fld = (path, label, val, extra = '', attrs = '') => `<label class="f ${extra}">${label}<input data-p="${path}" value="${esc(val)}" ${attrs}></label>`;
  const area = (path, label, val, rows = 3, extra = 'full') => `<label class="f ${extra}">${label}<textarea data-p="${path}" rows="${rows}">${esc(val)}</textarea></label>`;
  const chk = (path, label, val) => `<label class="check"><input type="checkbox" data-p="${path}" ${val !== false ? 'checked' : ''}> ${label}</label>`;
  main().innerHTML = `
    <div class="chips settings-jump">
      <a class="chip" href="javascript:void 0" data-jump="s-company">Company</a><a class="chip" href="javascript:void 0" data-jump="s-design">Document design</a>
      <a class="chip" href="javascript:void 0" data-jump="s-lists">Lists &amp; defaults</a><a class="chip" href="javascript:void 0" data-jump="s-texts">Texts</a>
      <a class="chip" href="javascript:void 0" data-jump="s-num">Numbering</a><a class="chip" href="javascript:void 0" data-jump="s-data">Import / backup</a>
    </div>
    <div class="card" id="s-company"><h2>Company details (printed on every document)</h2><div class="fgrid">
      ${fld('company.name', 'Company name', c.name)}${fld('company.phones', 'Phone numbers (top line)', c.phones)}
      ${fld('company.address1', 'Address line 1', c.address1, 'span2')}${fld('company.address2', 'Address line 2', c.address2, 'span2')}
      ${fld('company.mobile', 'Mobile', c.mobile)}${fld('company.email', 'Email', c.email)}
      ${fld('company.state', 'State name', c.state)}${fld('company.state_code', 'State code', c.state_code)}${fld('company.gstin', 'GSTIN', c.gstin)}
      ${area('payment_instructions', 'Bank / payment instructions (printed on invoices, PIs and quotations)', st.payment_instructions, 4)}
    </div></div>
    <div class="card"><h2>Logo &amp; signature</h2><div class="fgrid">
      <div class="f"><span>Logo</span><img id="sLogoImg" class="s-img" src="${esc(st.logo || 'assets/logo.png')}"><input type="file" accept="image/*" id="sLogo"><button class="btn sm" id="sLogoReset" type="button">Use default</button></div>
      <div class="f"><span>Signature &amp; stamp</span><img id="sSigImg" class="s-img" src="${esc(st.signature || 'assets/signature.png')}"><input type="file" accept="image/*" id="sSig"><button class="btn sm" id="sSigReset" type="button">Use default</button></div>
    </div></div>
    <div class="card" id="s-design"><h2>Document design</h2>
      <div class="design-grid">
        <div>
          <div class="fgrid">
            ${TYPE_ORDER.map((t) => `<label class="f">${TYPES[t].label} – title<textarea data-p="design.titles.${t}" rows="2" placeholder="${esc(TYPES[t].title.join('\n'))}">${esc(ds.titles[t] || '')}</textarea></label>`).join('')}
          </div>
          <p class="muted small">Leave a title empty to use the standard one. Press Enter for a second line.</p>
          <div class="fgrid" style="margin-top:10px">
            <label class="f">HSN column<select data-p="design.hsn"><option value="auto">Show when any item has HSN</option><option value="always">Always show</option><option value="never">Never show</option></select></label>
            <label class="f">Table header colour<input type="color" data-p="design.head_color" value="${esc(ds.head_color)}"></label>
            <label class="f">Text colour<input type="color" data-p="design.accent" value="${esc(ds.accent)}"></label>
            <label class="f">Text size<select data-p="design.font_size"><option value="10.5">Small</option><option value="11.5">Normal</option><option value="12.5">Large</option></select></label>
          </div>
          <div class="row" style="margin-top:12px;gap:16px">
            ${chk('design.show_sign', 'Signature image', ds.show_sign)}${chk('design.show_bank', 'Bank / payment instructions', ds.show_bank)}
            ${chk('design.show_words', 'Amount in words', ds.show_words)}${chk('design.show_state', 'State name in header', ds.show_state)}
            ${chk('design.show_intro', 'Opening text on quotation / PO', ds.show_intro)}
          </div>
        </div>
        <div><div class="row" style="margin-bottom:6px"><span class="muted small">Preview</span><span class="spacer"></span><select id="sPvType" style="width:auto">${TYPE_ORDER.map((t) => `<option value="${t}">${TYPES[t].label}</option>`).join('')}</select></div><div class="paper-wrap" id="sPreview"></div></div>
      </div>
    </div>
    <div class="card" id="s-lists"><h2>Lists &amp; defaults</h2><p class="muted small" style="margin-top:-6px">Separate items with commas. These appear as suggestions while filling documents.</p><div class="fgrid">
      ${area('lists.units', 'Units', ls.units, 2, 'span2')}${area('lists.methods', 'Payment methods', ls.methods, 2, 'span2')}
      ${area('lists.charges', 'Other charge names', ls.charges, 2, 'span2')}${area('lists.gst_rates', 'GST rates (%)', ls.gst_rates, 2, 'span2')}
      ${fld('lists.default_unit', 'Default unit for new items', ls.default_unit)}${fld('lists.default_gst', 'Default GST % for new items', ls.default_gst, '', 'type="number" step="any"')}
    </div></div>
    <div class="card" id="s-texts"><h2>Default texts</h2><p class="muted small" style="margin-top:-6px">Terms &amp; conditions are managed in <a href="#/terms">Terms &amp; Conditions</a>.</p><div class="fgrid">
      ${area('texts.quote_intro', 'Quotation – opening text', st.texts.quote_intro)}
      ${area('texts.quote_closing', 'Quotation – closing line', st.texts.quote_closing, 2)}
      ${area('texts.po_intro', 'Purchase order – opening text', st.texts.po_intro)}
      ${area('texts.po_footer', 'Purchase order – footer note', st.texts.po_footer, 2)}
    </div></div>
    <div class="card" id="s-num"><h2>Document numbering</h2><p class="muted small" style="margin-top:-6px">The next number is the higher of "start from" and the last number used. You can also change the number of any saved document by editing it.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Document</th><th>Prefix</th><th>Start from</th><th>Next number</th></tr></thead><tbody>
      ${TYPE_ORDER.map((t) => `<tr><td>${TYPES[t].label}</td><td><input data-p="numbering.${t}.prefix" value="${esc(st.numbering[t].prefix)}" style="max-width:130px"></td><td><input type="number" data-p="numbering.${t}.start" value="${esc(st.numbering[t].start)}" style="max-width:100px"></td><td class="muted">${esc(nextNo(t))}</td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="savebar"><button class="btn primary" id="sSave">Save settings</button></div>
    <div class="card" id="s-data"><h2>Import data</h2><p class="muted small" style="margin-top:-6px">Upload an Excel (.xlsx / .xls) or CSV file to add customers, vendors, products or terms in bulk.</p>
      <a class="btn gold" href="#/import">${icon('upload')} Import from Excel / CSV</a></div>
    <div class="card"><h2>Backup &amp; restore</h2><p class="muted small" style="margin-top:-6px">Full ZIP export (PDFs, attachments, Excel files) is on the <a href="#/export">Export / Backup</a> page. Restore uses the <code>backup.json</code> file from that ZIP.</p>
      <div class="row"><a class="btn" href="#/export">${icon('zip')} Export / Backup</a><label class="btn">Restore from backup.json<input type="file" id="sImport" accept=".json" hidden></label></div></div>
    <div class="card"><h2>Connection</h2><p style="margin:0">${MODE === 'cloud' ? `Connected to Supabase as <b>${esc(USER?.email || '')}</b>. <button class="btn sm" id="sLogout">${icon('logout')} Sign out</button>` : 'Demo mode – data is saved in this browser only. Add your Supabase URL and key in <code>js/config.js</code> to go live.'}</p></div>`;

  $('[data-p="design.hsn"]').value = ds.hsn || 'auto';
  $('[data-p="design.font_size"]').value = String(ds.font_size || 11.5);
  $$('[data-jump]').forEach((a) => a.onclick = () => $('#' + a.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' }));
  const drawPv = () => {
    const keep = S.settings; S.settings = deepMerge(DEFAULT_SETTINGS, st);
    try { mountPaper($('#sPreview'), sampleDoc($('#sPvType').value)); } finally { S.settings = keep; }
  };
  const pv = debounce(drawPv, 200);
  $$('[data-p]').forEach((el) => {
    const set = () => {
      const path = el.dataset.p.split('.'); let o = st;
      for (let i = 0; i < path.length - 1; i++) { o[path[i]] = o[path[i]] || {}; o = o[path[i]]; }
      o[path[path.length - 1]] = el.type === 'checkbox' ? el.checked : (el.type === 'number' || el.dataset.p === 'design.font_size') ? num(el.value) : el.value;
      pv();
    };
    el.addEventListener('input', set); el.addEventListener('change', set);
  });
  $('#sPvType').onchange = drawPv;
  const img = (inp, key, imgEl) => $(inp).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; st[key] = await resizeImage(f, key === 'logo' ? 500 : 400); $(imgEl).src = st[key]; pv(); };
  img('#sLogo', 'logo', '#sLogoImg'); img('#sSig', 'signature', '#sSigImg');
  $('#sLogoReset').onclick = () => { st.logo = ''; $('#sLogoImg').src = 'assets/logo.png'; pv(); };
  $('#sSigReset').onclick = () => { st.signature = ''; $('#sSigImg').src = 'assets/signature.png'; pv(); };
  $('#sSave').onclick = async () => { try { await DB.saveSettings(st); S.settings = deepMerge(DEFAULT_SETTINGS, st); toast('Settings saved', 'ok'); viewSettings(); } catch (e) { toast('Could not save: ' + errMsg(e), 'err'); } };
  $('#sImport').onchange = (e) => restoreBackup(e.target.files[0]);
  const lo = $('#sLogout'); if (lo) lo.onclick = logout;
  drawPv();
}

function sampleDoc(type) {
  const last = S.documents.filter((d) => d.doc_type === type).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  if (last) return last;
  const d = blankDoc(type);
  const p = S.parties.find((x) => TYPES[type].side === 'sale' ? x.is_customer : x.is_vendor) || S.parties[0];
  if (p) { d.party_id = p.id; d.party = snapParty(p); }
  const pr = S.products[0];
  if (TYPES[type].items) d.items = [{ name: pr?.name || 'Sample item', description: pr?.description || '', hsn: pr?.hsn || '', qty: 100, unit: pr?.unit || 'Nos', rate: pr?.rate || 100, tax_rate: pr?.tax_rate ?? 18 }];
  else { d.grand_total = 10000; d.data.payment_for = 'INV-1'; }
  return d;
}

async function restoreBackup(f) {
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d.parties || !d.documents) throw new Error('Not a valid backup file');
    if (!confirm(`Restore ${d.parties.length} parties, ${d.products?.length || 0} products, ${d.terms?.length || 0} terms and ${d.documents.length} documents? Records with the same ID will be overwritten.`)) return;
    await DB.bulk('parties', d.parties); await DB.bulk('products', d.products || []);
    if (d.terms) await DB.bulk('terms', d.terms);
    const docs = d.documents.slice().sort((a, b) => (a.ref_id ? 1 : 0) - (b.ref_id ? 1 : 0));
    await DB.bulk('documents', docs);
    if (d.settings) await DB.saveSettings(d.settings);
    await loadData(); toast('Backup restored', 'ok'); route();
  } catch (err) { toast('Restore failed: ' + errMsg(err), 'err'); }
}

/* ------------------------------------------------------------------ */
/*  Terms & Conditions library                                         */
/* ------------------------------------------------------------------ */
function viewTerms(scope) {
  if (!SCOPE_TYPES[scope]) scope = 'sales';
  setPage('Terms & Conditions', `<button class="btn primary" id="tAdd">${icon('plus')} Add new terms</button>`, '/');
  const list = S.terms.filter((t) => t.scope === scope).sort(bySort);
  main().innerHTML = `
    <div class="chips">
      <a class="chip ${scope === 'sales' ? 'active' : ''}" href="#/terms?s=sales">Quotation · PI · Invoice</a>
      <a class="chip ${scope === 'purchase' ? 'active' : ''}" href="#/terms?s=purchase">Purchase Order</a>
    </div>
    <p class="muted small" style="margin-top:0">${scope === 'sales' ? 'These terms appear in the dropdown on Quotations, Proforma Invoices and Tax Invoices.' : 'These terms appear in the dropdown on Purchase Orders.'} Add as many as you like. Tick “auto-add” to put a term on every new document automatically.</p>
    ${list.length ? `<div class="list">${list.map((t, i) => `
      <div class="li-row term-row" data-id="${t.id}">
        <div class="ord"><button class="icon-btn" data-mv="-1" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button><button class="icon-btn" data-mv="1" ${i === list.length - 1 ? 'disabled' : ''} title="Move down">↓</button></div>
        <div class="li-main" data-edit><b>${esc(t.title || '(no title)')}</b><div class="sub" style="white-space:pre-line">${esc(t.content)}</div>
          ${(t.auto || []).length ? `<div style="margin-top:4px">${t.auto.map((x) => `<span class="tag ok">Auto-add: ${esc(TYPES[x]?.label || x)}</span>`).join(' ')}</div>` : ''}</div>
        <button class="icon-btn" data-edit title="Edit">${icon('edit')}</button>
        <button class="icon-btn" data-del title="Delete" style="color:var(--bad)">${icon('trash')}</button>
      </div>`).join('')}</div>` : '<div class="list"><div class="empty">No terms yet. Click “Add new terms”.</div></div>'}`;
  $('#tAdd').onclick = () => termModal(null, scope, () => viewTerms(scope));
  $$('.term-row').forEach((row) => {
    const t = S.terms.find((x) => x.id === row.dataset.id);
    $$('[data-edit]', row).forEach((b) => b.onclick = () => termModal(t, scope, () => viewTerms(scope)));
    $('[data-del]', row).onclick = async () => { if (!confirm(`Delete “${t.title || 'this term'}”? Documents already made keep their copy.`)) return; try { await removeRow('terms', t.id); viewTerms(scope); } catch (e) { toast(errMsg(e), 'err'); } };
    $$('[data-mv]', row).forEach((b) => b.onclick = async () => {
      const i = list.indexOf(t), j = i + +b.dataset.mv; if (j < 0 || j >= list.length) return;
      const arr = list.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
      try { const rows = arr.map((x, k) => ({ ...x, sort: k + 1 })); await DB.bulk('terms', rows); rows.forEach((r) => { const ix = S.terms.findIndex((x) => x.id === r.id); S.terms[ix] = r; }); viewTerms(scope); } catch (e) { toast(errMsg(e), 'err'); }
    });
  });
}

function termModal(t, scope, onSaved, fromDoc = false) {
  const isNew = !t;
  const x = t ? clone(t) : term({ scope, auto: [] });
  openModal(isNew ? 'Add new terms' : 'Edit terms', `
    <div class="fgrid" id="tForm">
      <label class="f full">Terms title<input id="tTitle" value="${esc(x.title)}" placeholder="e.g. Payment, Delivery, Validity, Warranty"></label>
      <label class="f full">Content<textarea id="tContent" rows="5" placeholder="e.g. 30% advance, balance before dispatch.">${esc(x.content)}</textarea></label>
      <div class="f full"><span>Auto-add to every new</span><div class="row">${SCOPE_TYPES[scope].map((ty) => `<label class="check"><input type="checkbox" data-auto="${ty}" ${(x.auto || []).includes(ty) ? 'checked' : ''}> ${TYPES[ty].label}</label>`).join('')}</div></div>
      ${fromDoc ? `<label class="check full"><input type="checkbox" id="tKeep" checked> Save to my terms list for future documents</label>` : ''}
    </div>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="tSave">${fromDoc ? 'Add to document' : 'Save'}</button>`);
  const m = $('#modal'); $$('[data-close]', m).forEach((b) => b.onclick = () => m.close());
  setTimeout(() => $('#tTitle').focus(), 50);
  $('#tSave').onclick = async () => {
    x.title = $('#tTitle').value.trim(); x.content = $('#tContent').value.trim();
    x.auto = $$('[data-auto]', m).filter((c) => c.checked).map((c) => c.dataset.auto);
    if (!x.title && !x.content) return toast('Enter a title or content', 'err');
    const keep = fromDoc ? $('#tKeep').checked : true;
    try {
      if (keep) {
        if (isNew) x.sort = S.terms.filter((y) => y.scope === scope).reduce((a, y) => Math.max(a, num(y.sort)), 0) + 1;
        await saveRow('terms', term(x));
      }
      m.close(); toast(keep ? 'Terms saved' : 'Added', 'ok'); onSaved && onSaved(x, keep);
    } catch (e) { toast('Could not save: ' + errMsg(e), 'err'); }
  };
}

/* ------------------------------------------------------------------ */
/*  Excel helpers (SheetJS)                                            */
/* ------------------------------------------------------------------ */
const HEAD = {
  parties: ['Name', 'Type', 'Contact Person', 'Phone', 'Email', 'Address', 'Shipping Address', 'GSTIN', 'State Code', 'State', 'Opening Balance', 'Balance Type', 'Notes'],
  products: ['Name', 'Description', 'HSN', 'Unit', 'Rate', 'GST %'],
  terms: ['Title', 'Content', 'Applies To', 'Auto-add To'],
};
const partyXRow = (p) => ({ Name: p.name, Type: p.is_customer && p.is_vendor ? 'Both' : p.is_vendor ? 'Vendor' : 'Customer', 'Contact Person': p.contact_person, Phone: p.phone, Email: p.email, Address: p.address, 'Shipping Address': p.shipping_address || '', GSTIN: p.gstin, 'State Code': p.state_code, State: stateName(p.state_code), 'Opening Balance': num(p.opening_balance), 'Balance Type': p.opening_type === 'cr' ? 'Cr' : 'Dr', Notes: p.notes, 'Closing Balance': balanceOf(p.id) });
const productXRow = (p) => ({ Name: p.name, Description: p.description, HSN: p.hsn, Unit: p.unit, Rate: num(p.rate), 'GST %': num(p.tax_rate) });
const termXRow = (t) => ({ Title: t.title, Content: t.content, 'Applies To': t.scope === 'purchase' ? 'Purchase Order' : 'Quotation / PI / Invoice', 'Auto-add To': (t.auto || []).map((x) => TYPES[x]?.label || x).join(', ') });

function xSheet(rows, head) {
  const h = head || Object.keys(rows[0] || {});
  const ws = window.XLSX.utils.json_to_sheet(rows, { header: h });
  ws['!cols'] = h.map((k) => ({ wch: Math.min(48, rows.reduce((a, r) => Math.max(a, String(r[k] ?? '').split('\n')[0].length + 1), k.length + 2)) }));
  return ws;
}
function xBook(sheets) {
  const wb = window.XLSX.utils.book_new(); const used = new Set();
  sheets.forEach(([name, ws]) => {
    let n = String(name).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 28) || 'Sheet'; let base = n, i = 2;
    while (used.has(n.toLowerCase())) n = base.slice(0, 25) + ' ' + i++;
    used.add(n.toLowerCase()); window.XLSX.utils.book_append_sheet(wb, ws, n);
  });
  return window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
const xlsxBlob = (bytes) => new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

function docRegisterRows(docs) {
  return docs.map((d) => {
    const k = TYPES[d.doc_type].items && d.doc_type !== 'dn' ? calc(d) : null;
    const D = d.data || {}; const src = d.ref_id && getDoc(d.ref_id);
    return {
      Type: TYPES[d.doc_type].label, Number: d.doc_no, Date: fmtDate(d.doc_date), Party: d.party?.name || '', GSTIN: d.party?.gstin || '',
      Taxable: k ? k.subtotal : '', CGST: k ? k.cgst : '', SGST: k ? k.sgst : '', IGST: k ? k.igst : '', 'Other charges': k ? r2((k.extras || []).reduce((a, e) => a + e.amount, 0)) : '',
      Total: d.doc_type === 'dn' ? '' : num(d.grand_total),
      Paid: d.doc_type === 'invoice' || d.doc_type === 'purchase' ? paidAgainst(d) : '', 'Balance due': d.doc_type === 'invoice' || d.doc_type === 'purchase' ? dueOf(d) : '',
      'Created from': src ? src.doc_no : '', 'Vendor bill no': D.bill_no || '', 'Customer PO no': D.po_no || '', 'Payment for': D.payment_for || '', Method: D.method || '', Reference: D.reference || '',
      Items: (d.items || []).map((i) => `${i.name} × ${i.qty} ${i.unit || ''} @ ${i.rate || ''}`).join('; '), Status: d.status || '',
    };
  });
}
function ledgerBook() {
  const parties = S.parties.slice().sort(byName);
  const sheets = [['Summary', xSheet(parties.map((p) => { const b = balanceOf(p.id); return { Party: p.name, Type: partyXRow(p).Type, Phone: p.phone, GSTIN: p.gstin, 'Receivable (Dr)': b > 0 ? b : 0, 'Payable (Cr)': b < 0 ? -b : 0 }; }))]];
  parties.forEach((p) => {
    const rows = ledgerRows(p.id, '', '');
    if (!rows.length) return;
    sheets.push([p.name, xSheet(rows.map((r) => ({ Date: fmtDate(r.date), Particulars: r.part, 'Doc No': r.no || '', Debit: r.dr || '', Credit: r.cr || '', Balance: Math.abs(r.bal), 'Dr/Cr': r.bal > 0.004 ? 'Dr' : r.bal < -0.004 ? 'Cr' : '' })))]);
  });
  return xBook(sheets);
}

/* ------------------------------------------------------------------ */
/*  Import from Excel / CSV                                            */
/* ------------------------------------------------------------------ */
const nkey = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIAS = {
  parties: {
    name: ['name', 'companyname', 'partyname', 'customername', 'vendorname', 'company', 'firmname', 'suppliername', 'businessname', 'party', 'customer', 'vendor', 'supplier'],
    type: ['type', 'partytype', 'category', 'customervendor'],
    contact_person: ['contactperson', 'contact', 'contactname', 'person', 'ownername', 'attention', 'kindattn'],
    phone: ['phone', 'mobile', 'mobileno', 'phoneno', 'contactnumber', 'contactno', 'whatsapp', 'mobilenumber', 'phonenumber', 'tel', 'telephone'],
    email: ['email', 'emailid', 'mail', 'emailaddress'],
    address: ['address', 'billingaddress', 'addressline1', 'address1', 'billto'],
    address2: ['addressline2', 'address2', 'city', 'pincode', 'pin'],
    shipping_address: ['shippingaddress', 'shipto', 'deliveryaddress', 'siteaddress'],
    gstin: ['gstin', 'gst', 'gstno', 'gstnumber', 'gstinnumber', 'gstinuin', 'gstinno'],
    state_code: ['statecode'],
    state: ['state', 'statename'],
    opening_balance: ['openingbalance', 'opening', 'openingbal'],
    opening_type: ['balancetype', 'drcr', 'openingtype', 'type2'],
    notes: ['notes', 'remarks', 'otherinfo', 'note', 'comment'],
  },
  products: {
    name: ['name', 'productname', 'item', 'itemname', 'product', 'particulars'],
    description: ['description', 'productdescription', 'details', 'specification', 'specs'],
    hsn: ['hsn', 'hsncode', 'hsnsac', 'sac', 'hsnsaccode'],
    unit: ['unit', 'uom', 'unitofmeasure', 'units', 'unitofmeasuresetkgetc'],
    rate: ['rate', 'price', 'sellingprice', 'unitprice', 'mrp', 'salesprice', 'saleprice', 'amount'],
    tax_rate: ['gst', 'gstrate', 'tax', 'taxrate', 'taxin', 'gstpercent', 'taxpercent', 'igst', 'taxinpercent', 'gstin%'],
  },
  terms: {
    title: ['title', 'termstitle', 'termtitle', 'heading', 'name'],
    content: ['content', 'terms', 'text', 'description', 'details', 'condition', 'conditions', 'termsandconditions'],
    scope: ['appliesto', 'scope', 'for', 'type', 'document'],
    auto: ['autoaddto', 'autoadd', 'default'],
  },
};
const cleanNum = (v) => num(String(v ?? '').replace(/[^0-9.\-]/g, ''));
function mapRow(raw, kind) {
  const out = {}; const keys = Object.keys(raw);
  for (const [field, al] of Object.entries(ALIAS[kind])) {
    const k = keys.find((x) => al.includes(nkey(x)));
    if (k !== undefined && String(raw[k]).trim() !== '') out[field] = String(raw[k]).trim();
  }
  return out;
}
function stateFrom(m) {
  if (m.state_code && /^\d{1,2}$/.test(m.state_code)) return m.state_code.padStart(2, '0');
  const g = gstState((m.gstin || '').toUpperCase()); if (g) return g;
  if (m.state) { const s = STATES.find((x) => nkey(x[1]) === nkey(m.state) || x[0] === m.state.padStart(2, '0')); if (s) return s[0]; }
  return '';
}
function planImport(kind, rows, opt) {
  const res = { add: [], upd: [], skip: 0, preview: [] };
  const findIn = (arr, pred) => arr.find(pred);
  rows.forEach((raw) => {
    const m = mapRow(raw, kind);
    if (kind === 'parties') {
      if (!m.name) { res.skip++; return; }
      const ty = nkey(m.type);
      let isC = opt.ptype !== 'vendor', isV = opt.ptype !== 'customer';
      if (ty) { isC = /both|customer|client|buyer/.test(ty); isV = /both|vendor|supplier|seller/.test(ty); if (!isC && !isV) { isC = opt.ptype !== 'vendor'; isV = opt.ptype !== 'customer'; } }
      const gstin = (m.gstin || '').toUpperCase().replace(/\s/g, '');
      const f = { name: m.name, contact_person: m.contact_person, phone: m.phone, email: m.email, address: [m.address, m.address2].filter(Boolean).join('\n'), shipping_address: m.shipping_address, gstin, state_code: stateFrom({ ...m, gstin }), opening_balance: m.opening_balance !== undefined ? cleanNum(m.opening_balance) : undefined, opening_type: m.opening_type ? (/cr/i.test(m.opening_type) ? 'cr' : 'dr') : undefined, notes: m.notes };
      Object.keys(f).forEach((k) => (f[k] === undefined || f[k] === '') && delete f[k]);
      const match = (p) => (gstin && p.gstin === gstin) || nkey(p.name) === nkey(m.name);
      const pend = findIn(res.add, match) || findIn(res.upd, match);
      if (pend) { Object.assign(pend, f, { is_customer: pend.is_customer || isC, is_vendor: pend.is_vendor || isV }); return; }
      const ex = findIn(S.parties, match);
      if (ex) { const u = party({ ...ex, ...f, is_customer: ex.is_customer || isC, is_vendor: ex.is_vendor || isV, id: ex.id, created_at: ex.created_at }); res.upd.push(u); res.preview.push(['Update', u]); }
      else { const n = party({ ...f, is_customer: isC, is_vendor: isV }); res.add.push(n); res.preview.push(['New', n]); }
    } else if (kind === 'products') {
      if (!m.name) { res.skip++; return; }
      const f = { name: m.name, description: m.description, hsn: m.hsn, unit: m.unit, rate: m.rate !== undefined ? cleanNum(m.rate) : undefined, tax_rate: m.tax_rate !== undefined ? cleanNum(m.tax_rate) : undefined };
      Object.keys(f).forEach((k) => (f[k] === undefined || f[k] === '') && delete f[k]);
      const match = (p) => nkey(p.name) === nkey(m.name);
      const pend = findIn(res.add, match) || findIn(res.upd, match); if (pend) { Object.assign(pend, f); return; }
      const ex = findIn(S.products, match);
      if (ex) { const u = product({ ...ex, ...f, id: ex.id, created_at: ex.created_at }); res.upd.push(u); res.preview.push(['Update', u]); }
      else { const n = product(f); res.add.push(n); res.preview.push(['New', n]); }
    } else {
      if (!m.title && !m.content) { res.skip++; return; }
      const scope = m.scope ? (/purch|po|vendor|supplier/i.test(m.scope) ? 'purchase' : 'sales') : opt.tscope;
      const auto = m.auto ? SCOPE_TYPES[scope].filter((t) => new RegExp(t === 'pi' ? 'proforma|\\bpi\\b' : t === 'po' ? 'purchase|\\bpo\\b' : t === 'quote' ? 'quot' : 'invoice', 'i').test(m.auto) && !(t === 'invoice' && /^proforma/i.test(m.auto.trim()) && !/tax|,/i.test(m.auto))) : [];
      const match = (t) => t.scope === scope && nkey(t.title) === nkey(m.title) && (m.title || nkey(t.content) === nkey(m.content));
      const ex = findIn(S.terms, match) || findIn(res.add, match);
      if (ex && res.add.includes(ex)) { Object.assign(ex, { content: m.content || ex.content }); return; }
      if (ex) { const u = term({ ...ex, content: m.content ?? ex.content, auto: m.auto ? auto : ex.auto }); res.upd.push(u); res.preview.push(['Update', u]); }
      else { const sort = S.terms.filter((x) => x.scope === scope).length + res.add.filter((x) => x.scope === scope).length + 1; const n = term({ scope, title: m.title, content: m.content, auto, sort }); res.add.push(n); res.preview.push(['New', n]); }
    }
  });
  res.cols = rows.length ? Object.keys(rows[0]) : [];
  res.used = res.cols.filter((c) => Object.values(ALIAS[kind]).some((al) => al.includes(nkey(c))));
  return res;
}

function viewImport() {
  setPage('Import data', '', '/settings');
  main().innerHTML = `
    <div class="card"><h2>1 · What are you importing?</h2>
      <div class="chips" id="iKind"><button class="chip active" data-k="parties">Customers &amp; vendors</button><button class="chip" data-k="products">Products</button><button class="chip" data-k="terms">Terms &amp; conditions</button></div>
      <div id="iOpts"></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="iTpl">${icon('download')} Download Excel template</button><span class="muted small">Fill the template, or use your own file – common column names are recognised automatically.</span></div>
    </div>
    <div class="card"><h2>2 · Choose your Excel or CSV file</h2>
      <label class="btn gold">${icon('upload')} Choose file (.xlsx, .xls, .csv)<input type="file" id="iFile" accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label>
      <span class="muted small" id="iName" style="margin-left:8px"></span>
      <div id="iSheet" style="margin-top:10px"></div>
    </div>
    <div class="card"><h2>3 · Check &amp; import</h2><div id="iPrev" class="muted">Choose a file to see a preview here.</div></div>`;
  let kind = 'parties', wb = null, sheetName = '', plan = null;
  const opt = { ptype: 'customer', tscope: 'sales' };
  const drawOpts = () => {
    $('#iOpts').innerHTML = kind === 'parties'
      ? `<label class="f" style="max-width:340px">If the file has no “Type” column, import everyone as<select id="iPtype"><option value="customer">Customers</option><option value="vendor">Vendors</option><option value="both">Customer + Vendor</option></select></label>`
      : kind === 'terms' ? `<label class="f" style="max-width:340px">If the file has no “Applies To” column, add terms to<select id="iTscope"><option value="sales">Quotation / PI / Invoice</option><option value="purchase">Purchase Order</option></select></label>` : '';
    const a = $('#iPtype'); if (a) { a.value = opt.ptype; a.onchange = () => { opt.ptype = a.value; analyse(); }; }
    const b = $('#iTscope'); if (b) { b.value = opt.tscope; b.onchange = () => { opt.tscope = b.value; analyse(); }; }
  };
  const analyse = () => {
    if (!wb) return;
    const ws = wb.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    plan = planImport(kind, rows, opt);
    const unused = plan.cols.filter((c) => !plan.used.includes(c) && !/^__EMPTY/.test(c));
    const cell = (x) => kind === 'parties' ? [x.name, tagsOf(x), x.contact_person, x.phone, x.gstin, x.state_code ? stateName(x.state_code) : '', x.opening_balance ? inr(x.opening_balance) + ' ' + x.opening_type.toUpperCase() : '']
      : kind === 'products' ? [x.name, x.description, x.hsn, x.unit, inr(x.rate), num(x.tax_rate) + '%'] : [x.title, x.content, x.scope === 'purchase' ? 'PO' : 'Quote/PI/Invoice', (x.auto || []).join(', ')];
    const head = kind === 'parties' ? ['Name', 'Tags', 'Contact', 'Phone', 'GSTIN', 'State', 'Opening'] : kind === 'products' ? ['Name', 'Description', 'HSN', 'Unit', 'Rate', 'GST'] : ['Title', 'Content', 'For', 'Auto-add'];
    $('#iPrev').innerHTML = `
      <div class="stats" style="margin-bottom:12px"><div class="stat"><div class="k">Rows in file</div><div class="v">${rows.length}</div></div><div class="stat"><div class="k">New</div><div class="v cr">${plan.add.length}</div></div><div class="stat"><div class="k">Will update existing</div><div class="v">${plan.upd.length}</div></div><div class="stat"><div class="k">Skipped (no name)</div><div class="v muted">${plan.skip}</div></div></div>
      <div class="small" style="margin-bottom:8px">Columns used: ${plan.used.map((c) => `<span class="tag ok">${esc(c)}</span>`).join(' ') || '<span class="dr">none recognised – check the header row</span>'}${unused.length ? `<br>Ignored: ${unused.map((c) => `<span class="tag grey">${esc(c)}</span>`).join(' ')}` : ''}</div>
      ${plan.preview.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${plan.preview.slice(0, 12).map(([st, x]) => `<tr><td><span class="tag ${st === 'New' ? 'ok' : 'warn'}">${st}</span></td>${cell(x).map((v, i) => `<td>${kind === 'parties' && i === 1 ? v : esc(v || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${plan.preview.length > 12 ? `<div class="muted small" style="margin-top:6px">…and ${plan.preview.length - 12} more</div>` : ''}` : ''}
      <div class="row" style="margin-top:14px"><button class="btn primary" id="iGo" ${plan.add.length + plan.upd.length ? '' : 'disabled'}>Import ${plan.add.length + plan.upd.length} record(s)</button><span class="muted small">Existing records are matched by ${kind === 'parties' ? 'GSTIN or name' : kind === 'products' ? 'name' : 'title'}; blank cells don’t overwrite existing details.</span></div>`;
    $('#iGo').onclick = async (e) => {
      e.currentTarget.disabled = true;
      const table = kind; const rowsTo = [...plan.add, ...plan.upd];
      try {
        await DB.bulk(table, rowsTo);
        rowsTo.forEach((r) => { const i = S[table].findIndex((x) => x.id === r.id); if (i >= 0) S[table][i] = r; else S[table].push(r); });
        toast(`Imported ${rowsTo.length} record(s)`, 'ok');
        $('#iPrev').innerHTML = `<div class="cr"><b>Done.</b> ${plan.add.length} added, ${plan.upd.length} updated.</div><div class="row" style="margin-top:10px"><a class="btn" href="#/${kind === 'parties' ? 'parties' : kind === 'products' ? 'products' : 'terms'}">View ${kind === 'parties' ? 'customers & vendors' : kind}</a></div>`;
      } catch (err) { toast('Import failed: ' + errMsg(err), 'err'); e.currentTarget.disabled = false; }
    };
  };
  $$('#iKind .chip').forEach((b) => b.onclick = () => { kind = b.dataset.k; $$('#iKind .chip').forEach((x) => x.classList.toggle('active', x === b)); drawOpts(); analyse(); });
  drawOpts();
  $('#iTpl').onclick = async () => {
    try {
      await loadLib('XLSX');
      const ex = kind === 'parties' ? [partyXRow(S.parties[0] || party({ name: 'Sample Customer Pvt Ltd', is_customer: true }))] : kind === 'products' ? [productXRow(S.products[0] || product({ name: 'Sample item', unit: 'Nos', rate: 100 }))] : [termXRow(S.terms[0] || term({ title: 'Payment', content: '30% advance, balance on delivery.' }))];
      ex.forEach((r) => delete r['Closing Balance']);
      download(`${kind === 'parties' ? 'Customers-Vendors' : kind === 'products' ? 'Products' : 'Terms'}-template.xlsx`, xlsxBlob(xBook([[kind, xSheet(ex, HEAD[kind])]])));
    } catch (e) { toast(errMsg(e), 'err'); }
  };
  $('#iFile').onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      await loadLib('XLSX');
      $('#iName').textContent = f.name;
      wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: false });
      sheetName = wb.SheetNames[0];
      $('#iSheet').innerHTML = wb.SheetNames.length > 1 ? `<label class="f" style="max-width:300px">Sheet<select id="iSheetSel">${wb.SheetNames.map((n) => `<option>${esc(n)}</option>`).join('')}</select></label>` : '';
      const ss = $('#iSheetSel'); if (ss) ss.onchange = () => { sheetName = ss.value; analyse(); };
      analyse();
    } catch (err) { toast('Could not read file: ' + errMsg(err), 'err'); }
  };
}

/* ------------------------------------------------------------------ */
/*  Export everything as ZIP                                           */
/* ------------------------------------------------------------------ */
const FOLDER = { quote: '1 Quotations', pi: '2 Proforma Invoices', invoice: '3 Tax Invoices', dn: '4 Delivery Notes', receipt: '5 Payment Receipts', po: '6 Purchase Orders', purchase: '7 Purchases', payment: '8 Payment Vouchers' };
const safeName = (s) => String(s || '').replace(/[\\/:*?"<>|\n\r]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80).replace(/[. ]+$/, '');

function viewExport() {
  setPage('Export / Backup', '', '/');
  const counts = Object.fromEntries(TYPE_ORDER.map((t) => [t, S.documents.filter((d) => d.doc_type === t).length]));
  const att = S.documents.reduce((a, d) => a + (d.data?.attachments || []).length, 0);
  main().innerHTML = `
    <div class="card"><h2>Download everything as a ZIP</h2>
      <p class="muted small" style="margin-top:-6px">Every document as a PDF in its own folder, purchase bill attachments, customers / vendors / products / terms / ledgers in Excel, and a <code>backup.json</code> to restore the full data.</p>
      <div class="chips" id="eRange"><button class="chip active" data-r="all">All time</button><button class="chip" data-r="fy">This financial year</button><button class="chip" data-r="month">This month</button><button class="chip" data-r="custom">Choose dates</button></div>
      <div class="fgrid hidden" id="eDates"><label class="f">From<input type="date" id="eFrom" value="${fyStart()}"></label><label class="f">To<input type="date" id="eTo" value="${today()}"></label></div>
      <h3 style="font-size:13.5px;margin:14px 0 8px">Documents</h3>
      <div class="row" style="gap:14px">${TYPE_ORDER.map((t) => `<label class="check"><input type="checkbox" data-et="${t}" checked> ${TYPES[t].plural} <span class="muted small">(${counts[t]})</span></label>`).join('')}</div>
      <h3 style="font-size:13.5px;margin:14px 0 8px">Include</h3>
      <div class="row" style="gap:14px">
        <label class="check"><input type="checkbox" id="ePdf" checked> Document PDFs</label>
        <label class="check"><input type="checkbox" id="eAtt" checked> Purchase attachments (${att})</label>
        <label class="check"><input type="checkbox" id="eXls" checked> Excel files</label>
        <label class="check"><input type="checkbox" id="eJson" checked> Full backup (backup.json)</label>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn primary" id="eGo">${icon('zip')} Download ZIP</button><span class="small" id="eProg"></span></div>
    </div>
    <div class="card"><h2>Quick Excel downloads</h2>
      <div class="row">
        <button class="btn" data-x="customers">${icon('download')} Customers.xlsx</button><button class="btn" data-x="vendors">${icon('download')} Vendors.xlsx</button>
        <button class="btn" data-x="products">${icon('download')} Products.xlsx</button><button class="btn" data-x="terms">${icon('download')} Terms.xlsx</button>
        <button class="btn" data-x="docs">${icon('download')} Documents register.xlsx</button><button class="btn" data-x="ledgers">${icon('download')} Ledgers.xlsx</button>
      </div>
      <p class="muted small" style="margin-bottom:0">The customer, vendor, product and terms files use the same columns as the import, so you can edit them in Excel and import them back.</p>
    </div>`;
  let range = 'all';
  $$('#eRange .chip').forEach((b) => b.onclick = () => { range = b.dataset.r; $$('#eRange .chip').forEach((x) => x.classList.toggle('active', x === b)); $('#eDates').classList.toggle('hidden', range !== 'custom'); });
  $$('[data-x]').forEach((b) => b.onclick = async () => {
    try { await loadLib('XLSX'); const [name, bytes] = excelFile(b.dataset.x); download(name, xlsxBlob(bytes)); } catch (e) { toast(errMsg(e), 'err'); }
  });
  $('#eGo').onclick = async (e) => {
    const btn = e.currentTarget; btn.disabled = true; const say = (m) => { $('#eProg').textContent = m; };
    let from = '', to = '';
    if (range === 'fy') { from = fyStart(); to = '9999-12-31'; } else if (range === 'month') { [from, to] = monthRange(0); } else if (range === 'custom') { from = $('#eFrom').value; to = $('#eTo').value; }
    const opts = { from, to, types: $$('[data-et]').filter((c) => c.checked).map((c) => c.dataset.et), pdf: $('#ePdf').checked, att: $('#eAtt').checked, xls: $('#eXls').checked, json: $('#eJson').checked };
    try {
      const blob = await exportZip(opts, say);
      download(`${safeName(S.settings.company.name || 'Billing')} Backup ${today()}.zip`, blob);
      $('#eProg').innerHTML = '<span class="cr">ZIP ready – check your downloads.</span>';
    } catch (err) { console.error(err); $('#eProg').innerHTML = `<span class="dr">Failed: ${esc(errMsg(err))}</span>`; }
    btn.disabled = false;
  };
}

function excelFile(which) {
  const c = S.parties.filter((p) => p.is_customer).sort(byName), v = S.parties.filter((p) => p.is_vendor).sort(byName);
  const docs = S.documents.slice().sort((a, b) => (a.doc_type + a.doc_date + a.doc_no).localeCompare(b.doc_type + b.doc_date + b.doc_no, 'en', { numeric: true }));
  const H = [...HEAD.parties, 'Closing Balance'];
  switch (which) {
    case 'customers': return ['Customers.xlsx', xBook([['Customers', xSheet(c.map(partyXRow), H)]])];
    case 'vendors': return ['Vendors.xlsx', xBook([['Vendors', xSheet(v.map(partyXRow), H)]])];
    case 'products': return ['Products.xlsx', xBook([['Products', xSheet(S.products.slice().sort(byName).map(productXRow), HEAD.products)]])];
    case 'terms': return ['Terms.xlsx', xBook([['Terms', xSheet(S.terms.slice().sort((a, b) => a.scope.localeCompare(b.scope) || bySort(a, b)).map(termXRow), HEAD.terms)]])];
    case 'docs': return ['Documents register.xlsx', xBook([['All documents', xSheet(docRegisterRows(docs))], ...TYPE_ORDER.filter((t) => docs.some((d) => d.doc_type === t)).map((t) => [TYPES[t].plural, xSheet(docRegisterRows(docs.filter((d) => d.doc_type === t)))])])];
    case 'ledgers': return ['Ledgers.xlsx', ledgerBook()];
  }
}

async function exportZip(o, say) {
  say('Loading tools…');
  await loadLib('JSZip');
  if (o.xls) await loadLib('XLSX');
  if (o.pdf) { await loadLib('html2canvas'); await loadLib('PDFLib'); }
  const zip = new window.JSZip();
  const root = zip.folder(`${safeName(S.settings.company.name || 'Billing')} Backup ${today()}`);
  const docs = S.documents.filter((d) => o.types.includes(d.doc_type) && (!o.from || (d.doc_date >= o.from && d.doc_date <= o.to)))
    .sort((a, b) => (a.doc_date + a.doc_no).localeCompare(b.doc_date + b.doc_no, 'en', { numeric: true }));
  let i = 0; const failed = [];
  for (const d of docs) {
    i++;
    const base = safeName(`${d.doc_no} - ${d.party?.name || ''}`);
    const folder = root.folder(FOLDER[d.doc_type]);
    if (o.pdf) {
      say(`PDF ${i} of ${docs.length}: ${d.doc_no}`);
      try { folder.file(base + '.pdf', await buildPdf([{ html: paperHTML(d), label: d.doc_no }], () => {})); } catch (e) { failed.push(d.doc_no); }
    }
    if (o.att && (d.data?.attachments || []).length) {
      const af = folder.folder(base + ' - attachments');
      for (const a of d.data.attachments) {
        say(`Attachment ${a.name} (${d.doc_no})`);
        try { af.file(safeName(a.name) || 'file', await Files.blob(a)); } catch (e) { failed.push(`${d.doc_no}/${a.name}`); }
      }
    }
  }
  if (o.xls) {
    say('Excel files…');
    ['customers', 'vendors', 'products', 'terms', 'docs', 'ledgers'].forEach((w) => { const [n, b] = excelFile(w); root.file(n, b); });
  }
  if (o.json) root.file('backup.json', JSON.stringify({ app: 'ajanta-billing', version: 2, exported_at: nowIso(), parties: S.parties, products: S.products, terms: S.terms, documents: S.documents, settings: S.settings }, null, 1));
  root.file('READ ME.txt', `${S.settings.company.name} – backup made on ${fmtDate(today())}\r\n\r\n${docs.length} documents${o.from ? ` (${fmtDate(o.from)} to ${o.to.startsWith('9999') ? fmtDate(today()) : fmtDate(o.to)})` : ' (all time)'}\r\nFolders 1–8: document PDFs. Purchases include the attached supplier bills.\r\nExcel files: customers, vendors, products, terms, documents register, ledgers.\r\nbackup.json: open the billing app → Settings → Restore from backup.json to restore everything.\r\n${failed.length ? '\r\nCould not include: ' + failed.join(', ') + '\r\n' : ''}`);
  if (failed.length) toast(`${failed.length} item(s) could not be included – see READ ME.txt`, 'err');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, (m) => say(`Packing ZIP… ${Math.round(m.percent)}%`));
}

function resizeImage(file, max) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/png')); }; im.onerror = rej; im.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  CA Export – Sales PDF & Purchase PDF                               */
/* ------------------------------------------------------------------ */
const LIBS = {
  html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  PDFLib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  XLSX: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  JSZip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
};
function loadLib(name) {
  if (window[name]) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIBS[name]; s.onload = res; s.onerror = () => rej(new Error('Could not load PDF tools – check internet connection')); document.head.appendChild(s); });
}

function fyStart(d = new Date()) { const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-04-01`; }
function monthRange(offset) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); const y = d.getFullYear(), m = d.getMonth(); const last = new Date(y, m + 1, 0).getDate(); const mm = String(m + 1).padStart(2, '0'); return [`${y}-${mm}-01`, `${y}-${mm}-${String(last).padStart(2, '0')}`]; }

function viewCA() {
  setPage('CA Export', '', '/');
  const [mf, mt] = monthRange(-1);
  const card = (k, title, desc) => `
    <div class="card" id="ca-${k}">
      <h2>${title}</h2><p class="muted small" style="margin-top:-6px">${desc}</p>
      <div class="chips" style="margin-bottom:10px"><button class="chip" data-q="this">This month</button><button class="chip" data-q="last">Last month</button><button class="chip" data-q="q">Last 3 months</button><button class="chip" data-q="fy">This financial year</button></div>
      <div class="fgrid"><label class="f">From date<input type="date" data-from value="${mf}"></label><label class="f">To date<input type="date" data-to value="${mt}"></label></div>
      <div class="muted small" data-count style="margin:10px 0"></div>
      <div class="row"><button class="btn primary" data-pdf>${icon('download')} Make ${k === 'sales' ? 'Sales' : 'Purchase'} PDF</button><button class="btn" data-csv>${icon('download')} Register (Excel / CSV)</button></div>
      <div class="small" data-prog style="margin-top:10px"></div>
    </div>`;
  main().innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));align-items:start">
    ${card('sales', 'Sales – for CA', 'All tax invoices in the date range, followed by every customer’s ledger for the same period. Starts with a sales register (taxable, CGST, SGST, IGST).')}
    ${card('purchase', 'Purchases – for CA', 'All purchase entries in the date range, each followed by its attached supplier bill, then every vendor’s ledger for the same period. Starts with a purchase register.')}
  </div>`;
  ['sales', 'purchase'].forEach((k) => {
    const root = $('#ca-' + k), from = $('[data-from]', root), to = $('[data-to]', root);
    const count = () => {
      const docs = caDocs(k, from.value, to.value);
      const tot = docs.reduce((a, d) => a + num(d.grand_total), 0);
      const att = k === 'purchase' ? docs.reduce((a, d) => a + (d.data?.attachments || []).length, 0) : 0;
      $('[data-count]', root).innerHTML = `<b>${docs.length}</b> ${k === 'sales' ? 'invoices' : 'purchase entries'} · total <b>${inr(tot)}</b>${k === 'purchase' ? ` · <b>${att}</b> attachments` : ''} · <b>${caParties(k, from.value, to.value).length}</b> ledgers`;
    };
    from.onchange = count; to.onchange = count;
    $$('[data-q]', root).forEach((b) => b.onclick = () => {
      let r; const t = today();
      if (b.dataset.q === 'this') r = [monthRange(0)[0], t];
      else if (b.dataset.q === 'last') r = monthRange(-1);
      else if (b.dataset.q === 'q') r = [monthRange(-3)[0], monthRange(-1)[1]];
      else r = [fyStart(), t];
      from.value = r[0]; to.value = r[1]; count();
    });
    $('[data-pdf]', root).onclick = async (e) => {
      if (!from.value || !to.value || from.value > to.value) return toast('Choose a valid From and To date', 'err');
      const btn = e.currentTarget; btn.disabled = true; const prog = $('[data-prog]', root);
      try {
        const bytes = await caPdf(k, from.value, to.value, (m) => { prog.textContent = m; });
        download(`${k === 'sales' ? 'Sales' : 'Purchase'}_${fmtDate(from.value).replace(/\//g, '-')}_to_${fmtDate(to.value).replace(/\//g, '-')}.pdf`, new Blob([bytes], { type: 'application/pdf' }));
        prog.innerHTML = '<span class="cr">PDF ready – check your downloads.</span>';
      } catch (err) { console.error(err); prog.innerHTML = `<span class="dr">Failed: ${esc(errMsg(err))}</span>`; }
      btn.disabled = false;
    };
    $('[data-csv]', root).onclick = () => {
      const rows = caRegister(k, from.value, to.value);
      const head = k === 'sales' ? ['Date', 'Invoice No', 'Customer', 'GSTIN', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Other charges', 'Total'] : ['Bill Date', 'Entry No', 'Vendor Bill No', 'Vendor', 'GSTIN', 'State', 'Taxable', 'CGST', 'SGST', 'IGST', 'Other charges', 'Total'];
      const body = rows.map((r) => k === 'sales' ? [fmtDate(r.d.doc_date), r.d.doc_no, r.d.party?.name, r.d.party?.gstin, r.state, r.k.subtotal, r.k.cgst, r.k.sgst, r.k.igst, r.extra, r.d.grand_total] : [fmtDate(r.d.doc_date), r.d.doc_no, r.d.data?.bill_no || '', r.d.party?.name, r.d.party?.gstin, r.state, r.k.subtotal, r.k.cgst, r.k.sgst, r.k.igst, r.extra, r.d.grand_total]);
      const csv = [head, ...body].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      download(`${k === 'sales' ? 'Sales' : 'Purchase'}_register_${from.value}_to_${to.value}.csv`, '\ufeff' + csv, 'text/csv');
    };
    count();
  });
}

function caDocs(k, from, to) {
  const t = k === 'sales' ? 'invoice' : 'purchase';
  return S.documents.filter((d) => d.doc_type === t && d.doc_date >= from && d.doc_date <= to)
    .sort((a, b) => (a.doc_date + a.doc_no).localeCompare(b.doc_date + b.doc_no, 'en', { numeric: true }));
}
function caParties(k, from, to) {
  const flag = k === 'sales' ? 'is_customer' : 'is_vendor';
  return S.parties.filter((p) => p[flag]).filter((p) => {
    const rows = ledgerRows(p.id, from, to);
    return rows.some((r) => r.id) || Math.abs(rows.length ? rows[rows.length - 1].bal : 0) > 0.004;
  }).sort(byName);
}
function caRegister(k, from, to) {
  return caDocs(k, from, to).map((d) => {
    const kk = calc(d); const sc = d.party?.state_code || gstState(d.party?.gstin);
    return { d, k: kk, extra: r2((kk.extras || []).reduce((a, e) => a + e.amount, 0)), state: sc ? `${stateName(sc)} (${sc})` : '' };
  });
}
function registerPaper(k, from, to) {
  const rows = caRegister(k, from, to);
  const T = (f) => r2(rows.reduce((a, r) => a + f(r), 0));
  const title = k === 'sales' ? 'SALES<br>REGISTER' : 'PURCHASE<br>REGISTER';
  const head = paperHead({ doc_type: 'invoice' }).replace(/TAX<br>INVOICE/, title);
  return `<div class="paper long">${head}
    <div style="margin:12px 0 8px"><b>Period:</b> ${fmtDate(from)} to ${fmtDate(to)} &nbsp;·&nbsp; <b>${rows.length}</b> ${k === 'sales' ? 'invoices' : 'purchase bills'}</div>
    <table class="pp-items pp-ledger"><thead><tr><th>#</th><th>DATE</th><th>${k === 'sales' ? 'INVOICE' : 'ENTRY / BILL'}</th><th>${k === 'sales' ? 'CUSTOMER' : 'VENDOR'} / GSTIN</th><th class="c-num">TAXABLE</th><th class="c-num">CGST</th><th class="c-num">SGST</th><th class="c-num">IGST</th><th class="c-num">TOTAL</th></tr></thead><tbody>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${fmtDate(r.d.doc_date)}</td><td>${esc(r.d.doc_no)}${r.d.data?.bill_no ? '<br><span class="pp-rate">' + esc(r.d.data.bill_no) + '</span>' : ''}</td><td>${esc(r.d.party?.name)}<br><span class="pp-rate">${esc(r.d.party?.gstin || 'Unregistered')}</span></td><td class="c-num">${inr(r.k.subtotal)}</td><td class="c-num">${inr(r.k.cgst)}</td><td class="c-num">${inr(r.k.sgst)}</td><td class="c-num">${inr(r.k.igst)}</td><td class="c-num">${inr(r.d.grand_total)}</td></tr>`).join('') || '<tr><td colspan="9">No entries in this period</td></tr>'}
    <tr><td></td><td></td><td></td><td><b>TOTAL</b></td><td class="c-num"><b>${inr(T((r) => r.k.subtotal))}</b></td><td class="c-num"><b>${inr(T((r) => r.k.cgst))}</b></td><td class="c-num"><b>${inr(T((r) => r.k.sgst))}</b></td><td class="c-num"><b>${inr(T((r) => r.k.igst))}</b></td><td class="c-num"><b>${inr(T((r) => num(r.d.grand_total)))}</b></td></tr>
    </tbody></table>
    ${T((r) => r.extra) ? `<div class="pp-note">Includes non-taxable other charges of ${inr(T((r) => r.extra))}.</div>` : ''}
  </div>`;
}

async function caPdf(k, from, to, say) {
  say('Loading PDF tools…');
  await loadLib('html2canvas'); await loadLib('PDFLib');
  const docs = caDocs(k, from, to), parties = caParties(k, from, to);
  const parts = [{ html: registerPaper(k, from, to), label: 'register' }];
  docs.forEach((d) => {
    parts.push({ html: paperHTML(d), label: d.doc_no });
    if (k === 'purchase') (d.data?.attachments || []).forEach((a) => parts.push({ att: a, label: `${d.doc_no} – ${a.name}` }));
  });
  if (parties.length) parties.forEach((p) => parts.push({ html: ledgerPaper(p, from, to), label: 'Ledger ' + p.name }));
  return buildPdf(parts, (i, n, l) => say(`Building PDF… ${i}/${n} (${l})`));
}

async function buildPdf(parts, progress) {
  const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
  const out = await PDFDocument.create();
  const A4 = [595.28, 841.89];
  const font = await out.embedFont(StandardFonts.Helvetica);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;width:794px;background:#fff;z-index:-1';
  document.body.appendChild(host);
  const toBytes = (dataUrl) => Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
  const failed = [];
  try {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]; progress(i + 1, parts.length, p.label);
      if (p.html) {
        host.innerHTML = p.html;
        await Promise.all($$('img', host).map((im) => im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; })));
        const canvas = await window.html2canvas(host.firstElementChild, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
        const pageH = Math.round(canvas.width * A4[1] / A4[0]);
        for (let y = 0; y < canvas.height - 24; y += pageH) {
          const h = Math.min(pageH, canvas.height - y);
          const c = document.createElement('canvas'); c.width = canvas.width; c.height = pageH;
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
          const img = await out.embedJpg(toBytes(c.toDataURL('image/jpeg', 0.88)));
          out.addPage(A4).drawImage(img, { x: 0, y: 0, width: A4[0], height: A4[1] });
        }
      } else if (p.att) {
        try {
          const blob = await Files.blob(p.att);
          const bytes = new Uint8Array(await blob.arrayBuffer());
          if ((p.att.type || blob.type) === 'application/pdf' || /\.pdf$/i.test(p.att.name)) {
            const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
            (await out.copyPages(src, src.getPageIndices())).forEach((pg) => out.addPage(pg));
          } else {
            // any image → JPEG via canvas, fitted on an A4 page with a caption
            const url = URL.createObjectURL(blob);
            const im = await new Promise((res, rej) => { const x = new Image(); x.onload = () => res(x); x.onerror = () => rej(new Error('unsupported image')); x.src = url; });
            const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
            const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0);
            URL.revokeObjectURL(url);
            const img = await out.embedJpg(toBytes(c.toDataURL('image/jpeg', 0.85)));
            const page = out.addPage(A4), m = 28, top = 30;
            const sc = Math.min((A4[0] - 2 * m) / img.width, (A4[1] - 2 * m - top) / img.height);
            const w = img.width * sc, h = img.height * sc;
            page.drawText('Attachment: ' + p.label.replace(/[^\x20-\x7E]/g, ' '), { x: m, y: A4[1] - m - 10, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
            page.drawImage(img, { x: (A4[0] - w) / 2, y: A4[1] - m - top - h, width: w, height: h });
          }
        } catch (e) {
          console.warn(e); failed.push(p.label);
          const page = out.addPage(A4);
          page.drawText('Attachment could not be added: ' + p.label.replace(/[^\x20-\x7E]/g, ' '), { x: 40, y: A4[1] - 60, size: 11, font, color: rgb(0.7, 0.1, 0.1) });
        }
      }
    }
  } finally { host.remove(); }
  if (failed.length) toast(`${failed.length} attachment(s) could not be added – see the marked pages`, 'err');
  return out.save();
}

/* ------------------------------------------------------------------ */
/*  Login & boot                                                       */
/* ------------------------------------------------------------------ */
function showLogin(msg = '') {
  document.body.innerHTML = `<div class="login"><form class="card" id="lgForm">
    <img src="assets/logo.png" alt="">
    <h2 style="text-align:center;margin-bottom:16px">Billing – Sign in</h2>
    ${msg ? `<div class="demo-banner">${esc(msg)}</div>` : ''}
    <label class="f">Email<input type="email" id="lgEmail" required autocomplete="username"></label>
    <label class="f" style="margin-top:10px">Password<input type="password" id="lgPass" required autocomplete="current-password"></label>
    <button class="btn primary block" style="margin-top:16px" id="lgBtn">Sign in</button>
  </form></div><div id="toasts"></div>`;
  $('#lgForm').onsubmit = async (e) => {
    e.preventDefault(); $('#lgBtn').disabled = true;
    const { error } = await Remote.sb.auth.signInWithPassword({ email: $('#lgEmail').value.trim(), password: $('#lgPass').value });
    if (error) { $('#lgBtn').disabled = false; return toast(error.message, 'err'); }
    location.reload();
  };
}
async function logout() { if (MODE === 'cloud') { await Remote.sb.auth.signOut(); location.reload(); } }

async function boot() {
  try {
    if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) {
      if (!window.supabase) throw new Error('Could not load Supabase library. Check internet connection.');
      MODE = 'cloud'; DB = Remote; Remote.init();
      const { data: { session } } = await Remote.sb.auth.getSession();
      if (!session) return showLogin();
      USER = session.user;
      const { data: ok, error } = await Remote.sb.rpc('is_member');
      if (error) throw error;
      if (!ok) { await Remote.sb.auth.signOut(); return showLogin(`${USER.email} is not allowed to use this app. Add it to the app_members table in Supabase.`); }
    }
    await loadData();
  } catch (e) {
    console.error(e);
    $('#main').innerHTML = `<div class="card"><h2>Could not connect</h2><p>${esc(errMsg(e))}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
    return;
  }
  navHTML();
  window.addEventListener('hashchange', route);
  route();
}
boot();
