document.documentElement.classList.add("is-loading");
window.setTimeout(() => {
  document.documentElement.classList.remove("is-loading");
}, 2200);