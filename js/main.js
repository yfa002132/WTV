/**
 * WTV 官网交互脚本
 */
(function () {
  "use strict";

  const CONFIG_PATH = "config/downloads.json";

  const nav = document.querySelector(".nav");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  function isWechatBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("micromessenger") && !ua.includes("wxwork");
  }

  function initWechatAlert() {
    const modal = document.getElementById("wechat-modal");
    const closeBtn = document.querySelector(".wechat-modal-close");

    if (!modal) return;

    if (isWechatBrowser()) {
      modal.classList.add("show");
    }

    closeBtn?.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  function initMockupCarousel() {
    document.querySelectorAll(".mock-screen-container").forEach((container) => {
      const screenshots = container.querySelectorAll(".mock-screenshot");
      if (!screenshots.length) return;

      const parent = container.closest(".phone-screen, .tv-screen, .pc-screen");
      const dots = parent ? parent.querySelectorAll(".mock-dot") : [];
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
        showSlide((currentIndex + 1) % screenshots.length);
      }

      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          showSlide(index);
          clearInterval(intervalId);
          intervalId = setInterval(nextSlide, 4000);
        });
      });

      showSlide(0);
      if (screenshots.length > 1) {
        intervalId = setInterval(nextSlide, 4000);
      }
    });
  }

  function initDeviceSwitcher() {
    const items = document.querySelectorAll(".mockup-item");
    const count = items.length;
    let currentIndex = 0;
    let intervalId = null;

    function updatePositions() {
      items.forEach((item, i) => {
        const offset = ((i - currentIndex) + count) % count;
        const device = item.dataset.device;
        const isWide = device === "tv" || device === "pc";
        if (offset === 0) {
          const scale = isWide ? 1 : 1;
          item.style.opacity = "1";
          item.style.transform = `translateZ(0) scale(${scale})`;
          item.style.filter = "blur(0)";
          item.style.pointerEvents = "auto";
        } else {
          const angle = (offset / count) * 360;
          const x = Math.sin((angle * Math.PI) / 180) * (isWide ? 260 : 220);
          const z = Math.cos((angle * Math.PI) / 180) * -280;
          item.style.opacity = isWide ? "0.16" : "0.28";
          item.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${isWide ? 0.34 : 0.48})`;
          item.style.filter = "blur(4px)";
          item.style.pointerEvents = "none";
        }
      });
    }

    items.forEach((item) => {
      item.addEventListener("click", () => {
        const index = Array.from(items).indexOf(item);
        currentIndex = index;
        updatePositions();
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = setInterval(() => {
            currentIndex = (currentIndex + 1) % count;
            updatePositions();
          }, 3000);
        }
      });
    });

    updatePositions();
    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % count;
      updatePositions();
    }, 3000);
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

  function renderDownloadBtn(item, baseUrl, files) {
    const url = item.file ? files[item.file] || item.url : item.url;
    const fullUrl = url && url.startsWith("http") ? url : baseUrl + (url || "");
    const isApk = /\.apk(\?|$)/i.test(fullUrl);
    const isExternal = !!item.external;
    const downloadAttr = isApk && !isExternal ? " download" : "";
    const externalAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    const icon = isExternal
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

    if (item.simple || (!item.desc && !item.size)) {
      return `
      <a class="btn btn-primary download-cta" href="${escapeHtml(fullUrl)}"${downloadAttr}${externalAttr}>
        ${icon}
        ${escapeHtml(item.name || (isExternal ? "打开安装页" : "立即下载"))}
      </a>`;
    }

    return `
      <a class="download-btn" href="${escapeHtml(fullUrl)}"${downloadAttr}${externalAttr}>
        <div class="info">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.desc)}</span>
        </div>
        <span class="size">${escapeHtml(item.size || "")}</span>
      </a>`;
  }

  async function loadDownloadConfig() {
    const heroVersion = document.getElementById("hero-version");

    try {
      const res = await fetch(CONFIG_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const config = await res.json();

      const { version, platforms = [], groups, baseUrl = "", files = {} } = config;

      // 兼容旧 groups 结构
      const platformList = platforms.length
        ? platforms
        : (groups || []).flatMap((g) =>
            (g.platforms || []).map((p) => ({
              ...p,
              versionName: p.versionName || g.versionName,
            }))
          );

      const phone = platformList.find((p) => p.id === "phone");
      const androidName = phone?.versionName || version.name;

      if (heroVersion) heroVersion.textContent = `v${androidName}`;

      platformList.forEach((platform) => {
        const card = document.querySelector(`.platform-card[data-platform="${platform.id}"]`);
        if (!card) return;
        const slot = card.querySelector(".platform-downloads");
        if (!slot) return;
        slot.innerHTML = (platform.downloads || [])
          .map((item) => renderDownloadBtn(item, baseUrl, files))
          .join("");
      });
    } catch (err) {
      console.error("加载下载配置失败:", err);
      if (heroVersion) heroVersion.textContent = "v—";
      document.querySelectorAll(".platform-downloads").forEach((slot) => {
        slot.innerHTML = '<p class="download-error">下载配置加载失败</p>';
      });
    }
  }

  observeElements(".feature-card, .platform-card, .faq-item");
  loadDownloadConfig();
  initMockupCarousel();
  initDeviceSwitcher();
  initWechatAlert();
})();
