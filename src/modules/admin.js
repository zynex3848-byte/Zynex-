import { all, first, run, setting, setSetting } from "./database.js";
import { listOrders, setOrderStatus } from "./orders.js";

const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
async function body(req){return req.json().catch(()=>({}));}
function text(v,max=5000){return String(v??"").trim().slice(0,max);}
async function stats(env){
  const [orders,customers,conversations,servicesCount,projects,latest]=await Promise.all([
    first(env,"SELECT COUNT(*) n FROM orders"),first(env,"SELECT COUNT(*) n FROM customers"),
    first(env,"SELECT COUNT(*) n FROM nex_conversations"),first(env,"SELECT COUNT(*) n FROM services"),
    first(env,"SELECT COUNT(*) n FROM projects"),
    all(env,"SELECT o.id,o.reference_code,o.service_name,o.order_status,o.created_at,c.full_name,c.whatsapp_number FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.id DESC LIMIT 8")
  ]);
  return {totals:{orders:orders.n,customers:customers.n,conversations:conversations.n,services:servicesCount.n,projects:projects.n},latest};
}
export async function adminHandler(req,env){
  const url=new URL(req.url), path=url.pathname.replace(/^\/api\/admin/,"")||"/", method=req.method;
  try{
    if(method==="GET"&&path==="/dashboard") return json(await stats(env));
    if(method==="GET"&&path==="/orders") return json(await listOrders(env,url.searchParams.get("limit"),url.searchParams.get("offset")));
    if(method==="PATCH"&&path.startsWith("/orders/")){
      const id=Number(path.split("/")[2]), b=await body(req);
      return json(await setOrderStatus(env,id,b.status));
    }
    if(method==="GET"&&path==="/settings") return json(await all(env,"SELECT setting_key,setting_value,category,description FROM system_settings ORDER BY category,setting_key"));
    if(method==="PUT"&&path==="/settings"){
      const b=await body(req); if(!b.key) throw new Error("SETTING_KEY_REQUIRED");
      await setSetting(env,text(b.key,100),text(b.value,12000),text(b.category||"general",60));
      return json({success:true});
    }
    if(method==="GET"&&path==="/knowledge") return json(await all(env,"SELECT * FROM nex_knowledge ORDER BY updated_at DESC"));
    if(method==="POST"&&path==="/knowledge"){
      const b=await body(req); if(!text(b.title,180)||!text(b.content,12000)) throw new Error("TITLE_AND_CONTENT_REQUIRED");
      if(b.id) await run(env,"UPDATE nex_knowledge SET title=?,content=?,knowledge_type=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [text(b.title,180),text(b.content,12000),text(b.knowledge_type||"custom",40),b.is_active===false?0:1,Number(b.id)]);
      else await run(env,"INSERT INTO nex_knowledge(title,content,knowledge_type,is_active) VALUES(?,?,?,?)",
        [text(b.title,180),text(b.content,12000),text(b.knowledge_type||"custom",40),b.is_active===false?0:1]);
      return json({success:true});
    }
    if(method==="DELETE"&&path.startsWith("/knowledge/")){await run(env,"DELETE FROM nex_knowledge WHERE id=?",[Number(path.split("/").pop())]);return json({success:true});}
    if(method==="GET"&&path==="/skills") return json(await all(env,"SELECT * FROM nex_skills ORDER BY id DESC"));
    if(method==="POST"&&path==="/skills"){
      const b=await body(req); if(!text(b.skill_name,120)||!text(b.skill_instructions,6000)) throw new Error("SKILL_NAME_AND_INSTRUCTIONS_REQUIRED");
      if(b.id) await run(env,"UPDATE nex_skills SET skill_name=?,skill_description=?,skill_instructions=?,skill_category=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [text(b.skill_name,120),text(b.skill_description,500),text(b.skill_instructions,6000),text(b.skill_category||"general",60),b.is_active===false?0:1,Number(b.id)]);
      else await run(env,"INSERT INTO nex_skills(skill_name,skill_description,skill_instructions,skill_category,is_active) VALUES(?,?,?,?,?)",
        [text(b.skill_name,120),text(b.skill_description,500),text(b.skill_instructions,6000),text(b.skill_category||"general",60),b.is_active===false?0:1]);
      return json({success:true});
    }
    if(method==="DELETE"&&path.startsWith("/skills/")){await run(env,"DELETE FROM nex_skills WHERE id=?",[Number(path.split("/").pop())]);return json({success:true});}
    if(method==="GET"&&path==="/services") return json(await all(env,"SELECT * FROM services ORDER BY sort_order,id"));
    if(method==="POST"&&path==="/services"){
      const b=await body(req); if(!text(b.service_name,180)) throw new Error("SERVICE_NAME_REQUIRED");
      if(b.id) await run(env,"UPDATE services SET service_name=?,service_description=?,price=?,billing_type=?,features=?,is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [text(b.service_name,180),text(b.service_description,2000),text(b.price,100),text(b.billing_type,100),text(b.features,2000),b.is_active===false?0:1,Number(b.id)]);
      else await run(env,"INSERT INTO services(service_name,service_description,price,billing_type,features,is_active) VALUES(?,?,?,?,?,?)",
        [text(b.service_name,180),text(b.service_description,2000),text(b.price,100),text(b.billing_type,100),text(b.features,2000),b.is_active===false?0:1]);
      return json({success:true});
    }
    if(method==="DELETE"&&path.startsWith("/services/")){await run(env,"DELETE FROM services WHERE id=?",[Number(path.split("/").pop())]);return json({success:true});}
    if(method==="GET"&&path==="/activity") return json(await all(env,"SELECT * FROM admin_activity ORDER BY id DESC LIMIT 100"));
    return json({success:false,error:"NOT_FOUND"},404);
  }catch(e){console.error("ADMIN API",e);return json({success:false,error:e.message||"SERVER_ERROR"},400);}
}
