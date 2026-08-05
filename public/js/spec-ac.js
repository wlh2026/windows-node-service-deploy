/* 模糊选择组件：用于「铜线规格型号」等超长下拉
 * - 支持输入模糊（包含）筛选，如输入 0.57 展示所有含 0.57 的规格
 * - 键盘上下选择 / 回车确认 / Esc 关闭
 * - 保持「只能选不能自定义」：保存前用 SpecAC.isValid 校验
 * 规格数据来自 window.SPECS（由各页面 loadSpecs 赋值）
 */
(function () {
  let sharedList = null;
  let activeInput = null;
  let curIdx = -1;

  function specs() {
    const arr = window.SPECS || [];
    return arr.map(s => (typeof s === 'string' ? s : s.spec));
  }

  function buildList() {
    if (sharedList) return sharedList;
    const list = document.createElement('div');
    list.className = 'spec-ac-list';
    list.style.display = 'none';
    document.body.appendChild(list);
    // 用 mousedown 抢占焦点，避免 input 失焦导致点击失效
    list.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.spec-ac-item');
      if (item && activeInput) { e.preventDefault(); pick(item.getAttribute('data-val')); }
    });
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (sharedList.style.display !== 'none' &&
          !e.target.closest('.spec-ac-input') && !e.target.closest('.spec-ac-list')) {
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

  function filter(q) {
    q = (q || '').trim().toLowerCase();
    const all = specs();
    if (!q) return all.slice(0, 60);          // 无输入展示前 60 条
    const out = all.filter(s => s.toLowerCase().includes(q));
    return out.length ? out : all.slice(0, 60); // 无匹配时回退展示全部
  }

  function highlight(text, q) {
    if (!q) return App.escapeHtml(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
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
    list.style.width = Math.max(r.width, 260) + 'px';
    list.style.zIndex = 100000;
  }

  function render(input, q) {
    const list = buildList();
    const items = filter(q);
    if (!items.length) { list.style.display = 'none'; return; }
    list.innerHTML = items.map(s =>
      `<div class="spec-ac-item" data-val="${App.escapeHtml(s)}">${highlight(s, q)}</div>`
    ).join('');
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

  function pick(val) {
    if (!activeInput) return;
    activeInput.value = val;
    sharedList.style.display = 'none';
    activeInput.dispatchEvent(new Event('change'));
    activeInput.focus();
  }

  function init(input) {
    if (!input || input._specAC) return;
    input._specAC = true;
    input.classList.add('spec-ac-input');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    input.addEventListener('focus', () => { activeInput = input; render(input, input.value); });
    input.addEventListener('input', () => { activeInput = input; render(input, input.value); });
    input.addEventListener('keydown', (e) => {
      const list = sharedList;
      if (!list || list.style.display === 'none') return;
      const items = [...list.querySelectorAll('.spec-ac-item')];
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(curIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(curIdx - 1); }
      else if (e.key === 'Enter') {
        if (curIdx >= 0 && items[curIdx]) { e.preventDefault(); pick(items[curIdx].getAttribute('data-val')); }
      } else if (e.key === 'Escape') { list.style.display = 'none'; }
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { if (sharedList && activeInput === input) sharedList.style.display = 'none'; }, 120);
    });
  }

  // 校验值必须存在于规格库（保持「只能选不能自定义」）
  function isValid(v) {
    v = (v || '').trim();
    if (!v) return false;
    return specs().some(s => s === v);
  }

  window.SpecAC = {
    init, isValid,
    setSpecs: (a) => { window.SPECS = a; }
  };
})();
