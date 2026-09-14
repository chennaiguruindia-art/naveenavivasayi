/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * category.js - Dynamic Category Page Engine with Sorting & Infinite Scroll / Pagination
 */

const CategoryEngine = {
  currentCategorySlug: '',
  allCategoryArticles: [],
  filteredArticles: [],
  currentPage: 1,
  pageSize: 6,
  isLoading: false,
  hasMore: true,
  currentSort: 'latest',

  init: function() {
    const urlParams = new URLSearchParams(window.location.search);
    this.currentCategorySlug = urlParams.get('category') || 'agriculture-news';

    this.loadCategoryHeader();
    this.loadArticles();
    this.initSortFilter();
    this.initInfiniteScroll();
  },

  loadCategoryHeader: function() {
    const self = this;
    AgriData.getCategories().then(function(categories) {
      const cat = categories.find(function(c) { return c.slug === self.currentCategorySlug; }) || {
        name: "அனைத்து செய்திகள்",
        slug: "all",
        icon: "fa-newspaper",
        description: "விவசாய உலகம் சார்ந்த அனைத்து முக்கிய செய்திகள் மற்றும் புதிய தகவல்கள்."
      };

      $('#categoryTitle').html(`<i class="fas ${cat.icon || 'fa-newspaper'} me-2 text-warning"></i>${cat.name}`);
      $('#categoryDescription').text(cat.description || '');
      $('#categoryBreadcrumbActive').text(cat.name);
      document.title = `${cat.name} - உழவர் செய்திகள்`;
    });
  },

  loadArticles: function() {
    const self = this;
    this.isLoading = true;
    $('#categoryArticlesGrid').html(`
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">ஏற்றுகிறது...</span>
        </div>
      </div>
    `);

    AgriData.getArticlesByCategory(this.currentCategorySlug).then(function(articles) {
      // If specific category has few or no articles, fall back to all articles for demonstration
      if (!articles || !articles.length) {
        return AgriData.getArticles();
      }
      return articles;
    }).then(function(articles) {
      self.allCategoryArticles = articles || [];
      self.applySort();
      self.renderFirstBatch();
    });
  },

  applySort: function() {
    if (this.currentSort === 'latest') {
      this.filteredArticles = [...this.allCategoryArticles].sort(function(a, b) {
        return new Date(b.published_at) - new Date(a.published_at);
      });
    } else if (this.currentSort === 'views') {
      this.filteredArticles = [...this.allCategoryArticles].sort(function(a, b) {
        return b.views - a.views;
      });
    } else if (this.currentSort === 'popular') {
      this.filteredArticles = [...this.allCategoryArticles].sort(function(a, b) {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.views - a.views;
      });
    }
  },

  renderFirstBatch: function() {
    this.currentPage = 1;
    this.hasMore = this.filteredArticles.length > this.pageSize;
    $('#categoryArticlesGrid').empty();

    if (!this.filteredArticles.length) {
      $('#categoryArticlesGrid').html(`
        <div class="col-12">
          <div class="empty-state-box">
            <i class="fas fa-seedling empty-state-icon"></i>
            <h4>செய்திகள் எதுவும் கிடைக்கவில்லை</h4>
            <p class="text-muted">இந்த பகுதியில் விரைவில் புதிய செய்திகள் பதிவேற்றப்படும்.</p>
          </div>
        </div>
      `);
      $('#loadMoreContainer').hide();
      return;
    }

    const firstBatch = this.filteredArticles.slice(0, this.pageSize);
    this.appendArticleCards(firstBatch);

    if (this.hasMore) {
      $('#loadMoreContainer').show();
      $('#loadMoreBtn').show().text('மேலும் செய்திகளை ஏற்று');
      $('#loadMoreSpinner').hide();
    } else {
      $('#loadMoreContainer').hide();
    }

    this.isLoading = false;
  },

  appendArticleCards: function(articles) {
    let html = '';
    articles.forEach(function(item) {
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
                <p class="text-muted small mt-2 d-none d-sm-block text-truncate-2">${item.excerpt}</p>
              </div>
              <div class="article-meta mt-auto">
                <span><i class="far fa-user"></i>${item.author}</span>
                <span><i class="far fa-calendar-alt"></i>${item.published_at.split(' ')[0]}</span>
                <span class="ms-auto"><i class="far fa-eye"></i>${item.views}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    $('#categoryArticlesGrid').append(html);
  },

  loadMoreArticles: function() {
    if (this.isLoading || !this.hasMore) return;
    this.isLoading = true;
    $('#loadMoreBtn').hide();
    $('#loadMoreSpinner').show();

    const self = this;
    setTimeout(function() {
      const startIndex = self.currentPage * self.pageSize;
      const nextBatch = self.filteredArticles.slice(startIndex, startIndex + self.pageSize);

      if (nextBatch.length) {
        self.appendArticleCards(nextBatch);
        self.currentPage++;
        self.hasMore = startIndex + self.pageSize < self.filteredArticles.length;
      } else {
        self.hasMore = false;
      }

      self.isLoading = false;
      $('#loadMoreSpinner').hide();
      if (self.hasMore) {
        $('#loadMoreBtn').show();
      } else {
        $('#loadMoreContainer').html('<p class="text-muted small my-3">அனைத்து செய்திகளும் ஏற்றப்பட்டுவிட்டன.</p>');
      }
    }, 400); // realistic AJAX delay
  },

  initSortFilter: function() {
    const self = this;
    $('.category-sort-select').on('change', function() {
      self.currentSort = $(this).val();
      self.applySort();
      self.renderFirstBatch();
    });

    $('#loadMoreBtn').on('click', function() {
      self.loadMoreArticles();
    });
  },

  initInfiniteScroll: function() {
    const self = this;
    $(window).on('scroll', function() {
      if (!self.hasMore || self.isLoading) return;
      const scrollThreshold = $(document).height() - $(window).height() - 400;
      if ($(window).scrollTop() > scrollThreshold) {
        self.loadMoreArticles();
      }
    });
  }
};

$(document).ready(function() {
  CategoryEngine.init();
});
