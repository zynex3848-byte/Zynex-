import { all, first, run } from "./database.js";

const phone = v => String(v||"").replace(/[^\d]/g,"");
const name = v => String(v||"").trim().replace(/\s+/g," ").toLocaleLowerCase();
function reference() {
  const b=crypto.getRandomValues(new Uint8Array(5));
  return `ZYN-${new Date().getFullYear()}-${[...b].map(x=>x.toString(16).padStart(2,"0")).join("").toUpperCase()}`;
}
async function history(env,id,action,oldData={},newData={},by="nex") {
  await run(env,"INSERT INTO order_history(order_id,action,old_data,new_data,performed_by) VALUES(?,?,?,?,?)",
    [id,action,JSON.stringify(oldData),JSON.stringify(newData),by]);
}
async function customer(env, fullName, whatsapp) {
  const existing=await first(env,"SELECT id FROM customers WHERE whatsapp_number=? LIMIT 1",[whatsapp]);
  if (existing) {
    await run(env,"UPDATE customers SET full_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",[fullName,existing.id]);
    return existing.id;
  }
  const r=await run(env,"INSERT INTO customers(full_name,whatsapp_number) VALUES(?,?)",[fullName,whatsapp]);
  return r.meta.last_row_id;
}
export async function createOrder(env,data) {
  const fullName=String(data?.fullName||"").trim(), whatsapp=phone(data?.whatsapp);
  const serviceName=String(data?.serviceName||"").trim();
  if(fullName.length<2 || fullName.length>120) throw new Error("INVALID_CUSTOMER_NAME");
  if(!/^\d{8,15}$/.test(whatsapp)) throw new Error("INVALID_WHATSAPP_NUMBER");
  if(!serviceName || serviceName.length>180) throw new Error("SERVICE_NAME_REQUIRED");
  const customerId=await customer(env,fullName,whatsapp);
  let result, code;
  for(let i=0;i<5;i++){
    code=reference();
    try {
      result=await run(env,`INSERT INTO orders(order_number,reference_code,customer_id,session_id,service_name,package_name,order_details,customer_notes,source)
        VALUES(?,?,?,?,?,?,?,?,?)`,
        [`ORD-${crypto.randomUUID()}`,code,customerId,String(data.sessionId||"").slice(0,100),serviceName,
        String(data.packageName||"").slice(0,180),String(data.orderDetails||"").slice(0,4000),
        String(data.customerNotes||"").slice(0,2000),"website"]);
      break;
    } catch(e) { if(i===4) throw e; }
  }
  const id=result.meta.last_row_id;
  await history(env,id,"created",{}, {serviceName,referenceCode:code});
  return {success:true,orderId:id,referenceCode:code,message:"تم استلام طلبك بنجاح. احتفظ بالرمز المرجعي لمتابعة طلبك."};
}
async function ownedOrder(env,v) {
  const code=String(v?.referenceCode||"").trim().toUpperCase();
  const fullName=name(v?.fullName), whatsapp=phone(v?.whatsapp);
  if(!code || !fullName || !whatsapp) return null;
  const row=await first(env,`SELECT o.*,c.full_name,c.whatsapp_number FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.reference_code=?`,[code]);
  if(!row || name(row.full_name)!==fullName || phone(row.whatsapp_number)!==whatsapp) return null;
  return row;
}
export async function updateCustomerOrder(env,verification,changes) {
  const row=await ownedOrder(env,verification);
  if(!row) throw new Error("ORDER_VERIFICATION_FAILED");
  if(["cancelled","completed"].includes(row.order_status)) throw new Error("ORDER_NOT_EDITABLE");
  const allowed={serviceName:"service_name",packageName:"package_name",orderDetails:"order_details",customerNotes:"customer_notes"};
  const sets=[],vals=[],old={},next={};
  for(const [input,column] of Object.entries(allowed)){
    if(Object.hasOwn(changes||{},input)){
      const value=String(changes[input]??"").trim().slice(0,4000);
      sets.push(`${column}=?`); vals.push(value); old[column]=row[column]; next[column]=value;
    }
  }
  if(!sets.length) throw new Error("NO_CHANGES");
  vals.push(row.id);
  await run(env,`UPDATE orders SET ${sets.join(",")},updated_at=CURRENT_TIMESTAMP WHERE id=?`,vals);
  await history(env,row.id,"customer_updated",old,next,"customer");
  return {success:true,message:"تم تحديث طلبك بنجاح."};
}
export async function cancelCustomerOrder(env,verification) {
  const row=await ownedOrder(env,verification);
  if(!row) throw new Error("ORDER_VERIFICATION_FAILED");
  if(["cancelled","completed"].includes(row.order_status)) throw new Error("ORDER_NOT_CANCELLABLE");
  await run(env,"UPDATE orders SET order_status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?",[row.id]);
  await history(env,row.id,"customer_cancelled",{order_status:row.order_status},{order_status:"cancelled"},"customer");
  return {success:true,message:"تم إلغاء طلبك."};
}
export async function listOrders(env,limit=50,offset=0) {
  return all(env,`SELECT o.*,c.full_name,c.whatsapp_number FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [Math.min(Math.max(Number(limit)||50,1),100),Math.max(Number(offset)||0,0)]);
}
export async function setOrderStatus(env,id,status) {
  const allowed=["new","reviewing","contacted","in_progress","completed","cancelled"];
  if(!allowed.includes(status)) throw new Error("INVALID_STATUS");
  const row=await first(env,"SELECT * FROM orders WHERE id=?",[id]);
  if(!row) throw new Error("ORDER_NOT_FOUND");
  await run(env,"UPDATE orders SET order_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",[status,id]);
  await history(env,id,"status_changed",{order_status:row.order_status},{order_status:status},"admin");
  return {success:true};
}

