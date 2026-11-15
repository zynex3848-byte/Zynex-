import { login, isAdmin, logout } from "./modules/authentication.js";
import { nexChat } from "./modules/ai.js";
import { createOrder, updateCustomerOrder, cancelCustomerOrder } from "./modules/orders.js";
import { adminHandler } from "./modules/admin.js";
import { first } from "./modules/database.js";

const headers={
 "X-Content-Type-Options":"nosniff",
 "X-Frame-Options":"SAMEORIGIN",
 "Referrer-Policy":"strict-origin-when-cross-origin",
 "Permissions-Policy":"camera=(), microphone=(), geolocation=()",
 "Content-Security-Policy":"default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.groq.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
};
function json(data,status=200,extra={}){return Response.json(data,{status,headers:{...headers,"Cache-Control":"no-store",...extra}});}
async function rateLimit(env,key,max=20,windowSeconds=60){
  // Lightweight best-effort limit. For high-traffic production, use Cloudflare WAF/Rate Limiting.
  const bucket=Math.floor(Date.now()/(windowSeconds*1000));
  const id=`${key}:${bucket}`;
  try{
    const row=await first(env,"SELECT setting_value FROM system_settings WHERE setting_key=?",[ "rl_"+id ]);
    const count=Number(row?.setting_value||0);
    if(count>=max) return false;
    await env.DB.prepare(`INSERT INTO system_settings(setting_key,setting_value,category) VALUES(?,?, 'rate_limit')
      ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value`).bind("rl_"+id,String(count+1)).run();
  }catch(e){console.warn("Rate limit storage unavailable",e);}
  return true;
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  try{
   if(path.startsWith("/api/")){
    if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}});
    if(path==="/api/health"&&request.method==="GET"){
      let database="unknown"; try{await env.DB.prepare("SELECT 1").first();database="connected";}catch{database="disconnected";}
      return json({success:true,company:"ZYNEX",status:"online",database,aiConfigured:!!env.GROQ_API_KEY});
    }
    if(path==="/api/nex/chat"&&request.method==="POST"){
      if(!await rateLimit(env,"chat:"+((request.headers.get("CF-Connecting-IP")||"unknown")),18)) return json({success:false,error:"RATE_LIMIT"},429);
      const b=await request.json().catch(()=>({}));
      return json(await nexChat(env,b));
    }
    if(path==="/api/orders"&&request.method==="POST"){
      if(!await rateLimit(env,"order:"+((request.headers.get("CF-Connecting-IP")||"unknown")),8)) return json({success:false,error:"RATE_LIMIT"},429);
      return json(await createOrder(env,await request.json()));
    }
    if(path==="/api/orders/update"&&request.method==="POST"){
      if(!await rateLimit(env,"update:"+((request.headers.get("CF-Connecting-IP")||"unknown")),8)) return json({success:false,error:"RATE_LIMIT"},429);
      const b=await request.json(); return json(await updateCustomerOrder(env,b.verification,b.changes));
    }
    if(path==="/api/orders/cancel"&&request.method==="POST"){
      const b=await request.json(); return json(await cancelCustomerOrder(env,b.verification));
    }
    if(path==="/api/admin/login"&&request.method==="POST"){
      const result=await login(request,env);
      if(!result.ok) return json({success:false,error:"INVALID_CREDENTIALS"},401);
      return json({success:true},200,{ "Set-Cookie":result.cookie });
    }
    if(path==="/api/admin/logout"&&request.method==="POST"){
      const cookie=await logout(request,env); return json({success:true},200,{"Set-Cookie":cookie});
    }
    if(path.startsWith("/api/admin/")){
      if(!await isAdmin(request,env)) return json({success:false,error:"UNAUTHORIZED"},401);
      return adminHandler(request,env);
    }
    return json({success:false,error:"API_NOT_FOUND"},404);
   }
   const response=await env.ASSETS.fetch(request);
   const h=new Headers(response.headers); for(const [k,v] of Object.entries(headers)) h.set(k,v);
   return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
  }catch(e){
   console.error("ZYNEX WORKER ERROR",e);
   const status=e.message==="AI_NOT_CONFIGURED"||e.message==="ADMIN_PASSWORD_NOT_CONFIGURED"?503:400;
   return json({success:false,error:e.message||"INTERNAL_ERROR",message:"تعذر تنفيذ العملية حالياً. حاول مرة أخرى أو تواصل مع ZYNEX."},status);
  }
 }
};

