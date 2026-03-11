const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');
const multer = require('multer');
const sharp = require('sharp');

// Ensure uploads_tmp dir exists (multer doesn't create it)
const uploadDir = path.join(__dirname, 'uploads_tmp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer config - temp upload
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  }
});

const app = express();
const PORT = process.env.PORT || 80;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ShootnboxSEO2026';

// Signed cookie auth (no server-side sessions = survives deploys)
const COOKIE_SECRET = 'snb_' + ADMIN_PASSWORD; // deterministic secret

// Gzip/Brotli compression for all responses
app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// ===== AUTH =====

function signToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
}

function isAuthenticated(req) {
  return !!verifyToken(req.cookies.snb_session);
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'Non authentifié' });
}

// Login page
app.get('/edition-shootnbox', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Login API
app.post('/api/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    const token = signToken({ role: 'admin', created: Date.now() });
    res.cookie('snb_session', token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 an
      sameSite: 'lax'
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('snb_session');
  res.json({ success: true });
});

// ===== ADMIN API =====

// List available pages
app.get('/api/pages', requireAuth, (req, res) => {
  // For now: home page only. Later: scan for page directories
  const pages = [
    { slug: 'home', name: 'Accueil', path: '/' }
  ];
  // Auto-detect other pages from public/ subdirectories with index.html
  const publicDir = path.join(__dirname, 'public');
  try {
    const entries = fs.readdirSync(publicDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const indexPath = path.join(publicDir, entry.name, 'index.html');
        if (fs.existsSync(indexPath)) {
          pages.push({
            slug: entry.name,
            name: entry.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            path: '/' + entry.name + '/'
          });
        }
      }
    }
  } catch (e) { /* ignore */ }
  res.json(pages);
});

// Get editable elements for a page
app.get('/api/page/:slug', requireAuth, (req, res) => {
  const slug = req.params.slug;
  let htmlPath;

  if (slug === 'home') {
    htmlPath = path.join(__dirname, 'public', 'index.html');
  } else {
    htmlPath = path.join(__dirname, 'public', slug, 'index.html');
  }

  if (!fs.existsSync(htmlPath)) {
    return res.status(404).json({ error: 'Page non trouvée' });
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  // Extract editable elements
  const elements = [];
  $('[data-snb-edit]').each((i, el) => {
    const $el = $(el);
    elements.push({
      id: $el.attr('data-snb-edit'),
      tag: el.tagName.toLowerCase(),
      text: $el.html(),
      section: $el.attr('data-snb-section') || ''
    });
  });

  // Extract SEO meta
  const seo = {
    title: $('title').text(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || ''
  };

  res.json({ slug, elements, seo });
});

// Editable selectors (must match build.js postProcess logic)
const editableTags = ['h1', 'h2', 'h3', 'h4'];
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

// Find the nth editable element in a preview's HTML (replicates build.js counting)
function findEditableByIndex($, targetIndex) {
  const allEditables = [];

  // First: h1-h4 elements (same order as build.js)
  $(editableTags.join(',')).each((i, el) => {
    const $el = $(el);
    if (!$el.text().trim()) return;
    allEditables.push({ el, $el, tag: el.tagName.toLowerCase() });
  });

  // Then: specific class selectors
  editableClasses.forEach(sel => {
    $(sel).each((i, el) => {
      const $el = $(el);
      // Skip if already found as h1-h4
      if (allEditables.some(e => e.el === el)) return;
      allEditables.push({ el, $el, tag: el.tagName.toLowerCase() });
    });
  });

  return allEditables[targetIndex] || null;
}

// Save changes
app.post('/api/save', requireAuth, (req, res) => {
  const { slug, changes, seo } = req.body;

  try {
    if (slug === 'home') {
      // Group changes by section
      const changesBySection = {};
      for (const change of changes) {
        const [section, index, tag] = change.id.split(':');
        if (!changesBySection[section]) changesBySection[section] = [];
        changesBySection[section].push({ ...change, index: parseInt(index), tag });
      }

      // Update each preview file
      for (const [section, sectionChanges] of Object.entries(changesBySection)) {
        const previewPath = path.join(__dirname, 'previews', `${section}.html`);
        if (!fs.existsSync(previewPath)) continue;

        let html = fs.readFileSync(previewPath, 'utf8');
        const $ = cheerio.load(html, { decodeEntities: false });

        for (const change of sectionChanges) {
          const found = findEditableByIndex($, change.index);
          if (found) {
            found.$el.html(change.text);
            // Change tag if needed (e.g. h2 -> h1)
            if (change.tagChanged && change.tag) {
              const newTag = change.tag;
              const oldTag = found.el.tagName.toLowerCase();
              if (newTag !== oldTag) {
                // Replace the tag in cheerio
                found.el.tagName = newTag;
              }
            }
          }
        }

        // Write back preserving head/body structure
        const bodyContent = $('body').html() || $.html();
        const headMatch = html.match(/^[\s\S]*?<body[^>]*>/i);
        const tailMatch = html.match(/<\/body>[\s\S]*$/i);
        if (headMatch && tailMatch) {
          fs.writeFileSync(previewPath, headMatch[0] + bodyContent + tailMatch[0], 'utf8');
        } else {
          fs.writeFileSync(previewPath, bodyContent, 'utf8');
        }
      }

      // Update SEO in build.js if changed
      if (seo) {
        updateBuildSEO(seo);
      }

      // Rebuild
      try {
        execSync('node build.js', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
      } catch (buildErr) {
        console.error('Build error:', buildErr.stderr ? buildErr.stderr.toString() : buildErr.message);
        throw new Error('Build failed: ' + (buildErr.stderr ? buildErr.stderr.toString().slice(0, 200) : buildErr.message));
      }
    }

    res.json({ success: true, message: 'Sauvegardé' });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Deploy — rebuild the site from previews (no git push from container)
app.post('/api/deploy', requireAuth, (req, res) => {
  try {
    // Rebuild public/ from previews
    execSync('node build.js', { cwd: __dirname, timeout: 30000 });
    res.json({ success: true, message: 'Site reconstruit avec succès' });
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ error: err.message });
  }
});

function updateBuildSEO(seo) {
  const buildPath = path.join(__dirname, 'build.js');
  let buildContent = fs.readFileSync(buildPath, 'utf8');

  if (seo.title) {
    buildContent = buildContent.replace(
      /<title>[^<]*<\/title>/,
      `<title>${seo.title}</title>`
    );
  }
  if (seo.description) {
    buildContent = buildContent.replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${seo.description}$2`
    );
  }
  if (seo.ogTitle) {
    buildContent = buildContent.replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${seo.ogTitle}$2`
    );
  }
  if (seo.ogDescription) {
    buildContent = buildContent.replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${seo.ogDescription}$2`
    );
  }

  fs.writeFileSync(buildPath, buildContent, 'utf8');
}

// ===== IMAGE UPLOAD =====
app.post('/api/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  console.log('[Upload] Request received:', req.body?.originalSrc, 'file:', req.file?.originalname, req.file?.size, 'bytes');
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image envoyée' });

    const { originalSrc, section, slug } = req.body;
    if (!originalSrc) return res.status(400).json({ error: 'originalSrc manquant' });

    // Determine output path - keep same path, convert to webp
    let outputPath = originalSrc;
    const ext = path.extname(outputPath);
    if (ext !== '.webp') {
      outputPath = outputPath.replace(ext, '.webp');
    }

    // Full filesystem path
    const fullPath = path.join(__dirname, 'public', outputPath);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Resize to fit target dimensions + convert to WebP
    const maxW = parseInt(req.body.maxWidth) || 1200;
    const maxH = parseInt(req.body.maxHeight) || 1200;
    await sharp(req.file.path)
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullPath);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    // Update preview file if format changed (e.g. jpg -> webp)
    if (outputPath !== originalSrc) {
      updatePreviewImageSrc(slug, originalSrc, outputPath);
    }

    // Rebuild
    try {
      execSync('node build.js', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
    } catch (buildErr) {
      console.error('Build error after image upload:', buildErr.message);
    }

    // After rebuild, add cache-busting ?v= to this image in all HTML outputs
    const cacheBust = Date.now();
    const imgPathForBust = outputPath.replace(/^\//, ''); // images/savoirfaire/sf-borne-perso.webp
    const publicDir = path.join(__dirname, 'public');
    const htmlFiles = ['index.html', 'location-photobooth/index.html'];
    for (const hf of htmlFiles) {
      const htmlPath = path.join(publicDir, hf);
      if (!fs.existsSync(htmlPath)) continue;
      let html = fs.readFileSync(htmlPath, 'utf8');
      // Add ?v= to all occurrences of this image (src, srcset, url())
      const escaped = imgPathForBust.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(/' + escaped + ')(["\'\\s\\)])', 'g');
      const newHtml = html.replace(re, '$1?v=' + cacheBust + '$2');
      if (newHtml !== html) {
        fs.writeFileSync(htmlPath, newHtml, 'utf8');
        console.log('[Upload] Cache-bust added in', hf);
      }
    }

    const newSrcWithBust = outputPath + '?v=' + cacheBust;
    console.log('[Upload] Success:', newSrcWithBust, maxW + 'x' + maxH);
    res.json({ success: true, newSrc: newSrcWithBust });
  } catch (err) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Catch multer errors (file too large, wrong type, etc.)
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux (max 10 Mo)' });
  }
  if (err && err.message) {
    console.error('[Multer] Error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

function updatePreviewImageSrc(slug, oldSrc, newSrc) {
  // Find and update the preview file that contains this image
  const previewDir = slug === 'home'
    ? path.join(__dirname, 'previews')
    : path.join(__dirname, 'previews', slug);

  if (!fs.existsSync(previewDir)) return;

  // Only update active section files
  const activeSections = pageSections[slug] || [];
  const activeFiles = activeSections.map(s => s + '.html');
  const allFiles = fs.readdirSync(previewDir).filter(f => f.endsWith('.html'));
  const files = activeFiles.length > 0
    ? allFiles.filter(f => activeFiles.includes(f))
    : allFiles;

  for (const file of files) {
    const filePath = path.join(previewDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    // In previews, paths use relative ../../public/images/ or ../public/images/
    const imgPath = oldSrc.replace(/^\/images\//, '');
    const newImgPath = newSrc.replace(/^\/images\//, '');
    if (content.includes(imgPath)) {
      content = content.split(imgPath).join(newImgPath);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('[Upload] Updated src in', file);
    }
  }
}

// Active sections per page (must match build.js pages config)
const pageSections = {
  'home': ['header', 'hero', 'trust', 'bento', 'stats', 'avis', 'equipe', 'savoirfaire', 'mur', 'carte-france', 'blog', 'footer', 'bornes'],
  'location-photobooth': ['header', 'hero', 'intro', 'bornes', 'avis', 'usages', 'service-v2', 'fabrication', 'comparatif', 'couverture', 'faq', 'blog', 'footer']
};

// ===== IMAGE POSITION =====
app.post('/api/image-position', requireAuth, (req, res) => {
  try {
    const { slug, section, src, posX, posY } = req.body;
    if (!src) return res.status(400).json({ error: 'src manquant' });

    const previewDir = slug === 'home'
      ? path.join(__dirname, 'previews')
      : path.join(__dirname, 'previews', slug);

    // If section is provided, target the exact file first
    // This prevents modifying the wrong file when the same image appears in multiple sections
    const activeSections = pageSections[slug] || [];
    const activeFiles = activeSections.map(s => s + '.html');
    const allFiles = fs.readdirSync(previewDir).filter(f => f.endsWith('.html'));

    let files;
    if (section) {
      // Try the section file first, then fall back to all active files
      const sectionFile = section + '.html';
      const otherFiles = (activeFiles.length > 0
        ? allFiles.filter(f => activeFiles.includes(f))
        : allFiles).filter(f => f !== sectionFile);
      files = [sectionFile, ...otherFiles].filter(f => allFiles.includes(f));
    } else {
      files = activeFiles.length > 0
        ? allFiles.filter(f => activeFiles.includes(f))
        : allFiles;
    }

    const imgPath = src.replace(/^\/images\//, '');
    console.log('[Position] Section:', section, '| Searching in:', files.join(', '), 'for', imgPath);
    let found = false;

    for (const file of files) {
      const filePath = path.join(previewDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes(imgPath)) continue;

      // Simple string approach: find img tags containing this path
      const imgRegex = new RegExp(
        '(<img\\s[^>]*src="[^"]*' + imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*?)(/?>)',
        'g'
      );

      content = content.replace(imgRegex, (match, before, close) => {
        // Remove existing object-position from style
        let updated = before.replace(/\s*style="[^"]*"/, (styleAttr) => {
          return styleAttr
            .replace(/object-position:\s*[^;"]+;?\s*/g, '')
            .replace(/style="\s*"/, ''); // remove empty style
        });
        // Add new style with object-position
        const posStyle = `object-position: ${posX}% ${posY}%`;
        if (updated.includes('style="')) {
          updated = updated.replace(/style="([^"]*)"/, (m, existing) => {
            const clean = existing.replace(/;\s*$/, '');
            return `style="${clean}; ${posStyle}"`;
          });
        } else {
          updated += ` style="${posStyle}"`;
        }
        found = true;
        return updated + close;
      });

      // Also handle background-image divs
      const bgRegex = new RegExp(
        '(<[^>]+style="[^"]*url\\([^)]*' + imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^)]*\\)[^"]*)"',
        'g'
      );
      content = content.replace(bgRegex, (match, before) => {
        // Replace position in background shorthand (e.g. center 45%)
        let updated = before.replace(
          /(url\([^)]+\)\s*)(\w+\s+\d+%|\d+%\s+\d+%|center\s+center)/,
          `$1${posX}% ${posY}%`
        );
        found = true;
        return updated + '"';
      });

      if (found) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('[Position] Updated', file, 'for', imgPath, '->', posX + '%', posY + '%');
        break;
      }
    }

    if (!found) {
      console.log('[Position] Image not found:', imgPath, 'in', previewDir);
      return res.status(404).json({ error: 'Image non trouvée: ' + imgPath });
    }

    // Rebuild
    try {
      execSync('node build.js', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
      console.log('[Position] Rebuild OK');
    } catch (e) {
      console.error('[Position] Build error:', e.message);
      return res.status(500).json({ error: 'Build failed' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Position] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== MUR PHOTOS GALLERY MANAGER =====

// GET: list all mur photos by category
app.get('/api/mur-photos', requireAuth, (req, res) => {
  try {
    const murPath = path.join(__dirname, 'previews', 'mur.html');
    const html = fs.readFileSync(murPath, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });

    // Only get SET 1 (before the duplicate comment)
    const photos = { portrait: [], paysage: [], slim: [] };
    let pastDuplicate = false;
    $('#smStrip .sm-photo').each((i, el) => {
      const $el = $(el);
      // Stop at duplicate section
      const prevNode = el.previousSibling;
      if (prevNode && prevNode.nodeType === 8 && prevNode.data.includes('DUPLICATA')) {
        pastDuplicate = true;
      }
      if (pastDuplicate) return;

      const cat = $el.attr('data-cat');
      const src = $el.find('img').attr('src') || '';
      const normalizedSrc = src.replace(/^\.\.\/public/, '');
      if (cat && photos[cat] !== undefined) {
        // Avoid duplicates within SET 1
        if (!photos[cat].includes(normalizedSrc)) {
          photos[cat].push(normalizedSrc);
        }
      }
    });

    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: add a photo to the mur
app.post('/api/mur-photos', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucune image' });
    const { category } = req.body;
    if (!['portrait', 'paysage', 'slim'].includes(category)) {
      return res.status(400).json({ error: 'Categorie invalide' });
    }

    // Find next available filename
    const bentoDir = path.join(__dirname, 'public', 'images', 'bento');
    fs.mkdirSync(bentoDir, { recursive: true });
    const existing = fs.readdirSync(bentoDir).filter(f => f.endsWith('.webp'));
    const nums = existing.map(f => parseInt(f)).filter(n => !isNaN(n));
    const nextNum = (nums.length ? Math.max(...nums) + 1 : 20);
    const filename = nextNum + '.webp';
    const outputPath = path.join(bentoDir, filename);

    // Resize based on category (2x retina)
    const heights = { portrait: 560, paysage: 560, slim: 760 };
    await sharp(req.file.path)
      .resize(null, heights[category], { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outputPath);

    fs.unlinkSync(req.file.path);

    const imgSrc = '/images/bento/' + filename;

    // Update mur.html preview — add photo to SET 1 and DUPLICATA
    const murPath = path.join(__dirname, 'previews', 'mur.html');
    let murHtml = fs.readFileSync(murPath, 'utf8');

    const newPhotoHtml = `        <div class="sm-photo ${category}" data-cat="${category}"><img loading="lazy" src="../public${imgSrc}" alt="Tirage photo ${category}"></div>\n`;

    // Add before the DUPLICATA comment
    murHtml = murHtml.replace(
      /(\s*<!-- DUPLICATA boucle infinie -->)/,
      newPhotoHtml + '$1'
    );
    // Also add in the duplicata section (before closing </div> of strip)
    murHtml = murHtml.replace(
      /(\s*<\/div>\s*<\/div>\s*\n\s*\n\s*<div class="sm-cta-row">)/,
      newPhotoHtml + '$1'
    );

    fs.writeFileSync(murPath, murHtml, 'utf8');

    // Rebuild
    try {
      execSync('node build.js', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
    } catch (e) { console.error('Build error:', e.message); }

    res.json({ success: true, src: imgSrc, filename });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: remove a photo from the mur
app.delete('/api/mur-photos', requireAuth, (req, res) => {
  try {
    const { src } = req.body;
    if (!src) return res.status(400).json({ error: 'src manquant' });

    const murPath = path.join(__dirname, 'previews', 'mur.html');
    let murHtml = fs.readFileSync(murPath, 'utf8');

    // Remove all occurrences of this photo (SET 1 + duplicata)
    const previewSrc = '../public' + src;
    const regex = new RegExp(`\\s*<div class="sm-photo[^"]*"[^>]*><img[^>]*src="${previewSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*><\\/div>`, 'g');
    murHtml = murHtml.replace(regex, '');

    fs.writeFileSync(murPath, murHtml, 'utf8');

    // Rebuild
    try {
      execSync('node build.js', { cwd: __dirname, timeout: 30000, stdio: 'pipe' });
    } catch (e) { console.error('Build error:', e.message); }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SERVE SITE =====

// Inject admin script if authenticated
app.use((req, res, next) => {
  if (!isAuthenticated(req)) return next();

  const filePath = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
  // Only intercept HTML files
  if (!filePath.endsWith('.html') && !req.path.endsWith('/')) {
    // Check for directory with index.html
    const dirIndex = path.join(__dirname, 'public', req.path, 'index.html');
    if (!fs.existsSync(dirIndex)) return next();
  }

  let htmlPath = filePath;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    htmlPath = path.join(filePath, 'index.html');
  } else if (!filePath.endsWith('.html')) {
    htmlPath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(htmlPath)) return next();

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Inject admin toolbar + CSS + JS before </body>
  const adminCSS = fs.readFileSync(path.join(__dirname, 'admin', 'admin.css'), 'utf8');
  const adminJS = fs.readFileSync(path.join(__dirname, 'admin', 'admin.js'), 'utf8');

  const injection = `
<style id="snb-admin-css">${adminCSS}</style>
<script id="snb-admin-js">${adminJS}</script>`;

  html = html.replace('</body>', injection + '\n</body>');
  res.type('html').send(html);
});

// Static files with cache headers
app.use(express.static('public', {
  maxAge: '365d',        // cache assets for 1 year (Lighthouse requirement)
  etag: true,            // enable ETag for revalidation
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache'); // always revalidate HTML
    } else if (filePath.match(/\.(webp|jpg|jpeg|png|gif|svg)$/i)) {
      // Images: cache 1 year but revalidate (allows cache-busting via ?v=)
      res.setHeader('Cache-Control', 'public, max-age=31536000, must-revalidate');
    }
  }
}));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    if (isAuthenticated(req)) {
      let html = fs.readFileSync(indexPath, 'utf8');
      const adminCSS = fs.readFileSync(path.join(__dirname, 'admin', 'admin.css'), 'utf8');
      const adminJS = fs.readFileSync(path.join(__dirname, 'admin', 'admin.js'), 'utf8');
      html = html.replace('</body>', `\n<style id="snb-admin-css">${adminCSS}</style>\n<script id="snb-admin-js">${adminJS}</script>\n</body>`);
      res.type('html').send(html);
    } else {
      res.sendFile(indexPath);
    }
  } else {
    res.status(404).send('Page non trouvée');
  }
});

// No session cleanup needed — auth is cookie-based

app.listen(PORT, () => {
  console.log(`Shootnbox server running on port ${PORT}`);
});
