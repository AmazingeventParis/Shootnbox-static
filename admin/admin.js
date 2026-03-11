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
      // Init mur gallery manager
      initMurGallery();
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
    const imgEls = document.querySelectorAll('[data-snb-img]');
    const bgEls = document.querySelectorAll('[data-snb-bg]');
    console.log('[SNB Admin] Found', imgEls.length, 'editable images +', bgEls.length, 'editable backgrounds');

    // Hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Floating toolbar (change + position)
    const toolbar = document.createElement('div');
    toolbar.className = 'snb-img-toolbar';
    toolbar.innerHTML = `
      <div class="snb-img-tb-row">
        <div class="snb-img-btn" id="snbImgChangeBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Changer
        </div>
        <div class="snb-img-btn snb-img-pos-btn" id="snbImgPosBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg> Position
        </div>
      </div>
      <div class="snb-img-sliders" id="snbImgSliders" style="display:none">
        <div class="snb-img-slider-row">
          <label>H</label>
          <input type="range" min="0" max="100" value="50" id="snbPosX">
          <span id="snbPosXVal">50%</span>
        </div>
        <div class="snb-img-slider-row">
          <label>V</label>
          <input type="range" min="0" max="100" value="50" id="snbPosY">
          <span id="snbPosYVal">50%</span>
        </div>
        <button class="snb-img-pos-save" id="snbPosSave">Appliquer</button>
      </div>
    `;
    toolbar.style.display = 'none';
    document.body.appendChild(toolbar);

    const changeBtn = document.getElementById('snbImgChangeBtn');
    const posBtn = document.getElementById('snbImgPosBtn');
    const slidersPanel = document.getElementById('snbImgSliders');
    const posX = document.getElementById('snbPosX');
    const posY = document.getElementById('snbPosY');
    const posXVal = document.getElementById('snbPosXVal');
    const posYVal = document.getElementById('snbPosYVal');
    const posSave = document.getElementById('snbPosSave');

    let activeEl = null;
    let hideTimer = null;
    let posOpen = false;

    // Detect images via elementsFromPoint (works through overlays)
    document.addEventListener('mousemove', (e) => {
      if (toolbar.contains(e.target)) return;
      if (posOpen) return; // Don't move toolbar while positioning

      const els = document.elementsFromPoint(e.clientX, e.clientY);
      let found = null;
      for (const el of els) {
        if (el.hasAttribute('data-snb-img') || el.hasAttribute('data-snb-bg')) {
          found = el;
          break;
        }
      }

      if (found && found !== activeEl) {
        clearTimeout(hideTimer);
        if (activeEl) activeEl.classList.remove('snb-img-hover');
        activeEl = found;
        activeEl.classList.add('snb-img-hover');
        showToolbar(found);
      } else if (!found && activeEl && !posOpen) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          if (activeEl) activeEl.classList.remove('snb-img-hover');
          activeEl = null;
          toolbar.style.display = 'none';
          slidersPanel.style.display = 'none';
          posOpen = false;
        }, 400);
      }
    });

    function showToolbar(el) {
      const rect = el.getBoundingClientRect();
      toolbar.style.display = 'block';
      toolbar.style.top = (rect.top + window.scrollY + 8) + 'px';
      toolbar.style.left = (rect.left + window.scrollX + 8) + 'px';
      slidersPanel.style.display = 'none';
      posOpen = false;

      // Read current object-position
      const computed = window.getComputedStyle(el);
      const objPos = computed.objectPosition || computed.backgroundPosition || '50% 50%';
      const parts = objPos.split(/\s+/);
      const cx = parseInt(parts[0]) || 50;
      const cy = parseInt(parts[1]) || 50;
      posX.value = cx;
      posY.value = cy;
      posXVal.textContent = cx + '%';
      posYVal.textContent = cy + '%';
    }

    toolbar.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    toolbar.addEventListener('mouseleave', (e) => {
      if (posOpen) return;
      hideTimer = setTimeout(() => {
        if (activeEl) activeEl.classList.remove('snb-img-hover');
        activeEl = null;
        toolbar.style.display = 'none';
      }, 300);
    });

    // Change image button
    changeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeEl) fileInput.click();
    });

    // Position button - toggle sliders
    posBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      posOpen = !posOpen;
      slidersPanel.style.display = posOpen ? 'block' : 'none';
    });

    // Live preview position
    posX.addEventListener('input', () => {
      posXVal.textContent = posX.value + '%';
      if (activeEl) applyPosition(activeEl, posX.value, posY.value);
    });
    posY.addEventListener('input', () => {
      posYVal.textContent = posY.value + '%';
      if (activeEl) applyPosition(activeEl, posX.value, posY.value);
    });

    function applyPosition(el, x, y) {
      if (el.hasAttribute('data-snb-img')) {
        el.style.objectPosition = x + '% ' + y + '%';
      } else {
        const style = el.getAttribute('style') || '';
        const newStyle = style.replace(/\d+%\s+\d+%/, x + '% ' + y + '%');
        el.setAttribute('style', newStyle);
      }
    }

    // Save position
    posSave.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!activeEl) return;

      const isImg = activeEl.hasAttribute('data-snb-img');
      const data = activeEl.getAttribute(isImg ? 'data-snb-img' : 'data-snb-bg');
      const src = data.split(':').slice(2).join(':');

      posSave.textContent = '...';
      try {
        const res = await fetch('/api/image-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: currentSlug,
            src: src,
            posX: posX.value,
            posY: posY.value
          })
        });
        if (!res.ok) throw new Error('Erreur sauvegarde');
        imageChanges++;
        updateChangesCount();
        showToast('Position sauvegardee', 'success');
      } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
      }
      posSave.textContent = 'Appliquer';
      posOpen = false;
      slidersPanel.style.display = 'none';
    });

    // Upload handler
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files.length || !activeEl) return;
      const el = activeEl;
      const file = fileInput.files[0];

      const isImg = el.hasAttribute('data-snb-img');
      const data = el.getAttribute(isImg ? 'data-snb-img' : 'data-snb-bg');
      const parts = data.split(':');
      const section = parts[0];
      const originalSrc = parts.slice(2).join(':');

      changeBtn.textContent = 'Upload...';

      try {
        const renderedW = el.offsetWidth || 800;
        const renderedH = el.offsetHeight || 600;
        const maxWidth = Math.max(renderedW * 2, 400);
        const maxHeight = Math.max(renderedH * 2, 400);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('originalSrc', originalSrc);
        formData.append('section', section);
        formData.append('slug', currentSlug);
        formData.append('maxWidth', maxWidth);
        formData.append('maxHeight', maxHeight);

        const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
        if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Erreur');
        const result = await res.json();

        if (isImg) {
          el.src = result.newSrc + '?v=' + Date.now();
        } else {
          const currentStyle = el.getAttribute('style') || '';
          el.setAttribute('style', currentStyle.replace(/url\([^)]+\)/, 'url(' + result.newSrc + '?v=' + Date.now() + ')'));
        }
        imageChanges++;
        updateChangesCount();
        showToast('Image mise a jour !', 'success');
      } catch (err) {
        showToast('Erreur: ' + err.message, 'error');
      }

      changeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Changer`;
      fileInput.value = '';
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
    const count = Object.keys(changes).length + (seoData._modified ? 1 : 0) + imageChanges;
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
      imageChanges = 0;
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

  // ===== MUR GALLERY MANAGER =====
  function initMurGallery() {
    const murSection = document.querySelector('.snb-mur');
    if (!murSection) return;

    // Add "Gérer les photos" button
    const murBtn = document.createElement('div');
    murBtn.className = 'snb-mur-manage-btn';
    murBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Gerer les photos du mur`;
    murSection.style.position = 'relative';
    murSection.appendChild(murBtn);

    murBtn.addEventListener('click', openMurPanel);
  }

  async function openMurPanel() {
    // Remove existing panel
    const old = document.getElementById('snb-mur-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = 'snb-mur-panel';
    panel.innerHTML = `
      <div class="snb-mur-panel-inner">
        <div class="snb-mur-panel-header">
          <h3>Photos du mur</h3>
          <button class="snb-mur-close">&times;</button>
        </div>
        <div class="snb-mur-panel-body" id="snbMurBody">
          <div class="snb-mur-loading">Chargement...</div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('.snb-mur-close').addEventListener('click', () => panel.remove());
    panel.addEventListener('click', (e) => { if (e.target === panel) panel.remove(); });

    // Load photos
    try {
      const res = await fetch('/api/mur-photos');
      const photos = await res.json();
      renderMurPhotos(photos);
    } catch (err) {
      document.getElementById('snbMurBody').innerHTML = '<div class="snb-mur-loading">Erreur de chargement</div>';
    }
  }

  function renderMurPhotos(photos) {
    const body = document.getElementById('snbMurBody');
    const cats = [
      { key: 'portrait', label: 'Portrait', color: '#E51981' },
      { key: 'paysage', label: 'Paysage', color: '#0250FF' },
      { key: 'slim', label: 'Strip', color: '#a855f7' }
    ];

    let html = '';
    cats.forEach(cat => {
      const items = photos[cat.key] || [];
      html += `
        <div class="snb-mur-cat">
          <div class="snb-mur-cat-header">
            <span class="snb-mur-cat-label" style="background:${cat.color}">${cat.label}</span>
            <span class="snb-mur-cat-count">${items.length} photos</span>
            <label class="snb-mur-add-btn" style="border-color:${cat.color};color:${cat.color}">
              + Ajouter
              <input type="file" accept="image/*" multiple data-cat="${cat.key}" style="display:none">
            </label>
          </div>
          <div class="snb-mur-cat-grid">
            ${items.map(src => `
              <div class="snb-mur-thumb">
                <img src="${src}" alt="">
                <button class="snb-mur-del" data-src="${src}" title="Supprimer">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    body.innerHTML = html;

    // Add upload handlers
    body.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', async () => {
        const cat = input.dataset.cat;
        const files = Array.from(input.files);
        if (!files.length) return;

        for (const file of files) {
          const label = input.closest('.snb-mur-add-btn');
          label.textContent = 'Upload...';
          label.style.opacity = '0.6';

          try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('category', cat);
            const res = await fetch('/api/mur-photos', { method: 'POST', body: formData });
            if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Erreur');
          } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
          }
        }

        showToast(files.length + ' photo(s) ajoutee(s) — rechargement...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      });
    });

    // Add delete handlers
    body.querySelectorAll('.snb-mur-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const src = btn.dataset.src;
        if (!confirm('Supprimer cette photo du mur ?')) return;
        btn.textContent = '...';
        try {
          const res = await fetch('/api/mur-photos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src })
          });
          if (!res.ok) throw new Error('Erreur suppression');
          imageChanges++;
          updateChangesCount();
          showToast('Photo supprimee', 'success');
          const res2 = await fetch('/api/mur-photos');
          renderMurPhotos(await res2.json());
        } catch (err) {
          showToast('Erreur: ' + err.message, 'error');
        }
      });
    });
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
