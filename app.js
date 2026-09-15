(function () {
  "use strict";

  const data = window.PERSONAL_UNIVERSE;
  const app = document.getElementById("app");
  const universeView = document.getElementById("universeView");
  const galaxyView = document.getElementById("galaxyView");
  const galaxyField = document.getElementById("galaxyField");
  const systemMap = document.getElementById("systemMap");
  const mobileNodeList = document.getElementById("mobileNodeList");
  const drawer = document.getElementById("detailDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawerClose = document.getElementById("drawerClose");
  const motionToggle = document.getElementById("motionToggle");
  let activeGalaxy = null;
  let lastFocused = null;
  let motionEnabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const typeLabel = { star: "恒星 · 长期核心", planet: "行星 · 具体经历", meteor: "流星 · 启发片段" };

  function createGalaxyButtons() {
    data.galaxies.forEach((galaxy, galaxyIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "galaxy-button";
      button.style.setProperty("--x", galaxy.position.x);
      button.style.setProperty("--y", galaxy.position.y);
      button.style.setProperty("--galaxy-color", galaxy.color);
      button.style.setProperty("--galaxy-rgb", galaxy.colorRgb);
      button.setAttribute("aria-label", `进入${galaxy.title}星系：${galaxy.short}`);

      const dots = Array.from({ length: 21 }, (_, dotIndex) => {
        const angle = (dotIndex / 21) * Math.PI * 2 + galaxyIndex;
        const radius = 27 + ((dotIndex * 17) % 42);
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius * 0.58;
        const size = 2 + (dotIndex % 3);
        return `<i class="galaxy-dot" style="--dx:${x}%;--dy:${y}%;--size:${size}px;--opacity:${0.34 + (dotIndex % 5) * 0.12}"></i>`;
      }).join("");

      button.innerHTML = `
        <span class="galaxy-visual" aria-hidden="true"></span>
        <span class="galaxy-dots" aria-hidden="true">${dots}</span>
        <span class="galaxy-label"><b>${galaxy.title}</b><small>${galaxy.short}</small></span>
      `;
      button.addEventListener("click", () => navigateToGalaxy(galaxy.id));
      galaxyField.appendChild(button);
    });
  }

  function navigateToGalaxy(id, updateHash = true) {
    const galaxy = data.galaxies.find((item) => item.id === id);
    if (!galaxy) return navigateHome(updateHash);
    activeGalaxy = galaxy;
    closeDrawer(false);
    document.documentElement.style.setProperty("--accent", galaxy.color);
    document.documentElement.style.setProperty("--accent-rgb", galaxy.colorRgb);
    galaxyView.style.setProperty("--accent", galaxy.color);
    galaxyView.style.setProperty("--accent-rgb", galaxy.colorRgb);
    document.getElementById("galaxyNumber").textContent = galaxy.number;
    document.getElementById("galaxyTitle").textContent = galaxy.title;
    document.getElementById("galaxyDescription").textContent = galaxy.description;
    renderNodes(galaxy);
    universeView.hidden = true;
    galaxyView.hidden = false;
    document.title = `${galaxy.title}｜Rushan 的个人宇宙`;
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    if (updateHash) history.pushState(null, "", `#/galaxy/${galaxy.id}`);
  }

  function navigateHome(updateHash = true) {
    activeGalaxy = null;
    closeDrawer(false);
    galaxyView.hidden = true;
    universeView.hidden = false;
    document.documentElement.style.setProperty("--accent", "#7bdff2");
    document.documentElement.style.setProperty("--accent-rgb", "123, 223, 242");
    document.title = "Rushan 的个人宇宙";
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    if (updateHash) history.pushState(null, "", "#/");
  }

  function renderNodes(galaxy) {
    systemMap.innerHTML = "";
    mobileNodeList.innerHTML = "";
    galaxy.nodes.forEach((node) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `system-node node-${node.type}`;
      button.style.setProperty("--x", node.position.x);
      button.style.setProperty("--y", node.position.y);
      button.setAttribute("aria-label", `${typeLabel[node.type]}：${node.title}`);
      button.innerHTML = `<span class="node-orb" aria-hidden="true"></span><span class="node-title">${node.title}</span><span class="node-kind">${typeLabel[node.type].split(" · ")[0]}</span>`;
      button.addEventListener("click", () => openDetail(galaxy, node));
      systemMap.appendChild(button);

      const listButton = document.createElement("button");
      listButton.type = "button";
      listButton.className = "mobile-node-button";
      listButton.innerHTML = `<span class="mobile-node-icon" aria-hidden="true"></span><span><b>${node.title}</b><small>${typeLabel[node.type]} · ${node.date}</small></span>`;
      listButton.addEventListener("click", () => openDetail(galaxy, node));
      mobileNodeList.appendChild(listButton);
    });
  }

  function openDetail(galaxy, node, updateHash = true) {
    lastFocused = document.activeElement;
    document.getElementById("detailType").textContent = `${typeLabel[node.type]} · ${node.date}`;
    document.getElementById("detailTitle").textContent = node.title;
    document.getElementById("detailSummary").textContent = node.summary;
    document.getElementById("detailBody").innerHTML = node.body.map(([heading, text]) => `<section><h3>${heading}</h3><p>${text}</p></section>`).join("");

    const media = document.getElementById("detailMedia");
    const links = document.getElementById("detailLinks");
    const photos = node.photos || [];
    const externalLinks = node.links || [];
    media.hidden = photos.length === 0;
    media.innerHTML = photos.map((photo) => `<figure><img src="${photo.src}" alt="${photo.alt || ""}"><figcaption>${photo.caption || ""}</figcaption></figure>`).join("");
    links.hidden = externalLinks.length === 0;
    links.innerHTML = externalLinks.length ? `<p>相关链接</p>${externalLinks.map((link) => `<a class="detail-link" href="${link.url}" target="_blank" rel="noopener noreferrer"><b>${link.label} ↗</b><small>${link.description || ""}</small></a>`).join("")}` : "";

    drawer.setAttribute("aria-hidden", "false");
    drawer.classList.add("open");
    drawerBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    drawerClose.focus();
    document.title = `${node.title}｜${galaxy.title}`;
    if (updateHash) history.pushState(null, "", `#/galaxy/${galaxy.id}/${node.id}`);
  }

  function closeDrawer(updateHash = true) {
    const wasOpen = drawer.classList.contains("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawerBackdrop.hidden = true;
    document.body.style.overflow = "";
    if (activeGalaxy) document.title = `${activeGalaxy.title}｜Rushan 的个人宇宙`;
    if (updateHash && activeGalaxy) history.pushState(null, "", `#/galaxy/${activeGalaxy.id}`);
    if (wasOpen && lastFocused) lastFocused.focus();
  }

  function readRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (parts[0] !== "galaxy" || !parts[1]) return navigateHome(false);
    const galaxy = data.galaxies.find((item) => item.id === parts[1]);
    if (!galaxy) return navigateHome(false);
    navigateToGalaxy(galaxy.id, false);
    if (parts[2]) {
      const node = galaxy.nodes.find((item) => item.id === parts[2]);
      if (node) openDetail(galaxy, node, false);
    }
  }

  function initializeStarfield() {
    const canvas = document.getElementById("starfield");
    const context = canvas.getContext("2d");
    let stars = [];
    let raf = null;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(innerWidth * ratio);
      canvas.height = Math.floor(innerHeight * ratio);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(220, Math.floor((innerWidth * innerHeight) / 6500)) }, (_, index) => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: index % 17 === 0 ? 1.15 : Math.random() * 0.7 + 0.18,
        a: Math.random() * 0.72 + 0.15,
        speed: Math.random() * 0.002 + 0.0005,
        phase: Math.random() * Math.PI * 2
      }));
    }

    function draw(time) {
      context.clearRect(0, 0, innerWidth, innerHeight);
      stars.forEach((star) => {
        const twinkle = motionEnabled ? Math.sin(time * star.speed + star.phase) * 0.2 : 0;
        context.beginPath();
        context.fillStyle = `rgba(230,235,255,${Math.max(.08, star.a + twinkle)})`;
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  }

  document.getElementById("homeButton").addEventListener("click", () => navigateHome());
  document.getElementById("backButton").addEventListener("click", () => navigateHome());
  drawerClose.addEventListener("click", () => closeDrawer());
  drawerBackdrop.addEventListener("click", () => closeDrawer());
  motionToggle.addEventListener("click", () => {
    motionEnabled = !motionEnabled;
    document.body.classList.toggle("motion-off", !motionEnabled);
    motionToggle.textContent = `动效：${motionEnabled ? "开" : "关"}`;
    motionToggle.setAttribute("aria-pressed", String(!motionEnabled));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });
  window.addEventListener("popstate", readRoute);

  createGalaxyButtons();
  initializeStarfield();
  readRoute();
})();

