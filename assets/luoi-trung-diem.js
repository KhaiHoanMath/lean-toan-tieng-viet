/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  const lab = document.querySelector('[data-midpoint-lab]');
  if (!lab) return;

  const plot = lab.querySelector('.midpoint-plot');
  const count = lab.querySelector('[data-midpoint-count]');
  const feedback = lab.querySelector('[data-midpoint-feedback]');
  const guess = lab.querySelector('[data-midpoint-guess]');
  const find = lab.querySelector('[data-midpoint-find]');
  const reset = lab.querySelector('[data-midpoint-reset]');
  const segment = lab.querySelector('[data-midpoint-segment]');
  const between = lab.querySelector('[data-midpoint-between]');
  const points = [...plot.querySelectorAll('.midpoint-point')].map(button => ({
    x: Number(button.dataset.x),
    y: Number(button.dataset.y),
    button,
    marker: button.querySelector('span')
  }));
  const selected = new Set();
  const number = new Intl.NumberFormat('vi');
  let choosingPair = false;
  let firstEnd = null;
  let markedPair = [];

  function coordinates({ x, y }) {
    return '(' + number.format(x) + '; ' + number.format(y) + ')';
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onGrid(p) {
    return Number.isInteger(p.x) && Number.isInteger(p.y);
  }

  function prepareFourCorners() {
    selected.clear();
    for (const p of points) {
      if (p.x < 2 && p.y < 2) selected.add(p);
    }
    choosingPair = false;
    firstEnd = null;
    markedPair = [];
  }

  function show(message) {
    const [a, b] = markedPair;
    const center = b ? midpoint(a, b) : null;
    segment.hidden = !b;
    between.hidden = !center || onGrid(center);
    if (center) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      segment.style.left = (12.5 + 25 * a.x) + '%';
      segment.style.bottom = (12.5 + 25 * a.y) + '%';
      segment.style.width = (25 * Math.hypot(dx, dy)) + '%';
      segment.style.transform = 'rotate(' + Math.atan2(-dy, dx) + 'rad)';
      between.style.left = (12.5 + 25 * center.x) + '%';
      between.style.bottom = (12.5 + 25 * center.y) + '%';
    }
    for (const p of points) {
      const marked = selected.has(p);
      const label = p === a || p === firstEnd ? 'A' : p === b ? 'B'
        : center && center.x === p.x && center.y === p.y ? 'M' : '';
      p.button.setAttribute('aria-pressed', String(marked));
      p.button.setAttribute('aria-label', (label ? 'Điểm ' + label + ' ' : 'Điểm ') + coordinates(p));
      p.button.dataset.mark = label;
      p.marker.textContent = label || (marked ? '✓' : '');
    }
    count.textContent = 'Đã chọn ' + selected.size + ' điểm (tối đa 5).';
    guess.disabled = selected.size < 2;
    find.disabled = selected.size < 2;
    guess.setAttribute('aria-pressed', String(choosingPair));
    guess.textContent = choosingPair ? 'Trở lại chọn điểm' : 'Thử cặp em chọn';
    feedback.textContent = message;
  }

  function describePair(a, b) {
    const m = midpoint(a, b);
    const result = onGrid(m)
      ? 'Cả hai tổng tọa độ đều chẵn, nên M nằm trên lưới.'
      : 'Ít nhất một tổng tọa độ là số lẻ, nên M nằm giữa các điểm lưới.';
    return 'Đoạn nối A' + coordinates(a) + ' và B' + coordinates(b) +
      ' có trung điểm M' + coordinates(m) + '. ' + result;
  }

  function choosePoint(p) {
    if (choosingPair) {
      if (!selected.has(p)) {
        show('Hãy chọn một trong các điểm đã đánh dấu để làm đầu mút.');
      } else if (p === firstEnd) {
        show('Hai đầu mút phải là hai điểm khác nhau. Hãy chọn điểm thứ hai.');
      } else if (!firstEnd) {
        firstEnd = p;
        show('Đầu mút A là ' + coordinates(p) + '. Hãy chọn đầu mút thứ hai.');
      } else {
        markedPair = [firstEnd, p];
        choosingPair = false;
        firstEnd = null;
        show(describePair(...markedPair));
      }
      return;
    }

    if (!selected.has(p) && selected.size === 5) {
      show('Đã đủ năm điểm. Muốn đổi một điểm, hãy bỏ chọn một trong năm điểm trước.');
      return;
    }
    markedPair = [];
    if (selected.has(p)) {
      selected.delete(p);
      show('Đã bỏ điểm ' + coordinates(p) + '. Còn ' + selected.size + ' điểm được chọn.');
    } else {
      selected.add(p);
      const next = selected.size === 1 ? 'Chọn thêm một điểm để có một cặp.' : 'Em dự đoán cặp nào?';
      show('Đã thêm điểm ' + coordinates(p) + '. Hiện có ' + selected.size + ' điểm. ' + next);
    }
  }

  function focusPoint(p) {
    for (const item of points) item.button.tabIndex = item === p ? 0 : -1;
    p.button.focus();
  }

  for (const p of points) {
    p.button.addEventListener('click', () => {
      focusPoint(p);
      choosePoint(p);
    });
    p.button.addEventListener('keydown', event => {
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      const target = points.find(q => q.x === p.x + direction[0] && q.y === p.y + direction[1]);
      if (target) focusPoint(target);
    });
  }

  guess.addEventListener('click', () => {
    choosingPair = !choosingPair;
    firstEnd = null;
    markedPair = [];
    if (choosingPair) {
      show('Chọn hai đầu mút trong các điểm đã đánh dấu. Trước khi chọn, thử nhẩm tọa độ trung điểm.');
      focusPoint(selected.values().next().value);
    } else {
      show('Có thể thêm hoặc bỏ một điểm trên lưới.');
    }
  });

  find.addEventListener('click', () => {
    choosingPair = false;
    firstEnd = null;
    markedPair = [];
    const chosen = [...selected];
    for (let i = 0; i < chosen.length; i++) {
      for (let j = i + 1; j < chosen.length; j++) {
        if (onGrid(midpoint(chosen[i], chosen[j]))) {
          markedPair = [chosen[i], chosen[j]];
          show(describePair(...markedPair));
          return;
        }
      }
    }
    show('Trong ' + (chosen.length * (chosen.length - 1) / 2) +
      ' cặp điểm đang xét, không có cặp nào có trung điểm nằm trên lưới.');
  });

  reset.addEventListener('click', () => {
    prepareFourCorners();
    show('Đã trở về bốn đỉnh của một ô vuông. Hãy thử cặp em chọn hoặc đánh dấu thêm điểm thứ năm.');
  });

  prepareFourCorners();
  show('Hãy thử tìm một cặp trước khi xem kết quả.');
  lab.querySelector('[data-midpoint-paper]').hidden = true;
  lab.querySelector('[data-midpoint-interaction]').hidden = false;
})();
