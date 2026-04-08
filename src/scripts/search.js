// Search bookmarks by name

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchBtn');

function filterBookmarks() {
    if (!searchInput || typeof renderBookmarks !== 'function' || !Array.isArray(bookmarks)) {
        return;
    }

    const query = searchInput.value.trim().toLowerCase();
    const filteredBookmarks = query
        ? bookmarks.filter(bookmark => bookmark.name.toLowerCase().includes(query))
        : bookmarks;

    renderBookmarks(filteredBookmarks);
}

if (searchInput) {
    searchInput.addEventListener('input', filterBookmarks);
}

if (searchButton) {
    searchButton.addEventListener('click', filterBookmarks);
}

window.filterItems = filterBookmarks;