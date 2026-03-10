var burger = document.getElementById('snbBurger');
var mobileMenu = document.getElementById('snbMobileMenu');
burger.addEventListener('click', function() {
  burger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
});

var header = document.getElementById('snbHeader');
window.addEventListener('scroll', function() {
  header.classList.toggle('scrolled', window.scrollY > 20);
});
(function(){
  var wraps = document.querySelectorAll('[data-comp-tilt]');
  if (!wraps.length || window.innerWidth < 768) return;
  wraps.forEach(function(wrap) {
    wrap.addEventListener('mousemove', function(e) {
      var rect = wrap.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var rotateY = ((x - cx) / cx) * 10;
      var rotateX = ((cy - y) / cy) * 6;
      wrap.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    });
    wrap.addEventListener('mouseleave', function() {
      wrap.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    });
  });
})();
(function(){
  var carousel = document.querySelector(".avis-carousel");
  if (!carousel) return;
  var track = document.getElementById("snbAvisTrack");
  if (!track) return;
  var cards = track.querySelectorAll(".avis-card");
  if (!cards.length) return;

  var pos = 0;
  var isMobile = window.innerWidth <= 768;

  function getGap() { return isMobile ? 12 : 16; }
  function getCardW() { return cards[0].offsetWidth + getGap(); }
  function getVisible() { return isMobile ? 1 : (carousel.offsetWidth < 900 ? 2 : 3); }
  function getMaxPos() { return Math.max(0, cards.length - getVisible()); }

  function slideTo(p, animate) {
    pos = Math.max(0, Math.min(p, getMaxPos()));
    track.style.transition = animate ? "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)" : "none";
    track.style.transform = "translateX(" + (-pos * getCardW()) + "px)";
  }

  // Desktop arrows
  var prevBtn = document.getElementById("snbAvisPrev");
  var nextBtn = document.getElementById("snbAvisNext");
  if (prevBtn) prevBtn.addEventListener("click", function(e) { e.preventDefault(); slideTo(pos - 1, true); });
  if (nextBtn) nextBtn.addEventListener("click", function(e) { e.preventDefault(); slideTo(pos + 1, true); });

  // Touch swipe — listeners on document to avoid any interception
  var startX = 0, startY = 0, dx = 0, isDragging = false, isScrolling = false;

  function isInsideCarousel(el) {
    while (el) {
      if (el === carousel) return true;
      el = el.parentElement;
    }
    return false;
  }

  function isTouchInCarousel(touch) {
    var rect = carousel.getBoundingClientRect();
    return touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
  }

  document.addEventListener("touchstart", function(e) {
    if (!isTouchInCarousel(e.touches[0])) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dx = 0;
    isDragging = true;
    isScrolling = false;
    track.style.transition = "none";
  }, {passive: true});

  document.addEventListener("touchmove", function(e) {
    if (!isDragging) return;
    var moveX = e.touches[0].clientX - startX;
    var moveY = e.touches[0].clientY - startY;

    if (!isScrolling && Math.abs(moveX) < 5 && Math.abs(moveY) < 5) return;
    if (!isScrolling && Math.abs(moveY) > Math.abs(moveX)) {
      isDragging = false;
      return;
    }
    isScrolling = true;

    e.preventDefault();
    dx = moveX;
    var base = -pos * getCardW();
    var newX = base + dx;
    if (pos === 0 && dx > 0) newX = base + dx * 0.3;
    if (pos >= getMaxPos() && dx < 0) newX = base + dx * 0.3;
    track.style.transform = "translateX(" + newX + "px)";
  }, {passive: false});

  document.addEventListener("touchend", function() {
    if (!isDragging && !isScrolling) return;
    isDragging = false;
    if (Math.abs(dx) > 40) {
      if (dx < 0) slideTo(pos + 1, true);
      else slideTo(pos - 1, true);
    } else {
      slideTo(pos, true);
    }
  }, {passive: true});

  window.addEventListener("resize", function() {
    isMobile = window.innerWidth <= 768;
    slideTo(pos, false);
  });
})();
function snbSwitchUsage(id) {
  // Switch tabs
  document.querySelectorAll('.snb-usage-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.snb-usage-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.snb-usage-tab[data-tab="'+id+'"]').classList.add('active');
  document.querySelector('.snb-usage-panel[data-panel="'+id+'"]').classList.add('active');

  // Switch showcase neon border color
  var showcase = document.querySelector('.snb-usage-showcase');
  showcase.className = 'snb-usage-showcase';
  var colorMap = { mariage: 'snb-showcase--rose', entreprise: 'snb-showcase--bleu', anniversaire: 'snb-showcase--violet' };
  showcase.classList.add(colorMap[id]);
}

// 3D tilt on tabs
document.querySelectorAll('.snb-usage-tab').forEach(function(tab) {
  tab.addEventListener('mousemove', function(e) {
    var rect = tab.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    tab.style.transform = 'perspective(800px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-4px) scale(1.02)';
    tab.style.transition = 'transform 0.1s ease';
  });
  tab.addEventListener('mouseleave', function() {
    tab.style.transform = '';
    tab.style.transition = 'transform 0.5s cubic-bezier(.22,.68,0,1.2)';
  });
});
document.querySelectorAll('.snb-svc2-step-card').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = 'perspective(800px) rotateX(' + (-y * 12) + 'deg) rotateY(' + (x * 12) + 'deg) translateY(-4px) scale(1.02)';
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', function() {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(.22,.68,0,1.2)';
  });
});