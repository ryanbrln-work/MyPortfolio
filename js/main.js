(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const lite = !!window.__LITE || reduceMotion;

  if (isTouch) document.body.classList.add("touch");

  const pageLoader = document.getElementById("page-loader");
  const loaderFill = document.getElementById("loader-fill");
  const loaderPct = document.getElementById("loader-pct");
  const loaderStarted = performance.now();
  let loaderProgress = 8;
  let loaderDone = false;

  function setLoaderProgress(value) {
    loaderProgress = Math.max(loaderProgress, Math.min(100, value));
    if (loaderFill) loaderFill.style.width = `${loaderProgress}%`;
    if (loaderPct) loaderPct.textContent = `${String(Math.round(loaderProgress)).padStart(2, "0")}%`;
  }

  setLoaderProgress(8);
  const loaderTick = setInterval(() => {
    if (loaderDone || loaderProgress >= 86) return;
    setLoaderProgress(loaderProgress + 4 + Math.random() * 7);
  }, 140);

  function hidePageLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(loaderTick);
    setLoaderProgress(100);

    const remain = Math.max(0, (reduceMotion ? 200 : 900) - (performance.now() - loaderStarted));
    window.setTimeout(() => {
      document.documentElement.classList.remove("is-loading");
      pageLoader?.classList.add("is-done");
      pageLoader?.setAttribute("aria-busy", "false");
      window.setTimeout(() => pageLoader?.remove(), 600);
    }, remain);
  }

  if (document.readyState === "complete") {
    hidePageLoader();
  } else {
    window.addEventListener("load", hidePageLoader, { once: true });
    window.setTimeout(hidePageLoader, 5000);
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) hidePageLoader();
  });

  document.querySelectorAll("img.icon-svg").forEach((img) => {
    if (img.getAttribute("src")) {
      img.loading = "lazy";
      img.decoding = "async";
    }
    img.addEventListener("error", () => {
      const mark = document.createElement("span");
      mark.className = "icon-fallback";
      img.replaceWith(mark);
    });
  });

  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("nav-toggle");
  const progress = document.getElementById("progress");
  const cursor = document.getElementById("cursor");
  const cursorDot = document.getElementById("cursor-dot");
  const avatarImg = document.getElementById("avatar-img");
  const avatarStage = document.getElementById("avatar-stage");
  const heroVisual = document.getElementById("hero-visual");

  avatarImg?.addEventListener("error", () => {
    avatarImg.src = "Assets/myAvatar.jpg";
  });

  navToggle?.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav-links a")];

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
  );

  document.querySelectorAll(".reveal, .stack-card").forEach((el) => revealObserver.observe(el));

  const jobObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("visible", entry.isIntersecting);
      });
    },
    { threshold: 0.32, rootMargin: "0px 0px -16% 0px" }
  );

  document.querySelectorAll(".job").forEach((el) => {
    jobObserver.observe(el);
    const card = el.querySelector(".job-card");
    if (!card) return;

    function toggleJob() {
      const open = el.classList.toggle("is-open");
      card.setAttribute("aria-expanded", open ? "true" : "false");
      const more = card.querySelector(".job-more");
      if (more) more.textContent = open ? "Show less" : "Read more";
      window.setTimeout(layoutLadder, 80);
      window.setTimeout(layoutLadder, 480);
    }

    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      toggleJob();
    });
    card.addEventListener("keydown", (e) => {
      if (e.target.closest("a")) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleJob();
      }
    });
  });

  const timeline = document.getElementById("timeline");
  const ladderTrack = document.getElementById("ladder-track");
  const ladderProgress = document.getElementById("ladder-progress");
  const ladderRail = document.getElementById("ladder-rail");
  let ladderLength = 0;

  function layoutLadder() {
    if (!timeline || !ladderTrack || !ladderProgress || !ladderRail) return;
    const w = Math.max(1, timeline.clientWidth);
    const h = Math.max(1, timeline.clientHeight);
    ladderRail.setAttribute("viewBox", `0 0 ${w} ${h}`);
    ladderRail.setAttribute("width", String(w));
    ladderRail.setAttribute("height", String(h));
    ladderRail.setAttribute("preserveAspectRatio", "xMinYMin meet");

    const snap = (n) => Math.round(n) + 0.5;
    const dots = [...timeline.querySelectorAll(".job-dot")].map((dot) => {
      const job = dot.closest(".job");
      return {
        x: snap((job?.offsetLeft || 0) + dot.offsetLeft + dot.offsetWidth / 2),
        y: snap((job?.offsetTop || 0) + dot.offsetTop + dot.offsetHeight / 2),
      };
    });
    if (!dots.length) return;

    const stileX = snap(Math.max(8, Math.min(...dots.map((d) => d.x)) - 20));
    let path = `M ${stileX} ${dots[0].y} H ${dots[0].x}`;
    for (let i = 1; i < dots.length; i += 1) {
      path += ` M ${stileX} ${dots[i - 1].y} V ${dots[i].y} H ${dots[i].x}`;
    }

    ladderTrack.setAttribute("d", path);
    ladderProgress.setAttribute("d", path);
    ladderLength = ladderProgress.getTotalLength();
    ladderProgress.style.strokeDasharray = `${ladderLength}`;
    updateTimeline();
  }

  function updateTimeline() {
    if (!timeline || !ladderProgress || !ladderLength) return;
    const rect = timeline.getBoundingClientRect();
    const start = window.innerHeight * 0.7;
    const t = Math.min(1, Math.max(0, (start - rect.top) / Math.max(rect.height, 1)));
    ladderProgress.style.strokeDashoffset = String(ladderLength * (1 - t));
  }

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
    const tc = document.getElementById("timecode");
    if (tc) {
      const total = Math.floor((pct / 100) * 90 * 24);
      const hh = String(Math.floor(total / (24 * 60 * 60))).padStart(2, "0");
      const mm = String(Math.floor((total / (24 * 60)) % 60)).padStart(2, "0");
      const ss = String(Math.floor((total / 24) % 60)).padStart(2, "0");
      const ff = String(total % 24).padStart(2, "0");
      tc.textContent = `${hh}:${mm}:${ss}:${ff}`;
    }

    let current = sections[0]?.id;
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 180) current = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
    if (current && current !== onScroll.last) {
      onScroll.last = current;
      const flash = document.getElementById("cut-flash");
      if (flash && !reduceMotion && !lite) {
        flash.classList.remove("on");
        void flash.offsetWidth;
        flash.classList.add("on");
      }
    }
    updateTimeline();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layoutLadder);
  if (timeline && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(layoutLadder).observe(timeline);
  }
  onScroll.last = sections[0]?.id;
  onScroll();
  layoutLadder();

  if (!isTouch && !reduceMotion && !lite) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    let cursorRaf = 0;
    const tickCursor = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      if (Math.abs(mouseX - curX) > 0.4 || Math.abs(mouseY - curY) > 0.4) {
        cursorRaf = requestAnimationFrame(tickCursor);
      } else {
        cursorRaf = 0;
      }
    };

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(tickCursor);
    }, { passive: true });

    document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });

    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.18;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  if (heroVisual && avatarStage && !reduceMotion) {
    heroVisual.addEventListener("mousemove", (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      avatarStage.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 6}deg)`;
    });
    heroVisual.addEventListener("mouseleave", () => {
      avatarStage.style.transform = "";
    });
  }

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    if (reduceMotion || isTouch || lite) return;
    card.addEventListener("mousemove", (e) => {
      if (e.target.closest(".shot-gallery, a, button")) {
        card.style.transform = "";
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      card.style.transform = `rotateY(${(x - 0.5) * 6}deg) rotateX(${(0.5 - y) * 5}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  const orb = document.getElementById("tech-orb");
  const orbWrap = document.getElementById("orb-wrap");
  const orbSlot = document.getElementById("orb-slot");
  let zoomSpread = 1;
  let orbLive = true;

  function initOrb(orbEl, wrapEl) {
    if (!orbEl || !wrapEl) return;
    const tags = [...orbEl.querySelectorAll(".orb-tag")];
    const n = tags.length;
    const items = tags.map((el, i) => {
      const phi = Math.acos(-1 + (2 * i + 1) / n);
      const theta = Math.sqrt(n * Math.PI) * phi;
      return {
        el,
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
      };
    });

    let rotY = 0;
    let rotX = 0.18;
    let extraY = 0;
    let extraX = 0;
    let targetExtraY = 0;
    let targetExtraX = 0;

    wrapEl.addEventListener("mousemove", (e) => {
      if (wrapEl.classList.contains("is-flying")) return;
      const r = wrapEl.getBoundingClientRect();
      targetExtraY = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
      targetExtraX = ((e.clientY - r.top) / r.height - 0.5) * 0.45;
    });
    wrapEl.addEventListener("mouseleave", () => {
      targetExtraX = 0;
      targetExtraY = 0;
    });

    function render() {
      extraY += (targetExtraY - extraY) * 0.08;
      extraX += (targetExtraX - extraX) * 0.08;
      if (!reduceMotion) rotY += 0.005;
      const ay = rotY + extraY;
      const ax = rotX + extraX;
      const r = Math.min(wrapEl.clientWidth, wrapEl.clientHeight) * 0.46 * zoomSpread;

      items.forEach((item) => {
        const x1 = item.x * Math.cos(ay) - item.z * Math.sin(ay);
        const z1 = item.x * Math.sin(ay) + item.z * Math.cos(ay);
        const y1 = item.y * Math.cos(ax) - z1 * Math.sin(ax);
        const z2 = item.y * Math.sin(ax) + z1 * Math.cos(ax);
        const depth = (z2 + 1) / 2;
        const scale = 0.82 + depth * 0.24;
        item.el.style.transform = `translate(-50%, -50%) translate3d(${x1 * r}px, ${y1 * r}px, ${z2 * r}px) scale(${scale})`;
        item.el.style.opacity = String(0.72 + depth * 0.28);
        item.el.style.zIndex = String(Math.round(depth * 100));
      });
    }

    let orbRaf = 0;
    function frame() {
      if (!orbLive || document.hidden) {
        orbRaf = 0;
        return;
      }
      render();
      orbRaf = requestAnimationFrame(frame);
    }

    function startOrb() {
      if (!orbRaf) orbRaf = requestAnimationFrame(frame);
    }

    startOrb();
    return { render, start: startOrb };
  }

  function hydrateOrbIcons() {
    orbWrap?.querySelectorAll("img[data-src]").forEach((img) => {
      if (!img.getAttribute("src")) img.src = img.dataset.src;
    });
  }

  const orbApi = initOrb(orb, orbWrap);

  const techZoom = document.getElementById("tech-zoom");
  const zoomCaption = document.getElementById("zoom-caption");
  const stacksSection = document.getElementById("stacks");

  function easeOut(v) {
    return 1 - Math.pow(1 - v, 3);
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  function parkOrb() {
    if (!orbWrap) return;
    orbWrap.classList.remove("is-flying");
    orbWrap.style.cssText = "";
    zoomSpread = 1;
    orbWrap.style.opacity = "";
  }

  if (techZoom && orbWrap && orbSlot && !reduceMotion) {
    function updateZoom() {
      const total = techZoom.offsetHeight;
      const vh = window.innerHeight;
      if (total <= 0) {
        parkOrb();
        return;
      }

      const rect = techZoom.getBoundingClientRect();
      const q = clamp01((vh - rect.top) / total);

      if (q <= 0) {
        parkOrb();
        if (zoomCaption) zoomCaption.style.opacity = "0";
        return;
      }

      if (q >= 1) {
        orbWrap.classList.add("is-flying");
        orbWrap.style.opacity = "0";
        if (zoomCaption) zoomCaption.style.opacity = "0";
        return;
      }

      const pin = clamp01(vh / total);
      const move = easeOut(clamp01((q - pin * 0.2) / (pin * 0.8)));
      const zoom = clamp01((q - pin) / 0.3);
      const exit = clamp01((q - 0.8) / 0.2);
      const slot = orbSlot.getBoundingClientRect();
      const size = Math.min(slot.width, slot.height);
      const startX = slot.left + slot.width / 2;
      const startY = slot.top + slot.height / 2;
      const cx = window.innerWidth / 2;
      const cy = vh / 2;
      const px = startX + (cx - startX) * move;
      const py = startY + (cy - startY) * move;
      const scale = 1 + move * 0.22 + easeOut(zoom) * (window.innerWidth < 980 ? 0.55 : 0.9) + easeOut(exit) * (window.innerWidth < 980 ? 1.1 : 1.8);

      zoomSpread = 1 + easeOut(zoom) * 0.55;
      orbWrap.classList.add("is-flying");
      orbWrap.style.opacity = String(1 - exit);
      orbWrap.style.width = `${size}px`;
      orbWrap.style.height = `${size}px`;
      orbWrap.style.transform = `translate3d(${px - size / 2}px, ${py - size / 2}px, 0) scale(${scale})`;
      orbApi?.render();

      if (zoomCaption) {
        const show = clamp01((q - pin - 0.06) / 0.2) * (1 - clamp01((q - 0.84) / 0.16));
        zoomCaption.style.opacity = String(show);
        zoomCaption.style.transform = `translate3d(0, ${(1 - show) * 26}px, 0)`;
      }
    }

    window.addEventListener("scroll", updateZoom, { passive: true });
    window.addEventListener("resize", updateZoom);
    updateZoom();
  }

  if (stacksSection && orbWrap) {
    const orbWatch = new IntersectionObserver(
      (entries) => {
        orbLive = entries.some((entry) => entry.isIntersecting) || orbWrap.classList.contains("is-flying");
        if (orbLive) {
          hydrateOrbIcons();
          orbApi?.start();
        }
      },
      { rootMargin: "20% 0px" }
    );
    orbWatch.observe(stacksSection);
    if (techZoom) orbWatch.observe(techZoom);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && orbLive) orbApi?.start();
  });

  document.querySelectorAll(".chip[data-tech], .orb-tag[data-tech]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const tech = el.dataset.tech;
      document.querySelectorAll(`[data-tech="${tech}"]`).forEach((match) => match.classList.add("is-active"));
    });
    el.addEventListener("mouseleave", () => {
      document.querySelectorAll("[data-tech]").forEach((match) => match.classList.remove("is-active"));
    });
  });

  const certModal = document.getElementById("cert-modal");
  const certPreview = document.getElementById("cert-preview");
  const resumeModal = document.getElementById("resume-modal");
  const resumeOpen = document.getElementById("resume-open");
  const mediaModal = document.getElementById("media-modal");
  const mediaImg = document.getElementById("media-modal-img");
  const mediaTitle = document.getElementById("media-modal-title");
  const mediaLink = document.getElementById("media-modal-link");
  const mediaNav = document.getElementById("media-nav");
  const mediaPrev = document.getElementById("media-prev");
  const mediaNext = document.getElementById("media-next");
  let mediaItems = [];
  let mediaIndex = 0;

  function openModal(modal) {
    if (!modal) return;
    modal.querySelectorAll("img[data-src]").forEach((img) => {
      if (!img.getAttribute("src")) img.src = img.dataset.src;
    });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (
      certModal?.hidden !== false &&
      resumeModal?.hidden !== false &&
      mediaModal?.hidden !== false
    ) {
      document.body.style.overflow = "";
    }
  }

  function closeOpenModals() {
    closeModal(certModal);
    closeModal(resumeModal);
    closeModal(mediaModal);
  }

  function showMedia(index) {
    const item = mediaItems[index];
    if (!item) return;
    mediaIndex = index;
    if (mediaTitle) mediaTitle.textContent = item.title;
    if (mediaImg) {
      mediaImg.src = item.src;
      mediaImg.alt = item.title;
    }
    if (mediaLink) {
      if (item.pdf) {
        mediaLink.hidden = false;
        mediaLink.href = item.pdf;
      } else {
        mediaLink.hidden = true;
        mediaLink.removeAttribute("href");
      }
    }
    if (mediaNav) mediaNav.hidden = mediaItems.length < 2;
    openModal(mediaModal);
  }

  document.querySelectorAll("[data-lightbox]").forEach((el) => {
    el.addEventListener("click", () => {
      const group = el.dataset.group || "";
      const nodes = group
        ? [...document.querySelectorAll(`[data-lightbox][data-group="${group}"]`)]
        : [el];
      mediaItems = nodes.map((node) => ({
        src: node.dataset.src,
        title: node.dataset.title || "Preview",
        pdf: node.dataset.pdf || "",
      }));
      const index = Math.max(0, nodes.indexOf(el));
      showMedia(index);
    });
  });

  mediaPrev?.addEventListener("click", () => {
    if (!mediaItems.length) return;
    showMedia((mediaIndex - 1 + mediaItems.length) % mediaItems.length);
  });
  mediaNext?.addEventListener("click", () => {
    if (!mediaItems.length) return;
    showMedia((mediaIndex + 1) % mediaItems.length);
  });

  certPreview?.addEventListener("click", () => openModal(certModal));
  resumeOpen?.addEventListener("click", () => openModal(resumeModal));
  [certModal, resumeModal, mediaModal].forEach((modal) => {
    modal?.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(modal));
    });
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOpenModals();
    if (mediaModal?.hidden === false && mediaItems.length > 1) {
      if (e.key === "ArrowLeft") mediaPrev?.click();
      if (e.key === "ArrowRight") mediaNext?.click();
    }
  });

  function initScene() {
    const canvas = document.getElementById("bg-canvas");
    if (lite || !canvas || typeof THREE === "undefined") return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    function sizeRenderer() {
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    sizeRenderer();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6.4;

    const group = new THREE.Group();
    scene.add(group);

    const gold = 0xe8c468;
    const goldSoft = 0xf3d98a;
    const red = 0xc41e3a;

    function outline(geometry, color, opacity) {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      mat.userData.baseOpacity = opacity;
      const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 18), mat);
      geometry.dispose();
      return mesh;
    }

    function wire(geometry, color, opacity) {
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      mat.userData.baseOpacity = opacity;
      return new THREE.Mesh(geometry, mat);
    }

    function extrude(shape, depth) {
      return new THREE.ExtrudeGeometry(shape, {
        depth: depth || 0.08,
        bevelEnabled: false,
        curveSegments: 12,
      });
    }

    function roundedRect(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
      s.lineTo(x + w, y + h - r);
      s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
      s.lineTo(x + r, y + h);
      s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(x, y + r);
      s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
      return s;
    }

    function diamond(w, h) {
      const s = new THREE.Shape();
      s.moveTo(0, h / 2);
      s.lineTo(w / 2, 0);
      s.lineTo(0, -h / 2);
      s.lineTo(-w / 2, 0);
      s.closePath();
      return s;
    }

    function parallelogram(w, h, skew) {
      const s = new THREE.Shape();
      const k = skew || 0.22;
      s.moveTo(-w / 2 + k, -h / 2);
      s.lineTo(w / 2 + k, -h / 2);
      s.lineTo(w / 2 - k, h / 2);
      s.lineTo(-w / 2 - k, h / 2);
      s.closePath();
      return s;
    }

    function oval(rx, ry) {
      const curve = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
      return new THREE.Shape(curve.getPoints(24));
    }

    function arrow(from, to, color) {
      const start = new THREE.Vector3(from[0], from[1], from[2]);
      const end = new THREE.Vector3(to[0], to[1], to[2]);
      const dir = end.clone().sub(start);
      const len = dir.length();
      const mid = start.clone().lerp(end, 0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      const shaft = outline(new THREE.CylinderGeometry(0.016, 0.016, Math.max(0.12, len - 0.16), 5), color, 0.34);
      const head = outline(new THREE.ConeGeometry(0.075, 0.16, 8), color, 0.42);
      shaft.quaternion.copy(quat);
      shaft.position.copy(mid);
      head.quaternion.copy(quat);
      head.position.copy(end);
      const g = new THREE.Group();
      g.add(shaft, head);
      return g;
    }

    const defaultGroup = new THREE.Group();
    const ico = wire(new THREE.IcosahedronGeometry(1.35, 1), gold, 0.22);
    ico.position.set(3.6, 0.9, -1.4);
    const torus = wire(new THREE.TorusGeometry(0.74, 0.14, 14, 48), red, 0.3);
    torus.position.set(-3.8, -1.2, -1.8);
    defaultGroup.add(ico, torus);
    group.add(defaultGroup);

    const flow = new THREE.Group();
    const flowY = -2.05;
    const stepX = 1.82;

    const startNode = outline(extrude(oval(0.52, 0.28)), gold, 0.46);
    const processA = outline(extrude(roundedRect(1.1, 0.6, 0.1)), goldSoft, 0.42);
    const decision = outline(extrude(diamond(0.95, 1.02)), red, 0.46);
    const ioNode = outline(extrude(parallelogram(1.12, 0.56, 0.2)), goldSoft, 0.42);
    const dbNode = outline(new THREE.CylinderGeometry(0.36, 0.36, 0.54, 16), red, 0.4);
    const endNode = outline(extrude(oval(0.52, 0.28)), gold, 0.44);

    const flowNodes = [startNode, processA, decision, ioNode, dbNode, endNode];
    const nodeGap = [0.6, 0.62, 0.55, 0.63, 0.42, 0.6];

    flowNodes.forEach((node, i) => {
      node.position.set((i - (flowNodes.length - 1) / 2) * stepX, flowY, -0.2);
      node.userData.baseScale = 1;
      flow.add(node);
      if (i > 0) {
        const prev = flowNodes[i - 1];
        flow.add(
          arrow(
            [prev.position.x + nodeGap[i - 1], flowY, -0.2],
            [node.position.x - nodeGap[i], flowY, -0.2],
            i % 2 === 0 ? red : gold
          )
        );
      }
    });

    const packet = outline(new THREE.OctahedronGeometry(0.12), goldSoft, 0.85);
    packet.position.set(flowNodes[0].position.x, flowY, -0.15);
    flow.add(packet);

    const flowSpanStart = flowNodes[0].position.x;
    const flowSpanEnd = flowNodes[flowNodes.length - 1].position.x;
    group.add(flow);

    const aboutGroup = new THREE.Group();
    const globe = wire(new THREE.SphereGeometry(0.95, 16, 12), gold, 0.24);
    globe.position.set(3.5, 0.85, -1.25);

    const book = new THREE.Group();
    const pageL = outline(new THREE.BoxGeometry(1.05, 1.35, 0.045), goldSoft, 0.4);
    pageL.rotation.y = 0.38;
    pageL.position.x = -0.3;
    const pageR = outline(new THREE.BoxGeometry(1.05, 1.35, 0.045), gold, 0.4);
    pageR.rotation.y = -0.38;
    pageR.position.x = 0.3;
    book.add(pageL, pageR);
    book.position.set(-3.65, -0.55, -1.15);

    const medal = outline(new THREE.TorusGeometry(0.52, 0.08, 10, 28), red, 0.4);
    medal.position.set(-3.55, 1.65, -0.95);

    const dodeca = wire(new THREE.DodecahedronGeometry(0.52), goldSoft, 0.28);
    dodeca.position.set(3.45, -1.45, -1.35);

    aboutGroup.add(globe, book, medal, dodeca);
    group.add(aboutGroup);

    const spinners = [
      { mesh: ico, rx: 0.14, ry: 0.18, rz: 0, bx: 0, by: 0, bz: 0 },
      { mesh: torus, rx: 0.2, ry: -0.16, rz: 0.04, bx: 0, by: 0, bz: 0 },
      { mesh: globe, rx: 0.08, ry: 0.16, rz: 0.02, bx: 0, by: 0, bz: 0 },
      { mesh: medal, rx: 0.12, ry: 0.2, rz: 0.05, bx: 0, by: 0, bz: 0 },
      { mesh: dodeca, rx: 0.1, ry: -0.14, rz: 0.06, bx: 0, by: 0, bz: 0 },
      { mesh: dbNode, rx: 0, ry: 0.5, rz: 0, bx: 0, by: 0, bz: 0 },
      { mesh: book, rx: 0.02, ry: 0.06, rz: 0, bx: 0, by: 0, bz: 0 },
    ];

    const projectsSection = document.getElementById("projects");
    const aboutSection = document.getElementById("about");
    const stacksBg = document.getElementById("stacks");
    const travel = 8.5;

    function sectionOffset(el) {
      if (!el) return 9;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      return (center - window.innerHeight / 2) / window.innerHeight;
    }

    function placeLayer(layer, offset) {
      layer.position.y = -offset * travel;
      layer.visible = Math.abs(offset) < 1.05;
      return Math.max(0, 1 - Math.abs(offset) / 0.75);
    }

    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 1) {
      positions[i] = (Math.random() - 0.5) * 18;
    }
    const particles = new THREE.BufferGeometry();
    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      particles,
      new THREE.PointsMaterial({
        color: 0xe8c468,
        size: 0.016,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    scene.add(points);

    let targetX = 0;
    let targetY = 0;
    window.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.45;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.28;
    });

    function fitFlow() {
      const halfWidth = Math.tan((camera.fov / 2) * (Math.PI / 180)) * camera.position.z * camera.aspect;
      flow.scale.setScalar(Math.min(1, halfWidth / 5.15));
    }

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      sizeRenderer();
      fitFlow();
    });

    fitFlow();

    const clock = new THREE.Clock();
    let sceneRaf = 0;
    let lastFrame = 0;

    function draw() {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        spinners.forEach((item) => {
          item.mesh.rotation.x = item.bx + t * item.rx;
          item.mesh.rotation.y = item.by + t * item.ry;
          item.mesh.rotation.z = item.bz + t * item.rz;
        });
        points.rotation.y = t * 0.02;
        group.rotation.y += (targetX - group.rotation.y) * 0.04;
        group.rotation.x += (targetY - group.rotation.x) * 0.04;
        camera.position.x += (targetX * 0.25 - camera.position.x) * 0.04;
        camera.position.y += (-targetY * 0.18 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }

      const dProjects = sectionOffset(projectsSection);
      const dAbout = sectionOffset(aboutSection);
      const dStacks = sectionOffset(stacksBg);
      const nearProjects = placeLayer(flow, dProjects);
      const nearAbout = placeLayer(aboutGroup, dAbout);
      const nearStacks = Math.max(0, 1 - Math.abs(dStacks) / 0.75);
      const lead = nearProjects >= nearAbout
        ? { amount: nearProjects, d: dProjects }
        : { amount: nearAbout, d: dAbout };
      const push = Math.max(lead.amount, nearStacks);
      const dir = push === nearStacks ? (dStacks >= 0 ? 1 : -1) : (lead.d >= 0 ? 1 : -1);
      defaultGroup.position.y = push * travel * dir;
      defaultGroup.visible = push < 0.92 && nearStacks < 0.55;
      points.visible = nearStacks < 0.45;

      if (flow.visible && !reduceMotion) {
        const u = (t * 0.13) % 1;
        const px = flowSpanStart + (flowSpanEnd - flowSpanStart) * u;
        packet.position.x = px;
        packet.rotation.x = t * 1.6;
        packet.rotation.y = t * 1.2;
        flowNodes.forEach((node) => {
          const d = Math.abs(node.position.x - px);
          const pulse = Math.exp(-(d * d) / 0.32);
          const s = 1 + pulse * 0.16;
          node.scale.set(s, s, s);
          node.material.opacity = Math.min(1, node.material.userData.baseOpacity * (1 + pulse * 1.4));
        });
      }

      renderer.render(scene, camera);
    }

    function animate(now) {
      if (document.hidden) {
        sceneRaf = 0;
        return;
      }
      sceneRaf = requestAnimationFrame(animate);
      if (now - lastFrame < 20) return;
      lastFrame = now;
      draw();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(sceneRaf);
        sceneRaf = 0;
        return;
      }
      if (!sceneRaf) animate(performance.now());
    });

    animate(performance.now());
  }

  function loadThreeThenInit() {
    if (lite || reduceMotion) return;
    const start = () => {
      if (window.THREE) {
        initScene();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = initScene;
      document.body.appendChild(script);
    };
    const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 1400));
    idle(start, { timeout: 2200 });
  }

  loadThreeThenInit();
})();
