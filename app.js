const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const previewPane = document.getElementById('previewPane');
const previewToggle = document.getElementById('previewToggle');
const saveButton = document.getElementById('saveBtn');
const clearButton = document.getElementById('clearBtn');
const editorGrid = document.querySelector('.editor-grid');
const highlightLayer = document.getElementById('highlightLayer');
const editorPane = document.querySelector('.editor-pane');

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

function syncHighlightScroll() {
  highlightLayer.scrollTop = editor.scrollTop;
  highlightLayer.scrollLeft = editor.scrollLeft;
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

    html.push(`<div class="line">${content || '&nbsp;'}</div>`);
  });

  highlightLayer.innerHTML = html.join('');
  syncHighlightScroll();
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\n/);
  const html = [];
  let inCodeBlock = false;

  for (let line of lines) {
    if (line.startsWith('```')) {
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
      html.push('<div class="spacer"></div>');
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#{1,3}\s/, '');
      html.push(`<h${level}>${formatInline(content)}</h${level}>`);
      continue;
    }

    if (/^>\s/.test(line)) {
      html.push(`<blockquote>${formatInline(line.replace(/^>\s/, ''))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      html.push(`<li>${formatInline(line.replace(/^[-*]\s/, ''))}</li>`);
      continue;
    }

    html.push(`<p>${formatInline(line)}</p>`);
  }

  const content = html.join('');
  preview.innerHTML = content.replace(/<li>/g, '<ul><li>').replace(/<\/li>/g, '</li></ul>');
}

function formatInline(text) {
  let value = escapeHtml(text);
  value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\*(.+?)\*/g, '<em>$1</em>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return value;
}

function loadContent() {
  const saved = localStorage.getItem('celestial-markdown-editor');
  if (saved) {
    editor.value = saved;
  } else {
    editor.value = defaultContent;
  }
  renderMarkdown(editor.value);
  renderHighlighting(editor.value);
}

function saveContent() {
  localStorage.setItem('celestial-markdown-editor', editor.value);
  saveButton.textContent = 'Saved';
  window.setTimeout(() => {
    saveButton.textContent = 'Save';
  }, 900);
}

function resetContent() {
  editor.value = defaultContent;
  renderMarkdown(defaultContent);
  renderHighlighting(defaultContent);
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
}

editor.addEventListener('input', () => {
  renderMarkdown(editor.value);
  renderHighlighting(editor.value);
});
editor.addEventListener('scroll', syncHighlightScroll);
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    insertSnippet('  ');
  }
});

function togglePreview() {
  const isHidden = editorGrid.classList.toggle('preview-hidden');
  previewPane.style.display = isHidden ? 'none' : 'block';
  previewToggle.textContent = isHidden ? 'Preview Off' : 'Preview';
}

saveButton.addEventListener('click', saveContent);
clearButton.addEventListener('click', resetContent);
previewToggle.addEventListener('click', togglePreview);

document.querySelectorAll('.tool-btn').forEach((button) => {
  button.addEventListener('click', () => {
    insertSnippet(button.dataset.insert || '');
  });
});

loadContent();
