(() => {
  if (window.__ZYNEX_NEX__) return;
  window.__ZYNEX_NEX__ = true;
  // يعمل الموقع وNEX على نفس عنوان Worker؛ لا حاجة لوضع رابط منفصل.
  const API_URL = "/api/nex/chat";
  const panel = document.getElementById("nex-panel");
  const launch = document.getElementById("nex-launch");
  if (!panel || !launch) return;
  const messages = panel.querySelector("#nex-messages");
  const input = panel.querySelector("#nex-input");
  const send = panel.querySelector("#nex-send");
  const prompts = ["جرّب أن تسأل NEX عن خدمات ZYNEX…", "هل تريد معرفة الفرق بين خدماتنا؟ اسأل NEX", "استكشف اشتراكات ZYNEX… اكتب سؤالك", "اسأل NEX: ماذا يشمل الاشتراك المُدار؟"];
  let promptIndex = 0;
  setInterval(() => { if (document.activeElement !== input && !input.value) input.placeholder = prompts[promptIndex++ % prompts.length]; }, 3800);
  input.addEventListener("focus", () => input.classList.remove("nex-animated-placeholder"));
  input.addEventListener("blur", () => { if (!input.value) input.classList.add("nex-animated-placeholder"); });
  function addMessage(text, who) { const el = document.createElement("div"); el.className = "nex-msg " + (who === "user" ? "nex-user" : "nex-bot"); el.textContent = text; messages.appendChild(el); messages.scrollTop = messages.scrollHeight; return el; }
  function openPanel() { panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); if (!messages.childElementCount) addMessage("مرحباً بك في ZYNEX.\nأنا NEX، مساعدنا الرقمي. اسألني عن خدماتنا واشتراكاتنا، وسأساعدك بالمعلومات المعتمدة لدى الشركة.", "bot"); input.focus(); }
  launch.addEventListener("click", () => panel.classList.contains("open") ? (panel.classList.remove("open"), panel.setAttribute("aria-hidden", "true")) : openPanel());
  panel.querySelector("#nex-close").addEventListener("click", () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); });
  async function ask(question) {
    addMessage(question, "user"); const waiting = addMessage("NEX يراجع المعلومات…", "bot"); send.disabled = true;
    try {
      if (API_URL.includes("YOUR-WORKER")) throw new Error("لم يتم ربط رابط Worker بعد");
      const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question }) });
      const data = await response.json(); waiting.remove();
      if (!response.ok) throw new Error(data.error || "API error");
      addMessage(data.answer || "تعذر الحصول على إجابة حالياً. يرجى التواصل مع خدمة العملاء.", "bot");
    } catch { waiting.remove(); addMessage("لم يتم الاتصال بالمساعد حالياً. يمكنك التواصل مباشرة مع خدمة العملاء عبر واتساب: https://wa.me/249129452041", "bot"); }
    finally { send.disabled = false; input.focus(); }
  }
  panel.querySelector("#nex-form").addEventListener("submit", event => { event.preventDefault(); const question = input.value.trim(); if (!question || send.disabled) return; input.value = ""; ask(question); });
  panel.querySelectorAll(".nex-chip").forEach(button => button.addEventListener("click", () => ask(button.textContent.trim())));
})();
