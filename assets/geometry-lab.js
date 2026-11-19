/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu mọi quyền. */
(() => {
  "use strict";

  const origin = { x: 112, y: 30 };
  const b = { x: 40, y: 126 };
  const c = { x: 292, y: 126 };
  const decimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

  function point(end, tenths) {
    return {
      x: origin.x + (end.x - origin.x) * tenths / 10,
      y: origin.y + (end.y - origin.y) * tenths / 10,
    };
  }

  function ratio(n) {
    const divisor = n === 5 ? 5 : n % 2 === 0 ? 2 : 1;
    return (n / divisor) + "/" + (10 / divisor);
  }

  function initialise(root) {
    const controls = root.querySelector("[data-thales-controls]");
    const modes = Array.from(root.querySelectorAll('[name="thales-mode"]'));
    const ds = root.querySelector('[data-ratio="d"]');
    const es = root.querySelector('[data-ratio="e"]');
    const segment = root.querySelector("[data-de]");

    function move(key, position) {
      const mark = root.querySelector('[data-point="' + key + '"]');
      const label = root.querySelector('[data-point-label="' + key + '"]');
      mark.setAttribute("cx", position.x);
      mark.setAttribute("cy", position.y);
      label.setAttribute("x", position.x + (key === "d" ? -16 : 6));
      label.setAttribute("y", position.y + (key === "d" ? -3 : -4));
      const suffix = key === "d" ? "1" : "2";
      segment.setAttribute("x" + suffix, position.x);
      segment.setAttribute("y" + suffix, position.y);
    }

    function draw() {
      const together = modes[0].checked;
      es.disabled = together;
      if (together) es.value = ds.value;
      const d = Number(ds.value);
      const e = Number(es.value);
      const rd = ratio(d);
      const re = ratio(e);
      ds.setAttribute("aria-valuetext", "AD bằng " + d + " phần mười độ dài AB");
      es.setAttribute("aria-valuetext", "AE bằng " + e + " phần mười độ dài AC");
      move("d", point(b, d));
      move("e", point(c, e));
      root.querySelector('[data-length="d"]').textContent = "AD = " + decimal.format(d) + " cm";
      root.querySelector('[data-length="e"]').textContent = "AE = " + decimal.format(17 * e / 10) + " cm";
      root.querySelector('[data-value="d"]').textContent = "AD/AB = " + rd;
      root.querySelector('[data-value="e"]').textContent = "AE/AC = " + re;
      const message = d === e
        ? "AD/AB = AE/AC = " + rd + ". DE song song với BC."
        : "AD/AB = " + rd + ", AE/AC = " + re + ". Hai tỉ số khác nhau nên DE không song song với BC.";
      root.querySelector("[data-thales-status]").textContent = message;
      root.querySelector("desc").textContent = message;
    }

    controls.addEventListener("input", draw);
    controls.addEventListener("change", draw);
    for (const button of controls.querySelectorAll("[data-thales-case]")) {
      button.addEventListener("click", () => {
        const midpoints = button.dataset.thalesCase === "midpoints";
        for (const mode of modes) mode.checked = mode.value === (midpoints ? "together" : "free");
        ds.value = midpoints ? "5" : "4";
        es.value = midpoints ? "5" : "6";
        draw();
      });
    }
    draw();
    controls.disabled = false;
  }

  for (const root of document.querySelectorAll("[data-thales-workshop]")) initialise(root);
})();
