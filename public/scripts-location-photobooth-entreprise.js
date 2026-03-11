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