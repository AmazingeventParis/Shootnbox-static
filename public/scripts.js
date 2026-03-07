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
  function snbFormatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function snbAnimateCounter(el, target, duration) {
    var startTime = performance.now();
    function update(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = snbFormatNumber(current);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = snbFormatNumber(target);
    }
    requestAnimationFrame(update);
  }
  var cards = document.querySelectorAll('.snb-stats .stat-card');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var card = entry.target;
        card.classList.add('visible');
        var numEl = card.querySelector('.stat-number');
        var target = parseInt(numEl.getAttribute('data-target'));
        var idx = Array.prototype.indexOf.call(cards, card);
        var delay = idx * 300;
        setTimeout(function(){ snbAnimateCounter(numEl, target, 2000); }, delay);
        observer.unobserve(card);
      }
    });
  }, { threshold: 0.3 });
  cards.forEach(function(card){ observer.observe(card); });
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

  document.addEventListener("touchstart", function(e) {
    if (!isInsideCarousel(e.target)) return;
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
(function() {
  var btns = document.querySelectorAll('.sm-filter-btn');
  var photos = document.querySelectorAll('.sm-photo');
  var strip = document.getElementById('smStrip');
  var wrap = document.querySelector('.sm-strip-wrap');

  /* ── Filtres ── */
  var isMobile = window.innerWidth <= 540;
  var allCount = photos.length;

  /* Appliquer vitesse mobile au chargement */
  if (isMobile && strip) {
    strip.style.setProperty('animation', 'smSlide 10s linear infinite', 'important');
  }

  btns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      btns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');

      strip.style.setProperty('animation', 'none', 'important');
      var visibleCount = 0;
      photos.forEach(function(p) {
        if (filter === 'all' || p.getAttribute('data-cat') === filter) {
          p.classList.remove('hidden');
          visibleCount++;
        } else {
          p.classList.add('hidden');
        }
      });
      var dur;
      if (isMobile) {
        var mobileSpeeds = { all: 10, paysage: 10, portrait: 10, slim: 10 };
        dur = mobileSpeeds[filter] || 10;
      } else {
        var desktopSpeeds = { all: 45, paysage: 45, portrait: 25, slim: 15 };
        dur = desktopSpeeds[filter] || 45;
      }
      setTimeout(function() {
        strip.style.setProperty('animation', 'smSlide ' + dur + 's linear infinite', 'important');
      }, 50);
    });
  });


})();
(function() {
  var pins = document.querySelectorAll(".snb-cf-pin");
  var animated = false;
  function animatePins() {
    if (animated) return;
    animated = true;
    for (var i = 0; i < pins.length; i++) {
      (function(pin, delay) {
        setTimeout(function() {
          pin.classList.add("snb-cf-anim");
          setTimeout(function() {
            pin.classList.remove("snb-cf-anim");
            pin.classList.add("snb-cf-swing");
            pin.style.opacity = "1";
            pin.style.animationDelay = (Math.random() * 2).toFixed(1) + "s";
          }, 600);
        }, delay * 120);
      })(pins[i], parseInt(pins[i].getAttribute("data-delay")));
    }
  }
  var container = document.getElementById("snbCfContainer");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { animatePins(); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(container);
  } else { animatePins(); }
})();
(function(){eval(atob("d2luZG93LnNuYkJsUGFnZT0wOwp3aW5kb3cuc25iQmxDb2xvcnM9WyJyb3NlIiwiYmxldSIsIm9yYW5nZSIsInZpb2xldCIsImN5YW4iLCJ2ZXJ0Il07CndpbmRvdy5zbmJCbE1vbnRocz1bImphbnZpZXIiLCJmXHUwMGU5dnJpZXIiLCJtYXJzIiwiYXZyaWwiLCJtYWkiLCJqdWluIiwianVpbGxldCIsImFvXHUwMGZidCIsInNlcHRlbWJyZSIsIm9jdG9icmUiLCJub3ZlbWJyZSIsImRcdTAwZTljZW1icmUiXTsKd2luZG93LnNuYkJsTmF2PWZ1bmN0aW9uKGRpcil7CiAgdmFyIG5wPXNuYkJsUGFnZStkaXI7aWYobnA8MClyZXR1cm47dmFyIG9mZj1ucCo2OwogIHZhciB4PW5ldyBYTUxIdHRwUmVxdWVzdCgpOwogIHgub3BlbigiR0VUIiwiaHR0cHM6Ly9zaG9vdG5ib3guZnIvd3AtanNvbi93cC92Mi9wb3N0cz9wZXJfcGFnZT02Jm9mZnNldD0iK29mZisiJl9lbWJlZCIpOwogIHgub25sb2FkPWZ1bmN0aW9uKCl7CiAgICBpZih4LnN0YXR1cyE9PTIwMClyZXR1cm47dmFyIHBzPUpTT04ucGFyc2UoeC5yZXNwb25zZVRleHQpO2lmKHBzLmxlbmd0aD09PTApcmV0dXJuOwogICAgc25iQmxQYWdlPW5wO3ZhciBnPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzbmJCbEdyaWQiKTt2YXIgaD0iIjsKICAgIGZvcih2YXIgaT0wO2k8cHMubGVuZ3RoO2krKyl7CiAgICAgIHZhciBwPXBzW2ldO3ZhciB0PXAudGl0bGUucmVuZGVyZWQucmVwbGFjZSgvPFtePl0qPi9nLCIiKTt2YXIgbD1wLmxpbms7CiAgICAgIHZhciBkPW5ldyBEYXRlKHAuZGF0ZSk7dmFyIGRzPWQuZ2V0RGF0ZSgpKyIgIitzbmJCbE1vbnRoc1tkLmdldE1vbnRoKCldKyIgIitkLmdldEZ1bGxZZWFyKCk7CiAgICAgIHZhciBpdT0iIjt2YXIgY2E9IiI7CiAgICAgIGlmKHAuX2VtYmVkZGVkKXsKICAgICAgICBpZihwLl9lbWJlZGRlZFsid3A6ZmVhdHVyZWRtZWRpYSJdJiZwLl9lbWJlZGRlZFsid3A6ZmVhdHVyZWRtZWRpYSJdWzBdKXsKICAgICAgICAgIHZhciBtPXAuX2VtYmVkZGVkWyJ3cDpmZWF0dXJlZG1lZGlhIl1bMF07CiAgICAgICAgICBpZihtLm1lZGlhX2RldGFpbHMmJm0ubWVkaWFfZGV0YWlscy5zaXplcyYmbS5tZWRpYV9kZXRhaWxzLnNpemVzLm1lZGl1bV9sYXJnZSlpdT1tLm1lZGlhX2RldGFpbHMuc2l6ZXMubWVkaXVtX2xhcmdlLnNvdXJjZV91cmw7CiAgICAgICAgICBlbHNlIGlmKG0uc291cmNlX3VybClpdT1tLnNvdXJjZV91cmw7CiAgICAgICAgfQogICAgICAgIGlmKHAuX2VtYmVkZGVkWyJ3cDp0ZXJtIl0mJnAuX2VtYmVkZGVkWyJ3cDp0ZXJtIl1bMF0mJnAuX2VtYmVkZGVkWyJ3cDp0ZXJtIl1bMF1bMF0pY2E9cC5fZW1iZWRkZWRbIndwOnRlcm0iXVswXVswXS5uYW1lLnJlcGxhY2UoLzxbXj5dKj4vZywiIik7CiAgICAgIH0KICAgICAgdmFyIGM9c25iQmxDb2xvcnNbKG9mZitpKSU2XTsKICAgICAgdmFyIGFydz0nPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIuNSI+PHBhdGggZD0iTTUgMTJoMTQiLz48cGF0aCBkPSJtMTIgNSA3IDctNyA3Ii8+PC9zdmc+JzsKICAgICAgaCs9JzxhcnRpY2xlIGNsYXNzPSJzbmItYmwtY2FyZCBzbmItYmwtY2F0LScrYysnIj48ZGl2IGNsYXNzPSJzbmItYmwtY2FyZC1pbWd3cmFwIj4nKyhpdT8nPGEgaHJlZj0iJytsKyciPjxpbWcgc3JjPSInK2l1KyciIGNsYXNzPSJzbmItYmwtY2FyZC1pbWciIGxvYWRpbmc9ImxhenkiPjwvYT4nOicnKSsoY2E/JzxzcGFuIGNsYXNzPSJzbmItYmwtYmFkZ2Ugc25iLWJsLWJhZGdlLScrYysnIj4nK2NhKyc8L3NwYW4+JzonJykrJzwvZGl2PjxkaXYgY2xhc3M9InNuYi1ibC1jYXJkLWJvZHkiPjxkaXYgY2xhc3M9InNuYi1ibC1jYXJkLWRhdGUiPicrZHMudG9VcHBlckNhc2UoKSsnPC9kaXY+PGgzIGNsYXNzPSJzbmItYmwtY2FyZC10aXRsZSI+PGEgaHJlZj0iJytsKyciIHN0eWxlPSJjb2xvcjppbmhlcml0O3RleHQtZGVjb3JhdGlvbjpub25lIj4nK3QrJzwvYT48L2gzPjxhIGhyZWY9IicrbCsnIiBjbGFzcz0ic25iLWJsLWNhcmQtbGluayI+TGlyZSBsYSBzdWl0ZSAnK2FydysnPC9hPjwvZGl2PjwvYXJ0aWNsZT4nOwogICAgfQogICAgZy5pbm5lckhUTUw9aDsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJzbmJCbFByZXYiKS5kaXNhYmxlZD0oc25iQmxQYWdlPT09MCk7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgic25iQmxOZXh0IikuZGlzYWJsZWQ9KHBzLmxlbmd0aDw2KTsKICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoIi5zbmItYmwtaGVhZGVyIikuc2Nyb2xsSW50b1ZpZXcoe2JlaGF2aW9yOiJzbW9vdGgiLGJsb2NrOiJzdGFydCJ9KTsKICB9O3guc2VuZCgpOwp9Owo="))})()