// Search functionality using Fuse.js
(function() {
  let fuse = null;
  let searchIndex = null;
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchModal = document.getElementById('search-modal');
  const searchButton = document.getElementById('search-button');
  const closeSearchButton = document.getElementById('close-search');
  const searchOverlay = document.getElementById('search-overlay');

  // Get base path from configuration
  function getBasePath() {
    return window.searchConfig?.basePath || '';
  }

  // Determine current language from URL
  function getCurrentLanguage() {
    const path = window.location.pathname;
    if (path.includes('/cn/') || path.endsWith('/cn')) {
      return 'cn';
    }
    return 'en';
  }

  // Load search index
  async function loadSearchIndex() {
    if (searchIndex) return; // Already loaded

    const basePath = getBasePath();
    const lang = getCurrentLanguage();
    // English index is at root, others are in language subdirectories
    const indexUrl = lang === 'en' ? `${basePath}/index.json` : `${basePath}/${lang}/index.json`;

    try {
      const response = await fetch(indexUrl);
      searchIndex = await response.json();

      // Initialize Fuse.js
      const fuseOptions = {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'description', weight: 0.3 },
          { name: 'content', weight: 0.2 },
          { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2
      };

      fuse = new Fuse(searchIndex, fuseOptions);
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
  }

  // Open search modal
  function openSearch() {
    if (searchModal && searchOverlay) {
      searchModal.classList.add('active');
      searchOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Load index and focus input
      loadSearchIndex().then(() => {
        if (searchInput) {
          searchInput.focus();
        }
      });
    }
  }

  // Close search modal
  function closeSearch() {
    if (searchModal && searchOverlay) {
      searchModal.classList.remove('active');
      searchOverlay.classList.remove('active');
      document.body.style.overflow = '';

      // Clear results
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '';
    }
  }

  // Perform search
  function performSearch(query) {
    if (!fuse || !query || query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    const results = fuse.search(query, { limit: 10 });

    if (results.length === 0) {
      const lang = getCurrentLanguage();
      const noResultsText = lang === 'cn' ? '没有找到结果' : 'No results found';
      searchResults.innerHTML = `<div class="search-no-results">${noResultsText}</div>`;
      return;
    }

    // Display results
    const resultsHTML = results.map(result => {
      const item = result.item;
      const excerpt = item.description || item.content.substring(0, 150) + '...';
      const tags = item.tags ? item.tags.join(', ') : '';

      return `
        <a href="${item.permalink}" class="search-result-item">
          <div class="search-result-title">${item.title}</div>
          <div class="search-result-excerpt">${excerpt}</div>
          ${tags ? `<div class="search-result-tags">${tags}</div>` : ''}
        </a>
      `;
    }).join('');

    searchResults.innerHTML = resultsHTML;
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Open search modal
    if (searchButton) {
      searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        openSearch();
      });
    }

    // Close search modal
    if (closeSearchButton) {
      closeSearchButton.addEventListener('click', closeSearch);
    }

    if (searchOverlay) {
      searchOverlay.addEventListener('click', closeSearch);
    }

    // Handle search input
    if (searchInput) {
      const debouncedSearch = debounce((e) => {
        performSearch(e.target.value);
      }, 300);

      searchInput.addEventListener('input', debouncedSearch);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }

      // Escape to close search
      if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
        closeSearch();
      }
    });
  });
})();
