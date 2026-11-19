/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
/* Run the learner's document in the official Lean Web editor. Its infoview
   displays the actual kernel diagnostics in the embedded, independent origin. */
(() => {
  "use strict";
  const submittedNotice = "Đoạn mã trong ô soạn thảo đã được mở bằng Lean Web. Xem kết quả kiểm tra trong khung bên dưới.";
  let opened;

  function clearSession(session) {
    if (!session) return;
    session.panel.remove();
    session.notice.textContent = "Bạn có thể sửa bài và kiểm tra lại.";
    opened = undefined;
  }

  function updateLink(editor) {
    const link = editor.querySelector("[data-open-lean]");
    const visible = editor.querySelector("[data-lean-code]").value;
    const prefix = editor.querySelector("[data-lean-prelude]")?.textContent;
    const code = prefix && visible.trim() ? prefix + "\n\n" + visible : visible;
    const importsMathlib = /^\s*(?:public\s+)?import\s+[^\n]*(?:Mathlib|Batteries|Aesop)(?:\.|\s|$)/m.test(code);
    const project = importsMathlib ? "mathlib-stable" : (editor.dataset.leanProject || "lean-v4.33.1");
    const url = link.dataset.base + "#project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code);
    link.setAttribute("href", url);
    return url;
  }

  function openSession(editor) {
    const code = editor.querySelector("[data-lean-code]").value;
    const notice = editor.querySelector("[data-lean-result]");
    if (!code.trim()) {
      if (opened && opened.editor === editor) clearSession(opened);
      notice.textContent = "Ô soạn thảo còn trống. Hãy nhập mã Lean hoặc chọn “Làm lại” để khôi phục đề ban đầu.";
      return;
    }
    clearSession(opened);
    const url = updateLink(editor);
    const panel = document.createElement("section");
    panel.className = "live-workspace";
    const bar = document.createElement("div");
    bar.className = "live-workspace-bar";
    const heading = document.createElement("h3");
    heading.textContent = "Kiểm tra bài trên Lean Web";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Đóng";
    close.addEventListener("click", () => {
      clearSession(opened);
      editor.querySelector("[data-lean-run]").focus();
    });
    bar.append(heading, close);
    const help = document.createElement("p");
    help.textContent = "Đặt con trỏ sau bước vừa viết để xem còn điều gì phải chứng minh. Chọn “All Messages” để đọc mọi thông báo của Lean. Cảnh báo “declaration uses `sorry`” báo rằng chứng minh còn chỗ bỏ trống.";
    if (editor.querySelector("[data-lean-prelude]")) {
      help.textContent += " Bài của bạn nằm ở cuối tệp. Thay chua_chung_minh bằng lời giải rồi xem Lean còn yêu cầu chứng minh điều gì.";
    }
    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Mở cùng đoạn mã trong thẻ mới ↗";
    const frame = document.createElement("iframe");
    frame.title = "Lean Web — mã của bạn và kết quả kiểm tra";
    frame.referrerPolicy = "no-referrer";
    frame.src = url;
    const guide = document.createElement("a");
    guide.href = "huong-dan.html#doc-loi";
    guide.target = "_blank";
    guide.rel = "noopener noreferrer";
    guide.textContent = "Đọc thông báo của Lean bằng tiếng Việt (thẻ mới)";
    const links = document.createElement("div");
    links.className = "inline-links";
    links.append(fallback, guide);
    panel.append(bar, help, links, frame);
    notice.insertAdjacentElement("afterend", panel);
    opened = {panel, notice, editor, current:code};
    notice.textContent = submittedNotice;
    heading.setAttribute("tabindex", "-1");
    heading.focus({preventScroll:true});
  }

  document.addEventListener("click", e => {
    const button = e.target.closest("[data-lean-run]");
    if (button) openSession(button.closest("[data-lean-editor]"));
    const link = e.target.closest("[data-open-lean]");
    if (link) {
      const editor = link.closest("[data-lean-editor]");
      if (editor.querySelector("[data-lean-prelude]") && !editor.querySelector("[data-lean-code]").value.trim()) {
        e.preventDefault();
        openSession(editor);
        editor.querySelector("[data-lean-code]").focus();
      } else {
        updateLink(editor);
      }
    }
  });

  function invalidate(e) {
    const editor = e.target.closest("[data-lean-editor]");
    if (!editor) return;
    updateLink(editor);
    if (!opened || opened.editor !== editor) return;
    const text = editor.querySelector("[data-lean-code]").value;
    opened.notice.textContent = text === opened.current
      ? submittedNotice
      : "Khung Lean Web đang hiện bản trước khi sửa. Chọn “Kiểm tra với Lean” để kiểm tra bản mới.";
  }
  for (const editor of document.querySelectorAll("[data-lean-editor]")) updateLink(editor);
  document.addEventListener("input", invalidate);
  document.addEventListener("leanviet:reset", invalidate);
})();
