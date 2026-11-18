/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  'use strict';

  const ratioFormat = new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 2});

  function numbers(input, label) {
    const tokens = input.trim().split(/[;\s]+/u).filter(Boolean);
    if (!tokens.length) throw new Error('Hãy nhập ' + label + '.');
    return tokens.map((token, index) => {
      if (token.length > 100 || !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/u.test(token)) {
        throw new Error('Kiểm tra số thứ ' + (index + 1) + ' trong ' + label +
          '. Nhập một số nguyên hoặc số thập phân và dùng khoảng trắng hay dấu chấm phẩy để ngăn các số.');
      }
      const [whole, fraction = ''] = token.replace(',', '.').replace(/^[+-]/u, '').split('.');
      const units = BigInt((whole || '0') + fraction) * (token.startsWith('-') ? -1n : 1n);
      return {units, places: fraction.length, label: token.replace('.', ',')};
    });
  }

  function calculate(sampleInput, edgesInput) {
    const sample = numbers(sampleInput, 'dữ liệu quan sát');
    const edges = numbers(edgesInput, 'các mốc chia lớp');
    if (edges.length < 2) throw new Error('Cần ít nhất hai mốc để tạo một lớp.');
    // A common decimal scale keeps comparisons at bin boundaries exact.
    const places = [...sample, ...edges].reduce((max, x) => Math.max(max, x.places), 0);
    const unit = 10n ** BigInt(places);
    const scaled = x => x.units * 10n ** BigInt(places - x.places);
    const bounds = edges.map(scaled);
    const groups = [];
    for (let i = 1; i < bounds.length; i++) {
      if (bounds[i] <= bounds[i - 1]) {
        throw new Error('Mốc thứ ' + (i + 1) + ' phải lớn hơn mốc đứng trước. Hãy kiểm tra thứ tự và các mốc trùng nhau.');
      }
      const width = bounds[i] - bounds[i - 1];
      const label = '[' + edges[i - 1].label + '; ' + edges[i].label + (i === bounds.length - 1 ? ']' : ')');
      groups.push({label, start: edges[i - 1].label, width: Number(width) / Number(unit), count: 0});
    }
    let below = 0;
    let above = 0;
    const last = bounds.length - 1;
    for (const entry of sample) {
      const value = scaled(entry);
      if (value < bounds[0]) below++;
      else if (value > bounds[last]) above++;
      else {
        let left = 0;
        let right = last;
        while (right - left > 1) {
          const middle = Math.floor((left + right) / 2);
          if (value < bounds[middle]) right = middle;
          else left = middle;
        }
        groups[left].count++;
      }
    }
    const equalWidths = bounds.slice(1).every((bound, i) => bound - bounds[i] === bounds[1] - bounds[0]);
    return {groups, below, above, equalWidths, total: sample.length, first: edges[0].label, last: edges[last].label};
  }

  function svgNode(tag, attributes, text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function axisNumber(value) {
    if (value !== 0 && (value < 0.01 || value >= 100000)) {
      return value.toExponential(1).replace('.', ',');
    }
    return ratioFormat.format(value);
  }

  function histogram(data) {
    const left = 57, right = 453, top = 34, bottom = 185;
    const heightLabel = data.equalWidths ? 'Tần số tương đối (%)' : 'Mật độ (% trên một đơn vị)';
    const svg = svgNode('svg', {viewBox: '0 0 480 220', role: 'img', 'aria-label':
      'Biểu đồ các lớp liên tiếp. Trục đứng: ' + heightLabel + '. Số liệu chi tiết nằm trong bảng.'});
    svg.append(svgNode('title', {}, 'Biểu đồ tần số tương đối ghép nhóm'));
    const heights = data.groups.map(g => (100 * g.count / data.total) / (data.equalWidths ? 1 : g.width));
    const max = heights.reduce((a, b) => Math.max(a, b), 0);
    const span = data.groups.reduce((sum, g) => sum + g.width, 0);
    const text = (x, y, value, anchor = 'start') => svgNode('text',
      {x, y, 'text-anchor': anchor, fill: '#294436', 'font-size': 13}, value);
    svg.append(text(5, 18, heightLabel));
    for (let i = 0; i <= 2; i++) {
      const y = bottom - (bottom - top) * i / 2;
      svg.append(svgNode('line', {x1: left, x2: right, y1: y, y2: y, stroke: '#d4e0d7'}));
      svg.append(text(left - 5, y + 4, axisNumber(max * i / 2), 'end'));
    }
    let offset = 0;
    let lastLabel = left;
    data.groups.forEach((group, i) => {
      const x = left + offset / span * (right - left);
      offset += group.width;
      const next = i === data.groups.length - 1 ? right : left + offset / span * (right - left);
      const height = max ? heights[i] / max * (bottom - top) : 0;
      const rect = svgNode('rect', {x, y: bottom - height, width: Math.max(0, next - x), height,
        fill: i % 2 ? '#72aa8b' : '#367552', stroke: '#234c37', 'stroke-width': 0.7});
      rect.append(svgNode('title', {}, group.label + ' — ' + group.count + ' quan sát'));
      svg.append(rect, svgNode('line', {x1: x, x2: x, y1: bottom, y2: bottom + 4, stroke: '#294436'}));
      const labelRoom = Math.max(34, group.start.length * 8);
      if (i > 0 && x - lastLabel > labelRoom && right - x > labelRoom) {
        svg.append(text(x, 204, group.start, 'middle'));
        lastLabel = x;
      }
    });
    svg.append(svgNode('line', {x1: left, x2: right, y1: bottom, y2: bottom, stroke: '#294436'}),
      svgNode('line', {x1: left, x2: left, y1: top, y2: bottom, stroke: '#294436'}),
      svgNode('line', {x1: right, x2: right, y1: bottom, y2: bottom + 4, stroke: '#294436'}));
    svg.append(text(left, 204, data.first), text((left + right) / 2, 215, 'Giá trị quan sát', 'middle'),
      text(right, 204, data.last, 'end'));
    return svg;
  }

  function tableRow(label, count, total) {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = label;
    row.append(heading);
    for (const value of [count, ratioFormat.format(100 * count / total) + '%']) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }

  function initialize(root) {
    const form = root.querySelector('[data-grouped-form]');
    const status = root.querySelector('[data-grouped-status]');
    const results = root.querySelector('[data-grouped-results]');
    const figure = root.querySelector('[data-figure]');
    const caption = root.querySelector('[data-grouped-caption]');
    function update() {
      let data;
      try {
        data = calculate(form.elements.sample.value, form.elements.edges.value);
      } catch (error) {
        status.textContent = error.message;
        results.hidden = true;
        return;
      }
      const covered = data.total - data.below - data.above;
      status.textContent = 'Có ' + data.total + ' quan sát, trong đó ' + covered + ' thuộc các lớp đã chọn, ' +
        data.below + ' nhỏ hơn mốc đầu và ' + data.above + ' lớn hơn mốc cuối.';
      const body = root.querySelector('[data-grouped-body]');
      const rows = document.createDocumentFragment();
      if (data.below) rows.append(tableRow('Dưới ' + data.first + ' (ngoài lớp)', data.below, data.total));
      for (const group of data.groups) rows.append(tableRow(group.label, group.count, data.total));
      if (data.above) rows.append(tableRow('Trên ' + data.last + ' (ngoài lớp)', data.above, data.total));
      body.replaceChildren(rows);
      root.querySelector('[data-grouped-total]').replaceChildren(tableRow('Toàn mẫu', data.total, data.total));
      if (!covered) {
        caption.textContent = 'Mọi lớp đều có tần số bằng 0. Mở rộng các mốc để thấy phân bố của dữ liệu.';
        figure.replaceChildren();
      } else {
        caption.textContent = data.equalWidths
          ? 'Các lớp rộng bằng nhau. Chiều cao mỗi cột là tần số tương đối của lớp, tính theo phần trăm toàn mẫu.'
          : 'Các lớp rộng khác nhau. Chiều rộng cột bằng độ rộng lớp theo trục ngang. Chiều cao là tần số tương đối (%) chia cho độ rộng lớp. Diện tích cột theo hai trục biểu thị phần trăm toàn mẫu thuộc lớp đó.';
        figure.replaceChildren(histogram(data));
      }
      results.hidden = false;
    }
    form.addEventListener('submit', e => { e.preventDefault(); update(); });
    form.addEventListener('input', () => {
      results.hidden = true;
      status.textContent = 'Số liệu đã thay đổi. Chọn “Lập bảng và vẽ biểu đồ” để xem kết quả mới.';
    });
    root.querySelector('[data-grouped-reset]').addEventListener('click', () => { form.reset(); update(); });
    for (const button of form.querySelectorAll('button')) button.disabled = false;
    update();
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {calculate, initialize};
  if (typeof document !== 'undefined') document.querySelectorAll('[data-grouped-data]').forEach(initialize);
})();
