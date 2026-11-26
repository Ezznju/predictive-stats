'use client';

import { useEffect } from 'react';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function detectLanguage(codeEl: Element, text: string): string {
  const cls = `${codeEl.className || ''} ${codeEl.parentElement?.className || ''}`;
  const explicit = cls.match(/language-([a-z0-9#+-]+)/i)?.[1];
  if (explicit) return explicit.toUpperCase();

  const sample = text.trim();
  if (/^\s*[\[{][\s\S]*[\]}]\s*$/.test(sample) && /"\w+"\s*:/.test(sample)) return 'JSON';
  if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|GROUP BY|ORDER BY)\b/i.test(sample) && /\bFROM\b/i.test(sample)) return 'SQL';
  if (/\b(def |import |from .+ import|elif |print\(|pandas|requests\.|asyncio\.)/.test(sample)) return 'PYTHON';
  if (/\b(const |let |async function|export default|interface |=>|console\.log)/.test(sample)) return 'TYPESCRIPT';
  if (/^(curl |npm |npx |pip |python |git |brew |docker |export |\$ )/m.test(sample)) return 'BASH';
  if (/<\/?[a-z][\w-]*(\s|>)/i.test(sample)) return 'HTML';
  return 'CODE';
}

const KEYWORDS = new Set([
  // Python
  'def', 'class', 'import', 'from', 'as', 'return', 'yield', 'if', 'elif', 'else',
  'for', 'while', 'in', 'not', 'and', 'or', 'try', 'except', 'finally', 'with',
  'pass', 'break', 'continue', 'lambda', 'async', 'await', 'True', 'False', 'None', 'raise',
  // JS / TS
  'const', 'let', 'var', 'function', 'export', 'default', 'interface', 'type',
  'new', 'typeof', 'instanceof', 'true', 'false', 'null', 'undefined', 'throw', 'catch', 'switch', 'case',
  // SQL
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'AS', 'GROUP', 'BY',
  'ORDER', 'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'AND', 'OR', 'NOT',
  'select', 'from', 'where', 'join', 'limit', 'order', 'group',
]);

// Single-pass lexical highlighter (comments, strings, numbers, identifiers/keywords)
const TOKEN_RE =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][A-Za-z0-9_]*\b)(?=\s*\()|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

function highlightCode(raw: string): string {
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((m = TOKEN_RE.exec(raw)) !== null) {
    if (m.index > last) {
      out += escapeHtml(raw.slice(last, m.index));
    }
    const [full, comment, str, num, fnCall, ident] = m;
    if (comment) {
      out += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (str) {
      out += `<span class="tok-string">${escapeHtml(str)}</span>`;
    } else if (num) {
      out += `<span class="tok-number">${escapeHtml(num)}</span>`;
    } else if (fnCall) {
      if (KEYWORDS.has(fnCall)) {
        out += `<span class="tok-keyword">${escapeHtml(fnCall)}</span>`;
      } else {
        out += `<span class="tok-fn">${escapeHtml(fnCall)}</span>`;
      }
    } else if (ident) {
      if (KEYWORDS.has(ident)) {
        out += `<span class="tok-keyword">${escapeHtml(ident)}</span>`;
      } else {
        out += escapeHtml(ident);
      }
    } else {
      out += escapeHtml(full);
    }
    last = TOKEN_RE.lastIndex;
  }

  if (last < raw.length) {
    out += escapeHtml(raw.slice(last));
  }
  return out;
}

/**
 * Enhances all <pre><code> blocks inside rendered article prose with:
 *  - Clean neo-brutalist window header bar + auto-detected language badge
 *  - High-contrast syntax highlighting (0 dependencies, XSS-safe)
 *  - One-click Copy button with visual "Copied ✓" confirmation
 */
export function CodeBlocks() {
  useEffect(() => {
    const pres = document.querySelectorAll<HTMLPreElement>('.article-prose pre');
    pres.forEach((pre) => {
      if (pre.dataset.enhanced === '1') return;
      pre.dataset.enhanced = '1';

      const codeEl = pre.querySelector('code') ?? pre;
      const rawText = (codeEl.textContent ?? '').replace(/\n$/, '');
      if (!rawText.trim()) return;

      const lang = detectLanguage(codeEl, rawText);

      // Apply lightweight syntax highlighting cleanly
      codeEl.innerHTML = highlightCode(rawText);

      // Wrap <pre> in styled editorial shell with top bar + Copy button
      const shell = document.createElement('div');
      shell.className = 'code-block-shell not-prose';

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const left = document.createElement('div');
      left.className = 'code-block-meta';
      left.innerHTML =
        '<span class="code-dots" aria-hidden="true">' +
        '<span style="background:#FF00B8"></span>' +
        '<span style="background:#FFE642"></span>' +
        '<span style="background:#2BD96E"></span>' +
        '</span>' +
        `<span class="code-lang">${escapeHtml(lang)}</span>`;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');
      copyBtn.textContent = 'Copy';

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(rawText);
        } catch {
          // Fallback for restricted clipboard contexts
          const ta = document.createElement('textarea');
          ta.value = rawText;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('is-copied');
        window.setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('is-copied');
        }, 1800);
      });

      header.appendChild(left);
      header.appendChild(copyBtn);

      pre.parentNode?.insertBefore(shell, pre);
      shell.appendChild(header);
      shell.appendChild(pre);
    });
  }, []);

  return null;
}
