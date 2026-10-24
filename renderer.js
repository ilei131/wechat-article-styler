/*
 * Markdown 解析 + 文章装配。
 * 输出为不含 <html>/<head>/<body> 的纯 <section> 片段，可直接粘贴进微信公众号。
 */
(function (global) {
  'use strict';

  const THEMES = global.GZH_THEMES || [];

  /* ----------------------------- 行内标记 ----------------------------- */

  const INLINE_RE = /(`([^`\n]+)`)|(\*\*([^*\n]+)\*\*)|(==([^=\n]+)==)|(\+\+([^+\n]+)\+\+)|(~~([^~\n]+)~~)|(\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\))|(\*([^*\n]+)\*)/g;

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function leaf(text) {
    return '<span leaf="">' + text + '</span>';
  }

  function textRun(raw) {
    return raw.split('\n').map((part) => part ? leaf(escapeHtml(part)) : '').join('<br>');
  }

  function renderInline(raw, theme) {
    const source = String(raw == null ? '' : raw);
    const styles = theme.inline;
    let html = '';
    let last = 0;
    INLINE_RE.lastIndex = 0;
    let match;
    while ((match = INLINE_RE.exec(source))) {
      if (match.index > last) html += textRun(source.slice(last, match.index));
      if (match[1]) {
        html += '<span style="' + styles.code + '">' + leaf(escapeHtml(match[2])) + '</span>';
      } else if (match[3]) {
        html += '<strong style="' + styles.bold + '">' + leaf(escapeHtml(match[4])) + '</strong>';
      } else if (match[5]) {
        html += '<span style="' + styles.highlight + '">' + leaf(escapeHtml(match[6])) + '</span>';
      } else if (match[7]) {
        html += '<span style="' + styles.underline + '">' + leaf(escapeHtml(match[8])) + '</span>';
      } else if (match[9]) {
        html += '<span style="' + styles.strike + '">' + leaf(escapeHtml(match[10])) + '</span>';
      } else if (match[11]) {
        html += '<span style="' + styles.link + '">' + leaf(escapeHtml(match[12])) + '</span>';
      } else if (match[14]) {
        html += '<em style="' + styles.em + '">' + leaf(escapeHtml(match[15])) + '</em>';
      }
      last = match.index + match[0].length;
    }
    if (last < source.length) html += textRun(source.slice(last));
    return html;
  }

  /* ----------------------------- 块级解析 ----------------------------- */

  function splitRow(line) {
    let text = line.trim();
    if (text.startsWith('|')) text = text.slice(1);
    if (text.endsWith('|')) text = text.slice(0, -1);
    return text.split('|').map((cell) => cell.trim());
  }

  function isTableStart(lines, i) {
    if (i + 1 >= lines.length) return false;
    const head = lines[i];
    const sep = lines[i + 1].trim();
    return head.indexOf('|') !== -1 && sep.indexOf('|') !== -1 && sep.indexOf('-') !== -1 &&
      /^\|?[\s:|-]+\|[\s:|-]*$/.test(sep);
  }

  function parseMarkdown(raw) {
    const lines = String(raw || '').replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (!trimmed) { i += 1; continue; }

      // 围栏代码块
      if (/^```/.test(trimmed)) {
        const lang = trimmed.slice(3).trim();
        const buffer = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          buffer.push(lines[i]);
          i += 1;
        }
        i += 1;
        blocks.push({ type: 'code', lang, code: buffer.join('\n') });
        continue;
      }

      // 表格
      if (isTableStart(lines, i)) {
        const header = splitRow(lines[i]);
        const aligns = splitRow(lines[i + 1]).map((cell) => {
          const left = cell.startsWith(':');
          const right = cell.endsWith(':');
          if (left && right) return 'center';
          if (right) return 'right';
          return 'left';
        });
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') !== -1) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        blocks.push({ type: 'table', header, rows, aligns });
        continue;
      }

      // 分割线
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        blocks.push({ type: 'hr' });
        i += 1;
        continue;
      }

      // 标题
      const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        blocks.push({ type: 'h' + heading[1].length, text: heading[2].trim() });
        i += 1;
        continue;
      }

      // 独立图片
      const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)$/);
      if (image) {
        blocks.push({ type: 'image', alt: image[1], src: image[2] });
        i += 1;
        continue;
      }

      // 引用 / 提示
      if (/^>\s?/.test(trimmed)) {
        const buffer = [];
        let variant = '';
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          let content = lines[i].replace(/^\s*>\s?/, '');
          if (buffer.length === 0) {
            const callout = content.match(/^\[!(TIP|NOTE|WARNING|IMPORTANT)\]\s*(.*)$/i);
            if (callout) {
              variant = callout[1].toUpperCase() === 'WARNING' ? 'WARNING' : 'TIP';
              content = callout[2];
            }
          }
          buffer.push(content.trim());
          i += 1;
        }
        blocks.push({ type: 'quote', text: buffer.join('\n'), variant });
        continue;
      }

      // 无序列表
      if (/^[-*+]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
          i += 1;
        }
        blocks.push({ type: 'ul', items });
        continue;
      }

      // 有序列表
      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
          i += 1;
        }
        blocks.push({ type: 'ol', items });
        continue;
      }

      // 普通段落（连续行合并，行内换行保留）
      const buffer = [trimmed];
      i += 1;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) break;
        if (/^```/.test(next) || /^#{1,4}\s/.test(next) || /^>\s?/.test(next) ||
            /^[-*+]\s+/.test(next) || /^\d+[.)]\s+/.test(next) ||
            /^(-{3,}|\*{3,}|_{3,})$/.test(next) || /^!\[/.test(next) ||
            isTableStart(lines, i)) break;
        buffer.push(next);
        i += 1;
      }
      blocks.push({ type: 'p', text: buffer.join('\n') });
    }

    return blocks;
  }

  /* ----------------------------- 结构拆分 ----------------------------- */

  function splitSections(blocks) {
    const intro = [];
    const sections = [];
    let current = null;
    blocks.forEach((block) => {
      if (block.type === 'h2') {
        current = { title: block.text, blocks: [] };
        sections.push(current);
      } else if (current) {
        current.blocks.push(block);
      } else {
        intro.push(block);
      }
    });
    return { intro, sections };
  }

  /* ----------------------------- 文章装配 ----------------------------- */

  function renderBlock(block, theme, ctx) {
    switch (block.type) {
      case 'p':
        return theme.paragraph(renderInline(block.text, theme));
      case 'h1':
      case 'h3':
        return theme.h3(block.text);
      case 'h4':
        return theme.h4 ? theme.h4(block.text) : theme.h3(block.text);
      case 'quote': {
        const html = renderInline(block.text, theme);
        if (block.variant && theme.tip) return theme.tip(html, block.variant);
        if (block.lead && theme.leadQuote) {
          return theme.leadQuote(html, Object.assign({ quoteText: block.text }, ctx));
        }
        return theme.quote(html);
      }
      case 'ul':
        return theme.list(block.items.map((item) => renderInline(item, theme)), false);
      case 'ol':
        return theme.list(block.items.map((item) => renderInline(item, theme)), true);
      case 'code':
        return theme.code(block);
      case 'image':
        return theme.image(block);
      case 'table':
        return theme.table(block, (text) => renderInline(text, theme));
      case 'hr':
        return theme.divider();
      default:
        return '';
    }
  }

  function buildArticle(state) {
    const theme = THEMES.find((item) => item.id === state.themeId) || THEMES[0];
    if (!theme) return '';

    let blocks = parseMarkdown(state.body || '');
    let title = String(state.title || '').trim();

    // 正文里的一级标题可作为标题兜底
    if (!title && blocks.length && blocks[0].type === 'h1') {
      title = blocks[0].text;
      blocks = blocks.slice(1);
    }
    if (!title) title = '让每一篇文章，都更好读。';

    const { intro, sections } = splitSections(blocks);

    // 标记开头引言（用于大金句卡片）
    let leadUsed = false;
    intro.forEach((block) => {
      if (block.type === 'quote' && !block.variant && !leadUsed) {
        block.lead = true;
        leadUsed = true;
      }
    });

    const ctx = {
      title,
      subtitle: state.subtitle || '',
      author: state.author || '',
      sections: sections.map((item) => item.title),
      tags: theme.tags || [],
      total: sections.length
    };

    let html = '';
    if (!state.options || state.options.cover !== false) {
      html += theme.cover(ctx);
    } else {
      // 隐藏封面时补一点顶部留白，避免正文直接贴边
      html += '<section style="height:16px;font-size:0;line-height:0;overflow:hidden;"><span leaf=""><br></span></section>';
    }

    if (state.options && state.options.toc && sections.length >= 2 && theme.toc) {
      html += theme.toc(sections.map((item, index) => ({ title: item.title, index })));
    }

    if (!blocks.length) {
      html += theme.paragraph(renderInline('在左侧输入正文，这里会实时呈现排版效果。支持 Markdown 标题、引用、列表、代码块、表格与图片。', theme));
    }

    intro.forEach((block) => {
      html += renderBlock(block, theme, ctx);
    });

    sections.forEach((sector, index) => {
      const isConclusion = index === sections.length - 1 &&
        /总结|结语|最后|尾声|写在|收尾|后记|再见/.test(sector.title);
      html += theme.sectionTitle(sector.title, Object.assign({}, ctx, {
        index,
        isLast: isConclusion,
        total: sections.length
      }));
      sector.blocks.forEach((block) => {
        html += renderBlock(block, theme, ctx);
      });
    });

    if (!state.options || state.options.cta !== false) {
      html += theme.footer(ctx);
    }

    return '<section style="' + theme.container + '">' + html + '</section>';
  }

  function fullDocument(articleHtml) {
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>公众号排版文章</title></head>' +
      '<body style="margin:0;padding:0;background:#f3f4f6;">' +
      '<section style="max-width:677px;margin:0 auto;background:#ffffff;">' + articleHtml + '</section>' +
      '</body></html>';
  }

  global.GZH_RENDERER = {
    parseMarkdown,
    renderInline,
    buildArticle,
    fullDocument
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.GZH_RENDERER;
  }
})(typeof window !== 'undefined' ? window : globalThis);
