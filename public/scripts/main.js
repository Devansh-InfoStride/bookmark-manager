// Bookmark Manager - JavaScript

const API_BASE_URL = '/api/bookmarks';

// DOM Element Extractor
const form = document.getElementById('bookmark-form');
const bookmarkNameInput = document.getElementById('bookmark-name');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkDescriptionInput = document.getElementById('bookmark-description');
const bookmarksDisplay = document.getElementById('bookmarks-display');

// In-memory state for bookmarks loaded from Neon
let bookmarks = [];
const DESCRIPTION_PREVIEW_LENGTH = 50;

function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    try {
        const hasProtocol = /^https?:\/\//i.test(trimmed);
        const candidate = hasProtocol ? trimmed : `https://${trimmed}`;
        const parsed = new URL(candidate);
        return parsed.href;
    } catch (error) {
        return null;
    }
}

function normalizeBookmark(bookmark) {
    return {
        id: String(bookmark.id),
        name: bookmark.name || '',
        url: bookmark.url || '',
        description: bookmark.description || '',
        isPinned: Boolean(bookmark.isPinned)
    };
}

function escapeJsSingleQuote(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function requestJson(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        let errorMessage = 'Request failed.';
        try {
            const errorPayload = await response.json();
            if (errorPayload && errorPayload.error) {
                errorMessage = errorPayload.error;
            }
        } catch (error) {
            // Keep fallback error message.
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function loadBookmarks() {
    try {
        const rows = await requestJson(API_BASE_URL);
        bookmarks = Array.isArray(rows) ? rows.map(normalizeBookmark) : [];

        if (typeof filterItems === 'function') {
            filterItems();
        } else {
            renderBookmarks();
        }
    } catch (error) {
        bookmarksDisplay.innerHTML = '<div class="empty-state"><p>Could not load bookmarks from the database.</p></div>';
    }
}

// Preserved for existing component compatibility.
function saveBookmarks() {
    return bookmarks;
}

async function patchBookmarkById(id, payload) {
    const updated = await requestJson(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    return normalizeBookmark(updated);
}

window.patchBookmarkById = patchBookmarkById;
window.refreshBookmarks = loadBookmarks;

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = bookmarkNameInput.value.trim();
    const normalizedUrl = normalizeUrl(bookmarkUrlInput.value);
    const description = bookmarkDescriptionInput.value.trim();

    if (!name || !normalizedUrl) {
        alert('Please provide a valid Name and URL.');
        return;
    }

    try {
        const created = await requestJson(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({
                name,
                url: normalizedUrl,
                description,
                isPinned: false
            })
        });

        bookmarks.unshift(normalizeBookmark(created));
        form.reset();

        if (typeof filterItems === 'function') {
            filterItems();
        } else {
            renderBookmarks();
        }
    } catch (error) {
        alert(error.message || 'Failed to save bookmark.');
    }
});

// Render all bookmarks
function renderBookmarks(bookmarksToRender = bookmarks) {
    const sortedBookmarks = typeof sortPinnedBookmarks === 'function'
        ? sortPinnedBookmarks(bookmarksToRender)
        : bookmarksToRender;

    // Clear display
    bookmarksDisplay.innerHTML = '';

    // Show empty state if no bookmarks
    if (sortedBookmarks.length === 0) {
        bookmarksDisplay.innerHTML = '<div class="empty-state"><p>No bookmarks yet. Add one to get started! 🚀</p></div>';
        return;
    }

    // Create and add each bookmark card
    sortedBookmarks.forEach((bookmark) => {
        const card = createBookmarkCard(bookmark);
        bookmarksDisplay.appendChild(card);
    });
}

// Get favicon URL from domain
function getFaviconUrl(url) {
    let cleanDomain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    return `https://www.google.com/s2/favicons?sz=32&domain=${cleanDomain}`;
}

// Create individual bookmark card
function createBookmarkCard(bookmark) {
    const card = document.createElement('div');
    card.className = 'bookmark-card';

    const faviconUrl = getFaviconUrl(bookmark.url);
    const pinButton = typeof getPinBookmarkButtonMarkup === 'function'
        ? getPinBookmarkButtonMarkup(bookmark)
        : '';
    const descriptionText = bookmark.description ? bookmark.description.trim() : '';
    const isLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_LENGTH;
    const shortDescription = isLongDescription
        ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`
        : descriptionText;
    const safeBookmarkId = escapeJsSingleQuote(bookmark.id);
    const safeBookmarkUrl = escapeJsSingleQuote(bookmark.url);

    card.innerHTML = `
        ${bookmark.isPinned ? '<div class="pin-badge">Important</div>' : ''}
        <div class="card-header">
            <div class="card-title-group">
                <img src="${faviconUrl}" alt="favicon" class="card-favicon" onerror="this.style.display='none'">
                <h3 class="card-title">${escapeHtml(bookmark.name)}</h3>
            </div>
            ${pinButton}
        </div>
        
        ${descriptionText ? `
            <p class="card-description" data-full="${escapeHtml(descriptionText)}" data-short="${escapeHtml(shortDescription)}">${escapeHtml(shortDescription)}</p>
            ${isLongDescription ? '<button class="read-more-button" onclick="toggleDescription(this)">Read more</button>' : ''}
        ` : ''}
        <div class="card-actions">
            <button class="open-button" onclick="openBookmark('${safeBookmarkUrl}')">Open</button>
            <button class="edit-button" onclick="openEditBookmarkModal('${safeBookmarkId}')">Edit</button>
            <button class="delete-button" onclick="deleteBookmark('${safeBookmarkId}')">Delete</button>
        </div>
    `;

    return card;
}

// Open bookmark URL in new tab
function openBookmark(url) {
    window.open(url, '_blank');
}

// Delete bookmark
async function deleteBookmark(id) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        try {
            await requestJson(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            bookmarks = bookmarks.filter(bookmark => String(bookmark.id) !== String(id));

            if (typeof filterItems === 'function') {
                filterItems();
            } else {
                renderBookmarks();
            }
        } catch (error) {
            alert(error.message || 'Failed to delete bookmark.');
        }
    }
}

// Toggle long description between preview and full text
function toggleDescription(button) {
    const descriptionEl = button.previousElementSibling;

    if (!descriptionEl || !descriptionEl.classList.contains('card-description')) {
        return;
    }

    const isExpanded = button.dataset.expanded === 'true';

    if (isExpanded) {
        descriptionEl.textContent = descriptionEl.dataset.short || '';
        button.textContent = 'Read more';
        button.dataset.expanded = 'false';
    } else {
        descriptionEl.textContent = descriptionEl.dataset.full || '';
        button.textContent = 'Read less';
        button.dataset.expanded = 'true';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize on page load
loadBookmarks();
