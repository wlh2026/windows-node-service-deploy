/**
 * 四福车间管理系统 - 后端服务
 * 模块1：铜线出入库台账（生产车间对比表 + 仓库领用表）
 * 模块2：小型工具管理台账（档案/借还/维修/报废/盘点/报表/权限）
 * 技术：Node.js 内置 http + node:sqlite（免费、零安装、单文件数据库）
 *
 * 程序设计：Mr WU
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8090;
const ROOT = __dirname;
// DATA_DIR 可指定数据库与数据文件的存放目录（部署时便于挂盘/备份）；未设置则沿用程序根目录
const DATA_DIR = process.env.DATA_DIR || ROOT;
const DB_FILE = path.join(DATA_DIR, 'data.db');
// 自动备份目录（每天 15:00 备份到此处，保留最近 30 份）
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
let db = new DatabaseSync(DB_FILE);

/* ============ 程序元信息 ============ */
const APP_INFO = {
  author: 'Mr WU',
  // 大版本号：每次大改手动+1；小版本：基于 changelog 条数自动计算
  major: 1
};

/* ============ 版本号自动管理 ============
 * 设计：data/changelog.json 数组里每条记录一次修改；启动时根据数组长度自动算版本号
 *   总修改次数 = changelog.length
 *   每次小版本 +1，最多 8 次后进位到大版本，大版本 +1，小版本归零
 *   版本号格式：X.Y.Z  (X=大版本 Y=小版本 Z=修订)
 *   当前规则：以"小版本(Y) = floor(总次数/8)"、"修订(Z) = 总次数%8" 自动计算
 */
const CHANGELOG_FILE = path.join(ROOT, 'data', 'changelog.json');
const VERSION_FILE = path.join(ROOT, 'data', 'version.json');
function loadChangelog() {
  try { return JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf8')); } catch (e) { return []; }
}
function saveChangelog(arr) {
  if (!fs.existsSync(path.dirname(CHANGELOG_FILE))) fs.mkdirSync(path.dirname(CHANGELOG_FILE), { recursive: true });
  fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(arr, null, 2), 'utf8');
}
function computeVersion(changelog) {
  // 当前版本号 = changelog 第一条（最新）记录的 version 字段（changelog 按新→旧排列）
  // 自动叠加规则：每 8 次小版本进位到大版本
  //   首次：1.0.0
  //   第 1 次 buma：1.0.1；... 第 7 次：1.0.7
  //   第 8 次：1.1.0（第 8 次后小版本归零，大版本 +1）
  //   第 9 次：1.1.1；... 第 16 次：1.2.0
  //   规律：Y = floor(n/8)，Z = n%8  （n = buma 调用次数）
  const last = changelog[0];
  return last ? last.version : '0.0.0';
}
// 启动时若 chalog 为空则写入初始条目
let changelog = loadChangelog();
if (changelog.length === 0) {
  changelog.push({
    version: '1.0.0',
    date: new Date().toISOString().slice(0, 10),
    changes: '初始发布：铜线出入库台账 + 小型工具管理台账 双模块'
  });
  saveChangelog(changelog);
}
const CURRENT_VERSION = computeVersion(changelog);
function persistVersion() {
  if (!fs.existsSync(path.dirname(VERSION_FILE))) fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true });
  fs.writeFileSync(VERSION_FILE, JSON.stringify({ version: CURRENT_VERSION, author: APP_INFO.author, last_check: new Date().toISOString() }, null, 2), 'utf8');
}
persistVersion();
// 自动叠加：每次启动如果文件中的版本号与计算的不一致，说明有新的 changelog 条目，更新 version.json
console.log('程序设计：' + APP_INFO.author + '　版本：' + CURRENT_VERSION);

/* ============ 数据库初始化 ============ */
db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'production', -- admin(全部)/production(生产车间-铜线台账)/warehouse(仓库管理员-工具台账)
  dept TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 模块1：生产车间每日生产型号重量对比表
CREATE TABLE IF NOT EXISTS production_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rec_date TEXT NOT NULL,          -- 日期
  task_no TEXT NOT NULL,           -- 生产任务单号
  bom_no TEXT DEFAULT '',          -- BOM号
  motor_type TEXT DEFAULT '',      -- 电机类型：单相/三相/永磁/空
  main_die_size TEXT DEFAULT '',   -- 主线线模尺寸(单相主线/三相线模)
  aux_die_size TEXT DEFAULT '',    -- 副线线模尺寸(仅单相)
  wire_spec TEXT NOT NULL,         -- 铜线(漆包线)规格型号
  bom_weight REAL DEFAULT 0,       -- BOM重量(kg)
  actual_weight REAL DEFAULT 0,    -- 实际生产重量(kg)
  diff_weight REAL DEFAULT 0,      -- 差重(实际-BOM)
  remark TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 模块1：仓库管理员领出/回库表
CREATE TABLE IF NOT EXISTS warehouse_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rec_date TEXT NOT NULL,          -- 日期
  wire_spec TEXT NOT NULL,         -- 漆包线规格
  out_weight REAL DEFAULT 0,       -- 领出重量(kg)
  return_weight REAL DEFAULT 0,    -- 回库重量(kg)
  scrap_weight REAL DEFAULT 0,     -- 报废重量-线头(kg)
  remark TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 铜线规格型号主数据（下拉选择，管理员可新增；与领用表/生产对比表共用）
CREATE TABLE IF NOT EXISTS copper_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spec TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 铜线库存表（按规格型号记录库存量，仓库领用后自动扣减）
CREATE TABLE IF NOT EXISTS copper_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spec TEXT UNIQUE NOT NULL,       -- 铜线规格型号（与 copper_specs.spec 一致）
  stock REAL DEFAULT 0,            -- 当前库存量(kg)
  unit TEXT DEFAULT 'kg',
  remark TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 模块2：工具基础档案
CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,       -- 工具编号 类别+流水号 如 DZ-001
  serial_no TEXT DEFAULT '',       -- 序列号/机身号
  name TEXT NOT NULL,              -- 工具名称
  model TEXT DEFAULT '',           -- 型号/规格
  brand TEXT DEFAULT '',           -- 品牌
  category TEXT NOT NULL,          -- 类别：电动/手动/测量/刀具/易耗品...
  location TEXT DEFAULT '',        -- 存放位置
  purchase_date TEXT DEFAULT '',   -- 采购日期
  life_span TEXT DEFAULT '',       -- 保质期/使用寿命
  supplier TEXT DEFAULT '',        -- 供应商
  price REAL DEFAULT 0,            -- 单价
  dept TEXT DEFAULT '',            -- 资产所属部门
  photo TEXT DEFAULT '',           -- 照片(base64)
  qty INTEGER DEFAULT 1,           -- 数量（易耗品可>1）
  min_stock INTEGER DEFAULT 0,     -- 安全库存线(0=不预警)
  maint_cycle INTEGER DEFAULT 0,   -- 保养周期(天,0=不保养)
  last_maint TEXT DEFAULT '',      -- 上次保养日期
  status TEXT DEFAULT '在库',      -- 在库/借出/维修中/已报废
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 借还记录
CREATE TABLE IF NOT EXISTS borrow_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  tool_code TEXT NOT NULL,
  borrower TEXT NOT NULL,          -- 借用人
  borrower_dept TEXT DEFAULT '',   -- 班组/部门
  borrow_time TEXT NOT NULL,       -- 借用时间
  expect_return TEXT DEFAULT '',   -- 预计归还时间
  purpose TEXT DEFAULT '',         -- 用途/工单号
  return_time TEXT DEFAULT '',     -- 实际归还时间
  returner TEXT DEFAULT '',        -- 归还人
  return_state TEXT DEFAULT '',    -- 完好/待维修/已损坏
  status TEXT DEFAULT '借出中',    -- 借出中/已归还
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 维修保养记录
CREATE TABLE IF NOT EXISTS maintain_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  tool_code TEXT NOT NULL,
  mtype TEXT DEFAULT '维修',       -- 维修/保养
  send_date TEXT NOT NULL,         -- 送修/保养日期
  fault TEXT DEFAULT '',           -- 故障原因/保养内容
  cost REAL DEFAULT 0,             -- 费用
  finish_date TEXT DEFAULT '',     -- 完成日期
  status TEXT DEFAULT '进行中',    -- 进行中/已完成
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 报废记录
CREATE TABLE IF NOT EXISTS scrap_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id INTEGER NOT NULL,
  tool_code TEXT NOT NULL,
  tool_name TEXT DEFAULT '',
  scrap_date TEXT NOT NULL,
  reason TEXT DEFAULT '',          -- 报废原因
  approver TEXT DEFAULT '',        -- 批准人
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- 盘点
CREATE TABLE IF NOT EXISTS stocktakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_time TEXT DEFAULT (datetime('now','localtime')),
  finish_time TEXT DEFAULT '',
  status TEXT DEFAULT '进行中',    -- 进行中/已完成
  operator TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS stocktake_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stocktake_id INTEGER NOT NULL,
  tool_id INTEGER NOT NULL,
  tool_code TEXT NOT NULL,
  tool_name TEXT DEFAULT '',
  expect_status TEXT DEFAULT '',   -- 账面状态
  checked INTEGER DEFAULT 0,       -- 是否已清点
  check_time TEXT DEFAULT '',
  result TEXT DEFAULT ''           -- 正常/盘亏/盘盈备注
);
`);

// 默认管理员
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const uCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (uCount === 0) {
  db.prepare('INSERT INTO users(username,password,name,role) VALUES(?,?,?,?)')
    .run('admin', hash('admin123'), '系统管理员', 'admin');
  db.prepare('INSERT INTO users(username,password,name,role,dept) VALUES(?,?,?,?,?)')
    .run('quality', hash('quality123'), '品质部', 'quality', '品质部');
  console.log('已创建默认管理员：admin / admin123；品质部账号：quality / quality123');
}

/* ============ 会话管理 ============ */
const sessions = new Map(); // token -> {user, ts}
function makeToken(user) {
  const t = crypto.randomBytes(24).toString('hex');
  sessions.set(t, { user, ts: Date.now() });
  return t;
}
function getUser(req) {
  const t = req.headers['x-token'] || '';
  const s = sessions.get(t);
  if (!s) return null;
  if (Date.now() - s.ts > 12 * 3600 * 1000) { sessions.delete(t); return null; }
  s.ts = Date.now();
  return s.user;
}

/* ============ 工具函数 ============ */
function send(res, code, data, type) {
  const body = type ? data : JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': (type || 'application/json') + '; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}
function ok(res, data) { send(res, 200, { ok: true, data }); }
function fail(res, msg, code) { send(res, code || 400, { ok: false, msg }); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; if (buf.length > 20 * 1024 * 1024) req.destroy(); });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
  });
}
function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    const lim = limit || 200 * 1024 * 1024;
    req.on('data', c => { chunks.push(c); size += c.length; if (size > lim) { req.destroy(); reject(new Error('上传文件过大')); } });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const esc = v => (v == null ? '' : String(v).trim());
// 铜线库存自动扣减：确保规格库存行存在，并按净变动量调整（net = 回库 - 领出）
function ensureInventory(spec) {
  const s = esc(spec);
  if (!s) return;
  db.prepare('INSERT OR IGNORE INTO copper_inventory(spec, stock) VALUES(?,0)').run(s);
}
function addInventory(spec, delta) {
  const s = esc(spec);
  if (!s) return;
  ensureInventory(s);
  db.prepare(`UPDATE copper_inventory SET stock = stock + ?, updated_at = datetime('now','localtime') WHERE spec = ?`).run(delta, s);
}
// 领用对库存的净影响：领出使库存减少，回库使库存增加
const invNet = (out, ret) => num(ret) - num(out);

// 旧库迁移抽成函数 applyMigrations()：恢复备份后再次执行，确保列/表结构齐全
function ensureColumn(table, col, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(col)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    console.log('已为表 ' + table + ' 添加列 ' + col);
  }
}
// 从 public/js/wire-specs.js 读取内置漆包线规格列表（作为铜线规格主数据种子）
function loadWireSpecs() {
  try {
    const f = path.join(ROOT, 'public', 'js', 'wire-specs.js');
    const src = fs.readFileSync(f, 'utf8');
    const m = src.match(/const\s+WIRE_SPECS\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (m) return (new Function('return ' + m[1]))();
  } catch (e) { console.log('读取内置规格失败：' + e.message); }
  return [];
}

function applyMigrations() {
  // 旧角色迁移：manager/employee -> production
  try { db.prepare(`UPDATE users SET role='production' WHERE role NOT IN ('admin','production','warehouse','quality')`).run(); } catch (e) {}

  ensureColumn('production_records', 'motor_type', "TEXT DEFAULT ''");
  ensureColumn('production_records', 'main_die_size', "TEXT DEFAULT ''");
  ensureColumn('production_records', 'aux_die_size', "TEXT DEFAULT ''");
  ensureColumn('warehouse_records', 'task_no', "TEXT DEFAULT ''");

  // 仓库领用表与生产对比表解耦：移除「与BOM对比差重」列（仓库只记录实际领用）
  try {
    const whCols = db.prepare(`PRAGMA table_info(warehouse_records)`).all().map(c => c.name);
    if (whCols.includes('bom_diff')) {
      db.exec(`ALTER TABLE warehouse_records DROP COLUMN bom_diff`);
      console.log('已移除 warehouse_records.bom_diff 列（仓库领用表与生产对比表解耦）');
    }
  } catch (e) { console.log('移除 bom_diff 列跳过：' + e.message); }

  // 铜线规格主数据 / 库存表：确保表存在（恢复备份后也会重建）
  db.exec(`CREATE TABLE IF NOT EXISTS copper_specs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS copper_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spec TEXT UNIQUE NOT NULL,
    stock REAL DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    remark TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  // 首次运行：用内置漆包线规格种子化下拉选项
  try {
    const spCount = db.prepare('SELECT COUNT(*) c FROM copper_specs').get().c;
    if (spCount === 0) {
      const specs = loadWireSpecs();
      const ist = db.prepare('INSERT OR IGNORE INTO copper_specs(spec) VALUES(?)');
      for (const s of specs) ist.run(s);
      console.log('已种子化铜线规格主数据 ' + specs.length + ' 条');
    }
  } catch (e) { console.log('铜线规格种子化跳过：' + e.message); }

  // 物料重量统计（品质部来料重量台账）：确保表存在
  db.exec(`CREATE TABLE IF NOT EXISTS material_weight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rec_date TEXT NOT NULL,            -- 来料日期
    bom_no TEXT NOT NULL DEFAULT '',   -- BOM号
    batch_no TEXT DEFAULT '',          -- 批次号
    material_name TEXT DEFAULT '',     -- 物料名称
    spec TEXT DEFAULT '',              -- 规格型号
    weight REAL DEFAULT 0,             -- 重量(kg)
    supplier TEXT DEFAULT '',          -- 供应商
    remark TEXT DEFAULT '',            -- 备注
    is_anomaly INTEGER DEFAULT 0,      -- 是否重量异常(同BOM号偏差>±3%)
    deviation REAL DEFAULT 0,          -- 偏差比例(小数, 0.05=5%)
    baseline_weight REAL DEFAULT 0,    -- 基准重量(同BOM号首条记录)
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  // 旧库补列：批次号 / 物料名称
  ensureColumn('material_weight', 'batch_no', "TEXT DEFAULT ''");
  ensureColumn('material_weight', 'material_name', "TEXT DEFAULT ''");

  // 模块2：小型工具领用表（按领用类型：新领/报废换新/维修调换）
  db.exec(`CREATE TABLE IF NOT EXISTS tool_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_date TEXT NOT NULL,       -- 领用日期
    tool_code TEXT DEFAULT '',      -- 工具编号（关联 tools，可选）
    tool_name TEXT DEFAULT '',      -- 工具名称
    issuer TEXT NOT NULL,           -- 领用人
    dept TEXT DEFAULT '',            -- 班组/部门
    itype TEXT NOT NULL,            -- 领用类型：新领/报废换新/维修调换
    qty INTEGER DEFAULT 1,          -- 数量
    purpose TEXT DEFAULT '',        -- 用途/工单号
    remark TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // 铜线入库批次流水（按规格/批次/供应商追溯每次入库）
  db.exec(`CREATE TABLE IF NOT EXISTS copper_inbound (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inbound_date TEXT NOT NULL,     -- 入库日期
    spec TEXT NOT NULL,             -- 铜线规格型号
    qty REAL DEFAULT 0,             -- 入库重量(kg)
    unit TEXT DEFAULT 'kg',
    supplier TEXT DEFAULT '',       -- 供应商
    batch_no TEXT DEFAULT '',       -- 批次号
    price REAL DEFAULT 0,           -- 单价(元/kg)
    remark TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  // 工具入库批次流水（按工具/批次/供应商追溯每次入库，入库后联动 tools.qty 增加）
  db.exec(`CREATE TABLE IF NOT EXISTS tool_inbound (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inbound_date TEXT NOT NULL,     -- 入库日期
    tool_code TEXT DEFAULT '',      -- 工具编号（关联 tools）
    tool_name TEXT DEFAULT '',      -- 工具名称
    supplier TEXT DEFAULT '',       -- 供应商
    batch_no TEXT DEFAULT '',       -- 批次号
    qty INTEGER DEFAULT 1,          -- 入库数量
    price REAL DEFAULT 0,           -- 单价(元/个)
    remark TEXT DEFAULT '',
    created_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
}
applyMigrations();

/* ============ API 路由（按模块授权） ============
 * 模块：copper=生产对比表  copper_wh=仓库领用表  tools=工具管理台账  admin=系统管理  common=通用
 * 角色可见模块：
 *   admin      -> 全部
 *   production -> copper + common （生产车间：仅生产对比表）
 *   warehouse  -> tools + copper_wh + common  （仓库管理员：工具台账 + 仓库领用表）
 */
const ROLE_MODULES = {
  admin: ['copper', 'copper_wh', 'tools', 'material_weight', 'admin', 'common'],
  production: ['copper', 'common'],
  warehouse: ['tools', 'copper_wh', 'common'],
  quality: ['material_weight', 'common']
};
const BOM_DIFF_LIMIT = 0.01; // 需修改BOM阈值：10g（kg单位）
const routes = [];
function route(method, pattern, handler, perm) {
  routes.push({ method, pattern, handler, perm });
}

/* ---- 认证 ---- */
route('POST', /^\/api\/login$/, async (req, res) => {
  const b = await readBody(req);
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(esc(b.username));
  if (!u || u.password !== hash(String(b.password || ''))) return fail(res, '用户名或密码错误', 401);
  const token = makeToken({ id: u.id, username: u.username, name: u.name, role: u.role, dept: u.dept });
  ok(res, { token, name: u.name, role: u.role, username: u.username });
});
route('GET', /^\/api\/me$/, (req, res, m, user) => ok(res, user), 'common');
route('GET', /^\/api\/version$/, (req, res) => {
  ok(res, {
    version: computeVersion(changelog),
    author: APP_INFO.author,
    changelog: changelog
  });
});
route('POST', /^\/api\/version\/bump$/, async (req, res) => {
  // 手动叠加版本号（仅管理员）
  const b = await readBody(req);
  const desc = esc(b.changes || '');
  if (!desc) return fail(res, '请填写本次更新说明');
  // 按 buma 次数计算新版本号：changelog.length - 1（不含初始 v1.0.0）
  const prevBumps = changelog.length - 1;
  const newPatch = prevBumps % 8;
  const newMinor = Math.floor(prevBumps / 8);
  const newVer = `${APP_INFO.major}.${newMinor}.${newPatch}`;
  changelog.push({
    version: newVer,
    date: new Date().toISOString().slice(0, 10),
    changes: desc
  });
  saveChangelog(changelog);
  persistVersion();
  ok(res, { version: newVer, changelog });
}, 'admin');
route('POST', /^\/api\/logout$/, (req, res) => {
  sessions.delete(req.headers['x-token'] || '');
  ok(res, null);
});

/* ---- 用户管理（仅管理员） ---- */
route('GET', /^\/api\/users$/, (req, res) => {
  ok(res, db.prepare('SELECT id,username,name,role,dept,created_at FROM users ORDER BY id').all());
}, 'admin');
route('POST', /^\/api\/users$/, async (req, res) => {
  const b = await readBody(req);
  if (!esc(b.username) || !esc(b.password) || !esc(b.name)) return fail(res, '用户名/密码/姓名必填');
  try {
    db.prepare('INSERT INTO users(username,password,name,role,dept) VALUES(?,?,?,?,?)')
      .run(esc(b.username), hash(String(b.password)), esc(b.name),
        ['admin', 'production', 'warehouse', 'quality'].includes(esc(b.role)) ? esc(b.role) : 'production', esc(b.dept));
    ok(res, null);
  } catch (e) { fail(res, '用户名已存在'); }
}, 'admin');
route('PUT', /^\/api\/users\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const id = +m[1];
  if (esc(b.password)) db.prepare('UPDATE users SET password=? WHERE id=?').run(hash(String(b.password)), id);
  const role = ['admin', 'production', 'warehouse', 'quality'].includes(esc(b.role)) ? esc(b.role) : 'production';
  db.prepare('UPDATE users SET name=?,role=?,dept=? WHERE id=?').run(esc(b.name), role, esc(b.dept), id);
  ok(res, null);
}, 'admin');
route('DELETE', /^\/api\/users\/(\d+)$/, (req, res, m) => {
  const u = db.prepare('SELECT username FROM users WHERE id=?').get(+m[1]);
  if (u && u.username === 'admin') return fail(res, '不能删除内置管理员');
  db.prepare('DELETE FROM users WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'admin');

/* ---- 模块1：生产车间对比表 ---- */
function listQuery(res, table, q, extraWhere) {
  const conds = [], args = [];
  if (q.get('from')) { conds.push('rec_date>=?'); args.push(q.get('from')); }
  if (q.get('to')) { conds.push('rec_date<=?'); args.push(q.get('to')); }
  if (q.get('spec')) { conds.push('wire_spec LIKE ?'); args.push('%' + q.get('spec') + '%'); }
  if (extraWhere) extraWhere(conds, args, q);
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM ${table}${where} ORDER BY rec_date DESC, id DESC LIMIT 2000`).all(...args);
  ok(res, rows);
}
route('GET', /^\/api\/production$/, (req, res, m, user, q) => {
  listQuery(res, 'production_records', q, (conds, args, qq) => {
    if (qq.get('task')) { conds.push('task_no LIKE ?'); args.push('%' + qq.get('task') + '%'); }
    if (qq.get('bom')) { conds.push('bom_no LIKE ?'); args.push('%' + qq.get('bom') + '%'); }
  });
}, 'copper');
route('POST', /^\/api\/production$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const items = Array.isArray(b.items) ? b.items : [b];
  const st = db.prepare(`INSERT INTO production_records
    (rec_date,task_no,bom_no,motor_type,main_die_size,aux_die_size,wire_spec,bom_weight,actual_weight,diff_weight,remark,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const it of items) {
    if (!esc(it.rec_date) || !esc(it.task_no) || !esc(it.wire_spec)) return fail(res, '日期/任务单号/规格必填');
    const bw = num(it.bom_weight), aw = num(it.actual_weight);
    st.run(esc(it.rec_date), esc(it.task_no), esc(it.bom_no), esc(it.motor_type), esc(it.main_die_size), esc(it.aux_die_size),
      esc(it.wire_spec), bw, aw, +(aw - bw).toFixed(4), esc(it.remark), user.name);
  }
  ok(res, null);
}, 'copper');
route('PUT', /^\/api\/production\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const bw = num(b.bom_weight), aw = num(b.actual_weight);
  db.prepare(`UPDATE production_records SET rec_date=?,task_no=?,bom_no=?,motor_type=?,main_die_size=?,aux_die_size=?,
    wire_spec=?,bom_weight=?,actual_weight=?,diff_weight=?,remark=? WHERE id=?`)
    .run(esc(b.rec_date), esc(b.task_no), esc(b.bom_no), esc(b.motor_type), esc(b.main_die_size), esc(b.aux_die_size),
      esc(b.wire_spec), bw, aw, +(aw - bw).toFixed(4), esc(b.remark), +m[1]);
  ok(res, null);
}, 'copper');
route('DELETE', /^\/api\/production\/(\d+)$/, (req, res, m) => {
  db.prepare('DELETE FROM production_records WHERE id=?').run(+m[1]); ok(res, null);
}, 'copper');

/* ---- 模块1：仓库领用表 ---- */
route('GET', /^\/api\/warehouse$/, (req, res, m, user, q) => {
  listQuery(res, 'warehouse_records', q, (conds, args, qq) => {
    if (qq.get('task')) { conds.push('task_no LIKE ?'); args.push('%' + qq.get('task') + '%'); }
  });
}, 'copper_wh');
route('POST', /^\/api\/warehouse$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const items = Array.isArray(b.items) ? b.items : [b];
  const st = db.prepare(`INSERT INTO warehouse_records
    (rec_date,task_no,wire_spec,out_weight,return_weight,scrap_weight,remark,created_by)
    VALUES(?,?,?,?,?,?,?,?)`);
  for (const it of items) {
    if (!esc(it.rec_date) || !esc(it.wire_spec)) return fail(res, '日期/规格必填');
    st.run(esc(it.rec_date), esc(it.task_no), esc(it.wire_spec), num(it.out_weight), num(it.return_weight),
      num(it.scrap_weight), esc(it.remark), user.name);
    // 领用后自动扣减对应规格库存（净变动 = 回库 - 领出）
    addInventory(it.wire_spec, invNet(it.out_weight, it.return_weight));
  }
  ok(res, null);
}, 'copper_wh');
route('PUT', /^\/api\/warehouse\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const old = db.prepare('SELECT * FROM warehouse_records WHERE id=?').get(+m[1]);
  db.prepare(`UPDATE warehouse_records SET rec_date=?,task_no=?,wire_spec=?,out_weight=?,return_weight=?,
    scrap_weight=?,remark=? WHERE id=?`)
    .run(esc(b.rec_date), esc(b.task_no), esc(b.wire_spec), num(b.out_weight), num(b.return_weight),
      num(b.scrap_weight), esc(b.remark), +m[1]);
  // 先回滚旧记录的库存影响，再应用新记录的影响（规格变更时两端都处理）
  if (old) {
    addInventory(old.wire_spec, -invNet(old.out_weight, old.return_weight));
    addInventory(b.wire_spec, invNet(b.out_weight, b.return_weight));
  }
  ok(res, null);
}, 'copper_wh');
route('DELETE', /^\/api\/warehouse\/(\d+)$/, (req, res, m) => {
  db.prepare('DELETE FROM warehouse_records WHERE id=?').run(+m[1]); ok(res, null);
}, 'copper_wh');

/* ---- 铜线规格主数据（下拉，管理员可维护） ---- */
route('GET', /^\/api\/copper-specs$/, (req, res) => {
  ok(res, db.prepare('SELECT id, spec, created_at FROM copper_specs ORDER BY spec').all());
}, 'common');
route('POST', /^\/api\/copper-specs$/, async (req, res) => {
  const b = await readBody(req);
  const spec = esc(b.spec);
  if (!spec) return fail(res, '规格不能为空');
  db.prepare('INSERT OR IGNORE INTO copper_specs(spec) VALUES(?)').run(spec);
  ok(res, null);
}, 'admin');
route('DELETE', /^\/api\/copper-specs\/(\d+)$/, (req, res, m) => {
  db.prepare('DELETE FROM copper_specs WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'admin');

/* ---- 铜线库存（录入/查看/编辑，领用自动扣减） ---- */
route('GET', /^\/api\/copper-inventory$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('spec')) { conds.push('spec LIKE ?'); args.push('%' + q.get('spec') + '%'); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM copper_inventory${where} ORDER BY stock DESC, spec`).all(...args));
}, 'copper_wh');
route('POST', /^\/api\/copper-inventory$/, async (req, res, m, user) => {
  const b = await readBody(req);
  if (!esc(b.spec)) return fail(res, '规格必填');
  const existing = db.prepare('SELECT * FROM copper_inventory WHERE spec=?').get(esc(b.spec));
  const mode = existing ? 'add' : 'create';   // add=同规格累计, create=新建
  db.prepare(`INSERT INTO copper_inventory(spec, stock, unit, remark)
    VALUES(?,?,?,?)
    ON CONFLICT(spec) DO UPDATE SET
      stock = copper_inventory.stock + excluded.stock,   -- 同规格累计入库，而非覆盖
      unit  = CASE WHEN excluded.unit='' OR excluded.unit IS NULL THEN copper_inventory.unit ELSE excluded.unit END,
      remark = CASE WHEN excluded.remark='' OR excluded.remark IS NULL THEN copper_inventory.remark ELSE excluded.remark END,
      updated_at = datetime('now','localtime')`)
    .run(esc(b.spec), num(b.stock), esc(b.unit) || 'kg', esc(b.remark));
  // 同步写入入库批次记录（便于按批次追溯）：快捷累计入库的供应商/批次号留空
  logCopperInbound(new Date().toLocaleDateString('en-CA'), b.spec, num(b.stock), b.unit, '', '', 0, b.remark, user.name);
  const row = db.prepare('SELECT * FROM copper_inventory WHERE spec=?').get(esc(b.spec));
  ok(res, { mode, ...row });
}, 'copper_wh');
route('PUT', /^\/api\/copper-inventory\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  db.prepare(`UPDATE copper_inventory SET spec=?, stock=?, unit=?, remark=? WHERE id=?`)
    .run(esc(b.spec), num(b.stock), esc(b.unit) || 'kg', esc(b.remark), +m[1]);
  ok(res, null);
}, 'copper_wh');
route('DELETE', /^\/api\/copper-inventory\/(\d+)$/, async (req, res, m) => {
  db.prepare('DELETE FROM copper_inventory WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'copper_wh');

/* ---- 铜线统计：最高领用量 / 库存量 ---- */
route('GET', /^\/api\/stats\/copper-draw$/, (req, res) => {
  ok(res, db.prepare(`SELECT wire_spec, COUNT(*) c,
      IFNULL(SUM(out_weight),0) out_w, IFNULL(SUM(return_weight),0) ret_w,
      IFNULL(SUM(scrap_weight),0) scrap_w,
      IFNULL(SUM(out_weight - return_weight - scrap_weight),0) used_w
    FROM warehouse_records GROUP BY wire_spec ORDER BY out_w DESC, used_w DESC`).all());
}, 'copper_wh');
route('GET', /^\/api\/stats\/copper-stock$/, (req, res) => {
  ok(res, db.prepare(`SELECT spec, stock, unit, remark, updated_at FROM copper_inventory ORDER BY stock DESC, spec`).all());
}, 'copper_wh');

/* ---- 管理员批量导入（按模板字段 upsert） ---- */
route('POST', /^\/api\/copper-inventory\/import$/, async (req, res) => {
  const b = await readBody(req);
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) return fail(res, '没有可导入的数据');
  const st = db.prepare(`INSERT INTO copper_inventory(spec, stock, unit, remark)
    VALUES(?,?,?,?)
    ON CONFLICT(spec) DO UPDATE SET stock=excluded.stock, unit=excluded.unit, remark=excluded.remark, updated_at=datetime('now','localtime')`);
  for (const r of rows) {
    if (!esc(r.spec)) continue;
    st.run(esc(r.spec), num(r.stock), esc(r.unit) || 'kg', esc(r.remark));
  }
  ok(res, { imported: rows.filter(r => esc(r.spec)).length });
}, 'admin');

/* ---- 铜线入库批次流水（入库记录：按规格/批次/供应商追溯，联动库存累计） ---- */
function logCopperInbound(date, spec, qty, unit, supplier, batchNo, price, remark, who) {
  db.prepare(`INSERT INTO copper_inbound(inbound_date,spec,qty,unit,supplier,batch_no,price,remark,created_by)
    VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(date, esc(spec), qty, esc(unit) || 'kg', esc(supplier), esc(batchNo), parseFloat(price) || 0, esc(remark), who || '');
}
function addCopperStock(spec, qty, unit, remark) {
  db.prepare(`INSERT INTO copper_inventory(spec, stock, unit, remark)
    VALUES(?,?,?,?)
    ON CONFLICT(spec) DO UPDATE SET
      stock = copper_inventory.stock + excluded.stock,
      unit  = CASE WHEN excluded.unit='' OR excluded.unit IS NULL THEN copper_inventory.unit ELSE excluded.unit END,
      remark = CASE WHEN excluded.remark='' OR excluded.remark IS NULL THEN copper_inventory.remark ELSE excluded.remark END,
      updated_at = datetime('now','localtime')`)
    .run(esc(spec), qty, esc(unit) || 'kg', esc(remark));
}
route('GET', /^\/api\/copper-inbound$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('spec')) { conds.push('spec LIKE ?'); args.push('%' + q.get('spec') + '%'); }
  if (q.get('batch_no')) { conds.push('batch_no LIKE ?'); args.push('%' + q.get('batch_no') + '%'); }
  if (q.get('supplier')) { conds.push('supplier LIKE ?'); args.push('%' + q.get('supplier') + '%'); }
  if (q.get('from')) { conds.push('inbound_date>=?'); args.push(q.get('from')); }
  if (q.get('to')) { conds.push('inbound_date<=?'); args.push(q.get('to')); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM copper_inbound${where} ORDER BY inbound_date DESC, id DESC LIMIT 5000`).all(...args));
}, 'copper_wh');
route('POST', /^\/api\/copper-inbound$/, async (req, res, m, user) => {
  const b = await readBody(req);
  if (!esc(b.inbound_date)) return fail(res, '入库日期必填');
  if (!esc(b.spec)) return fail(res, '规格型号必填');
  const q = Math.max(0, parseFloat(b.qty) || 0);
  if (q <= 0) return fail(res, '入库重量需大于 0');
  logCopperInbound(esc(b.inbound_date), b.spec, q, b.unit, b.supplier, b.batch_no, b.price, b.remark, user.name);
  addCopperStock(b.spec, q, b.unit, b.remark);   // 联动铜线库存累计
  ok(res, null);
}, 'copper_wh');
route('PUT', /^\/api\/copper-inbound\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const old = db.prepare('SELECT * FROM copper_inbound WHERE id=?').get(+m[1]);
  const q = Math.max(0, parseFloat(b.qty) || 0);
  db.prepare(`UPDATE copper_inbound SET inbound_date=?,spec=?,qty=?,unit=?,supplier=?,batch_no=?,price=?,remark=? WHERE id=?`)
    .run(esc(b.inbound_date), esc(b.spec), q, esc(b.unit) || 'kg', esc(b.supplier), esc(b.batch_no), parseFloat(b.price) || 0, esc(b.remark), +m[1]);
  if (old) {  // 编辑：先回退旧规格库存，再按新规格累计，保持库存与流水一致
    db.prepare(`UPDATE copper_inventory SET stock = MAX(0, stock - ?) WHERE spec=?`).run(old.qty, esc(old.spec));
    addCopperStock(b.spec, q, b.unit, b.remark);
  }
  ok(res, null);
}, 'copper_wh');
route('DELETE', /^\/api\/copper-inbound\/(\d+)$/, async (req, res, m) => {
  const rec = db.prepare('SELECT * FROM copper_inbound WHERE id=?').get(+m[1]);
  if (rec) db.prepare(`UPDATE copper_inventory SET stock = MAX(0, stock - ?) WHERE spec=?`).run(rec.qty, esc(rec.spec));
  db.prepare('DELETE FROM copper_inbound WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'copper_wh');

route('POST', /^\/api\/tools\/import$/, async (req, res) => {
  const b = await readBody(req);
  const rows = Array.isArray(b.rows) ? b.rows : [];
  if (!rows.length) return fail(res, '没有可导入的数据');
  let created = 0, updated = 0;
  for (const r of rows) {
    if (!esc(r.code) || !esc(r.name)) continue;
    const cat = esc(r.category) || '其他';
    const exist = db.prepare('SELECT id FROM tools WHERE code=?').get(esc(r.code));
    if (exist) {
      db.prepare(`UPDATE tools SET serial_no=?,name=?,model=?,brand=?,category=?,location=?,purchase_date=?,
        life_span=?,supplier=?,price=?,dept=?,qty=?,min_stock=?,maint_cycle=?,last_maint=?,remark=? WHERE id=?`)
        .run(esc(r.serial_no), esc(r.name), esc(r.model), esc(r.brand), cat, esc(r.location), esc(r.purchase_date),
          esc(r.life_span), esc(r.supplier), num(r.price), esc(r.dept),
          Math.max(1, parseInt(r.qty) || 1), parseInt(r.min_stock) || 0, parseInt(r.maint_cycle) || 0,
          esc(r.last_maint), esc(r.remark), exist.id);
      updated++;
    } else {
      db.prepare(`INSERT INTO tools(code,serial_no,name,model,brand,category,location,purchase_date,
        life_span,supplier,price,dept,photo,qty,min_stock,maint_cycle,last_maint,status,remark)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(esc(r.code), esc(r.serial_no), esc(r.name), esc(r.model), esc(r.brand), cat, esc(r.location),
          esc(r.purchase_date), esc(r.life_span), esc(r.supplier), num(r.price), esc(r.dept), '',
          Math.max(1, parseInt(r.qty) || 1), parseInt(r.min_stock) || 0, parseInt(r.maint_cycle) || 0,
          esc(r.last_maint), '在库', esc(r.remark));
      created++;
    }
  }
  ok(res, { created, updated });
}, 'admin');

/* ---- 模块2：工具档案 ---- */
route('GET', /^\/api\/tools$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('kw')) {
    conds.push('(code LIKE ? OR name LIKE ? OR model LIKE ? OR brand LIKE ? OR serial_no LIKE ?)');
    const k = '%' + q.get('kw') + '%'; args.push(k, k, k, k, k);
  }
  if (q.get('category')) { conds.push('category=?'); args.push(q.get('category')); }
  if (q.get('status')) { conds.push('status=?'); args.push(q.get('status')); }
  if (q.get('nophoto')) {
    const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
    return ok(res, db.prepare(`SELECT id,code,serial_no,name,model,brand,category,location,purchase_date,life_span,supplier,price,dept,qty,min_stock,maint_cycle,last_maint,status,remark FROM tools${where} ORDER BY code`).all(...args));
  }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM tools${where} ORDER BY code`).all(...args));
}, 'tools');
route('GET', /^\/api\/tools\/next-code$/, (req, res, m, user, q) => {
  const prefix = esc(q.get('prefix')) || 'GJ';
  const row = db.prepare(`SELECT code FROM tools WHERE code LIKE ? ORDER BY code DESC LIMIT 1`).get(prefix + '-%');
  let n = 1;
  if (row) { const mm = row.code.match(/-(\d+)$/); if (mm) n = parseInt(mm[1]) + 1; }
  ok(res, prefix + '-' + String(n).padStart(3, '0'));
}, 'tools');
route('GET', /^\/api\/tools\/by-code\/(.+)$/, (req, res, m) => {
  const t = db.prepare('SELECT * FROM tools WHERE code=?').get(decodeURIComponent(m[1]));
  if (!t) return fail(res, '未找到该编号的工具', 404);
  ok(res, t);
}, 'tools');
route('POST', /^\/api\/tools$/, async (req, res) => {
  const b = await readBody(req);
  if (!esc(b.code) || !esc(b.name) || !esc(b.category)) return fail(res, '编号/名称/类别必填');
  try {
    db.prepare(`INSERT INTO tools(code,serial_no,name,model,brand,category,location,purchase_date,
      life_span,supplier,price,dept,photo,qty,min_stock,maint_cycle,last_maint,status,remark)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(esc(b.code), esc(b.serial_no), esc(b.name), esc(b.model), esc(b.brand), esc(b.category),
        esc(b.location), esc(b.purchase_date), esc(b.life_span), esc(b.supplier), num(b.price),
        esc(b.dept), String(b.photo || ''), Math.max(1, parseInt(b.qty) || 1), parseInt(b.min_stock) || 0,
        parseInt(b.maint_cycle) || 0, esc(b.last_maint), '在库', esc(b.remark));
    ok(res, null);
  } catch (e) { fail(res, '工具编号已存在'); }
}, 'tools');
route('PUT', /^\/api\/tools\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const old = db.prepare('SELECT * FROM tools WHERE id=?').get(+m[1]);
  if (!old) return fail(res, '工具不存在', 404);
  db.prepare(`UPDATE tools SET serial_no=?,name=?,model=?,brand=?,category=?,location=?,purchase_date=?,
    life_span=?,supplier=?,price=?,dept=?,photo=?,qty=?,min_stock=?,maint_cycle=?,last_maint=?,remark=? WHERE id=?`)
    .run(esc(b.serial_no), esc(b.name), esc(b.model), esc(b.brand), esc(b.category), esc(b.location),
      esc(b.purchase_date), esc(b.life_span), esc(b.supplier), num(b.price), esc(b.dept),
      b.photo !== undefined ? String(b.photo || '') : old.photo,
      Math.max(1, parseInt(b.qty) || 1), parseInt(b.min_stock) || 0,
      parseInt(b.maint_cycle) || 0, esc(b.last_maint), esc(b.remark), +m[1]);
  ok(res, null);
}, 'tools');
route('DELETE', /^\/api\/tools\/(\d+)$/, (req, res, m) => {
  db.prepare('DELETE FROM tools WHERE id=?').run(+m[1]); ok(res, null);
}, 'tools');

/* ---- 借还管理 ---- */
route('GET', /^\/api\/borrows$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('status')) { conds.push('b.status=?'); args.push(q.get('status')); }
  if (q.get('borrower')) { conds.push('b.borrower LIKE ?'); args.push('%' + q.get('borrower') + '%'); }
  if (q.get('tool')) { conds.push('(b.tool_code LIKE ? OR t.name LIKE ?)'); args.push('%' + q.get('tool') + '%', '%' + q.get('tool') + '%'); }
  if (q.get('from')) { conds.push('b.borrow_time>=?'); args.push(q.get('from')); }
  if (q.get('to')) { conds.push('b.borrow_time<=?'); args.push(q.get('to') + ' 23:59'); }
  if (q.get('overdue')) { conds.push(`b.status='借出中' AND b.expect_return!='' AND b.expect_return < datetime('now','localtime')`); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT b.*, t.name tool_name, t.model tool_model FROM borrow_records b
    LEFT JOIN tools t ON t.id=b.tool_id ${where} ORDER BY b.id DESC LIMIT 2000`).all(...args));
}, 'tools');
route('POST', /^\/api\/borrows$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const tool = db.prepare('SELECT * FROM tools WHERE code=?').get(esc(b.tool_code));
  if (!tool) return fail(res, '工具编号不存在：' + esc(b.tool_code));
  if (tool.status === '已报废') return fail(res, '该工具已报废，不能借用');
  if (tool.status === '维修中') return fail(res, '该工具维修中，不能借用');
  if (tool.status === '借出' && tool.qty <= 1) return fail(res, '该工具已被借出');
  if (!esc(b.borrower)) return fail(res, '借用人必填');
  db.prepare(`INSERT INTO borrow_records(tool_id,tool_code,borrower,borrower_dept,borrow_time,expect_return,purpose)
    VALUES(?,?,?,?,?,?,?)`)
    .run(tool.id, tool.code, esc(b.borrower), esc(b.borrower_dept),
      esc(b.borrow_time) || new Date().toLocaleString('sv-SE').slice(0, 16), esc(b.expect_return), esc(b.purpose));
  db.prepare(`UPDATE tools SET status='借出' WHERE id=?`).run(tool.id);
  ok(res, null);
}, 'tools');
route('POST', /^\/api\/borrows\/(\d+)\/return$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const rec = db.prepare('SELECT * FROM borrow_records WHERE id=?').get(+m[1]);
  if (!rec || rec.status !== '借出中') return fail(res, '记录不存在或已归还');
  const state = esc(b.return_state) || '完好';
  db.prepare(`UPDATE borrow_records SET return_time=?,returner=?,return_state=?,status='已归还' WHERE id=?`)
    .run(esc(b.return_time) || new Date().toLocaleString('sv-SE').slice(0, 16), esc(b.returner) || rec.borrower, state, +m[1]);
  const newStatus = state === '完好' ? '在库' : '维修中';
  db.prepare('UPDATE tools SET status=? WHERE id=?').run(newStatus, rec.tool_id);
  if (state !== '完好') {
    db.prepare(`INSERT INTO maintain_records(tool_id,tool_code,mtype,send_date,fault)
      VALUES(?,?,'维修',date('now','localtime'),?)`).run(rec.tool_id, rec.tool_code, '归还时状态：' + state);
  }
  ok(res, null);
}, 'tools');

/* ---- 模块2：小型工具领用表（按领用类型：新领/报废换新/维修调换） ---- */
route('GET', /^\/api\/tool-issues$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('from')) { conds.push('issue_date>=?'); args.push(q.get('from')); }
  if (q.get('to')) { conds.push('issue_date<=?'); args.push(q.get('to')); }
  if (q.get('itype')) { conds.push('itype=?'); args.push(q.get('itype')); }
  if (q.get('issuer')) { conds.push('issuer LIKE ?'); args.push('%' + q.get('issuer') + '%'); }
  if (q.get('tool')) { conds.push('(tool_code LIKE ? OR tool_name LIKE ?)'); args.push('%' + q.get('tool') + '%', '%' + q.get('tool') + '%'); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM tool_issues${where} ORDER BY issue_date DESC, id DESC LIMIT 2000`).all(...args));
}, 'tools');
// 领用后扣减工具档案库存（按工具编号关联；编号为空时按名称精确匹配，避免误扣重复名称）
function decToolStock(code, name, q) {
  if (esc(code)) {
    db.prepare(`UPDATE tools SET qty = MAX(0, qty - ?) WHERE code=?`).run(q, esc(code));
  } else if (esc(name)) {
    const mt = db.prepare('SELECT id FROM tools WHERE name=? AND status!=\'已报废\'').get(esc(name));
    if (mt) db.prepare(`UPDATE tools SET qty = MAX(0, qty - ?) WHERE id=?`).run(q, mt.id);
  }
}
// 领用记录撤销后回补工具档案库存
function addToolStock(code, name, q) {
  if (esc(code)) {
    db.prepare(`UPDATE tools SET qty = qty + ? WHERE code=?`).run(q, esc(code));
  } else if (esc(name)) {
    const mt = db.prepare('SELECT id FROM tools WHERE name=?').get(esc(name));
    if (mt) db.prepare(`UPDATE tools SET qty = qty + ? WHERE id=?`).run(q, mt.id);
  }
}
route('POST', /^\/api\/tool-issues$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const items = Array.isArray(b.items) ? b.items : [b];
  const st = db.prepare(`INSERT INTO tool_issues
    (issue_date,tool_code,tool_name,issuer,dept,itype,qty,purpose,remark,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?)`);
  for (const it of items) {
    if (!esc(it.issue_date) || !esc(it.issuer) || !esc(it.itype)) return fail(res, '领用日期/领用人/领用类型必填');
    const q = Math.max(1, parseInt(it.qty) || 1);
    st.run(esc(it.issue_date), esc(it.tool_code), esc(it.tool_name), esc(it.issuer), esc(it.dept),
      esc(it.itype), q, esc(it.purpose), esc(it.remark), user.name);
    // 领用后自动扣减对应工具档案的库存（数量），库存最低为 0
    decToolStock(it.tool_code, it.tool_name, q);
  }
  ok(res, null);
}, 'tools');
route('PUT', /^\/api\/tool-issues\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const old = db.prepare('SELECT * FROM tool_issues WHERE id=?').get(+m[1]);
  const q = Math.max(1, parseInt(b.qty) || 1);
  db.prepare(`UPDATE tool_issues SET issue_date=?,tool_code=?,tool_name=?,issuer=?,dept=?,itype=?,qty=?,purpose=?,remark=? WHERE id=?`)
    .run(esc(b.issue_date), esc(b.tool_code), esc(b.tool_name), esc(b.issuer), esc(b.dept),
      esc(b.itype), q, esc(b.purpose), esc(b.remark), +m[1]);
  // 编辑领用记录：先回补旧记录数量到库存，再按新数量扣减，保持库存一致
  if (old) addToolStock(old.tool_code, old.tool_name, Math.max(1, parseInt(old.qty) || 1));
  decToolStock(b.tool_code, b.tool_name, q);
  ok(res, null);
}, 'tools');
route('DELETE', /^\/api\/tool-issues\/(\d+)$/, (req, res, m) => {
  const rec = db.prepare('SELECT * FROM tool_issues WHERE id=?').get(+m[1]);
  if (rec) addToolStock(rec.tool_code, rec.tool_name, Math.max(1, parseInt(rec.qty) || 1));
  db.prepare('DELETE FROM tool_issues WHERE id=?').run(+m[1]); ok(res, null);
}, 'tools');

/* ---- 工具入库批次流水（入库记录：按工具/批次/供应商追溯，联动 tools.qty 增加） ---- */
route('GET', /^\/api\/tool-inbound$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('from')) { conds.push('inbound_date>=?'); args.push(q.get('from')); }
  if (q.get('to')) { conds.push('inbound_date<=?'); args.push(q.get('to')); }
  if (q.get('supplier')) { conds.push('supplier LIKE ?'); args.push('%' + q.get('supplier') + '%'); }
  if (q.get('batch_no')) { conds.push('batch_no LIKE ?'); args.push('%' + q.get('batch_no') + '%'); }
  if (q.get('tool')) { conds.push('(tool_code LIKE ? OR tool_name LIKE ?)'); args.push('%' + q.get('tool') + '%', '%' + q.get('tool') + '%'); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM tool_inbound${where} ORDER BY inbound_date DESC, id DESC LIMIT 5000`).all(...args));
}, 'tools');
route('POST', /^\/api\/tool-inbound$/, async (req, res, m, user) => {
  const b = await readBody(req);
  if (!esc(b.inbound_date)) return fail(res, '入库日期必填');
  if (!esc(b.tool_code) && !esc(b.tool_name)) return fail(res, '工具编号或名称必填');
  const q = Math.max(1, parseInt(b.qty) || 1);
  db.prepare(`INSERT INTO tool_inbound(inbound_date,tool_code,tool_name,supplier,batch_no,qty,price,remark,created_by)
    VALUES(?,?,?,?,?,?,?,?,?)`)
    .run(esc(b.inbound_date), esc(b.tool_code), esc(b.tool_name), esc(b.supplier), esc(b.batch_no), q, parseFloat(b.price) || 0, esc(b.remark), user.name);
  addToolStock(b.tool_code, b.tool_name, q);   // 联动工具档案库存 +qty
  ok(res, null);
}, 'tools');
route('PUT', /^\/api\/tool-inbound\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const old = db.prepare('SELECT * FROM tool_inbound WHERE id=?').get(+m[1]);
  const q = Math.max(1, parseInt(b.qty) || 1);
  db.prepare(`UPDATE tool_inbound SET inbound_date=?,tool_code=?,tool_name=?,supplier=?,batch_no=?,qty=?,price=?,remark=? WHERE id=?`)
    .run(esc(b.inbound_date), esc(b.tool_code), esc(b.tool_name), esc(b.supplier), esc(b.batch_no), q, parseFloat(b.price) || 0, esc(b.remark), +m[1]);
  if (old) {  // 编辑：先回退旧库存，再按新数量累计，保持档案库存与流水一致
    decToolStock(old.tool_code, old.tool_name, Math.max(1, parseInt(old.qty) || 1));
    addToolStock(b.tool_code, b.tool_name, q);
  }
  ok(res, null);
}, 'tools');
route('DELETE', /^\/api\/tool-inbound\/(\d+)$/, async (req, res, m) => {
  const rec = db.prepare('SELECT * FROM tool_inbound WHERE id=?').get(+m[1]);
  if (rec) decToolStock(rec.tool_code, rec.tool_name, Math.max(1, parseInt(rec.qty) || 1));
  db.prepare('DELETE FROM tool_inbound WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'tools');

/* ---- 维修保养 ---- */
route('GET', /^\/api\/maintains$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('status')) { conds.push('mr.status=?'); args.push(q.get('status')); }
  if (q.get('tool')) { conds.push('(mr.tool_code LIKE ? OR t.name LIKE ?)'); args.push('%' + q.get('tool') + '%', '%' + q.get('tool') + '%'); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT mr.*, t.name tool_name FROM maintain_records mr
    LEFT JOIN tools t ON t.id=mr.tool_id ${where} ORDER BY mr.id DESC LIMIT 1000`).all(...args));
}, 'tools');
route('POST', /^\/api\/maintains$/, async (req, res) => {
  const b = await readBody(req);
  const tool = db.prepare('SELECT * FROM tools WHERE code=?').get(esc(b.tool_code));
  if (!tool) return fail(res, '工具编号不存在');
  db.prepare(`INSERT INTO maintain_records(tool_id,tool_code,mtype,send_date,fault,cost)
    VALUES(?,?,?,?,?,?)`)
    .run(tool.id, tool.code, esc(b.mtype) || '维修', esc(b.send_date) || new Date().toISOString().slice(0, 10),
      esc(b.fault), num(b.cost));
  if ((esc(b.mtype) || '维修') === '维修') db.prepare(`UPDATE tools SET status='维修中' WHERE id=?`).run(tool.id);
  ok(res, null);
}, 'tools');
route('POST', /^\/api\/maintains\/(\d+)\/finish$/, async (req, res, m) => {
  const b = await readBody(req);
  const rec = db.prepare('SELECT * FROM maintain_records WHERE id=?').get(+m[1]);
  if (!rec) return fail(res, '记录不存在');
  const fd = esc(b.finish_date) || new Date().toISOString().slice(0, 10);
  db.prepare(`UPDATE maintain_records SET finish_date=?,cost=?,status='已完成' WHERE id=?`)
    .run(fd, b.cost !== undefined ? num(b.cost) : rec.cost, +m[1]);
  db.prepare(`UPDATE tools SET status='在库', last_maint=? WHERE id=? AND status!='已报废'`).run(fd, rec.tool_id);
  ok(res, null);
}, 'tools');

/* ---- 报废 ---- */
route('GET', /^\/api\/scraps$/, (req, res) => {
  ok(res, db.prepare('SELECT * FROM scrap_records ORDER BY id DESC LIMIT 1000').all());
}, 'tools');
route('POST', /^\/api\/scraps$/, async (req, res) => {
  const b = await readBody(req);
  const tool = db.prepare('SELECT * FROM tools WHERE code=?').get(esc(b.tool_code));
  if (!tool) return fail(res, '工具编号不存在');
  if (tool.status === '已报废') return fail(res, '该工具已报废');
  db.prepare(`INSERT INTO scrap_records(tool_id,tool_code,tool_name,scrap_date,reason,approver)
    VALUES(?,?,?,?,?,?)`)
    .run(tool.id, tool.code, tool.name, esc(b.scrap_date) || new Date().toISOString().slice(0, 10),
      esc(b.reason), esc(b.approver));
  db.prepare(`UPDATE tools SET status='已报废' WHERE id=?`).run(tool.id);
  ok(res, null);
}, 'tools');

/* ---- 盘点 ---- */
route('GET', /^\/api\/stocktakes$/, (req, res) => {
  const list = db.prepare('SELECT * FROM stocktakes ORDER BY id DESC LIMIT 100').all();
  for (const s of list) {
    const c = db.prepare('SELECT COUNT(*) total, SUM(checked) done FROM stocktake_items WHERE stocktake_id=?').get(s.id);
    s.total = c.total; s.done = c.done || 0;
  }
  ok(res, list);
}, 'tools');
route('POST', /^\/api\/stocktakes$/, async (req, res, m, user) => {
  const b = await readBody(req);
  const r = db.prepare('INSERT INTO stocktakes(title,operator) VALUES(?,?)')
    .run(esc(b.title) || '盘点-' + new Date().toISOString().slice(0, 10), user.name);
  const sid = r.lastInsertRowid;
  const tools = db.prepare(`SELECT id,code,name,status FROM tools WHERE status!='已报废'`).all();
  const st = db.prepare(`INSERT INTO stocktake_items(stocktake_id,tool_id,tool_code,tool_name,expect_status) VALUES(?,?,?,?,?)`);
  for (const t of tools) st.run(sid, t.id, t.code, t.name, t.status);
  ok(res, { id: Number(sid) });
}, 'tools');
route('GET', /^\/api\/stocktakes\/(\d+)$/, (req, res, m) => {
  const s = db.prepare('SELECT * FROM stocktakes WHERE id=?').get(+m[1]);
  if (!s) return fail(res, '盘点单不存在', 404);
  s.items = db.prepare('SELECT * FROM stocktake_items WHERE stocktake_id=? ORDER BY tool_code').all(+m[1]);
  ok(res, s);
}, 'tools');
route('POST', /^\/api\/stocktakes\/(\d+)\/check$/, async (req, res, m) => {
  const b = await readBody(req);
  const item = db.prepare('SELECT * FROM stocktake_items WHERE stocktake_id=? AND tool_code=?')
    .get(+m[1], esc(b.tool_code));
  if (!item) return fail(res, '该工具不在本次盘点清单中（可能为盘盈）');
  db.prepare(`UPDATE stocktake_items SET checked=1,check_time=datetime('now','localtime'),result='正常' WHERE id=?`)
    .run(item.id);
  ok(res, { name: item.tool_name, code: item.tool_code });
}, 'tools');
route('POST', /^\/api\/stocktakes\/(\d+)\/finish$/, (req, res, m) => {
  db.prepare(`UPDATE stocktake_items SET result='盘亏' WHERE stocktake_id=? AND checked=0`).run(+m[1]);
  db.prepare(`UPDATE stocktakes SET status='已完成',finish_time=datetime('now','localtime') WHERE id=?`).run(+m[1]);
  ok(res, null);
}, 'tools');

/* ---- 模块3：物料重量统计（品质部来料重量台账） ---- */
// 同BOM号取最早一条记录重量作为基准；偏差>±3% 标记异常
function computeMwAnomaly(bomNo, weight, excludeId) {
  if (!bomNo) return { baseline: 0, deviation: 0, is_anomaly: 0 };
  const base = db.prepare(`SELECT weight FROM material_weight
    WHERE bom_no=? AND id<>? ORDER BY created_at ASC, id ASC LIMIT 1`)
    .get(esc(bomNo), +excludeId || 0);
  if (!base || base.weight === 0) return { baseline: 0, deviation: 0, is_anomaly: 0 };
  const dev = (weight - base.weight) / base.weight;
  const is_anomaly = Math.abs(dev) > 0.03 ? 1 : 0;
  return { baseline: base.weight, deviation: dev, is_anomaly };
}
route('GET', /^\/api\/material-weight$/, (req, res, m, user, q) => {
  const conds = [], args = [];
  if (q.get('bom_no')) { conds.push('bom_no LIKE ?'); args.push('%' + q.get('bom_no') + '%'); }
  if (q.get('batch_no')) { conds.push('batch_no LIKE ?'); args.push('%' + q.get('batch_no') + '%'); }
  if (q.get('material_name')) { conds.push('material_name LIKE ?'); args.push('%' + q.get('material_name') + '%'); }
  if (q.get('spec')) { conds.push('spec LIKE ?'); args.push('%' + q.get('spec') + '%'); }
  if (q.get('supplier')) { conds.push('supplier LIKE ?'); args.push('%' + q.get('supplier') + '%'); }
  if (q.get('anomaly') === '1') { conds.push('is_anomaly=1'); }
  if (q.get('date_from')) { conds.push('rec_date>=?'); args.push(q.get('date_from')); }
  if (q.get('date_to')) { conds.push('rec_date<=?'); args.push(q.get('date_to')); }
  const where = conds.length ? ' WHERE ' + conds.join(' AND ') : '';
  ok(res, db.prepare(`SELECT * FROM material_weight${where} ORDER BY rec_date DESC, id DESC`).all(...args));
}, 'material_weight');
route('POST', /^\/api\/material-weight$/, async (req, res) => {
  const b = await readBody(req);
  if (!esc(b.rec_date) || !esc(b.bom_no)) return fail(res, '来料日期/BOM号必填');
  const w = num(b.weight);
  const a = computeMwAnomaly(b.bom_no, w, 0);
  db.prepare(`INSERT INTO material_weight(rec_date,bom_no,batch_no,material_name,spec,weight,supplier,remark,is_anomaly,deviation,baseline_weight,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(esc(b.rec_date), esc(b.bom_no), esc(b.batch_no), esc(b.material_name), esc(b.spec), w,
      esc(b.supplier), esc(b.remark), a.is_anomaly, a.deviation, a.baseline, (req.user && req.user.name) || '');
  ok(res, { id: db.prepare('SELECT last_insert_rowid() id').get().id, is_anomaly: a.is_anomaly, deviation: a.deviation });
}, 'material_weight');
route('PUT', /^\/api\/material-weight\/(\d+)$/, async (req, res, m) => {
  const b = await readBody(req);
  const id = +m[1];
  if (!esc(b.rec_date) || !esc(b.bom_no)) return fail(res, '来料日期/BOM号必填');
  const w = num(b.weight);
  const a = computeMwAnomaly(b.bom_no, w, id);
  db.prepare(`UPDATE material_weight SET rec_date=?,bom_no=?,batch_no=?,material_name=?,spec=?,weight=?,supplier=?,remark=?,
    is_anomaly=?,deviation=?,baseline_weight=? WHERE id=?`)
    .run(esc(b.rec_date), esc(b.bom_no), esc(b.batch_no), esc(b.material_name), esc(b.spec), w,
      esc(b.supplier), esc(b.remark), a.is_anomaly, a.deviation, a.baseline, id);
  ok(res, { is_anomaly: a.is_anomaly, deviation: a.deviation });
}, 'material_weight');
route('DELETE', /^\/api\/material-weight\/(\d+)$/, (req, res, m) => {
  db.prepare('DELETE FROM material_weight WHERE id=?').run(+m[1]);
  ok(res, null);
}, 'material_weight');

/* ---- 物料重量统计报表（按供应商 / 按物料） ---- */
route('GET', /^\/api\/stats\/material-weight$/, (req, res, m, user, q) => {
  const group = q.get('group') === 'spec' ? 'spec' : 'supplier';
  const rows = db.prepare(`
    SELECT ${group} AS gkey,
      COUNT(*) cnt,
      IFNULL(SUM(weight),0) total_w,
      IFNULL(AVG(weight),0) avg_w,
      SUM(CASE WHEN is_anomaly=1 THEN 1 ELSE 0 END) anomaly_cnt,
      COUNT(DISTINCT bom_no) bom_cnt
    FROM material_weight
    GROUP BY ${group} ORDER BY total_w DESC, gkey`).all();
  // 按物料分组时，附加该规格涉及的所有「物料名称」（distinct, 拼接）
  if (group === 'spec' && rows.length) {
    const namesStmt = db.prepare(`SELECT DISTINCT material_name FROM material_weight WHERE spec=? AND material_name<>'' ORDER BY material_name`);
    for (const r of rows) r.material_names = namesStmt.all(r.gkey).map(x => x.material_name).join('、');
  }
  ok(res, { group, rows });
}, 'material_weight');

/* ---- 看板与统计 ---- */
route('GET', /^\/api\/dashboard$/, (req, res, m, user) => {
  const mods = ROLE_MODULES[user.role] || [];
  const t = { modules: mods };
  if (mods.includes('tools')) {
    t.total = db.prepare(`SELECT COUNT(*) c FROM tools WHERE status!='已报废'`).get().c;
    t.instock = db.prepare(`SELECT COUNT(*) c FROM tools WHERE status='在库'`).get().c;
    t.borrowed = db.prepare(`SELECT COUNT(*) c FROM tools WHERE status='借出'`).get().c;
    t.repairing = db.prepare(`SELECT COUNT(*) c FROM tools WHERE status='维修中'`).get().c;
    t.scrapped = db.prepare(`SELECT COUNT(*) c FROM tools WHERE status='已报废'`).get().c;
    t.lowStock = db.prepare(`SELECT code,name,qty,min_stock FROM tools WHERE min_stock>0 AND qty<=min_stock AND status!='已报废'`).all();
    t.overdue = db.prepare(`SELECT b.*, tl.name tool_name FROM borrow_records b LEFT JOIN tools tl ON tl.id=b.tool_id
      WHERE b.status='借出中' AND b.expect_return!='' AND b.expect_return < datetime('now','localtime') ORDER BY b.expect_return`).all();
    t.maintDue = db.prepare(`SELECT code,name,maint_cycle,last_maint FROM tools
      WHERE maint_cycle>0 AND status!='已报废' AND (last_maint='' OR date(last_maint, '+'||maint_cycle||' day') <= date('now','localtime'))`).all();
    // 工具库存看板：库存最多的前三物料
    t.topStock = db.prepare(`SELECT code,name,category,qty FROM tools
      WHERE status!='已报废' ORDER BY qty DESC, code LIMIT 3`).all();
    // 库存小于3的前三物料
    t.lowStock3 = db.prepare(`SELECT code,name,category,qty FROM tools
      WHERE status!='已报废' AND qty<3 ORDER BY qty ASC, code LIMIT 3`).all();
    // 领用物料最多的人员前三
    t.topBorrowers = db.prepare(`SELECT borrower, borrower_dept, COUNT(*) c FROM borrow_records
      GROUP BY borrower ORDER BY c DESC, borrower LIMIT 3`).all();
    // 报废最多的人员前三（按报废批准人统计）
    t.topScrappers = db.prepare(`SELECT approver, COUNT(*) c FROM scrap_records
      WHERE approver<>'' GROUP BY approver ORDER BY c DESC, approver LIMIT 3`).all();
    // 最近工具领用（前5条，供看板速览）
    t.recentIssues = db.prepare(`SELECT * FROM tool_issues
      ORDER BY issue_date DESC, id DESC LIMIT 5`).all();
  }
  if (mods.includes('copper')) {
    // 铜线今日汇总
    t.prodToday = db.prepare(`SELECT COUNT(*) c, IFNULL(SUM(actual_weight),0) w, IFNULL(SUM(diff_weight),0) d
      FROM production_records WHERE rec_date=date('now','localtime')`).get();
    // 任务单数量统计（今日 / 累计，按任务单号去重）
    t.taskToday = db.prepare(`SELECT COUNT(DISTINCT task_no) c FROM production_records
      WHERE rec_date=date('now','localtime')`).get().c;
    t.taskTotal = db.prepare(`SELECT COUNT(DISTINCT task_no) c FROM production_records`).get().c;
    // 需修改BOM统计（|差重|>=10g=0.01kg）：今日 / 累计 / 涉及任务单数
    t.bomFixToday = db.prepare(`SELECT COUNT(*) c FROM production_records
      WHERE rec_date=date('now','localtime') AND ABS(diff_weight) >= ?`).get(BOM_DIFF_LIMIT).c;
    t.bomFixTotal = db.prepare(`SELECT COUNT(*) c FROM production_records
      WHERE ABS(diff_weight) >= ?`).get(BOM_DIFF_LIMIT).c;
    t.bomFixTasks = db.prepare(`SELECT COUNT(DISTINCT task_no) c FROM production_records
      WHERE ABS(diff_weight) >= ?`).get(BOM_DIFF_LIMIT).c;
    // 每日任务单数量统计（近14天）
    t.taskDaily = db.prepare(`SELECT rec_date, COUNT(DISTINCT task_no) tasks, COUNT(*) recs,
      SUM(CASE WHEN ABS(diff_weight) >= ? THEN 1 ELSE 0 END) bom_fix
      FROM production_records GROUP BY rec_date ORDER BY rec_date DESC LIMIT 14`).all(BOM_DIFF_LIMIT);
  }
  if (mods.includes('copper_wh')) {
    t.whToday = db.prepare(`SELECT COUNT(*) c, IFNULL(SUM(out_weight),0) o, IFNULL(SUM(return_weight),0) r, IFNULL(SUM(scrap_weight),0) s
      FROM warehouse_records WHERE rec_date=date('now','localtime')`).get();
  }
  if (mods.includes('copper_wh') || mods.includes('copper')) {
    // 铜线库存看板：最高前三 / 最低前三 / 总量
    t.copperInvTop = db.prepare(`SELECT spec, stock, unit FROM copper_inventory ORDER BY stock DESC LIMIT 3`).all();
    t.copperInvBottom = db.prepare(`SELECT spec, stock, unit FROM copper_inventory ORDER BY stock ASC LIMIT 3`).all();
    t.copperInvTotal = db.prepare(`SELECT COUNT(*) c, IFNULL(SUM(stock),0) s FROM copper_inventory`).get();
  }
  if (mods.includes('material_weight')) {
    // 物料重量统计看板：总数 / 异常数 / 涉及BOM / 涉及供应商 / 最近5条
    t.mwTotal = db.prepare('SELECT COUNT(*) c FROM material_weight').get().c;
    t.mwAnomaly = db.prepare('SELECT COUNT(*) c FROM material_weight WHERE is_anomaly=1').get().c;
    t.mwBom = db.prepare('SELECT COUNT(DISTINCT bom_no) c FROM material_weight').get().c;
    t.mwSupplier = db.prepare("SELECT COUNT(DISTINCT supplier) c FROM material_weight WHERE supplier <> ''").get().c;
    t.mwRecent = db.prepare('SELECT * FROM material_weight ORDER BY rec_date DESC, id DESC LIMIT 5').all();
  }
  ok(res, t);
}, 'common');
route('GET', /^\/api\/stats\/personal$/, (req, res) => {
  ok(res, db.prepare(`SELECT borrower, borrower_dept, COUNT(*) cnt,
    GROUP_CONCAT(tool_code || ' ' || IFNULL((SELECT name FROM tools WHERE id=tool_id),''), '、') tools_list
    FROM borrow_records WHERE status='借出中' GROUP BY borrower, borrower_dept ORDER BY cnt DESC`).all());
}, 'tools');
route('GET', /^\/api\/stats\/usage$/, (req, res) => {
  ok(res, db.prepare(`SELECT t.code, t.name, t.category, t.status,
    IFNULL((SELECT COUNT(*) FROM borrow_records b WHERE b.tool_id=t.id),0) borrow_cnt,
    IFNULL((SELECT MAX(borrow_time) FROM borrow_records b WHERE b.tool_id=t.id),'从未借用') last_borrow
    FROM tools t WHERE t.status!='已报废' ORDER BY borrow_cnt DESC`).all());
}, 'tools');
route('GET', /^\/api\/stats\/repair$/, (req, res) => {
  ok(res, db.prepare(`SELECT t.code, t.name, t.category,
    IFNULL((SELECT COUNT(*) FROM maintain_records m WHERE m.tool_id=t.id AND m.mtype='维修'),0) repair_cnt,
    IFNULL((SELECT SUM(cost) FROM maintain_records m WHERE m.tool_id=t.id),0) total_cost,
    t.status FROM tools t
    WHERE (SELECT COUNT(*) FROM maintain_records m WHERE m.tool_id=t.id)>0 OR t.status='已报废'
    ORDER BY repair_cnt DESC`).all());
}, 'tools');

/* ---- 数据备份 ---- */
route('GET', /^\/api\/backup$/, (req, res) => {
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (e) {} // WAL 落盘后再备份，确保数据完整
  const buf = fs.readFileSync(DB_FILE);
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="backup-' + new Date().toISOString().slice(0, 10) + '.db"'
  });
  res.end(buf);
}, 'admin');

/* ---- 备份文件列表（自动/安全备份） ---- */
route('GET', /^\/api\/backups$/, (req, res) => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db')).map(f => {
    const st = fs.statSync(path.join(BACKUP_DIR, f));
    return { name: f, size: st.size, mtime: st.mtime.toISOString() };
  }).sort((a, b) => b.name.localeCompare(a.name));
  ok(res, files);
}, 'admin');

route('GET', /^\/api\/backups\/(.+)\/download$/, (req, res, m) => {
  const name = m[1];
  if (/[^A-Za-z0-9._-]/.test(name)) return fail(res, '非法的备份文件名');
  const fp = path.join(BACKUP_DIR, name);
  if (!fp.startsWith(BACKUP_DIR) || !fs.existsSync(fp)) return fail(res, '文件不存在');
  const buf = fs.readFileSync(fp);
  res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="' + name + '"' });
  res.end(buf);
}, 'admin');

route('DELETE', /^\/api\/backups\/(.+)$/, (req, res, m) => {
  const name = m[1];
  if (/[^A-Za-z0-9._-]/.test(name)) return fail(res, '非法的备份文件名');
  const fp = path.join(BACKUP_DIR, name);
  if (!fp.startsWith(BACKUP_DIR) || !fs.existsSync(fp)) return fail(res, '文件不存在');
  fs.unlinkSync(fp);
  ok(res, { msg: '已删除' });
}, 'admin');

/* ---- 数据恢复（上传 .db 文件，或从已有自动/安全备份恢复） ---- */
route('POST', /^\/api\/restore$/, async (req, res, m, user, sp) => {
  try {
    let buf;
    const name = sp && sp.get('name');
    if (name) {
      if (/[^A-Za-z0-9._-]/.test(name)) return fail(res, '非法的备份文件名');
      const src = path.join(BACKUP_DIR, name);
      if (!src.startsWith(BACKUP_DIR) || !fs.existsSync(src)) return fail(res, '备份文件不存在');
      buf = fs.readFileSync(src);
    } else {
      buf = await readRaw(req, 300 * 1024 * 1024);
    }
    if (buf.length < 16 || buf.toString('latin1', 0, 15) !== 'SQLite format 3')
      return fail(res, '文件不是有效的 SQLite 数据库备份');
    // 恢复前先做一次安全备份，便于回退
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, 'pre-restore-' + ts + '.db'));
      for (const ext of ['-wal', '-shm']) {
        const f = DB_FILE + ext;
        if (fs.existsSync(f)) fs.copyFileSync(f, path.join(BACKUP_DIR, 'pre-restore-' + ts + ext));
      }
    } catch (e) { console.log('安全备份跳过：' + e.message); }
    // 关闭当前连接并替换数据库文件
    try { db.close(); } catch (e) {}
    for (const ext of ['-wal', '-shm']) { const f = DB_FILE + ext; if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) {} }
    fs.writeFileSync(DB_FILE, buf);
    db = new DatabaseSync(DB_FILE);
    db.exec('PRAGMA journal_mode = WAL');
    applyMigrations();
    ok(res, { msg: '数据已恢复，表结构已同步完成' });
  } catch (e) { fail(res, '恢复失败：' + e.message, 500); }
}, 'admin');

/* ============ HTTP 服务 ============ */
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = pathname.match(r.pattern);
        if (!m) continue;
        let user = null;
        if (r.perm) {
          user = getUser(req);
          if (!user) return fail(res, '未登录或会话已过期', 401);
          const mods = ROLE_MODULES[user.role] || [];
          if (!mods.includes(r.perm)) return fail(res, '权限不足：您的账号无权访问该模块', 403);
        }
        return await r.handler(req, res, m, user, url.searchParams);
      }
      return fail(res, '接口不存在', 404);
    }

    // 静态文件
    let fp = pathname === '/' ? '/index.html' : pathname;
    fp = path.join(ROOT, 'public', path.normalize(fp).replace(/^([.][.][\/\\])+/, ''));
    if (!fp.startsWith(path.join(ROOT, 'public'))) return fail(res, 'forbidden', 403);
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) return send(res, 404, 'Not Found', 'text/plain');
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8' });
    fs.createReadStream(fp).pipe(res);
  } catch (e) {
    console.error(e);
    fail(res, '服务器错误：' + e.message, 500);
  }
});
/* ---- 每日 15:00 自动备份到本地 ---- */
function scheduleDailyBackup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const KEEP = 30; // 保留最近 30 份自动备份
  const run = () => {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      const ts = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
      const dest = path.join(BACKUP_DIR, 'auto-' + ts + '.db');
      fs.copyFileSync(DB_FILE, dest);
      for (const ext of ['-wal', '-shm']) { const f = DB_FILE + ext; if (fs.existsSync(f)) try { fs.copyFileSync(f, dest + ext); } catch (e) {} }
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('auto-') && f.endsWith('.db')).sort((a, b) => a.localeCompare(b));
      while (files.length > KEEP) { const old = files.shift(); try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch (e) {} }
      console.log('[自动备份] 已生成：' + dest);
    } catch (e) { console.error('[自动备份] 失败：', e.message); }
  };
  const now = new Date();
  const next = new Date(now); next.setHours(15, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  console.log('[自动备份] 下次执行：' + next.toLocaleString('zh-CN') + '，之后每天 15:00');
  setTimeout(() => { run(); setInterval(run, 24 * 3600 * 1000); }, next - now);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log('  四福车间管理系统已启动');
  console.log('  本机访问: http://localhost:' + PORT);
  console.log('  局域网访问: http://<本机IP>:' + PORT + ' （手机可扫码操作）');
  console.log('  默认账号: admin / admin123');
  console.log('  数据库文件: ' + DB_FILE);
  console.log('  自动备份目录: ' + BACKUP_DIR + '（每天 15:00 自动备份）');
  console.log('==============================================');
  scheduleDailyBackup();
});
