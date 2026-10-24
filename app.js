/* 公众号文章美化工具 —— 界面与导出逻辑 */
(function () {
  'use strict';

  const THEMES = window.GZH_THEMES || [];
  const RENDERER = window.GZH_RENDERER;
  const STORAGE_KEY = 'gzh-styler-v2';

  const els = {
    title: document.getElementById('articleTitle'),
    subtitle: document.getElementById('articleSubtitle'),
    author: document.getElementById('articleAuthor'),
    body: document.getElementById('articleBody'),
    preview: document.getElementById('preview'),
    charCount: document.getElementById('charCount'),
    themePicker: document.getElementById('themePicker'),
    previewThemeName: document.getElementById('previewThemeName'),
    toast: document.getElementById('toast'),
    coverToggle: document.getElementById('coverToggle'),
    tocToggle: document.getElementById('tocToggle'),
    ctaToggle: document.getElementById('ctaToggle')
  };

  const state = {
    title: '',
    subtitle: '',
    author: '',
    body: '',
    themeId: THEMES.length ? THEMES[0].id : '',
    options: { cover: true, toc: true, cta: true }
  };

  let toastTimer;

  const sample = {
    title: 'AI 正在从聊天走向==执行==',
    subtitle: '三个值得关注的方向，以及普通人可以做的准备',
    author: '公众号小编',
    body: [
      '最近，人工智能正在从实验室走向真实业务场景。对普通用户和企业来说，值得关注的不只是模型能力，还有它如何改变工作方式。',
      '',
      '> 真正重要的变化，不是回答更准确，而是 AI 能否可靠地完成一整段工作流程。',
      '',
      '## 一、从问答工具到执行助手',
      '',
      '过去，我们更多把 AI 当作**问答工具**。现在，越来越多的产品开始让 AI 帮助用户完成连续任务：整理资料、分析文档、生成初步方案。',
      '',
      '真正拉开差距的，是==能否稳定地完成一整段工作流程==，而不只是单点能力。',
      '',
      '### 三个明显信号',
      '',
      '- **多模态理解：** 同时处理文字、图片、音频等信息。',
      '- **工作流自动化：** 从单次问答转向多步骤协同。',
      '- **个人化助手：** 工具开始适应用户自己的工作习惯。',
      '',
      '## 二、三个值得关注的方向',
      '',
      '| 方向 | 变化 | 对个人的影响 |',
      '| --- | --- | --- |',
      '| 多模态 | 理解图片与语音 | 资料整理更快 |',
      '| 自动化 | 连续执行任务 | 重复劳动减少 |',
      '| 个性化 | 记住使用习惯 | 学习成本降低 |',
      '',
      '> [!TIP] 先从高频、低风险的任务开始尝试，例如资料归纳、内容草拟和知识整理。',
      '',
      '## 三、我们应该如何准备？',
      '',
      '1. 把 AI 用在**高频、低风险**的任务上，先建立手感。',
      '2. 对重要事实保留核验习惯，不把判断权完全交给工具。',
      '3. 对敏感数据保持谨慎，明确哪些内容不能上传。',
      '',
      '如果一定要用一句话总结：++AI 的价值，最终取决于它能否解决真实问题++，并且让人保有判断和控制能力。',
      '',
      '---',
      '',
      '**结语：** 工具会越来越强，但真正稀缺的，仍然是提出好问题的人。'
    ].join('\n')
  };

  /* ---------------------------- 主题选择器 ---------------------------- */

  function buildThemePicker() {
    els.themePicker.innerHTML = '';
    THEMES.forEach((theme) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-option' + (theme.id === state.themeId ? ' active' : '');
      button.dataset.theme = theme.id;
      button.setAttribute('aria-pressed', theme.id === state.themeId ? 'true' : 'false');

      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = 'linear-gradient(135deg,' +
        theme.swatch[0] + ' 0 34%,' + theme.swatch[1] + ' 34% 67%,' + theme.swatch[2] + ' 67% 100%)';

      const text = document.createElement('span');
      text.className = 'theme-text';
      const name = document.createElement('b');
      name.textContent = theme.name;
      const desc = document.createElement('small');
      desc.textContent = theme.desc;
      text.appendChild(name);
      text.appendChild(desc);

      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = '✓';

      button.appendChild(swatch);
      button.appendChild(text);
      button.appendChild(check);
      button.addEventListener('click', () => selectTheme(theme.id));
      els.themePicker.appendChild(button);
    });
  }

  function selectTheme(id) {
    state.themeId = id;
    els.themePicker.querySelectorAll('.theme-option').forEach((button) => {
      const active = button.dataset.theme === id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    render();
    save();
  }

  function themeName() {
    const theme = THEMES.find((item) => item.id === state.themeId);
    return theme ? theme.name : '';
  }

  /* ------------------------------ 渲染 ------------------------------ */

  function articleHtml() {
    return RENDERER.buildArticle({
      title: state.title,
      subtitle: state.subtitle,
      author: state.author,
      body: state.body,
      themeId: state.themeId,
      options: state.options
    });
  }

  function render() {
    els.preview.innerHTML = articleHtml();
    const count = state.body.replace(/\s/g, '').length;
    els.charCount.textContent = count + ' 字';
    if (els.previewThemeName) els.previewThemeName.textContent = themeName();
    updateTocAvailability();
  }

  function updateTocAvailability() {
    const theme = THEMES.find((item) => item.id === state.themeId);
    const available = !theme || theme.hasToc === true;
    const wrapper = els.tocToggle.closest('.switch');
    els.tocToggle.disabled = !available;
    els.tocToggle.checked = available ? state.options.toc : false;
    if (wrapper) wrapper.classList.toggle('is-disabled', !available);
    const label = wrapper ? wrapper.querySelector('.switch-label') : null;
    if (label) label.textContent = available ? '导读目录' : '导读目录（当前主题无）';
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  /* --------------------------- 复制 / 导出 --------------------------- */

  function plainText() {
    const clean = (text) => String(text || '').replace(/\*\*|==|\+\+|~~|`/g, '');
    const parts = [];
    if (state.title) parts.push(clean(state.title));
    if (state.subtitle) parts.push(state.subtitle);
    if (state.author) parts.push(state.author);
    parts.push(clean(state.body));
    return parts.join('\n\n');
  }

  async function copyFallback(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('copy failed');
  }

  async function copyRichFallback(html) {
    const holder = document.createElement('div');
    holder.contentEditable = 'true';
    holder.style.position = 'fixed';
    holder.style.left = '-9999px';
    holder.style.top = '0';
    holder.innerHTML = html;
    document.body.appendChild(holder);

    const range = document.createRange();
    range.selectNodeContents(holder);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const ok = document.execCommand('copy');
    selection.removeAllRanges();
    holder.remove();
    if (!ok) throw new Error('copy failed');
  }

  async function copyRich() {
    const html = articleHtml();
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText()], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        showToast('已复制排版内容，去公众号编辑器粘贴吧。');
        return;
      }
      await copyRichFallback(html);
      showToast('已复制排版内容，去公众号编辑器粘贴吧。');
    } catch (error) {
      try {
        await copyRichFallback(html);
        showToast('已复制排版内容，去公众号编辑器粘贴吧。');
      } catch (fallbackError) {
        showToast('复制失败，请使用「导出 HTML」后手动复制。');
      }
    }
  }

  async function copyHtml() {
    const html = articleHtml();
    try {
      await navigator.clipboard.writeText(html);
      showToast('HTML 源码已复制。');
    } catch (error) {
      try {
        await copyFallback(html);
        showToast('HTML 源码已复制。');
      } catch (fallbackError) {
        showToast('复制失败，请尝试导出 HTML。');
      }
    }
  }

  function download() {
    const blob = new Blob([RENDERER.fullDocument(articleHtml())], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (state.title || '公众号文章').replace(/==/g, '').replace(/[\\/:*?"<>|]/g, '').slice(0, 30);
    link.href = url;
    link.download = safeTitle + ' · ' + themeName() + '.html';
    link.click();
    URL.revokeObjectURL(url);
    showToast('HTML 文件已导出。');
  }

  /* ----------------------------- 存取 ----------------------------- */

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title: state.title,
        subtitle: state.subtitle,
        author: state.author,
        body: state.body,
        themeId: state.themeId,
        options: state.options
      }));
    } catch (error) { /* 忽略隐私模式下的写入失败 */ }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data.body !== 'string') return false;
      state.title = data.title || '';
      state.subtitle = data.subtitle || '';
      state.author = data.author || '';
      state.body = data.body;
      if (THEMES.some((theme) => theme.id === data.themeId)) state.themeId = data.themeId;
      state.options.cover = data.options ? data.options.cover !== false : true;
      state.options.toc = data.options ? data.options.toc !== false : true;
      state.options.cta = data.options ? data.options.cta !== false : true;
      return true;
    } catch (error) {
      return false;
    }
  }

  function syncForm() {
    els.title.value = state.title;
    els.subtitle.value = state.subtitle;
    els.author.value = state.author;
    els.body.value = state.body;
    els.coverToggle.checked = state.options.cover;
    els.tocToggle.checked = state.options.toc;
    els.ctaToggle.checked = state.options.cta;
  }

  /* ----------------------------- 事件 ----------------------------- */

  function watchInput(input, key) {
    input.addEventListener('input', () => {
      state[key] = input.value;
      render();
      save();
    });
  }

  watchInput(els.title, 'title');
  watchInput(els.subtitle, 'subtitle');
  watchInput(els.author, 'author');
  watchInput(els.body, 'body');

  els.coverToggle.addEventListener('change', () => {
    state.options.cover = els.coverToggle.checked;
    render();
    save();
  });

  els.tocToggle.addEventListener('change', () => {
    state.options.toc = els.tocToggle.checked;
    render();
    save();
  });

  els.ctaToggle.addEventListener('change', () => {
    state.options.cta = els.ctaToggle.checked;
    render();
    save();
  });

  document.getElementById('loadSample').addEventListener('click', () => {
    state.title = sample.title;
    state.subtitle = sample.subtitle;
    state.author = sample.author;
    state.body = sample.body;
    syncForm();
    render();
    save();
    showToast('已载入示例文章，试试切换主题。');
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (!state.body && !state.title) return;
    state.title = '';
    state.subtitle = '';
    state.author = '';
    state.body = '';
    syncForm();
    render();
    save();
    showToast('内容已清空。');
  });

  document.getElementById('formatBtn').addEventListener('click', () => {
    render();
    document.querySelector('.preview-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('排版已更新，可以预览并复制。');
  });

  document.getElementById('copyRichBtn').addEventListener('click', copyRich);
  document.getElementById('copyHtmlBtn').addEventListener('click', copyHtml);
  document.getElementById('downloadBtn').addEventListener('click', download);

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      render();
      showToast('排版已更新。');
    }
  });

  /* ----------------------------- 启动 ----------------------------- */

  const restored = restore();
  if (!restored) {
    state.title = sample.title;
    state.subtitle = sample.subtitle;
    state.author = sample.author;
    state.body = sample.body;
  }
  buildThemePicker();
  syncForm();
  render();
})();
