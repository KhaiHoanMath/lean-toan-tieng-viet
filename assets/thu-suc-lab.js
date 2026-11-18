/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";

  function phanSo(tu, mau) {
    let a = tu, b = mau;
    while (b) [a, b] = [b, a % b];
    const mauGon = mau / a;
    return mauGon === 1 ? String(tu / a) : (tu / a) + "/" + mauGon;
  }

  function cacMauSo(banThu, n) {
    const bang = banThu.querySelector("[data-lab-table]");
    const than = document.createElement("tbody");
    for (let u = 1; u <= n; u++) {
      if (n * n % u !== 0) continue;
      const v = n * n / u;
      const hang = document.createElement("tr");
      for (const so of [u, v, n + u, n + v]) {
        const o = document.createElement("td");
        o.textContent = String(so);
        hang.append(o);
      }
      than.append(hang);
    }
    bang.querySelector("tbody").replaceWith(than);
    bang.querySelector("caption").textContent = "Các cặp thừa số của " + n * n + " và hai mẫu số tương ứng";
    banThu.querySelector("[data-lab-summary]").textContent =
      "Với n = " + n + ", có " + than.children.length + " cách tách khi x ≤ y.";
  }

  function haiLuot(banThu, nn, ns, sn, ss) {
    const tong = nn + ns + sn + ss, giu = ns + sn;
    const ketQua = banThu.querySelector("[data-lab-summary]");
    const tungLuot = banThu.querySelector("[data-lab-margins]");
    if (tong === 0) {
      ketQua.textContent = "Túi đang rỗng. Hãy cho ít nhất một phiếu vào túi để tính xác suất.";
      tungLuot.textContent = "";
      return;
    }
    const benNguoiDau = giu === 0
      ? "Cả hai loại phiếu có hai mặt khác nhau đều vắng mặt. Không thể tính xác suất có điều kiện khi ấy."
      : "Trong số phiếu giữ lại, bên nhận ngửa–sấp có xác suất " + phanSo(ns, giu) +
        ", bên nhận sấp–ngửa có xác suất " + phanSo(sn, giu) + ".";
    ketQua.textContent = "Túi có " + tong + " phiếu. Xác suất giữ được phiếu là " + phanSo(giu, tong) +
      ". " + benNguoiDau;
    tungLuot.textContent = "Xác suất ngửa ở lượt đầu bằng " + phanSo(nn + ns, tong) +
      ", ở lượt sau bằng " + phanSo(nn + sn, tong) + ". Hai lượt " +
      (nn * ss === ns * sn ? "độc lập" : "phụ thuộc nhau") + " trong mô hình này.";
  }

  for (const banThu of document.querySelectorAll("[data-thu-suc-lab]")) {
    const form = banThu.querySelector("[data-lab-controls]");
    form.hidden = false;
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const giaTri = ten => form.elements.namedItem(ten).valueAsNumber;
      if (banThu.dataset.thuSucLab === "phan-so") cacMauSo(banThu, giaTri("mau"));
      else haiLuot(banThu, giaTri("nn"), giaTri("ns"), giaTri("sn"), giaTri("ss"));
    });
  }
})();
