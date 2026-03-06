const fs = require('fs');
const path = require('path');

const sectionsDir = path.join(__dirname, 'public', 'sections');

// Order of sections matching the WordPress home-v2
const sections = [
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
  'blog',
  'footer'
];

// Read all section files
const sectionContents = {};
for (const name of sections) {
  const filePath = path.join(sectionsDir, `${name}.html`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Clean up header: remove demo content
  if (name === 'header') {
    // Remove everything from "<!-- ========== CONTENU DEMO ==========" to the script tag
    content = content.replace(/<!-- ========== CONTENU DEMO ==========[\s\S]*?(?=<script>)/, '');
    // Also remove .demo CSS block
    content = content.replace(/\/\* ========== CONTENU DEMO ========== \*\/[\s\S]*?(?=<\/style>)/, '');
  }

  // Clean up footer: remove demo content and Vamtam overrides
  if (name === 'footer') {
    // Remove demo CSS
    content = content.replace(/\/\* Contenu demo pour scroller \*\/[\s\S]*?\.demo p \{[^}]*\}/, '');
    // Remove Vamtam override CSS block (not needed without WordPress)
    content = content.replace(/\/\* ={5,}\s*\n\s*OVERRIDES VAMTAM[\s\S]*?(?=<\/style>)/, '');
    // Remove demo HTML
    content = content.replace(/<!-- Contenu demo -->[\s\S]*?<\/div>\s*\n/, '');
  }


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
${sectionContents['hero']}
${sectionContents['trust']}
${sectionContents['bento']}
${sectionContents['bornes']}
${sectionContents['stats']}
${sectionContents['avis']}
${sectionContents['equipe']}
${sectionContents['savoirfaire']}
${sectionContents['mur']}
${sectionContents['blog']}
</main>

${sectionContents['footer']}

</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html, 'utf8');
console.log('index.html built successfully!');
console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
