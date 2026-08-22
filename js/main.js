(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

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
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        jobObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.42, rootMargin: "0px 0px -18% 0px" }
  );

  document.querySelectorAll(".job").forEach((el) => jobObserver.observe(el));

  const timeline = document.getElementById("timeline");
  const timelineProgress = document.getElementById("timeline-progress");

  function updateTimeline() {
    if (!timeline || !timelineProgress) return;
    const rect = timeline.getBoundingClientRect();
    const start = window.innerHeight * 0.72;
    const visible = Math.min(Math.max(start - rect.top, 0), rect.height);
    timelineProgress.style.height = `${visible}px`;
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
      if (flash && !reduceMotion) {
        flash.classList.remove("on");
        void flash.offsetWidth;
        flash.classList.add("on");
      }
    }
    updateTimeline();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll.last = sections[0]?.id;
  onScroll();

  if (!isTouch && !reduceMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });

    const tickCursor = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(tickCursor);
    };
    tickCursor();

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
    if (reduceMotion || isTouch) return;
    card.addEventListener("mousemove", (e) => {
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

  function initOrb(orbEl, wrapEl, options) {
    if (!orbEl || !wrapEl) return;
    const opts = options || {};
    const spread = opts.spread || (() => 1);
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

    if (!opts.static) {
      wrapEl.addEventListener("mousemove", (e) => {
        const r = wrapEl.getBoundingClientRect();
        targetExtraY = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
        targetExtraX = ((e.clientY - r.top) / r.height - 0.5) * 0.45;
      });
      wrapEl.addEventListener("mouseleave", () => {
        targetExtraX = 0;
        targetExtraY = 0;
      });
    }

    function radius() {
      return Math.min(wrapEl.clientWidth, wrapEl.clientHeight) * 0.46 * spread();
    }

    function render() {
      let ay;
      let ax;
      if (opts.follow) {
        ay = opts.follow.ay;
        ax = opts.follow.ax;
      } else {
        extraY += (targetExtraY - extraY) * 0.08;
        extraX += (targetExtraX - extraX) * 0.08;
        if (!reduceMotion) rotY += opts.speed || 0.005;
        ay = rotY + extraY;
        ax = rotX + extraX;
        if (opts.publish) {
          opts.publish.ay = ay;
          opts.publish.ax = ax;
        }
      }
      const r = radius();

      items.forEach((item) => {
        const x1 = item.x * Math.cos(ay) - item.z * Math.sin(ay);
        const z1 = item.x * Math.sin(ay) + item.z * Math.cos(ay);
        const y1 = item.y * Math.cos(ax) - z1 * Math.sin(ax);
        const z2 = item.y * Math.sin(ax) + z1 * Math.cos(ax);
        const depth = (z2 + 1) / 2;
        const scale = 0.78 + depth * 0.28;
        item.el.style.transform = `translate(-50%, -50%) translate3d(${x1 * r}px, ${y1 * r}px, ${z2 * r}px) scale(${scale})`;
        item.el.style.opacity = String(0.42 + depth * 0.58);
        item.el.style.zIndex = String(Math.round(depth * 100));
      });
    }

    function frame() {
      if (!opts.idle || !opts.idle()) render();
      requestAnimationFrame(frame);
    }

    frame();
    return { render };
  }

  const orbPhase = { ay: 0, ax: 0.18 };
  initOrb(orb, orbWrap, { publish: orbPhase });

  const techZoom = document.getElementById("tech-zoom");
  const zoomOrb = document.getElementById("zoom-orb");
  const zoomLayer = document.getElementById("zoom-orb-layer");
  const zoomCaption = document.getElementById("zoom-caption");
  let zoomSpread = 1;
  let zoomActive = false;

  function easeOut(v) {
    return 1 - Math.pow(1 - v, 3);
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  if (techZoom && zoomOrb && zoomLayer && orb && orbWrap && !reduceMotion) {
    orb.querySelectorAll(".orb-tag").forEach((tag) => {
      const clone = tag.cloneNode(true);
      clone.removeAttribute("data-tech");
      zoomOrb.appendChild(clone);
    });

    const zoomOrbApi = initOrb(zoomOrb, zoomLayer, {
      static: true,
      follow: orbPhase,
      spread: () => zoomSpread,
      idle: () => !zoomActive,
    });

    function updateZoom() {
      const total = techZoom.offsetHeight;
      const vh = window.innerHeight;
      if (total <= 0) {
        zoomActive = false;
        zoomLayer.style.visibility = "hidden";
        orbWrap.style.opacity = "";
        return;
      }

      const rect = techZoom.getBoundingClientRect();
      const q = clamp01((vh - rect.top) / total);

      if (q <= 0 || q >= 1) {
        zoomActive = false;
        zoomLayer.style.visibility = "hidden";
        zoomLayer.style.opacity = "0";
        orbWrap.style.opacity = q >= 1 ? "0" : "";
        if (zoomCaption) zoomCaption.style.opacity = "0";
        return;
      }
      zoomActive = true;

      const pin = clamp01(vh / total);
      const move = easeOut(clamp01((q - pin * 0.2) / (pin * 0.8)));
      const zoom = clamp01((q - pin) / 0.3);
      const exit = clamp01((q - 0.8) / 0.2);

      const source = orbWrap.getBoundingClientRect();
      const size = Math.min(source.width, source.height);
      const startX = source.left + source.width / 2;
      const startY = source.top + source.height / 2;
      const cx = window.innerWidth / 2;
      const cy = vh / 2;
      const px = startX + (cx - startX) * move;
      const py = startY + (cy - startY) * move;
      const scale = 1 + move * 0.28 + easeOut(zoom) * 0.9 + easeOut(exit) * 1.8;

      zoomSpread = 1 + easeOut(zoom) * 0.75;
      zoomLayer.style.visibility = "visible";
      zoomLayer.style.opacity = String(1 - exit);
      zoomLayer.style.width = `${size}px`;
      zoomLayer.style.height = `${size}px`;
      zoomLayer.style.transform = `translate3d(${px - size / 2}px, ${py - size / 2}px, 0) scale(${scale})`;
      orbWrap.style.opacity = "0";
      zoomOrbApi?.render();

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

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (certModal?.hidden !== false && resumeModal?.hidden !== false) {
      document.body.style.overflow = "";
    }
  }

  function closeOpenModals() {
    closeModal(certModal);
    closeModal(resumeModal);
  }

  certPreview?.addEventListener("click", () => openModal(certModal));
  resumeOpen?.addEventListener("click", () => openModal(resumeModal));
  [certModal, resumeModal].forEach((modal) => {
    modal?.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => closeModal(modal));
    });
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOpenModals();
  });

  function initScene() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

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
        curveSegments: 16,
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
      return new THREE.Shape(curve.getPoints(32));
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
    const torus = wire(new THREE.TorusGeometry(0.74, 0.14, 16, 64), red, 0.3);
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
    const dbNode = outline(new THREE.CylinderGeometry(0.36, 0.36, 0.54, 20), red, 0.4);
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
    const globe = wire(new THREE.SphereGeometry(0.95, 18, 12), gold, 0.24);
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

    const medal = outline(new THREE.TorusGeometry(0.52, 0.08, 12, 36), red, 0.4);
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

    const stacksSection = document.getElementById("stacks");
    const aboutSection = document.getElementById("about");
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

    const count = reduceMotion ? 180 : 560;
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
      renderer.setSize(window.innerWidth, window.innerHeight);
      fitFlow();
    });

    fitFlow();

    const clock = new THREE.Clock();

    function animate() {
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

      const dStacks = sectionOffset(stacksSection);
      const dAbout = sectionOffset(aboutSection);
      const nearStacks = placeLayer(flow, dStacks);
      const nearAbout = placeLayer(aboutGroup, dAbout);
      const lead = nearStacks >= nearAbout ? { amount: nearStacks, d: dStacks } : { amount: nearAbout, d: dAbout };
      defaultGroup.position.y = lead.amount * travel * (lead.d >= 0 ? 1 : -1);
      defaultGroup.visible = lead.amount < 0.92;

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
      requestAnimationFrame(animate);
    }

    animate();
  }

  initScene();
})();
