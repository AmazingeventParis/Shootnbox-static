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
document.querySelectorAll('.lp-clay').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = 'perspective(800px) rotateX(' + (-y * 12) + 'deg) rotateY(' + (x * 12) + 'deg) translateY(-8px) scale(1.02)';
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', function() {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(.22,.68,0,1.2)';
  });
});