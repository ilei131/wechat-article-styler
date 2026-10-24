/*
 * 主题组件库（参考 isjiamu/gzh-design-skill 的设计语言重新实现）
 *
 * 所有组件均使用内联样式，输出可直接粘贴进微信公众号编辑器的 HTML 片段。
 * 平台约束：不使用 <style>/<script>/<div>/class/id/position:absolute/float/@media/grid；
 * 文字节点统一用 <span leaf=""> 包裹，装饰性空元素内部放 <br> 占位。
 */
(function (global) {
  'use strict';

  const FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";
  const SERIF = "'Noto Serif SC',Georgia,'Times New Roman',serif";
  const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

  const EMPTY = '<span leaf=""><br></span>';
  const leaf = (text) => '<span leaf="">' + text + '</span>';
  const esc = (text) => String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const attr = esc;
  const p = (style, inner) => '<p style="' + style + '">' + inner + '</p>';
  const section = (style, inner) => '<section style="' + style + '">' + inner + '</section>';

  const plain = (text) => String(text || '').replace(/\*\*|==|\+\+|~~|`/g, '').trim();

  function splitAccent(title) {
    return String(title || '').split(/==([^=]+)==/g);
  }

  function accentTitle(title, style) {
    return splitAccent(title).map((part, i) => {
      if (!part) return '';
      return i % 2 ? '<span style="' + style + '">' + leaf(esc(part)) + '</span>' : leaf(esc(part));
    }).join('');
  }

  function dateLabel() {
    const d = new Date();
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function enTag(title, index) {
    const t = plain(title);
    const rules = [
      [/总结|结语|最后|尾声|写在/, 'SUMMARY'],
      [/教程|指南|步骤|如何|上手|入门/, 'TUTORIAL'],
      [/工具|清单|盘点|推荐|合集/, 'TOOLS'],
      [/分析|观点|思考|本质|为什么|趋势/, 'INSIGHT'],
      [/案例|复盘|实战|拆解/, 'CASE'],
      [/数据|报告|增长|指标/, 'DATA'],
      [/方法|框架|策略|体系/, 'METHOD'],
      [/设计|美学|风格|视觉/, 'DESIGN']
    ];
    for (const [re, tag] of rules) if (re.test(t)) return tag;
    return ['INSIGHT', 'ANALYSIS', 'GUIDE', 'NOTES'][index % 4];
  }

  function tagsFrom(tags) {
    const list = (tags || []).slice(0, 2).filter(Boolean);
    while (list.length < 2) list.push(list.length === 0 ? '深度阅读' : '精选观点');
    return list;
  }

  function authorLine(author) {
    return author ? leaf(esc(author)) : leaf('公众号 · 深度阅读');
  }

  function signText(author) {
    return author
      ? '我是 ' + esc(author) + '，如果这篇内容对你有帮助，欢迎点赞、在看、转发。'
      : '如果这篇内容对你有帮助，欢迎点赞、在看、转发。';
  }

  function codeBlock(block, colors) {
    const lines = String(block.code || '').split('\n');
    const body = lines.map((line) => {
      const indent = (line.match(/^[ \t]*/) || [''])[0].replace(/\t/g, '    ').length;
      const text = line.replace(/^[ \t]*/, '');
      const pad = new Array(indent + 1).join('&nbsp;');
      return '<p style="margin:0;font-family:' + MONO + ';font-size:12px;line-height:1.75;color:' + colors.text + ';white-space:normal;word-break:break-all;">' +
        pad + leaf(esc(text) || '&nbsp;') + '</p>';
    }).join('');
    const lang = block.lang
      ? '<p style="margin:0 0 8px;font-size:9px;letter-spacing:2px;color:' + colors.label + ';font-weight:700;">' + leaf(esc(block.lang.toUpperCase())) + '</p>'
      : '';
    return '<section style="background:' + colors.bg + ';border-radius:10px;padding:14px 16px;margin:0 0 20px;overflow-x:auto;">' + lang + body + '</section>';
  }

  function tableBlock(block, inline, colors) {
    const aligns = block.aligns || [];
    const head = block.header.map((cell, i) =>
      '<th style="padding:9px 10px;border-bottom:2px solid ' + colors.accent + ';background:' + colors.headBg + ';font-size:12px;font-weight:700;color:' + colors.headText + ';text-align:' + (aligns[i] || 'left') + ';white-space:nowrap;">' + inline(cell) + '</th>'
    ).join('');
    const rows = block.rows.map((row) =>
      '<tr>' + row.map((cell, i) =>
        '<td style="padding:9px 10px;border-bottom:1px solid ' + colors.border + ';font-size:12px;line-height:1.7;color:' + colors.text + ';text-align:' + (aligns[i] || 'left') + ';">' + inline(cell) + '</td>'
      ).join('') + '</tr>'
    ).join('');
    return '<section style="margin:0 0 20px;overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;background:#ffffff;min-width:320px;">' +
      '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></section>';
  }

  function imageBlock(block, radius, captionColor) {
    const caption = block.alt
      ? '<p style="text-align:center;font-size:11px;line-height:1.6;color:' + captionColor + ';margin:8px 0 0;">' + leaf(esc(block.alt)) + '</p>'
      : '';
    return '<section style="margin:0 0 20px;text-align:center;">' +
      '<img src="' + attr(block.src) + '" alt="' + attr(block.alt) + '" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:' + radius + ';">' +
      caption + '</section>';
  }

  const themes = [];

  /* ------------------------------------------------------------------ *
   * 1. 摸鱼绿 —— 绿色杂志风
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'moyu-green',
    name: '摸鱼绿',
    hasToc: true,
    desc: '绿色杂志 · 卡片丰富',
    tags: ['教程', '测评', '清单'],
    swatch: ['#059669', '#A7F3D0', '#FDE68A'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#ffffff;font-family:' + FONT + ';color:#374151;line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#059669;font-weight:700;',
      highlight: 'background:#FDE68A;color:#111827;padding:0 4px;border-radius:2px;font-weight:600;',
      underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;',
      code: 'background:#F3F4F6;color:#1F2937;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:600;',
      strike: 'background:#F3F4F6;color:#6B7280;padding:2px 6px;border-radius:4px;font-size:13px;text-decoration:line-through;font-weight:600;',
      em: 'color:#059669;font-style:italic;',
      link: 'color:#059669;border-bottom:1px solid #A7F3D0;'
    },

    cover(ctx) {
      const accent = 'color:#059669;';
      const tags = tagsFrom(ctx.tags);
      return section('margin:8px 0 24px;background:#ffffff;border:1.5px solid rgba(5,150,105,0.16);border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(5,150,105,0.10);', '' +
        section('padding:26px 22px 22px;',
          section('display:flex;align-items:center;gap:8px;margin-bottom:22px;',
            '<span style="width:6px;height:6px;border-radius:50%;background:#059669;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<span style="font-size:10px;font-weight:700;letter-spacing:3px;color:#059669;">' + leaf('WECHAT · 深度阅读') + '</span>' +
            '<section style="flex:1;height:1px;background:rgba(5,150,105,0.18);font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>' +
            '<span style="font-size:10px;font-weight:600;color:#D1D5DB;">' + leaf(dateLabel()) + '</span>'
          ) +
          '<p style="font-size:25px;font-weight:900;color:#111827;margin:0 0 8px;line-height:1.32;letter-spacing:-0.5px;">' + accentTitle(ctx.title, accent) + '</p>' +
          section('width:46px;height:3px;border-radius:2px;background:#059669;margin-bottom:12px;font-size:0;line-height:0;overflow:hidden;', EMPTY) +
          (ctx.subtitle ? '<p style="font-size:13px;color:#9CA3AF;margin:0;line-height:1.7;">' + leaf(esc(ctx.subtitle)) + '</p>' : '') +
          '<p style="font-size:11px;color:#6B7280;margin:14px 0 0;line-height:1.6;">' + authorLine(ctx.author) + '</p>'
        ) +
        section('background:#059669;padding:11px 22px;display:flex;align-items:center;justify-content:space-between;gap:10px;',
          '<p style="font-size:11px;color:rgba(255,255,255,0.92);margin:0;font-weight:600;letter-spacing:0.5px;">' + leaf(tags[0] + ' · ' + tags[1]) + '</p>' +
          '<section style="display:flex;gap:4px;">' +
            '<span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#ffffff;font-weight:600;">' + leaf('深度') + '</span>' +
            '<span style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;font-size:8px;color:#ffffff;font-weight:600;">' + leaf('阅读') + '</span>' +
          '</section>'
        )
      );
    },

    toc(items) {
      const cards = items.slice(0, 3).map((item, i) => {
        const first = i === 0;
        return section('display:inline-block;white-space:normal;vertical-align:top;width:112px;box-sizing:border-box;background:' + (first ? '#059669' : '#F9FAFB') + ';border:1px solid ' + (first ? '#059669' : '#E5E7EB') + ';border-radius:12px;padding:11px;margin-right:8px;text-align:left;',
          '<p style="font-size:9px;font-weight:700;color:' + (first ? 'rgba(255,255,255,0.72)' : '#9CA3AF') + ';letter-spacing:1px;margin:0 0 5px;">' + leaf('PART ' + String(i + 1).padStart(2, '0')) + '</p>' +
          '<p style="font-size:13px;font-weight:800;color:' + (first ? '#ffffff' : '#111827') + ';margin:0 0 3px;line-height:1.45;">' + leaf(esc(plain(item.title))) + '</p>' +
          '<p style="font-size:9px;color:' + (first ? 'rgba(255,255,255,0.72)' : '#9CA3AF') + ';margin:0;letter-spacing:1px;">' + leaf(enTag(item.title, i)) + '</p>'
        );
      }).join('');
      return section('margin:0 0 26px;',
        section('display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;',
          '<p style="font-size:10px;color:#9CA3AF;margin:0;letter-spacing:2px;font-weight:600;">' + leaf('📦 ' + items.length + ' 个看点 · 本文导读') + '</p>' +
          '<p style="font-size:10px;color:#9CA3AF;margin:0;">' + leaf('精选章节') + '</p>'
        ) +
        '<section style="overflow-x:scroll;-webkit-overflow-scrolling:touch;white-space:nowrap;padding-bottom:6px;">' + cards + '</section>'
      );
    },

    sectionTitle(title, ctx) {
      const no = String(ctx.index + 1).padStart(2, '0');
      const num = ctx.isLast ? '///' : no;
      const part = ctx.isLast ? 'LAST' : 'PART';
      return section('margin:' + (ctx.index === 0 ? '14px' : '42px') + ' 0 18px;',
        section('display:flex;align-items:center;gap:14px;margin-bottom:20px;',
          section('text-align:center;flex-shrink:0;',
            '<p style="margin:0;font-size:28px;font-weight:900;color:#059669;line-height:1;letter-spacing:-2px;">' + leaf(num) + '</p>' +
            '<p style="margin:0;font-size:8px;font-weight:700;color:#D1D5DB;letter-spacing:2px;">' + leaf(part) + '</p>'
          ) +
          '<span style="width:1px;height:36px;background:#E5E7EB;flex-shrink:0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
          section('',
            '<p style="margin:0 0 1px;font-size:17px;font-weight:900;color:#111827;letter-spacing:0.3px;line-height:1.45;">' + leaf(esc(plain(title))) + '</p>' +
            '<p style="margin:0;font-size:10px;font-weight:600;color:#9CA3AF;letter-spacing:1.5px;">' + leaf(enTag(title, ctx.index)) + '</p>'
          )
        )
      );
    },

    h3(title) {
      return '<p style="font-size:15px;font-weight:900;color:#111827;margin:26px 0 14px;line-height:1.6;"><span style="background:#FDE68A;padding:1px 5px;border-radius:3px;">' + leaf(esc(plain(title))) + '</span></p>';
    },

    paragraph(html) {
      return '<p style="margin:0 0 16px;font-size:14px;line-height:1.9;text-align:justify;color:#374151;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('background:#ffffff;border:1px dashed #BBF7D0;border-radius:10px;padding:18px 16px;margin:0 0 24px;text-align:center;',
        '<p style="margin:0 0 8px;line-height:1.7;">' +
          '<span style="font-size:15px;color:#059669;font-weight:700;border-bottom:3px solid #FDE68A;padding-bottom:2px;">' + leaf(esc(plain(ctx.quoteText || ''))) + '</span>' +
        '</p>' +
        '<p style="font-size:10px;color:#9CA3AF;margin:0;letter-spacing:2px;">' + leaf('ONE LINE · 核心观点') + '</p>'
      );
    },

    quote(html) {
      return section('background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:13px 15px;margin:0 0 22px;text-align:justify;',
        '<p style="font-size:13px;color:#374151;margin:0;line-height:1.75;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('background:' + (warn ? '#FFFBEB' : '#ECFDF5') + ';border-left:4px solid ' + (warn ? '#F59E0B' : '#059669') + ';border-radius:8px;padding:13px 15px;margin:0 0 22px;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:2px;color:' + (warn ? '#92400E' : '#059669') + ';margin:0 0 6px;">' + leaf(warn ? '⚠ WARNING' : '✦ TIP') + '</p>' +
        '<p style="font-size:13px;color:#374151;margin:0;line-height:1.8;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:9px;margin:0 0 11px;',
            '<span style="flex-shrink:0;width:19px;height:19px;border-radius:50%;background:#059669;color:#ffffff;font-size:10px;font-weight:800;text-align:center;line-height:19px;margin-top:3px;">' + leaf(String(i + 1)) + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#374151;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:9px;margin:0 0 10px;',
            '<span style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:#059669;margin-top:10px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#374151;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#0F172A', text: '#E2E8F0', label: '#6EE7B7' });
    },

    image(block) {
      return imageBlock(block, '10px', '#9CA3AF');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#059669', headBg: '#ECFDF5', headText: '#065F46', border: '#E5E7EB', text: '#374151' });
    },

    divider() {
      return '<section style="height:1px;background:#E5E7EB;margin:28px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('background:#F9FAFB;border:1px solid #E5E7EB;border-radius:16px;padding:26px 20px;text-align:center;margin:28px 0 8px;',
        '<p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 16px;line-height:1.8;">' + leaf(signText(ctx.author)) + '</p>' +
        section('display:flex;justify-content:center;gap:10px;margin-bottom:14px;',
          '<span style="background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;padding:8px 14px;font-size:10px;font-weight:700;color:#4B5563;">' + leaf('👍 点赞') + '</span>' +
          '<span style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:8px 14px;font-size:10px;font-weight:700;color:#059669;">' + leaf('👀 在看') + '</span>' +
          '<span style="background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;padding:8px 14px;font-size:10px;font-weight:700;color:#4B5563;">' + leaf('↗ 转发') + '</span>'
        ) +
        '<p style="font-size:9px;color:#9CA3AF;letter-spacing:2px;margin:0;">' + leaf('THANKS FOR READING') + '</p>'
      );
    }
  });

  /* ------------------------------------------------------------------ *
   * 2. 红白色系 —— 经典编辑风
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'red-white',
    name: '红白色系',
    hasToc: true,
    desc: '经典编辑 · 力量感',
    tags: ['观点', '深度分析', '评论'],
    swatch: ['#DC2626', '#FEE2E2', '#1C1917'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#ffffff;font-family:' + FONT + ';color:#374151;line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#991B1B;font-weight:700;',
      highlight: 'background:#FEE2E2;color:#991B1B;padding:0 4px;border-radius:3px;font-weight:600;',
      underline: 'border-bottom:2px solid #FECACA;font-weight:600;color:#1C1917;',
      code: 'background:#F5F5F4;color:#44403C;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:600;',
      strike: 'background:#F5F5F4;color:#78716C;padding:2px 6px;border-radius:4px;font-size:13px;text-decoration:line-through;',
      em: 'color:#B91C1C;font-style:italic;',
      link: 'color:#DC2626;border-bottom:1px solid #FECACA;'
    },

    cover(ctx) {
      return section('margin:16px 0 26px;padding:4px 0 20px;border-bottom:4px solid #DC2626;',
        '<p style="font-size:10px;font-weight:800;letter-spacing:3px;color:#DC2626;margin:0 0 14px;">' + leaf('RED / WHITE · 观点与深度') + '</p>' +
        '<p style="font-size:30px;font-weight:900;color:#1C1917;margin:0 0 10px;line-height:1.32;letter-spacing:-0.8px;">' + accentTitle(ctx.title, 'color:#DC2626;') + '</p>' +
        (ctx.subtitle ? '<p style="font-size:14px;color:#78716C;margin:0;line-height:1.75;">' + leaf(esc(ctx.subtitle)) + '</p>' : '') +
        section('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px;',
          '<p style="font-size:11px;color:#A8A29E;margin:0;letter-spacing:1px;">' + leaf(dateLabel()) + '</p>' +
          '<p style="font-size:11px;color:#A8A29E;margin:0;letter-spacing:1px;">' + leaf(ctx.author ? esc(ctx.author) : '公众号 · 深度阅读') + '</p>'
        )
      );
    },

    toc(items) {
      const cards = items.slice(0, 3).map((item, i) =>
        section('flex:1;background:#FEF2F2;border:1px solid #FEE2E2;border-radius:10px;padding:15px 10px;' + (i < 2 ? 'margin-right:8px;' : '') + 'text-align:center;',
          '<p style="display:inline-block;background:#DC2626;color:#ffffff;font-size:11px;font-weight:800;padding:2px 9px;border-radius:4px;margin:0 0 8px;">' + leaf(String(i + 1).padStart(2, '0')) + '</p>' +
          '<p style="font-size:12px;font-weight:700;color:#1C1917;margin:0;line-height:1.5;">' + leaf(esc(plain(item.title))) + '</p>'
        )
      ).join('');
      return section('margin:0 0 26px;',
        '<p style="font-size:12px;color:#A8A29E;margin:0 0 12px;letter-spacing:2px;font-weight:700;">' + leaf('📌 本文看点') + '</p>' +
        section('display:flex;justify-content:space-between;', cards)
      );
    },

    sectionTitle(title, ctx) {
      return section('margin:' + (ctx.index === 0 ? '10px' : '44px') + ' 0 20px;',
        section('display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:13px;border-bottom:3px solid #DC2626;',
          section('display:flex;align-items:center;gap:12px;',
            '<span style="display:inline-block;background:#DC2626;color:#ffffff;font-size:18px;font-weight:900;padding:4px 13px;border-radius:6px;line-height:1.3;letter-spacing:-1px;">' + leaf(ctx.isLast ? '∞' : String(ctx.index + 1).padStart(2, '0')) + '</span>' +
            section('',
              '<p style="font-size:9px;color:#DC2626;font-weight:800;letter-spacing:3px;margin:0 0 2px;">' + leaf(ctx.isLast ? 'THE END' : enTag(title, ctx.index)) + '</p>' +
              '<p style="font-size:18px;font-weight:800;color:#1C1917;margin:0;letter-spacing:0.3px;line-height:1.4;">' + leaf(esc(plain(title))) + '</p>'
            )
          )
        )
      );
    },

    h3(title) {
      return '<p style="font-size:15px;font-weight:800;color:#1C1917;margin:28px 0 14px;padding-left:10px;border-left:3px solid #DC2626;line-height:1.5;">' + leaf(esc(plain(title))) + '</p>';
    },

    paragraph(html) {
      return '<p style="margin:0 0 20px;font-size:15px;line-height:1.85;text-align:justify;color:#374151;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('margin:0 0 26px;background:#ffffff;border:1px solid #FEE2E2;border-radius:12px;box-shadow:0 6px 24px rgba(220,38,38,0.10);padding:22px 20px 18px;',
        '<p style="font-size:40px;color:#DC2626;font-weight:900;margin:0;line-height:0.6;">' + leaf('“') + '</p>' +
        '<p style="font-size:16px;font-weight:800;color:#1C1917;margin:14px 0 0;line-height:1.8;padding-left:2px;">' + html + '</p>' +
        '<p style="text-align:right;font-size:11px;color:#A8A29E;margin:10px 0 0;letter-spacing:1px;">' + leaf(ctx.author ? '—— ' + esc(ctx.author) : '—— 核心观点') + '</p>'
      );
    },

    quote(html) {
      return section('margin:0 0 22px;padding:14px 16px;background:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;',
        '<p style="font-size:14px;line-height:1.85;color:#44403C;margin:0;text-align:justify;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('margin:0 0 22px;padding:13px 16px;background:' + (warn ? '#FFFBEB' : '#FEF2F2') + ';border-left:4px solid ' + (warn ? '#F59E0B' : '#DC2626') + ';border-radius:0 8px 8px 0;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:2px;color:' + (warn ? '#92400E' : '#DC2626') + ';margin:0 0 6px;">' + leaf(warn ? '⚠ WARNING' : '◆ NOTE') + '</p>' +
        '<p style="font-size:13px;line-height:1.8;color:#44403C;margin:0;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:9px;margin:0 0 11px;',
            '<span style="flex-shrink:0;width:19px;height:19px;border-radius:50%;background:#DC2626;color:#ffffff;font-size:10px;font-weight:800;text-align:center;line-height:19px;margin-top:3px;">' + leaf(String(i + 1)) + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.85;color:#374151;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:9px;margin:0 0 10px;',
            '<span style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:#DC2626;margin-top:10px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.85;color:#374151;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#1C1917', text: '#F5F5F4', label: '#FCA5A5' });
    },

    image(block) {
      return imageBlock(block, '8px', '#A8A29E');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#DC2626', headBg: '#FEF2F2', headText: '#991B1B', border: '#FEE2E2', text: '#44403C' });
    },

    divider() {
      return '<section style="height:1px;background:#FECACA;margin:28px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('margin:30px 0 8px;padding:24px 20px;background:#FEF2F2;border:1px solid #FEE2E2;border-radius:12px;text-align:center;',
        '<p style="font-size:13px;font-weight:700;color:#1C1917;margin:0 0 14px;line-height:1.8;">' + leaf(signText(ctx.author)) + '</p>' +
        '<p style="font-size:12px;font-weight:800;color:#DC2626;margin:0 0 12px;letter-spacing:2px;">' + leaf('点赞 · 在看 · 转发') + '</p>' +
        '<p style="font-size:9px;color:#A8A29E;letter-spacing:3px;margin:0;">' + leaf('— END —') + '</p>'
      );
    }
  });

  /* ------------------------------------------------------------------ *
   * 3. 石墨极简风 —— 极简克制
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'graphite',
    name: '石墨极简',
    hasToc: true,
    desc: '灰阶理性 · 留白',
    tags: ['设计', '科技评论', '专业观点'],
    swatch: ['#52525B', '#E4E4E7', '#F97316'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#ffffff;font-family:' + FONT + ';color:#52525B;line-height:1.8;letter-spacing:0.3px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#27272A;font-weight:700;',
      highlight: 'background:#F4F4F5;color:#27272A;padding:0 4px;border-radius:2px;font-weight:600;',
      underline: 'border-bottom:2px solid #52525B;font-weight:600;color:#27272A;',
      code: 'background:#F4F4F5;color:#3F3F46;padding:2px 6px;border-radius:4px;font-size:13px;font-weight:500;',
      strike: 'color:#A1A1AA;text-decoration:line-through;',
      em: 'color:#3F3F46;font-style:italic;',
      link: 'color:#3F3F46;border-bottom:1px solid #A1A1AA;'
    },

    cover(ctx) {
      return section('margin:20px 0 30px;padding:6px 0 22px;border-bottom:1px solid #E4E4E7;',
        '<p style="font-size:10px;font-weight:500;letter-spacing:4px;color:#A1A1AA;margin:0 0 16px;">' + leaf('GRAPHITE · 理性与设计') + '</p>' +
        '<p style="font-size:32px;font-weight:800;color:#27272A;margin:0 0 12px;line-height:1.3;letter-spacing:-1px;">' + accentTitle(ctx.title, 'border-bottom:3px solid #E4E4E7;') + '</p>' +
        (ctx.subtitle ? '<p style="font-size:14px;color:#71717A;margin:0;line-height:1.75;">' + leaf(esc(ctx.subtitle)) + '</p>' : '') +
        section('display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:22px;',
          '<p style="font-size:11px;color:#A1A1AA;margin:0;letter-spacing:2px;">' + leaf(dateLabel()) + '</p>' +
          '<p style="font-size:11px;color:#A1A1AA;margin:0;letter-spacing:1px;">' + leaf(ctx.author ? esc(ctx.author) : '深度阅读') + '</p>'
        )
      );
    },

    toc(items) {
      const cards = items.slice(0, 3).map((item, i) =>
        section('flex:1;background:#FAFAFA;border-top:1px solid #E4E4E7;padding:16px 12px 14px;' + (i < 2 ? 'margin-right:8px;' : ''),
          '<p style="font-size:11px;color:#A1A1AA;font-weight:500;margin:0 0 8px;letter-spacing:1px;">' + leaf(String(i + 1).padStart(2, '0')) + '</p>' +
          '<p style="font-size:13px;font-weight:700;color:#27272A;margin:0;line-height:1.55;">' + leaf(esc(plain(item.title))) + '</p>'
        )
      ).join('');
      return section('margin:0 0 36px;',
        '<p style="font-size:10px;color:#A1A1AA;margin:0 0 14px;letter-spacing:3px;">' + leaf('本文看点') + '</p>' +
        section('display:flex;justify-content:space-between;', cards)
      );
    },

    sectionTitle(title, ctx) {
      return section('margin:' + (ctx.index === 0 ? '16px' : '52px') + ' 0 26px;',
        section('padding-bottom:18px;border-bottom:1px solid #E4E4E7;',
          '<p style="font-size:46px;font-weight:900;color:#E4E4E7;margin:0;line-height:1;letter-spacing:-2px;">' + leaf(ctx.isLast ? '∞' : String(ctx.index + 1).padStart(2, '0')) + '</p>' +
          section('margin-top:-2px;',
            '<p style="font-size:9px;color:#A1A1AA;font-weight:500;letter-spacing:3px;margin:0 0 6px;">' + leaf(ctx.isLast ? 'EPILOGUE' : enTag(title, ctx.index)) + '</p>' +
            '<p style="font-size:20px;font-weight:800;color:#27272A;margin:0;letter-spacing:0.3px;line-height:1.45;">' + leaf(esc(plain(title))) + '</p>'
          )
        )
      );
    },

    h3(title) {
      return '<p style="font-size:15px;font-weight:800;color:#27272A;margin:28px 0 14px;padding-left:12px;border-left:3px solid #52525B;line-height:1.5;">' + leaf(esc(plain(title))) + '</p>';
    },

    paragraph(html) {
      return '<p style="margin:0 0 22px;font-size:15px;line-height:1.85;text-align:justify;color:#52525B;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('margin:4px 0 36px;padding:30px 6px 24px;border-top:1px solid #E4E4E7;border-bottom:1px solid #E4E4E7;text-align:center;',
        '<p style="font-size:10px;color:#A1A1AA;letter-spacing:3px;margin:0 0 18px;">' + leaf('QUOTE') + '</p>' +
        '<p style="font-size:18px;font-weight:700;color:#27272A;margin:0;line-height:1.8;letter-spacing:0.3px;">' + html + '</p>' +
        '<p style="font-size:11px;color:#A1A1AA;margin:16px 0 0;letter-spacing:1px;">' + leaf(ctx.author ? '—— ' + esc(ctx.author) : '—— 核心观点') + '</p>'
      );
    },

    quote(html) {
      return section('margin:0 0 24px;padding:16px 18px;background:#FAFAFA;border-left:2px solid #52525B;',
        '<p style="font-size:14px;line-height:1.85;color:#3F3F46;margin:0;text-align:justify;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('margin:0 0 24px;padding:15px 18px;background:#FAFAFA;border-left:2px solid ' + (warn ? '#F97316' : '#52525B') + ';',
        '<p style="font-size:9px;font-weight:700;letter-spacing:3px;color:' + (warn ? '#C2410C' : '#71717A') + ';margin:0 0 7px;">' + leaf(warn ? 'WARNING' : 'NOTE') + '</p>' +
        '<p style="font-size:13px;line-height:1.8;color:#3F3F46;margin:0;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:10px;margin:0 0 12px;',
            '<span style="flex-shrink:0;width:18px;height:18px;border:1px solid #D4D4D8;border-radius:50%;background:#FAFAFA;color:#3F3F46;font-size:10px;font-weight:700;text-align:center;line-height:18px;margin-top:3px;">' + leaf(String(i + 1)) + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.85;color:#52525B;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:10px;margin:0 0 11px;',
            '<span style="flex-shrink:0;width:5px;height:5px;background:#52525B;margin-top:10px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.85;color:#52525B;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#18181B', text: '#E4E4E7', label: '#A1A1AA' });
    },

    image(block) {
      return imageBlock(block, '4px', '#A1A1AA');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#52525B', headBg: '#FAFAFA', headText: '#27272A', border: '#E4E4E7', text: '#52525B' });
    },

    divider() {
      return '<section style="height:1px;background:#E4E4E7;margin:32px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('margin:34px 0 8px;padding:26px 6px 8px;border-top:1px solid #E4E4E7;text-align:center;',
        '<p style="font-size:13px;color:#3F3F46;margin:0 0 12px;line-height:1.85;">' + leaf(signText(ctx.author)) + '</p>' +
        '<p style="font-size:10px;color:#A1A1AA;margin:0 0 16px;letter-spacing:3px;">' + leaf('点赞 · 在看 · 转发') + '</p>' +
        '<p style="font-size:9px;color:#D4D4D8;letter-spacing:4px;margin:0;">' + leaf('END') + '</p>'
      );
    }
  });

  /* ------------------------------------------------------------------ *
   * 4. 留白禅意风
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'zen',
    name: '留白禅意',
    hasToc: true,
    desc: '衬线书卷 · 呼吸感',
    tags: ['随笔', '禅意', '深度'],
    swatch: ['#4A5D52', '#E8E8E8', '#B5C8BC'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#ffffff;font-family:' + FONT + ';color:#525252;line-height:1.9;letter-spacing:0.3px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#2B2B2B;font-weight:700;',
      highlight: 'background:#D6E4DC;color:#2B2B2B;padding:0 4px;border-radius:2px;',
      underline: 'border-bottom:1.5px solid #B5C8BC;font-weight:600;color:#2B2B2B;',
      code: 'background:#F5F5F4;color:#4A5D52;padding:2px 6px;border-radius:3px;font-size:13px;',
      strike: 'color:#A3A3A3;text-decoration:line-through;',
      em: 'color:#4A5D52;font-family:' + SERIF + ';font-style:italic;',
      link: 'color:#4A5D52;border-bottom:1px solid #B5C8BC;'
    },

    cover(ctx) {
      return section('margin:32px 0 40px;padding:34px 6px;border-top:1px solid #E8E8E8;border-bottom:1px solid #E8E8E8;text-align:center;',
        '<p style="font-size:9px;letter-spacing:4px;color:#4A5D52;margin:0 0 18px;font-weight:600;">' + leaf('ZEN · 慢 慢 读') + '</p>' +
        '<p style="font-family:' + SERIF + ';font-size:28px;font-weight:600;color:#2B2B2B;margin:0 0 14px;line-height:1.55;letter-spacing:0.5px;">' + accentTitle(ctx.title, 'border-bottom:2px solid #B5C8BC;') + '</p>' +
        (ctx.subtitle ? '<p style="font-size:13px;color:#A3A3A3;margin:0;line-height:1.8;letter-spacing:0.5px;">' + leaf(esc(ctx.subtitle)) + '</p>' : '') +
        '<p style="font-size:11px;color:#A3A3A3;margin:18px 0 0;letter-spacing:2px;">' + leaf((ctx.author ? esc(ctx.author) + ' · ' : '') + dateLabel()) + '</p>'
      );
    },

    toc(items) {
      const cards = items.slice(0, 3).map((item, i) =>
        section('flex:1;padding:16px 12px 16px 0;border-bottom:1px solid #E8E8E8;' + (i < 2 ? 'border-right:1px solid #E8E8E8;margin-right:14px;' : ''),
          '<p style="font-size:10px;color:#4A5D52;font-weight:600;margin:0 0 6px;letter-spacing:1px;">' + leaf(String(i + 1).padStart(2, '0')) + '</p>' +
          '<p style="font-size:13px;color:#2B2B2B;margin:0;font-weight:500;line-height:1.6;">' + leaf(esc(plain(item.title))) + '</p>'
        )
      ).join('');
      return section('margin:0 0 40px;',
        '<p style="font-size:10px;color:#A3A3A3;margin:0 0 18px;letter-spacing:3px;">' + leaf('本文脉络') + '</p>' +
        section('border-top:1px solid #E8E8E8;display:flex;', cards)
      );
    },

    sectionTitle(title, ctx) {
      return section('margin:' + (ctx.index === 0 ? '24px' : '58px') + ' 0 26px;',
        '<p style="font-size:10px;color:#4A5D52;font-weight:600;letter-spacing:4px;margin:0 0 10px;">' + leaf((ctx.isLast ? '∞ · POSTSCRIPT' : String(ctx.index + 1).padStart(2, '0') + ' · ' + enTag(title, ctx.index))) + '</p>' +
        '<p style="font-family:' + SERIF + ';font-size:22px;font-weight:700;color:#2B2B2B;margin:0 0 16px;letter-spacing:0.5px;line-height:1.5;">' + leaf(esc(plain(title))) + '</p>' +
        section('width:40px;height:2px;background:#4A5D52;font-size:0;line-height:0;overflow:hidden;', EMPTY)
      );
    },

    h3(title) {
      return '<p style="font-family:' + SERIF + ';font-size:18px;font-weight:700;color:#2B2B2B;margin:30px 0 14px;padding-left:12px;border-left:2px solid #B5C8BC;line-height:1.6;">' + leaf(esc(plain(title))) + '</p>';
    },

    paragraph(html) {
      return '<p style="margin:0 0 24px;font-size:15px;line-height:1.95;text-align:justify;color:#525252;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('margin:10px 0 44px;padding:34px 10px 26px;border-top:1px solid #E8E8E8;border-bottom:1px solid #E8E8E8;text-align:center;',
        '<p style="font-family:' + SERIF + ';font-size:18px;font-weight:600;color:#2B2B2B;margin:0 0 20px;line-height:1.95;letter-spacing:0.6px;">' + html + '</p>' +
        '<p style="font-size:11px;color:#A3A3A3;margin:0;letter-spacing:2px;">' + leaf(ctx.author ? '—— ' + esc(ctx.author) : '—— 核心观点') + '</p>'
      );
    },

    quote(html) {
      return section('margin:0 0 26px;padding:4px 0 4px 18px;border-left:1px solid #B5C8BC;',
        '<p style="font-family:' + SERIF + ';font-size:15px;line-height:1.95;color:#525252;margin:0;text-align:justify;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('margin:0 0 26px;padding:16px 18px;background:#FAFAFA;border-left:2px solid ' + (warn ? '#C2410C' : '#B5C8BC') + ';',
        '<p style="font-size:9px;color:' + (warn ? '#C2410C' : '#4A5D52') + ';letter-spacing:3px;margin:0 0 8px;font-weight:600;">' + leaf(warn ? 'NOTE' : 'TIP') + '</p>' +
        '<p style="font-size:14px;line-height:1.9;color:#525252;margin:0;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:12px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid #F2F2F2;',
            '<span style="flex-shrink:0;font-family:' + SERIF + ';font-size:12px;color:#4A5D52;font-weight:600;margin-top:3px;min-width:16px;">' + leaf(String(i + 1).padStart(2, '0')) + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.9;color:#525252;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:10px;margin:0 0 12px;',
            '<span style="flex-shrink:0;width:4px;height:4px;border-radius:50%;background:#B5C8BC;margin-top:11px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:15px;line-height:1.9;color:#525252;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#2B2B2B', text: '#F5F5F4', label: '#B5C8BC' });
    },

    image(block) {
      return imageBlock(block, '2px', '#A3A3A3');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#4A5D52', headBg: '#F7F9F8', headText: '#2B2B2B', border: '#E8E8E8', text: '#525252' });
    },

    divider() {
      return '<section style="height:1px;background:#E8E8E8;margin:40px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('margin:46px 0 8px;padding:32px 6px 8px;border-top:1px solid #E8E8E8;text-align:center;',
        '<p style="font-size:13px;color:#525252;margin:0 0 14px;line-height:2;letter-spacing:0.5px;">' + leaf(signText(ctx.author)) + '</p>' +
        '<p style="font-size:10px;color:#A3A3A3;letter-spacing:3px;margin:0 0 18px;">' + leaf('点赞 · 在看 · 转发') + '</p>' +
        '<p style="font-size:9px;color:#C7C7C7;letter-spacing:5px;margin:0;">' + leaf('END') + '</p>'
      );
    }
  });

  /* ------------------------------------------------------------------ *
   * 5. 摸鱼票据风
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'ticket',
    name: '摸鱼票据',
    desc: '票据隐喻 · 硬阴影',
    tags: ['测评', '工具对比', '创意'],
    swatch: ['#059669', '#fffef8', '#1a1a1a'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#ffffff;font-family:' + FONT + ';color:#555555;line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#059669;font-weight:800;',
      highlight: 'background:#D1FAE5;color:#065F46;padding:0 4px;font-weight:700;',
      underline: 'border-bottom:2px solid #A7F3D0;font-weight:600;color:#1a1a1a;',
      code: 'background:#F3F4F6;color:#1F2937;padding:2px 6px;border:1px solid #E5E7EB;font-size:13px;font-weight:600;',
      strike: 'color:#9CA3AF;text-decoration:line-through;',
      em: 'color:#059669;font-style:italic;',
      link: 'color:#059669;border-bottom:1px solid #A7F3D0;'
    },

    cover(ctx) {
      const tags = tagsFrom(ctx.tags);
      return section('background:#fffef8;border:2px solid #1a1a1a;box-shadow:5px 5px 0 #1a1a1a;margin:8px 0 30px;',
        section('background:#059669;padding:11px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;',
          '<p style="color:#fffef8;font-size:10px;letter-spacing:4px;font-weight:600;margin:0;">' + leaf('WECHAT · 本期精选') + '</p>' +
          '<p style="color:#fffef8;font-size:10px;letter-spacing:2px;margin:0;">' + leaf('★★★★★') + '</p>'
        ) +
        section('display:flex;',
          section('flex:1;padding:22px 18px;border-right:2px dashed #A7F3D0;min-width:0;',
            '<p style="font-size:23px;font-weight:900;color:#1a1a1a;letter-spacing:0.5px;margin:0 0 4px;line-height:1.35;text-shadow:0.5px 0 0 #1a1a1a;">' + accentTitle(ctx.title, 'color:#059669;') + '</p>' +
            (ctx.subtitle ? '<p style="font-size:13px;color:#666666;letter-spacing:0.5px;margin:0 0 18px;line-height:1.7;">' + leaf(esc(ctx.subtitle)) + '</p>' : '<section style="height:14px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>') +
            section('border-top:1px dashed #A7F3D0;margin-bottom:14px;font-size:0;line-height:0;overflow:hidden;', EMPTY) +
            '<p style="font-size:12px;color:#1a1a1a;font-weight:700;margin:0 0 2px;">' + leaf(ctx.author ? esc(ctx.author) : '公众号 · 深度测评') + '</p>' +
            '<p style="font-size:10px;color:#888888;margin:0 0 14px;">' + leaf(dateLabel() + ' · 阅读凭证') + '</p>' +
            section('display:flex;gap:6px;flex-wrap:wrap;',
              '<span style="font-size:9px;color:#059669;border:1px solid #059669;padding:3px 8px;">' + leaf('#' + tags[0]) + '</span>' +
              '<span style="font-size:9px;color:#059669;border:1px solid #059669;padding:3px 8px;">' + leaf('#' + tags[1]) + '</span>'
            )
          ) +
          section('width:48px;padding:14px 4px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;background:#F0FDF4;flex-shrink:0;',
            section('text-align:center;',
              '<p style="font-size:7px;color:#999999;letter-spacing:1px;margin:0;">' + leaf('NO.') + '</p>' +
              '<p style="font-size:17px;font-weight:900;color:#059669;margin:0;">' + leaf('001') + '</p>'
            ) +
            '<p style="writing-mode:vertical-rl;font-size:9px;color:#888888;letter-spacing:2px;margin:0;">' + leaf('深度测评') + '</p>' +
            section('text-align:center;',
              '<p style="font-size:7px;color:#999999;letter-spacing:1px;margin:0;">' + leaf('GRADE') + '</p>' +
              '<p style="font-size:14px;font-weight:900;color:#059669;margin:0;">' + leaf('S') + '</p>'
            )
          )
        ) +
        section('display:flex;align-items:center;padding:0 8px;',
          section('flex:1;border-top:2px dashed #A7F3D0;font-size:0;line-height:0;overflow:hidden;', EMPTY) +
          '<span style="padding:0 8px;font-size:10px;color:#A7F3D0;line-height:1;">' + leaf('✂') + '</span>' +
          section('flex:1;border-top:2px dashed #A7F3D0;font-size:0;line-height:0;overflow:hidden;', EMPTY)
        ) +
        section('padding:9px 18px;display:flex;justify-content:space-between;align-items:center;gap:8px;',
          '<p style="font-size:9px;color:#999999;letter-spacing:1px;margin:0;">' + leaf('VALID FOR ONE READ') + '</p>' +
          '<p style="font-size:9px;color:#999999;letter-spacing:1px;margin:0;">' + leaf('ADMIT ONE 🎫') + '</p>'
        )
      );
    },

    toc() {
      return '';
    },

    sectionTitle(title, ctx) {
      return section('margin:' + (ctx.index === 0 ? '12px' : '38px') + ' 0 20px;',
        section('display:flex;align-items:center;gap:10px;padding-bottom:11px;border-bottom:2px solid #1a1a1a;',
          '<span style="background:#059669;color:#ffffff;font-size:11px;font-weight:800;padding:5px 10px;letter-spacing:2px;flex-shrink:0;">' + leaf(ctx.isLast ? 'END' : String(ctx.index + 1).padStart(2, '0')) + '</span>' +
          '<p style="font-size:17px;font-weight:800;color:#1a1a1a;letter-spacing:0.5px;margin:0;line-height:1.45;flex:1;min-width:0;">' + leaf(esc(plain(title))) + '</p>' +
          '<p style="font-size:10px;color:#888888;margin:0;letter-spacing:1px;flex-shrink:0;">' + leaf('/ ' + enTag(title, ctx.index)) + '</p>'
        )
      );
    },

    h3(title) {
      return '<section style="display:flex;align-items:center;gap:8px;margin:26px 0 14px;">' +
        '<span style="width:4px;height:16px;background:#059669;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
        '<p style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0;line-height:1.5;">' + leaf(esc(plain(title))) + '</p>' +
        '</section>';
    },

    paragraph(html) {
      return '<p style="margin:0 0 18px;font-size:14px;line-height:1.9;text-align:justify;color:#555555;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('background:#F0FDF4;border:1px solid #A7F3D0;padding:16px 16px 14px;margin:0 0 26px;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:3px;color:#059669;margin:0 0 8px;">' + leaf('KEY POINT · 核心结论') + '</p>' +
        '<p style="font-size:15px;font-weight:700;color:#1a1a1a;line-height:1.8;margin:0;text-align:justify;">' + html + '</p>' +
        (ctx.author ? '<p style="font-size:10px;color:#888888;margin:10px 0 0;text-align:right;">' + leaf('—— ' + esc(ctx.author)) + '</p>' : '')
      );
    },

    quote(html) {
      return section('margin:0 0 22px;padding:14px 16px;background:#F0FDF4;border-left:4px solid #059669;',
        '<p style="font-size:13px;line-height:1.85;color:#374151;margin:0;text-align:justify;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('margin:0 0 22px;padding:13px 15px;background:' + (warn ? '#FFFBEB' : '#F0FDF4') + ';border:1px dashed ' + (warn ? '#F59E0B' : '#A7F3D0') + ';',
        '<p style="font-size:9px;font-weight:800;letter-spacing:2px;color:' + (warn ? '#92400E' : '#059669') + ';margin:0 0 6px;">' + leaf(warn ? '⚠ 注意' : '✂ TIP') + '</p>' +
        '<p style="font-size:13px;line-height:1.8;color:#374151;margin:0;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:12px;margin:0 0 14px;padding-bottom:12px;border-bottom:1px dashed #D1FAE5;',
            '<span style="flex-shrink:0;font-size:20px;font-weight:900;color:#059669;line-height:1.2;min-width:26px;">' + leaf(String(i + 1).padStart(2, '0')) + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#555555;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:9px;margin:0 0 10px;',
            '<span style="flex-shrink:0;width:6px;height:6px;background:#059669;margin-top:9px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#555555;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#1a1a1a', text: '#F0FDF4', label: '#6EE7B7' });
    },

    image(block) {
      return imageBlock(block, '0', '#999999');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#059669', headBg: '#F0FDF4', headText: '#065F46', border: '#D1FAE5', text: '#555555' });
    },

    divider() {
      return '<section style="height:1px;border-top:1px dashed #A7F3D0;margin:28px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('margin:30px 0 8px;background:#fffef8;border:2px solid #1a1a1a;box-shadow:4px 4px 0 #1a1a1a;padding:0;',
        section('background:#059669;padding:8px 16px;',
          '<p style="font-size:9px;color:#ffffff;letter-spacing:3px;margin:0;font-weight:700;">' + leaf('THANKS FOR READING') + '</p>'
        ) +
        section('padding:20px 16px;text-align:center;',
          '<p style="font-size:13px;font-weight:700;color:#1a1a1a;margin:0 0 14px;line-height:1.8;">' + leaf(signText(ctx.author)) + '</p>' +
          '<p style="font-size:11px;font-weight:800;color:#059669;margin:0 0 12px;letter-spacing:2px;">' + leaf('点赞 · 在看 · 转发') + '</p>' +
          section('display:flex;align-items:center;justify-content:center;padding:0 4px;',
            section('flex:1;border-top:1px dashed #A7F3D0;font-size:0;line-height:0;overflow:hidden;', EMPTY) +
            '<span style="padding:0 8px;font-size:10px;color:#A7F3D0;">' + leaf('✂') + '</span>' +
            section('flex:1;border-top:1px dashed #A7F3D0;font-size:0;line-height:0;overflow:hidden;', EMPTY)
          ) +
          '<p style="font-size:9px;color:#999999;letter-spacing:1px;margin:8px 0 0;">' + leaf('ADMIT ONE · 下次再见') + '</p>'
        )
      );
    }
  });

  /* ------------------------------------------------------------------ *
   * 6. 橄榄手记 —— 内刊编辑部风
   * ------------------------------------------------------------------ */
  themes.push({
    id: 'olive',
    name: '橄榄手记',
    desc: '内刊质感 · 分节多样',
    tags: ['复盘', '深度评测', '手记'],
    swatch: ['#1e1f23', '#ed7b2f', '#eeefe9'],
    container: 'max-width:677px;margin:0 auto;padding:0;background:#fdfdf8;font-family:' + FONT + ';color:#4d4f46;line-height:1.75;letter-spacing:0.2px;overflow-x:hidden;box-sizing:border-box;',

    inline: {
      bold: 'color:#1e1f23;font-weight:800;',
      highlight: 'background:#FCE7D6;color:#8a3d0f;padding:0 4px;border-radius:2px;font-weight:600;',
      underline: 'border-bottom:2px solid #ed7b2f;font-weight:600;color:#23251d;',
      code: 'background:#e5e7e0;color:#23251d;padding:2px 6px;border-radius:3px;font-size:13px;font-weight:600;',
      strike: 'color:#9ea096;text-decoration:line-through;',
      em: 'color:#1e1f23;font-style:italic;',
      link: 'color:#b45309;border-bottom:1px solid #ed7b2f;'
    },

    cover(ctx) {
      const tags = tagsFrom(ctx.tags);
      return section('background:#fdfdf8;border:1px solid #bfc1b7;border-radius:6px;overflow:hidden;margin:2px 0 24px;',
        section('padding:26px 20px 20px;',
          section('display:flex;align-items:center;gap:8px;margin-bottom:20px;',
            '<span style="width:8px;height:8px;border-radius:50%;background:#1e1f23;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<span style="font-size:9px;font-weight:700;letter-spacing:3px;color:#65675e;">' + leaf('IN-HOUSE JOURNAL · 内刊手记') + '</span>' +
            '<span style="flex:1;height:1px;background:#bfc1b7;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<span style="font-size:9px;color:#9ea096;font-weight:500;">' + leaf(dateLabel()) + '</span>'
          ) +
          section('display:flex;align-items:stretch;gap:14px;',
            section('flex:1;min-width:0;',
              '<p style="font-size:23px;font-weight:800;color:#23251d;margin:0 0 10px;line-height:1.32;letter-spacing:-0.5px;">' + accentTitle(ctx.title, 'border-bottom:3px solid #e5e7e0;') + '</p>' +
              section('display:flex;align-items:center;gap:4px;margin-bottom:12px;',
                '<span style="width:22px;height:3px;background:#1e1f23;border-radius:2px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
                '<span style="width:8px;height:3px;background:#bfc1b7;border-radius:2px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>'
              ) +
              (ctx.subtitle ? '<p style="font-size:12px;color:#65675e;margin:0;line-height:1.75;">' + leaf(esc(ctx.subtitle)) + '</p>' : '') +
              '<p style="font-size:10px;color:#9ea096;margin:10px 0 0;letter-spacing:1px;">' + leaf(ctx.author ? esc(ctx.author) : '编辑部 · 深度阅读') + '</p>'
            ) +
            section('flex-shrink:0;width:82px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#eeefe9;border:1px dashed #bfc1b7;border-radius:6px;padding:8px;',
              '<p style="font-family:' + SERIF + ';font-size:30px;font-weight:700;color:#4d4f46;margin:0;line-height:1.2;">' + leaf('刊') + '</p>' +
              '<span style="width:24px;height:1px;background:#bfc1b7;margin:6px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
              '<p style="font-size:7px;font-weight:700;color:#9ea096;letter-spacing:1px;margin:0;">' + leaf('JOURNAL') + '</p>'
            )
          )
        ) +
        section('background:#1e1f23;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;',
          '<p style="font-size:11px;color:rgba(255,255,255,0.92);margin:0;font-weight:600;">' + leaf(tags[0] + ' · ' + tags[1]) + '</p>' +
          section('display:flex;gap:5px;flex-wrap:wrap;',
            '<span style="background:#e5e7e0;color:#23251d;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:700;border:1px solid #bfc1b7;">' + leaf('深度') + '</span>' +
            '<span style="background:#e5e7e0;color:#23251d;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:700;border:1px solid #bfc1b7;">' + leaf('手记') + '</span>'
          )
        )
      );
    },

    toc() {
      return '';
    },

    sectionTitle(title, ctx) {
      return section('margin:' + (ctx.index === 0 ? '22px' : '38px') + ' 0 18px;',
        section('display:flex;align-items:center;gap:13px;',
          section('text-align:center;flex-shrink:0;',
            '<p style="margin:0;font-size:23px;font-weight:800;color:#23251d;line-height:1;letter-spacing:-2px;">' + leaf(ctx.isLast ? '∞' : String(ctx.index + 1).padStart(2, '0')) + '</p>' +
            '<p style="margin:0;font-size:7px;font-weight:700;color:#9ea096;letter-spacing:2px;">' + leaf(ctx.isLast ? 'END' : 'PART') + '</p>'
          ) +
          '<span style="width:1px;height:34px;background:#bfc1b7;flex-shrink:0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
          section('min-width:0;',
            '<p style="margin:0 0 1px;font-size:16px;font-weight:800;color:#23251d;letter-spacing:0.2px;line-height:1.45;">' + leaf(esc(plain(title))) + '</p>' +
            '<p style="margin:0;font-size:10px;font-weight:600;color:#65675e;letter-spacing:1.2px;">' + leaf(enTag(title, ctx.index)) + '</p>'
          )
        )
      );
    },

    h3(title) {
      return section('margin:24px 0 12px;',
        section('display:flex;align-items:center;gap:9px;',
          '<span style="background:#1e1f23;color:#ffffff;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;flex-shrink:0;">' + leaf('·') + '</span>' +
          '<p style="font-size:14px;font-weight:700;color:#4d4f46;margin:0;line-height:1.5;">' + leaf(esc(plain(title))) + '</p>'
        )
      );
    },

    paragraph(html) {
      return '<p style="margin:0 0 17px;font-size:14px;line-height:1.9;text-align:justify;color:#4d4f46;">' + html + '</p>';
    },

    leadQuote(html, ctx) {
      return section('background:#eeefe9;border:1px solid #bfc1b7;border-left:4px solid #ed7b2f;border-radius:6px;padding:16px 16px 14px;margin:0 0 24px;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:3px;color:#b45309;margin:0 0 8px;">' + leaf('EDITOR’S NOTE · 编者按') + '</p>' +
        '<p style="font-size:14px;line-height:1.85;color:#4d4f46;margin:0;text-align:justify;">' + html + '</p>' +
        '<p style="font-size:10px;color:#9ea096;margin:10px 0 0;text-align:right;letter-spacing:1px;">' + leaf(ctx.author ? '—— ' + esc(ctx.author) : '—— 编辑部') + '</p>'
      );
    },

    quote(html) {
      return section('margin:0 0 22px;padding:15px 16px;background:#fdfdf8;border:1px solid #bfc1b7;border-radius:6px;',
        '<p style="font-size:13px;line-height:1.85;color:#65675e;margin:0;text-align:justify;">' + html + '</p>'
      );
    },

    tip(html, kind) {
      const warn = kind === 'WARNING';
      return section('margin:0 0 22px;padding:14px 16px;background:#eeefe9;border:1px solid #bfc1b7;border-radius:6px;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:3px;color:' + (warn ? '#b45309' : '#65675e') + ';margin:0 0 7px;">' + leaf(warn ? '⚠ 注意事项' : '※ 补充说明') + '</p>' +
        '<p style="font-size:13px;line-height:1.85;color:#4d4f46;margin:0;">' + html + '</p>'
      );
    },

    list(items, ordered) {
      return items.map((html, i) => ordered
        ? section('display:flex;align-items:flex-start;gap:10px;margin:0 0 10px;padding:9px 12px;background:#ffffff;border:1px solid #bfc1b7;border-radius:6px;',
            '<span style="flex-shrink:0;font-size:12px;font-weight:800;color:#b45309;line-height:1.9;min-width:18px;">' + leaf(String(i + 1).padStart(2, '0')) + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#4d4f46;text-align:justify;">' + html + '</p>'
          )
        : section('display:flex;align-items:flex-start;gap:9px;margin:0 0 9px;',
            '<span style="flex-shrink:0;width:5px;height:5px;background:#ed7b2f;margin-top:10px;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</span>' +
            '<p style="margin:0;flex:1;font-size:14px;line-height:1.9;color:#4d4f46;text-align:justify;">' + html + '</p>'
          )
      ).join('');
    },

    code(block) {
      return codeBlock(block, { bg: '#23251d', text: '#eeefe9', label: '#ed7b2f' });
    },

    image(block) {
      return imageBlock(block, '6px', '#9ea096');
    },

    table(block, inline) {
      return tableBlock(block, inline, { accent: '#1e1f23', headBg: '#eeefe9', headText: '#23251d', border: '#bfc1b7', text: '#4d4f46' });
    },

    divider() {
      return '<section style="height:1px;border-top:1px dotted #bfc1b7;margin:26px 0;font-size:0;line-height:0;overflow:hidden;">' + EMPTY + '</section>';
    },

    footer(ctx) {
      return section('margin:28px 0 4px;background:#1e1f23;border-radius:6px;padding:24px 20px;text-align:center;',
        '<p style="font-size:9px;font-weight:800;letter-spacing:4px;color:#ed7b2f;margin:0 0 12px;">' + leaf('END OF ISSUE') + '</p>' +
        '<p style="font-size:13px;color:rgba(255,255,255,0.92);margin:0 0 14px;line-height:1.85;">' + leaf(signText(ctx.author)) + '</p>' +
        '<p style="font-size:11px;font-weight:700;color:#ffffff;margin:0;letter-spacing:2px;">' + leaf('点赞 · 在看 · 转发') + '</p>'
      );
    }
  });

  global.GZH_THEMES = themes;
  if (typeof module !== 'undefined' && module.exports) module.exports = themes;
})(typeof window !== 'undefined' ? window : globalThis);
