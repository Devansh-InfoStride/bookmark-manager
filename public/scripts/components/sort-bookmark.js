(function initSortBookmarkFeature() {
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort-container';
    
    sortContainer.innerHTML = `
        <label for="sort-select" class="sort-label">Sort by:</label>
        <select id="sort-select" class="sort-select">
            <option value="date_desc">Date Added (Newest)</option>
            <option value="date_asc">Date Added (Oldest)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
        </select>
    `;

    function attachSortUI() {
        const bookmarksContainer = document.querySelector('.bookmarks-container');
        if (bookmarksContainer) {
            const heading = bookmarksContainer.querySelector('h2');
            if (heading) {
                heading.after(sortContainer);
            } else {
                bookmarksContainer.prepend(sortContainer);
            }
        }
    }

    function handleSortChange(event) {
        const sortValue = event.target.value;
        if (typeof window.refreshBookmarks === 'function') {
            window.refreshBookmarks(sortValue);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            attachSortUI();
            const sortSelect = document.getElementById('sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', handleSortChange);
            }
        });
    } else {
        attachSortUI();
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', handleSortChange);
        }
    }
})();
