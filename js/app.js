/* 专八词汇 · 如鱼得水分类学习站 */
(function () {
  "use strict";

  var CATS = [];
  var FAV_KEY = "tem8_favs_v1";
  var PAGE_SIZE = 40;
  var PALETTE = [
    ["#4f6ef7", "#7b5cf0"], ["#f7576f", "#f7a14f"], ["#0fb981", "#34d399"],
    ["#f59e0b", "#f97316"], ["#06b6d4", "#3b82f6"], ["#8b5cf6", "#d946ef"],
    ["#ec4899", "#f43f5e"], ["#14b8a6", "#0ea5e9"], ["#a855f7", "#6366f1"],
    ["#f43f5e", "#f97316"], ["#10b981", "#84cc16"], ["#0ea5e9", "#6366f1"],
    ["#e11d48", "#f59e0b"], ["#3b82f6", "#06b6d4"], ["#7c3aed", "#db2777"],
    ["#059669", "#0d9488"], ["#d97706", "#ea580c"], ["#2563eb", "#7c3aed"],
    ["#dc2626", "#ea580c"], ["#0284c7", "#0ea5e9"]
  ];

  var app = document.getElementById("app");
  var searchInput = document.getElementById("globalSearch");
  var toTopBtn = null;

  /* ---------- 工具函数 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function highlight(text, q) {
    if (!q) return esc(text);
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return esc(text);
    return esc(text.slice(0, idx)) + "<mark>" + esc(text.slice(idx, idx + q.length)) + "</mark>" + esc(text.slice(idx + q.length));
  }
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 1600);
  }
  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveFavs(f) { localStorage.setItem(FAV_KEY, JSON.stringify(f)); }
  function favToggle(word) {
    var f = getFavs();
    if (f[word]) { delete f[word]; saveFavs(f); toast("已取消收藏"); }
    else { f[word] = 1; saveFavs(f); toast("已收藏，可在「我的收藏」查看"); }
    return !f[word] ? false : true;
  }
  function catById(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return null;
  }
  function catGrad(i) {
    var p = PALETTE[i % PALETTE.length];
    return "linear-gradient(135deg, " + p[0] + " 0%, " + p[1] + " 100%)";
  }

  /* ---------- 路由 ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    if (!h) return { view: "home" };
    var parts = h.split("/");
    if (parts[0] === "cat" && parts[1]) return { view: "cat", id: parts[1], page: parseInt(parts[2], 10) || 1 };
    if (parts[0] === "learn") return { view: "learn", cat: parts[1] || "" };
    if (parts[0] === "favorites") return { view: "favorites" };
    if (parts[0] === "search") return { view: "search", q: decodeURIComponent(parts.slice(1).join("/")) };
    return { view: "home" };
  }
  function setNav(view) {
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + view || (view === "home" && a.getAttribute("href") === "#/"));
    });
  }

  /* ---------- 渲染：首页 ---------- */
  function renderHome() {
    setNav("home");
    app.innerHTML =
      '<section class="hero">' +
        '<div class="hero-inner">' +
          '<h1>专八词汇 · 按中文近义分类记忆</h1>' +
          '<p class="sub">基于《如鱼得水专八词汇语境记忆》4345 个核心词汇，按中文意思相近自动归组，让背单词从「孤立记忆」变成「联想网络」。</p>' +
          '<div class="hero-stats">' +
            '<div class="stat-chip"><b>4345</b><span>总词汇</span></div>' +
            '<div class="stat-chip"><b>' + CATS.length + '</b><span>语义分组</span></div>' +
            '<div class="stat-chip"><b>100%</b><span>覆盖词表</span></div>' +
          '</div>' +
          '<div class="hero-actions">' +
            '<a href="#learn" class="btn btn-light">🎲 随机学习</a>' +
            '<a href="#/cat/" class="btn btn-ghost" id="browseCats">浏览全部分类</a>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="container">' +
        '<section class="howto">' +
          '<div class="howto-grid">' +
            '<div class="howto-card"><div class="step">STEP 1</div><h3>浏览语义分组</h3><p>从下方分类卡片进入，每组都是中文意思相近的词汇，一次记一串。</p></div>' +
            '<div class="howto-card"><div class="step">STEP 2</div><h3>搜索精准定位</h3><p>顶部搜索框支持英文单词与中文释义双向检索，随时查漏补缺。</p></div>' +
            '<div class="howto-card"><div class="step">STEP 3</div><h3>收藏反复复习</h3><p>点击单词卡片右上角星标收藏生词，配合「随机学习」滚动巩固。</p></div>' +
          '</div>' +
        '</section>' +
        '<div class="section-head"><h2>语义分类总览</h2><span class="hint">共 ' + CATS.length + ' 个分组 · 点击卡片进入学习</span></div>' +
        '<div class="cat-grid" id="catGrid"></div>' +
      '</div>';

    var grid = $("#catGrid");
    var frag = document.createDocumentFragment();
    CATS.forEach(function (cat, i) {
      var card = el("a", "cat-card");
      card.href = "#/cat/" + cat.id;
      card.innerHTML =
        '<div class="cat-top">' +
          '<span class="cat-ico" style="background:' + catGrad(i) + '">' + esc(cat.name.charAt(0)) + '</span>' +
          '<div><h3>' + esc(cat.name) + '</h3><span class="cat-count">' + cat.words.length + ' 词</span></div>' +
        '</div>' +
        '<p class="cat-desc">' + esc(cat.desc) + '</p>';
      frag.appendChild(card);
    });
    grid.appendChild(frag);

    var browseBtn = $("#browseCats");
    if (browseBtn) {
      browseBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var g = $("#catGrid");
        if (g) g.scrollIntoView({ behavior: "smooth", block: "start" });
        location.hash = "/";
      });
    }
  }

  /* ---------- 渲染：分类详情 ---------- */
  function renderCat(route) {
    var cat = catById(route.id);
    setNav("");
    if (!cat) { renderHome(); return; }
    var total = cat.words.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    var page = Math.min(route.page || 1, pages);
    var gradIdx = CATS.indexOf(cat);
    var start = (page - 1) * PAGE_SIZE;
    var slice = cat.words.slice(start, start + PAGE_SIZE);

    app.innerHTML =
      '<div class="container">' +
        '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>' + esc(cat.name) + '</span></div>' +
        '<div class="cat-hero" style="background:' + catGrad(gradIdx) + '">' +
          '<span class="cat-ico">' + esc(cat.name.charAt(0)) + '</span>' +
          '<div><h2>' + esc(cat.name) + '</h2><p>' + esc(cat.desc) + '</p></div>' +
          '<div class="cat-hero-meta">共 ' + total + ' 个近义词<br><a href="#learn/' + cat.id + '" style="color:#fff;text-decoration:underline">在此组随机学习 →</a></div>' +
        '</div>' +
        '<div class="word-list" id="wordList"></div>' +
        '<div class="pagination" id="pager"></div>' +
      '</div>';

    var list = $("#wordList");
    var frag = document.createDocumentFragment();
    var favs = getFavs();
    slice.forEach(function (item) {
      var card = el("div", "word-card");
      var on = favs[item.w] ? " on" : "";
      card.innerHTML =
        '<div class="word-top"><span class="word">' + esc(item.w) + '</span>' +
        '<button class="fav-btn' + on + '" data-word="' + esc(item.w) + '" aria-label="收藏">' + (on ? "★" : "☆") + '</button></div>' +
        '<p class="meaning">' + esc(item.m) + '</p>';
      frag.appendChild(card);
    });
    list.appendChild(frag);
    bindFavButtons(list);

    var pager = $("#pager");
    if (pages > 1) {
      pager.innerHTML =
        '<button id="prevPage" ' + (page <= 1 ? "disabled" : "") + '>上一页</button>' +
        '<span class="page-info">第 ' + page + ' / ' + pages + ' 页</span>' +
        '<button id="nextPage" ' + (page >= pages ? "disabled" : "") + '>下一页</button>';
      $("#prevPage").addEventListener("click", function () { location.hash = "/cat/" + cat.id + "/" + (page - 1); });
      $("#nextPage").addEventListener("click", function () { location.hash = "/cat/" + cat.id + "/" + (page + 1); });
    }
  }

  /* ---------- 渲染：搜索 ---------- */
  function renderSearch(q) {
    setNav("");
    if (!q) { renderHome(); return; }
    var ql = q.toLowerCase();
    var wordHits = [], meaningHits = [], catHits = [];
    var favs = getFavs();

    CATS.forEach(function (cat) {
      if (cat.name.toLowerCase().indexOf(ql) >= 0 || cat.desc.toLowerCase().indexOf(ql) >= 0) {
        catHits.push(cat);
      }
      cat.words.forEach(function (item) {
        if (item.w.toLowerCase().indexOf(ql) >= 0) wordHits.push(item);
        else if (item.m.toLowerCase().indexOf(ql) >= 0) meaningHits.push(item);
      });
    });
    // 去重（单词优先）
    var seen = {};
    var allHits = [];
    wordHits.concat(meaningHits).forEach(function (it) {
      if (!seen[it.w]) { seen[it.w] = 1; allHits.push(it); }
    });

    var html = '<div class="container">' +
      '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>搜索：' + esc(q) + '</span></div>' +
      '<div class="result-note">找到 <b>' + allHits.length + '</b> 个单词' + (catHits.length ? '，<b>' + catHits.length + '</b> 个相关分组' : '') + '</div>';

    if (catHits.length) {
      html += '<div class="section-head"><h2>相关分组</h2></div><div class="cat-grid" id="searchCats"></div>';
    }
    if (allHits.length) {
      html += '<div class="section-head"><h2>单词结果</h2></div><div class="word-list" id="searchWords"></div>';
    } else {
      html += '<div class="empty-state"><h3>没有找到匹配结果</h3><p>试试其他拼写或中文关键词，例如 anger / 愤怒 / happy</p></div>';
    }
    html += '</div>';
    app.innerHTML = html;

    if (catHits.length) {
      var g = $("#searchCats");
      var frag = document.createDocumentFragment();
      catHits.forEach(function (cat, i) {
        var card = el("a", "cat-card");
        card.href = "#/cat/" + cat.id;
        card.innerHTML =
          '<div class="cat-top"><span class="cat-ico" style="background:' + catGrad(CATS.indexOf(cat)) + '">' + esc(cat.name.charAt(0)) + '</span>' +
          '<div><h3>' + highlight(cat.name, q) + '</h3><span class="cat-count">' + cat.words.length + ' 词</span></div></div>' +
          '<p class="cat-desc">' + esc(cat.desc) + '</p>';
        frag.appendChild(card);
      });
      g.appendChild(frag);
    }

    if (allHits.length) {
      var w = $("#searchWords");
      var frag2 = document.createDocumentFragment();
      allHits.slice(0, 200).forEach(function (item) {
        var card = el("div", "word-card");
        var on = favs[item.w] ? " on" : "";
        card.innerHTML =
          '<div class="word-top"><span class="word">' + highlight(item.w, q) + '</span>' +
          '<button class="fav-btn' + on + '" data-word="' + esc(item.w) + '">' + (on ? "★" : "☆") + '</button></div>' +
          '<p class="meaning">' + highlight(item.m, q) + '</p>';
        frag2.appendChild(card);
      });
      w.appendChild(frag2);
      bindFavButtons(w);
      if (allHits.length > 200) {
        var note = el("p", "result-note", "结果较多，仅显示前 200 条，请细化关键词");
        w.parentNode.insertBefore(note, w.nextSibling);
      }
    }
  }

  /* ---------- 渲染：随机学习 ---------- */
  function renderLearn(catId) {
    setNav("learn");
    var pool;
    if (catId) {
      var cat = catById(catId);
      pool = cat ? cat.words.slice() : [];
    } else {
      pool = [];
      CATS.forEach(function (c) { pool = pool.concat(c.words); });
    }
    if (!pool.length) {
      app.innerHTML = '<div class="container"><div class="empty-state"><h3>暂无可用词汇</h3></div></div>';
      return;
    }
    // 洗牌取 20
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var deck = pool.slice(0, 20);
    var idx = 0, revealed = false;

    app.innerHTML =
      '<div class="container">' +
        '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>随机学习' + (catId ? " · " + esc(catById(catId).name) : "") + '</span></div>' +
        '<div class="section-head"><h2>随机学习</h2><span class="hint">每次随机抽取 20 个单词，先想中文意思，再点「显示释义」核对</span></div>' +
        '<div class="learn-wrap">' +
          '<div class="learn-card" id="learnCard">' +
            '<div class="learn-word">' + esc(deck[0].w) + '</div>' +
            '<div class="learn-meaning" id="learnMeaning" style="opacity:0">？？？</div>' +
            '<div class="learn-progress" id="learnProg">1 / 20</div>' +
          '</div>' +
          '<div class="learn-actions">' +
            '<button class="btn btn-primary" id="btnReveal">显示释义</button>' +
            '<button class="btn btn-ghost btn-light" id="btnNext" style="background:var(--primary-soft);color:var(--primary-deep)">下一个 →</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wordEl = $("#learnCard .learn-word");
    var meanEl = $("#learnMeaning");
    var progEl = $("#learnProg");
    var favs = getFavs();

    function show() {
      var item = deck[idx];
      wordEl.textContent = item.w;
      meanEl.textContent = favs[item.w] ? "（已收藏）" : "";
      meanEl.style.opacity = 0;
      progEl.textContent = (idx + 1) + " / " + deck.length;
      revealed = false;
      $("#btnReveal").textContent = "显示释义";
      $("#btnNext").textContent = idx === deck.length - 1 ? "再来一组 🔄" : "下一个 →";
    }
    $("#btnReveal").addEventListener("click", function () {
      if (!revealed) {
        var item = deck[idx];
        meanEl.textContent = item.m + (favs[item.w] ? "　★ 已收藏" : "");
        meanEl.style.opacity = 1;
        revealed = true;
        this.textContent = "收藏 ★";
      } else {
        favToggle(deck[idx].w);
        favs = getFavs();
        show();
      }
    });
    $("#btnNext").addEventListener("click", function () {
      idx++;
      if (idx >= deck.length) { idx = 0; }
      show();
    });
  }

  /* ---------- 渲染：收藏 ---------- */
  function renderFavorites() {
    setNav("favorites");
    var favs = getFavs();
    var keys = Object.keys(favs);
    if (!keys.length) {
      app.innerHTML = '<div class="container"><div class="empty-state"><h3>还没有收藏任何单词</h3><p>浏览分类或搜索单词，点击 ☆ 即可收藏，方便随时复习。</p><div style="margin-top:16px"><a href="#/" class="btn btn-primary">去浏览分类</a></div></div></div>';
      return;
    }
    var items = [];
    CATS.forEach(function (cat) {
      cat.words.forEach(function (item) {
        if (favs[item.w]) items.push(item);
      });
    });

    app.innerHTML =
      '<div class="container">' +
        '<div class="breadcrumb"><a href="#/">首页</a><span class="sep">/</span><span>我的收藏</span></div>' +
        '<div class="section-head"><h2>我的收藏</h2><span class="hint">共 ' + items.length + ' 个单词 · 点击 ★ 取消收藏</span></div>' +
        '<div class="word-list" id="favList"></div>' +
      '</div>';
    var list = $("#favList");
    var frag = document.createDocumentFragment();
    items.forEach(function (item) {
      var card = el("div", "word-card");
      card.innerHTML =
        '<div class="word-top"><span class="word">' + esc(item.w) + '</span>' +
        '<button class="fav-btn on" data-word="' + esc(item.w) + '">★</button></div>' +
        '<p class="meaning">' + esc(item.m) + '</p>';
      frag.appendChild(card);
    });
    list.appendChild(frag);
    bindFavButtons(list);
  }

  /* ---------- 收藏按钮绑定 ---------- */
  function bindFavButtons(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".fav-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var word = this.getAttribute("data-word");
        var still = favToggle(word);
        this.classList.toggle("on", still);
        this.textContent = still ? "★" : "☆";
        // 若在收藏页取消收藏，延迟移除卡片
        if (location.hash.indexOf("favorites") >= 0 && !still) {
          var card = this.closest(".word-card");
          setTimeout(function () { card.style.opacity = "0"; card.style.transition = "opacity .3s"; setTimeout(function () { card.remove(); }, 300); }, 300);
        }
      });
    });
  }

  /* ---------- 搜索输入 ---------- */
  var searchTimer = null;
  searchInput.addEventListener("input", function () {
    var q = this.value.trim();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      if (q) location.hash = "/search/" + encodeURIComponent(q);
      else if (location.hash.indexOf("/search/") === 0) location.hash = "/";
    }, 350);
  });

  /* ---------- 返回顶部 ---------- */
  toTopBtn = el("button", "to-top", "↑");
  toTopBtn.setAttribute("aria-label", "返回顶部");
  document.body.appendChild(toTopBtn);
  toTopBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", function () {
    toTopBtn.classList.toggle("show", window.scrollY > 500);
  });

  /* ---------- 路由分发 ---------- */
  function route() {
    var r = parseHash();
    if (r.view === "cat") renderCat(r);
    else if (r.view === "learn") renderLearn(r.cat || "");
    else if (r.view === "favorites") renderFavorites();
    else if (r.view === "search") { searchInput.value = r.q; renderSearch(r.q); }
    else renderHome();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  window.addEventListener("hashchange", route);

  /* ---------- 初始化 ---------- */
  fetch("data/vocab.json")
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (data) {
      CATS = data;
      // 综合词汇置底
      CATS.sort(function (a, b) {
        if (a.id === "misc") return 1;
        if (b.id === "misc") return -1;
        return b.words.length - a.words.length;
      });
      route();
    })
    .catch(function (err) {
      app.innerHTML = '<div class="container"><div class="empty-state"><h3>词汇数据加载失败</h3><p>' + esc(err.message) + '，请检查 data/vocab.json 是否存在。</p></div></div>';
    });
})();
