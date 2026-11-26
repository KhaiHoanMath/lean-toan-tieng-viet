/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
/* Run the learner's document in the official Lean Web editor. Its infoview
   displays the actual kernel diagnostics in the embedded, independent origin. */
(() => {
  "use strict";
  const submittedNotice = "Xem kết quả kiểm tra của bản mã vừa gửi trong khung Lean Web bên dưới.";
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
    close.setAttribute("aria-label", "Đóng khung kiểm tra và quay lại ô soạn thảo");
    close.addEventListener("click", () => {
      clearSession(opened);
      editor.querySelector("[data-lean-code]").focus();
    });
    bar.append(heading, close);
    const help = document.createElement("p");
    help.textContent = editor.hasAttribute("data-lean-computation")
      ? "Trong khung bên dưới, đặt con trỏ vào dòng #check hoặc #eval để đọc kiểu hoặc kết quả. Mở mục Tất cả thông báo (All Messages) để xem cả những dòng còn lại."
      : "Trong khung bên dưới, đặt con trỏ sau bước vừa viết rồi đọc điều cần chứng minh sau dấu ⊢. Mở mục Tất cả thông báo (All Messages) để xem lỗi và cảnh báo. Dòng “declaration uses `sorry`” cho biết chứng minh còn chỗ trống.";
    if (editor.querySelector("[data-lean-prelude]")) {
      help.textContent += " Phần bạn vừa viết nằm ở cuối tệp.";
    }
    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Mở cùng đoạn mã trong thẻ mới ↗";
    const draftHelp = document.createElement("p");
    draftHelp.textContent = "Để giữ bản nháp trên trang học, hãy viết ở ô của bài rồi bấm kiểm tra lại. Nếu sửa trong Lean Web, hãy chép phần vừa sửa về ô của bài.";
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
    panel.append(bar, help, links, frame, draftHelp);
    notice.insertAdjacentElement("afterend", panel);
    opened = {panel, notice, editor, current:code};
    notice.textContent = submittedNotice;
    heading.setAttribute("tabindex", "-1");
    heading.focus({preventScroll:true});
    panel.scrollIntoView({block:"start"});
  }

  document.addEventListener("click", e => {
    const button = e.target.closest("[data-lean-run]");
    if (button) openSession(button.closest("[data-lean-editor]"));
    const link = e.target.closest("[data-open-lean]");
    if (link) {
      const editor = link.closest("[data-lean-editor]");
      if (!editor.querySelector("[data-lean-code]").value.trim()) {
        e.preventDefault();
        openSession(editor);
        editor.querySelector("[data-lean-code]").focus();
      } else {
        updateLink(editor);
      }
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Enter" || !(e.ctrlKey || e.metaKey) || e.altKey ||
        e.shiftKey || e.isComposing || e.repeat) return;
    const area = e.target.closest("[data-lean-code]");
    const editor = area?.closest("[data-lean-editor]");
    if (!editor) return;
    e.preventDefault();
    openSession(editor);
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
