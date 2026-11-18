/* © 2026 Nguyễn Đăng Khải Hoàn. Bảo lưu các quyền đối với phần biên soạn nguyên gốc. */
(() => {
  "use strict";
  const fold = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d");
  const numeric = new Intl.NumberFormat("vi-VN",{maximumFractionDigits:2});
  const fmt = x => numeric.format(x);
  const field = document.getElementById("glossary-search");
  if (field) {
    const rows = Array.from(document.querySelectorAll("[data-glossary-row]"));
    function filter() {
      const keys = fold(field.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      for (const row of rows) {
        const visible = keys.every(word => fold(row.dataset.query).includes(word));
        row.hidden = !visible;
        if (visible) count += 1;
      }
      document.querySelector("[data-glossary-count]").textContent = count ? count + " mục từ" : "Chưa tìm thấy mục từ này. Hãy thử một ký hiệu hoặc một từ ngắn hơn.";
    }
    field.value = new URLSearchParams(location.search).get("tu") || "";
    field.addEventListener("input",filter);
    filter();
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
    return [chart(bar+label(15,90,"Nhóm A đạt: "+hitA)+label(157,90,"Còn lại đạt: "+hitOther)),total?"Có "+total+" người đạt, trong đó "+hitA+" người thuộc nhóm A. P(A | đạt) = "+hitA+"/"+total+(100*hitA%total===0?" = ":" ≈ ")+fmt(100*hitA/total)+"%.":"Không có người nào đạt. P(A | đạt) chưa xác định."];
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
