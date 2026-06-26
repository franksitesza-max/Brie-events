const loadingRoot = document.documentElement;
const loadingStartedAt = performance.now();
let componentsMarkedReady = false;

function markComponentsReady() {
  if (componentsMarkedReady) return;
  componentsMarkedReady = true;
  const elapsed = performance.now() - loadingStartedAt;
  const remainingDelay = Math.max(0, 240 - elapsed);
  window.setTimeout(() => {
    requestAnimationFrame(() => {
      loadingRoot.classList.remove("is-loading");
      loadingRoot.classList.add("components-ready");
    });
  }, remainingDelay);
}

function waitForEagerImages() {
  const eagerImages = [...document.images].filter((image) => image.loading !== "lazy");
  return Promise.all(eagerImages.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

const fontsReady = document.fonts ? document.fonts.ready.catch(() => undefined) : Promise.resolve();
Promise.all([fontsReady, waitForEagerImages()]).then(markComponentsReady);
window.addEventListener("load", markComponentsReady, { once: true });
window.setTimeout(markComponentsReady, 1600);
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
  const items = [...carousel.querySelectorAll(".gallery-item")];
  const itemCount = items.length;
  const initialIndex = itemCount > 1 ? 1 : 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = initialIndex;
  let rafId = 0;

  function setActive(index) {
    if (!itemCount) return;
    activeIndex = (index + itemCount) % itemCount;
    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeIndex;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function scrollToItem(index, behavior) {
    const item = items[index];
    if (!item) return;
    const targetScrollLeft = item.offsetLeft - (carousel.clientWidth - item.clientWidth) / 2;
    if (behavior === "smooth") {
      carousel.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
    } else {
      carousel.scrollLeft = targetScrollLeft;
    }
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
  }

  function queueUpdate() {
    if (!rafId) rafId = requestAnimationFrame(updateFromScroll);
  }

  function move(direction) {
    const targetIndex = (activeIndex + direction + itemCount) % itemCount;
    setActive(targetIndex);
    scrollToItem(targetIndex, prefersReducedMotion.matches ? "auto" : "smooth");
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