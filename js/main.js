/* ==========================================================================
   main.js  -  builds each page from the lists in data.js.
   You shouldn't need to edit this file to add videos, photos or categories.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const PLACEHOLDER = "images/placeholder.svg";
  const page = document.body.dataset.page;

  /* Escape text from data.js before putting it into HTML. */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Blank line in a description = new paragraph. */
  const paragraphs = (t) =>
    String(t || "")
      .split(/\n\s*\n/)
      .filter((x) => x.trim())
      .map((x) => `<p>${esc(x.trim())}</p>`)
      .join("");

  /* Any image that fails to load (missing file, bad path) becomes the placeholder. */
  document.addEventListener(
    "error",
    (e) => {
      const t = e.target;
      if (t.tagName === "IMG" && !t.dataset.fallback) {
        t.dataset.fallback = "1";
        t.src = PLACEHOLDER;
      }
    },
    true
  );

  /* ---------------------------- Header and footer --------------------------- */
  const NAV = [
    ["index.html", "Home", "home"],
    ["projects.html", "Projects", "projects"],
    ["photos.html", "Photos", "photos"],
    ["contact.html", "Contact", "contact"],
  ];

  function renderChrome() {
    $("#site-header").innerHTML = `
      <div class="wrap bar">
        <a class="brand" href="index.html">${esc(SITE.name)}</a>
        <nav aria-label="Main">
          ${NAV.map(([href, label, key]) => `<a href="${href}"${key === page ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        </nav>
      </div>`;

    $("#site-footer").innerHTML = `
      <div class="wrap foot">
        <span>&copy; ${new Date().getFullYear()} ${esc(SITE.name)}</span>
        <span class="foot-links">
          ${(SITE.socials || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}
        </span>
      </div>`;

    const current = NAV.find((n) => n[2] === page);
    document.title = current && page !== "home" ? `${current[1]} | ${SITE.name}` : SITE.name;
  }

  /* ------------------------------- Video helpers ---------------------------- */
  function thumbOf(p) {
    if (p.thumbnail) return p.thumbnail;
    if ((p.type || "youtube") === "youtube") return `https://i.ytimg.com/vi/${encodeURIComponent(p.videoId)}/hqdefault.jpg`;
    return PLACEHOLDER;
  }

  function playerHTML(p) {
    const type = p.type || "youtube";
    if (type === "youtube") {
      return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.videoId)}?rel=0&autoplay=1" title="${esc(p.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    if (type === "vimeo") {
      return `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(p.videoId)}?autoplay=1" title="${esc(p.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
    if (type === "file") {
      return `<video src="${esc(p.src)}" poster="${esc(thumbOf(p))}" controls autoplay playsinline></video>`;
    }
    return `<p class="empty">Unknown video type "${esc(type)}". Use "youtube", "vimeo" or "file".</p>`;
  }

  /* One tile. Links to projects.html#id, which opens that project's popup. */
  function projectCard(p) {
    return `
      <a class="card" href="projects.html#${encodeURIComponent(p.id)}">
        <span class="thumb">
          <img src="${esc(thumbOf(p))}" alt="" loading="lazy">
          <span class="play" aria-hidden="true"></span>
          <span class="vf" aria-hidden="true"></span>
        </span>
        <span class="card-body">
          <span class="card-title">${esc(p.title)}</span>
          <span class="card-meta"><span>${esc(p.client || "")}</span><span>${esc(p.year || "")}</span></span>
        </span>
      </a>`;
  }

  /* Category buttons, built from whatever categories exist in the data. */
  function renderTabs(container, items, onChange) {
    const cats = ["All", ...new Set(items.map((i) => i.category).filter(Boolean))];
    container.innerHTML = cats
      .map((c, i) => `<button type="button" class="tab" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join("");
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      container.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-pressed", String(t === btn)));
      onChange(btn.dataset.cat);
    });
  }

  /* ---------------------------------- Home ---------------------------------- */
  function initHome() {
    $("#hero-title").textContent = SITE.headline;
    $("#hero-intro").textContent = SITE.intro;

    const hero = PROJECTS.find((p) => p.featured) || PROJECTS[0];
    if (hero) {
      $("#hero-feature").innerHTML = `
        <a class="hero-frame" href="projects.html#${encodeURIComponent(hero.id)}" aria-label="Watch ${esc(hero.title)}">
          <span class="thumb">
            <img src="${esc(thumbOf(hero))}" alt="">
            <span class="play" aria-hidden="true"></span>
          </span>
          <span class="vf" aria-hidden="true"></span>
          <span class="rec" aria-hidden="true"></span>
        </a>
        <p class="caption">${esc(hero.title)}</p>`;
    }

    const rest = PROJECTS.filter((p) => p !== hero).slice(0, 6);
    if (rest.length) {
      $("#featured-grid").innerHTML = rest.map(projectCard).join("");
    } else {
      $("#recent-section").hidden = true;
    }

    const clients = [...new Set(PROJECTS.map((p) => p.client).filter(Boolean))];
    if (clients.length) {
      $("#clients").innerHTML = clients.map((c) => `<li>${esc(c)}</li>`).join("");
    } else {
      $("#clients-section").hidden = true;
    }
  }

  /* -------------------------------- Projects -------------------------------- */
  function initProjects() {
    const grid = $("#project-grid");
    const dlg = $("#project-dialog");

    const draw = (cat) => {
      const list = cat === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === cat);
      grid.innerHTML = list.map(projectCard).join("") || `<p class="empty">No projects in this category yet.</p>`;
    };
    renderTabs($("#tabs"), PROJECTS, draw);
    draw("All");

    /* The URL hash (#project-id) decides which project is open. */
    function syncWithHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      const p = PROJECTS.find((x) => x.id === id);
      if (!p) {
        if (dlg.open) dlg.close();
        return;
      }
      $("#pd-player").innerHTML = playerHTML(p);
      $("#pd-cat").textContent = p.category || "";
      $("#pd-cat").hidden = !p.category;
      $("#pd-title").textContent = p.title;
      const facts = [["Client", p.client], ["Year", p.year], ["My role", p.role]].filter(([, v]) => v);
      $("#pd-facts").innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
      $("#pd-desc").innerHTML = paragraphs(p.description);
      if (!dlg.open) dlg.showModal();
    }

    dlg.addEventListener("close", () => {
      $("#pd-player").innerHTML = ""; // stops the video
      history.replaceState(null, "", location.pathname + location.search);
    });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });

    window.addEventListener("hashchange", syncWithHash);
    syncWithHash();
  }

  /* --------------------------------- Photos --------------------------------- */
  function initPhotos() {
    const grid = $("#photo-grid");
    const lb = $("#lightbox");
    const img = $("#lb-img");
    const cap = $("#lb-cap");
    let list = PHOTOS;
    let idx = 0;

    const draw = (cat) => {
      list = cat === "All" ? PHOTOS : PHOTOS.filter((p) => p.category === cat);
      grid.innerHTML =
        list
          .map(
            (p, i) => `
        <button type="button" class="photo" data-i="${i}" aria-label="Open ${esc(p.title || "photo")}">
          <img src="${esc(p.src)}" alt="${esc(p.alt || p.title || "")}" loading="lazy">
          <span class="vf" aria-hidden="true"></span>
        </button>`
          )
          .join("") || `<p class="empty">No photos in this category yet.</p>`;
    };
    renderTabs($("#tabs"), PHOTOS, draw);
    draw("All");

    function show(i) {
      idx = (i + list.length) % list.length;
      const p = list[idx];
      delete img.dataset.fallback;
      img.src = p.src;
      img.alt = p.alt || p.title || "";
      cap.innerHTML = (p.title ? `<strong>${esc(p.title)}</strong>` : "") + (p.description ? ` ${esc(p.description)}` : "");
      lb.classList.toggle("single", list.length < 2);
    }

    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".photo");
      if (!b) return;
      show(Number(b.dataset.i));
      lb.showModal();
    });
    lb.addEventListener("click", (e) => {
      if (e.target.closest("[data-prev]")) show(idx - 1);
      else if (e.target.closest("[data-next]")) show(idx + 1);
      else if (e.target === lb || e.target.closest("[data-close]")) lb.close();
    });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* --------------------------------- Contact -------------------------------- */
  function initContact() {
    $("#contact-intro").textContent = SITE.contactIntro;

    const rows = [];
    if (SITE.email) rows.push(["Email", `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`]);
    if (SITE.phone) rows.push(["Phone", `<a href="tel:${esc(SITE.phone.replace(/[^\d+]/g, ""))}">${esc(SITE.phone)}</a>`]);
    if (SITE.location) rows.push(["Based in", esc(SITE.location)]);
    if (SITE.availability) rows.push(["Availability", esc(SITE.availability)]);
    $("#contact-list").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    const socials = SITE.socials || [];
    if (socials.length) {
      $("#social-list").innerHTML = socials
        .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`)
        .join("");
    } else {
      $("#social-block").hidden = true;
    }
  }

  /* ---------------------------------- Start --------------------------------- */
  renderChrome();
  ({ home: initHome, projects: initProjects, photos: initPhotos, contact: initContact }[page] || function () {})();
})();
