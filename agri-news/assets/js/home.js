/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * home.js - Dynamic Homepage AJAX Render Engine
 */

const HomeEngine = {
  init: function() {
    this.renderSkeletons();
    this.loadFeaturedArticle();
    this.loadSecondaryNews();
    this.loadCategorySections();
  },

  // Skeleton Loaders
  renderSkeletons: function() {
    $('#heroFeaturedLeft').html(`
      <div class="hero-main-card">
        <div class="skeleton-box w-100" style="height: 300px;"></div>
        <div class="p-3">
          <div class="skeleton-box w-25 mb-2" style="height: 18px;"></div>
          <div class="skeleton-box w-75 mb-2" style="height: 24px;"></div>
          <div class="skeleton-box w-100 mb-2" style="height: 16px;"></div>
          <div class="skeleton-box w-50" style="height: 16px;"></div>
        </div>
      </div>
    `);

    $('#heroSecondaryRight').html(`
      <div class="row g-3">
        <div class="col-6"><div class="secondary-news-card"><div class="skeleton-box w-100" style="height: 140px;"></div><div class="p-2"><div class="skeleton-box w-75" style="height: 16px;"></div></div></div></div>
        <div class="col-6"><div class="secondary-news-card"><div class="skeleton-box w-100" style="height: 140px;"></div><div class="p-2"><div class="skeleton-box w-75" style="height: 16px;"></div></div></div></div>
        <div class="col-6"><div class="secondary-news-card"><div class="skeleton-box w-100" style="height: 140px;"></div><div class="p-2"><div class="skeleton-box w-75" style="height: 16px;"></div></div></div></div>
        <div class="col-6"><div class="secondary-news-card"><div class="skeleton-box w-100" style="height: 140px;"></div><div class="p-2"><div class="skeleton-box w-75" style="height: 16px;"></div></div></div></div>
      </div>
    `);
  },

  // Load Main Featured Article (Desktop: 50% Left)
  loadFeaturedArticle: function() {
    AgriData.getArticles().then(function(articles) {
      if (!articles || !articles.length) {
        $('#heroNewsContainer').html('<div class="alert alert-warning">செய்திகள் கிடைக்கவில்லை.</div>');
        return;
      }

      const featured = articles.find(function(a) { return a.featured; }) || articles[0];
      const html = `
        <div class="hero-main-card">
          <a href="article.html?id=${featured.id}" class="hero-img-wrap d-block">
            <img src="${featured.image}" alt="${featured.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
          </a>
          <div class="hero-content">
            <div>
              <a href="category.html?category=${featured.category_slug}" class="category-badge">
                ${featured.category}
              </a>
              <a href="article.html?id=${featured.id}">
                <h2 class="hero-headline">${featured.title}</h2>
              </a>
              <p class="hero-excerpt">${featured.excerpt}</p>
            </div>
            <div class="article-meta">
              <span><i class="far fa-user"></i>${featured.author}</span>
              <span><i class="far fa-calendar-alt"></i>${featured.published_at.split(' ')[0]}</span>
              <span><i class="far fa-clock"></i>${featured.read_time || '3 நிமி'}</span>
              <span class="ms-auto"><i class="far fa-eye"></i>${featured.views} பார்வைகள்</span>
            </div>
          </div>
        </div>
      `;
      $('#heroFeaturedLeft').html(html);
    }).catch(function(err) {
      console.error("Failed to load featured article:", err);
      $('#heroFeaturedLeft').html('<div class="p-4 text-center text-muted">செய்தியை ஏற்றுவதில் சிக்கல்.</div>');
    });
  },

  // Load 4 Secondary News Cards (Desktop: 50% Right)
  loadSecondaryNews: function() {
    AgriData.getArticles().then(function(articles) {
      if (!articles || articles.length < 2) return;
      // Skip featured and get 4 secondary articles
      const secondary = articles.filter(function(a) { return a.id !== 101; }).slice(0, 4);

      let html = '<div class="row g-3">';
      secondary.forEach(function(item) {
        html += `
          <div class="col-sm-6">
            <div class="secondary-news-card">
              <a href="article.html?id=${item.id}" class="secondary-img-wrap d-block">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
              </a>
              <div class="secondary-content">
                <div>
                  <a href="category.html?category=${item.category_slug}" class="category-badge badge-outline">
                    ${item.category}
                  </a>
                  <a href="article.html?id=${item.id}">
                    <h3 class="secondary-headline">${item.title}</h3>
                  </a>
                </div>
                <div class="article-meta mt-2">
                  <span><i class="far fa-calendar-alt"></i>${item.published_at.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
      $('#heroSecondaryRight').html(html);
    });
  },

  // Load Dedicated Category Sections (1 Big + 4 Small)
  loadCategorySections: function() {
    const sections = [
      {
        id: 'agriculture-news',
        title: 'விவசாய செய்திகள் & கொள்கை',
        icon: 'fa-newspaper',
        targetId: 'catSectionAgriNews'
      },
      {
        id: 'government-schemes',
        title: 'அரசுத் திட்டங்கள் & மானியம்',
        icon: 'fa-landmark',
        targetId: 'catSectionSchemes'
      },
      {
        id: 'market-prices',
        title: 'சந்தை விலை & உழவர் சந்தை நிலவரம்',
        icon: 'fa-chart-line',
        targetId: 'catSectionMarket'
      },
      {
        id: 'organic-farming',
        title: 'இயற்கை விவசாயம் & பாரம்பரியம்',
        icon: 'fa-leaf',
        targetId: 'catSectionOrganic'
      },
      {
        id: 'technology',
        title: 'வேளாண் தொழில்நுட்பம் & கருவிகள்',
        icon: 'fa-microchip',
        targetId: 'catSectionTech'
      }
    ];

    AgriData.getArticles().then(function(allArticles) {
      sections.forEach(function(sec) {
        let secArticles = allArticles.filter(function(a) {
          return a.category_slug === sec.id;
        });

        // If category has few articles in demo, pick related ones
        if (secArticles.length < 5) {
          const others = allArticles.filter(function(a) { return a.category_slug !== sec.id; });
          secArticles = secArticles.concat(others).slice(0, 5);
        }

        const bigArticle = secArticles[0];
        const smallArticles = secArticles.slice(1, 5);

        let sectionHtml = `
          <div class="section-block-wrapper my-4">
            <div class="section-header-block">
              <h2 class="section-title"><i class="fas ${sec.icon} me-2"></i>${sec.title}</h2>
              <a href="category.html?category=${sec.id}" class="section-more-link">
                மேலும் செய்திகள் <i class="fas fa-arrow-right"></i>
              </a>
            </div>
            <div class="row g-4">
              <!-- Left: 1 Big Article -->
              <div class="col-lg-5">
                <div class="cat-big-card">
                  <a href="article.html?id=${bigArticle.id}" class="cat-big-img d-block">
                    <img src="${bigArticle.image}" alt="${bigArticle.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
                  </a>
                  <div class="p-3 d-flex flex-column flex-grow-1">
                    <span class="category-badge mb-2">${bigArticle.category}</span>
                    <a href="article.html?id=${bigArticle.id}">
                      <h3 class="fs-5 fw-bold mb-2">${bigArticle.title}</h3>
                    </a>
                    <p class="text-muted small mb-3">${bigArticle.excerpt}</p>
                    <div class="article-meta mt-auto">
                      <span><i class="far fa-user"></i>${bigArticle.author}</span>
                      <span><i class="far fa-calendar-alt"></i>${bigArticle.published_at.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: 4 Small Articles Grid -->
              <div class="col-lg-7">
                <div class="row g-3">
        `;

        smallArticles.forEach(function(small) {
          sectionHtml += `
            <div class="col-sm-6">
              <div class="cat-small-card">
                <a href="article.html?id=${small.id}" class="cat-small-thumb">
                  <img src="${small.image}" alt="${small.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
                </a>
                <div class="cat-small-body">
                  <a href="article.html?id=${small.id}">
                    <h4 class="cat-small-headline">${small.title}</h4>
                  </a>
                  <small class="text-muted"><i class="far fa-clock me-1"></i>${small.published_at.split(' ')[0]}</small>
                </div>
              </div>
            </div>
          `;
        });

        sectionHtml += `
                </div>
              </div>
            </div>
          </div>
        `;

        $('#' + sec.targetId).html(sectionHtml);
      });
    });
  }
};

$(document).ready(function() {
  HomeEngine.init();
});
