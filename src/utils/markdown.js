// ── Lightweight Markdown Renderer ──

export function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Tables (must be before paragraph handling)
  // Match full table block: header line + separator line + body lines
  html = html.replace(
    /(\n|^)(\|[^\n]+\|\s*\n)(\|[:\s|-]+\|\s*\n)((?:\|[^\n]+\|\s*(?:\n|$))*)/gm,
    (match, before, headerRow, sepRow, bodyRows) => {
      const headers = parseRow(headerRow);
      const bodies = bodyRows.trim().split('\n').filter(r => r.trim()).map(r => parseRow(r));

      const alignments = parseRow(sepRow).map(cell => {
        cell = cell.trim();
        if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
        if (cell.endsWith(':')) return 'right';
        return 'left';
      });

      const makeCell = (tag, content, i) =>
        `<${tag} style="text-align:${alignments[i] || 'left'}">${content}</${tag}>`;

      let html = before;
      html += '<div class="md-table-wrapper"><table>';
      html += '<thead><tr>' + headers.map((h, i) => makeCell('th', h, i)).join('') + '</tr></thead>';
      if (bodies.length) {
        html += '<tbody>' + bodies.map(row =>
          '<tr>' + row.map((c, i) => makeCell('td', c, i)).join('') + '</tr>'
        ).join('') + '</tbody>';
      }
      html += '</table></div>';
      return html;
    }
  );

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strike-through
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

  // Unordered lists (handle nested markup inside list items)
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  // Merge consecutive list items (caught after unordered already grouped)
  // Handle ordered lists separately if needed

  // Horizontal rules
  html = html.replace(/^---+\s*$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br><\/p>/g, '');
  html = html.replace(/<p>(<h[2-4]>)/g, '$1');
  html = html.replace(/(<\/h[2-4]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ol>)/g, '$1');
  html = html.replace(/(<\/ol>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<div class="md-table-wrapper")/g, '$1');
  html = html.replace(/(<\/table><\/div>)<\/p>/g, '$1');
  html = html.replace(/<p><hr><\/p>/g, '<hr>');

  return html;
}

function parseRow(line) {
  return line
    .replace(/^\||\|\s*$/g, '')
    .split('|')
    .map(c => c.trim())
    .filter(c => c !== '');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
}
