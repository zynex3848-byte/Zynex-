(()=>{"use strict";
const $=s=>document.querySelector(s);
const toggle=$("#menuToggle"),nav=$("#siteNav");
toggle?.addEventListener("click",()=>nav.classList.toggle("open"));
$("#year")&&( $("#year").textContent=new Date().getFullYear());
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const el=document.querySelector(a.getAttribute("href"));if(el){e.preventDefault();el.scrollIntoView({behavior:"smooth"});}}));
const form=$("#contactOrderForm");
form?.addEventListener("submit",async e=>{
 e.preventDefault();const btn=form.querySelector('button[type="submit"]'),out=$("#orderResult");btn.disabled=true;btn.textContent="جارٍ إرسال الطلب...";
 const d=Object.fromEntries(new FormData(form).entries());
 try{const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});const x=await r.json();if(!r.ok||!x.success)throw Error(x.error||"تعذر إرسال الطلب");
 out.innerHTML=`<div class="notice"><strong>تم استلام طلبك.</strong><br>الرمز المرجعي: <b dir="ltr">${escapeHtml(x.referenceCode)}</b><br>احتفظ بهذا الرمز. استخدمه مع اسمك ورقم واتساب عند تعديل الطلب.</div>`;form.reset();
 }catch(err){out.textContent="تعذر إرسال الطلب: "+friendly(err.message);out.className="notice";}
 finally{btn.disabled=false;btn.textContent="إرسال الطلب";}
});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function friendly(s){return ({INVALID_WHATSAPP_NUMBER:"تحقق من رقم واتساب ومفتاح الدولة.",INVALID_CUSTOMER_NAME:"يرجى إدخال الاسم الكامل.",SERVICE_NAME_REQUIRED:"اختر الخدمة المطلوبة."})[s]||"حاول مرة أخرى أو تواصل معنا عبر واتساب.";}
})();