/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";
  const field = document.getElementById("vn-word-search");
  if (!field) return;
  const section = field.closest("section");
  const groups = [...section.querySelectorAll("[data-usage-group]")];
  const count = section.querySelector("[data-usage-count]");
  const fold = value => value.toLocaleLowerCase("vi").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/_/g, " ")
    .replace(/\b(?:ki|ky) hieu\b/g, "ky hieu").replace(/\bdinh li\b/g, "dinh ly");
  const terms = new Map([...section.querySelectorAll("[data-usage-row]")]
    .map(row => [row, fold(row.dataset.search)]));
  let previous = null;
  section.querySelector("[data-usage-controls]").hidden = false;
  field.addEventListener("input", () => {
    const words = fold(field.value.trim())
      .replace(/^(?:(?:lam sao|lam the nao|(?:co |dung )?lenh nao)(?: de)?|(?:em|toi|minh) muon)\s+/u, "")
      .replace(/[?!.]+$/u, "").split(/\s+/u).filter(Boolean);
    if (words.length && !previous) previous = new Set(groups.filter(group => group.open));
    let matches = 0;
    for (const group of groups) {
      let found = 0;
      for (const row of group.querySelectorAll("[data-usage-row]")) {
        row.hidden = !words.every(word => terms.get(row).includes(word));
        if (!row.hidden) found += 1;
      }
      group.hidden = !found;
      if (words.length) group.open = !!found;
      else if (previous) group.open = previous.has(group);
      matches += found;
    }
    if (!words.length) previous = null;
    count.textContent = matches ? matches + " mục phù hợp" :
      "Chưa tìm thấy mục phù hợp. Thử một cụm ngắn như “dùng giả thiết” hoặc “viết lại”.";
  });
})();
