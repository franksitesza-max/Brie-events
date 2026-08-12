const gooeyNav = document.querySelector("[data-gooey-nav]");

if (gooeyNav) {
  const navItems = [...gooeyNav.querySelectorAll("[data-nav-item]")];
  const effect = gooeyNav.querySelector("[data-nav-effect]");
  const effectText = gooeyNav.querySelector("[data-nav-effect-text]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeItem = null;

  function updateEffectPosition(item) {
    if (!item || !effect || !effectText) return;
    const containerRect = gooeyNav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const styles = {
      left: `${itemRect.left - containerRect.left + gooeyNav.scrollLeft}px`,
      top: `${itemRect.top - containerRect.top + gooeyNav.scrollTop}px`,
      width: `${itemRect.width}px`,
      height: `${itemRect.height}px`
    };
    Object.assign(effect.style, styles);
    Object.assign(effectText.style, styles);
    effectText.textContent = item.textContent.trim();
  }

  function createParticles() {
    if (!effect || reduceMotion.matches) return;
    effect.querySelectorAll(".nav-particle").forEach((particle) => particle.remove());
    const colors = ["#f3c2c9", "#d66a82", "#7f4d57", "#f7ded8"];

    for (let index = 0; index < 24; index += 1) {
      const angle = (Math.PI * 2 * index) / 24 + (Math.random() - 0.5) * 0.2;
      const distance = 30 + Math.random() * 38;
      const particle = document.createElement("span");
      particle.className = "nav-particle";
      particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--particle-scale", (0.7 + Math.random() * 0.72).toFixed(2));
      particle.style.setProperty("--particle-color", colors[index % colors.length]);
      effect.appendChild(particle);
      window.setTimeout(() => particle.remove(), 820);
    }
  }

  function setActive(item, animate = true) {
    activeItem = item;
    if (!item || item.classList.contains("is-active")) {
      updateEffectPosition(item);
      return;
    }

    navItems.forEach((candidate) => {
      const active = candidate === item;
      candidate.classList.toggle("is-active", active);
      const link = candidate.querySelector("a");
      if (link) {
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    });

    updateEffectPosition(item);
    effectText?.classList.remove("is-active");
    void effectText?.offsetWidth;
    effectText?.classList.add("is-active");
    if (animate) createParticles();
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => setActive(item));
  });

  const sectionItems = navItems
    .map((item) => {
      const href = item.querySelector("a")?.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return null;
      const target = document.querySelector(href);
      const section = target?.closest("section") ?? target;
      return section ? { item, section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sectionItems.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const match = sectionItems.find(({ section }) => section === visible?.target);
      if (match) setActive(match.item, false);
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.2, 0.5] });

    sectionItems.forEach(({ section }) => observer.observe(section));
  }

  const initial = navItems.find((item) => {
    const href = item.querySelector("a")?.getAttribute("href");
    return window.location.hash && href === window.location.hash;
  }) ?? navItems[0];

  initial?.classList.add("is-active");
  initial?.querySelector("a")?.setAttribute("aria-current", "location");
  activeItem = initial;

  const positionInitial = () => updateEffectPosition(activeItem || initial);
  if ("ResizeObserver" in window) {
    new ResizeObserver(positionInitial).observe(gooeyNav);
  }
  gooeyNav.addEventListener("scroll", positionInitial, { passive: true });
  window.addEventListener("load", positionInitial, { once: true });
  requestAnimationFrame(positionInitial);
}
