/* ==========================================================================
   main.js  -  builds each page from the lists in data.js.
   You shouldn't need to edit this file to add videos, photos or categories.

   Security approach (see README, "Security"):
   - Every value from data.js is escaped before it goes into HTML.
   - Every URL is checked against an allow-list before it is used.
   - Video embeds are built only from validated IDs, never from raw strings,
     and run inside sandboxed iframes.
   - The CSP <meta> tag in each page blocks anything not explicitly allowed.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const PLACEHOLDER = "images/placeholder.svg";
  const page = document.body.dataset.page;

  /* Ignore half-finished entries instead of breaking the whole page. */
  const VIDEOS = PROJECTS.filter((p) => p && p.id && p.title);
  const PHOTO_LIST = PHOTOS.filter((p) => p && p.src);

  /* ------------------------------ Safety helpers ---------------------------- */

  /* Escape text from data.js before putting it into HTML. */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Allow only https:// links or plain relative paths. This rejects
     javascript:, data:, protocol-relative (//host) and ../ traversal.
     Returns "" when the value isn't acceptable. */
  function safeUrl(u, { absolute = true, relative = true } = {}) {
    const s = String(u ?? "").trim();
    if (!s || /[\u0000-\u001f\u007f\\]/.test(s)) return "";
    if (/^https:\/\//i.test(s)) return absolute ? s : "";
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(s);
    if (relative && !hasScheme && !s.startsWith("//") && !s.split("/").includes("..")) return s;
    return "";
  }

  const isEmail = (v) => /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(String(v ?? ""));
  const isYouTubeId = (v) => /^[A-Za-z0-9_-]{6,20}$/.test(String(v ?? ""));
  const isVimeoId = (v) => /^\d{4,15}$/.test(String(v ?? ""));

  /* Pull the kind (reel, p, tv) and shortcode out of an Instagram link.
     The embed address is rebuilt from these two checked pieces, so nothing
     else from the pasted link ever reaches the page. */
  const IG_RE = /^https:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})(?:[/?#]|$)/i;
  function parseInstagram(url) {
    const m = IG_RE.exec(String(url ?? "").trim());
    if (!m) return null;
    const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
    return { kind, code: m[2] };
  }

  const isPortrait = (p) => p.type === "instagram" || p.orientation === "portrait";

  /* Blank line in a description = new paragraph. */
  const paragraphs = (t) =>
    String(t || "")
      .split(/\n\s*\n/)
      .filter((x) => x.trim())
      .map((x) => `<p>${esc(x.trim())}</p>`)
      .join("");

  /* Any image that fails to load (missing file, bad path, blocked by the CSP)
     becomes the placeholder. */
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

  /* Tell the owner about mistakes in data.js (open the browser console). */
  function checkData() {
    const seen = new Set();
    PROJECTS.forEach((p, i) => {
      const label = `PROJECTS[${i}]${p && p.id ? ` (${p.id})` : ""}`;
      if (!p || !p.id || !p.title) return console.warn(`${label}: needs both "id" and "title", so it is hidden.`);
      if (seen.has(p.id)) console.warn(`${label}: duplicate id "${p.id}". Each id must be unique or links open the wrong video.`);
      seen.add(p.id);
    });
    PHOTOS.forEach((p, i) => {
      if (!p || !p.src) console.warn(`PHOTOS[${i}]: missing "src", so it is hidden.`);
    });
  }

  /* Social links, validated once and reused by the footer and contact page. */
  const socialLinks = (SITE.socials || [])
    .map((s) => ({ label: s && s.label, url: safeUrl(s && s.url, { relative: false }) }))
    .filter((s) => s.label && s.url);

  /* ---------------------------- Header and footer --------------------------- */
  const NAV = [
    ["index.html", "Home", "home"],
    ["projects.html", "Projects", "projects"],
    ["photos.html", "Photos", "photos"],
    ["contact.html", "Contact", "contact"],
  ];

  const externalLink = (s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`;

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
        <span class="foot-links">${socialLinks.map(externalLink).join("")}</span>
      </div>`;

    const current = NAV.find((n) => n[2] === page);
    document.title = current && page !== "home" ? `${current[1]} | ${SITE.name}` : SITE.name;
  }

  /* ------------------------------- Video helpers ---------------------------- */
  function thumbOf(p) {
    const custom = safeUrl(p.thumbnail);
    if (custom) return custom;
    if ((p.type || "youtube") === "youtube" && isYouTubeId(p.videoId)) {
      return `https://i.ytimg.com/vi/${p.videoId}/hqdefault.jpg`;
    }
    return PLACEHOLDER;
  }

  /* Embedded players run in a sandbox: they can play video and open links in
     a new tab, but they cannot navigate your page or reach your site's data. */
  const SANDBOX = "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms";

  function embedFrame(src, title, allow) {
    return `<iframe src="${esc(src)}" title="${esc(title)}" sandbox="${SANDBOX}" referrerpolicy="strict-origin-when-cross-origin" allow="${allow}" allowfullscreen></iframe>`;
  }

  const problem = (msg) => `<p class="player-error">${esc(msg)}</p>`;

  function playerHTML(p) {
    const type = p.type || "youtube";

    if (type === "youtube") {
      if (!isYouTubeId(p.videoId)) return problem(`Project "${p.id}": videoId should be the ID from the YouTube link.`);
      return embedFrame(
        `https://www.youtube-nocookie.com/embed/${p.videoId}?rel=0&autoplay=1`,
        p.title,
        "autoplay; encrypted-media; picture-in-picture; fullscreen"
      );
    }

    if (type === "vimeo") {
      if (!isVimeoId(p.videoId)) return problem(`Project "${p.id}": videoId should be the number from the Vimeo link.`);
      return embedFrame(`https://player.vimeo.com/video/${p.videoId}?autoplay=1`, p.title, "autoplay; fullscreen; picture-in-picture");
    }

    if (type === "instagram") {
      const ig = parseInstagram(p.url);
      if (!ig) return problem(`Project "${p.id}": set url to an Instagram post or reel link, like https://www.instagram.com/reel/AbC123xyz/`);
      return embedFrame(`https://www.instagram.com/${ig.kind}/${ig.code}/embed/`, p.title, "encrypted-media; picture-in-picture; fullscreen");
    }

    if (type === "file") {
      const src = safeUrl(p.src, { absolute: false });
      if (!src) return problem(`Project "${p.id}": src should be a path inside this repository, like videos/my-film.mp4`);
      return `<video src="${esc(src)}" poster="${esc(thumbOf(p))}" controls autoplay playsinline></video>`;
    }

    return problem(`Project "${p.id}": unknown type "${type}". Use "youtube", "vimeo", "instagram" or "file".`);
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

    const hero = VIDEOS.find((p) => p.featured) || VIDEOS[0];
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

    const rest = VIDEOS.filter((p) => p !== hero).slice(0, 6);
    if (rest.length) {
      $("#featured-grid").innerHTML = rest.map(projectCard).join("");
    } else {
      $("#recent-section").hidden = true;
    }

    const clients = [...new Set(VIDEOS.map((p) => p.client).filter(Boolean))];
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
      const list = cat === "All" ? VIDEOS : VIDEOS.filter((p) => p.category === cat);
      grid.innerHTML = list.map(projectCard).join("") || `<p class="empty">No projects in this category yet.</p>`;
    };
    renderTabs($("#tabs"), VIDEOS, draw);
    draw("All");

    /* The URL hash (#project-id) decides which project is open. */
    function syncWithHash() {
      let id = "";
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch (err) {
        id = ""; // a malformed hash like #%E0%A4%A must not break the page
      }
      const p = VIDEOS.find((x) => x.id === id);
      if (!p) {
        if (dlg.open) dlg.close();
        return;
      }

      dlg.dataset.orientation = isPortrait(p) ? "portrait" : "landscape";
      $("#pd-player").innerHTML = playerHTML(p);
      $("#pd-cat").textContent = p.category || "";
      $("#pd-cat").hidden = !p.category;
      $("#pd-title").textContent = p.title;
      const facts = [["Client", p.client], ["Year", p.year], ["My role", p.role]].filter(([, v]) => v);
      $("#pd-facts").innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");

      let desc = paragraphs(p.description);
      const ig = p.type === "instagram" ? parseInstagram(p.url) : null;
      if (ig) {
        desc += `<p><a href="https://www.instagram.com/${ig.kind}/${ig.code}/" target="_blank" rel="noopener noreferrer">View on Instagram</a></p>`;
      }
      $("#pd-desc").innerHTML = desc;

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
    let list = PHOTO_LIST;
    let idx = 0;

    const draw = (cat) => {
      list = cat === "All" ? PHOTO_LIST : PHOTO_LIST.filter((p) => p.category === cat);
      grid.innerHTML =
        list
          .map(
            (p, i) => `
        <button type="button" class="photo" data-i="${i}" aria-label="Open ${esc(p.title || "photo")}">
          <img src="${esc(safeUrl(p.src) || PLACEHOLDER)}" alt="${esc(p.alt || p.title || "")}" loading="lazy">
          <span class="vf" aria-hidden="true"></span>
        </button>`
          )
          .join("") || `<p class="empty">No photos in this category yet.</p>`;
    };
    renderTabs($("#tabs"), PHOTO_LIST, draw);
    draw("All");

    function show(i) {
      idx = (i + list.length) % list.length;
      const p = list[idx];
      delete img.dataset.fallback;
      img.src = safeUrl(p.src) || PLACEHOLDER;
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
    if (isEmail(SITE.email)) rows.push(["Email", `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`]);
    if (SITE.phone) rows.push(["Phone", `<a href="tel:${esc(String(SITE.phone).replace(/[^\d+]/g, ""))}">${esc(SITE.phone)}</a>`]);
    if (SITE.location) rows.push(["Based in", esc(SITE.location)]);
    if (SITE.availability) rows.push(["Availability", esc(SITE.availability)]);
    $("#contact-list").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    if (socialLinks.length) {
      $("#social-list").innerHTML = socialLinks.map((s) => `<li>${externalLink(s)}</li>`).join("");
    } else {
      $("#social-block").hidden = true;
    }
  }

  /* ---------------------------------- Start --------------------------------- */
  checkData();
  renderChrome();
  ({ home: initHome, projects: initProjects, photos: initPhotos, contact: initContact }[page] || function () {})();
})();
