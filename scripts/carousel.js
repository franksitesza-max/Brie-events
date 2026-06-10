if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  if (!window.location.hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
});

const carousel = document.querySelector("[data-carousel]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");

if (carousel && prevButton && nextButton) {
  const originalItems = [...carousel.querySelectorAll(".gallery-item")];
  const itemCount = originalItems.length;
  const initialIndex = itemCount > 1 ? 1 : 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let items = originalItems;
  let activeIndex = initialIndex;
  let rafId = 0;
  let normalizeTimer = 0;

  if (itemCount > 1) {
    const leadingClones = originalItems.map((item) => item.cloneNode(true));
    const trailingClones = originalItems.map((item) => item.cloneNode(true));

    [...leadingClones, ...trailingClones].forEach((item) => {
      item.removeAttribute("id");
      item.removeAttribute("aria-current");
      item.setAttribute("aria-hidden", "true");
      item.classList.remove("is-active");
    });

    carousel.prepend(...leadingClones);
    carousel.append(...trailingClones);
    items = [...carousel.querySelectorAll(".gallery-item")];
    activeIndex = itemCount + initialIndex;
  }

  function setActive(index) {
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeIndex;
      item.classList.toggle("is-active", isActive);
      if (item.hasAttribute("aria-hidden")) return;
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function scrollToItem(index, behavior) {
    items[index].scrollIntoView({
      behavior,
      block: "nearest",
      inline: "center"
    });
  }

  function normalizePosition() {
    if (itemCount <= 1) return;

    let normalizedIndex = activeIndex;
    if (activeIndex < itemCount) {
      normalizedIndex = activeIndex + itemCount;
    }
    if (activeIndex >= itemCount * 2) {
      normalizedIndex = activeIndex - itemCount;
    }

    if (normalizedIndex !== activeIndex) {
      setActive(normalizedIndex);
      scrollToItem(normalizedIndex, "auto");
    }
  }

  function queueNormalize() {
    window.clearTimeout(normalizeTimer);
    normalizeTimer = window.setTimeout(normalizePosition, 140);
  }

  function nearestIndex() {
    const carouselBox = carousel.getBoundingClientRect();
    const center = carouselBox.left + carouselBox.width / 2;
    return items.reduce(
      (nearest, item, index) => {
        const box = item.getBoundingClientRect();
        const distance = Math.abs(box.left + box.width / 2 - center);
        return distance < nearest.distance ? { index, distance } : nearest;
      },
      { index: activeIndex, distance: Number.POSITIVE_INFINITY }
    ).index;
  }

  function updateFromScroll() {
    rafId = 0;
    setActive(nearestIndex());
    queueNormalize();
  }

  function queueUpdate() {
    if (!rafId) rafId = requestAnimationFrame(updateFromScroll);
  }

  function move(direction) {
    const targetIndex = (activeIndex + direction + items.length) % items.length;
    setActive(targetIndex);
    scrollToItem(targetIndex, prefersReducedMotion.matches ? "auto" : "smooth");
    queueNormalize();
  }

  prevButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  carousel.addEventListener("scroll", queueUpdate, { passive: true });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });

  requestAnimationFrame(() => {
    setActive(activeIndex);
    scrollToItem(activeIndex, "auto");
  });
}
