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
    if (fileName === 'articles.json') { return [
  {
    "id": 101,
    "title": "நெல் கொள்முதல் விலை தொடர்பாக விவசாயிகள் புதிய கோரிக்கை: குவிண்டாலுக்கு ₹3,000 வழங்க வலியுறுத்தல்!",
    "slug": "farmers-request-about-paddy-price",
    "category": "விவசாய கொள்கை",
    "category_slug": "agriculture-news",
    "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "நடப்பு குறுவை மற்றும் சம்பா பருவத்தில் நெல் உற்பத்தி செலவு அதிகரித்துள்ளதால், சாதாரண மற்றும் சன்ன ரக நெல்லுக்கு குவிண்டால் ஒன்றுக்கு குறைந்தபட்சம் ₹3,000 கொள்முதல் விலை நிர்ணயிக்க வேண்டும் என தமிழக விவசாயிகள் அரசுக்கு கோரிக்கை விடுத்துள்ளனர்.",
    "content": "<p class='lead'>நடப்பு குறுவை மற்றும் வரவிருக்கும் சம்பா பருவத்தில் உரங்கள், டீசல் மற்றும் கூலிச் செலவுகள் பன்மடங்கு உயர்ந்துள்ளதால், அரசு நேரடி நெல் கொள்முதல் நிலையங்களில் குவிண்டால் ஒன்றுக்கு ₹3,000 வீதம் வழங்க வேண்டும் என்று தமிழக உழவர் சங்கங்கள் ஒருமித்த குரலில் வலியுறுத்தியுள்ளன.</p><h3>உற்பத்திச் செலவு பல மடங்கு அதிகரிப்பு</h3><p>தஞ்சாவூர், திருவாரூர், நாகப்பட்டினம், மயிலாடுதுறை உள்ளிட்ட காவிரி டெல்டா மாவட்டங்களில் விவசாயிகள் நெல் சாகுபடியில் தீவிரமாக ஈடுபட்டு வருகின்றனர். இருப்பினும், கடந்த சில மாதங்களாக விவசாய இடுபொருட்களின் விலை கணிசமாக உயர்ந்துள்ளது.</p><div class='article-highlight-box my-4 p-3 bg-light border-start border-success border-4 rounded'><h5 class='text-success fw-bold'><i class='fas fa-info-circle me-2'></i>விவசாயிகளின் முக்கிய கோரிக்கைகள் சுருக்கம்:</h5><ul class='mb-0'><li>சாதாரண ரக நெல் குவிண்டாலுக்கு ₹3,000 மற்றும் சன்ன ரகத்திற்கு ₹3,200 வழங்க வேண்டும்.</li><li>நேரடி நெல் கொள்முதல் நிலையங்களில் ஈரப்பத வரம்பை 17%-லிருந்து 22% ஆக உயர்த்த வேண்டும்.</li><li>கொள்முதல் நிலையங்களில் மூட்டைக்கு பிடிக்கும் கமிஷன் முறையை முற்றிலும் ஒழிக்க வேண்டும்.</li><li>மழைக்காலங்களில் நெல்மணிகள் நனையாமல் இருக்க நவீன உலர்களங்கள் மற்றும் நிரந்தர கூரைகள் அமைக்க வேண்டும்.</li></ul></div><h3>தற்போதைய கொள்முதல் விலை ஒப்பீடு</h3><p>மத்திய மற்றும் மாநில அரசுகளின் தற்போதைய ஆதரவு விலையும், விவசாயிகள் கோரும் தொகையும் கீழே உள்ள அட்டவணையில் தரப்பட்டுள்ளது:</p><div class='table-responsive my-3'><table class='table table-bordered table-hover'><thead class='table-success'><tr><th>ரகத்தின் விவரம்</th><th>மத்திய அரசு MSP</th><th>மாநில அரசு ஊக்கத்தொகை</th><th>தற்போதைய மொத்த விலை</th><th>விவசாயிகள் கோரிக்கை</th></tr></thead><tbody><tr><td>சாதாரண ரகம் (Common)</td><td>₹2,300</td><td>₹105</td><td>₹2,405</td><td><strong class='text-success'>₹3,000</strong></td></tr><tr><td>சன்ன ரகம் (Grade A)</td><td>₹2,320</td><td>₹130</td><td>₹2,450</td><td><strong class='text-success'>₹3,200</strong></td></tr></tbody></table></div><blockquote class='article-quote my-4 p-4 border-start border-success border-5 bg-white shadow-sm rounded'><p class='fs-5 fst-italic mb-2'>\"உழவன் வாழ்ந்தால் தான் உலகம் வாழும். ஒரு ஏக்கர் நெல் சாகுபடிக்கு உழவு, நடவு, உரம், மருந்து, அறுவடை என சராசரியாக ₹32,000 முதல் ₹35,000 வரை செலவாகிறது. ஏக்கருக்கு 25 முதல் 30 மூட்டைகள் கிடைத்தால் கூட முதலீட்டை எடுப்பதே பெரும் போராட்டமாக உள்ளது. எனவே அரசு உடனே நியாயமான விலையை அறிவிக்க வேண்டும்.\"</p><footer class='text-muted fw-bold'>- பி. ஆர். பாண்டியன், அனைத்து விவசாயிகள் ஒருங்கிணைப்புக் குழு</footer></blockquote><h3>நேரடி நெல் கொள்முதல் நிலைய சிக்கல்கள்</h3><p>கொள்முதல் நிலையங்களில் நெல் மூட்டைகள் தேங்குவதைத் தடுக்க, கூடுதல் தற்காலிக மையங்களைத் திறக்க வேண்டும் என்றும், சாக்கு பற்றாக்குறை மற்றும் எடை போடும் இயந்திரக் கோளாறுகளை உடனே சரி செய்ய வேண்டும் என்றும் விவசாயிகள் மாவட்ட ஆட்சியர்களிடம் மனு அளித்துள்ளனர்.</p><p>விவசாயிகளின் இந்த நியாயமான கோரிக்கையை பரிசீலித்து உரிய நடவடிக்கை எடுக்கப்படும் என வேளாண்மை மற்றும் உழவர் நலத்துறை அதிகாரிகள் உறுதி அளித்துள்ளனர்.</p>",
    "author": "மு. செந்தில்குமார்",
    "author_id": "senthil-kumar",
    "author_role": "மூத்த வேளாண்மை இதழாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-14 08:30:00",
    "updated_at": "2026-09-14 10:15:00",
    "views": 4850,
    "read_time": "4 நிமிடங்கள்",
    "featured": true,
    "tags": ["நெல்", "கொள்முதல் விலை", "விவசாயிகள்", "டெல்டா", "MSP", "அரசு அறிவிப்பு"]
  },
  {
    "id": 102,
    "title": "மேட்டூர் அணை நீர்மட்டம் 118 அடியை எட்டியது: டெல்டா பாசனத்திற்கு 18,000 கனஅடி நீர் திறப்பு!",
    "slug": "mettur-dam-water-level-delta-irrigation",
    "category": "வானிலை & பாசனம்",
    "category_slug": "weather",
    "image": "https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "கர்நாடக அணைகளில் இருந்து நீர்வரத்து அதிகரித்துள்ளதால் மேட்டூர் அணை தனது முழு கொள்ளளவான 120 அடியை நெருங்குகிறது. காவிரி டெல்டா சம்பா பாசனத்திற்காக வினாடிக்கு 18,000 கனஅடி நீர் திறக்கப்பட்டுள்ளது.",
    "content": "<p class='lead'>காவிரி நீர்ப்பிடிப்பு பகுதிகளில் பெய்து வரும் தொடர் கனமழை காரணமாக மேட்டூர் அணைக்கு நீர்வரத்து தொடர்ந்து அதிகரித்து வருகிறது. இதனால் அணையின் நீர்மட்டம் 118 அடியை எட்டியுள்ளது.</p><h3>டெல்டா விவசாயிகளுக்கு நிம்மதி</h3><p>தஞ்சை, திருவாரூர், நாகை, மயிலாடுதுறை, புதுக்கோட்டை, கடலூர் உள்ளிட்ட 12 மாவட்டங்களில் சம்பா சாகுபடி பணிகள் விறுவிறுப்பாக தொடங்கி உள்ள நிலையில், பாசனத்திற்கு தடையின்றி நீர் திறக்கப்பட்டு வருவது உழவர்களிடையே பெரும் மகிழ்ச்சியை ஏற்படுத்தியுள்ளது.</p><div class='article-highlight-box my-4 p-3 bg-light border-start border-success border-4 rounded'><h5 class='text-success fw-bold'><i class='fas fa-water me-2'></i>அணை நிலவர சுருக்கம்:</h5><ul class='mb-0'><li>தற்போதைய நீர்மட்டம்: 118.40 அடி (மொத்த கொள்ளளவு 120 அடி)</li><li>அணைக்கு நீர்வரத்து: வினாடிக்கு 24,500 கனஅடி</li><li>பாசனத்திற்கு வெளியேற்றம்: வினாடிக்கு 18,000 கனஅடி</li><li>அணையின் நீர் இருப்பு: 91.20 டி.எம்.சி (முழுக் கொள்ளளவு 93.47 டி.எம்.சி)</li></ul></div><p>கால்வாய்களில் கடைமடை வரை தண்ணீர் தடையின்றி சென்றடைவதை உறுதி செய்ய பொதுப்பணித்துறை மற்றும் நீர்வளத்துறை அதிகாரிகள் தீவிர கண்காணிப்பு பணியில் ஈடுபட்டுள்ளனர்.</p>",
    "author": "க. இளங்கோவன்",
    "author_id": "elango-k",
    "author_role": "நீர் மேலாண்மை சிறப்பு செய்தியாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-14 07:45:00",
    "updated_at": "2026-09-14 09:30:00",
    "views": 3920,
    "read_time": "3 நிமிடங்கள்",
    "featured": false,
    "tags": ["மேட்டூர் அணை", "காவிரி", "சம்பா பாசனம்", "வானிலை", "நீர் மேலாண்மை"]
  },
  {
    "id": 103,
    "title": "கோயம்பேடு சந்தையில் தக்காளி விலை கிலோ ₹25 ஆக சரிவு: காய்கறி சந்தை நிலவரம்",
    "slug": "koyambedu-vegetable-market-prices-tomato",
    "category": "சந்தை விலை",
    "category_slug": "market-prices",
    "image": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "ஆந்திரா மற்றும் கர்நாடகாவில் இருந்து தக்காளி வரத்து அதிகரித்ததால் சென்னை கோயம்பேடு மொத்த சந்தையில் தக்காளி விலை கிலோ ₹25 ஆக குறைந்துள்ளது. இதர காய்கறிகளின் விலை நிலவரம் இதோ.",
    "content": "<p class='lead'>சென்னை கோயம்பேடு மொத்த காய்கறி வணிக வளாகத்திற்கு ஆந்திரா, கர்நாடகா மற்றும் கிருஷ்ணகிரி மாவட்டங்களில் இருந்து தினசரி 60-க்கும் மேற்பட்ட லாரிகளில் தக்காளி வரத்து அதிகரித்துள்ளது.</p><h3>இன்றைய முக்கிய காய்கறி மொத்த விலை நிலவரம்</h3><div class='table-responsive my-3'><table class='table table-striped table-bordered'><thead class='table-success'><tr><th>காய்கறி பெயர்</th><th>நேற்றைய விலை (கிலோ)</th><th>இன்றைய விலை (கிலோ)</th><th>மாற்றம்</th></tr></thead><tbody><tr><td>நாட்டு தக்காளி</td><td>₹35</td><td>₹25</td><td><span class='badge bg-danger'>₹10 சரிவு</span></td></tr><tr><td>பெங்களூரு தக்காளி</td><td>₹40</td><td>₹30</td><td><span class='badge bg-danger'>₹10 சரிவு</span></td></tr><tr><td>சின்ன வெங்காயம்</td><td>₹55</td><td>₹55</td><td><span class='badge bg-secondary'>மாற்றமில்லை</span></td></tr><tr><td>பெரிய வெங்காயம்</td><td>₹38</td><td>₹40</td><td><span class='badge bg-success'>₹2 உயர்வு</span></td></tr><tr><td>பச்சை மிளகாய்</td><td>₹45</td><td>₹40</td><td><span class='badge bg-danger'>₹5 சரிவு</span></td></tr><tr><td>உருளைக்கிழங்கு</td><td>₹32</td><td>₹30</td><td><span class='badge bg-danger'>₹2 சரிவு</span></td></tr></tbody></table></div><p>விளைச்சல் அதிகரித்து சந்தைக்கு வரத்து கூடும் போது உழவர்களுக்கு உரிய கட்டுப்படியான விலை கிடைக்க குளிர்பதன கிடங்கு வசதிகளை தாலுகா அளவில் விரிவுபடுத்த வேண்டும் என வியாபாரிகளும் விவசாயிகளும் வேண்டுகோள் விடுத்துள்ளனர்.</p>",
    "author": "ஆர். சுப்பிரமணியன்",
    "author_id": "subramanian-r",
    "author_role": "வணிக & சந்தை ஆய்வாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-14 06:15:00",
    "updated_at": "2026-09-14 08:00:00",
    "views": 5210,
    "read_time": "3 நிமிடங்கள்",
    "featured": false,
    "tags": ["சந்தை விலை", "கோயம்பேடு", "தக்காளி", "காய்கறிகள்", "விவசாய வணிகம்"]
  },
  {
    "id": 104,
    "title": "பிரதமர் கிசான் 18வது தவணை உதவித்தொகை எப்போது? மத்திய அரசு வெளியிட்டுள்ள புதிய தகவல்",
    "slug": "pm-kisan-18th-installment-scheme-details",
    "category": "அரசுத் திட்டங்கள்",
    "category_slug": "government-schemes",
    "image": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "நாடு முழுவதும் உள்ள 9 கோடிக்கும் அதிகமான விவசாயிகளுக்கு பிரதமர் கிசான் திட்டத்தின் 18-வது தவணை ₹2,000 வங்கி கணக்கில் நேரடியாக செலுத்தப்பட உள்ளது. e-KYC சரிபார்ப்பு குறித்து அரசு அறிவுறுத்தல்.",
    "content": "<p class='lead'>பிரதான் மந்திரி கிசான் சம்மான் நிதி (PM-KISAN) திட்டத்தின் கீழ் தகுதியான விவசாய குடும்பங்களுக்கு ஆண்டுதோறும் ₹6,000 உதவித்தொகை மூன்று சம தவணைகளாக ₹2,000 வீதம் வழங்கப்பட்டு வருகிறது.</p><h3>18வது தவணை பெறுவதற்கான தகுதிகள்:</h3><p>மத்திய வேளாண்மை அமைச்சகத்தின் அறிவிப்பின்படி, பின்வரும் மூன்று நடைமுறைகளை முடித்த விவசாயிகளின் வங்கிக் கணக்குகளுக்கு மட்டுமே தொகை நேரடியாக (DBT முறையில்) செலுத்தப்படும்:</p><div class='article-highlight-box my-4 p-3 bg-light border-start border-warning border-4 rounded'><h5 class='text-warning-emphasis fw-bold'><i class='fas fa-exclamation-triangle me-2'></i>உடனே சரிபார்க்க வேண்டிய 3 முக்கிய ஆவணங்கள்:</h5><ol class='mb-0'><li><strong>e-KYC நிறைவு:</strong> பி.எம். கிசான் அதிகாரப்பூர்வ இணையதளம் அல்லது இ-சேவை மையம் மூலம் பயோமெட்ரிக்/OTP மூலம் e-KYC புதுப்பித்திருக்க வேண்டும்.</li><li><strong>நில விவரப் பதிவு (Land Seeding):</strong> உங்களது பட்டா மற்றும் சிட்டா விவரங்கள் இணையதளத்தில் சரிபார்க்கப்பட்டிருக்க வேண்டும்.</li><li><strong>வங்கி கணக்கு ஆதார் இணைப்பு (Aadhaar Seeding):</strong> வங்கி கணக்குடன் ஆதார் எண் மற்றும் NPCI மேப்பிங் சரியாக இணைக்கப்பட்டிருக்க வேண்டும்.</li></ol></div><p>விவசாயிகள் தங்கள் பெயர் தகுதிப் பட்டியலில் உள்ளதா என்பதை <code>pmkisan.gov.in</code> தளத்தில் 'Beneficiary Status' பகுதியில் சென்று ஆதார் எண் அல்லது செல்போன் எண்ணை உள்ளிட்டு சரிபார்த்துக் கொள்ளலாம்.</p>",
    "author": "மு. செந்தில்குமார்",
    "author_id": "senthil-kumar",
    "author_role": "மூத்த வேளாண்மை இதழாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-13 18:00:00",
    "updated_at": "2026-09-14 07:00:00",
    "views": 9430,
    "read_time": "4 நிமிடங்கள்",
    "featured": true,
    "tags": ["பிரதமர் கிசான்", "PM Kisan", "அரசு மானியம்", "உதவித்தொகை", "விவசாய திட்டம்"]
  },
  {
    "id": 105,
    "title": "இயற்கை விவசாய முறையில் ஏக்கருக்கு 40 மூட்டை நெல் மகசூல் எடுத்து அசத்திய தஞ்சை விவசாயி!",
    "slug": "organic-paddy-farming-success-story-thanjavur",
    "category": "இயற்கை விவசாயம்",
    "category_slug": "organic-farming",
    "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "ரசாயன உரங்கள் மற்றும் பூச்சிக்கொல்லிகள் ஏதுமின்றி, பாரம்பரிய மாப்பிள்ளை சம்பா மற்றும் தூயமல்லி ரகங்களை சாகுபடி செய்து ஏக்கருக்கு 40 மூட்டைகள் விளைச்சல் பெற்ற முன்னோடி விவசாயி முருகேசனின் வெற்றிக் கதை.",
    "content": "<p class='lead'>\"மண்ணை வளப்படுத்தினால் பயிர் தானே செழிக்கும்\" என்கிறார் தஞ்சாவூர் மாவட்டம் அம்மாபேட்டையைச் சேர்ந்த இயற்கை விவசாயி முருகேசன் (வயது 52). கடந்த 8 ஆண்டுகளாக இவர் தனது 5 ஏக்கர் நிலத்தில் முழு இயற்கை முறையில் நெல் சாகுபடி செய்து வருகிறார்.</p><h3>பஞ்சகவ்யா மற்றும் ஜீவாமிர்தம் பயன்பாடு</h3><p>விதை நேர்த்தி முதல் அறுவடை வரை நாட்டு மாட்டுச் சாணம், கோமியம், நாட்டுச் சர்க்கரை, கடலை மாவு மற்றும் கைப்பிடி வளமான மண் கொண்டு தயாரிக்கப்படும் ஜீவாமிர்தத்தை பாசன நீருடன் கலந்து பாய்ச்சுகிறார்.</p><div class='article-highlight-box my-4 p-3 bg-light border-start border-success border-4 rounded'><h5 class='text-success fw-bold'><i class='fas fa-leaf me-2'></i>முருகேசன் பின்பற்றும் இயற்கை அட்டவணை:</h5><ul><li><strong>விதை நேர்த்தி:</strong> 1 லிட்டர் பாலில் 100 கிராம் அசோஸ்பைரில்லம் கலந்து விதை நேர்த்தி செய்தல்.</li><li><strong>அடி உரம்:</strong> ஏக்கருக்கு 2 டிராக்டர் தொழு உரம் மற்றும் சணப்பை, தக்கைப்பூண்டு பசுந்தாள் உரங்கள்.</li><li><strong>பூச்சி மேலாண்மை:</strong> வேப்பங்கொட்டை கரைசல் மற்றும் 5 இலைக் கரைசல் (வேம்பு, ஆடுதொடா, நொச்சி, எருக்கு, துளசி).</li><li><strong>வளர்ச்சி ஊக்கி:</strong> 25 மற்றும் 45-ஆம் நாட்களில் 3% பஞ்சகவ்யா தெளிப்பு.</li></ul></div><blockquote class='article-quote my-4 p-4 border-start border-success border-5 bg-white shadow-sm rounded'><p class='fs-5 fst-italic mb-2'>\"ரசாயன விவசாயத்தில் ஒரு ஏக்கருக்கு ₹28,000 செலவாகும். ஆனால் இயற்கை முறையில் எனக்கு ₹11,000 மட்டுமே செலவாகிறது. இயற்கை முறையில் விளைந்த பாரம்பரிய நெல் அரிசி கிலோ ₹90 முதல் ₹110 வரை நேரடி நுகர்வோருக்கு விற்க முடிகிறது. நிகர லாபமாக ஏக்கருக்கு ₹65,000 வரை கிடைக்கிறது.\"</p><footer class='text-muted fw-bold'>- இயற்கை விவசாயி முருகேசன், தஞ்சாவூர்</footer></blockquote><p>மண்ணின் நுண்ணுயிர்கள் பெருகியதால் பயிர்களின் நோய் எதிர்ப்புத் திறன் அதிகரித்துள்ளதாகவும், தண்டு துளைப்பான் போன்ற தாக்குதல்கள் முற்றிலும் குறைந்துள்ளதாகவும் அவர் பெருமிதத்துடன் கூறுகிறார்.</p>",
    "author": "வி. கவிதா",
    "author_id": "kavitha-v",
    "author_role": "இயற்கை விவசாய நிபுணர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-13 14:20:00",
    "updated_at": "2026-09-13 16:00:00",
    "views": 8150,
    "read_time": "5 நிமிடங்கள்",
    "featured": true,
    "tags": ["இயற்கை விவசாயம்", "தூயமல்லி", "ஜீவாமிர்தம்", "வெற்றிக் கதை", "பாரம்பரிய நெல்"]
  },
  {
    "id": 106,
    "title": "வேளாண் ட்ரோன் வாங்க 50% வரை மானியம்: விண்ணப்பிப்பது எப்படி? முழு விவரம் இதோ!",
    "slug": "agri-drone-subsidy-application-guide",
    "category": "வேளாண் தொழில்நுட்பம்",
    "category_slug": "technology",
    "image": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "விவசாய நிலங்களில் நானோ யூரியா மற்றும் பூச்சி மருந்து தெளிக்க பயன்படும் வேளாண் ட்ரோன்களுக்கு உழவர் உற்பத்தியாளர் நிறுவனங்கள் மற்றும் தனிநபர் விவசாயிகளுக்கு 50% வரை அரசு மானியம் வழங்கப்படுகிறது.",
    "content": "<p class='lead'>வேளாண் துறையில் ஆட்கள் பற்றாக்குறைக்கு முற்றுப்புள்ளி வைக்கவும், குறித்த நேரத்தில் உரங்கள் மற்றும் மருந்துகளை சீராக தெளிக்கவும் வேளாண் ட்ரோன்கள் பெரும் புரட்சியை ஏற்படுத்தி வருகின்றன.</p><h3>மானியத் தொகை விவரங்கள்</h3><div class='table-responsive my-3'><table class='table table-bordered'><thead class='table-success'><tr><th>பயனாளிகள் பிரிவு</th><th>மானியம் சதவீதம்</th><th>அதிகபட்ச மானிய வரம்பு</th></tr></thead><tbody><tr><td>விவசாய உற்பத்தியாளர் அமைப்புகள் (FPO)</td><td>75%</td><td>₹7,50,000 வரை</td></tr><tr><td>பெண் விவசாயிகள் & ஆதிதிராவிட விவசாயிகள்</td><td>50%</td><td>₹5,00,000 வரை</td></tr><tr><td>சிறு & குறு விவசாயிகள்</td><td>50%</td><td>₹5,00,000 வரை</td></tr><tr><td>இதர தனிநபர் விவசாயிகள்</td><td>40%</td><td>₹4,00,000 வரை</td></tr></tbody></table></div><p>1 ஏக்கர் நிலத்தில் வெறும் 7 முதல் 10 நிமிடங்களில் ட்ரோன் மூலம் உரம் அல்லது மருந்து தெளித்து முடிக்க முடிகிறது. இதனால் 25% மருந்து விரயம் தடுக்கப்பட்டு, செலவும் கணிசமாக குறைகிறது.</p>",
    "author": "கே. நவீன்",
    "author_id": "naveen-k",
    "author_role": "தொழில்நுட்ப செய்தியாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-13 11:30:00",
    "updated_at": "2026-09-13 12:45:00",
    "views": 6740,
    "read_time": "4 நிமிடங்கள்",
    "featured": false,
    "tags": ["ட்ரோன்", "தொழில்நுட்பம்", "மானியம்", "நவீன விவசாயம்", "FPO"]
  },
  {
    "id": 107,
    "title": "நாட்டுக்கோழி வளர்ப்பில் மாதந்தோறும் ₹60,000 வருமானம்: நாமக்கல் விவசாயியின் எளிய தொழில்நுட்பம்!",
    "slug": "country-chicken-farming-monthly-income-guide",
    "category": "கால்நடை & மீன்வளம்",
    "category_slug": "livestock",
    "image": "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "கொல்லைப்புற நாட்டுக்கோழி வளர்ப்பு முறையில் சிறு முதலீட்டில் அசாதாரண வருமானம் ஈட்ட வழிகாட்டும் நாமக்கல் முன்னோடி பண்ணையாளரின் மேலாண்மை ஆலோசனைகள்.",
    "content": "<p class='lead'>கிராமப்புறங்களில் குறைந்த நிலப்பரப்பில் மிகக் குறைந்த தீவனச் செலவில் அதிக லாபம் தரும் தொழிலாக நாட்டுக்கோழி வளர்ப்பு உருவெடுத்துள்ளது.</p><h3>லாபகரமான தீவன மேலாண்மை</h3><p>அசோலா, முருங்கை இலை மற்றும் தவிடு கலந்த கலவை தீவனம் கொடுப்பதன் மூலம் தீவனச் செலவில் 40% வரை மிச்சப்படுத்தலாம் என்கிறார் நாமக்கல்லை சேர்ந்த பண்ணையாளர் சதாசிவம்.</p><ul><li>சிறுவிடை, பெருவிடை மற்றும் கடக்நாத் ரகங்களுக்கு சந்தையில் நல்ல வரவேற்பு உள்ளது.</li><li>முட்டைகள் நாட்டுக்கோழி முட்டையாக விற்கப்படும் போது ஒன்றுக்கு ₹12 முதல் ₹15 வரை விலை கிடைக்கிறது.</li><li>வளர்ப்பு கோழி உயிருடன் கிலோ ₹350 முதல் ₹400 வரை விற்பனையாகிறது.</li></ul><p>முறையான தடுப்பூசி அட்டவணை மற்றும் கொட்டகை சுகாதாரத்தைப் பராமரித்தால் 95% வரை இறப்பு விகிதத்தைக் கட்டுப்படுத்த முடியும்.</p>",
    "author": "வி. கவிதா",
    "author_id": "kavitha-v",
    "author_role": "கால்நடை ஆலோசகர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-12 16:45:00",
    "updated_at": "2026-09-12 18:20:00",
    "views": 7520,
    "read_time": "3 நிமிடங்கள்",
    "featured": false,
    "tags": ["நாட்டுக்கோழி", "கால்நடை வளர்ப்பு", "சுயதொழில்", "அசோலா", "பண்ணை"]
  },
  {
    "id": 108,
    "title": "சொட்டுநீர் பாசனம் அமைக்க 100% வரை அரசு மானியம் பெறுவது எப்படி? முழு வழிகாட்டி",
    "slug": "drip-irrigation-subsidy-tamilnadu-guide",
    "category": "அரசுத் திட்டங்கள்",
    "category_slug": "government-schemes",
    "image": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "தமிழ்நாடு தோட்டக்கலைத் துறை மூலம் பிரதம மந்திரி நுண்ணீர் பாசனத் திட்டத்தின் கீழ் சிறு, குறு விவசாயிகளுக்கு 100% முழு மானியத்திலும், இதர விவசாயிகளுக்கு 75% மானியத்திலும் சொட்டுநீர் பாசனம் வழங்கப்படுகிறது.",
    "content": "<p class='lead'>நிலத்தடி நீர்மட்டம் குறைந்து வரும் இன்றைய சூழலில் ஒவ்வொரு சொட்டு நீரையும் திறம்பட பயன்படுத்தி அதிக மகசூல் பெற சொட்டுநீர் பாசனம் மிகச் சிறந்த தீர்வாகும்.</p><h3>மானிய விவரம்:</h3><ul><li><strong>சிறு / குறு விவசாயிகள் (5 ஏக்கருக்குள்):</strong> 100% முழு மானியம் (ஜிஎஸ்டி வரி மட்டும் செலுத்த வேண்டும்).</li><li><strong>இதர விவசாயிகள் (5 ஏக்கருக்கு மேல்):</strong> 75% அரசு மானியம்.</li></ul><p>விண்ணப்பிக்க தேவையான ஆவணங்கள்: நிலப் பட்டா, சிட்டா, அடங்கல், கிணறு/போர்வெல் சான்று, குடும்ப அட்டை நகல், ஆதார் அட்டை மற்றும் பாஸ்போர்ட் சைஸ் புகைப்படம். உங்கள் வட்டார தோட்டக்கலை உதவி இயக்குநர் அலுவலகத்தை அணுகி அல்லது உழவன் செயலியில் பதிவு செய்து பயன்பெறலாம்.</p>",
    "author": "மு. செந்தில்குமார்",
    "author_id": "senthil-kumar",
    "author_role": "மூத்த வேளாண்மை இதழாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-12 10:15:00",
    "updated_at": "2026-09-12 11:30:00",
    "views": 8910,
    "read_time": "4 நிமிடங்கள்",
    "featured": false,
    "tags": ["சொட்டுநீர் பாசனம்", "தோட்டக்கலை", "100% மானியம்", "உழவன் செயலி", "நீர் மேலாண்மை"]
  },
  {
    "id": 109,
    "title": "வெங்காய விளைச்சல் அமோகம்: விலை வீழ்ச்சியிலிருந்து தப்ப 'பட்டறை சேமிப்பு' முறை!",
    "slug": "onion-storage-method-price-protection",
    "category": "காய்கறிகள் & பழங்கள்",
    "category_slug": "horticulture",
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "சின்ன வெங்காயத்தை அறுவடை செய்தவுடன் குறைந்த விலைக்கு விற்காமல், பாரம்பர்ய மூங்கில் பட்டறை அமைத்து 4 முதல் 6 மாதங்கள் வரை பாதுகாப்பாக சேமித்து வைத்து நல்ல விலைக்கு விற்பனை செய்யும் உத்தி.",
    "content": "<p class='lead'>திண்டுக்கல், பெரம்பலூர் மற்றும் திருச்சி மாவட்டங்களில் பரவலாக பயிரிடப்படும் சின்ன வெங்காயம் அறுவடை காலங்களில் விலை கடும் வீழ்ச்சியை சந்திக்கிறது.</p><p>இதை சமாளிக்க காற்றோட்டமான இயற்கை பட்டறைகள் அமைத்து இருப்பு வைக்கும் விவசாயிகள், விலை உயரும் காலகட்டங்களில் கிலோ ₹70 முதல் ₹90 வரை விற்று இருமடங்கு லாபம் ஈட்டுகின்றனர். இந்த சேமிப்பு பட்டறை அமைக்க அரசு மானியமும் வழங்கப்படுகிறது.</p>",
    "author": "ஆர். சுப்பிரமணியன்",
    "author_id": "subramanian-r",
    "author_role": "சந்தை ஆய்வாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-11 15:40:00",
    "updated_at": "2026-09-11 17:00:00",
    "views": 4380,
    "read_time": "3 நிமிடங்கள்",
    "featured": false,
    "tags": ["சின்ன வெங்காயம்", "சேமிப்பு பட்டறை", "தோட்டக்கலை", "சந்தை உத்தி"]
  },
  {
    "id": 110,
    "title": "அடுத்த 3 நாட்களுக்கு தமிழகத்தின் இந்த 7 மாவட்டங்களில் கனமழை எச்சரிக்கை: வானிலை மையம்!",
    "slug": "tamilnadu-heavy-rainfall-alert-7-districts",
    "category": "வானிலை & மழை நிலவரம்",
    "category_slug": "weather",
    "image": "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "வங்கக்கடலில் நிலவும் வளிமண்டல மேலடுக்கு சுழற்சி காரணமாக கன்னியாகுமரி, தென்காசி, தேனி, திண்டுக்கல், நீலகிரி மற்றும் கோவை மாவட்டங்களில் கனமழை பெய்ய வாய்ப்புள்ளதாக சென்னை வானிலை மையம் எச்சரித்துள்ளது.",
    "content": "<p class='lead'>தென்மேற்கு பருவமழை தீவிரமடைந்து வரும் நிலையில் தமிழகத்தின் மேற்கு தொடர்ச்சி மலையை ஒட்டிய மாவட்டங்கள் மற்றும் டெல்டா மாவட்டங்களில் பரவலாக மழை பெய்யக்கூடும் என தெரிவிக்கப்பட்டுள்ளது.</p><p>விவசாயிகள் அறுவடை செய்த பயிர்களை பாதுகாப்பான சேமிப்பு கிடங்குகளில் வைக்கவும், விளைநிலங்களில் உபரி நீர் தேங்காமல் வடிகால் வசதிகளை சீர் செய்யவும் அறிவுறுத்தப்படுகிறார்கள்.</p>",
    "author": "க. இளங்கோவன்",
    "author_id": "elango-k",
    "author_role": "வானிலை ஆய்வாளர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-11 09:20:00",
    "updated_at": "2026-09-11 10:10:00",
    "views": 6120,
    "read_time": "2 நிமிடங்கள்",
    "featured": false,
    "tags": ["வானிலை", "மழை எச்சரிக்கை", "விவசாய முன்னெச்சரிக்கை", "வடிகால்"]
  },
  {
    "id": 111,
    "title": "டிராக்டர் மற்றும் பவர் டில்லர் மானியம்: 2026-27 நிதியாண்டுக்கான புதிய விண்ணப்பங்கள் வரவேற்பு!",
    "slug": "tractor-power-tiller-subsidy-applications-open",
    "category": "வேளாண் இயந்திரங்கள்",
    "category_slug": "machinery",
    "image": "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "விவசாய பணிகளை விரைவுபடுத்த உதவும் பவர் டில்லர்கள், ரோட்டவேட்டர்கள் மற்றும் டிராக்டர்களுக்கு வேளாண்மை பொறியியல் துறை மூலம் வழங்கப்படும் மானியங்களுக்கு விண்ணப்பிக்க அழைப்பு விடுக்கப்பட்டுள்ளது.",
    "content": "<p class='lead'>வேளாண் பணிகளில் இயந்திரமயமாக்கலை ஊக்குவிக்க தமிழக அரசின் வேளாண்மை பொறியியல் துறை பல்வேறு உபகரணங்களுக்கு தாராள மானியங்களை அறிவித்துள்ளது.</p><p>சிறு, குறு விவசாயிகள் மற்றும் ஆதிதிராவிட விவசாயிகளுக்கு 50% வரையிலும், இதர விவசாயிகளுக்கு 40% வரையிலும் மானியம் வழங்கப்படுகிறது. வேளாண் பொறியியல் துறையின் உழவன் போர்ட்டல் மூலம் ஆன்லைனில் பதிவு செய்யலாம்.</p>",
    "author": "கே. நவீன்",
    "author_id": "naveen-k",
    "author_role": "இயந்திரவியல் நிபுணர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-10 14:10:00",
    "updated_at": "2026-09-10 15:30:00",
    "views": 5320,
    "read_time": "3 நிமிடங்கள்",
    "featured": false,
    "tags": ["டிராக்டர்", "பவர் டில்லர்", "இயந்திர மானியம்", "வேளாண் பொறியியல்"]
  },
  {
    "id": 112,
    "title": "கறவை மாடு வளர்ப்பில் காய்ச்சல் மற்றும் மடிநோய் தடுப்பு: கால்நடை மருத்துவர் சிறப்பு வழிகாட்டல்",
    "slug": "dairy-farming-mastitis-prevention-tips",
    "category": "கால்நடை & மீன்வளம்",
    "category_slug": "livestock",
    "image": "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1200&q=80",
    "excerpt": "மழைக்காலத்தில் கறவை மாடுகளைத் தாக்கும் கோமாரி மற்றும் மடிநோய் பாதிப்பிலிருந்து பாதுகாக்க பின்பற்ற வேண்டிய தடுப்பூசி அட்டவணை மற்றும் மருத்துவ ஆலோசனைகள்.",
    "content": "<p class='lead'>பால் உற்பத்தியில் ஈடுபட்டுள்ள பால்பண்ணை விவசாயிகளுக்கு மடிநோய் மற்றும் கோமாரி நோய் ஏற்படுவதால் பெரும் பொருளாதார இழப்பு ஏற்படுகிறது. சரியான நேரத்தில் தடுப்பூசி செலுத்துவதும் பண்ணை சுகாதாரமும் இதை முற்றிலுமாக தவிர்க்கும்.</p><p>கறவை முடிந்ததும் பொட்டாசியம் பெர்மாங்கனேட் கரைசலில் காம்புகளை நனைத்தல், மாட்டுக்கொட்டகையில் சுண்ணாம்பு தூவுதல் போன்ற எளிய நடைமுறைகள் நோய் பரவுவதை 90% தடுக்கின்றன.</p>",
    "author": "டாக்டர் வி. கவிதா",
    "author_id": "kavitha-v",
    "author_role": "கால்நடை மருத்துவர்",
    "author_avatar": "assets/images/placeholders/author-avatar.svg",
    "published_at": "2026-09-09 11:00:00",
    "updated_at": "2026-09-09 12:00:00",
    "views": 4790,
    "read_time": "4 நிமிடங்கள்",
    "featured": false,
    "tags": ["கறவை மாடு", "பால் பண்ணை", "மடிநோய் தடுப்பு", "கால்நடை மருத்துவம்"]
  }
]; }
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
