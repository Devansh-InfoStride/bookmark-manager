(function initPinBookmarkFeature() {
    const fallbackTemplate = `
        <button
            class="pin-button __PINNED_CLASS__"
            onclick="togglePinBookmark(__BOOKMARK_ID__)"
            aria-label="__PIN_ARIA_LABEL__"
            title="__PIN_TOOLTIP__"
        >
            __PIN_LABEL__
        </button>
    `;

    let pinButtonTemplate = fallbackTemplate;

    function replaceToken(template, token, value) {
        return template.split(token).join(String(value));
    }

    function hydrateTemplate(template, bookmark) {
        const isPinned = Boolean(bookmark.isPinned);
        const ariaLabel = isPinned ? 'Unpin bookmark' : 'Pin bookmark';
        const tooltip = isPinned ? 'Unpin this bookmark' : 'Pin this bookmark';
        const label = isPinned ? 'Pinned' : 'Pin';
        const pinnedClass = isPinned ? 'is-pinned' : '';

        let html = template;
        html = replaceToken(html, '__PINNED_CLASS__', pinnedClass);
        html = replaceToken(html, '__BOOKMARK_ID__', bookmark.id);
        html = replaceToken(html, '__PIN_ARIA_LABEL__', ariaLabel);
        html = replaceToken(html, '__PIN_TOOLTIP__', tooltip);
        html = replaceToken(html, '__PIN_LABEL__', label);
        return html;
    }

    async function loadPinButtonTemplate() {
        try {
            const response = await fetch('/public/pages/pin-bookmark-button.html');
            if (!response.ok) {
                return;
            }
            const templateText = await response.text();
            if (templateText.trim()) {
                pinButtonTemplate = templateText;
            }
        } catch (error) {
            // Use fallback template when file loading is not available.
        }
    }

    function sortPinnedBookmarks(list) {
        return [...list].sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
    }

    function togglePinBookmark(id) {
        if (!Array.isArray(bookmarks)) {
            return;
        }

        const index = bookmarks.findIndex((bookmark) => bookmark.id === id);
        if (index === -1) {
            return;
        }

        bookmarks[index] = {
            ...bookmarks[index],
            isPinned: !bookmarks[index].isPinned
        };

        if (typeof saveBookmarks === 'function') {
            saveBookmarks();
        }

        if (typeof filterItems === 'function') {
            filterItems();
        } else if (typeof renderBookmarks === 'function') {
            renderBookmarks();
        }
    }

    window.getPinBookmarkButtonMarkup = function getPinBookmarkButtonMarkup(bookmark) {
        return hydrateTemplate(pinButtonTemplate, bookmark);
    };

    window.sortPinnedBookmarks = sortPinnedBookmarks;
    window.togglePinBookmark = togglePinBookmark;

    loadPinButtonTemplate().then(() => {
        if (typeof renderBookmarks === 'function') {
            renderBookmarks();
        }
    });
})();
