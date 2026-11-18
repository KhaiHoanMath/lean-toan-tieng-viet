/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
/* Run the learner's document in the official Lean Web editor. Its infoview
   displays the actual kernel diagnostics in the embedded, independent origin. */
(() => {
  "use strict";
  const base = "https://live.lean-lang.org/";
  let opened;

  function clearSession(session) {
    if (!session) return;
    session.panel.remove();
    session.notice.textContent = "Bạn có thể sửa bài và kiểm tra lại.";
    opened = undefined;
  }

  function workspaceURL(editor, code) {
    const importsMathlib = /^\s*(?:public\s+)?import\s+[^\n]*(?:Mathlib|Batteries|Aesop)(?:\.|\s|$)/m.test(code);
    const project = importsMathlib ? "mathlib-stable" : (editor.dataset.leanProject || "lean-v4.33.1");
    return base + "#project=" + encodeURIComponent(project) + "&code=" + encodeURIComponent(code);
  }

  function openSession(editor) {
    const code = editor.querySelector("[data-lean-code]").value;
    const notice = editor.querySelector("[data-lean-result]");
    if (!code.trim()) {
      notice.textContent = "Ô soạn thảo còn trống. Hãy nhập một phát biểu hoặc chọn Làm lại để lấy đề ban đầu.";
      return;
    }
    clearSession(opened);
    const url = workspaceURL(editor, code);
    const panel = document.createElement("section");
    panel.className = "live-workspace";
    const bar = document.createElement("div");
    bar.className = "live-workspace-bar";
    const heading = document.createElement("h3");
    heading.textContent = "Cửa sổ Lean Web";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Đóng";
    close.addEventListener("click", () => {
      clearSession(opened);
      editor.querySelector("[data-lean-run]").focus();
    });
    bar.append(heading, close);
    const help = document.createElement("p");
    help.textContent = "Đặt con trỏ sau bước vừa viết để xem mục tiêu. Trên màn hình hẹp, bấm Text để chuyển sang bảng Lean rồi mở All Messages để đọc thông báo. Nếu còn sorry, chứng minh vẫn còn chỗ trống.";
    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Mở cùng đoạn mã trong thẻ mới ↗";
    const frame = document.createElement("iframe");
    frame.title = "Lean Web — mã của bạn và kết quả kiểm tra";
    frame.referrerPolicy = "no-referrer";
    frame.src = url;
    panel.append(bar, help, fallback, frame);
    notice.insertAdjacentElement("afterend", panel);
    opened = {panel, notice, editor, current:code};
    notice.textContent = "Đã mở bản mã hiện tại trong Lean Web. Kết quả do Lean hiển thị trong khung dưới.";
    heading.setAttribute("tabindex", "-1");
    heading.focus({preventScroll:true});
  }

  document.addEventListener("click", e => {
    const button = e.target.closest("[data-lean-run]");
    if (button) openSession(button.closest("[data-lean-editor]"));
  });

  function invalidate(e) {
    if (!opened || !opened.editor.contains(e.target)) return;
    const text = opened.editor.querySelector("[data-lean-code]").value;
    if (text !== opened.current) {
      opened.notice.textContent = "Bạn vừa sửa bản nháp bên trên. Bấm Kiểm tra với Lean để mở phiên bản mới.";
    }
  }
  document.addEventListener("input", invalidate);
  document.addEventListener("leanviet:reset", invalidate);
})();
