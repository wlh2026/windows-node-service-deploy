/* 双向联动模糊选择组件：用于「工具编号 ↔ 工具名称」等成对联动字段
 * - 在「编号」或「名称」任一输入框输入模糊关键字，弹出匹配菜单
 *   匹配规则：编号或名称包含输入串即命中（如输入 DZ 或 电钻 都能命中）
 * - 选中某一项后，编号与名称自动成对带出（双向联动）
 * - 键盘 ↑/↓ 选择、Enter 确认、Esc 关闭
 * 数据源：各页面通过 PairAC.init(codeInput, nameInput, items) 注册，items=[{code,name}]
 */
(function () {
  let sharedList = null;
  let activeInput = null;   // 当前触发下拉的输入框（code 或 name）
  let curIdx = -1;
  const pairs = [];          // [{codeInput, nameInput, items}]

  function findPair(input) {
    return pairs.find(p => p.codeInput === input || p.nameInput === input);
  }

  function buildList() {
    if (sharedList) return sharedList;
    const list = document.createElement('div');
    list.className = 'spec-ac-list';   // 复用已有下拉浮层样式
    list.style.display = 'none';
    document.body.appendChild(list);
    // mousedown 抢焦点，避免 input 失焦导致点击失效
    list.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.spec-ac-item');
      if (item && activeInput) {
        e.preventDefault();
        pick({ code: item.getAttribute('data-code'), name: item.getAttribute('data-name') });
      }
    });
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (sharedList.style.display !== 'none' &&
          !e.target.closest('.pair-ac-input') && !e.target.closest('.spec-ac-list')) {
        sharedList.style.display = 'none';
      }
    });
    // 滚动时重新定位，避免错位
    window.addEventListener('scroll', () => {
      if (sharedList.style.display !== 'none' && activeInput) position(activeInput, sharedList);
    }, true);
    sharedList = list;
    return list;
  }

  function matchItems(query, items) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return items.slice(0, 60);          // 无输入展示前 60 条
    const out = items.filter(it =>
      (it.code || '').toLowerCase().includes(q) ||
      (it.name || '').toLowerCase().includes(q));
    return out.length ? out : items.slice(0, 60); // 无匹配时回退展示全部
  }

  function hl(text, q) {
    text = text || '';
    if (!q) return App.escapeHtml(text);
    const i = (text + '').toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return App.escapeHtml(text);
    return App.escapeHtml(text.slice(0, i)) +
      '<span class="hl">' + App.escapeHtml(text.slice(i, i + q.length)) + '</span>' +
      App.escapeHtml(text.slice(i + q.length));
  }

  function position(input, list) {
    const r = input.getBoundingClientRect();
    list.style.position = 'fixed';
    list.style.left = r.left + 'px';
    list.style.top = (r.bottom + 4) + 'px';
    list.style.minWidth = r.width + 'px';
    list.style.width = Math.max(r.width, 300) + 'px';
    list.style.zIndex = 100000;
  }

  function render(input) {
    const pair = findPair(input);
    if (!pair) return;
    const list = buildList();
    const q = input.value;
    const items = matchItems(q, pair.items);
    if (!items.length) { list.style.display = 'none'; return; }
    list.innerHTML = items.map(it =>
      `<div class="spec-ac-item" data-code="${App.escapeHtml(it.code || '')}" data-name="${App.escapeHtml(it.name || '')}">
         <span class="pac-name">${hl(it.name, q)}</span>
         <span class="pac-code">${hl(it.code, q)}</span>
       </div>`).join('');
    curIdx = -1;
    position(input, list);
    list.style.display = 'block';
  }

  function setActive(idx) {
    const list = sharedList;
    const items = [...list.querySelectorAll('.spec-ac-item')];
    if (!items.length) return;
    if (idx < 0) idx = 0;
    if (idx >= items.length) idx = items.length - 1;
    curIdx = idx;
    items.forEach((it, i) => it.classList.toggle('active', i === idx));
    items[idx].scrollIntoView({ block: 'nearest' });
  }

  function pick(item) {
    const pair = findPair(activeInput);
    if (!pair || !item) return;
    // 只读字段（如工具档案编辑时锁定编号）不被自动覆盖，避免误改主键
    if (!pair.codeInput.readOnly) pair.codeInput.value = item.code || '';
    if (!pair.nameInput.readOnly) pair.nameInput.value = item.name || '';
    sharedList.style.display = 'none';
    if (!pair.codeInput.readOnly) pair.codeInput.dispatchEvent(new Event('change'));
    if (!pair.nameInput.readOnly) pair.nameInput.dispatchEvent(new Event('change'));
    activeInput.focus();
  }

  function init(codeInput, nameInput, items) {
    if (!codeInput || !nameInput) return;
    const pair = { codeInput, nameInput, items: items || [] };
    pairs.push(pair);
    [codeInput, nameInput].forEach(inp => {
      if (inp._pairAC) return;
      inp._pairAC = true;
      inp.classList.add('pair-ac-input');
      inp.setAttribute('autocomplete', 'off');
      inp.setAttribute('spellcheck', 'false');
      inp.addEventListener('focus', () => { activeInput = inp; render(inp); });
      inp.addEventListener('input', () => { activeInput = inp; render(inp); });
      inp.addEventListener('keydown', (e) => {
        const list = sharedList;
        if (!list || list.style.display === 'none') return;
        const items = [...list.querySelectorAll('.spec-ac-item')];
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(curIdx + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(curIdx - 1); }
        else if (e.key === 'Enter') {
          if (curIdx >= 0 && items[curIdx]) {
            e.preventDefault();
            pick({ code: items[curIdx].getAttribute('data-code'), name: items[curIdx].getAttribute('data-name') });
          }
        } else if (e.key === 'Escape') { list.style.display = 'none'; }
      });
      inp.addEventListener('blur', () => {
        setTimeout(() => { if (sharedList && activeInput === inp) sharedList.style.display = 'none'; }, 120);
      });
    });
  }

  // 重新设置某对输入框的数据源（页面刷新工具列表后调用）
  function setItems(codeInput, nameInput, items) {
    const pair = pairs.find(p => p.codeInput === codeInput && p.nameInput === nameInput);
    if (pair) pair.items = items || [];
  }

  window.PairAC = { init, setItems };
})();
