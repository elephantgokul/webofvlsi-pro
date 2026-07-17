(function() {
  "use strict";

  document.documentElement.classList.add("js");

  const base = document.documentElement.dataset.base || "./";
  const resolveAsset = (path) => `${base}${path}`.replace(/\/+/g, "/").replace("https:/", "https://");
  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function linkOrMuted(label, url) {
    const safeLabel = escapeHtml(label);
    if (url) {
      const safeUrl = escapeHtml(url);
      return `<a href="${safeUrl}" target="_blank" rel="noopener">${safeLabel}</a>`;
    }
    return `<span>${safeLabel}: not added</span>`;
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      const ls = $("#loading-screen");
      if (ls) {
        ls.classList.add("is-hidden");
        setTimeout(() => { ls.style.display = "none"; }, 500);
      }
    }, 220);
  });
  setTimeout(() => {
    const ls = $("#loading-screen");
    if (ls) {
      ls.classList.add("is-hidden");
      setTimeout(() => { ls.style.display = "none"; }, 500);
    }
  }, 1300);

  const header = $("[data-header]");
  const backToTop = $("[data-back-to-top]");

  let scrollTicking = false;
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const active = window.scrollY > 24;
        if (header) header.classList.toggle("is-scrolled", active);
        if (backToTop) backToTop.classList.toggle("is-visible", window.scrollY > 640);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const menuButton = $("[data-menu-toggle]");
  const mobileNav = $("[data-mobile-nav]");

  function closeMobileNav(returnFocus) {
    if (mobileNav) mobileNav.setAttribute("hidden", "");
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
      if (returnFocus) menuButton.focus();
    }
  }

  function openMobileNav() {
    if (mobileNav) {
      mobileNav.removeAttribute("hidden");
      menuButton.setAttribute("aria-expanded", "true");
      const firstLink = mobileNav.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", () => {
      if (mobileNav.hasAttribute("hidden")) {
        openMobileNav();
      } else {
        closeMobileNav(true);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav && !mobileNav.hasAttribute("hidden")) {
        closeMobileNav(true);
        e.preventDefault();
      }
    });

    mobileNav.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileNav(true);
        e.preventDefault();
      }
    });

    $$("[data-mobile-nav] a").forEach((link) => {
      link.addEventListener("click", () => closeMobileNav(false));
    });
  }

  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  function setupGsap() {
    if (!window.gsap || !window.ScrollTrigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    $$(".section").forEach((section) => {
      const items = $$(".feature-card, .mini-card, .semester-card, .resource-card, .event-card, .research-card, .metric-card, .lab-card, .faculty-card, .gallery-item", section).slice(0, 8);
      if (!items.length) return;
      gsap.from(items, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.055,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 82%" }
      });
    });
  }
  window.addEventListener("load", setupGsap);

  function setupCounters() {
    const counters = $$("[data-counter]");
    if (!counters.length) return;
    const animate = (el) => {
      const raw = el.dataset.counter || "0";
      const originalText = el.textContent.trim();
      const hasSuffix = originalText.endsWith("+");
      const target = Number(raw.replace(/\D/g, "")) || 0;
      const start = performance.now();
      const duration = 1200;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + (hasSuffix ? "+" : "");
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((counter) => observer.observe(counter));
  }
  setupCounters();

  async function readJson(path) {
    const response = await fetch(resolveAsset(path), { cache: "force-cache" });
    if (!response.ok) throw new Error("Unable to load " + path);
    return response.json();
  }

  function facultyCard(person) {
    const photo = person.photo || "placeholder-faculty.webp";
    const name = escapeHtml(person.name || "");
    const designation = escapeHtml(person.designation || "");
    const qualification = escapeHtml(person.qualification || "Not added");
    const experience = escapeHtml(person.experience || "Not added");
    const specialization = escapeHtml(person.specialization || "Not added");
    const subjects = Array.isArray(person.subjects) ? person.subjects.map(escapeHtml) : [];
    const areas = Array.isArray(person.researchArea) ? person.researchArea.map(escapeHtml) : [];
    const publications = Array.isArray(person.publications) ? person.publications.map(escapeHtml) : [];
    const awards = Array.isArray(person.awards) ? person.awards.map(escapeHtml) : [];
    const certification = Array.isArray(person.certification) ? person.certification.map(escapeHtml) : [];
    const email = person.email ? escapeHtml(person.email) : "";
    const phone = person.phone ? escapeHtml(person.phone) : "";
    const office = escapeHtml(person.office || person.officeLocation || "Not added");
    const cv = person.cv ? `<a href="${escapeHtml(person.cv)}" target="_blank" rel="noopener">Download CV</a>` : "<span>CV not uploaded</span>";
    const photoUrl = resolveAsset("assets/faculty/" + encodeURIComponent(photo));

    const tags = [person.role || "", designation, ...areas, ...subjects].join(" ").toLowerCase();

    return '<article class="faculty-card reveal" data-tags="' + escapeHtml(tags) + '">' +
      '<div class="faculty-photo"><img src="' + photoUrl + '" alt="' + escapeHtml(name) + '" loading="lazy" width="900" height="1100"></div>' +
      '<div class="faculty-body">' +
      '<p class="designation">' + designation + "</p>" +
      "<h3>" + name + "</h3>" +
      '<div class="chip-row">' + areas.map(function(a) { return "<span>" + a + "</span>"; }).join("") + "</div>" +
      '<div class="faculty-list">' +
      "<span><strong>Qualification:</strong> " + qualification + "</span>" +
      "<span><strong>Experience:</strong> " + experience + "</span>" +
      "<span><strong>Specialization:</strong> " + specialization + "</span>" +
      "<span><strong>Subjects:</strong> " + (subjects.length ? subjects.join(", ") : "Not added") + "</span>" +
      "<span><strong>Office:</strong> " + office + "</span>" +
      "<span><strong>Publications:</strong> " + (publications.length ? publications.join("; ") : "Not added") + "</span>" +
      "<span><strong>Awards:</strong> " + (awards.length ? awards.join("; ") : "Not added") + "</span>" +
      "<span><strong>Certification:</strong> " + (certification.length ? certification.join("; ") : "Not added") + "</span>" +
      (email ? '<span><strong>Email:</strong> <a href="mailto:' + encodeURIComponent(email).replace(/%40/, "@") + '">' + email + "</a></span>" : "") +
      (phone ? '<span><strong>Phone:</strong> <a href="tel:' + phone.replace(/\s/g, "") + '">' + phone + "</a></span>" : "") +
      "</div>" +
      '<div class="faculty-links">' +
      cv +
      linkOrMuted("Google Scholar", person.googleScholar) +
      linkOrMuted("LinkedIn", person.linkedIn) +
      linkOrMuted("ORCID", person.orcid) +
      linkOrMuted("ResearchGate", person.researchGate) +
      "</div></div></article>";
  }

  function hodCard(person) {
    const photo = person.photo || "placeholder-faculty.webp";
    const name = escapeHtml(person.name || "");
    const designation = escapeHtml(person.designation || "");
    const qualification = escapeHtml(person.qualification || "Not added");
    const experience = escapeHtml(person.experience || "Not added");
    const message = escapeHtml(person.message || "");
    const researchArea = Array.isArray(person.researchArea) ? person.researchArea.map(escapeHtml).join(", ") : escapeHtml(person.researchArea || "Not added");
    const email = person.email ? escapeHtml(person.email) : "";
    const phone = person.phone ? escapeHtml(person.phone) : "";
    const office = escapeHtml(person.office || person.officeLocation || "Not added");
    const photoUrl = resolveAsset("assets/faculty/" + encodeURIComponent(photo));

    return '<article class="hod-card reveal is-visible">' +
      '<div class="hod-photo"><img src="' + photoUrl + '" alt="' + escapeHtml(name) + '" loading="lazy" width="900" height="1100"></div>' +
      '<div class="hod-details">' +
      '<p class="eyebrow">Department Leadership</p>' +
      "<h3>" + name + "</h3>" +
      '<p class="designation">' + designation + "</p>" +
      (message ? '<p class="message">' + message + "</p>" : "") +
      '<dl class="profile-meta">' +
      "<div><dt>Qualification</dt><dd>" + qualification + "</dd></div>" +
      "<div><dt>Experience</dt><dd>" + experience + "</dd></div>" +
      "<div><dt>Research Interests</dt><dd>" + researchArea + "</dd></div>" +
      (email ? '<div><dt>Email</dt><dd><a href="mailto:' + encodeURIComponent(email).replace(/%40/, "@") + '">' + email + "</a></dd></div>" : '<div><dt>Email</dt><dd>Not added</dd></div>') +
      "<div><dt>Office</dt><dd>" + office + "</dd></div>" +
      (phone ? '<div><dt>Phone</dt><dd><a href="tel:' + phone.replace(/\s/g, "") + '">' + phone + "</a></dd></div>" : '<div><dt>Phone</dt><dd>Not added</dd></div>') +
      "</dl></div></article>";
  }

  async function setupFaculty() {
    const grid = $("[data-faculty-grid]");
    const hod = $("[data-hod-profile]");
    if (!grid && !hod) return;

    let people = [];
    try {
      people = await readJson("data/faculty.json");
    } catch (error) {
      const msg = escapeHtml(error.message);
      if (grid) grid.innerHTML = '<article class="profile-skeleton">' + msg + "</article>";
      if (hod) hod.innerHTML = '<article class="profile-skeleton">' + msg + "</article>";
      return;
    }

    const render = function() {
      if (!grid) return;
      const searchInput = $("[data-faculty-search]");
      const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
      const activeChip = $(".filter-chip.active[data-faculty-filter]");
      const active = activeChip ? activeChip.dataset.facultyFilter : "all";
      const filtered = people.filter(function(person) {
        const searchable = [
          person.name, person.designation, person.qualification, person.specialization,
          person.role,
          ...(Array.isArray(person.researchArea) ? person.researchArea : []),
          ...(Array.isArray(person.subjects) ? person.subjects : [])
        ].filter(Boolean).join(" ").toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesFilter = active === "all" || searchable.includes(active.toLowerCase());
        return matchesQuery && matchesFilter;
      });
      grid.innerHTML = filtered.length
        ? filtered.map(function(p) { return facultyCard(p); }).join("")
        : '<article class="profile-skeleton">No faculty found for this search.</article>';
      grid.querySelectorAll(".reveal").forEach(function(item) { item.classList.add("is-visible"); });
    };

    if (hod) {
      const leader = people.find(function(p) { return p.role === "hod"; }) || people[0];
      hod.innerHTML = leader
        ? hodCard(leader)
        : '<article class="profile-skeleton">HOD profile not found in faculty JSON.</article>';
    }
    render();

    const searchInput = $("[data-faculty-search]");
    if (searchInput) searchInput.addEventListener("input", render);

    $$("[data-faculty-filter]").forEach(function(button) {
      button.addEventListener("click", function() {
        $$("[data-faculty-filter]").forEach(function(item) { item.classList.remove("active"); });
        button.classList.add("active");
        render();
      });
    });
  }
  setupFaculty();

  async function setupGallery() {
    const grid = $("[data-gallery-grid]");
    if (!grid) return;
    const lightbox = $("[data-lightbox]");
    const lightboxImage = $("[data-lightbox-image]");
    const lightboxCaption = $("[data-lightbox-caption]");
    let items = [];

    try {
      items = await readJson("data/gallery.json");
    } catch (error) {
      grid.innerHTML = '<article class="profile-skeleton">' + escapeHtml(error.message) + "</article>";
      return;
    }

    const draw = function(category) {
      if (category === undefined) category = "All";
      const visible = category === "All" ? items : items.filter(function(item) { return item.category === category; });
      grid.innerHTML = visible.map(function(item, idx) {
        var origIdx = items.indexOf(item);
        var imgUrl = resolveAsset("assets/images/gallery/" + encodeURIComponent(item.image));
        var altText = escapeHtml(item.title);
        var cat = escapeHtml(item.category);
        var title = escapeHtml(item.title);
        var height = idx % 2 ? "1080" : "720";
        return '<button class="gallery-item reveal is-visible" type="button" data-gallery-index="' + origIdx + '">' +
          '<img src="' + imgUrl + '" alt="' + altText + '" loading="lazy" width="900" height="' + height + '">' +
          "<div><p class=\"eyebrow\">" + cat + "</p><h3>" + title + "</h3></div></button>";
      }).join("");
    };

    draw();

    $$("[data-gallery-filter]").forEach(function(button) {
      button.addEventListener("click", function() {
        $$("[data-gallery-filter]").forEach(function(item) {
          item.classList.remove("active");
          item.setAttribute("aria-selected", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-selected", "true");
        draw(button.dataset.galleryFilter);
      });
    });

    let lastFocusedButton = null;
    grid.addEventListener("click", function(event) {
      var card = event.target.closest("[data-gallery-index]");
      if (!card || !lightbox || !lightboxImage || !lightboxCaption) return;
      var idx = Number(card.dataset.galleryIndex);
      var item = items[idx];
      if (!item) return;
      lastFocusedButton = card;
      lightboxImage.src = resolveAsset("assets/images/gallery/" + encodeURIComponent(item.image));
      lightboxImage.alt = escapeHtml(item.title);
      lightboxImage.removeAttribute("role");
      lightboxCaption.textContent = (item.category || "") + " - " + (item.title || "");
      if (typeof lightbox.showModal === "function") {
        lightbox.showModal();
        var closeBtn = $("[data-lightbox-close]", lightbox);
        if (closeBtn) closeBtn.focus();
      }
    });

    var closeBtn = $("[data-lightbox-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", function() {
        if (lightbox) lightbox.close();
      });
    }

    if (lightbox) {
      lightbox.addEventListener("close", function() {
        if (lastFocusedButton && lastFocusedButton.focus) lastFocusedButton.focus();
      });

      lightbox.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
          lightbox.close();
        }
      });
    }
  }
  setupGallery();

  document.addEventListener("DOMContentLoaded", function() {
    var yearEl = $("[data-current-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

})();
