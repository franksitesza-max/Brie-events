const loadingRoot = document.documentElement;
const loadingStartedAt = performance.now();
let pageMarkedReady = false;

loadingRoot.classList.add("is-loading");

function mediaShellFor(image) {
  return image.closest(
    ".hero-cake-card, .content-hero-image, .portrait-frame, .gallery-item"
  );
}

function prepareImageSkeleton(image) {
  const shell = mediaShellFor(image);
  if (!shell) return Promise.resolve();

  shell.classList.add("skeleton-media");

  const markReady = () => {
    shell.classList.add("media-ready");
  };

  if (image.complete) {
    markReady();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      markReady();
      resolve();
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
}

function markPageReady() {
  if (pageMarkedReady) return;
  pageMarkedReady = true;
  const elapsed = performance.now() - loadingStartedAt;
  const remainingDelay = Math.max(0, 220 - elapsed);

  window.setTimeout(() => {
    requestAnimationFrame(() => {
      loadingRoot.classList.remove("is-loading");
      loadingRoot.classList.add("components-ready");
    });
  }, remainingDelay);
}

function startLoadingState() {
  const images = [...document.querySelectorAll("main img")];
  const imageReadiness = new Map(
    images.map((image) => [image, prepareImageSkeleton(image)])
  );
  const eagerImages = images.filter((image) => image.loading !== "lazy");
  const eagerReady = Promise.all(
    eagerImages.map((image) => imageReadiness.get(image) ?? Promise.resolve())
  );
  const fontsReady = document.fonts
    ? document.fonts.ready.catch(() => undefined)
    : Promise.resolve();

  Promise.all([fontsReady, eagerReady]).then(markPageReady);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startLoadingState, { once: true });
} else {
  startLoadingState();
}

window.addEventListener("load", markPageReady, { once: true });
window.setTimeout(markPageReady, 1600);
