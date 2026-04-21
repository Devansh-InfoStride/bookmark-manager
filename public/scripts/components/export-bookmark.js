/**
 * Export Bookmarks Component
 * Handles exporting the in-memory bookmarks array to a Netscape HTML file.
 */

function generateNetscapeHTML(bookmarks) {
    const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and rewritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`;

    const footer = `\n</DL><p>`;

    const items = bookmarks.map(bookmark => {
        // Netscape format uses unix timestamps for dates. 
        // We'll use current time if not available, or 0.
        const addDate = Math.floor(Date.now() / 1000);
        const name = bookmark.name || 'Untitled';
        const url = bookmark.url || '';
        const description = bookmark.description || '';

        return `\n    <DT><A HREF="${url}" ADD_DATE="${addDate}">${escapeHtml(name)}</A>${description ? `\n    <DD>${escapeHtml(description)}` : ''}`;
    }).join('');

    return header + items + footer;
}

/**
 * Main export function to be called from the UI
 */
function exportToHTML() {
    // Access the global bookmarks array from main.js
    if (!window.bookmarks || window.bookmarks.length === 0) {
        alert('No bookmarks available to export.');
        return;
    }

    try {
        const htmlContent = generateNetscapeHTML(window.bookmarks);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.html`;
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 0);
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export bookmarks. Please try again.');
    }
}

// Ensure escapeHtml is available (it's defined in main.js, but we'll add a fallback)
if (typeof escapeHtml !== 'function') {
    window.escapeHtml = function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    };
}

// Expose to window
window.exportToHTML = exportToHTML;
