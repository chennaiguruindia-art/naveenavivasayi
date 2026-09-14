/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * search.js - Dynamic AJAX Search Engine
 */

const SearchEngine = {
  currentQuery: '',
  searchResults: [],

  init: function() {
    const urlParams = new URLSearchParams(window.location.search);
    this.currentQuery = urlParams.get('q') || '';

    $('#searchInputField').val(this.currentQuery);
    this.performSearch(this.currentQuery);
    this.initHandlers();
  },

  initHandlers: function() {
    const self = this;
    $('#searchPageForm').on('submit', function(e) {
      e.preventDefault();
      const q = $('#searchInputField').val().trim();
      self.currentQuery = q;
      // Update URL without reload
      const newUrl = window.location.pathname + (q ? '?q=' + encodeURIComponent(q) : '');
      window.history.pushState({ path: newUrl }, '', newUrl);
      self.performSearch(q);
    });

    // Instant filter as user types (debounced)
    let debounceTimer;
    $('#searchInputField').on('input', function() {
      clearTimeout(debounceTimer);
      const q = $(this).val().trim();
      debounceTimer = setTimeout(function() {
        self.performSearch(q);
      }, 350);
    });
  },

  performSearch: function(query) {
    const self = this;
    const $container = $('#searchResultsGrid');
    const $countText = $('#searchResultCount');

    $container.html(`
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">தேடுகிறது...</span>
        </div>
      </div>
    `);

    AgriData.searchArticles(query).then(function(results) {
      self.searchResults = results || [];

      if (!results || !results.length) {
        $countText.html(`'<strong>${query || ''}</strong>' தொடர்பாக முடிவுகள் எதுவும் கிடைக்கவில்லை`);
        $container.html(`
          <div class="col-12">
            <div class="empty-state-box">
              <i class="fas fa-search-minus empty-state-icon text-muted"></i>
              <h4>பொருத்தமான தகவல்கள் கிடைக்கவில்லை</h4>
              <p class="text-muted">வேறு சில முக்கிய வார்த்தைகளை அல்லது பயிர்களின் பெயரைப் பயன்படுத்தி தேடிப் பார்க்கவும்.</p>
              <div class="d-flex justify-content-center gap-2 mt-3 flex-wrap">
                <a href="search.html?q=நெல்" class="btn btn-outline-success btn-sm">நெல்</a>
                <a href="search.html?q=மானியம்" class="btn btn-outline-success btn-sm">மானியம்</a>
                <a href="search.html?q=தக்காளி" class="btn btn-outline-success btn-sm">தக்காளி</a>
                <a href="search.html?q=இயற்கை" class="btn btn-outline-success btn-sm">இயற்கை விவசாயம்</a>
                <a href="search.html?q=ட்ரோன்" class="btn btn-outline-success btn-sm">ட்ரோன்</a>
              </div>
            </div>
          </div>
        `);
        return;
      }

      if (query) {
        $countText.html(`'<strong>${query}</strong>' குறித்த தேடலில் <strong>${results.length}</strong> செய்திகள் கிடைத்துள்ளன`);
      } else {
        $countText.html(`மொத்தம் <strong>${results.length}</strong> செய்திகள் உள்ளன`);
      }

      let html = '';
      results.forEach(function(item) {
        html += `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="secondary-news-card h-100">
              <a href="article.html?id=${item.id}" class="secondary-img-wrap d-block">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
              </a>
              <div class="secondary-content">
                <div>
                  <span class="category-badge mb-2">${item.category}</span>
                  <a href="article.html?id=${item.id}">
                    <h3 class="secondary-headline">${item.title}</h3>
                  </a>
                  <p class="text-muted small mt-2">${item.excerpt.substring(0, 95)}...</p>
                </div>
                <div class="article-meta mt-auto">
                  <span><i class="far fa-user"></i>${item.author}</span>
                  <span><i class="far fa-calendar-alt"></i>${item.published_at.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      $container.html(html);
    });
  }
};

$(document).ready(function() {
  SearchEngine.init();
});
