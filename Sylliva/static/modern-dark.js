// Modern Dark: feeds the pointer position into CSS so card spotlights follow the mouse.
(function () {
  if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", (e.clientX - r.left) + "px");
    card.style.setProperty("--spot-y", (e.clientY - r.top) + "px");
  }, { passive: true });
})();
