(function() {
  'use strict';

  // State
  let changes = {};
  let originalTexts = {};
  let currentSlug = 'home';
  let seoData = {};
  let imageChanges = 0;

  // ===== BUILD ADMIN BAR =====
  function buildAdminBar() {
    document.body.classList.add('snb-admin-mode');

    const bar = document.createElement('div');
    bar.id = 'snb-admin-bar';
    bar.innerHTML = `
      <div class="snb-ab-logo">Shoot<span>n</span>box</div>
      <div class="snb-ab-sep"></div>
      <select id="snbPageSelect"></select>
      <div class="snb-ab-changes" id="snbChangesCount"></div>
      <div class="snb-ab-spacer"></div>
      <button class="snb-ab-btn snb-ab-btn-seo" id="snbSeoBtn">SEO</button>
      <button class="snb-ab-btn snb-ab-btn-publish" id="snbPublishBtn" disabled>Publier</button>
      <button class="snb-ab-btn snb-ab-btn-logout" id="snbLogoutBtn">Deconnexion</button>
    `;
    document.body.prepend(bar);

    // Toast
    const toast = document.createElement('div');
    toast.id = 'snb-admin-toast';
    document.body.appendChild(toast);

    // SEO Panel
    const seoPanel = document.createElement('div');
    seoPanel.id = 'snb-seo-panel';
    seoPanel.innerHTML = `
      <button class="snb-seo-close" id="snbSeoClose">&times;</button>
      <h3>SEO - Meta tags</h3>
      <div class="snb-seo-grid">
        <div class="snb-seo-field">
          <label>Title</label>
          <input type="text" id="snbSeoTitle" placeholder="Titre de la page">
        </div>
        <div class="snb-seo-field">
          <label>Meta Description</label>
          <input type="text" id="snbSeoDesc" placeholder="Description pour Google">
        </div>
        <div class="snb-seo-field">
          <label>OG Title (reseaux sociaux)</label>
          <input type="text" id="snbSeoOgTitle" placeholder="Titre Facebook/LinkedIn">
        </div>
        <div class="snb-seo-field">
          <label>OG Description</label>
          <input type="text" id="snbSeoOgDesc" placeholder="Description reseaux sociaux">
        </div>
      </div>
    `;
    document.body.appendChild(seoPanel);

    // Events
    document.getElementById('snbPublishBtn').addEventListener('click', publish);
    document.getElementById('snbLogoutBtn').addEventListener('click', logout);
    document.getElementById('snbSeoBtn').addEventListener('click', () => seoPanel.classList.toggle('open'));
    document.getElementById('snbSeoClose').addEventListener('click', () => seoPanel.classList.remove('open'));

    // SEO field changes
    ['snbSeoTitle', 'snbSeoDesc', 'snbSeoOgTitle', 'snbSeoOgDesc'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        seoData._modified = true;
        updateChangesCount();
      });
    });

    // Load pages
    loadPages();
  }

  // ===== LOAD PAGES =====
  async function loadPages() {
    try {
      const res = await fetch('/api/pages');
      const pages = await res.json();
      const select = document.getElementById('snbPageSelect');
      select.innerHTML = '';
      pages.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.slug;
        opt.textContent = p.name;
        opt.dataset.path = p.path;
        if (p.path === window.location.pathname || (p.slug === 'home' && window.location.pathname === '/')) {
          opt.selected = true;
          currentSlug = p.slug;
        }
        select.appendChild(opt);
      });

      select.addEventListener('change', () => {
        const opt = select.options[select.selectedIndex];
        if (Object.keys(changes).length > 0 || seoData._modified) {
          if (!confirm('Vous avez des modifications non publiees. Changer de page sans publier ?')) {
            select.value = currentSlug;
            return;
          }
        }
        window.location.href = opt.dataset.path;
      });

      // Load SEO data
      loadSEO();
      // Init editable elements
      initEditableElements();
      // Init editable images
      initEditableImages();
    } catch (err) {
      showToast('Erreur de chargement', 'error');
    }
  }

  // ===== LOAD SEO =====
  async function loadSEO() {
    try {
      const res = await fetch('/api/page/' + currentSlug);
      const data = await res.json();
      seoData = data.seo || {};
      document.getElementById('snbSeoTitle').value = seoData.title || '';
      document.getElementById('snbSeoDesc').value = seoData.description || '';
      document.getElementById('snbSeoOgTitle').value = seoData.ogTitle || '';
      document.getElementById('snbSeoOgDesc').value = seoData.ogDescription || '';
    } catch (e) { /* ignore */ }
  }

  // ===== INIT EDITABLE ELEMENTS =====
  function initEditableElements() {
    const editables = document.querySelectorAll('[data-snb-edit]');
    console.log('[SNB Admin] Found', editables.length, 'editable elements');
    if (editables.length === 0) {
      showToast('Aucun element editable trouve !', 'error');
    }

    editables.forEach(el => {
      const id = el.getAttribute('data-snb-edit');
      const tag = el.tagName.toLowerCase();

      // Store original text
      originalTexts[id] = el.innerHTML;

      // Set tag badge
      el.setAttribute('data-snb-tag', tag.toUpperCase());

      // Store original tag
      el.dataset.snbOrigTag = tag;

      // Make focusable
      el.setAttribute('tabindex', '0');

      // Build tag selector buttons
      const tagBar = document.createElement('div');
      tagBar.className = 'snb-tag-select';
      ['H1','H2','H3','H4','P'].forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'snb-tag-btn' + (t === tag.toUpperCase() ? ' active' : '');
        btn.textContent = t;
        btn.type = 'button';
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault(); // prevent blur
          e.stopPropagation();
          changeTag(el, t.toLowerCase());
        });
        tagBar.appendChild(btn);
      });
      el.style.position = 'relative';
      el.appendChild(tagBar);

      // On click: enter edit mode
      el.addEventListener('click', (e) => {
        if (e.target.closest('.snb-tag-select')) return;
        if (e.target.tagName === 'A' && !e.target.closest('[data-snb-edit]').getAttribute('contenteditable')) {
          e.preventDefault();
        }
        el.setAttribute('contenteditable', 'true');
        el.focus();
      });

      // On focus: show tag bar + enable editing
      el.addEventListener('focus', () => {
        el.setAttribute('contenteditable', 'true');
        tagBar.style.display = 'flex';
      });

      // On blur: exit edit mode, track changes
      el.addEventListener('blur', () => {
        el.removeAttribute('contenteditable');
        tagBar.style.display = 'none';
        trackChange(el, id);
      });

      // Prevent Enter from creating divs
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          const t = el.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'h4', 'p'].includes(t)) {
            e.preventDefault();
            el.blur();
          }
        }
        if (e.key === 'Escape') {
          el.innerHTML = originalTexts[id];
          el.blur();
        }
      });

      // Prevent link clicks when editing
      el.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
          if (el.getAttribute('contenteditable') === 'true') {
            e.preventDefault();
          }
        });
      });
    });
  }

  // ===== INIT EDITABLE IMAGES =====
  function initEditableImages() {
    const images = document.querySelectorAll('[data-snb-img]');
    console.log('[SNB Admin] Found', images.length, 'editable images');

    images.forEach(img => {
      // Wrap each image in its own container for independent overlay
      const imgWrap = document.createElement('div');
      imgWrap.className = 'snb-img-wrap';
      img.parentNode.insertBefore(imgWrap, img);
      imgWrap.appendChild(img);

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'snb-img-overlay';
      overlay.innerHTML = `
        <div class="snb-img-overlay-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Changer l'image
        </div>
      `;

      // File input (hidden)
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener('change', async () => {
        if (!fileInput.files.length) return;
        const file = fileInput.files[0];
        const data = img.getAttribute('data-snb-img');
        const parts = data.split(':');
        const section = parts[0];
        const originalSrc = parts.slice(2).join(':');

        // Show loading state
        overlay.classList.add('snb-img-uploading');
        overlay.querySelector('.snb-img-overlay-btn').textContent = 'Upload...';

        try {
          // Calculate target size based on rendered size (2x for retina)
          const renderedW = img.offsetWidth || img.naturalWidth;
          const renderedH = img.offsetHeight || img.naturalHeight;
          const maxWidth = Math.max(renderedW * 2, 400);
          const maxHeight = Math.max(renderedH * 2, 400);

          const formData = new FormData();
          formData.append('image', file);
          formData.append('originalSrc', originalSrc);
          formData.append('section', section);
          formData.append('slug', currentSlug);
          formData.append('maxWidth', maxWidth);
          formData.append('maxHeight', maxHeight);

          const res = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Erreur upload');
          }

          const result = await res.json();

          // Update image src with cache-busting
          img.src = result.newSrc + '?v=' + Date.now();
          imageChanges++;
          showToast('Image mise a jour !', 'success');

        } catch (err) {
          showToast('Erreur: ' + err.message, 'error');
        }

        // Reset overlay
        overlay.classList.remove('snb-img-uploading');
        overlay.querySelector('.snb-img-overlay-btn').innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Changer l'image
        `;
        fileInput.value = '';
      });

      imgWrap.appendChild(overlay);
      imgWrap.appendChild(fileInput);
    });
  }

  // ===== CHANGE TAG (H1 <-> H2 etc) =====
  function changeTag(el, newTag) {
    const id = el.getAttribute('data-snb-edit');
    const currentTag = el.tagName.toLowerCase();
    if (currentTag === newTag) return;

    // Create new element with the new tag
    const newEl = document.createElement(newTag);
    // Copy all attributes
    for (const attr of el.attributes) {
      newEl.setAttribute(attr.name, attr.value);
    }
    // Copy content
    newEl.innerHTML = el.innerHTML;
    // Update tag badge
    newEl.setAttribute('data-snb-tag', newTag.toUpperCase());

    // Replace in DOM
    el.parentNode.replaceChild(newEl, el);

    // Re-init this element (events + tag bar)
    initSingleEditable(newEl);

    // Track the change
    trackChange(newEl, id);

    // Focus the new element
    newEl.setAttribute('contenteditable', 'true');
    newEl.focus();
  }

  function trackChange(el, id) {
    const newText = el.innerHTML;
    // Remove tag bar content from tracked text
    const cleanText = newText.replace(/<div class="snb-tag-select"[\s\S]*?<\/div>/, '');
    const currentTag = el.tagName.toLowerCase();
    const origTag = el.dataset.snbOrigTag || currentTag;

    if (cleanText !== originalTexts[id] || currentTag !== origTag) {
      changes[id] = { id, text: cleanText, tag: currentTag, tagChanged: currentTag !== origTag };
      el.classList.add('snb-modified');
    } else {
      delete changes[id];
      el.classList.remove('snb-modified');
    }
    updateChangesCount();
  }

  function initSingleEditable(el) {
    const id = el.getAttribute('data-snb-edit');
    const tag = el.tagName.toLowerCase();

    el.dataset.snbOrigTag = el.dataset.snbOrigTag || tag;
    el.setAttribute('tabindex', '0');

    // Rebuild tag bar
    let tagBar = el.querySelector('.snb-tag-select');
    if (!tagBar) {
      tagBar = document.createElement('div');
      tagBar.className = 'snb-tag-select';
      el.style.position = 'relative';
      el.appendChild(tagBar);
    }
    tagBar.innerHTML = '';
    ['H1','H2','H3','H4','P'].forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'snb-tag-btn' + (t === tag.toUpperCase() ? ' active' : '');
      btn.textContent = t;
      btn.type = 'button';
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        changeTag(el, t.toLowerCase());
      });
      tagBar.appendChild(btn);
    });
    tagBar.style.display = 'none';

    el.addEventListener('click', (e) => {
      if (e.target.closest('.snb-tag-select')) return;
      if (e.target.tagName === 'A') e.preventDefault();
      el.setAttribute('contenteditable', 'true');
      el.focus();
    });

    el.addEventListener('focus', () => {
      el.setAttribute('contenteditable', 'true');
      tagBar.style.display = 'flex';
    });

    el.addEventListener('blur', () => {
      el.removeAttribute('contenteditable');
      tagBar.style.display = 'none';
      trackChange(el, id);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (['h1','h2','h3','h4','p'].includes(el.tagName.toLowerCase())) {
          e.preventDefault();
          el.blur();
        }
      }
      if (e.key === 'Escape') {
        el.innerHTML = originalTexts[id];
        initSingleEditable(el);
        el.blur();
      }
    });

    el.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        if (el.getAttribute('contenteditable') === 'true') e.preventDefault();
      });
    });
  }

  // ===== UPDATE CHANGES COUNT =====
  function updateChangesCount() {
    const count = Object.keys(changes).length + (seoData._modified ? 1 : 0);
    const el = document.getElementById('snbChangesCount');
    const btn = document.getElementById('snbPublishBtn');
    if (count > 0) {
      el.textContent = count + ' modification' + (count > 1 ? 's' : '');
      el.classList.add('show');
      btn.disabled = false;
    } else {
      el.classList.remove('show');
      btn.disabled = true;
    }
  }

  // ===== PUBLISH =====
  async function publish() {
    const btn = document.getElementById('snbPublishBtn');
    btn.disabled = true;
    btn.textContent = 'Sauvegarde...';

    try {
      // Collect SEO changes
      const seo = seoData._modified ? {
        title: document.getElementById('snbSeoTitle').value,
        description: document.getElementById('snbSeoDesc').value,
        ogTitle: document.getElementById('snbSeoOgTitle').value,
        ogDescription: document.getElementById('snbSeoOgDesc').value
      } : null;

      // Clean tag bar HTML from change texts before saving
      const cleanChanges = Object.values(changes).map(c => ({
        ...c,
        text: c.text.replace(/<div class="snb-tag-select"[\s\S]*?<\/div>/g, '')
      }));

      // Save content
      const saveRes = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: currentSlug,
          changes: cleanChanges,
          seo
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur sauvegarde (' + saveRes.status + ')');
      }
      showToast('Sauvegarde OK, reconstruction...', 'success');

      btn.textContent = 'Reconstruction...';

      // Rebuild site
      const deployRes = await fetch('/api/deploy', { method: 'POST' });
      if (!deployRes.ok) {
        const errData = await deployRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur reconstruction (' + deployRes.status + ')');
      }

      showToast('Modifications appliquees !', 'success');

      // Reset state
      changes = {};
      seoData._modified = false;
      document.querySelectorAll('.snb-modified').forEach(el => el.classList.remove('snb-modified'));
      updateChangesCount();

      // Update original texts to new values
      document.querySelectorAll('[data-snb-edit]').forEach(el => {
        originalTexts[el.getAttribute('data-snb-edit')] = el.innerHTML;
      });

    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
    }

    btn.textContent = 'Publier';
    btn.disabled = Object.keys(changes).length === 0;
  }

  // ===== LOGOUT =====
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/edition-shootnbox';
  }

  // ===== TOAST =====
  function showToast(msg, type) {
    const toast = document.getElementById('snb-admin-toast');
    toast.textContent = msg;
    toast.className = 'show ' + (type || '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 3000);
  }

  // ===== WARN BEFORE LEAVING =====
  window.addEventListener('beforeunload', (e) => {
    if (Object.keys(changes).length > 0 || seoData._modified) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ===== INIT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildAdminBar);
  } else {
    buildAdminBar();
  }
})();
