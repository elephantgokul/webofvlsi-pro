
document.documentElement.classList.add("js");

const base = document.documentElement.dataset.base || "";
const resolveAsset = (path) => `${base}${path}`.replace(/\/+/g, "/").replace("https:/", "https://");
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

window.addEventListener("load", () => {
  setTimeout(() => $("#loading-screen")?.classList.add("is-hidden"), 220);
});
setTimeout(() => $("#loading-screen")?.classList.add("is-hidden"), 1300);

const header = $("[data-header]");
const backToTop = $("[data-back-to-top]");
window.addEventListener("scroll", () => {
  const active = window.scrollY > 24;
  header?.classList.toggle("is-scrolled", active);
  backToTop?.classList.toggle("is-visible", window.scrollY > 640);
}, { passive: true });

backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const menuButton = $("[data-menu-toggle]");
const mobileNav = $("[data-mobile-nav]");
menuButton?.addEventListener("click", () => {
  const open = mobileNav?.hasAttribute("hidden");
  if (open) {
    mobileNav?.removeAttribute("hidden");
    menuButton.setAttribute("aria-expanded", "true");
  } else {
    mobileNav?.setAttribute("hidden", "");
    menuButton.setAttribute("aria-expanded", "false");
  }
});
$$("[data-mobile-nav] a").forEach((link) => link.addEventListener("click", () => {
  mobileNav?.setAttribute("hidden", "");
  menuButton?.setAttribute("aria-expanded", "false");
}));

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
    const suffix = el.textContent.trim().endsWith("+") ? "+" : "";
    const target = Number(raw.replace(/\D/g, "")) || 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
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
  const response = await fetch(resolveAsset(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

const text = (value) => Array.isArray(value) ? value.join(", ") : (value || "");
const linkOrMuted = (label, url) => url ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : `<span>${label}: not added</span>`;

function facultyCard(person) {
  const photo = person.photo || "placeholder-faculty.webp";
  const areas = person.researchArea || [];
  const subjects = person.subjects || [];
  const cv = person.cv ? `<a href="${person.cv}" target="_blank" rel="noopener">Download CV</a>` : `<span>CV not uploaded</span>`;
  return `
    <article class="faculty-card reveal" data-tags="${[person.role, person.designation, ...(areas || []), ...(subjects || [])].join(" ").toLowerCase()}">
      <div class="faculty-photo">
        <img src="${resolveAsset(`assets/faculty/${photo}`)}" alt="${person.name}" loading="lazy" width="900" height="1100">
      </div>
      <div class="faculty-body">
        <p class="designation">${person.designation || ""}</p>
        <h3>${person.name || ""}</h3>
        <div class="chip-row">${areas.map((item) => `<span>${item}</span>`).join("")}</div>
        <div class="faculty-list">
          <span><strong>Qualification:</strong> ${person.qualification || "Not added"}</span>
          <span><strong>Experience:</strong> ${person.experience || "Not added"}</span>
          <span><strong>Specialization:</strong> ${person.specialization || "Not added"}</span>
          <span><strong>Subjects:</strong> ${subjects.length ? subjects.join(", ") : "Not added"}</span>
          <span><strong>Office:</strong> ${person.office || person.officeLocation || "Not added"}</span>
          <span><strong>Publications:</strong> ${(person.publications || []).length ? person.publications.join("; ") : "Not added"}</span>
          <span><strong>Awards:</strong> ${(person.awards || []).length ? person.awards.join("; ") : "Not added"}</span>
          <span><strong>Certification:</strong> ${(person.certification || []).length ? person.certification.join("; ") : "Not added"}</span>
          ${person.email ? `<span><strong>Email:</strong> <a href="mailto:${person.email}">${person.email}</a></span>` : ""}
          ${person.phone ? `<span><strong>Phone:</strong> <a href="tel:${person.phone.replace(/\s/g, "")}">${person.phone}</a></span>` : ""}
        </div>
        <div class="faculty-links">
          ${cv}
          ${linkOrMuted("Google Scholar", person.googleScholar)}
          ${linkOrMuted("LinkedIn", person.linkedIn)}
          ${linkOrMuted("ORCID", person.orcid)}
          ${linkOrMuted("ResearchGate", person.researchGate)}
        </div>
      </div>
    </article>
  `;
}

function hodCard(person) {
  const photo = person.photo || "placeholder-faculty.webp";
  return `
    <article class="hod-card reveal is-visible">
      <div class="hod-photo"><img src="${resolveAsset(`assets/faculty/${photo}`)}" alt="${person.name}" loading="lazy" width="900" height="1100"></div>
      <div class="hod-details">
        <p class="eyebrow">Department Leadership</p>
        <h3>${person.name}</h3>
        <p class="designation">${person.designation}</p>
        <p class="message">${person.message || ""}</p>
        <dl class="profile-meta">
          <div><dt>Qualification</dt><dd>${person.qualification || "Not added"}</dd></div>
          <div><dt>Experience</dt><dd>${person.experience || "Not added"}</dd></div>
          <div><dt>Research Interests</dt><dd>${text(person.researchArea) || "Not added"}</dd></div>
          <div><dt>Email</dt><dd>${person.email ? `<a href="mailto:${person.email}">${person.email}</a>` : "Not added"}</dd></div>
          <div><dt>Office</dt><dd>${person.office || person.officeLocation || "Not added"}</dd></div>
          <div><dt>Phone</dt><dd>${person.phone ? `<a href="tel:${person.phone.replace(/\s/g, "")}">${person.phone}</a>` : "Not added"}</dd></div>
        </dl>
      </div>
    </article>
  `;
}

async function setupFaculty() {
  const grid = $("[data-faculty-grid]");
  const hod = $("[data-hod-profile]");
  if (!grid && !hod) return;
  try {
    const people = await readJson("data/faculty.json");
    const render = () => {
      if (!grid) return;
      const query = ($("[data-faculty-search]")?.value || "").toLowerCase();
      const active = $(".filter-chip.active[data-faculty-filter]")?.dataset.facultyFilter || "all";
      const filtered = people.filter((person) => {
        const haystack = JSON.stringify(person).toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        const matchesFilter = active === "all" || haystack.includes(active.toLowerCase());
        return matchesQuery && matchesFilter;
      });
      grid.innerHTML = filtered.length ? filtered.map(facultyCard).join("") : `<article class="profile-skeleton">No faculty found for this search.</article>`;
      grid.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    };
    if (hod) {
      const leader = people.find((person) => person.role === "hod") || people[0];
      hod.innerHTML = leader ? hodCard(leader) : `<article class="profile-skeleton">HOD profile not found in faculty JSON.</article>`;
    }
    render();
    $("[data-faculty-search]")?.addEventListener("input", render);
    $$("[data-faculty-filter]").forEach((button) => button.addEventListener("click", () => {
      $$("[data-faculty-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      render();
    }));
  } catch (error) {
    const message = `<article class="profile-skeleton">${error.message}</article>`;
    if (grid) grid.innerHTML = message;
    if (hod) hod.innerHTML = message;
  }
}
setupFaculty();

async function setupGallery() {
  const grid = $("[data-gallery-grid]");
  if (!grid) return;
  const lightbox = $("[data-lightbox]");
  const image = $("[data-lightbox-image]");
  const caption = $("[data-lightbox-caption]");
  let items = [];
  try {
    items = await readJson("data/gallery.json");
  } catch (error) {
    grid.innerHTML = `<article class="profile-skeleton">${error.message}</article>`;
    return;
  }
  const draw = (category = "All") => {
    const visible = category === "All" ? items : items.filter((item) => item.category === category);
    grid.innerHTML = visible.map((item, index) => `
      <button class="gallery-item reveal is-visible" type="button" data-gallery-index="${items.indexOf(item)}">
        <img src="${resolveAsset(`assets/images/gallery/${item.image}`)}" alt="${item.title}" loading="lazy" width="900" height="${index % 2 ? "1080" : "720"}">
        <div><p class="eyebrow">${item.category}</p><h3>${item.title}</h3></div>
      </button>
    `).join("");
  };
  draw();
  $$("[data-gallery-filter]").forEach((button) => button.addEventListener("click", () => {
    $$("[data-gallery-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    draw(button.dataset.galleryFilter);
  }));
  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-gallery-index]");
    if (!card || !lightbox || !image || !caption) return;
    const item = items[Number(card.dataset.galleryIndex)];
    image.src = resolveAsset(`assets/images/gallery/${item.image}`);
    image.alt = item.title;
    caption.textContent = `${item.category} - ${item.title}`;
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  });
  $("[data-lightbox-close]")?.addEventListener("click", () => lightbox?.close());
}
setupGallery();

document.addEventListener("DOMContentLoaded", () => {
  $("[data-current-year]") && ($("[data-current-year]").textContent = new Date().getFullYear());
});
