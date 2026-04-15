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
        const safeBookmarkId = String(bookmark.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        let html = template;
        html = replaceToken(html, '__PINNED_CLASS__', pinnedClass);
        html = replaceToken(html, '__BOOKMARK_ID__', `'${safeBookmarkId}'`);
        html = replaceToken(html, '__PIN_ARIA_LABEL__', ariaLabel);
        html = replaceToken(html, '__PIN_TOOLTIP__', tooltip);
        html = replaceToken(html, '__PIN_LABEL__', label);
        return html;
    }

    async function loadPinButtonTemplate() {
        try {
            const templateUrl = new URL('./pages/pin-bookmark-button.html', window.location.href);
            const response = await fetch(templateUrl);
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

    async function togglePinBookmark(id) {
        if (!Array.isArray(bookmarks)) {
            return;
        }

        const index = bookmarks.findIndex((bookmark) => String(bookmark.id) === String(id));
        if (index === -1) {
            return;
        }

        const currentBookmark = bookmarks[index];

        if (typeof patchBookmarkById === 'function') {
            try {
                bookmarks[index] = await patchBookmarkById(id, {
                    isPinned: !currentBookmark.isPinned
                });
            } catch (error) {
                alert(error.message || 'Failed to update bookmark.');
                return;
            }
        } else {
            bookmarks[index] = {
                ...currentBookmark,
                isPinned: !currentBookmark.isPinned
            };
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
