/* ===== 公共前端框架：认证、API、导航、导出、打印 ===== */
const App = {
  token: localStorage.getItem('wb_token') || '',
  user: JSON.parse(localStorage.getItem('wb_user') || 'null'),

  async api(method, url, body) {
    const opt = { method, headers: { 'Content-Type': 'application/json', 'X-Token': this.token } };
    if (body !== undefined) opt.body = JSON.stringify(body);
    const r = await fetch(url, opt);
    const j = await r.json().catch(() => ({ ok: false, msg: '响应解析失败' }));
    if (r.status === 401) { location.href = 'login.html'; throw new Error('未登录'); }
    if (!j.ok) { App.toast(j.msg || '操作失败', 'err'); throw new Error(j.msg); }
    return j.data;
  },
  get(u) { return this.api('GET', u); },
  post(u, b) { return this.api('POST', u, b); },
  put(u, b) { return this.api('PUT', u, b); },
  del(u) { return this.api('DELETE', u); },

  toast(msg, cls) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = cls || ''; t.style.display = 'block';
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.style.display = 'none', 2600);
  },

  requireLogin() {
    if (!this.token || !this.user) { location.href = 'login.html'; return false; }
    return true;
  },
  /* 角色 -> 可见模块：admin=全部；production=生产车间(仅生产对比表)；warehouse=仓库管理员(工具台账+仓库领用表)；quality=品质部(物料重量统计) */
  ROLE_MODULES: {
    admin: ['copper', 'copper_wh', 'tools', 'material_weight', 'admin', 'common'],
    production: ['copper', 'common'],
    warehouse: ['tools', 'copper_wh', 'common'],
    quality: ['material_weight', 'common']
  },
  /* 页面 -> 所属模块 */
  PAGE_MODULE: {
    'index.html': 'common',
    'production.html': 'copper', 'warehouse.html': 'copper_wh',
    'copper_inventory.html': 'copper_wh', 'copper_inbound.html': 'copper_wh',
    'tools.html': 'tools', 'borrow.html': 'tools', 'maintain.html': 'tools',
    'tool_inbound.html': 'tools',
    'stocktake.html': 'tools', 'reports.html': 'tools',
    'material_weight.html': 'material_weight',
    'users.html': 'admin'
  },
  modules() { return (this.user && this.ROLE_MODULES[this.user.role]) || []; },
  hasModule(mod) { return this.modules().includes(mod); },
  canWrite() { return !!this.user; },
  isAdmin() { return this.user && this.user.role === 'admin'; },

  logout() {
    this.post('/api/logout').catch(() => {});
    localStorage.removeItem('wb_token'); localStorage.removeItem('wb_user');
    location.href = 'login.html';
  },

  /* 渲染顶部导航（按角色可见模块过滤 + 页面访问守卫） */
  nav(active) {
    if (!this.requireLogin()) return;
    // 访问守卫：当前页不在本角色可见模块内 -> 跳回总览
    const pageMod = this.PAGE_MODULE[active] || 'common';
    if (!this.hasModule(pageMod)) { location.replace('index.html'); return; }
    const all = [
      ['index.html', '总览看板', 'common'],
      ['production.html', '生产对比表', 'copper'],
      ['warehouse.html', '仓库铜线领用表', 'copper_wh'],
      ['copper_inventory.html', '铜线库存', 'copper_wh'],
      ['copper_inbound.html', '铜线入库记录', 'copper_wh'],
      ['material_weight.html', '物料重量统计', 'material_weight'],
      ['tool_issue.html', '工具领用', 'tools'],
      ['tools.html', '工具档案', 'tools'],
      ['tool_inbound.html', '工具入库记录', 'tools'],
      ['borrow.html', '借用归还', 'tools'],
      ['maintain.html', '维修报废', 'tools'],
      ['stocktake.html', '盘点', 'tools'],
      ['reports.html', '统计报表', 'tools'],
      ['users.html', '用户管理', 'admin'],
    ];
    const items = all.filter(i => this.hasModule(i[2]));
    const roleName = { admin: '系统管理员', production: '生产车间', warehouse: '仓库管理员', quality: '品质部' };
    const bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = `<div class="logo">🏭 四福车间管理系统 <span class="ver-badge" id="appVer" title="版本号">v…</span></div>
      <nav>${items.map(i => `<a href="${i[0]}" class="${i[0] === active ? 'active' : ''}">${i[1]}</a>`).join('')}</nav>
      <div class="user-box">
        <span>${this.user.name}</span><span class="role-tag">${roleName[this.user.role] || this.user.role}</span>
        <button onclick="App.logout()">退出</button>
      </div>`;
    document.body.prepend(bar);
    // 页面底部加 "程序设计：Mr WU" + 版本号
    const foot = document.createElement('div');
    foot.className = 'page-foot';
    foot.innerHTML = `<span>程序设计：<b id="footAuthor">Mr WU</b></span><span>当前版本：<b id="footVer">v…</b></span><span>四福车间管理系统 © ${new Date().getFullYear()}</span>`;
    document.body.appendChild(foot);
    // 无写权限时隐藏 .need-write
    if (!this.canWrite()) {
      const style = document.createElement('style');
      style.textContent = '.need-write{display:none !important}';
      document.head.appendChild(style);
    }
    // 非管理员隐藏 .admin-only（如批量导入/导出按钮）
    if (!this.isAdmin()) {
      const astyle = document.createElement('style');
      astyle.textContent = '.admin-only{display:none !important}';
      document.head.appendChild(astyle);
    }
    // 异步拉取真实版本号并局部刷新
    this.get('/api/version').then(info => {
      const v = info && info.version || '0.0.0';
      const av = (info && info.author) || 'Mr WU';
      const a = document.getElementById('appVer'); if (a) a.textContent = 'v' + v;
      const f = document.getElementById('footVer'); if (f) f.textContent = 'v' + v;
      const fa = document.getElementById('footAuthor'); if (fa) fa.textContent = av;
    }).catch(() => {});
  },

  /* 导出 Excel（xlsx-js-style，带样式：标题/表头底色/边框/合计/签字栏，与打印版式一致）
     opts: { title 大标题, meta 附加说明, totals 合计行数组, sign 签字栏数组,
             numCols 数字列下标(4位小数), colorCols {列下标: v=>'RRGGBB'} } */
  exportExcel(filename, headers, rows, sheetName, opts) {
    opts = opts || {};
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, this.buildSheet(filename, headers, rows, opts), sheetName || 'Sheet1');
    /* 附加工作表：opts.extraSheets = [{ name, headers, rows, opts }] */
    (opts.extraSheets || []).forEach(s => {
      XLSX.utils.book_append_sheet(wb, this.buildSheet(filename, s.headers, s.rows, s.opts || {}), s.name || 'Sheet2');
    });
    XLSX.writeFile(wb, filename + '.xlsx');
    this.toast('已导出 ' + filename + '.xlsx', 'ok');
  },

  /* 构建单张带样式工作表（供 exportExcel 复用） */
  buildSheet(filename, headers, rows, opts) {
    opts = opts || {};
    const nCols = headers.length;
    const title = opts.title || filename;
    const metaTxt = '导出时间：' + new Date().toLocaleString() +
      '　导出人：' + (this.user ? this.user.name : '') + (opts.meta ? '　' + opts.meta : '');

    const aoa = [[title], [metaTxt], headers, ...rows];
    let totalIdx = -1, signIdx = -1;
    if (opts.totals && opts.totals.length) { totalIdx = aoa.length; aoa.push(opts.totals); }
    if (opts.sign && opts.sign.length) {
      signIdx = aoa.length + 1; aoa.push([]);           // 空一行
      const signRow = new Array(nCols).fill('');
      const step = Math.max(1, Math.floor(nCols / opts.sign.length));
      opts.sign.forEach((s, i) => { signRow[Math.min(i * step, nCols - 1)] = s + '＿＿＿＿＿＿'; });
      aoa.push(signRow);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    /* 合并：标题、说明行横跨全表 */
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: nCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: nCols - 1 } }
    ];
    /* 列宽自适应 */
    ws['!cols'] = headers.map((h, i) => ({
      wch: Math.max(String(h).replace(/[^\x00-\xff]/g, 'aa').length + 2,
        ...rows.slice(0, 50).map(r => String(r[i] == null ? '' : r[i]).replace(/[^\x00-\xff]/g, 'aa').length + 2))
    }));
    /* 行高 */
    ws['!rows'] = aoa.map((_, ri) => ri === 0 ? { hpt: 30 } : ri === 1 ? { hpt: 18 } : { hpt: 20 });

    const thin = { style: 'thin', color: { rgb: 'B0B7C3' } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };
    const numCols = opts.numCols || [];
    const colorCols = opts.colorCols || {};
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = 0; C < nCols; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) { if (R === 2 || (R > 2 && R <= (totalIdx >= 0 ? totalIdx : 2 + rows.length))) ws[addr] = { t: 's', v: '' }; else continue; }
        const cell = ws[addr];
        if (R === 0) {            /* 大标题 */
          cell.s = { font: { name: '微软雅黑', sz: 16, bold: true, color: { rgb: '1F3864' } },
                     alignment: { horizontal: 'center', vertical: 'center' } };
        } else if (R === 1) {     /* 说明行 */
          cell.s = { font: { name: '微软雅黑', sz: 9, color: { rgb: '808A99' } },
                     alignment: { horizontal: 'right', vertical: 'center' } };
        } else if (R === 2) {     /* 表头 */
          cell.s = { font: { name: '微软雅黑', sz: 10.5, bold: true, color: { rgb: '1F3864' } },
                     fill: { fgColor: { rgb: 'D9E2F3' } }, border: borderAll,
                     alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        } else if (R === totalIdx) { /* 合计行 */
          cell.s = { font: { name: '微软雅黑', sz: 10.5, bold: true }, fill: { fgColor: { rgb: 'FFF2CC' } },
                     border: borderAll,
                     alignment: { horizontal: numCols.includes(C) ? 'right' : 'center', vertical: 'center' } };
          if (numCols.includes(C) && typeof cell.v === 'number') cell.z = '0.0000';
        } else if (signIdx >= 0 && R >= signIdx) { /* 签字栏 */
          cell.s = { font: { name: '微软雅黑', sz: 10.5 }, alignment: { horizontal: 'left', vertical: 'center' } };
        } else if (R > 2) {       /* 数据行 */
          const st = { font: { name: '微软雅黑', sz: 10 }, border: borderAll,
                       alignment: { horizontal: numCols.includes(C) ? 'right' : 'center', vertical: 'center', wrapText: true } };
          if (R % 2 === 0) st.fill = { fgColor: { rgb: 'F7F9FC' } };  /* 隔行底色 */
          if (numCols.includes(C) && typeof cell.v === 'number') cell.z = '0.0000';
          if (colorCols[C]) {
            const rgb = colorCols[C](cell.v);
            if (rgb) st.font = { name: '微软雅黑', sz: 10, bold: true, color: { rgb } };
          }
          cell.s = st;
        }
      }
    }
    return ws;
  },

  /* 打印：设置打印标题后调用浏览器打印 */
  print(title, meta) {
    let ph = document.querySelector('.print-header');
    if (ph) {
      ph.innerHTML = `<h1>${title}</h1><div class="meta"><span>${meta || ''}</span>
        <span>打印时间：${new Date().toLocaleString()}　打印人：${this.user ? this.user.name : ''}</span></div>`;
    }
    window.print();
  },

  fmt(n, digits) {
    if (n == null || n === '') return '';
    return Number(n).toFixed(digits === undefined ? 4 : digits);
  },
  diffCell(v) {
    const n = Number(v) || 0;
    const cls = n > 0 ? 'pos' : (n < 0 ? 'neg' : '');
    return `<td class="num ${cls}">${n.toFixed(4)}</td>`;
  },
  today() { return new Date().toLocaleDateString('sv-SE'); },
  nowLocal() { return new Date().toLocaleString('sv-SE').slice(0, 16); },
  escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
