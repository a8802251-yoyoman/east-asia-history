/* ===== 共用：導覽列、主題、測驗、年表 ===== */
(function () {
  'use strict';

  /* ---------- 主題 ---------- */
  try {
    var saved = localStorage.getItem('eah-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) { /* 隱私模式 / 封鎖儲存 */ }

  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    if (!cur) {
      cur = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('eah-theme', next); } catch (e) { }
  }

  /* ---------- 導覽列 ---------- */
  var NAV = [
    { href: 'index.html', text: '首頁', key: 'home' },
    { href: 'ch0-daolun.html', text: '導論', key: 'ch0' },
    { href: 'chapters.html', text: '篇章節', key: 'ch' },
    { href: 'countries.html', text: '東亞各國', key: 'co' },
    { href: 'timeline.html', text: '綜合年表', key: 'tl' },
    { href: 'timeline-country.html', text: '分國年表', key: 'tlc' },
    { href: 'quiz-all.html', text: '總測驗', key: 'qz' }
  ];

  function buildTopbar(activeKey) {
    var bar = document.createElement('header');
    bar.className = 'topbar';
    var wrap = document.createElement('div');
    wrap.className = 'wrap';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.innerHTML = '<span class="seal">東</span><span>高中歷史第二冊・東亞史</span>';
    wrap.appendChild(brand);

    var nav = document.createElement('nav');
    nav.className = 'navlinks';
    NAV.forEach(function (n) {
      var a = document.createElement('a');
      a.href = n.href;
      a.textContent = n.text;
      if (n.key === activeKey) a.className = 'on';
      nav.appendChild(a);
    });

    var tb = document.createElement('button');
    tb.className = 'theme-btn';
    tb.type = 'button';
    tb.title = '切換深色／淺色';
    tb.setAttribute('aria-label', '切換深色或淺色模式');
    tb.textContent = '◐';
    tb.addEventListener('click', toggleTheme);
    nav.appendChild(tb);

    wrap.appendChild(nav);
    bar.appendChild(wrap);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* ---------- 國家標記 ---------- */
  var COUNTRY = {
    cn: { name: '中國', cls: 'f-cn' },
    jp: { name: '日本', cls: 'f-jp' },
    kr: { name: '韓國', cls: 'f-kr' },
    vn: { name: '越南', cls: 'f-vn' },
    ot: { name: '其他', cls: 'f-ot' }
  };
  function flagHTML(code) {
    var c = COUNTRY[code];
    if (!c) return '';
    return '<span class="flag ' + c.cls + '">' + c.name + '</span>';
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- 選項重排 ----------
     題庫撰寫時正解容易集中在某一選項。此處依「題幹字串雜湊」做確定性重排：
     同一題每次載入順序都相同（師生畫面一致、可印出對答案），
     但整份題庫的正解會平均散布於 (A)(B)(C)(D)。 */
  function imul(a, b) {
    if (Math.imul) return Math.imul(a, b);
    var al = a & 0xffff, ah = a >>> 16, bl = b & 0xffff, bh = b >>> 16;
    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
  }
  function hashStr(s) {
    var h = 2166136261;                       // FNV-1a
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 16;                            // murmur3 收尾混合，確保低位元均勻
    h = imul(h, 2246822507) >>> 0;
    h ^= h >>> 13;
    h = imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  function balanceOptions(items) {
    return items.map(function (q) {
      if (q.keepOrder) return q;
      var n = q.options.length;
      var target = hashStr(q.stem) % n;       // 正解該落在第幾個位置
      var rest = q.options.filter(function (_, i) { return i !== q.answer; });
      var out = [], ri = 0;
      for (var i = 0; i < n; i++) {
        out.push(i === target ? q.options[q.answer] : rest[ri++]);
      }
      var copy = {};
      for (var k in q) if (Object.prototype.hasOwnProperty.call(q, k)) copy[k] = q[k];
      copy.options = out;
      copy.answer = target;
      return copy;
    });
  }

  /* ---------- 測驗引擎 ---------- */
  /* 題目格式：{ stem, source?, options:[...], answer:0-based, explain, keepOrder? } */
  function renderQuiz(mountId, opts) {
    var host = document.getElementById(mountId);
    if (!host) return;
    var title = opts.title || '隨堂測驗';
    var sub = opts.subtitle || '單選題，點選選項後立即顯示解析。';
    var items = opts.items || [];
    if (opts.shuffle) items = shuffle(items);
    if (opts.limit) items = items.slice(0, opts.limit);
    if (opts.balance !== false) items = balanceOptions(items);

    var answered = {}, correctCount = 0;

    host.className = 'quiz';
    var html = '<div class="quiz-head"><h2>' + esc(title) + '</h2></div>'
      + '<p class="quiz-sub">' + esc(sub) + '　共 ' + items.length + ' 題</p>'
      + '<div class="q-list"></div>'
      + '<div class="quiz-foot">'
      + '<button class="btn" type="button" data-act="reveal">顯示全部答案</button>'
      + '<button class="btn ghost" type="button" data-act="reset">重新作答</button>'
      + '<span class="score" hidden>得分 <span class="s-num">0</span> / ' + items.length + '</span>'
      + '</div>';
    host.innerHTML = html;

    var list = host.querySelector('.q-list');
    var scoreEl = host.querySelector('.score');
    var scoreNum = host.querySelector('.s-num');
    var LET = ['A', 'B', 'C', 'D', 'E'];

    items.forEach(function (q, qi) {
      var el = document.createElement('div');
      el.className = 'q';
      var h = '<p class="q-stem"><span class="q-no">' + (qi + 1) + '.</span>' + q.stem + '</p>';
      if (q.source) h += '<div class="q-src">' + q.source + '</div>';
      h += '<ul class="opts"></ul>';
      h += '<div class="q-exp" hidden></div>';
      el.innerHTML = h;

      var ul = el.querySelector('.opts');
      q.options.forEach(function (op, oi) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.innerHTML = '<span class="ok">(' + LET[oi] + ')</span><span>' + op + '</span>';
        btn.addEventListener('click', function () { pick(qi, oi, el, q); });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      list.appendChild(el);
    });

    function pick(qi, oi, el, q) {
      if (answered[qi] !== undefined) return;
      answered[qi] = oi;
      var btns = el.querySelectorAll('.opt');
      for (var i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
        if (i === q.answer) btns[i].classList.add('correct');
        else if (i === oi) btns[i].classList.add('wrong');
      }
      if (oi === q.answer) correctCount++;
      var exp = el.querySelector('.q-exp');
      exp.innerHTML = '<b>答案（' + LET[q.answer] + '）</b>　' + q.explain;
      exp.hidden = false;
      scoreNum.textContent = correctCount;
      scoreEl.hidden = false;
    }

    host.querySelector('[data-act="reveal"]').addEventListener('click', function () {
      var qs = list.querySelectorAll('.q');
      for (var i = 0; i < qs.length; i++) {
        if (answered[i] !== undefined) continue;
        answered[i] = -1;
        var q = items[i];
        var btns = qs[i].querySelectorAll('.opt');
        for (var j = 0; j < btns.length; j++) {
          btns[j].disabled = true;
          if (j === q.answer) btns[j].classList.add('correct');
        }
        var exp = qs[i].querySelector('.q-exp');
        exp.innerHTML = '<b>答案（' + LET[q.answer] + '）</b>　' + q.explain;
        exp.hidden = false;
      }
      scoreEl.hidden = false;
    });

    host.querySelector('[data-act="reset"]').addEventListener('click', function () {
      answered = {}; correctCount = 0;
      var qs = list.querySelectorAll('.q');
      for (var i = 0; i < qs.length; i++) {
        var btns = qs[i].querySelectorAll('.opt');
        for (var j = 0; j < btns.length; j++) {
          btns[j].disabled = false;
          btns[j].classList.remove('correct', 'wrong');
        }
        qs[i].querySelector('.q-exp').hidden = true;
      }
      scoreNum.textContent = '0';
      scoreEl.hidden = true;
      host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- 年表引擎 ---------- */
  /* 事件格式：{ y:數字(西元,負數為西元前), label:'顯示年份', era:'時代', c:['cn'], t:'標題', d:'說明', ch:章次 } */
  function renderTimeline(mountId, events, options) {
    var host = document.getElementById(mountId);
    if (!host) return;
    options = options || {};
    var fixedCountry = options.country || null;   // 分國年表：鎖定單一國家
    var showFilter = options.filter !== false;
    var showEra = options.groupByEra !== false;

    var data = events.slice().sort(function (a, b) { return a.y - b.y; });
    if (fixedCountry) {
      data = data.filter(function (e) { return e.c.indexOf(fixedCountry) >= 0; });
    }

    var state = { country: 'all', q: '' };

    var controls = '';
    if (showFilter) {
      controls = '<div class="tl-controls">'
        + '<button class="chip on" type="button" data-c="all">全部</button>'
        + '<button class="chip c-cn" type="button" data-c="cn">中國</button>'
        + '<button class="chip c-jp" type="button" data-c="jp">日本</button>'
        + '<button class="chip c-kr" type="button" data-c="kr">韓國</button>'
        + '<button class="chip c-vn" type="button" data-c="vn">越南</button>'
        + '<button class="chip c-ot" type="button" data-c="ot">東亞其他</button>'
        + '<input class="tl-search" type="search" placeholder="搜尋事件、人物、條約…" aria-label="搜尋年表">'
        + '<span class="tl-count"></span>'
        + '</div>';
    }
    host.innerHTML = controls + '<div class="tl-out"></div>';
    var out = host.querySelector('.tl-out');
    var countEl = host.querySelector('.tl-count');

    function draw() {
      var rows = data.filter(function (e) {
        if (state.country !== 'all' && e.c.indexOf(state.country) < 0) return false;
        if (state.q) {
          var hay = (e.label + ' ' + e.t + ' ' + (e.d || '') + ' ' + e.era).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
        }
        return true;
      });

      if (countEl) countEl.textContent = rows.length + ' 則';
      if (!rows.length) {
        out.innerHTML = '<p class="tl-empty">沒有符合條件的事件。</p>';
        return;
      }

      var html = '', lastEra = null;
      rows.forEach(function (e) {
        if (showEra && e.era !== lastEra) {
          html += '<div class="tl-era">' + esc(e.era) + '</div>';
          lastEra = e.era;
        }
        var flags = e.c.map(flagHTML).join('');
        html += '<div class="tl-item">'
          + '<div class="tl-year">' + esc(e.label) + '</div>'
          + '<div class="tl-body">'
          + '<p class="tl-title">' + e.t + '<span class="tl-flags">' + flags + '</span></p>'
          + (e.d ? '<p class="tl-desc">' + e.d + '</p>' : '')
          + '</div></div>';
      });
      out.innerHTML = html;
    }

    if (showFilter) {
      host.querySelectorAll('.chip').forEach(function (b) {
        b.addEventListener('click', function () {
          host.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          state.country = b.getAttribute('data-c');
          draw();
        });
      });
      var si = host.querySelector('.tl-search');
      si.addEventListener('input', function () { state.q = si.value.trim(); draw(); });
    }
    draw();
  }

  /* ---------- 匯出 ---------- */
  window.EAH = {
    nav: buildTopbar,
    quiz: renderQuiz,
    timeline: renderTimeline,
    flag: flagHTML,
    shuffle: shuffle,
    balance: balanceOptions
  };

  document.addEventListener('DOMContentLoaded', function () {
    var key = document.body.getAttribute('data-nav');
    if (key !== null) buildTopbar(key || '');
  });
})();
