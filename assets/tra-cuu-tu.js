/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";
  const field = document.getElementById("vn-word-search");
  if (!field) return;
  const section = field.closest("section");
  const groups = [...section.querySelectorAll("[data-usage-group]")];
  const count = section.querySelector("[data-usage-count]");
  const fold = value => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  let previous = null;
  section.querySelector("[data-usage-controls]").hidden = false;
  field.addEventListener("input", () => {
    const words = fold(field.value.trim()).split(/\s+/).filter(Boolean);
    if (words.length && !previous) previous = new Set(groups.filter(group => group.open));
    let matches = 0;
    for (const group of groups) {
      let found = 0;
      for (const row of group.querySelectorAll("[data-usage-row]")) {
        row.hidden = !words.every(word => row.dataset.search.includes(word));
        if (!row.hidden) found += 1;
      }
      group.hidden = !found;
      if (words.length) group.open = !!found;
      else if (previous) group.open = previous.has(group);
      matches += found;
    }
    if (!words.length) previous = null;
    count.textContent = matches ? matches + " từ và cách viết" : "Chưa tìm thấy từ này. Hãy thử một từ ngắn hơn.";
  });
})();
