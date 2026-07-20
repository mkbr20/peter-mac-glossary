(function () {
  "use strict";

  var state = {
    entries: [],
    languages: [],
    query: "",
    currentLang: "zh",
  };

  var el = {
    list: document.getElementById("list"),
    resultMeta: document.getElementById("resultMeta"),
    searchInput: document.getElementById("searchInput"),
    searchWrap: document.getElementById("searchWrap"),
    clearBtn: document.getElementById("clearBtn"),
    azBar: document.getElementById("azBar"),
    imgModal: document.getElementById("imgModal"),
    imgModalImg: document.getElementById("imgModalImg"),
    imgModalTitle: document.getElementById("imgModalTitle"),
    imgModalClose: document.getElementById("imgModalClose"),
    aboutLink: document.getElementById("aboutLink"),
    aboutModal: document.getElementById("aboutModal"),
    aboutModalClose: document.getElementById("aboutModalClose"),
    aboutModalBody: document.getElementById("aboutModalBody"),
    langSelect: document.getElementById("langSelect"),
    backToTop: document.getElementById("backToTop"),
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      "<mark>" + escapeHtml(text.slice(idx, idx + q.length)) + "</mark>" +
      escapeHtml(text.slice(idx + q.length))
    );
  }

  function langInfo(code) {
    for (var i = 0; i < state.languages.length; i++) {
      if (state.languages[i].code === code) return state.languages[i];
    }
    return null;
  }

  function matches(entry, q) {
    if (!q) return true;
    q = q.toLowerCase();
    if (entry.en.toLowerCase().indexOf(q) !== -1) return true;
    if (entry.definition && entry.definition.toLowerCase().indexOf(q) !== -1) return true;
    for (var code in entry.translations) {
      if (entry.translations[code] && entry.translations[code].indexOf(q) !== -1) return true;
    }
    return false;
  }

  function rankScore(entry, q) {
    if (!q) return 0;
    q = q.toLowerCase();
    var en = entry.en.toLowerCase();
    if (en === q) return 0;
    if (en.indexOf(q) === 0) return 1;
    for (var code in entry.translations) {
      var t = entry.translations[code];
      if (t === q) return 0.5;
      if (t.indexOf(q) === 0) return 2;
    }
    if (en.indexOf(q) !== -1) return 3;
    for (var code2 in entry.translations) {
      if (entry.translations[code2].indexOf(q) !== -1) return 4;
    }
    return 5;
  }

  function buildAzBar() {
    var present = {};
    state.entries.forEach(function (e) {
      var l = e.en.charAt(0).toUpperCase();
      present[l] = true;
    });
    var html = "";
    for (var c = 65; c <= 90; c++) {
      var letter = String.fromCharCode(c);
      var has = present[letter];
      html += '<button data-letter="' + letter + '" class="' + (has ? "" : "disabled") + '"' +
        (has ? "" : " disabled") + ">" + letter + "</button>";
    }
    el.azBar.innerHTML = html;
    el.azBar.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-letter]");
      if (!btn || btn.disabled) return;
      clearSearch();
      var target = document.getElementById("letter-" + btn.dataset.letter);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function entryCardHtml(entry, q) {
    var curCode = state.currentLang;
    var curInfo = langInfo(curCode);
    var curText = entry.translations[curCode] || "";
    var isRtl = !!(curInfo && curInfo.rtl);
    var def = entry.definition ? highlight(entry.definition, q) :
      '<span class="entry-def empty">No definition given in the source glossary.</span>';
    var defHtml = entry.definition ? ('<div class="entry-def">' + def + "</div>") : ('<div class="entry-def empty">No definition given in the source glossary.</div>');

    var translationHtml = curText
      ? ('<span class="entry-translation"' + (isRtl ? ' dir="rtl"' : '') + '>' + highlight(curText, q) + "</span>")
      : '<span class="entry-translation empty">No ' + (curInfo ? curInfo.name : curCode) + " translation in the source glossary.</span>";

    var verifyBtns = "";
    var curPage = entry.sourcePages[curCode];
    if (curPage) {
      var curLabel = curInfo ? curInfo.native : curCode;
      verifyBtns = '<button class="verify-btn" data-lang="' + curCode + '" data-page="' + curPage +
        '" data-title="' + escapeHtml(entry.en) + '">🔍 View source page (' + curLabel + ")</button>";
    }

    return (
      '<div class="entry-card" data-id="' + entry.id + '">' +
        '<div class="entry-top">' +
          '<span class="entry-en">' + highlight(entry.en, q) + "</span>" +
          translationHtml +
        "</div>" +
        defHtml +
        (verifyBtns ? ('<div class="entry-actions">' + verifyBtns + "</div>") : "") +
      "</div>"
    );
  }

  function render() {
    var q = state.query.trim();
    var filtered;

    if (!q) {
      // browse mode: full alphabetical list grouped by letter
      filtered = state.entries.slice();
      var html = "";
      var currentLetter = null;
      filtered.forEach(function (e) {
        var l = e.en.charAt(0).toUpperCase();
        if (l !== currentLetter) {
          currentLetter = l;
          html += '<div class="letter-heading" id="letter-' + l + '">' + l + "</div>";
        }
        html += entryCardHtml(e, "");
      });
      el.resultMeta.textContent = state.entries.length + " terms";
      el.list.innerHTML = html;
    } else {
      filtered = state.entries.filter(function (e) { return matches(e, q); });
      filtered.sort(function (a, b) { return rankScore(a, q) - rankScore(b, q) || a.en.localeCompare(b.en); });
      el.resultMeta.textContent = filtered.length + " match" + (filtered.length === 1 ? "" : "es") + ' for "' + q + '"';
      if (filtered.length === 0) {
        el.list.innerHTML = '<div class="no-results">No matches. Try a different term, in any language.</div>';
      } else {
        el.list.innerHTML = filtered.map(function (e) { return entryCardHtml(e, q); }).join("");
      }
    }
  }

  function clearSearch() {
    el.searchInput.value = "";
    state.query = "";
    el.searchWrap.classList.remove("has-text");
    render();
  }

  function openImageModal(langCode, page, title) {
    var li = langInfo(langCode);
    if (!li) return;
    var path = li.pagesDir + "/page-" + page + ".jpg";
    el.imgModalImg.src = path;
    el.imgModalImg.className = "fit-width";
    el.imgModalTitle.textContent = title + " — " + li.native + " p." + page;
    el.imgModal.classList.add("open");
  }

  el.imgModalImg.addEventListener("click", function () {
    var isFit = el.imgModalImg.classList.contains("fit-width");
    el.imgModalImg.className = isFit ? "full-size" : "fit-width";
    if (isFit) {
      el.imgModalImg.parentElement.scrollTop = 0;
      el.imgModalImg.parentElement.scrollLeft = 0;
    }
  });

  function aboutHtml() {
    var langList = state.languages.map(function (l) { return l.name; }).join(", ");
    return (
      "<h2>What this is</h2>" +
      "<p>A mobile-friendly, offline-capable digitisation of the printed <em>Multilingual Cancer Glossary</em> " +
      "produced by the Australian Cancer Survivorship Centre (A Richard Pratt Legacy) at Peter MacCallum Cancer " +
      "Centre, developed through a Cancer Australia <em>Supporting people with cancer</em> Grant initiative. " +
      "All 9 published language editions are included: " + escapeHtml(langList) + ". Use the language selector " +
      "in the header to choose which translation is shown on each entry — search works across every language " +
      "at once regardless of which one is selected.</p>" +

      "<h2>Verifying entries</h2>" +
      "<p>Every entry links to an image of the actual page it was taken from in each language's source PDF, so " +
      "you can check any term or translation against the original at any time via the 🔍 buttons under each entry.</p>" +

      "<h2>Known source gap</h2>" +
      "<p>During digitisation, one page of the original Chinese (Simplified) PDF (glossary page 53, falling " +
      "alphabetically between “pleural cavity” and “protocol”) was found to be duplicated in place of the correct " +
      "page — the source document itself appears to be missing that page's content, so a small number of P-terms " +
      "are not included here. This is a defect in the source PDF, not in this app's extraction.</p>" +

      "<h2>Vietnamese translations</h2>" +
      "<p>The Vietnamese source PDF's text layer was missing diacritics and, in some cases, whole characters, for " +
      "many entries. About 125 Vietnamese translations were recovered using image-based OCR on the original page " +
      "rather than the PDF's text layer. If you rely on a Vietnamese translation for something important, please " +
      "use \"view source page\" to double-check it against the original scan.</p>" +

      "<h2>Disclaimer</h2>" +
      "<p>This information is a guide only, is not fully comprehensive, and is not intended to diagnose, treat, " +
      "cure or prevent any medical condition. For medical advice, contact your local doctor or Peter Mac on " +
      "03 8559 5000.</p>" +

      "<h2>Source</h2>" +
      "<p>petermac.org/multilingualglossary &middot; contactacsc@petermac.org</p>"
    );
  }

  function init() {
    Promise.all([
      fetch("data/entries.json").then(function (r) { return r.json(); }),
      fetch("data/languages.json").then(function (r) { return r.json(); }),
    ]).then(function (results) {
      state.entries = results[0].sort(function (a, b) { return a.en.toLowerCase().localeCompare(b.en.toLowerCase()); });
      state.languages = results[1];

      var saved = null;
      try { saved = localStorage.getItem("pmGlossaryLang"); } catch (e) {}
      if (saved && langInfo(saved)) {
        state.currentLang = saved;
      } else if (!langInfo(state.currentLang) && state.languages.length) {
        state.currentLang = state.languages[0].code;
      }

      el.langSelect.innerHTML = state.languages.map(function (l) {
        return '<option value="' + l.code + '"' + (l.code === state.currentLang ? " selected" : "") + ">" +
          escapeHtml(l.native) + "</option>";
      }).join("");

      el.langSelect.addEventListener("change", function () {
        state.currentLang = el.langSelect.value;
        try { localStorage.setItem("pmGlossaryLang", state.currentLang); } catch (e) {}
        render();
      });

      buildAzBar();
      render();
    }).catch(function (err) {
      el.list.innerHTML = '<div class="no-results">Could not load glossary data. ' + escapeHtml(String(err)) + "</div>";
    });

    var debounceTimer = null;
    el.searchInput.addEventListener("input", function () {
      state.query = el.searchInput.value;
      el.searchWrap.classList.toggle("has-text", !!state.query);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(render, 60);
    });
    el.clearBtn.addEventListener("click", clearSearch);

    el.list.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".verify-btn");
      if (!btn) return;
      openImageModal(btn.dataset.lang, btn.dataset.page, btn.dataset.title);
    });

    el.imgModalClose.addEventListener("click", function () {
      el.imgModal.classList.remove("open");
      el.imgModalImg.src = "";
    });

    el.aboutLink.addEventListener("click", function () {
      el.aboutModalBody.innerHTML = aboutHtml();
      el.aboutModal.classList.add("open");
    });
    el.aboutModalClose.addEventListener("click", function () {
      el.aboutModal.classList.remove("open");
    });

    var scrollThrottle = null;
    window.addEventListener("scroll", function () {
      if (scrollThrottle) return;
      scrollThrottle = setTimeout(function () {
        el.backToTop.classList.toggle("visible", window.scrollY > 400);
        scrollThrottle = null;
      }, 100);
    });

    el.backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(function () { el.searchInput.focus(); }, 350);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }
})();
