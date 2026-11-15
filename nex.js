(()=>{"use strict";
const $=s=>document.querySelector(s),panel=$("#nexPanel"),launch=$("#nexLaunch"),close=$("#nexClose"),form=$("#nexForm"),input=$("#nexInput"),messages=$("#nexMessages");
if(!panel||!launch)return;
let sessionId=localStorage.getItem("zynex_nex_session");if(!sessionId){sessionId=crypto.randomUUID();localStorage.setItem("zynex_nex_session",sessionId);}
launch.addEventListener("click",()=>{panel.classList.toggle("open");if(panel.classList.contains("open"))input.focus();});
close.addEventListener("click",()=>panel.classList.remove("open"));
function add(text,who="bot"){const d=document.createElement("div");d.className="bubble "+who;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight;return d;}
async function send(text){if(!text.trim())return;add(text,"user");input.value="";const wait=add("NEX يكتب الآن…");try{const r=await fetch("/api/nex/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,sessionId})});const x=await r.json();wait.remove();if(!r.ok)throw Error(x.error);add(x.reply||"لم يصل رد.");}catch(e){wait.textContent=e.message==="AI_NOT_CONFIGURED"?"المساعد الذكي غير متصل حالياً. يمكنك التواصل مع فريقنا عبر واتساب +249129452041.":"تعذر الاتصال حالياً. حاول لاحقاً أو تواصل معنا عبر واتساب +249129452041.";}}
function actionForm(mode){
 const wrap=document.createElement("form");wrap.className="bubble bot";wrap.style.maxWidth="100%";
 wrap.innerHTML=`<strong>${mode==="edit"?"التحقق لتعديل الطلب":"التحقق لإلغاء الطلب"}</strong>
 <p style="font-size:12px;margin:6px 0 10px">أدخل الرمز المرجعي والاسم ورقم واتساب المسجل في الطلب. لا يكفي الرمز وحده لإثبات الملكية.</p>
 <input name="referenceCode" required placeholder="ZYN-2026-XXXXXXXXXX" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0" dir="ltr">
 <input name="fullName" required placeholder="الاسم الكامل" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0">
 <input name="whatsapp" required placeholder="رقم واتساب مع مفتاح الدولة" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0" dir="ltr">
 ${mode==="edit"?`<input name="serviceName" placeholder="الخدمة (اتركه فارغاً دون تغيير)" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0">
 <input name="packageName" placeholder="الباقة أو التخصص (اختياري)" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0">
 <textarea name="orderDetails" placeholder="التفاصيل الجديدة (اختياري)" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0"></textarea>
 <textarea name="customerNotes" placeholder="ملاحظات جديدة (اختياري)" style="width:100%;padding:9px;border:1px solid #ddd;border-radius:9px;margin:4px 0"></textarea>`:"<p style='font-size:12px;color:#8b3b30'>تنبيه: إلغاء الطلب إجراء لا يمكن التراجع عنه من الموقع.</p>"}
 <button class="btn" style="margin-top:8px">${mode==="edit"?"تحقق واحفظ التعديلات":"تحقق وألغِ الطلب"}</button><div class="form-result" style="font-size:12px;margin-top:8px"></div>`;
 wrap.addEventListener("submit",async e=>{
  e.preventDefault();const b=wrap.querySelector("button"),out=wrap.querySelector(".form-result");b.disabled=true;
  const fd=new FormData(wrap),verification={referenceCode:fd.get("referenceCode"),fullName:fd.get("fullName"),whatsapp:fd.get("whatsapp")};
  try{
   if(mode==="cancel"&&!confirm("هل أنت متأكد من إلغاء الطلب؟")){b.disabled=false;return;}
   let path,body;
   if(mode==="edit"){
    const changes={};for(const key of ["serviceName","packageName","orderDetails","customerNotes"]){const v=String(fd.get(key)||"").trim();if(v)changes[key]=v;}
    if(!Object.keys(changes).length)throw Error("أدخل تغييراً واحداً على الأقل.");
    path="/api/orders/update";body={verification,changes};
   }else{path="/api/orders/cancel";body={verification};}
   const r=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),d=await r.json();
   if(!r.ok||!d.success)throw Error(d.error||"تعذر تنفيذ الطلب");
   out.textContent=d.message||"تمت العملية بنجاح.";out.style.color="#26734d";add(d.message||"تمت العملية بنجاح.");
   wrap.querySelectorAll("input,textarea,button").forEach(x=>x.disabled=true);
  }catch(err){out.textContent=err.message==="ORDER_VERIFICATION_FAILED"?"تعذر التحقق. راجع الرمز والاسم ورقم واتساب.":err.message==="ORDER_NOT_EDITABLE"?"لا يمكن تعديل طلب مكتمل أو ملغي.":err.message==="ORDER_NOT_CANCELLABLE"?"لا يمكن إلغاء هذا الطلب.":err.message;out.style.color="#a43e32";b.disabled=false;}
 });
 messages.appendChild(wrap);messages.scrollTop=messages.scrollHeight;
}
form.addEventListener("submit",e=>{e.preventDefault();send(input.value);});
document.querySelectorAll("[data-shortcut]").forEach(b=>b.addEventListener("click",()=>send(b.dataset.shortcut)));
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>actionForm(b.dataset.action==="edit-order"?"edit":"cancel")));
})();