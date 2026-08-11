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