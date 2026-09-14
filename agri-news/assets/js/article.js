/**
 * UZHAVAR SEITHIGAL - AGRICULTURE NEWS PORTAL
 * article.js - Dynamic Article Details Engine
 */

const ArticleEngine = {
  currentArticle: null,

  init: function() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id') || '101';

    this.loadArticle(articleId);
    this.initCommentHandler();
  },

  loadArticle: function(id) {
    const self = this;
    AgriData.getArticleById(id).then(function(article) {
      if (!article) {
        $('#articleMainContainer').html(`
          <div class="empty-state-box">
            <i class="fas fa-file-excel empty-state-icon text-danger"></i>
            <h3>கட்டுரை காணப்படவில்லை</h3>
            <p class="text-muted">நீங்கள் தேடிய கட்டுரை நீக்கப்பட்டிருக்கலாம் அல்லது தவறான முகவரியாக இருக்கலாம்.</p>
            <a href="index.html" class="btn btn-success mt-2">முகப்பிற்கு திரும்புக</a>
          </div>
        `);
        return;
      }

      self.currentArticle = article;
      self.renderArticle(article);
      self.injectJsonLd(article);
      self.loadRelatedArticles(article);
      self.loadPrevNext(article.id);
    }).catch(function(err) {
      console.error("Error loading article:", err);
      $('#articleMainContainer').html('<div class="alert alert-danger">கட்டுரையை ஏற்றுவதில் பிழை ஏற்பட்டது.</div>');
    });
  },

  renderArticle: function(a) {
    // Update Page Title and Meta
    document.title = `${a.title} - உழவர் செய்திகள்`;
    $('meta[name="description"]').attr('content', a.excerpt);

    // Breadcrumbs
    $('#articleBreadcrumb').html(`
      <li class="breadcrumb-item"><a href="index.html">முகப்பு</a></li>
      <li class="breadcrumb-item"><a href="category.html?category=${a.category_slug}">${a.category}</a></li>
      <li class="breadcrumb-item active" aria-current="page">${a.title.substring(0, 35)}...</li>
    `);

    // Category Badge & Title
    $('#articleCategoryBadge').html(`<a href="category.html?category=${a.category_slug}" class="category-badge">${a.category}</a>`);
    $('#articleTitle').text(a.title);

    // Meta Info
    $('#articleAuthorName').text(a.author);
    $('#articleAuthorRole').text(a.author_role || 'வேளாண் செய்தியாளர்');
    $('#articleAuthorAvatar').attr('src', a.author_avatar || 'assets/images/placeholders/author-avatar.svg');
    $('#articlePublishedDate').html(`<i class="far fa-calendar-alt me-1"></i>வெளியிடப்பட்டது: ${a.published_at}`);
    if (a.updated_at) {
      $('#articleUpdatedDate').html(`<i class="far fa-edit me-1"></i>புதுப்பிக்கப்பட்டது: ${a.updated_at}`);
    }
    $('#articleViewsCount').html(`<i class="far fa-eye me-1"></i>${a.views} பார்வைகள்`);
    $('#articleReadTime').html(`<i class="far fa-clock me-1"></i>${a.read_time || '4 நிமிடம்'}`);

    // Featured Image
    $('#articleImage').attr('src', a.image);
    $('#articleImage').attr('alt', a.title);
    $('#articleCaption').text(a.title);

    // Body Content
    $('#articleBodyContent').html(a.content);

    // Tags
    if (a.tags && a.tags.length) {
      let tagsHtml = '<span class="fw-bold me-2 align-self-center"><i class="fas fa-tags me-1"></i>குறிச்சொற்கள்:</span>';
      a.tags.forEach(function(tag) {
        tagsHtml += `<a href="search.html?q=${encodeURIComponent(tag)}" class="tag-badge">#${tag}</a>`;
      });
      $('#articleTagsContainer').html(tagsHtml);
    } else {
      $('#articleTagsContainer').hide();
    }

    // Setup Bookmark State
    this.setupBookmarkBtn(a.id);

    // Setup Social Share URLs
    this.setupSocialShare(a);

    // Setup Image Lightbox Trigger
    $('#articleImage').on('click', function() {
      ArticleEngine.openLightbox($(this).attr('src'), a.title);
    });
  },

  setupBookmarkBtn: function(id) {
    const $btn = $('#articleBookmarkBtn');
    const isSaved = AppUtils.bookmarks.isBookmarked(id);
    if (isSaved) {
      $btn.addClass('bookmarked').html('<i class="fas fa-bookmark text-warning"></i>');
    } else {
      $btn.removeClass('bookmarked').html('<i class="far fa-bookmark"></i>');
    }

    $btn.off('click').on('click', function(e) {
      e.preventDefault();
      const added = AppUtils.bookmarks.toggle(id);
      if (added) {
        $btn.addClass('bookmarked').html('<i class="fas fa-bookmark text-warning"></i>');
        AppUtils.showToast('கட்டுரை புக்மார்க் செய்யப்பட்டது!', 'fa-bookmark');
      } else {
        $btn.removeClass('bookmarked').html('<i class="far fa-bookmark"></i>');
        AppUtils.showToast('புக்மார்க் நீக்கப்பட்டது.', 'fa-trash');
      }
    });

    // Print Button
    $('#articlePrintBtn').off('click').on('click', function() {
      window.print();
    });
  },

  setupSocialShare: function(a) {
    const currentUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(a.title);

    $('#shareWhatsApp').attr('href', `https://api.whatsapp.com/send?text=${title}%20${currentUrl}`);
    $('#shareFacebook').attr('href', `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`);
    $('#shareTwitter').attr('href', `https://twitter.com/intent/tweet?text=${title}&url=${currentUrl}`);
    $('#shareTelegram').attr('href', `https://t.me/share/url?url=${currentUrl}&text=${title}`);

    $('#shareCopyLink').off('click').on('click', function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href).then(function() {
        AppUtils.showToast('கட்டுரை இணைப்பு நகலெடுக்கப்பட்டது!', 'fa-copy');
      }).catch(function() {
        AppUtils.showToast('நகலெடுக்க முடியவில்லை.', 'fa-triangle-exclamation');
      });
    });
  },

  openLightbox: function(imgSrc, title) {
    let $modal = $('#imageLightboxModal');
    if (!$modal.length) {
      $('body').append(`
        <div class="modal fade" id="imageLightboxModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content bg-transparent border-0">
              <div class="modal-body p-0 text-center position-relative">
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" style="z-index: 10;"></button>
                <img id="lightboxImg" src="" class="img-fluid rounded shadow-lg" alt="">
                <p id="lightboxCaption" class="text-white mt-2 bg-dark bg-opacity-75 py-2 px-3 rounded d-inline-block small"></p>
              </div>
            </div>
          </div>
        </div>
      `);
      $modal = $('#imageLightboxModal');
    }
    $('#lightboxImg').attr('src', imgSrc);
    $('#lightboxCaption').text(title);
    const bsModal = new bootstrap.Modal(document.getElementById('imageLightboxModal'));
    bsModal.show();
  },

  loadPrevNext: function(currentId) {
    AgriData.getArticles().then(function(articles) {
      const idx = articles.findIndex(function(a) { return a.id === currentId; });
      const prev = idx > 0 ? articles[idx - 1] : null;
      const next = idx < articles.length - 1 ? articles[idx + 1] : null;

      let html = '';
      if (prev) {
        html += `
          <a href="article.html?id=${prev.id}" class="prev-next-card text-decoration-none">
            <span class="small text-muted d-block"><i class="fas fa-chevron-left me-1"></i>முந்தைய செய்தி</span>
            <span class="fw-bold text-dark d-block mt-1 text-truncate">${prev.title}</span>
          </a>
        `;
      } else {
        html += `<div></div>`;
      }

      if (next) {
        html += `
          <a href="article.html?id=${next.id}" class="prev-next-card text-decoration-none text-end">
            <span class="small text-muted d-block">அடுத்த செய்தி<i class="fas fa-chevron-right ms-1"></i></span>
            <span class="fw-bold text-dark d-block mt-1 text-truncate">${next.title}</span>
          </a>
        `;
      }

      $('#articlePrevNextContainer').html(html);
    });
  },

  loadRelatedArticles: function(current) {
    AgriData.getArticles().then(function(articles) {
      const related = articles.filter(function(a) {
        return a.id !== current.id && (a.category_slug === current.category_slug || a.tags.some(function(t) { return current.tags.includes(t); }));
      }).slice(0, 3);

      if (!related.length) {
        $('#relatedArticlesSection').hide();
        return;
      }

      let html = '';
      related.forEach(function(item) {
        html += `
          <div class="col-md-4">
            <div class="secondary-news-card h-100">
              <a href="article.html?id=${item.id}" class="secondary-img-wrap d-block">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/images/placeholders/placeholder-article.svg'" loading="lazy">
              </a>
              <div class="secondary-content">
                <span class="category-badge badge-outline mb-1">${item.category}</span>
                <a href="article.html?id=${item.id}">
                  <h4 class="secondary-headline">${item.title}</h4>
                </a>
                <div class="article-meta mt-auto">
                  <span><i class="far fa-calendar-alt"></i>${item.published_at.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      $('#relatedArticlesGrid').html(html);
    });
  },

  initCommentHandler: function() {
    $('#commentForm').on('submit', function(e) {
      e.preventDefault();
      const name = $('#commentAuthor').val().trim();
      const comment = $('#commentText').val().trim();

      if (!name || !comment) {
        AppUtils.showToast('பெயர் மற்றும் கருத்தை உள்ளிடவும்.', 'fa-exclamation-circle');
        return;
      }

      const commentHtml = `
        <div class="comment-item">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="fw-bold text-success">${name}</span>
            <span class="badge bg-light text-muted small">இப்போது</span>
          </div>
          <p class="mb-0 text-dark small">${comment}</p>
        </div>
      `;

      $('#commentListContainer').prepend(commentHtml);
      $('#noCommentsNotice').remove();
      $('#commentAuthor').val('');
      $('#commentText').val('');
      AppUtils.showToast('உங்கள் கருத்து வெற்றிகரமாக பதிவிடப்பட்டது!', 'fa-comment-dots');
    });
  },

  injectJsonLd: function(a) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": a.title,
      "image": [window.location.origin + '/' + a.image],
      "datePublished": a.published_at,
      "dateModified": a.updated_at || a.published_at,
      "author": [{
        "@type": "Person",
        "name": a.author,
        "jobTitle": a.author_role
      }],
      "publisher": {
        "@type": "Organization",
        "name": "உழவர் செய்திகள்",
        "logo": {
          "@type": "ImageObject",
          "url": window.location.origin + "/assets/images/logo/logo.png"
        }
      },
      "description": a.excerpt
    };

    let $script = $('#articleJsonLd');
    if (!$script.length) {
      $script = $('<script id="articleJsonLd" type="application/ld+json"></script>').appendTo('head');
    }
    $script.text(JSON.stringify(schema));
  }
};

$(document).ready(function() {
  ArticleEngine.init();
});
