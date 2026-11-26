/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";

  for (const grid of document.querySelectorAll("[data-cantor-grid]")) {
    const cells = [...grid.querySelectorAll("input[type=checkbox]")];
    const diagonal = cells.filter(cell => cell.dataset.row === cell.dataset.column);
    const result = grid.querySelector("[data-cantor-result]");
    function readDiagonal() {
      const members = diagonal.filter(cell => !cell.checked).map(cell => cell.dataset.row);
      const set = members.length ? "{" + members.join(", ") + "}" : "∅";
      result.textContent = "B = " + set + ". Với mỗi hàng i, số i thuộc đúng một trong hai tập B và tập ở hàng đó.";
    }
    cells.forEach(cell => { cell.disabled = false; });
    grid.querySelector("[data-cantor-prompt]").hidden = false;
    grid.addEventListener("change", readDiagonal);
    readDiagonal();
  }

  function phanSo(tu, mau) {
    let a = tu, b = mau;
    while (b) [a, b] = [b, a % b];
    const mauGon = mau / a;
    return mauGon === 1 ? String(tu / a) : (tu / a) + "/" + mauGon;
  }

  function doiMayBao(banThu, form) {
    const bang = banThu.querySelector("[data-lab-table]");
    const ketQua = banThu.querySelector("[data-lab-summary]");
    function demLai() {
      const may = form.elements.namedItem("may").value;
      let tong = 0;
      let haiMatSau = 0;
      for (const hang of bang.tBodies[0].rows) {
        const matDo = hang.sectionRowIndex + 1;
        for (const o of hang.querySelectorAll("td")) {
          const matXanh = o.cellIndex;
          let soCach = Number(matDo === 6 || matXanh === 6);
          if (may === "do") soCach = Number(matDo === 6);
          if (may === "chon") soCach = Number(matDo === 6) + Number(matXanh === 6);
          o.textContent = String(soCach);
          o.dataset.count = String(soCach);
          tong += soCach;
          if (matDo === 6 && matXanh === 6) haiMatSau = soCach;
        }
      }
      ketQua.textContent = "Trong " + tong + " kết quả đồng khả năng làm đèn báo sáng, có " +
        haiMatSau + " kết quả mà cả hai xúc xắc đều ra mặt 6. Vậy xác suất có điều kiện là " + phanSo(haiMatSau, tong) + ".";
    }
    form.addEventListener("change", demLai);
    demLai();
  }

  function thuocBonVach(banThu, form) {
    const cotCap = [...banThu.querySelectorAll("[data-ruler-pairs]")];
    function doLai() {
      const a = Number(form.elements.namedItem("vach-a").value);
      const b = Number(form.elements.namedItem("vach-b").value);
      const vach = [...new Set([0, a, b, 6])].sort((x, y) => x - y);
      const capTheoDoDai = Array.from({length: 7}, () => []);
      for (let i = 0; i < vach.length; i++) {
        for (const cuoi of vach.slice(i + 1)) {
          capTheoDoDai[cuoi - vach[i]].push(vach[i] + "–" + cuoi);
        }
      }
      const thieu = [];
      cotCap.forEach((o, i) => {
        const cap = capTheoDoDai[i + 1];
        o.textContent = cap.length ? cap.join(", ") : "Chưa đo được";
        if (!cap.length) thieu.push(i + 1);
      });
      for (const dau of banThu.querySelectorAll("[data-ruler-mark]")) {
        dau.setAttribute("visibility", vach.includes(Number(dau.dataset.rulerMark)) ? "visible" : "hidden");
      }
      banThu.querySelector("[data-ruler-desc]").textContent = "Các vạch đặt tại " + vach.join(", ") + " cm.";
      const ketQua = thieu.length
        ? "Đo được " + (6 - thieu.length) + " trong 6 độ dài cần đo. Còn thiếu " + thieu.join(", ") + " cm."
        : "Đo đủ cả sáu độ dài, mỗi độ dài ứng với đúng một cặp vạch.";
      banThu.querySelector("[data-lab-summary]").textContent =
        (a === b ? "Hai vạch bên trong đang trùng nhau. " : "") + ketQua;
    }
    form.addEventListener("change", doLai);
    doLai();
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
      "Với n = " + n + ", có " + than.children.length + " cách chọn hai mẫu số x, y thỏa mãn x ≤ y.";
  }

  function bangDauNamDoi(banThu, form) {
    const cacTran = [...form.querySelectorAll("[data-match]")];
    const cacO = [...banThu.querySelectorAll("[data-team-score]")];
    const cacDoi = cacO.map(o => o.dataset.teamScore);
    const ketQua = banThu.querySelector("[data-lab-summary]");
    // Mỗi cặp chỉ có một trận. Lúc đầu đội đứng trước trong bảng chữ cái thắng.
    const doiThang = new Map(cacTran.map(nut => [nut.dataset.match, nut.dataset.match[0]]));
    function capNhatBang() {
      const daThang = new Map(cacDoi.map(doi => [doi, new Set()]));
      for (const nut of cacTran) {
        const cap = nut.dataset.match;
        const thang = doiThang.get(cap);
        const thua = thang === cap[0] ? cap[1] : cap[0];
        daThang.get(thang).add(thua);
        nut.textContent = thang + " thắng " + thua;
      }
      for (const o of cacO) o.textContent = String(daThang.get(o.dataset.teamScore).size);
      const boBa = [];
      for (let i = 0; i < cacDoi.length; i++) {
        for (let j = i + 1; j < cacDoi.length; j++) {
          for (let k = j + 1; k < cacDoi.length; k++) {
            const [a, b, c] = [cacDoi[i], cacDoi[j], cacDoi[k]];
            // Theo vòng a, b, c, cả ba trận cùng chiều hoặc cả ba cùng ngược chiều.
            const ab = daThang.get(a).has(b), bc = daThang.get(b).has(c), ca = daThang.get(c).has(a);
            if (ab === bc && bc === ca) {
              const vong = ab ? [a, b, c, a] : [a, c, b, a];
              boBa.push(vong.join(" → "));
            }
          }
        }
      }
      ketQua.textContent = boBa.length
        ? "Có " + boBa.length + " bộ ba thắng vòng. Mũi tên đi từ đội thắng đến đội thua. " + boBa.join(" · ") + "."
        : "Chưa có bộ ba thắng vòng.";
    }
    for (const nut of cacTran) {
      nut.addEventListener("click", () => {
        const cap = nut.dataset.match;
        doiThang.set(cap, doiThang.get(cap) === cap[0] ? cap[1] : cap[0]);
        capNhatBang();
      });
    }
    form.addEventListener("reset", () => {
      for (const cap of doiThang.keys()) doiThang.set(cap, cap[0]);
      capNhatBang();
    });
    capNhatBang();
  }

  function haiLuot(banThu, nn, ns, sn, ss) {
    const tong = nn + ns + sn + ss, giu = ns + sn;
    const ketQua = banThu.querySelector("[data-lab-summary]");
    const tungLuot = banThu.querySelector("[data-lab-margins]");
    if (tong === 0) {
      ketQua.textContent = "Túi đang rỗng. Hãy thêm ít nhất một phiếu để có thể tính xác suất.";
      tungLuot.textContent = "";
      return;
    }
    const benNguoiDau = giu === 0
      ? "Không có phiếu nào ghi hai kết quả khác nhau. Xác suất với điều kiện giữ được phiếu không xác định."
      : "Trong số phiếu giữ lại, xác suất chọn bên nhận “ngửa rồi sấp” là " + phanSo(ns, giu) +
        ", còn xác suất chọn bên nhận “sấp rồi ngửa” là " + phanSo(sn, giu) + ".";
    ketQua.textContent = "Túi có " + tong + " phiếu. Xác suất giữ được phiếu là " + phanSo(giu, tong) +
      ". " + benNguoiDau;
    tungLuot.textContent = "Xác suất ra mặt ngửa ở lượt đầu là " + phanSo(nn + ns, tong) +
      ", ở lượt sau là " + phanSo(nn + sn, tong) + ". Hai lượt " +
      (nn * ss === ns * sn ? "độc lập" : "phụ thuộc nhau") + " trong mô hình này.";
  }

  function chonThe(banThu, form) {
    const cacThe = Array.from(form.querySelectorAll(".card-choices input"));
    const the11 = cacThe.find(the => the.value === "11");
    function hienKetQua() {
      the11.disabled = !form.elements.namedItem("them-the").checked;
      the11.closest("label").hidden = the11.disabled;
      if (the11.disabled) the11.checked = false;
      const so = cacThe.filter(the => the.checked).map(the => Number(the.value));
      const cap = [];
      for (let i = 1; i < so.length; i++) {
        if (so[i] === so[i - 1] + 1) cap.push(so[i - 1] + " và " + so[i]);
      }
      const nhanXet = cap.length ? "Các cặp số liên tiếp đã chọn gồm " + cap.join(", ") + "."
        : "Chưa có hai số liên tiếp.";
      banThu.querySelector("[data-lab-summary]").textContent = so.length
        ? "Đã chọn " + so.length + " thẻ. " + nhanXet : "Chưa chọn thẻ nào.";
    }
    form.addEventListener("change", hienKetQua);
    form.addEventListener("reset", () => requestAnimationFrame(hienKetQua));
    hienKetQua();
  }

  function soHaiVong(banThu, form) {
    const bang = banThu.querySelector("[data-lab-table]");
    const ketQua = banThu.querySelector("[data-lab-summary]");
    function hienBang() {
      const a = form.elements.namedItem("thu-nhat").selectedOptions[0];
      const b = form.elements.namedItem("thu-hai").selectedOptions[0];
      bang.hidden = a.value === b.value;
      if (bang.hidden) {
        ketQua.textContent = "Hãy chọn hai vòng khác nhau để so sánh.";
        return;
      }
      const hang = a.dataset.values.split(" ").map(Number), cot = b.dataset.values.split(" ").map(Number);
      bang.caption.textContent = "Vòng " + a.value + " (hàng) so với vòng " + b.value + " (cột)";
      const tieuDe = bang.tHead.rows[0];
      tieuDe.cells[0].textContent = a.value + " / " + b.value;
      cot.forEach((giaTri, j) => tieuDe.cells[j + 1].textContent = String(giaTri));
      let thang = 0;
      for (const [i, x] of hang.entries()) {
        const dong = bang.tBodies[0].rows[i];
        dong.cells[0].textContent = String(x);
        for (const [j, y] of cot.entries()) {
          const o = dong.cells[j + 1];
          o.textContent = x > y ? "Thắng" : "Thua";
          o.classList.toggle("spinner-win", x > y);
          if (x > y) thang++;
        }
      }
      ketQua.textContent = "Vòng " + a.value + " thắng vòng " + b.value + " trong " + thang +
        " trên 9 kết quả đồng khả năng. Xác suất thắng là " + phanSo(thang, 9) + ".";
    }
    form.addEventListener("change", hienBang);
    hienBang();
  }

  for (const banThu of document.querySelectorAll("[data-thu-suc-lab]")) {
    const form = banThu.querySelector("[data-lab-controls]");
    form.hidden = false;
    if (banThu.dataset.thuSucLab === "thang-vong") {
      bangDauNamDoi(banThu, form);
      continue;
    }
    if (banThu.dataset.thuSucLab === "bao-mat-sau") {
      doiMayBao(banThu, form);
      continue;
    }
    if (banThu.dataset.thuSucLab === "thuoc") {
      thuocBonVach(banThu, form);
      continue;
    }
    if (banThu.dataset.thuSucLab === "the-so") {
      chonThe(banThu, form);
      continue;
    }
    if (banThu.dataset.thuSucLab === "vong-quay") {
      soHaiVong(banThu, form);
      continue;
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const giaTri = ten => form.elements.namedItem(ten).valueAsNumber;
      if (banThu.dataset.thuSucLab === "phan-so") cacMauSo(banThu, giaTri("mau"));
      else if (banThu.dataset.thuSucLab === "ba-cua") {
        const lan = giaTri("lan"), giu = 10 + lan;
        banThu.querySelector("[data-o-cua]").textContent = String(lan);
        banThu.querySelector("[data-lab-summary]").textContent =
          "Trong " + giu + " ván mà người dẫn mở cửa 3, có 10 ván thắng nếu đổi cửa. Xác suất có điều kiện là " +
          phanSo(10, giu) + ". Tính trên cả 30 ván, luôn đổi cửa thì thắng 20 ván.";
      } else haiLuot(banThu, giaTri("nn"), giaTri("ns"), giaTri("sn"), giaTri("ss"));
    });
  }
})();
