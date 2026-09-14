# உழவர் செய்திகள் (Uzhavar Seithigal)
### Agriculture News & Information Portal (தமிழ் வேளாண் செய்தி இணையதளம்)

A modern, responsive, and editorial-grade Agriculture News Portal developed in Tamil Unicode, inspired by the professional editorial layout, readability, and content flow of top Tamil news publications such as Vikatan, built 100% from scratch with original branding and architecture.

---

## 🌾 Features & Highlights

- **100% Tamil Unicode Editorial Design**: Clean serif and sans-serif typography (`Noto Sans Tamil`), optimal line heights, agricultural green color palette.
- **Pure Frontend Stack**: HTML5, CSS3, Bootstrap 5 (CDN), jQuery (CDN), AJAX, and Font Awesome. No Node.js, React, Vue, Angular, or backend build tools needed to run.
- **Decoupled AJAX Architecture**:
  - All articles, categories, breaking tickers, market prices, and popular news are dynamically loaded from `/api/data/*.json`.
  - Seamlessly ready to swap `/api/data/*.json` with PHP/MySQL backend endpoints (`api/get_articles.php`, etc.).
- **Professional News Header**:
  - Top utility bar with live Tamil date, weather badge, font resize tools (A- / A / A+), dark mode toggle, and social channels.
  - Sticky category navigation on desktop with smooth shadows.
  - Offcanvas hamburger navigation menu on mobile devices.
  - Bottom mobile app-like sticky navigation bar (Home, News, Market, Search, Bookmarks).
- **Breaking News Marquee Ticker**:
  - Smooth CSS3 marquee animation with pause-on-hover effect.
- **Dynamic Homepage (50% / 50% Grid)**:
  - Left: Large featured hero story with high-resolution image, badge, headline, excerpt, metadata.
  - Right: 4 smaller responsive secondary news cards.
  - 5 Dedicated category sections ("விவசாய செய்திகள்", "அரசுத் திட்டங்கள்", "சந்தை விலை", "இயற்கை விவசாயம்", "தொழில்நுட்பம்") with 1 Big + 4 Small article card layouts.
- **Interactive Article Reading Experience**:
  - Live reading progress bar at top of window.
  - Font size controls (A- / A / A+).
  - Bookmark article toggle with local persistence (`localStorage`) and top counter badge.
  - One-click Social Sharing: WhatsApp, Facebook, X (Twitter), Telegram, and Copy Link.
  - Print-friendly layout (`@media print` stylesheet).
  - Highlighting boxes, quotes, responsive comparison tables, tags.
  - Previous / Next article navigation links.
  - Related articles grid.
  - Interactive reader comments form.
- **Dynamic Category & Search Engine**:
  - `category.html?category=slug`: Sort by Latest, Most Read, or Popular, with infinite scroll / AJAX load-more pagination and loading spinners.
  - `search.html?q=keyword`: Real-time instant search with debounce and tag pill filters.
- **Right Sidebar News Widgets**:
  - Live Agriculture Market Prices with price trend badges.
  - Interactive Tamil Nadu Weather Widget with district switch (Thanjavur, Chennai, Madurai, Coimbatore, Trichy).
  - 01 to 05 Stylized Numbered "Most Read" news ranking.
  - Latest news feed with timestamps ("10 mins ago", etc.).
  - Newsletter subscription form.
- **Advertising Slots System**:
  - Reusable placeholder ad units: 728x90 Leaderboard, 300x250 Medium Rectangle, In-article ad slots.
- **Offline & Responsive SVG Graphics**:
  - Crisp, self-contained SVG graphics for all agricultural crops, machinery, drip irrigation, dams, and poultry.

---

## 📂 Project Structure

```
/agri-news/
│
├── index.html              # Homepage with 50/50 hero grid, category sections, sidebar
├── article.html            # Article reading page with comments, shares, font resizer
├── category.html           # Category page with filters, sorting, and infinite scroll
├── search.html             # Dynamic live search with keywords and empty states
├── author.html             # Journalist & field researcher profile
├── video.html              # Agricultural video news & tutorials with modal player
├── photo.html              # Photojournalism gallery with lightbox
├── about.html              # About the publication and editorial council
├── contact.html            # Contact office details, interactive form, social links
├── privacy-policy.html     # Editorial privacy policy
├── terms.html              # Terms of service and reader guidelines
│
├── assets/
│   ├── css/
│   │   ├── style.css       # Core typography, dark mode, widgets, cards, print CSS
│   │   └── responsive.css  # Mobile breakpoints, offcanvas, sticky bottom bar
│   │
│   ├── js/
│   │   ├── common.js       # Data service (AgriData), dark mode, bookmarks, font resizer
│   │   ├── app.js          # Breaking ticker, sidebar market/weather/latest widgets
│   │   ├── home.js         # Homepage hero & category sections AJAX loader
│   │   ├── article.js      # Article reader, shares, related news, comments, JSON-LD
│   │   ├── category.js     # Category filters, sorting, infinite scroll
│   │   └── search.js       # Dynamic search query matching and result rendering
│   │
│   └── images/
│       ├── logo/           # Vector logos
│       ├── articles/       # Crisp agricultural article illustrations
│       ├── categories/     # Category icons
│       └── placeholders/   # Avatars and fallback placeholders
│
├── api/
│   └── data/
│       ├── articles.json   # Full Tamil agriculture news dataset
│       ├── categories.json # Category titles, slugs, icons, descriptions
│       ├── latest-news.json# Breaking ticker and latest timestamped news
│       └── popular-news.json# Top 5 most-read ranked stories
│
└── README.md
```

---

## 🚀 How to Run

1. Open `agri-news/index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Or serve using any lightweight web server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node
   npx serve .
   ```
3. Visit `http://localhost:8000/agri-news/index.html` in your browser.
