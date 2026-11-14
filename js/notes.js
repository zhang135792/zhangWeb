// zhangWeb 笔记本：多笔记管理 + 颜色面板改文字颜色 + localStorage 持久化
(function () {
  const STORAGE_KEY = 'zhangweb_notes';
  const PRESET_COLORS = [
    '#2c3e50', '#7f8c9b', '#e05d5d', '#e67e22',
    '#f1c40f', '#27ae60', '#4a90d9', '#8e44ad',
  ];

  const listEl = document.getElementById('note-list');
  const titleEl = document.getElementById('note-title');
  const contentEl = document.getElementById('note-content');
  const saveStatusEl = document.getElementById('save-status');
  const colorPanel = document.getElementById('color-panel');
  const customColor = document.getElementById('custom-color');

  let notes = load();
  let activeId = notes.length ? notes[0].id : null;
  let saveTimer = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* 数据损坏时重建 */ }
    return [{
      id: Date.now().toString(36),
      title: '我的第一篇笔记',
      html: '',
      updatedAt: Date.now(),
    }];
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    saveStatusEl.textContent = '已保存 ✓';
  }

  function scheduleSave() {
    saveStatusEl.textContent = '编辑中…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 800);
  }

  function activeNote() {
    return notes.find((n) => n.id === activeId) || null;
  }

  function renderList() {
    listEl.innerHTML = '';
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    sorted.forEach((n) => {
      const div = document.createElement('div');
      div.className = 'note-item' + (n.id === activeId ? ' active' : '');
      div.innerHTML = '<div class="note-title"></div><div class="note-time"></div>';
      div.querySelector('.note-title').textContent = n.title || '无标题';
      div.querySelector('.note-time').textContent = new Date(n.updatedAt).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      div.addEventListener('click', () => switchNote(n.id));
      listEl.appendChild(div);
    });
  }

  function renderEditor() {
    const note = activeNote();
    if (!note) {
      titleEl.value = '';
      contentEl.innerHTML = '';
      return;
    }
    titleEl.value = note.title;
    contentEl.innerHTML = note.html;
    saveStatusEl.textContent = '已保存 ✓';
  }

  function switchNote(id) {
    flushSave();
    activeId = id;
    renderList();
    renderEditor();
  }

  function flushSave() {
    const note = activeNote();
    if (!note) return;
    note.title = titleEl.value;
    note.html = contentEl.innerHTML;
    note.updatedAt = Date.now();
    persist();
    renderList();
  }

  // ---- 颜色面板 ----
  function applyColor(color) {
    contentEl.focus();
    // 恢复编辑区内的选区（点击色块会使焦点离开编辑器）
    const sel = window.getSelection();
    if (sel && sel.rangeCount === 0 && savedRange) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    document.execCommand('foreColor', false, color);
  }

  let savedRange = null;
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && contentEl.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  });

  PRESET_COLORS.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch';
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', () => applyColor(color));
    colorPanel.insertBefore(swatch, customColor);
  });
  customColor.addEventListener('input', () => applyColor(customColor.value));

  // ---- 笔记操作 ----
  document.getElementById('new-note-btn').addEventListener('click', () => {
    flushSave();
    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: '',
      html: '',
      updatedAt: Date.now(),
    };
    notes.push(note);
    activeId = note.id;
    persist();
    renderList();
    renderEditor();
    titleEl.focus();
  });

  document.getElementById('delete-note-btn').addEventListener('click', () => {
    const note = activeNote();
    if (!note) return;
    if (!confirm(`确定删除笔记「${note.title || '无标题'}」吗？`)) return;
    notes = notes.filter((n) => n.id !== activeId);
    if (!notes.length) {
      notes = [{
        id: Date.now().toString(36),
        title: '',
        html: '',
        updatedAt: Date.now(),
      }];
    }
    activeId = notes[0].id;
    persist();
    renderList();
    renderEditor();
  });

  titleEl.addEventListener('input', scheduleSave);
  contentEl.addEventListener('input', scheduleSave);
  window.addEventListener('beforeunload', flushSave);

  renderList();
  renderEditor();
})();
