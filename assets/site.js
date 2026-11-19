/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  function normalize(value) {
    return String(value ?? "").toLocaleLowerCase("vi")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/_/g, " ").replace(/[∣|]/g, " chia het dvd ")
      .replace(/(\p{L})[-‐‑‒–—](?=\p{L})/gu, "$1 ")
      .replace(/\b(?:pythagoras|pythagore|py[ -]?ta[ -]?go|pi[ -]?ta[ -]?go)\b/g, "pythagore")
      .replace(/\b(?:ta[ -]?let|thales)\b/g, "thales")
      .replace(/\b(?:vi et|viete|vieta)\b/g, "viete")
      .replace(/\b(dinh|nguyen) ly\b/g, "$1 li")
      .replace(/\bty (le|so)\b/g, "ti $1")
      .replace(/\s+/g, " ").trim();
  }

  function searchWords(query) {
    return query.match(/\b(?:dinh li|nguyen li|ti so|ti le)\b|\S+/g) || [];
  }

  function initFormulaScrolling() {
    const formulas = $$(".inline-formula");
    if (!formulas.length || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => {
      for (const {target} of entries) {
        if (target.clientWidth && target.scrollWidth > target.clientWidth) {
          target.tabIndex = 0;
        } else {
          target.removeAttribute("tabindex");
        }
      }
    });
    formulas.forEach(formula => observer.observe(formula));
  }

  function initNav() {
    const menu = $(".menu-toggle");
    const nav = $("#primary-nav");
    if (!menu || !nav) return;
    const set = open => {
      nav.classList.toggle("open", open);
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Đóng trình đơn" : "Mở trình đơn");
    };
    menu.addEventListener("click", event => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      set(open);
      if (open && event.detail === 0) nav.querySelector("a")?.focus();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
        set(false);
        menu.focus();
      }
      if (event.key !== "/" || event.ctrlKey || event.altKey || event.metaKey ||
          event.target.closest?.("input,textarea,select,[contenteditable=true]")) return;
      event.preventDefault();
      const input = $("#tim-kiem") || $("#home-search");
      if (input) { input.focus(); input.select(); }
      else location.href = "thu-vien.html#tim-kiem";
    });
    if (location.hash === "#tim-kiem") $("#tim-kiem")?.focus();
  }

  function initGlossary(field) {
    const rows = $$("[data-glossary-row]").map(row => ({ row, terms: normalize(row.dataset.query) }));
    const scope = $("[data-glossary-scope]");
    const count = $("[data-glossary-count]");
    function filter() {
      const words = searchWords(normalize(field.value));
      let total = 0;
      for (const {row, terms} of rows) {
        const matchesScope = !scope?.value || row.dataset.scope === scope.value;
        row.hidden = !(matchesScope && words.every(word => terms.includes(word)));
        if (!row.hidden) total++;
      }
      count.textContent = total ? total + " mục từ" : "Chưa tìm thấy mục từ này. Hãy thử một ký hiệu hoặc một từ ngắn hơn.";
    }
    field.value = new URLSearchParams(location.search).get("tu") || "";
    field.addEventListener("input", filter);
    scope?.addEventListener("change", filter);
    filter();
  }

  function initCatalog(catalog) {
    const search = $("#tim-kiem", catalog);
    const grade = $("[data-grade-filter]", catalog);
    const strand = $("[data-strand-filter]", catalog);
    const lean = $("[data-lean-filter]", catalog);
    const results = $("[data-results]", catalog);
    const count = $("[data-count]", catalog);
    const empty = $("[data-empty]", catalog);
    const clears = $$("[data-clear-filters]", catalog);
    const entries = $$("[data-entry]", catalog).map((el, order) => ({
      el, order, text: normalize(el.dataset.terms), title: normalize(el.dataset.title),
      grade: el.dataset.grade, strand: el.dataset.strand, hasLean: el.dataset.lean === "1",
      extensions: $$("[data-deepening-name]", el).map(row => ({
        row, title: normalize($("a", row).textContent), topics: normalize(row.dataset.deepeningTopics),
        caption: $("[data-matched-name]", row), challenge: row.hasAttribute("data-challenge"),
        names: (row.dataset.deepeningAliases || row.dataset.deepeningName).split(" ")
          .map(name => ({ raw: name, normalized: normalize(name) })),
      })),
    }));

    function apply(updateURL) {
      const query = search.value.trim();
      const q = normalize(query);
      const tokens = searchWords(q);
      const challengeOnly = q === "thu suc" || q === "bai toan thu suc";
      const enrichmentOnly = q === "dao sau" || q === "nang cao";
      const declaration = /^[\p{L}][\p{L}\p{N}_'.]*[_.][\p{L}\p{N}_']+$/u.test(query);
      const gradeValue = grade?.value || "";
      const strandValue = strand.value;
      const leanOnly = lean.checked;
      const active = Boolean(q || gradeValue || strandValue || leanOnly);
      const matched = [];
      const rest = [];
      for (const entry of entries) {
        let extensionMatches = [];
        if (challengeOnly) {
          extensionMatches = entry.extensions.filter(extension => extension.challenge);
        } else if (q && !enrichmentOnly && !entry.title.includes(q)) {
          if (declaration) {
            const exactName = name => name.normalized === q || name.normalized.endsWith("." + q);
            extensionMatches = entry.extensions.filter(extension => extension.names.some(exactName));
            if (!extensionMatches.length) {
              extensionMatches = entry.extensions.filter(extension => extension.names.some(name => name.normalized.includes(q)));
            }
          } else {
            const exactTitle = entry.extensions.filter(extension => extension.title === q);
            extensionMatches = exactTitle.length ? exactTitle : entry.extensions.filter(extension =>
              tokens.every(token => extension.title.includes(token) || extension.topics.includes(token)));
          }
        }
        const visible = (!gradeValue || gradeValue === entry.grade) &&
          (!strandValue || strandValue === entry.strand) && (!leanOnly || entry.hasLean) &&
          (!challengeOnly || entry.el.hasAttribute("data-thu-suc")) &&
          (!enrichmentOnly || entry.extensions.length > 0) &&
          (extensionMatches.length > 0 || (declaration ? entry.text.includes(q) : tokens.every(token => entry.text.includes(token))));
        entry.el.hidden = !visible;
        if (!visible) { rest.push(entry); continue; }
        for (const extension of entry.extensions) {
          const selected = extensionMatches.includes(extension);
          extension.row.hidden = extensionMatches.length > 0 && !selected;
          extension.caption.hidden = !(declaration && selected);
          if (declaration && selected) {
            const found = extension.names.find(name => name.normalized === q || name.normalized.endsWith("." + q))
              || extension.names.find(name => name.normalized.includes(q));
            extension.caption.textContent = found ? found.raw : extension.row.dataset.deepeningName;
          }
        }
        const score = !q ? 0 : entry.title === q ? 4 : entry.title.startsWith(q) ? 3 :
          entry.title.includes(q) || extensionMatches.length ? 2 : tokens.every(token => entry.title.includes(token)) ? 1 : 0;
        matched.push({entry, score});
      }
      matched.sort((a,b) => b.score - a.score || a.entry.order - b.entry.order);
      const ordered = [...matched.map(row => row.entry), ...rest];
      const fragment = document.createDocumentFragment();
      ordered.forEach(({el}) => fragment.appendChild(el));
      results.appendChild(fragment);
      count.textContent = matched.length + " bài học" + (active ? " phù hợp" : "");
      empty.hidden = matched.length !== 0;
      clears[0].hidden = !active;

      if (updateURL) {
        const url = new URL(location.href);
        for (const [key,value] of [["q",search.value.trim()],["lop",gradeValue],["mach",strandValue],["lean",leanOnly ? "1" : ""]]) {
          if (value) url.searchParams.set(key,value);
          else url.searchParams.delete(key);
        }
        history.replaceState(null,"",url);
      }
    }
    function fromLocation() {
      const query = new URLSearchParams(location.search);
      search.value = query.get("q") || "";
      if (grade) grade.value = query.get("lop") || "";
      strand.value = query.get("mach") || "";
      lean.checked = query.get("lean") === "1";
      apply(false);
    }
    search.addEventListener("input", () => apply(true));
    grade?.addEventListener("change", () => apply(true));
    strand.addEventListener("change", () => apply(true));
    lean.addEventListener("change", () => apply(true));
    $("form", catalog).addEventListener("submit", event => { event.preventDefault(); apply(true); });
    clears.forEach(button => button.addEventListener("click", () => {
      search.value = ""; if (grade) grade.value = ""; strand.value = ""; lean.checked = false;
      apply(true); search.focus();
    }));
    window.addEventListener("popstate", fromLocation);
    fromLocation();
  }

  // Only completed input is persisted. Updating a template starts a new draft.
  function hashText(value) {
    let result = 2166136261;
    for (const c of value) result = Math.imul(result ^ c.codePointAt(0), 16777619);
    return (result >>> 0).toString(36);
  }
  function storeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function storeSet(key,value) {
    try {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key,value);
      return true;
    } catch { return false; }
  }

  function initBookmark() {
    const key = "lean-toan-viet:bookmark:v1";
    const button = $("[data-save-lesson]"), home = $("[data-resume]");
    if (!button && !home) return;
    const known = home ? new Set(home.dataset.knownLessons.split(" ")) : null;
    const targets = home ? JSON.parse(home.dataset.bookmarkTargets || "{}") : {};
    function read() {
      try {
        const saved = JSON.parse(storeGet(key));
        if (!saved || typeof saved.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(saved.id) ||
            typeof saved.title !== "string" || !Number.isInteger(saved.grade) || saved.grade < 6 || saved.grade > 12 ||
            (known && !known.has(saved.id))) return null;
        return saved;
      } catch { return null; }
    }
    function render() {
      const saved = read();
      if (button) {
        const selected = saved?.id === button.dataset.lessonId;
        button.setAttribute("aria-pressed",String(selected));
        $("span",button).textContent = selected ? "Bỏ đánh dấu" : "Đánh dấu để học tiếp";
      }
      if (home) {
        home.hidden = !saved;
        if (saved) {
          const dest = $("[data-resume-link]",home);
          dest.setAttribute("href", targets[saved.id] || "bai-"+saved.id+".html");
          dest.textContent = "Lớp "+saved.grade+" · "+saved.title;
        }
      }
    }
    if (button) button.addEventListener("click",() => {
      const current = read(), data = button.dataset;
      const removing = current?.id === data.lessonId;
      const changed = storeSet(key,removing ? null : JSON.stringify({id:data.lessonId,title:data.lessonTitle,grade:Number(data.lessonGrade)}));
      const status = $("[data-bookmark-status]");
      status.textContent = !changed ? "Trình duyệt chưa cho phép lưu chỗ học." : removing ? "Đã bỏ đánh dấu." : "Đã lưu trên trình duyệt này. Bạn có thể học tiếp từ trang chủ.";
      render();
    });
    if (home) $("[data-clear-bookmark]",home).addEventListener("click",() => {
      const status = $("[data-resume-status]");
      if (storeSet(key,null)) {
        render(); status.textContent = "Đã bỏ đánh dấu.";
        $(".home-hero .button")?.focus();
      } else { status.textContent = "Trình duyệt chưa cho phép thay đổi chỗ đã lưu."; }
    });
    window.addEventListener("storage",event => { if (event.key === key || event.key === null) render(); });
    window.addEventListener("pageshow",render);
    render();
  }

  function showPreviousDrafts(editor, prefix, currentKey) {
    const previous = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key !== currentKey && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value !== null) previous.push(value);
        }
      }
    } catch { return; }
    if (!previous.length) return;

    const details = document.createElement("details");
    details.className = "reveal previous-drafts";
    const summary = document.createElement("summary");
    summary.textContent = "Đọc bản nháp từ phiên bản trước";
    details.append(summary);
    const explanation = document.createElement("p");
    explanation.textContent = "Bạn đã viết các dòng dưới đây trước khi đề được cập nhật. Hãy chọn và sao chép phần muốn dùng sang ô hiện tại.";
    details.append(explanation);
    for (const value of previous) {
      const source = document.createElement("pre");
      source.className = "code-block";
      source.tabIndex = 0;
      source.textContent = value || "(Bản nháp trống)";
      details.append(source);
    }
    editor.append(details);
    return true;
  }

  function initEditor(editor) {
    const area = $("[data-lean-code]",editor);
    const external = $("[data-open-lean]",editor);
    const draft = $("[data-draft-state]",editor);
    const reset = $("[data-reset-code]",editor);
    const copy = $("[data-copy-code]",editor);
    if (!area || !external) return;
    const original = area.defaultValue;
    const prefix = "lean-toan-viet:draft:" + editor.dataset.exerciseId + ":";
    const key = prefix + hashText(original);
    const hasOlderDraft = showPreviousDrafts(editor, prefix, key);
    const stored = storeGet(key);
    const reference = editor.closest("[data-standard-reference]");
    const summary = reference && $("summary", reference);
    let draftLabel;
    if (summary) {
      draftLabel = document.createElement("span");
      draftLabel.textContent = " · Có bản nháp của bạn";
      draftLabel.hidden = !hasOlderDraft && (stored === null || stored === original);
      summary.append(draftLabel);
    }
    let undoValue = null;
    $("[data-select-proof]",editor)?.addEventListener("click", () => {
      const blank = /^[ \t]*(chua_chung_minh|sorry)\b/m.exec(area.value);
      area.focus();
      if (blank) {
        const end = blank.index + blank[0].length;
        area.setSelectionRange(end - blank[1].length, end);
      }
    });
    const defaultReset = reset.innerHTML;
    if (stored !== null && stored !== original) {
      area.value = stored;
      draft.textContent = "Đã mở lại bản nháp trên máy này.";
    }
    function save() {
      const saved = storeSet(key,area.value === original ? null : area.value);
      if (draftLabel && saved) draftLabel.hidden = !hasOlderDraft && area.value === original;
      draft.textContent = saved ? (area.value === original ? "" : "Đã lưu nháp trên máy này.") : "Trình duyệt chưa cho phép lưu nháp.";
    }
    area.addEventListener("input", () => {
      if (undoValue !== null) { undoValue = null; reset.innerHTML = defaultReset; }
      save();
    });
    for (const button of $$("[data-insert-symbol]", editor)) {
      button.addEventListener("click", () => {
        const symbol = button.dataset.insertSymbol;
        const start = area.selectionStart, end = area.selectionEnd;
        area.focus({preventScroll:true});
        area.setRangeText(symbol, start, end, "end");
        area.dispatchEvent(new Event("input", {bubbles:true}));
      });
    }
    reset.addEventListener("click", () => {
      if (undoValue !== null) {
        area.value = undoValue; undoValue = null; reset.innerHTML = defaultReset;
      } else if (area.value !== original) {
        undoValue = area.value; area.value = original; reset.textContent = "Hoàn tác";
      }
      save();
      editor.dispatchEvent(new CustomEvent("leanviet:reset", {bubbles:true}));
      area.focus();
    });
    const copyLabel = copy.innerHTML;
    let copyFeedbackTimer;
    copy.addEventListener("click", async () => {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw Error("unavailable");
        await navigator.clipboard.writeText(area.value);
        copy.textContent = $("[data-lean-prelude]",editor) ? "Đã chép phần bài" : "Đã sao chép";
      } catch {
        area.focus(); area.select();
        copy.textContent = "Đã chọn mã";
        draft.textContent = "Dùng Ctrl+C hoặc ⌘C để sao chép đoạn đã chọn.";
      }
      window.clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = window.setTimeout(() => { copy.innerHTML = copyLabel; },1800);
    });
  }

  function initPractice(switcher) {
    const choice = $("[data-practice-choice]",switcher);
    const panels = $$("[data-practice-panel]",switcher);
    if (!choice || !panels.length) return;
    function selected(value) {
      return Array.from(choice.options).find(option => option.value === value);
    }
    function render(value, update) {
      const option = selected(value) || choice.options[0];
      if (option.dataset.href) {
        if (update) location.assign(option.dataset.href);
        else location.replace(option.dataset.href);
        return;
      }
      choice.value = option.value;
      panels.forEach(panel => { panel.hidden = panel.dataset.practicePanel !== option.value; });
      if (update) {
        const url = new URL(location.href);
        url.hash = ""; url.searchParams.set("bai",option.value);
        history.pushState(null,"",url);
      }
    }
    function restore() {
      const slug = new URLSearchParams(location.search).get("bai") || location.hash.slice(1);
      render(slug,false);
    }
    choice.addEventListener("change",() => render(choice.value,true));
    window.addEventListener("popstate",restore);
    restore();
  }

  function initBoard() {
    const board = $(".math-board");
    if (!board) return;
    const triples = [[3,4,5],[5,12,13],[8,15,17]];
    const change = $("[data-board-change]",board);
    let index = 0;
    change.addEventListener("click", () => {
      index = (index + 1) % triples.length;
      const [a,b,c] = triples[index];
      const scale = Math.min(210/b,157.5/a);
      const left = 118, bottom = 167, right = left+b*scale, top = bottom-a*scale;
      $("[data-board-triangle]",board).setAttribute("d","M"+left+" "+bottom+" L"+right+" "+bottom+" L"+left+" "+top+" Z");
      $("[data-board-bx]",board).setAttribute("cx",right);
      $("[data-board-cy]",board).setAttribute("cy",top);
      const vertical = $("[data-board-vertical]",board);
      const horizontal = $("[data-board-horizontal]",board);
      const hyp = $("[data-board-hyp]",board);
      vertical.textContent=a; vertical.setAttribute("y",(top+bottom)/2+5);
      horizontal.textContent=b; horizontal.setAttribute("x",(left+right)/2);
      hyp.textContent=c; hyp.setAttribute("x",(left+right)/2+12); hyp.setAttribute("y",(top+bottom)/2-11);
      $("[data-board-equation]",board).textContent=a+"² + "+b+"² = "+c+"²";
      $("#board-title",board).textContent="Tam giác vuông có cạnh dài "+a+", "+b+" và "+c;
      $("#board-desc",board).textContent="Hai cạnh góc vuông dài "+a+" và "+b+" đơn vị, cạnh huyền dài "+c+" đơn vị.";
    });
  }

  function initWorkshop() {
    const divisibility = $("[data-divisibility-lab]");
    const euclid = $("[data-euclid-lab]");
    const weights = $("[data-weights-lab]");
    function inputs(form, names, minValues) {
      return names.map((name,index) => {
        const field = form.querySelector('[name="' + name + '"]');
        const value = Number(field.value);
        return field.value.trim() && Number.isInteger(value) && value >= minValues[index] && value <= 10000 ? value : null;
      });
    }
    if (divisibility) divisibility.addEventListener("submit", event => {
      event.preventDefault();
      const [d,a,b] = inputs(divisibility, ["d","a","b"], [1,0,0]);
      const target = $("[data-lab-result]",divisibility);
      if ([d,a,b].includes(null)) { target.textContent="Nhập số tự nhiên trong giới hạn của mỗi ô. Số chia phải dương."; return; }
      const divides = n => n % d === 0 ? " chia hết cho " : " không chia hết cho ";
      target.textContent = a + divides(a) + d + ". " + b + divides(b) + d + ". Tổng " + a + " + " + b + " = " + (a+b) + divides(a+b) + d + ".";
    });
    if (euclid) euclid.addEventListener("submit", event => {
      event.preventDefault();
      let [x,y] = inputs(euclid, ["x","y"], [1,1]);
      const target = $("[data-lab-result]",euclid);
      if ([x,y].includes(null)) { target.textContent="Nhập hai số nguyên dương không vượt quá 10 000."; return; }
      if (y>x) [x,y]=[y,x];
      const list=document.createElement("ol");
      while (y!==0) {
        const q=Math.floor(x/y),r=x%y;
        const line=document.createElement("li"); line.textContent=x+" = "+q+" × "+y+" + "+r; list.append(line);
        [x,y]=[y,r];
      }
      const conclusion=document.createElement("p"); conclusion.textContent="Ước chung lớn nhất là "+x+".";
      target.replaceChildren(list,conclusion);
    });
    if (weights) {
      const input=$("input",weights), target=$("[data-lab-result]",weights);
      const fmt=new Intl.NumberFormat("vi-VN",{maximumFractionDigits:1});
      input.addEventListener("input",() => {
        const t=Number(input.value),rateA=20+.7*t,rateB=10+.7*t;
        target.textContent="Với "+t+"% bài dễ, tỉ lệ phối hợp là "+fmt.format(rateA)+"% ở nhóm A và "+fmt.format(rateB)+"% ở nhóm B. Nhóm A cao hơn 10 điểm phần trăm.";
      });
    }
  }

  initNav();
  initFormulaScrolling();
  initBookmark();
  const glossary = $("#glossary-search");
  if (glossary) initGlossary(glossary);
  initWorkshop();
  $$("[data-catalog]").forEach(initCatalog);
  $$("[data-lean-editor]").forEach(initEditor);
  $$("[data-practice-switch]").forEach(initPractice);
  initBoard();
})();
