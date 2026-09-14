/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * common.js - Shared Utilities, AJAX Data Layer, Global Handlers
 */

const AgriData = {
  baseUrl: 'api/data/',
  
  // Cache for loaded data
  cache: {
    articles: null,
    categories: null,
    latestNews: null,
    popularNews: null
  },

  // Generic AJAX Fetcher
  fetchJson: function(fileName) {
    return $.ajax({
      url: this.baseUrl + fileName,
      type: 'GET',
      dataType: 'json',
      cache: false
    }).catch(function(err) {
      console.warn('AJAX fetch failed for ' + fileName + ', using fallback store if available.', err);
      // Fallback in case local file:// security prevents fetch
      return AgriData.getFallback(fileName);
    });
  },

  // Get all articles
  getArticles: function() {
    if (this.cache.articles) {
      return $.Deferred().resolve(this.cache.articles).promise();
    }
    return this.fetchJson('articles.json').then(function(data) {
      AgriData.cache.articles = data;
      return data;
    });
  },

  // Get article by ID
  getArticleById: function(id) {
    return this.getArticles().then(function(articles) {
      const targetId = parseInt(id, 10);
      return articles.find(function(a) { return a.id === targetId; }) || null;
    });
  },

  // Get categories
  getCategories: function() {
    if (this.cache.categories) {
      return $.Deferred().resolve(this.cache.categories).promise();
    }
    return this.fetchJson('categories.json').then(function(data) {
      AgriData.cache.categories = data;
      return data;
    });
  },

  // Get latest news ticker & list (with Live Tamil Agri News integration)
  getLatestNews: function() {
    if (this.cache.latestNews) {
      return $.Deferred().resolve(this.cache.latestNews).promise();
    }
    return this.fetchJson('latest-news.json').then(function(data) {
      AgriData.cache.latestNews = data;
      return data;
    });
  },

  // Fetch Live Real-Time Tamil Agriculture News from Google News RSS Feed
  getLiveTamilAgriNews: function() {
    const rssFeedUrl = 'https://news.google.com/rss/search?q=விவசாயம்+தமிழ்நாடு&hl=ta&gl=IN&ceid=IN:ta';
    const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssFeedUrl);

    return $.ajax({
      url: apiUrl,
      type: 'GET',
      dataType: 'json',
      cache: false,
      timeout: 6000 // 6 second timeout
    }).then(function(response) {
      if (response && response.status === 'ok' && response.items && response.items.length > 0) {
        return response.items.map(function(item, index) {
          // Extract source publication from title (e.g. "... - Dinamalar")
          let cleanTitle = item.title;
          let source = 'செய்தி ஆதாரம்';
          if (item.title.includes(' - ')) {
            const parts = item.title.split(' - ');
            source = parts.pop();
            cleanTitle = parts.join(' - ');
          }

          // Format relative time or clean date
          let timeDisplay = 'நேரலை';
          try {
            const pubDate = new Date(item.pubDate);
            const diffHours = Math.round((new Date() - pubDate) / (1000 * 60 * 60));
            if (diffHours > 0 && diffHours < 24) {
              timeDisplay = diffHours + ' மணி நேரத்திற்கு முன்';
            } else if (diffHours >= 24) {
              timeDisplay = Math.round(diffHours / 24) + ' நாட்களுக்கு முன்';
            } else {
              timeDisplay = 'சமீபத்தியது (Live)';
            }
          } catch(e) {}

          return {
            id: 2000 + index,
            article_id: 101, // fallback link or external
            link: item.link,
            isExternal: true,
            title: cleanTitle,
            source: source,
            time: timeDisplay,
            timestamp: item.pubDate,
            category: "நேரலை விவசாயச் செய்தி",
            category_slug: "agriculture-news",
            views: "Live",
            isLive: true,
            badge: "🔴 நேரலை"
          };
        });
      }
      return AgriData.getLatestNews();
    }).catch(function(err) {
      console.warn("Live Tamil RSS fetch timed out or offline, using fallback news data.", err);
      return AgriData.getLatestNews();
    });
  },

  // Get live weather for Tamil Nadu district via Open-Meteo Free API
  getLiveWeather: function(districtKey) {
    const coords = {
      'thanjavur': { name: 'தஞ்சாவூர்', lat: 10.7870, lon: 79.1378 },
      'chennai': { name: 'சென்னை', lat: 13.0827, lon: 80.2707 },
      'madurai': { name: 'மதுரை', lat: 9.9252, lon: 78.1198 },
      'coimbatore': { name: 'கோயம்புத்தூர்', lat: 11.0168, lon: 76.9558 },
      'trichy': { name: 'திருச்சிராப்பள்ளி', lat: 10.7905, lon: 78.7047 }
    };

    const target = coords[districtKey] || coords['thanjavur'];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m`;

    return $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      timeout: 5000
    }).then(function(res) {
      const cur = res.current;
      const temp = Math.round(cur.temperature_2m) + '°C';
      const humidity = Math.round(cur.relative_humidity_2m) + '%';
      const rainChance = cur.precipitation > 0 ? (cur.precipitation * 20) + '%' : '10%';
      let condition = 'மிதமான வெயில்';
      let icon = 'fa-sun';

      // Weather code mappings
      if (cur.weather_code >= 51 && cur.weather_code <= 67) {
        condition = 'மழை பொழிவு';
        icon = 'fa-cloud-showers-heavy';
      } else if (cur.weather_code >= 1 && cur.weather_code <= 3) {
        condition = 'மேகமூட்டம்';
        icon = 'fa-cloud-sun';
      } else if (cur.weather_code >= 80) {
        condition = 'கனமழை வாய்ப்பு';
        icon = 'fa-cloud-rain';
      }

      return {
        city: target.name,
        temp: temp,
        condition: condition,
        icon: icon,
        humidity: humidity,
        rainChance: rainChance,
        isLive: true
      };
    }).catch(function() {
      // Fallback in case offline
      return {
        city: target.name,
        temp: '32°C',
        condition: 'மிதமான வெயில்',
        icon: 'fa-sun',
        humidity: '68%',
        rainChance: '15%',
        isLive: false
      };
    });
  },

  // Get popular news
  getPopularNews: function() {
    if (this.cache.popularNews) {
      return $.Deferred().resolve(this.cache.popularNews).promise();
    }
    return this.fetchJson('popular-news.json').then(function(data) {
      AgriData.cache.popularNews = data;
      return data;
    });
  },

  // Filter articles by category slug
  getArticlesByCategory: function(categorySlug) {
    return this.getArticles().then(function(articles) {
      if (!categorySlug || categorySlug === 'all') return articles;
      return articles.filter(function(a) {
        return a.category_slug === categorySlug;
      });
    });
  },

  // Search articles by query
  searchArticles: function(query) {
    const q = (query || '').toLowerCase().trim();
    return this.getArticles().then(function(articles) {
      if (!q) return articles;
      return articles.filter(function(a) {
        const inTitle = a.title.toLowerCase().includes(q);
        const inExcerpt = (a.excerpt || '').toLowerCase().includes(q);
        const inCategory = (a.category || '').toLowerCase().includes(q);
        const inAuthor = (a.author || '').toLowerCase().includes(q);
        const inTags = (a.tags || []).some(function(t) { return t.toLowerCase().includes(q); });
        return inTitle || inExcerpt || inCategory || inAuthor || inTags;
      });
    });
  },

  // Fallback data if file:// protocol blocks local XMLHttpRequest
  getFallback: function(fileName) {
    if (fileName === 'categories.json') {
      return [
        { id: 1, name: "விவசாய செய்திகள்", slug: "agriculture-news", icon: "fa-newspaper" },
        { id: 2, name: "நெல் சாகுபடி", slug: "paddy", icon: "fa-seedling" },
        { id: 3, name: "காய்கறிகள் & பழங்கள்", slug: "horticulture", icon: "fa-carrot" },
        { id: 4, name: "இயற்கை விவசாயம்", slug: "organic-farming", icon: "fa-leaf" },
        { id: 5, name: "அரசுத் திட்டங்கள்", slug: "government-schemes", icon: "fa-landmark" },
        { id: 6, name: "சந்தை விலை", slug: "market-prices", icon: "fa-chart-line" },
        { id: 7, name: "வானிலை", slug: "weather", icon: "fa-cloud-sun-rain" },
        { id: 8, name: "வேளாண் தொழில்நுட்பம்", slug: "technology", icon: "fa-microchip" },
        { id: 9, name: "கால்நடை & மீன்வளம்", slug: "livestock", icon: "fa-cow" },
        { id: 10, name: "இயந்திரங்கள்", slug: "machinery", icon: "fa-tractor" }
      ];
    }
    return [];
  }
};

/* -------------------------------------------------------------
   Common App Utilities
   ------------------------------------------------------------- */
const AppUtils = {
  // Format Tamil Date
  renderCurrentDate: function() {
    const days = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const months = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const formatted = `${dayName}, ${dateNum} ${monthName} ${year}`;
    $('#currentTamilDate').text(formatted);
  },

  // Initialize Dark Mode
  initDarkMode: function() {
    const savedTheme = localStorage.getItem('uzhavar_theme') || 'light';
    $('html').attr('data-bs-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    $(document).on('click', '.theme-toggle-btn', function() {
      const current = $('html').attr('data-bs-theme');
      const next = (current === 'dark') ? 'light' : 'dark';
      $('html').attr('data-bs-theme', next);
      localStorage.setItem('uzhavar_theme', next);
      AppUtils.updateThemeIcon(next);
    });
  },

  updateThemeIcon: function(theme) {
    if (theme === 'dark') {
      $('.theme-toggle-btn i').removeClass('fa-moon').addClass('fa-sun');
      $('.theme-toggle-text').text('பகல் முறை');
    } else {
      $('.theme-toggle-btn i').removeClass('fa-sun').addClass('fa-moon');
      $('.theme-toggle-text').text('இரவு முறை');
    }
  },

  // Font Size Resizer
  initFontSize: function() {
    const sizes = ['font-sm', 'font-md', 'font-lg', 'font-xl'];
    let currentIdx = parseInt(localStorage.getItem('uzhavar_font_size') || '1', 10);
    $('body').removeClass(sizes.join(' ')).addClass(sizes[currentIdx]);

    $('#fontIncreaseBtn').on('click', function() {
      if (currentIdx < sizes.length - 1) {
        currentIdx++;
        $('body').removeClass(sizes.join(' ')).addClass(sizes[currentIdx]);
        localStorage.setItem('uzhavar_font_size', currentIdx);
      }
    });

    $('#fontDecreaseBtn').on('click', function() {
      if (currentIdx > 0) {
        currentIdx--;
        $('body').removeClass(sizes.join(' ')).addClass(sizes[currentIdx]);
        localStorage.setItem('uzhavar_font_size', currentIdx);
      }
    });

    $('#fontResetBtn').on('click', function() {
      currentIdx = 1;
      $('body').removeClass(sizes.join(' ')).addClass(sizes[currentIdx]);
      localStorage.setItem('uzhavar_font_size', currentIdx);
    });
  },

  // Bookmarking System
  bookmarks: {
    getAll: function() {
      try {
        return JSON.parse(localStorage.getItem('uzhavar_bookmarks') || '[]');
      } catch (e) {
        return [];
      }
    },
    isBookmarked: function(id) {
      const list = this.getAll();
      return list.includes(parseInt(id, 10));
    },
    toggle: function(id) {
      const intId = parseInt(id, 10);
      let list = this.getAll();
      let added = false;
      if (list.includes(intId)) {
        list = list.filter(function(item) { return item !== intId; });
      } else {
        list.push(intId);
        added = true;
      }
      localStorage.setItem('uzhavar_bookmarks', JSON.stringify(list));
      this.updateCounter();
      return added;
    },
    updateCounter: function() {
      const count = this.getAll().length;
      $('.bookmark-count-badge').text(count);
    }
  },

  // Toast Notification
  showToast: function(message, icon) {
    icon = icon || 'fa-check-circle';
    let $toast = $('#globalAppToast');
    if (!$toast.length) {
      $('body').append(`
        <div id="globalAppToast" class="toast align-items-center text-white bg-dark border-0 position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow-lg" role="alert" style="z-index: 9999; border-radius: 30px;">
          <div class="d-flex px-3 py-2">
            <div class="toast-body d-flex align-items-center gap-2">
              <i class="fas ${icon} text-success fs-5"></i>
              <span id="globalToastText" class="fw-semibold"></span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
          </div>
        </div>
      `);
      $toast = $('#globalAppToast');
    }
    $('#globalToastText').text(message);
    const bsToast = new bootstrap.Toast($toast[0], { delay: 2800 });
    bsToast.show();
  },

  // Back to Top Button
  initBackToTop: function() {
    const $btn = $('#backToTopBtn');
    $(window).on('scroll', function() {
      if ($(window).scrollTop() > 300) {
        $btn.fadeIn(200);
      } else {
        $btn.fadeOut(200);
      }
    });
    $btn.on('click', function(e) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: 0 }, 300);
    });
  },

  // Reading Progress Bar
  initReadingProgressBar: function() {
    const $bar = $('#readingProgressBar');
    if (!$bar.length) return;
    $(window).on('scroll', function() {
      const docHeight = $(document).height() - $(window).height();
      const scrollPos = $(window).scrollTop();
      const percent = docHeight > 0 ? (scrollPos / docHeight) * 100 : 0;
      $bar.css('width', percent + '%');
    });
  }
};

// Global Initialization
$(document).ready(function() {
  AppUtils.renderCurrentDate();
  AppUtils.initDarkMode();
  AppUtils.initFontSize();
  AppUtils.initBackToTop();
  AppUtils.initReadingProgressBar();
  AppUtils.bookmarks.updateCounter();

  // Highlight active nav item based on current URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const urlParams = new URLSearchParams(window.location.search);
  const catSlug = urlParams.get('category');

  $('.category-nav-link').each(function() {
    const href = $(this).attr('href');
    if (catSlug && href.includes('category=' + catSlug)) {
      $('.category-nav-link').removeClass('active');
      $(this).addClass('active');
    } else if (!catSlug && href.includes(currentPath)) {
      $(this).addClass('active');
    }
  });
});
