/**
 * WTV 官网交互脚本
 */
(function () {
  "use strict";

  const CONFIG_PATH = "config/downloads.json";

  const nav = document.querySelector(".nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  function initMockupCarousel() {
    const screenshots = document.querySelectorAll(".mock-screenshot");
    const dots = document.querySelectorAll(".mock-dot");
    let currentIndex = 0;
    let intervalId = null;

    function showSlide(index) {
      screenshots.forEach((img, i) => {
        img.classList.toggle("active", i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });
      currentIndex = index;
    }

    function nextSlide() {
      const nextIndex = (currentIndex + 1) % screenshots.length;
      showSlide(nextIndex);
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 4000);
      });
    });

    screenshots[0]?.classList.add("active");
    intervalId = setInterval(nextSlide, 4000);
  }

  window.addEventListener("scroll", () => {
    nav?.classList.toggle("scrolled", window.scrollY > 40);
  });

  menuToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });

  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  function observeElements(selector) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(selector).forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function platformSubtitle(platform, versionName) {
    const ver = `v${versionName}`;
    if (platform.packageName) return `${platform.packageName} · ${ver}`;
    if (platform.meta) return `${platform.meta} · ${ver}`;
    return ver;
  }

  function renderDownloadBtn(item, baseUrl, files) {
    const isApk = /\.apk(\?|$)/i.test(item.url);
    const downloadAttr = isApk ? " download" : "";
    const url = item.file ? files[item.file] || item.url : item.url;
    const fullUrl = url && url.startsWith("http") ? url : baseUrl + (url || "");
    return `
      <a class="download-btn" href="${escapeHtml(fullUrl)}"${downloadAttr}>
        <div class="info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.desc)}</span>
        </div>
        <span class="size">${escapeHtml(item.size || "")}</span>
      </a>`;
  }

  function renderPlatformCard(platform, versionName, baseUrl, files) {
    const card = document.createElement("article");
    card.className = "download-card";
    card.dataset.platform = platform.id;

    const optionsHtml = platform.downloads.map((item) => renderDownloadBtn(item, baseUrl, files)).join("");

    card.innerHTML = `
      <div class="download-card-header">
        <span class="icon">${escapeHtml(platform.icon)}</span>
        <div>
          <h3>${escapeHtml(platform.title)}</h3>
          <div class="pkg">${escapeHtml(platformSubtitle(platform, versionName))}</div>
        </div>
      </div>
      <p>${escapeHtml(platform.description)}</p>
      <div class="download-options">${optionsHtml}</div>`;

    return card;
  }

  function renderGroup(group, versionName, baseUrl, files) {
    const section = document.createElement("div");
    section.className = "download-group";
    section.dataset.group = group.id;

    const title = document.createElement("h3");
    title.className = "download-group-title";
    title.textContent = group.title;
    section.appendChild(title);

    if (group.installNote) {
      const note = document.createElement("div");
      note.className = "download-group-note";
      note.innerHTML = `<strong>安装提示：</strong>${escapeHtml(group.installNote)}`;
      section.appendChild(note);
    }

    const grid = document.createElement("div");
    grid.className = "download-grid";
    group.platforms.forEach((platform) => {
      grid.appendChild(renderPlatformCard(platform, versionName, baseUrl, files));
    });
    section.appendChild(grid);

    return section;
  }

  async function loadDownloadConfig() {
    const container = document.getElementById("download-groups");
    const heroVersion = document.getElementById("hero-version");

    try {
      const res = await fetch(CONFIG_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const config = await res.json();

      const { version, groups, baseUrl = "", files = {} } = config;

      if (heroVersion) heroVersion.textContent = `v${version.name}`;
      document.getElementById("req-version-name").textContent = version.name;
      document.getElementById("req-version-code").textContent = version.code;

      const platformCount = groups.reduce((n, g) => n + g.platforms.length, 0);
      document.getElementById("req-platform-count").textContent = platformCount;

      const reqAndroid = document.getElementById("req-min-android");
      if (reqAndroid) {
        reqAndroid.textContent = version.minAndroid ? `${version.minAndroid}+` : "—";
      }

      container.innerHTML = "";
      groups.forEach((group) => {
        container.appendChild(renderGroup(group, version.name, baseUrl, files));
      });

      observeElements(".download-card");
    } catch (err) {
      console.error("加载下载配置失败:", err);
      if (heroVersion) heroVersion.textContent = "v—";
      container.innerHTML =
        '<p class="download-error">下载配置加载失败，请稍后刷新页面或联系管理员。</p>';
    }
  }

  observeElements(".feature-card, .platform-card, .faq-item");
  loadDownloadConfig();
  initMockupCarousel();
})();
