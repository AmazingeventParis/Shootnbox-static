const fs = require('fs');
const path = require('path');

const previewsDir = path.join(__dirname, 'previews');

// ===== PAGES CONFIGURATION =====
const pages = [
  {
    slug: 'home',
    output: 'public/index.html',
    title: 'Shootnbox - Location Photobooth &amp; Borne Photo Paris | \u00c9v\u00e9nements',
    description: 'Shootnbox, sp\u00e9cialiste de la location de photobooth et borne photo \u00e0 Paris et en \u00cele-de-France. Mariages, entreprises, soir\u00e9es : des souvenirs inoubliables pour vos \u00e9v\u00e9nements.',
    ogTitle: 'Shootnbox - Location Photobooth & Borne Photo Paris',
    ogDescription: 'Sp\u00e9cialiste de la location de photobooth et borne photo \u00e0 Paris. Mariages, entreprises, soir\u00e9es.',
    ogImage: 'https://shootnbox.swipego.app/images/vegas-hero-group.webp',
    ogUrl: 'https://shootnbox.swipego.app/',
    preloadImage: '/images/vegas-hero-group.webp',
    sections: [
      'hero', 'trust', 'bento', 'stats', 'avis',
      'equipe', 'savoirfaire', 'mur', 'carte-france', 'blog'
    ],
    previewDir: previewsDir  // sections at root of previews/
  },
  {
    slug: 'location-photobooth',
    output: 'public/location-photobooth/index.html',
    title: 'Location Photobooth Paris | Borne Photo Mariage & Entreprise - Shootnbox',
    description: 'Louez un photobooth professionnel \u00e0 Paris et en \u00cele-de-France. Borne photo Ring, Vegas, Miroir, Spinner 360. Mariages, soir\u00e9es, \u00e9v\u00e9nements d\'entreprise.',
    ogTitle: 'Location Photobooth Paris - Shootnbox',
    ogDescription: 'Louez un photobooth professionnel pour vos \u00e9v\u00e9nements. 4 bornes au choix, livraison partout en France.',
    ogImage: 'https://shootnbox.swipego.app/images/vegas-hero-group.webp',
    ogUrl: 'https://shootnbox.swipego.app/location-photobooth/',
    preloadImage: null, // will be set when hero is created
    sections: ['hero', 'intro', 'bornes', 'avis', 'usages', 'service-v2', 'fabrication', 'comparatif', 'couverture', 'faq', 'blog'],
    previewDir: path.join(previewsDir, 'location-photobooth'),
    inlineAllCSS: true
  }
];

// Image dimensions map (path -> [width, height]) for CLS prevention
const imageDimensions = {
  '/images/logo/shootnbox-logo-new-1.webp': [968, 512],
  '/images/arrow-hand.webp': [247, 560],
  '/images/carte-france.webp': [1145, 1200],
  '/images/vegas-hero-group.webp': [1200, 900],
  '/images/vegas3.webp': [1200, 898],
  '/images/bornes/Miroir.webp': [1200, 898],
  '/images/bornes/Ring.webp': [1200, 898],
  '/images/bornes/Spinner.webp': [1200, 898],
  '/images/bornes/Vegas.webp': [1200, 898],
  '/images/bento/1.webp': [800, 1200], '/images/bento/2.webp': [800, 1200],
  '/images/bento/3.webp': [1200, 800], '/images/bento/4.webp': [1200, 800],
  '/images/bento/5.webp': [1200, 800], '/images/bento/6.webp': [1200, 800],
  '/images/bento/7.webp': [800, 1200], '/images/bento/8.webp': [800, 1200],
  '/images/bento/9.webp': [1200, 800], '/images/bento/10.webp': [800, 1200],
  '/images/bento/11.webp': [800, 1200], '/images/bento/12.webp': [1200, 800],
  '/images/bento/13.webp': [800, 1200], '/images/bento/14.webp': [1200, 800],
  '/images/bento/15.webp': [1200, 800], '/images/bento/16.webp': [408, 1200],
  '/images/bento/17.webp': [400, 1200],
  '/images/bento/Aircam-scaled.webp': [1200, 748],
  '/images/bento/Kara-1.webp': [1200, 603],
  '/images/bento/Vogue-scaled.webp': [1200, 675],
  '/images/team/team-021.webp': [1200, 796],
  '/images/team/team-028.webp': [1200, 800],
  '/images/team/team-128.webp': [1200, 800],
  '/images/savoirfaire/sf-borddemer-15.webp': [904, 1200],
  '/images/savoirfaire/sf-borne-basicfit-15.webp': [1200, 900],
  '/images/savoirfaire/sf-borne-creditmutuel.webp': [1200, 900],
  '/images/savoirfaire/sf-borne-perso.webp': [1200, 900],
  '/images/savoirfaire/sf-evenement-15.webp': [736, 1155],
  '/images/savoirfaire/sf-gala.webp': [327, 486],
  '/images/savoirfaire/sf-mariage.webp': [330, 487],
  '/images/savoirfaire/sf-nrj-7.webp': [1200, 808],
  '/images/savoirfaire/sf-paris-15-scaled.webp': [583, 1200],
  '/images/savoirfaire/sf-soiree.webp': [327, 487],
  '/images/agence/paris-51.webp': [1200, 900],
  '/images/agence/paris-52.webp': [900, 1200],
  '/images/agence/paris-53.webp': [900, 1200],
  '/images/agence/paris-54.webp': [900, 1200],
  '/images/agence/paris-55.webp': [1200, 900],
};
// Logos all 417x417
for (let i = 2; i <= 19; i++) {
  const pad = i.toString().padStart(2, '0');
  imageDimensions[`/images/logos/logo ils nous font confiance-${pad}.webp`] = [417, 417];
}
imageDimensions['/images/logos/logo ils nous font confiance_Plan de travail 1.webp'] = [417, 417];

// ===== SHARED: Read header & footer =====
function readSection(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    console.error(`ERROR: Could not extract <body> from ${filePath}`);
    process.exit(1);
  }
  content = bodyMatch[1].trim();
  // Fix image paths (both ../public/ and ../../public/ for subdirectories)
  content = content.replace(/src="(?:\.\.\/)+public\/images\//g, 'src="/images/');
  content = content.replace(/url\((?:\.\.\/)+public\/images\//g, 'url(/images/');
  content = content.replace(/url\('(?:\.\.\/)+public\/images\//g, "url('/images/");
  content = content.replace(/src="\.\.\/public\/logo/g, 'src="/logo');
  return content;
}

const sharedHeader = readSection(path.join(previewsDir, 'header.html'));
const sharedFooter = readSection(path.join(previewsDir, 'footer.html'));

// ===== POST-PROCESSING for Lighthouse =====
function postProcess(html) {
  // 1. Add width/height + loading="lazy" + decoding="async" to images
  html = html.replace(/<img\s([^>]*?)>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src="([^"]+)"/);
    if (!srcMatch) return match;
    const src = srcMatch[1];

    // External images (blog thumbnails from WordPress)
    if (src.startsWith('http')) {
      if (!attrs.includes('width=') && src.includes('768x494')) {
        attrs += ' width="768" height="494"';
      }
      if (!attrs.includes('loading=')) attrs += ' loading="lazy"';
      if (!attrs.includes('decoding=')) attrs += ' decoding="async"';
      return `<img ${attrs}>`;
    }

    // Add width/height if missing
    if (!attrs.includes('width=')) {
      const dims = imageDimensions[src];
      if (dims) {
        attrs += ` width="${dims[0]}" height="${dims[1]}"`;
      }
    }

    // Logo = above the fold, no lazy
    if (!attrs.includes('loading=')) {
      if (src.includes('/logo/')) {
        attrs += ' fetchpriority="high"';
      } else {
        attrs += ' loading="lazy"';
      }
    }

    if (!attrs.includes('decoding=')) {
      attrs += ' decoding="async"';
    }

    return `<img ${attrs}>`;
  });

  // 2. Add rel="noopener noreferrer" to external links with target="_blank"
  html = html.replace(/<a\s([^>]*?target="_blank"[^>]*?)>/gi, (match, attrs) => {
    if (!attrs.includes('rel=')) {
      attrs += ' rel="noopener noreferrer"';
    }
    return `<a ${attrs}>`;
  });

  // 3. Add data-snb-edit attributes for admin inline editing
  const sectionMap = {
    'snb-hero': 'hero',
    'snb-bento': 'bento',
    'trust': 'trust',
    'snb-stats': 'stats',
    'snb-avis': 'avis',
    'snb-equipe': 'equipe',
    'snb-sf': 'savoirfaire',
    'snb-mur': 'mur',
    'snb-cf': 'carte-france',
    'snb-bl': 'blog',
    'snb-footer': 'footer',
    'snb-ft': 'footer'
  };

  const cheerio = require('cheerio');
  const $ = cheerio.load(html, { decodeEntities: false });
  const sectionCounters = {};

  const editableTags = ['h1', 'h2', 'h3', 'h4'];
  $(editableTags.join(',')).each((i, el) => {
    const $el = $(el);
    if ($el.closest('#snb-admin-bar, #snb-seo-panel').length) return;
    if (!$el.text().trim()) return;
    let section = 'unknown';
    for (const [cls, name] of Object.entries(sectionMap)) {
      if ($el.closest('.' + cls).length || $el.closest('[class*="' + cls + '"]').length) {
        section = name;
        break;
      }
    }
    if (!sectionCounters[section]) sectionCounters[section] = 0;
    const idx = sectionCounters[section]++;
    const tag = el.tagName.toLowerCase();
    $el.attr('data-snb-edit', `${section}:${idx}:${tag}`);
    $el.attr('data-snb-section', section);
    $el.attr('data-snb-tag', tag.toUpperCase());
  });

  const editableClasses = [
    '.hero-subtitle', '.hero-tagline',
    '.card-sub',
    '.trust-title',
    '.equipe-subtitle', '.eq-card-text', '.eq-card-label', '.eq-reass-quote',
    '.sf-card-desc', '.sf-engage-desc', '.sf-feature-text',
    '.sf-cta-note', '.sf-review-text', '.sf-engage-sub',
    '.sf-stat-n', '.sf-stat-l',
    '.sf-gallery-caption', '.sf-gallery-label',
    '.stat-label',
    '.sm-subtitle', '.sm-cta-sub',
    '.snb-cf-title', '.snb-cf-info-title', '.snb-cf-info-text',
    '.snb-bl-title', '.snb-bl-subtitle',
    '.snb-ft-cta-title', '.snb-ft-cta-text', '.snb-ft-cta-subtitle', '.snb-ft-desc'
  ];
  editableClasses.forEach(sel => {
    $(sel).each((i, el) => {
      const $el = $(el);
      if ($el.attr('data-snb-edit')) return;
      let section = 'unknown';
      for (const [cls, name] of Object.entries(sectionMap)) {
        if ($el.closest('.' + cls).length || $el.closest('[class*="' + cls + '"]').length) {
          section = name;
          break;
        }
      }
      if (!sectionCounters[section]) sectionCounters[section] = 0;
      const idx = sectionCounters[section]++;
      const tag = el.tagName.toLowerCase();
      $el.attr('data-snb-edit', `${section}:${idx}:${tag}`);
      $el.attr('data-snb-section', section);
      $el.attr('data-snb-tag', tag.toUpperCase());
    });
  });

  html = $.html();
  return html;
}

// ===== CSS HELPERS =====
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractAndProcessCSS(html, inlineAll) {
  const styleBlocks = [];
  let blockIdx = 0;
  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    blockIdx++;
    const isCritical = inlineAll || blockIdx <= 3; // blocks 1-3 = global, header, hero
    styleBlocks.push({ css, isCritical, index: blockIdx });
    if (isCritical) {
      return `<style>${minifyCSS(css)}</style>`;
    }
    return '';
  });

  const nonCriticalCSS = styleBlocks.filter(b => !b.isCritical).map(b => b.css).join('\n');
  const minified = minifyCSS(nonCriticalCSS);

  return { html, styleBlocks, minifiedCSS: minified };
}

function extractScripts(html) {
  const scriptBlocks = [];
  html = html.replace(/<script>([\s\S]*?)<\/script>/gi, (match, js) => {
    const trimmed = js.trim();
    if (!trimmed) return '';
    scriptBlocks.push(trimmed);
    return '';
  });
  return { html, scriptBlocks };
}

function minifyHTML(html) {
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
  html = html.replace(/\n\s*\n\s*\n/g, '\n');
  html = html.replace(/\n\s{2,}/g, '\n');
  html = html.replace(/\n\s*\n/g, '\n');
  return html;
}

// ===== BUILD EACH PAGE =====
for (const page of pages) {
  console.log(`\n=== Building: ${page.slug} ===`);

  // Read page-specific sections
  const sectionContents = {};
  for (const name of page.sections) {
    const filePath = path.join(page.previewDir, `${name}.html`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  WARN: ${name}.html not found in ${page.previewDir}, skipping`);
      continue;
    }
    sectionContents[name] = readSection(filePath);
  }

  // Assemble page HTML
  const preloadImg = page.preloadImage
    ? `<link rel="preload" as="image" href="${page.preloadImage}" type="image/webp" fetchpriority="high">`
    : '';

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${page.ogTitle}">
<meta property="og:description" content="${page.ogDescription}">
<meta property="og:image" content="${page.ogImage}">
<meta property="og:url" content="${page.ogUrl}">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
${preloadImg}
<link rel="dns-prefetch" href="https://shootnbox.fr">
<link rel="preload" as="font" type="font/woff2" href="/fonts/raleway-latin.woff2" crossorigin>
<style>
@font-face{font-family:'Raleway';font-style:normal;font-weight:400 900;font-display:swap;src:url(/fonts/raleway-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Raleway';font-style:normal;font-weight:400 900;font-display:swap;src:url(/fonts/raleway-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Raleway';font-style:italic;font-weight:900;font-display:swap;src:url(/fonts/raleway-900i-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Raleway';font-style:italic;font-weight:900;font-display:swap;src:url(/fonts/raleway-900i-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: "Raleway", sans-serif; color: #333; line-height: 1.6; background: #fff; -webkit-font-smoothing: antialiased; }
.snb-page-wrapper { overflow-x: hidden; }
a { text-decoration: none; color: inherit; }
img { max-width: 100%; height: auto; }
ul { list-style: none; padding: 0; margin: 0; }
.snb-page-content { padding-top: 72px; }
@media (max-width: 850px) { .snb-page-content { padding-top: 60px; } }
</style>
</head>
<body>

${sharedHeader}

<main class="snb-page-content">
${page.sections.filter(s => sectionContents[s]).map(s => sectionContents[s]).join('\n\n')}
</main>

${sharedFooter}

</body>
</html>`;

  // Apply Lighthouse optimizations
  html = postProcess(html);

  // CSS extraction
  const cssResult = extractAndProcessCSS(html, page.inlineAllCSS);
  html = cssResult.html;

  // Write page-specific CSS (or shared if home)
  const cssFileName = page.slug === 'home' ? 'styles.css' : `styles-${page.slug}.css`;
  fs.writeFileSync(path.join(__dirname, 'public', cssFileName), cssResult.minifiedCSS, 'utf8');

  // Add deferred CSS link
  html = html.replace('</head>',
    `<link rel="preload" as="style" href="/${cssFileName}" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="/${cssFileName}"></noscript>\n</head>`
  );

  // Script extraction
  const jsResult = extractScripts(html);
  html = jsResult.html;

  const jsFileName = page.slug === 'home' ? 'scripts.js' : `scripts-${page.slug}.js`;
  if (jsResult.scriptBlocks.length > 0) {
    const allScripts = jsResult.scriptBlocks.join('\n');
    fs.writeFileSync(path.join(__dirname, 'public', jsFileName), allScripts, 'utf8');
    const cacheBust = Date.now();
    html = html.replace('</body>', `<script src="/${jsFileName}?v=${cacheBust}" defer></script>\n</body>`);
    console.log(`  Scripts: ${jsResult.scriptBlocks.length} blocks → ${jsFileName} (${(allScripts.length/1024).toFixed(1)} KB)`);
  }

  // HTML minification
  const sizeBefore = Buffer.byteLength(html);
  html = minifyHTML(html);
  const sizeAfter = Buffer.byteLength(html);

  // Ensure output directory exists
  const outputPath = path.join(__dirname, page.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');

  // Stats
  const criticalSize = cssResult.styleBlocks.filter(b=>b.isCritical).reduce((s,b)=>s+b.css.length,0);
  console.log(`  Critical CSS: ${(criticalSize/1024)|0} KB | External CSS: ${(cssResult.minifiedCSS.length/1024).toFixed(1)} KB`);
  console.log(`  HTML: ${(sizeBefore/1024).toFixed(1)} KB → ${(sizeAfter/1024).toFixed(1)} KB`);
  console.log(`  → ${page.output} (${(sizeAfter/1024).toFixed(1)} KB)`);

  const imgCount = (html.match(/<img /g) || []).length;
  const lazyCount = (html.match(/loading="lazy"/g) || []).length;
  console.log(`  Images: ${imgCount} total, ${lazyCount} lazy`);
}

console.log('\nAll pages built successfully!');
