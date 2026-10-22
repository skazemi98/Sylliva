// Hide the splash once the page has loaded, but keep it up for at least 700ms so it reads as a splash.
(function () {
  var sp = document.getElementById("splash");
  if (!sp) return;
  var start = Date.now();
  function hide() {
    var wait = Math.max(0, 700 - (Date.now() - start));
    setTimeout(function () {
      sp.classList.add("gone");
      setTimeout(function () { sp.remove(); }, 450);
    }, wait);
  }
  if (document.readyState === "complete") hide(); else window.addEventListener("load", hide);
})();
