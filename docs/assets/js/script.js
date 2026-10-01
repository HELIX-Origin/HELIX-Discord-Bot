'use strict';

// sidebar toggle (mobile)
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebar && sidebarBtn) {
  sidebarBtn.addEventListener("click", function () {
    const expanded = sidebar.classList.toggle("active");
    sidebarBtn.setAttribute("aria-expanded", String(expanded));
  });
}

// page navigation (supports #about, #install, ... deep links)
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

const showPage = function (name, scroll) {
  let found = false;

  for (let i = 0; i < pages.length; i++) {
    const active = pages[i].dataset.page === name;
    pages[i].classList.toggle("active", active);
    if (active) found = true;
  }

  if (!found) return false;

  for (let i = 0; i < navigationLinks.length; i++) {
    const active = navigationLinks[i].dataset.navLink === name;
    navigationLinks[i].classList.toggle("active", active);
    if (active) {
      navigationLinks[i].setAttribute("aria-current", "page");
    } else {
      navigationLinks[i].removeAttribute("aria-current");
    }
  }

  if (scroll) window.scrollTo(0, 0);
  return true;
};

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function (event) {
    const name = this.dataset.navLink;
    if (showPage(name, true)) {
      event.preventDefault();
      history.replaceState(null, "", "#" + name);
    }
  });
}

const showPageFromHash = function () {
  const name = window.location.hash.slice(1).toLowerCase();
  if (name) showPage(name, false);
};

window.addEventListener("hashchange", showPageFromHash);
showPageFromHash();
