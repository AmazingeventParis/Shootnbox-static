const fs = require('fs');
const path = require('path');

const previewsDir = path.join(__dirname, 'previews');

// All sections in order (matching WordPress home-v2)
const allSections = [
  'header',
  'hero',
  'trust',
  'bento',
  'bornes',
  'stats',
  'avis',
  'equipe',
  'savoirfaire',
  'mur',
  'carte-france',
  'blog',
  'footer'
];

// Active sections to include in build (add modules one by one)
const sections = [
  'header',
  'hero',
  'trust',
  'bento',
  'stats',
  'avis',
  'equipe',
  'savoirfaire',
  'mur',
  'carte-france',
  'blog',
  'footer'
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

// Extract body content from preview files (already validated, no demo content)
const sectionContents = {};
for (const name of sections) {
  const filePath = path.join(previewsDir, `${name}.html`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract content between <body> and </body>
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    console.error(`ERROR: Could not extract <body> from ${name}.html`);
    process.exit(1);
  }
  content = bodyMatch[1].trim();

  // Fix image paths back: ../public/images/ -> /images/
  content = content.replace(/src="\.\.\/public\/images\//g, 'src="/images/');
  content = content.replace(/url\(\.\.\/public\/images\//g, 'url(/images/');
  content = content.replace(/url\('\.\.\/public\/images\//g, "url('/images/");

  // Fix logo path: ../public/logo -> /logo
  content = content.replace(/src="\.\.\/public\/logo/g, 'src="/logo');

  sectionContents[name] = content;
}

// ===== POST-PROCESSING for Lighthouse =====
function postProcess(html) {
  // 1. Add width/height + loading="lazy" + decoding="async" to images
  html = html.replace(/<img\s([^>]*?)>/gi, (match, attrs) => {
    const srcMatch = attrs.match(/src="([^"]+)"/);
    if (!srcMatch) return match;
    const src = srcMatch[1];

    // External images (blog thumbnails from WordPress) — add 768x494 dimensions
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

  return html;
}

// Build the page
let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Shootnbox - Location Photobooth &amp; Borne Photo Paris | \u00c9v\u00e9nements</title>
<meta name="description" content="Shootnbox, sp\u00e9cialiste de la location de photobooth et borne photo \u00e0 Paris et en \u00cele-de-France. Mariages, entreprises, soir\u00e9es : des souvenirs inoubliables pour vos \u00e9v\u00e9nements.">
<meta property="og:type" content="website">
<meta property="og:title" content="Shootnbox - Location Photobooth & Borne Photo Paris">
<meta property="og:description" content="Sp\u00e9cialiste de la location de photobooth et borne photo \u00e0 Paris. Mariages, entreprises, soir\u00e9es.">
<meta property="og:image" content="https://shootnbox.swipego.app/images/vegas-hero-group.webp">
<meta property="og:url" content="https://shootnbox.swipego.app/">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" as="image" href="/images/vegas-hero-group.webp" type="image/webp" fetchpriority="high">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>
<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: "Raleway", sans-serif; color: #333; line-height: 1.6; background: #fff; -webkit-font-smoothing: antialiased; }
.snb-page-wrapper { overflow-x: hidden; }
a { text-decoration: none; color: inherit; }
img { max-width: 100%; height: auto; }
ul { list-style: none; padding: 0; margin: 0; }
/* Header spacer */
.snb-page-content { padding-top: 72px; }
@media (max-width: 850px) { .snb-page-content { padding-top: 60px; } }
</style>
</head>
<body>

${sectionContents['header']}

<main class="snb-page-content">
${sections.filter(s => s !== 'header' && s !== 'footer' && sectionContents[s]).map(s => sectionContents[s]).join('\n\n')}
</main>

${sectionContents['footer']}

</body>
</html>`;

// Apply Lighthouse optimizations
html = postProcess(html);

// ===== CSS EXTRACTION & MINIFICATION =====
// Critical sections to keep inline (above the fold): global, header, hero
const criticalSections = ['HEADER', 'hero'];

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')        // remove comments
    .replace(/\s*\n\s*/g, '')                 // remove newlines
    .replace(/\s*{\s*/g, '{')                 // remove spaces around {
    .replace(/\s*}\s*/g, '}')                 // remove spaces around }
    .replace(/\s*:\s*/g, ':')                 // remove spaces around :
    .replace(/\s*;\s*/g, ';')                 // remove spaces around ;
    .replace(/\s*,\s*/g, ',')                 // remove spaces around ,
    .replace(/;}/g, '}')                      // remove last semicolon
    .replace(/\s{2,}/g, ' ')                  // collapse multiple spaces
    .trim();
}

// Extract all <style> blocks
const styleBlocks = [];
let blockIndex = 0;
html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
  blockIndex++;
  const isCritical = blockIndex <= 3; // blocks 1-3 = global, header, hero
  styleBlocks.push({ css, isCritical, index: blockIndex });
  if (isCritical) {
    return `<style>${minifyCSS(css)}</style>`;
  }
  return ''; // remove non-critical inline styles
});

// Write non-critical CSS to external file
const nonCriticalCSS = styleBlocks
  .filter(b => !b.isCritical)
  .map(b => b.css)
  .join('\n');
const minified = minifyCSS(nonCriticalCSS);
fs.writeFileSync(path.join(__dirname, 'public', 'styles.css'), minified, 'utf8');

// Add link to external CSS (deferred loading)
html = html.replace('</head>',
  `<link rel="preload" as="style" href="/styles.css" onload="this.onload=null;this.rel='stylesheet'">\n<noscript><link rel="stylesheet" href="/styles.css"></noscript>\n</head>`
);

console.log(`Critical CSS (inline): ${styleBlocks.filter(b=>b.isCritical).reduce((s,b)=>s+b.css.length,0)/1024|0} KB`);
console.log(`External CSS (styles.css): ${(minified.length/1024).toFixed(1)} KB (minified from ${(nonCriticalCSS.length/1024).toFixed(1)} KB)`);

fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html, 'utf8');
console.log('index.html built successfully!');
console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);

// Report optimization stats
const imgCount = (html.match(/<img /g) || []).length;
const lazyCount = (html.match(/loading="lazy"/g) || []).length;
const dimCount = (html.match(/<img [^>]*width="\d+"[^>]*height="\d+"/g) || []).length;
const noopenerCount = (html.match(/rel="noopener noreferrer"/g) || []).length;
console.log(`Images: ${imgCount} total, ${lazyCount} lazy, ${dimCount} with w/h`);
console.log(`External links secured: ${noopenerCount}`);
