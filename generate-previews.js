const fs = require('fs');
const path = require('path');

const sectionsDir = path.join(__dirname, 'public', 'sections');
const previewsDir = path.join(__dirname, 'previews');

if (!fs.existsSync(previewsDir)) fs.mkdirSync(previewsDir);

const sections = [
  'header', 'hero', 'trust', 'bento', 'bornes', 'stats',
  'avis', 'equipe', 'savoirfaire', 'mur', 'carte-france', 'blog', 'footer'
];

for (const name of sections) {
  const filePath = path.join(sectionsDir, `${name}.html`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix image paths: /images/ -> ../public/images/
  content = content.replace(/src="\/images\//g, 'src="../public/images/');
  content = content.replace(/url\(\/images\//g, 'url(../public/images/');
  content = content.replace(/url\('\/images\//g, "url('../public/images/");

  // Fix logo path in header
  content = content.replace(/src="\/logo/g, 'src="../public/logo');

  // Clean up header: remove demo content (same as build.js)
  if (name === 'header') {
    content = content.replace(/<!-- ========== CONTENU DEMO ==========[\s\S]*?(?=<script>)/, '');
    content = content.replace(/\/\* ========== CONTENU DEMO ========== \*\/[\s\S]*?(?=<\/style>)/, '');
  }

  // Clean up footer: remove demo content and Vamtam overrides (same as build.js)
  if (name === 'footer') {
    content = content.replace(/\/\* Contenu demo pour scroller \*\/[\s\S]*?\.demo p \{[^}]*\}/, '');
    content = content.replace(/\/\* ={5,}\s*\n\s*OVERRIDES VAMTAM[\s\S]*?(?=<\/style>)/, '');
    content = content.replace(/<!-- Contenu demo -->[\s\S]*?<\/div>\s*\n/, '');
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview - ${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700;1,800;1,900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; font-family: "Raleway", sans-serif; color: #333; line-height: 1.6; background: #fff; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; color: inherit; }
img { max-width: 100%; height: auto; }
ul { list-style: none; padding: 0; margin: 0; }
</style>
</head>
<body>

${content}

</body>
</html>`;

  const outPath = path.join(previewsDir, `${name}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`${name}.html -> ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

console.log(`\nDone! ${sections.length} previews in ${previewsDir}`);
