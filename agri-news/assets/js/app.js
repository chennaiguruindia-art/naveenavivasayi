/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * app.js - Global UI Components, Sidebar Widgets, Breaking News Ticker
 */

const App = {
  init: function() {
    this.initBreakingTicker();
    this.initSidebarWidgets();
    this.initSearchHandlers();
    this.initNewsletterForm();
    this.initBookmarkModal();
    this.startLiveAutoRefresh();
  },

  // Auto-refresh Live Tamil Agri News in background every 45 seconds
  startLiveAutoRefresh: function() {
    const self = this;
    setInterval(function() {
      console.log('🔄 Auto-fetching Live Tamil Agri News...');
      self.initBreakingTicker();
      self.renderSidebarLatestNews();
    }, 45000); // 45 seconds polling
  },

  // Breaking News Ticker (Live Tamil Agri News Stream)
  initBreakingTicker: function() {
    const $tickerContainer = $('#breakingTickerItems');
    if (!$tickerContainer.length) return;

    AgriData.getLiveTamilAgriNews().then(function(newsItems) {
      if (!newsItems || !newsItems.length) return;
      let html = '';
      newsItems.forEach(function(item) {
        const isExt = item.isExternal;
        const targetAttr = isExt ? 'target="_blank" rel="noopener"' : '';
        const linkHref = isExt ? item.link : `article.html?id=${item.article_id || item.id}`;
        const liveBadge = item.isLive ? '<span class="badge bg-danger ms-1 me-2 py-1 px-2" style="font-size:0.68rem; letter-spacing:0.5px; animation: pulseRed 1.5s infinite;">🔴 நேரலை</span>' : '<i class="fas fa-bullhorn ticker-bullet"></i>';

        html += `
          <a href="${linkHref}" ${targetAttr} class="ticker-item">
            ${liveBadge}${item.title} <span class="text-success small fw-normal ms-1">(${item.source || 'செய்தி'})</span>
          </a>
        `;
      });
      $tickerContainer.html(html);
    });
  },

  // Sidebar Widgets
  initSidebarWidgets: function() {
    this.renderSidebarLatestNews();
    this.renderSidebarMostRead();
    this.renderSidebarMarketPrices();
    this.renderSidebarWeather();
  },

  // Sidebar: Latest & Live Tamil Agri News List
  renderSidebarLatestNews: function() {
    const $list = $('#sidebarLatestNewsList');
    if (!$list.length) return;

    AgriData.getLiveTamilAgriNews().then(function(items) {
      if (!items || !items.length) {
        $list.html('<li class="text-muted small">செய்திகள் இல்லை</li>');
        return;
      }
      let html = '';
      items.slice(0, 6).forEach(function(item) {
        const isExt = item.isExternal;
        const targetAttr = isExt ? 'target="_blank" rel="noopener"' : '';
        const linkHref = isExt ? item.link : `article.html?id=${item.article_id || item.id}`;
        const sourceBadge = item.source ? `<span class="badge bg-success-subtle text-success small border border-success-subtle">${item.source}</span>` : '';

        html += `
          <li class="latest-news-item">
            <div class="d-flex flex-column w-100">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="latest-news-time"><i class="far fa-clock me-1"></i>${item.time}</span>
                ${sourceBadge}
              </div>
              <a href="${linkHref}" ${targetAttr} class="latest-news-title">
                ${item.title}
              </a>
            </div>
          </li>
        `;
      });
      $list.html(html);
    });
  },

  // Sidebar: Most Read 01 to 05 Ranking
  renderSidebarMostRead: function() {
    const $list = $('#sidebarMostReadList');
    if (!$list.length) return;

    AgriData.getPopularNews().then(function(items) {
      if (!items || !items.length) {
        $list.html('<li class="text-muted small">தகவல் இல்லை</li>');
        return;
      }
      let html = '';
      items.slice(0, 5).forEach(function(item, idx) {
        const rankNum = (idx + 1).toString().padStart(2, '0');
        html += `
          <li class="most-read-item">
            <span class="most-read-rank">${rankNum}</span>
            <div class="d-flex flex-column flex-grow-1">
              <a href="article.html?id=${item.id}" class="most-read-title">
                ${item.title}
              </a>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="badge bg-success-subtle text-success border border-success-subtle small">${item.category}</span>
                <span class="most-read-views"><i class="far fa-eye me-1"></i>${item.views}</span>
              </div>
            </div>
          </li>
        `;
      });
      $list.html(html);
    });
  },

  // Sidebar: Agriculture Market Prices
  renderSidebarMarketPrices: function() {
    const $container = $('#sidebarMarketPriceBody');
    if (!$container.length) return;

    const marketData = [
      { crop: 'நெல் (குவிண்டால்)', price: '₹2,450', trend: 'up', change: '+₹50' },
      { crop: 'தக்காளி (கிலோ)', price: '₹25', trend: 'down', change: '-₹10' },
      { crop: 'சின்ன வெங்காயம்', price: '₹55', trend: 'same', change: '0' },
      { crop: 'பச்சை மிளகாய்', price: '₹40', trend: 'down', change: '-₹5' },
      { crop: 'வாழைத்தார் (பூவன்)', price: '₹380', trend: 'up', change: '+₹20' },
      { crop: 'மஞ்சள் (குவிண்டால்)', price: '₹14,200', trend: 'up', change: '+₹150' },
      { crop: 'பருத்தி (குவிண்டால்)', price: '₹7,800', trend: 'same', change: '0' }
    ];

    let html = '';
    marketData.forEach(function(item) {
      let badge = `<span class="badge bg-secondary-subtle text-secondary small">நிலையானது</span>`;
      if (item.trend === 'up') {
        badge = `<span class="badge bg-success-subtle text-success small"><i class="fas fa-arrow-up me-1"></i>${item.change}</span>`;
      } else if (item.trend === 'down') {
        badge = `<span class="badge bg-danger-subtle text-danger small"><i class="fas fa-arrow-down me-1"></i>${item.change}</span>`;
      }

      html += `
        <tr>
          <td class="fw-semibold">${item.crop}</td>
          <td class="fw-bold text-success">${item.price}</td>
          <td class="text-end">${badge}</td>
        </tr>
      `;
    });
    $container.html(html);
  },

  // Sidebar: Weather Widget with District Selector (Live Open-Meteo API)
  renderSidebarWeather: function() {
    const $weatherBox = $('#sidebarWeatherBox');
    if (!$weatherBox.length) return;

    function updateWeather(cityKey) {
      $weatherBox.html(`
        <div class="weather-card-box text-center py-4">
          <div class="spinner-border spinner-border-sm text-light mb-2" role="status"></div>
          <div class="small text-white-50">வானிலை தகவல் பெறப்படுகிறது...</div>
        </div>
      `);

      AgriData.getLiveWeather(cityKey).then(function(data) {
        const liveBadge = data.isLive ? '<span class="badge bg-danger text-white ms-1" style="font-size:0.65rem;">நேரலை</span>' : '';
        $weatherBox.html(`
          <div class="weather-card-box">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 class="fw-bold mb-0 text-white"><i class="fas fa-map-marker-alt me-1 text-warning"></i>${data.city} ${liveBadge}</h5>
                <small class="text-white-50">${data.condition}</small>
              </div>
              <select id="weatherDistrictSelect" class="form-select form-select-sm bg-white text-dark w-auto">
                <option value="thanjavur" ${cityKey === 'thanjavur' ? 'selected' : ''}>தஞ்சாவூர்</option>
                <option value="chennai" ${cityKey === 'chennai' ? 'selected' : ''}>சென்னை</option>
                <option value="madurai" ${cityKey === 'madurai' ? 'selected' : ''}>மதுரை</option>
                <option value="coimbatore" ${cityKey === 'coimbatore' ? 'selected' : ''}>கோவை</option>
                <option value="trichy" ${cityKey === 'trichy' ? 'selected' : ''}>திருச்சி</option>
              </select>
            </div>
            <div class="d-flex align-items-center justify-content-between my-3">
              <span class="weather-temp-main">${data.temp}</span>
              <i class="fas ${data.icon} fa-3x text-warning"></i>
            </div>
            <div class="d-flex justify-content-between text-white small border-top border-white-50 pt-2">
              <span><i class="fas fa-tint me-1"></i>ஈரப்பதம்: ${data.humidity}</span>
              <span><i class="fas fa-cloud-showers-heavy me-1"></i>மழை வாய்ப்பு: ${data.rainChance}</span>
            </div>
          </div>
        `);

        $('#weatherDistrictSelect').off('change').on('change', function() {
          updateWeather($(this).val());
        });
      });
    }

    updateWeather('thanjavur');
  },

  // Search Inputs
  initSearchHandlers: function() {
    $(document).on('submit', '.global-search-form', function(e) {
      e.preventDefault();
      const query = $(this).find('input[name="q"]').val();
      if (query && query.trim()) {
        window.location.href = 'search.html?q=' + encodeURIComponent(query.trim());
      }
    });
  },

  // Newsletter form submission
  initNewsletterForm: function() {
    $(document).on('submit', '#newsletterForm, #footerNewsletterForm', function(e) {
      e.preventDefault();
      const $input = $(this).find('input[type="email"]');
      const email = $input.val();
      if (email && email.includes('@')) {
        AppUtils.showToast('செய்திமடலுக்கு நன்றி! பதிவு வெற்றிகரமாக முடிந்தது.', 'fa-envelope-circle-check');
        $input.val('');
      } else {
        AppUtils.showToast('சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.', 'fa-triangle-exclamation');
      }
    });
  },

  // Bookmarks Modal
  initBookmarkModal: function() {
    $(document).on('click', '#openBookmarksModalBtn, .open-bookmarks-link', function(e) {
      e.preventDefault();
      const modalHtml = `
        <div class="modal fade" id="bookmarksModal" tabindex="-1" aria-labelledby="bookmarksModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow">
              <div class="modal-header bg-success text-white">
                <h5 class="modal-title fw-bold" id="bookmarksModalLabel"><i class="fas fa-bookmark me-2"></i>சேமிக்கப்பட்ட கட்டுரைகள்</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="bookmarksModalBody">
                <div class="text-center py-4"><div class="spinner-border text-success" role="status"></div></div>
              </div>
            </div>
          </div>
        </div>
      `;
      $('#bookmarksModal').remove();
      $('body').append(modalHtml);
      const modal = new bootstrap.Modal(document.getElementById('bookmarksModal'));
      modal.show();

      const bookmarkIds = AppUtils.bookmarks.getAll();
      const $body = $('#bookmarksModalBody');

      if (!bookmarkIds.length) {
        $body.html(`
          <div class="text-center py-5 text-muted">
            <i class="far fa-bookmark fa-3x mb-3 text-secondary"></i>
            <h6>சேமிக்கப்பட்ட கட்டுரைகள் ஏதுமில்லை</h6>
            <p class="small">கட்டுரைகளில் உள்ள புக்மார்க் பொத்தானை அழுத்தி பின்னர் படிக்க சேமிக்கலாம்.</p>
          </div>
        `);
        return;
      }

      AgriData.getArticles().then(function(articles) {
        const saved = articles.filter(function(a) { return bookmarkIds.includes(a.id); });
        if (!saved.length) {
          $body.html('<div class="text-center py-4 text-muted">கட்டுரைகள் காணப்படவில்லை.</div>');
          return;
        }
        let listHtml = '<ul class="list-group list-group-flush">';
        saved.forEach(function(item) {
          listHtml += `
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
              <div>
                <a href="article.html?id=${item.id}" class="fw-bold text-dark text-decoration-none hover-green d-block">
                  ${item.title}
                </a>
                <small class="text-muted"><i class="far fa-clock me-1"></i>${item.published_at.split(' ')[0]}</small>
              </div>
              <button class="btn btn-sm btn-outline-danger remove-bookmark-btn ms-2" data-id="${item.id}" title="நீக்கு">
                <i class="fas fa-trash-alt"></i>
              </button>
            </li>
          `;
        });
        listHtml += '</ul>';
        $body.html(listHtml);

        $('.remove-bookmark-btn').on('click', function() {
          const id = $(this).data('id');
          AppUtils.bookmarks.toggle(id);
          $(this).closest('li').fadeOut(200, function() {
            $(this).remove();
            if ($('#bookmarksModalBody li').length === 0) {
              $('#bookmarksModalBody').html('<div class="text-center py-4 text-muted">சேமிக்கப்பட்ட கட்டுரைகள் ஏதுமில்லை</div>');
            }
          });
        });
      });
    });
  }
};

$(document).ready(function() {
  App.init();
});
