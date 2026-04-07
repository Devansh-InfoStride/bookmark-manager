// Bookmark Manager - JavaScript

// DOM Element Extractor
const form = document.getElementById('bookmark-form');
const bookmarkNameInput = document.getElementById('bookmark-name');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkDescriptionInput = document.getElementById('bookmark-description');
const bookmarksDisplay = document.getElementById('bookmarks-display');

// Locall Memory - state memory for bookmarks
let bookmarks = [];
const DESCRIPTION_PREVIEW_LENGTH = 50;

// Load bookmarks from localStorage on page load
function loadBookmarks() {
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
        bookmarks = JSON.parse(saved);
        renderBookmarks();
    }
}

// Save bookmarks to localStorage
function saveBookmarks() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get input values
    const name = bookmarkNameInput.value.trim();
    const url = bookmarkUrlInput.value.trim();
    const description = bookmarkDescriptionInput.value.trim();

    // Validate inputs
    if (!name || !url) {
        alert('Please fill in Name and URL');
        return;
    }

    // Create bookmark object
    const bookmark = {
        id: Date.now(),
        name: name,
        url: url,
        description: description
    };

    
    // Add to bookmarks array
    bookmarks.push(bookmark);

    // Save to localStorage
    saveBookmarks();

    // Clear form
    form.reset();

    // Re-render bookmarks
    renderBookmarks();
});

// Render all bookmarks
function renderBookmarks() {
    // Clear display
    bookmarksDisplay.innerHTML = '';

    // Show empty state if no bookmarks
    if (bookmarks.length === 0) {
        bookmarksDisplay.innerHTML = '<div class="empty-state"><p>No bookmarks yet. Add one to get started! 🚀</p></div>';
        return;
    }

    // Create and add each bookmark card
    bookmarks.forEach((bookmark) => {
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
    const descriptionText = bookmark.description ? bookmark.description.trim() : '';
    const isLongDescription = descriptionText.length > DESCRIPTION_PREVIEW_LENGTH;
    const shortDescription = isLongDescription
        ? `${descriptionText.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`
        : descriptionText;

    card.innerHTML = `
        <div class="card-header">
            <img src="${faviconUrl}" alt="favicon" class="card-favicon" onerror="this.style.display='none'">
            <h3 class="card-title">${escapeHtml(bookmark.name)}</h3>
        </div>
        
        ${descriptionText ? `
            <p class="card-description" data-full="${escapeHtml(descriptionText)}" data-short="${escapeHtml(shortDescription)}">${escapeHtml(shortDescription)}</p>
            ${isLongDescription ? '<button class="read-more-button" onclick="toggleDescription(this)">Read more</button>' : ''}
        ` : ''}
        <div class="card-actions">
            <button class="open-button" onclick="openBookmark('${bookmark.url}')">Open</button>
            <button class="delete-button" onclick="deleteBookmark(${bookmark.id})">Delete</button>
        </div>
    `;

    return card;
}

// Open bookmark URL in new tab
function openBookmark(url) {
    window.open(url, '_blank');
}

// Delete bookmark
function deleteBookmark(id) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
        saveBookmarks();
        renderBookmarks();
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
