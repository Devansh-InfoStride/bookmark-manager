(function initEditBookmarkFeature() {
    let modal;
    let form;
    let nameInput;
    let urlInput;
    let descriptionInput;
    let editingBookmarkId = null;

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

    function setModalState(isOpen) {
        if (!modal) {
            return;
        }

        modal.classList.toggle('is-open', isOpen);
        modal.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('modal-open', isOpen);

        if (!isOpen) {
            editingBookmarkId = null;
            form.reset();
        }
    }

    function openEditBookmarkModal(id) {
        if (!Array.isArray(bookmarks)) {
            return;
        }

        const bookmark = bookmarks.find((item) => item.id === id);
        if (!bookmark) {
            return;
        }

        editingBookmarkId = id;
        nameInput.value = bookmark.name || '';
        urlInput.value = bookmark.url || '';
        descriptionInput.value = bookmark.description || '';

        setModalState(true);
        nameInput.focus();
    }

    function closeEditBookmarkModal() {
        setModalState(false);
    }

    function bindEvents() {
        modal.addEventListener('click', (event) => {
            if (event.target.closest('[data-close-edit-modal]')) {
                closeEditBookmarkModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('is-open')) {
                closeEditBookmarkModal();
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            if (editingBookmarkId === null) {
                return;
            }

            const nextName = nameInput.value.trim();
            const normalizedUrl = normalizeUrl(urlInput.value);
            const nextDescription = descriptionInput.value.trim();

            if (!nextName || !normalizedUrl) {
                alert('Please provide a valid Name and URL.');
                return;
            }

            const index = bookmarks.findIndex((item) => item.id === editingBookmarkId);
            if (index === -1) {
                return;
            }

            bookmarks[index] = {
                ...bookmarks[index],
                name: nextName,
                url: normalizedUrl,
                description: nextDescription
            };

            saveBookmarks();

            if (typeof filterItems === 'function') {
                filterItems();
            } else {
                renderBookmarks();
            }

            closeEditBookmarkModal();
        });
    }

    async function loadTemplate() {
        const root = document.getElementById('edit-bookmark-modal-root');
        if (!root) {
            return false;
        }

        try {
            const response = await fetch('../src/pages/edit-bookmark-modal.html');
            if (!response.ok) {
                return false;
            }

            root.innerHTML = await response.text();

            modal = document.getElementById('edit-bookmark-modal');
            form = document.getElementById('edit-bookmark-form');
            nameInput = document.getElementById('edit-bookmark-name');
            urlInput = document.getElementById('edit-bookmark-url');
            descriptionInput = document.getElementById('edit-bookmark-description');

            if (!modal || !form || !nameInput || !urlInput || !descriptionInput) {
                return false;
            }

            bindEvents();
            return true;
        } catch (error) {
            return false;
        }
    }

    async function setup() {
        await loadTemplate();
        window.openEditBookmarkModal = openEditBookmarkModal;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
