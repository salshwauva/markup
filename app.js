const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const previewPane = document.getElementById('previewPane');
const previewToggle = document.getElementById('previewToggle');
const saveButton = document.getElementById('saveBtn');
const clearButton = document.getElementById('clearBtn');
const highlightLayer = document.getElementById('highlightLayer');
const lineNumbers = document.getElementById('lineNumbers');
const contentArea = document.getElementById('content-area');
const statusLeft = document.getElementById('status-left');

const defaultContent = `# Welcome to your celestial note

This space is designed to feel calm, playful, and useful.

## A few practice elements

- Keep ideas here
- Add references as you go
- Let the preview show the shape of the page

> A small note can still hold a great deal of meaning.

Try writing a short reflection or a list of study points.
`;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function syncScroll() {
  highlightLayer.scrollTop = editor.scrollTop;
  highlightLayer.scrollLeft = editor.scrollLeft;
  lineNumbers.scrollTop = editor.scrollTop;
}

function renderLineNumbers() {
  const count = Math.max(1, editor.value.split('\n').length);
  lineNumbers.innerHTML = Array.from({ length: count }, (_, index) => `<div>${index + 1}</div>`).join('');
}

function renderHighlighting(markdown) {
  const lines = markdown.split(/\n/);
  const html = [];

  lines.forEach((line) => {
    let content = escapeHtml(line || ' ');

    if (/^#{1,3}\s/.test(line)) {
      const heading = line.replace(/^#{1,3}\s/, '');
      content = `<span class="token-heading">${escapeHtml(heading)}</span>`;
    } else {
      content = content
        .replace(/(`[^`]+`)/g, '<span class="token-code">$1</span>')
        .replace(/(\*\*[^*]+\*\*)/g, '<span class="token-strong">$1</span>')
        .replace(/(\*[^*]+\*)/g, '<span class="token-emphasis">$1</span>')
        .replace(/(\[[^\]]+\]\([^)]+\))/g, '<span class="token-link">$1</span>');

      if (/^>\s/.test(line)) {
        content = `<span class="token-quote">${content}</span>`;
      }

      if (/^[-*]\s/.test(line)) {
        content = `<span class="token-list">${content}</span>`;
      }
    }

    html.push(`<div>${content || '&nbsp;'}</div>`);
  });

  highlightLayer.innerHTML = html.join('');
  syncScroll();
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\n/);
  const html = [];
  let inCodeBlock = false;
  let listItems = [];

  function flushList() {
    if (listItems.length) {
      html.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    }
  }

  for (let line of lines) {
    if (line.startsWith('```')) {
      flushList();
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        html.push('<pre><code>');
      } else {
        html.push('</code></pre>');
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    if (!line.trim()) {
      flushList();
      html.push('<div class="spacer"></div>');
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#{1,3}\s/, '');
      html.push(`<h${level}>${formatInline(content)}</h${level}>`);
      continue;
    }

    if (/^>\s/.test(line)) {
      flushList();
      html.push(`<blockquote>${formatInline(line.replace(/^>\s/, ''))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      listItems.push(`<li>${formatInline(line.replace(/^[-*]\s/, ''))}</li>`);
      continue;
    }

    flushList();
    html.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  preview.innerHTML = html.join('');
}

function formatInline(text) {
  let value = escapeHtml(text);
  value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*(.+?)\*/g, '<em>$1</em>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return value;
}

function updateStatus() {
  const value = editor.value;
  const beforeCursor = value.slice(0, editor.selectionStart);
  const line = beforeCursor.split('\n').length;
  const column = beforeCursor.split('\n').pop().length + 1;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  statusLeft.textContent = `WORDS: ${words} | LINE: ${line} COL: ${column} | SAVED OK`;
}

function loadContent() {
  const saved = localStorage.getItem('celestial-markdown-editor');
  editor.value = saved || defaultContent;
  renderMarkdown(editor.value);
  renderHighlighting(editor.value);
  renderLineNumbers();
  updateStatus();
}

function saveContent() {
  localStorage.setItem('celestial-markdown-editor', editor.value);
  updateStatus();
}

function resetContent() {
  editor.value = defaultContent;
  renderMarkdown(defaultContent);
  renderHighlighting(defaultContent);
  renderLineNumbers();
  updateStatus();
  localStorage.removeItem('celestial-markdown-editor');
}

function insertSnippet(snippet) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const current = editor.value;
  editor.value = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
  editor.focus();
  const cursor = start + snippet.length;
  editor.setSelectionRange(cursor, cursor);
  renderMarkdown(editor.value);
  renderHighlighting(editor.value);
  renderLineNumbers();
  updateStatus();
}

function togglePreview() {
  contentArea.classList.toggle('preview-hidden');
  const hidden = contentArea.classList.contains('preview-hidden');
  previewToggle.querySelector('span').textContent = hidden ? 'PREVIEW OFF' : 'PREVIEW';
}

editor.addEventListener('input', () => {
  renderMarkdown(editor.value);
  renderHighlighting(editor.value);
  renderLineNumbers();
  updateStatus();
});
editor.addEventListener('scroll', syncScroll);
editor.addEventListener('keyup', updateStatus);
editor.addEventListener('click', updateStatus);
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    insertSnippet('  ');
  }
});

saveButton.addEventListener('click', saveContent);
clearButton.addEventListener('click', resetContent);
previewToggle.addEventListener('click', togglePreview);

document.querySelectorAll('.toolbar-button[data-insert]').forEach((button) => {
  button.addEventListener('click', () => {
    insertSnippet(button.dataset.insert || '');
  });
});

loadContent();
