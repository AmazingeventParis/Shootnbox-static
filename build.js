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
  'footer'
];

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

// Build the page
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Shootnbox - Location Photobooth</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: "Raleway", sans-serif; color: #333; line-height: 1.6; background: #fff; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
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

fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html, 'utf8');
console.log('index.html built successfully!');
console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
