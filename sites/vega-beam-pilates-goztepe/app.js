const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const BIZ = SITE.business;
const waLink = text => `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(text)}`;
// "0545 344 55 83" / "+90 545…" / "90545…" → "+905453445583"
const telHref = phone => {
  const d = phone.replace(/\D/g, "");
  return `tel:+${d.startsWith("90") ? d : d.startsWith("0") ? "9" + d : "90" + d}`;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const hh = h => `${String(h).padStart(2, "0")}:00`;
const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MEMBER_COLORS = ["#C8453C", "#4E9660", "#3D6DB3", "#DDAE36"];
const HAS_HOURS = Array.isArray(SITE.hours);
const showLinks = id => document.querySelectorAll(`a[href="#${id}"]`).forEach(a => { a.hidden = false; });

// data-text="copy.beats.0.title" → SITE.copy.beats[0].title
function fillText() {
  document.querySelectorAll("[data-text]").forEach(el => {
    el.textContent = el.dataset.text.split(".").reduce((o, k) => o?.[k], SITE) ?? "";
  });
}

function bindImages() {
  const img = SITE.images;
  $("#brand-logo").src = img.logo;
  $("#brand-logo").alt = img.logoAlt;
  $('link[rel="icon"]').href = img.logo;
  $("#photo-img").src = img.studio;
  $("#photo-img").alt = img.studioAlt;
  if (img.studioMobile) $("#photo-mobile").srcset = img.studioMobile;
  else $("#photo-mobile").remove();
}

function bindBasics() {
  const msg = `Merhaba, ${BIZ.name} hakkında bilgi almak ve ders ayırtmak istiyorum.`;
  document.querySelectorAll(".js-wa").forEach(a => { a.href = waLink(msg); });
  document.querySelectorAll(".js-call").forEach(a => { a.href = telHref(BIZ.phone); });
  $("#maps-link").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BIZ.mapsQuery)}`;
  $("#year").textContent = new Date().getFullYear();
  $("#info").innerHTML = `
    <div><dt>Adres</dt><dd>${esc(BIZ.address)}</dd></div>
    ${SITE.hoursText ? `<div><dt>Saatler</dt><dd>${esc(SITE.hoursText)}</dd></div>` : ""}
    <div><dt>Telefon ve WhatsApp</dt><dd><span class="phone" id="phone-text">${esc(BIZ.phone)}</span><button class="copy" type="button" id="copy-phone">Kopyala</button></dd></div>
    ${BIZ.instagram ? `<div><dt>Instagram</dt><dd><a href="https://instagram.com/${esc(BIZ.instagram)}" target="_blank" rel="noopener">@${esc(BIZ.instagram)}</a></dd></div>` : ""}
    <div><dt>Diğer Şube</dt><dd>Nişantaşı · <a href="https://instagram.com/vegabeampilates_nisantasi" target="_blank" rel="noopener">@vegabeampilates_nisantasi</a></dd></div>`;
  $("#copy-phone").addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(BIZ.phone); e.target.textContent = "Kopyalandı"; }
    catch { const r = document.createRange(); r.selectNodeContents($("#phone-text")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });
}

/* ================= MOBİL MENÜ ================= */
function initMenu() {
  const btn = $("#menu-btn"), menu = $("#menu");
  const isOpen = () => document.body.classList.contains("menu-open");
  const set = open => {
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    if (open) menu.querySelector("a:not([hidden])").focus();
  };
  $("#menu-info").textContent = [BIZ.address, SITE.hoursText].filter(Boolean).join(" · ");
  btn.addEventListener("click", () => set(!isOpen()));
  menu.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen()) { set(false); btn.focus(); } });
}

/* ================= FOTOĞRAF PARALLAX ================= */
function initPhoto() {
  const sec = $("#studyo"), img = $("#photo-img");
  const update = () => {
    const r = sec.getBoundingClientRect();
    const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    img.style.setProperty("--py", `${(p - 0.5) * -8}%`);
  };
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  update();
}

/* ================= EKİP ================= */
function initTeam() {
  const members = SITE.team.filter(m => m.photo);
  if (!members.length) return;
  $("#team").innerHTML = members.map((m, i) => `
    <figure class="member" style="--i:${i};--c:${MEMBER_COLORS[i % MEMBER_COLORS.length]}">
      <div class="ph"><img src="${esc(m.photo)}" alt="${esc(m.name)}" loading="lazy"></div>
      <figcaption><h3>${esc(m.name)}</h3><span>${esc(m.role)}</span></figcaption>
    </figure>`).join("");
  $("#ekip").hidden = false;
  showLinks("ekip");
}

/* ================= SAAT SEÇİCİ ================= */
const booking = (() => {
  const state = { name: "", format: SITE.formats[0], plan: null, day: 0, time: null };
  const dayDate = o => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + o); return d; };
  const dayLabel = o => o === 0 ? "Bugün" : o === 1 ? "Yarın" : DAY_NAMES[dayDate(o).getDay()].slice(0, 3);
  // SITE.hours is Monday-first; getDay() is Sunday-first.
  const hoursFor = o => {
    const span = SITE.hours[(dayDate(o).getDay() + 6) % 7];
    if (!span) return [];
    const first = o === 0 ? Math.max(span[0], new Date().getHours() + 1) : span[0];
    const list = [];
    for (let h = first; h < span[1]; h++) list.push(hh(h));
    return list;
  };
  // Without known hours every day is selectable and the message asks for free slots.
  const isOpen = o => !HAS_HOURS || hoursFor(o).length > 0;
  state.day = Math.max(0, Array.from({ length: 7 }, (_, d) => d).findIndex(isOpen));   // skip a closed or finished today
  if (!HAS_HOURS) $("#f-time-field").hidden = true;
  const whenText = () => { const d = dayDate(state.day); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAY_NAMES[d.getDay()]}`; };
  const message = () => {
    const hi = state.name ? `Merhaba, ben ${state.name}.` : "Merhaba,";
    const lesson = `${state.format} pilates dersi${state.plan ? ` (${state.plan})` : ""}`;
    return state.time
      ? `${hi} ${whenText()} ${state.time} için ${lesson} ayırtmak istiyorum.`
      : `${hi} ${whenText()} için ${lesson} ayırtmak istiyorum. Uygun saatleri öğrenebilir miyim?`;
  };
  function renderSummary() {
    const time = HAS_HOURS ? `<span class="${state.time ? "" : "todo"}">${state.time ? esc(state.time) : "Saat seçilmedi"}</span>` : "";
    $("#summary").innerHTML = `<b>${esc(state.format)}</b>${state.plan ? `<span>${esc(state.plan)}</span>` : ""}<span>${esc(whenText())}</span>${time}`;
    const btn = $("#book-btn");
    btn.href = waLink(message());
    btn.textContent = state.time ? "WhatsApp'tan ayırt" : "Uygun saatleri sor";
  }
  function render() {
    $("#f-format").innerHTML = SITE.formats.map(f => `<button type="button" class="chip" data-format="${esc(f)}" aria-pressed="${f === state.format}">${esc(f)}</button>`).join("");
    $("#f-day").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = dayDate(i);
      return `<button type="button" class="chip" data-day="${i}" aria-pressed="${i === state.day}"${isOpen(i) ? "" : " disabled"}>${dayLabel(i)}<small>${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}</small></button>`;
    }).join("");
    if (HAS_HOURS) {
      const hours = hoursFor(state.day);
      if (!hours.includes(state.time)) state.time = null;
      $("#f-time").innerHTML = hours.length
        ? hours.map(h => `<button type="button" class="chip" data-time="${h}" aria-pressed="${h === state.time}">${h}</button>`).join("")
        : `<p class="fine">Bugün için uygun saat kalmadı.</p>`;
    }
    renderSummary();
  }
  // Pre-fills from a quiz plan: its format, and the first open slot inside the preferred time window.
  function pick(format, plan, window) {
    if (!window) { Object.assign(state, { format, plan }); return render(); }
    const [from, to] = window;
    const inWindow = h => { const n = parseInt(h, 10); return n >= from && n < to; };
    const day = Array.from({ length: 7 }, (_, d) => d).find(d => hoursFor(d).some(inWindow));
    Object.assign(state, { format, plan }, day === undefined ? {} : { day, time: hoursFor(day).find(inWindow) });
    render();
  }
  $("#booking").addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    if (b.dataset.format) { state.format = b.dataset.format; state.plan = null; }
    if (b.dataset.day) state.day = Number(b.dataset.day);
    if (b.dataset.time) state.time = b.dataset.time;
    render();
  });
  $("#f-name").addEventListener("input", e => { state.name = e.target.value.trim(); renderSummary(); });
  return { render, pick };
})();

/* ================= ÖNERİ MOTORU ================= */
// One tap per question; the plan is derived from all answers and pre-fills the time picker.
// Only formats and special programs the studio lists in SITE are ever offered or recommended.
const COMPANY_FORMAT = { solo: "Bireysel", duo: "Double", group: "Grup" };
const offered = format => SITE.formats.includes(format) ? format : SITE.formats[0];
const GOALS = [["Güçlenmek ve sıkılaşmak", "strength"], ["Ağrılarımı azaltmak", "pain"], ["Duruşumu düzeltmek", "posture"], ["Esnemek ve rahatlamak", "mobility"], ["Hamilelik ya da doğum sonrası", "prenatal"]]
  .filter(([, v]) => v !== "prenatal" || SITE.programs.includes("prenatal"));
const COMPANIES = [["Tamamen bana özel ilgi", "solo"], ["Arkadaşım ya da eşimle birlikte", "duo"], ["Küçük bir grubun enerjisi", "group"]]
  .filter(([, v]) => SITE.formats.includes(COMPANY_FORMAT[v]));
const QUESTIONS = [
  { id: "goal", label: "Hedef", q: "Pilatesten en çok ne istiyorsun?", a: GOALS },
  { id: "health", label: "Durum", q: "Bilmemiz gereken bir durum var mı?", skip: ans => ans.goal === "prenatal", a: [["Bel fıtığı ya da bel ağrısı", "back"], ["Boyun, sırt ya da omuz ağrısı", "neck"], ["Yakın zamanda sakatlık ya da ameliyat", "injury"], ["Hayır, yok", "none"]] },
  { id: "level", label: "Deneyim", q: "Daha önce pilates yaptın mı?", a: [["Hiç yapmadım", "new"], ["Birkaç kez denedim", "some"], ["Düzenli yapıyorum", "regular"]] },
  { id: "company", label: "Ortam", q: "Derste nasıl bir ortam istersin?", skip: () => COMPANIES.length < 2, a: COMPANIES },
  { id: "freq", label: "Sıklık", q: "Haftada kaç gün ayırabilirsin?", a: [["1 gün", "1"], ["2 gün", "2"], ["3 gün ya da daha fazla", "3"]] },
  { id: "time", label: "Saat", q: "Hangi saatler sana uyar?", skip: () => !HAS_HOURS, a: [["Sabah, 08–12", "morning"], ["Öğlen, 12–17", "noon"], ["Akşam, 17–22", "evening"]] }
];
const TIME_WINDOWS = { morning: [8, 12], noon: [12, 17], evening: [17, 22] };
const PROGRAMS = {
  prenatal: ["Hamile pilatesi", "Doktor onayıyla, dönemine uygun, pelvik taban ve nefes odaklı birebir program."],
  back: ["Bel programı", "Bel fıtığı ve bel ağrısı için hareketlerin sana göre seçildiği, birebir ilerleyen dersler."],
  neck: ["Boyun ve sırt programı", "Boyun, sırt ve omuz ağrısı için duruş ve omuz dengesi odaklı birebir dersler."],
  injury: ["Güvenli dönüş programı", "Doktorunun onayıyla, sakatlık ya da ameliyat sonrası hareketi adım adım yeniden kuran birebir dersler."],
  strength: ["Güç ve sıkılaşma", "Core ve tüm vücut kuvveti odaklı, tempolu ama kontrollü bir program."],
  pain: ["Ağrısız hareket", "Omurga hareketliliği ve core desteğiyle gündelik ağrıları hafifletmeye odaklı bir program."],
  posture: ["Duruş programı", "Sırt, omuz ve core dengesiyle daha dik ve rahat bir duruş için program."],
  mobility: ["Esneklik ve nefes", "Nefesle akan, esneten ve gevşeten, günün stresini attıran bir program."]
};
const RHYTHM = {
  1: "Haftada 1 ders. Alışkanlık için iyi bir başlangıç, fırsat buldukça 2'ye çıkarabilirsin.",
  2: "Haftada 2 ders. Düzenli ilerlemek için en dengeli ritim.",
  3: "Haftada 3 ders. Hızlı ilerlemek için; aralarda bir dinlenme günü iyi gelir."
};
const springOf = id => SPRINGS.find(s => s.id === id);

function buildPlan(ans) {
  // need = what the visitor told us; special = a matching program the studio actually offers.
  const need = ans.goal === "prenatal" ? "prenatal" : ans.health !== "none" ? ans.health : null;
  const special = SITE.programs.includes(need) ? need : null;
  const [title, text] = PROGRAMS[special || ans.goal];
  const format = offered(special ? "Bireysel" : COMPANY_FORMAT[ans.company]);
  const springs = need || ans.level === "new" ? ["yellow"] : ans.level === "some" ? ["blue", "green"] : ["red", "blue"];
  const bring = ["Rahat bir kıyafet", "kaymaz çorap"];
  if (need === "prenatal" || need === "injury") bring.push("doktor onayın");
  else if (need) bring.push("varsa MR ya da raporların");
  let note = "";
  if (need && !special) note = "Durumunu ilk derste eğitmenine mutlaka anlat; hareketler ona göre seçilir.";
  else if (special && format === "Bireysel" && ans.company && ans.company !== "solo") note = `Durumun için ilk dersleri birebir öneriyoruz. Sonra istersen ${ans.company === "duo" ? "double" : "grup"} derslere geçebilirsin.`;
  else if (format === "Grup" && ans.level === "new" && SITE.formats.includes("Bireysel")) note = "Hiç denemediysen tek bir bireysel dersle başlamak, grupta daha rahat etmeni sağlar.";
  return { title, text, format, rhythm: RHYTHM[ans.freq], springs, bring: bring.join(", "), note, window: TIME_WINDOWS[ans.time] };
}

const quiz = { answers: {} };
const activeQuestions = () => QUESTIONS.filter(q => !q.skip?.(quiz.answers));
const nextIndex = qs => qs.findIndex(q => !(q.id in quiz.answers));
const answerLabel = q => q.a.find(([, v]) => v === quiz.answers[q.id])[0];
const planMessage = p => [
  `Merhaba, sitenizdeki testi doldurdum. Önerilen: ${p.title} (${p.format}).`,
  ...activeQuestions().map(q => `${q.label}: ${answerLabel(q)}`),
  "Bilgi almak istiyorum."
].join("\n");

function renderPlan(el, bar) {
  const p = buildPlan(quiz.answers);
  const coils = p.springs.map(id => `<svg viewBox="0 0 34 14" style="--c:${springOf(id).color}" aria-hidden="true"><path d="${COIL_PATH}"/></svg>`).join("");
  const k = p.springs.reduce((a, id) => a + springOf(id).k, 0);
  const names = p.springs.map(id => springOf(id).name.toLocaleLowerCase("tr")).join(" + ");
  el.innerHTML = `${bar}<div class="result">
    <h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>
    <dl class="plan">
      <div><dt>Format</dt><dd>${esc(p.format)}</dd></div>
      <div><dt>Ritim</dt><dd>${esc(p.rhythm)}</dd></div>
      <div><dt>Başlangıç yayı</dt><dd><span class="coils">${coils}</span>${levelName(k)}, ${names}</dd></div>
      <div><dt>Yanına al</dt><dd>${esc(p.bring)}</dd></div>
    </dl>
    ${p.note ? `<p>${esc(p.note)}</p>` : ""}
    <p class="step">Kesin programı ve yay ayarını ilk derste eğitmenin belirler.</p>
    <div class="row">
      <button class="btn btn-light" type="button" data-use>Bu planla saat seç</button>
      <a class="btn btn-line" href="${waLink(planMessage(p))}" target="_blank" rel="noopener">Planı WhatsApp'tan paylaş</a>
    </div>
    <button class="linkish" type="button" data-restart>Testi baştan al</button></div>`;
}

function renderQuiz() {
  const el = $("#quiz");
  const qs = activeQuestions(), idx = nextIndex(qs);
  const bar = `<div class="progress">${qs.map((_, i) => `<i class="${idx === -1 || i <= idx ? "on" : ""}"></i>`).join("")}</div>`;
  if (idx === -1) return renderPlan(el, bar);
  const Q = qs[idx];
  el.innerHTML = `${bar}<div class="quiz-foot"><p class="step">${idx + 1} / ${qs.length}</p>${idx ? `<button class="linkish" type="button" data-back>← Geri</button>` : ""}</div>
    <h3>${esc(Q.q)}</h3>
    <div class="options">${Q.a.map(([label, val]) => `<button class="opt" type="button" data-q="${Q.id}" data-v="${val}">${esc(label)}</button>`).join("")}</div>`;
}
$("#quiz").addEventListener("click", e => {
  const opt = e.target.closest(".opt");
  if (opt) { quiz.answers[opt.dataset.q] = opt.dataset.v; return renderQuiz(); }
  if (e.target.closest("[data-back]")) {
    const qs = activeQuestions();
    delete quiz.answers[qs[nextIndex(qs) - 1].id];
    return renderQuiz();
  }
  if (e.target.closest("[data-use]")) {
    const p = buildPlan(quiz.answers);
    booking.pick(p.format, p.title, p.window);
    $("#booking").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (e.target.closest("[data-restart]")) { quiz.answers = {}; renderQuiz(); }
});

/* ================= YORUMLAR ================= */
function initReviews() {
  const reviews = SITE.reviews;
  if (!reviews.length) return;
  $("#yorumlar").hidden = false;
  showLinks("yorumlar");
  if (BIZ.rating) {
    const stars = $("#stars");
    stars.textContent = "★".repeat(Math.round(BIZ.rating));
    stars.setAttribute("aria-label", `Google'da ${String(BIZ.rating).replace(".", ",")} puan`);
    stars.hidden = false;
  }
  $(".qnav").hidden = reviews.length < 2;
  let i = 0, timer = null;
  const text = $("#q-text"), who = $("#q-who"), dots = $("#q-dots");
  const paint = () => {
    const r = reviews[i];
    text.textContent = `“${r.text}”`;
    who.innerHTML = `${esc(r.who)} <span>· Google yorumu</span>`;
    dots.innerHTML = reviews.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  };
  const show = n => {
    i = (n + reviews.length) % reviews.length;
    text.classList.add("fade");
    setTimeout(() => { paint(); text.classList.remove("fade"); }, 250);
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); };
  $("#q-prev").addEventListener("click", () => { show(i - 1); auto(); });
  $("#q-next").addEventListener("click", () => { show(i + 1); auto(); });
  paint();
  if (reviews.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) auto();
}

fillText();
bindImages();
bindBasics();
initMenu();
initTeam();
booking.render();
renderQuiz();
initReviews();
initPhoto();
initReformer();
