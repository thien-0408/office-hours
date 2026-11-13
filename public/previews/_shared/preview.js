// Shared preview behaviour, preview-only (not ported):
//  - theme from ?theme=light|dark|system, else the last choice, kept across preview pages
//    (the real app keeps it in the NEXT_THEME cookie, see components/mochy/theme.ts);
//  - binds every theme button: [data-theme-set] or the legacy ids (tLight/tDark, ...);
//  - injects the status-glyph sprite (StatusGlyph.tsx shapes) once per page.
(function () {
  var KEY = "oh-preview-theme";
  var THEMES = ["light", "dark", "system"];
  var LEGACY = {
    tLight: "light", tDark: "dark", btnLight: "light", btnDark: "dark",
    themeLight: "light", themeDark: "dark",
  };
  var root = document.documentElement;

  function read() {
    var q = new URLSearchParams(location.search).get("theme");
    if (THEMES.indexOf(q) >= 0) return q;
    try {
      var s = localStorage.getItem(KEY);
      if (THEMES.indexOf(s) >= 0) return s;
    } catch (e) {}
    return root.getAttribute("data-mochy-theme") || "dark";
  }

  function buttons() {
    var list = [];
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      list.push([b, b.getAttribute("data-theme-set")]);
    });
    Object.keys(LEGACY).forEach(function (id) {
      var b = document.getElementById(id);
      if (b) list.push([b, LEGACY[id]]);
    });
    return list;
  }

  function apply(theme, save) {
    root.setAttribute("data-mochy-theme", theme);
    buttons().forEach(function (pair) {
      var on = pair[1] === theme;
      pair[0].classList.toggle("active", on);
      pair[0].setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (save) try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  // Set the theme before first paint to avoid a dark/light flash.
  root.setAttribute("data-mochy-theme", read());

  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' +
    sym("ok", '<path d="m8 12.2 2.8 2.8L16.2 9"/>') +
    sym("wait", '<path d="M12 7.5V12l3 2"/>') +
    sym("done", '<path d="m7.5 12.2 2.6 2.6 6.4-6.4"/>') +
    sym("queue", '<path d="M8 9h8M8 12h8M8 15h5"/>') +
    sym("offer", '<path d="M12 7v6M12 16.6v.4"/>') +
    sym("no", '<path d="m9 9 6 6M15 9l-6 6"/>') +
    sym("off", '<path d="M8 12h8"/>') +
    sym("warn", '<path d="M12 7.5v5M12 16v.5"/>') +
    "</svg>";

  // Solid disc in currentColor, mark drawn in the surface color (--glyph-cut, default --m-bg).
  // A mask would be cleaner but masks inside <symbol> do not survive <use> in Chromium.
  function sym(id, mark) {
    return (
      '<symbol id="g-' + id + '" viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="10" fill="currentColor"/>' +
      '<g fill="none" style="stroke:var(--glyph-cut,var(--m-bg))" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      mark + "</g></symbol>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML("afterbegin", SPRITE);
    apply(root.getAttribute("data-mochy-theme"), false);
    buttons().forEach(function (pair) {
      // Capture phase so the page's own handler (if any) runs after and agrees.
      pair[0].addEventListener("click", function () { apply(pair[1], true); }, true);
    });
  });
})();
