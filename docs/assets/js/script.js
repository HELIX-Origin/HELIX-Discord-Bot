'use strict';

// sidebar toggle (mobile)
const sidebar = document.querySelector('[data-sidebar]');
const sidebarBtn = document.querySelector('[data-sidebar-btn]');

if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener('click', function () {
    const expanded = sidebar.classList.toggle('active');
    sidebarBtn.setAttribute('aria-expanded', String(expanded));
    const label = sidebarBtn.querySelector('span:not(.chevron)');
    if (label) label.textContent = expanded ? 'Hide Links' : 'Show Links';
  });
}

// page navigation
const navigationLinks = document.querySelectorAll('[data-nav-link]');
const pages = document.querySelectorAll('[data-page]');

const showPage = function (name, scroll) {
  let found = false;
  pages.forEach(function (page) {
    const match = page.dataset.page === name;
    page.classList.toggle('active', match);
    if (match) found = true;
  });
  if (!found) return false;
  navigationLinks.forEach(function (link) {
    const match = link.dataset.navLink === name;
    link.classList.toggle('active', match);
    if (match) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (scroll) window.scrollTo(0, 0);
  return true;
};

navigationLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    const name = this.dataset.navLink;
    if (showPage(name, true)) history.replaceState(null, '', '#' + name);
  });
});

// open the page referenced by the URL hash (e.g. #get-started)
const initialPage = window.location.hash.slice(1);
if (initialPage) showPage(initialPage, false);
