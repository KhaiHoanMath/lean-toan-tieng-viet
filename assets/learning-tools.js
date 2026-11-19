/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";
  const numeric = new Intl.NumberFormat("vi-VN",{maximumFractionDigits:2});
  const fmt = x => numeric.format(x);
  const reader = document.querySelector("[data-diagnostic-reader]");
  if (reader) {
    const input = reader.querySelector("[data-diagnostic-input]");
    const status = reader.querySelector("[data-diagnostic-status]");
    const results = reader.querySelector("[data-diagnostic-results]");
    const original = reader.querySelector("[data-diagnostic-original]");
    const prefix = /^(?:(?:.+?:\d+:\d+):\s*)?(?:error|warning)(?:\([\w.]+\))?:\s*/i;

    const locationLine = /^\S[^\n]*:\d+:\d+:?$/;

    function show(text) {
      results.replaceChildren();
      original.open = false;
      original.hidden = true;
      const raw = original.querySelector("code");
      raw.textContent = "";
      if (text.length > 24000) {
        status.textContent = "Đoạn này khá dài. Hãy chọn riêng thông báo cần đọc trong All Messages.";
        return;
      }
      if (!text.trim()) {
        status.textContent = "Hãy dán một thông báo hoặc chọn một ví dụ bên dưới.";
        return;
      }
      raw.textContent = text;
      original.hidden = false;
      const lines = text.trim().replace(/\r\n?/g, "\n").split("\n");
      if (locationLine.test(lines[0])) {
        lines.shift();
        while (lines.length && !lines[0].trim()) lines.shift();
      }
      const title = (lines[0] || "").replace(prefix, "");
      if (lines.slice(1).some(line => locationLine.test(line) || prefix.test(line) || /^(?:Type mismatch$|Application type mismatch:|unsolved goals$|Unknown identifier |declaration uses )/i.test(line))) {
        status.textContent = "Có nhiều thông báo trong đoạn vừa dán. Hãy chọn riêng một thông báo để xem lời giải thích.";
        return;
      }
      function part(label, value) {
        const paragraph = document.createElement("p");
        const heading = document.createElement("strong");
        const code = document.createElement("code");
        heading.textContent = label;
        code.textContent = value;
        paragraph.append(heading, " ", code);
        results.append(paragraph);
      }
      function indented(start) {
        const value = [];
        for (let i = start; i < lines.length && /^[ \t]+\S/.test(lines[i]); i++) value.push(lines[i]);
        return value.join("\n").trim();
      }
      if (/^(?:Type mismatch|Application type mismatch: The argument)$/i.test(title)) {
        const has = lines.indexOf("has type");
        const needs = lines.findIndex(line => /^(?:of sort .*? )?but is expected to have type$/.test(line));
        if (has > 1 && needs > has && indented(1) && indented(has + 1) && indented(needs + 1)) {
          status.textContent = /^Application/i.test(title)
            ? "Đối số đưa vào chưa đúng kiểu. Hãy đọc xem định lý cần một đối số có kiểu nào ở vị trí này."
            : "Hai kiểu chưa khớp. Hãy so kiểu của biểu thức bạn đã viết với kiểu Lean đang cần. Nếu đang dùng một giả thiết, hãy đọc lại kiểu của giả thiết ấy.";
          part("Biểu thức đã đưa vào", indented(1));
          part("Kiểu của biểu thức ấy", indented(has + 1));
          part("Kiểu Lean đang cần", indented(needs + 1));
          return;
        }
      }
      if (/^unsolved goals$/i.test(title)) {
        const goals = [];
        lines.forEach((line, index) => {
          if (/^⊢\s+\S/.test(line)) {
            const rest = indented(index + 1);
            goals.push(line.replace(/^⊢\s+/, "") + (rest ? "\n" + rest : ""));
          }
        });
        if (goals.length) {
          status.textContent = "Lời chứng minh còn mục tiêu. Đọc dòng sau dấu ⊢ rồi tìm một giả thiết hoặc định lý đưa đến điều ấy.";
          goals.forEach((goal, index) => part("Mục tiêu " + (index + 1), goal));
          return;
        }
      }
      if (/^Tactic [`‘']rewrite[`’'] failed: Did not find an occurrence of the pattern$/i.test(title)) {
        const target = lines.indexOf("in the target expression");
        if (target > 1 && indented(1) && indented(target + 1)) {
          status.textContent = "Lệnh viết lại chưa tìm thấy biểu thức cần thay trong mục tiêu. Với h : a = b, lệnh viet_lai [h] tìm a để thay bằng b. Nếu định viết theo chiều ngược, hãy kiểm tra xem mục tiêu có chứa b hay không.";
          part("Biểu thức Lean đang tìm", indented(1));
          part("Mục tiêu trước khi viết lại", indented(target + 1));
          return;
        }
      }
      const unknown = /^unknown identifier [`‘']([^`’']+)[`’']\.?$/i.exec(title);
      if (unknown) {
        status.textContent = "Lean chưa nhận ra tên này ở vị trí đang viết. Hãy so chữ hoa, chữ thường và dấu gạch dưới với tên trong bài hoặc trong thư viện.";
        part("Tên Lean đang tìm", unknown[1]);
      } else if (/^unknown tactic$/i.test(title)) {
        status.textContent = "Lean chưa nhận ra lệnh ở đầu bước chứng minh. Xem dòng được đánh dấu và tra lại cách viết của lệnh. Chẳng hạn, phan_xa viết với một chữ a ở cuối. Nếu Lean báo thêm mục tiêu chưa giải, hãy sửa tên lệnh rồi kiểm tra lại.";
      } else if (/^no goals to be solved$/i.test(title)) {
        status.textContent = "Khi đến dòng này, Lean đã khép hết mục tiêu trong nhánh đang xét. Đặt con trỏ ở cuối dòng trước để xem bước nào vừa kết thúc chứng minh. Nếu viết thừa một bước, hãy bỏ bước ấy. Nếu muốn sang nhánh khác, hãy kiểm tra dấu · và chỗ thụt đầu dòng.";
      } else if (/^declaration uses [`‘']sorry[`’']\.?$/i.test(title)) {
        status.textContent = "Chứng minh còn chỗ bỏ trống. Hãy thay chua_chung_minh (hoặc sorry trong Lean chuẩn) bằng bước chứng minh rồi chạy lại.";
      } else {
        status.textContent = "Trang hướng dẫn chưa có cách giải thích dạng thông báo này. Hãy đối chiếu nguyên văn với dòng mã Lean đang đánh dấu.";
      }
    }
    reader.addEventListener("submit", event => {
      event.preventDefault();
      show(input.value);
    });
    reader.querySelector("[data-diagnostic-example]").addEventListener("click", () => {
      show(reader.querySelector("[data-diagnostic-samples]").value);
    });
    reader.hidden = false;
  }

  const chart = markup => '<svg viewBox="0 0 320 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+markup+'</svg>';
  const line = (x,y,x2,y2,color="#516d62",w=1) => '<line x1="'+x+'" y1="'+y+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+w+'"/>';
  const label = (x,y,value) => '<text x="'+x+'" y="'+y+'" fill="#204235" font-size="12">'+value+'</text>';
  const colors = ["#126750","#b95b35","#58729a"];

  function model(type,p) {
    const {a,b,c,d}=p;
    if(type==="chia") {
      let shape="";
      for(const [j,n] of [a,b].entries()){
        for(let i=0;i<n;i++) shape+='<circle cx="'+(14+(i%16)*17)+'" cy="'+(14+j*55+Math.floor(i/16)*17)+'" r="5.2" fill="'+["#a73c3c","#22639b"][j]+'"/>';
      }
      const words=(n)=>n%d===0?"chia hết":"dư "+n%d;
      return [chart(shape),a+" bút đỏ "+words(a)+" khi chia cho "+d+"; "+b+" bút xanh "+words(b)+". Tổng "+(a+b)+" "+words(a+b)+" khi chia cho "+d+"."];
    }
    if(type==="tam-giac") {
      const scale=Math.min(195/a,82/b);
      const x=55+a*scale, y=108-b*scale;
      const t=Math.min(9,(x-55)/4,(108-y)/4);
      const shape='<path d="M55 108 L'+x+' 108 L55 '+y+' Z" fill="#d6eae1" stroke="#14684f" stroke-width="2"/><path d="M55 '+(108-t)+'h'+t+'v'+t+'" fill="none" stroke="#14684f"/>'+label((55+x)/2,124,a)+label(33,(108+y)/2,b)+label((55+x)/2+6,(108+y)/2-5,"c");
      const q=a*a+b*b, rt=Math.sqrt(q);
      return [chart(shape),"c² = "+a+"² + "+b+"² = "+q+". Cạnh huyền c "+(Number.isInteger(rt)?"= "+rt:"= √"+q+" ≈ "+fmt(rt))+"."];
    }
    if(type==="tan-so"){
      const ns=[a,b,c], total=a+b+c, names=["Đi bộ","Xe đạp","Xe buýt"];
      const shape=ns.map((n,i)=>'<rect x="'+(30+100*i)+'" y="'+(99-3.3*n)+'" width="45" height="'+3.3*n+'" fill="'+colors[i]+'"/>'+label(27+100*i,118,names[i])+label(39+100*i,91-3.3*n,n)).join('');
      return [chart(shape),total?"Có "+total+" bạn. "+ns.map((n,i)=>names[i]+": "+fmt(100*n/total)+"%").join(" · ")+".":"Chưa có quan sát nào. Khi tổng bằng 0, tần số tương đối chưa xác định."];
    }
    if(type==="tiep-tuyen"){
      const xx=t=>160+t*38, yy=t=>102-t*8.5;
      let curve=""; for(let i=0;i<=70;i++){const t=-3.5+i/10;curve+=(i?" L":"M")+xx(t)+","+yy(t*t);}
      let shape=line(12,102,307,102)+line(160,120,160,6)+'<path d="'+curve+'" fill="none" stroke="#126750" stroke-width="2.7"/>';
      const slope=2*a, h=t=>slope*(t-a)+a*a;
      shape+=line(xx(-3.5),yy(h(-3.5)),xx(3.5),yy(h(3.5)),"#af4b29",2)+'<circle fill="#af4b29" cx="'+xx(a)+'" cy="'+yy(a*a)+'" r="4"/>';
      return [chart(shape),"Tiếp điểm ("+a+"; "+a*a+"). Đạo hàm tại x = "+a+" bằng 2 × ("+a+") = "+slope+". Tiếp tuyến "+(slope===0?"nằm ngang":slope>0?"đi lên từ trái sang phải":"đi xuống từ trái sang phải")+"."];
    }
    const hitA=a*b, hitOther=(100-a)*c, total=hitA+hitOther;
    const bar=total?'<rect x="15" y="34" width="'+290*hitA/total+'" height="30" fill="'+colors[0]+'"/><rect x="'+(15+290*hitA/total)+'" y="34" width="'+290*hitOther/total+'" height="30" fill="'+colors[1]+'"/>':'';
    return [chart(bar+label(15,90,"Nhóm A đạt: "+hitA)+label(157,90,"Còn lại đạt: "+hitOther)),total?"Có "+total+" người đạt, trong đó "+hitA+" người thuộc nhóm A. P(A | đạt) = "+hitA+"/"+total+(10000*hitA%total===0?" = ":" ≈ ")+fmt(100*hitA/total)+"%.":"Không có người nào đạt. P(A | đạt) chưa xác định."];
  }

  for(const lab of document.querySelectorAll("[data-math-lab]")){
    function draw(){
      const p={}; for(const slider of lab.querySelectorAll("input[type=range]")){
        p[slider.name]=Number(slider.value);
        lab.querySelector('[data-number="'+slider.name+'"]').textContent=slider.value;
      }
      const [figure,text]=model(lab.dataset.mathLab,p);
      lab.querySelector("[data-figure]").innerHTML=figure;
      lab.querySelector("output").textContent=text;
    }
    lab.addEventListener("input",draw);
    draw();
  }
})();
