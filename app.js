const titleInput = document.getElementById('articleTitle');
const bodyInput = document.getElementById('articleBody');
const preview = document.getElementById('preview');
const charCount = document.getElementById('charCount');
const toast = document.getElementById('toast');
let currentTheme = 'tech';
let toastTimer;

const samples = {
  title: 'AI 正在改变世界：这几个趋势值得关注',
  body: `最近，人工智能技术正在从实验室走向真实业务场景。对普通用户和企业来说，值得关注的不只是模型能力，还有它如何改变工作方式。\n\n## 一、AI 正在从聊天走向执行\n\n过去，我们更多把 AI 当作问答工具。现在，越来越多的产品开始让 AI 帮助用户完成连续任务，例如整理资料、分析文档和生成初步方案。\n\n> 核心观察：真正重要的变化，不只是回答更准确，而是 AI 能否可靠地完成一整段工作流程。\n\n## 二、三个值得关注的方向\n\n- **多模态能力：** AI 可以综合理解文字、图片、音频等信息。\n- **工作流自动化：** 从单次问答转向多个步骤协同执行。\n- **个人化助手：** 工具开始更好地适应用户自己的工作习惯。\n\n## 三、我们应该如何准备？\n\n对个人而言，可以从高频、低风险的任务开始尝试，例如资料归纳、内容草拟和知识整理。对于重要事实，仍然需要核验来源；对于敏感数据，也要谨慎选择使用场景。\n\n**结语：** AI 工具的价值，最终取决于它是否能解决真实问题，并且让人保有判断和控制能力。`
};

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function inlineFormat(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');
  return safe;
}

function renderMarkdown(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let inList = false;
  const closeParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.map(inlineFormat).join('<br>')}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (inList) { out.push('</ul>'); inList = false; }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { closeParagraph(); closeList(); continue; }
    if (/^---+$/.test(trimmed) || /^\*\*\*$/.test(trimmed)) {
      closeParagraph(); closeList(); out.push('<hr>'); continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeParagraph(); closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      closeParagraph(); closeList();
      out.push(`<blockquote>${inlineFormat(quote[1])}</blockquote>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      closeParagraph();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inlineFormat(bullet[1])}</li>`);
      continue;
    }
    closeList();
    paragraph.push(trimmed);
  }
  closeParagraph(); closeList();
  return out.join('\n') || '<p>在这里输入文章内容，右侧将实时呈现排版效果。</p>';
}

function render() {
  const title = titleInput.value.trim() || '请输入文章标题';
  const body = bodyInput.value;
  charCount.textContent = `${body.replace(/\s/g, '').length} 字`;
  preview.className = `wechat-article theme-${currentTheme}`;
  preview.innerHTML = `
    <div class="article-kicker">TECH INSIGHTS <span>·</span> 科技观察</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="article-meta">科技前沿 · 深度观察</div>
    <div class="article-content">${renderMarkdown(body)}</div>
    <div class="article-footer">— END —</div>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function getExportHtml() {
  // Export uses inline styles because the WeChat editor does not import this page's stylesheet.
  const palettes = {
    tech: { kicker:'#2865c7', h1:'#202124', h2:'#25282d', accent:'#3678ff', strong:'#16191f', quoteBg:'#f2f6ff', quoteBorder:'#3678ff', quoteText:'#242a34' },
    minimal: { kicker:'#343434', h1:'#191919', h2:'#222222', accent:'#222222', strong:'#202020', quoteBg:'#f5f5f5', quoteBorder:'#777777', quoteText:'#5c5c5c' },
    warm: { kicker:'#b54c2d', h1:'#3a261e', h2:'#74381f', accent:'#d66b3f', strong:'#b94c2a', quoteBg:'#fff4eb', quoteBorder:'#e58a55', quoteText:'#7d513d' }
  };
  const p = palettes[currentTheme];
  const title = escapeHtml(titleInput.value.trim() || '请输入文章标题');
  const content = renderMarkdown(bodyInput.value)
    .replace(/<p>/g, '<p style="margin:0 0 16px;font-size:15px;line-height:1.95;color:#3d4655;">')
    .replace(/<h2>/g, `<h2 style="font-size:19px;line-height:1.5;margin:28px 0 14px;padding-left:11px;border-left:4px solid ${p.accent};color:${p.h2};font-weight:800;">`)
    .replace(/<h3>/g, `<h3 style="font-size:16px;line-height:1.6;margin:23px 0 11px;color:${p.h2};font-weight:750;">`)
    .replace(/<strong>/g, `<strong style="color:${p.strong};font-weight:750;">`)
    .replace(/<blockquote>/g, `<blockquote style="margin:19px 0;padding:12px 14px;background:${p.quoteBg};border-left:3px solid ${p.quoteBorder};color:${p.quoteText};font-size:14px;line-height:1.85;">`)
    .replace(/<\/blockquote>/g, '</blockquote>')
    .replace(/<ul>/g, '<ul style="padding-left:1.4em;margin:9px 0 17px;font-size:15px;line-height:1.9;color:#3d4655;">')
    .replace(/<li>/g, '<li style="margin:5px 0;padding-left:3px;">')
    .replace(/<hr>/g, '<hr style="border:0;border-top:1px solid #e8edf5;margin:24px 0;">');
  const techStyle = currentTheme === 'tech';
  return `<section style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:#202124;line-height:1.95;word-break:break-word;">
    ${techStyle ? '' : `<p style="font-size:11px;letter-spacing:1.7px;color:${p.kicker};font-weight:700;padding-bottom:14px;border-bottom:1px solid #e8edf5;margin:0 0 20px;">TECH INSIGHTS　·　科技观察</p>`}
    <h1 style="font-size:25px;line-height:1.5;letter-spacing:0;margin:${techStyle ? '0 0 24px' : '20px 0 10px'};font-weight:800;color:${p.h1};">${title}</h1>
    ${techStyle ? '' : '<p style="font-size:11px;color:#8b95a5;padding-bottom:20px;border-bottom:1px solid #edf0f5;margin:0 0 22px;">科技前沿 · 深度观察</p>'}
    ${content}
    <p style="text-align:center;color:#b3bac6;font-size:10px;letter-spacing:3px;margin:30px 0 0;">— END —</p>
  </section>`;
}

titleInput.addEventListener('input', render);
bodyInput.addEventListener('input', render);
document.getElementById('formatBtn').addEventListener('click', () => {
  render();
  document.querySelector('.preview-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('排版已更新，可以预览并复制。');
});
document.getElementById('loadSample').addEventListener('click', () => {
  titleInput.value = samples.title;
  bodyInput.value = samples.body;
  render();
  showToast('已载入示例文章。');
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!titleInput.value && !bodyInput.value) return;
  titleInput.value = '';
  bodyInput.value = '';
  render();
  showToast('内容已清空。');
});
document.querySelectorAll('.theme-option').forEach(button => {
  button.addEventListener('click', () => {
    currentTheme = button.dataset.theme;
    document.querySelectorAll('.theme-option').forEach(el => el.classList.toggle('active', el === button));
    render();
  });
});
document.getElementById('copyRichBtn').addEventListener('click', async () => {
  const html = getExportHtml();
  const plain = `${titleInput.value}\n\n${bodyInput.value}`;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' })
      });
      await navigator.clipboard.write([item]);
      showToast('已复制排版内容！请粘贴到公众号编辑器。');
    } else {
      await copyFallback(html);
      showToast('已复制 HTML 源码。若样式未保留，请使用「复制 HTML」或在 HTTPS 页面重试。');
    }
  } catch (e) {
    try { await copyFallback(html); showToast('浏览器限制了富文本复制，已尝试复制 HTML 源码。'); }
    catch { showToast('复制失败，请使用导出 HTML，再打开文件复制内容。'); }
  }
});
async function copyFallback(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('copy failed');
}
document.getElementById('copyHtmlBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(getExportHtml());
    showToast('HTML 源码已复制。');
  } catch {
    try { await copyFallback(getExportHtml()); showToast('HTML 源码已复制。'); }
    catch { showToast('复制失败，请尝试导出 HTML。'); }
  }
});
document.getElementById('downloadBtn').addEventListener('click', () => {
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(titleInput.value || '公众号文章')}</title></head><body style="max-width:680px;margin:20px auto;padding:0 16px;">${getExportHtml()}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '公众号排版文章.html'; a.click();
  URL.revokeObjectURL(url);
  showToast('HTML 文件已导出。');
});
render();
