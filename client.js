import * as cloud from './cloud.js';
import { roomArt, pingArt, heroArt } from './art.js';
import { charge } from './finance.js';

const $=q=>document.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('ar-EG',{maximumFractionDigits:2,minimumFractionDigits:2})+' ج.م';
const time=n=>n?new Date(n).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'}):'—';
const bookingLabels={pending:'في انتظار الموافقة',approved:'تم الحجز',in_progress:'الجلسة شغالة',completed:'جلسة مكتملة · فاتورة مسجلة',rejected:'تم رفض الطلب',cancelled:'طلب ملغي'};
const bookingStyles={pending:'yellow',approved:'yellow',in_progress:'red',completed:'green',rejected:'red',cancelled:'red'};
const ui={units:[],sessions:[],bookings:[],venueName:'GAME HUB'};
let chosenFilter='all',customer=null,removeListeners=null,loading=false;
function toast(message,isError=false){const n=document.createElement('div');n.className='toast'+(isError?' error':'');n.textContent=message;$('#toasts').appendChild(n);setTimeout(()=>n.remove(),5200)}
function active(u){return Boolean(u.activeSessionId)}
function status(u){return active(u)?'red':u.reserved?'yellow':'green'}
function statusLabel(u){return active(u)?'مشغول':u.reserved?'محجوز':'متاح'}
function modal(content){$('#modalContent').innerHTML=content;$('#modalLayer').classList.remove('hidden')}
function closeModal(){$('#modalLayer').classList.add('hidden')}
function updateUser(){
 $('#accountName').textContent=customer?.name||'عميل';
 $('#avatar').textContent=(customer?.name||'GH').trim().charAt(0).toUpperCase();
 $('#helloCard').innerHTML=`<span>✅ أهلاً يا <b>${esc(customer?.name)}</b>، بياناتك محفوظة</span><span style="font-size:11px">${cloud.auth.currentUser?.isAnonymous?'حساب على نفس المتصفح':'حساب مؤمّن'}</span>`;
}
function showWelcome(visible=true){$('#welcomeLayer').classList.toggle('hidden',!visible);}
function renderPlaces(){
 const list=ui.units.filter(u=>chosenFilter==='all'||u.kind===chosenFilter);
 $('#placeCards').innerHTML=list.map(u=>{
  const busy=active(u)||u.reserved;
  const isRed=active(u),fakeUnit={...u,reserved:!isRed&&u.reserved};
  // The art helper chooses red for active sessions, yellow for reservations, green for free.
  const svg=u.kind==='ps'?roomArt(fakeUnit,isRed?{id:u.activeSessionId}:null):pingArt(fakeUnit,isRed?{id:u.activeSessionId}:null);
  return `<article class="card"><div class="card-top"><div><h3>${esc(u.name)}</h3><small>${u.kind==='ps'?'PlayStation Suite':'Ping Pong Station'} · ${esc(u.id)}</small></div><span class="status ${status(u)}">${statusLabel(u)}</span></div><div class="card-art">${svg}</div><div class="card-footer"><div class="card-price"><small>سعر الساعة</small><b>${money(u.hourlyRate)}</b></div><button type="button" class="btn ${busy?'':'primary'}" data-book="${esc(u.id)}" ${busy?'disabled':''}>${busy?'غير متاح':'اطلب حجز'}</button></div></article>`;
 }).join('')||'<div class="empty">مفيش أماكن ظاهرة بالفلتر ده.</div>';
 const available=ui.units.filter(u=>!u.reserved&&!active(u)).length;
 $('#statAvailable').textContent=available;
}
function renderBookings(){
 const bs=ui.bookings;
 $('#statBookings').textContent=bs.filter(b=>['pending','approved','in_progress'].includes(b.status)).length;
 $('#bookingList').innerHTML=bs.length?bs.map(b=>`<div class="history-item"><div><strong>${esc(b.unitName||b.unitId)}</strong><p>طلب ${Number(b.minutes||0)} دقيقة · ${time(b.createdAt)}</p><span class="status ${bookingStyles[b.status]||'yellow'}">${bookingLabels[b.status]||esc(b.status)}</span></div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>${money(charge(Number(b.minutes||1),Number(b.requestedRate||0)))}</b>${b.status==='pending'?`<button class="btn danger" data-cancel="${esc(b.id)}">إلغاء الطلب</button>`:''}</div></div>`).join(''):'<div class="empty">لسه معندكش حجوزات. اختار روم من فوق وابدأ.</div>';
}
function renderSessions(){
 const sessions=ui.sessions;
 const done=sessions.filter(s=>s.endedAt);
 const total=done.reduce((a,s)=>a+Number(s.amount||0),0);
 $('#statSessions').textContent=done.length;
 $('#totalSpent').textContent='إجمالي الفواتير: '+money(total);
 $('#sessionList').innerHTML=sessions.length?sessions.map(s=>`<div class="history-item"><div><strong>${esc(s.unitName||s.unitId)}</strong><p>${s.mode==='fixed'?'وقت محدد':'وقت مفتوح'} · البداية ${time(s.startedAt)} ${s.endedAt?'· النهاية '+time(s.endedAt):''}</p><span class="status ${s.endedAt?'green':'red'}">${s.endedAt?'جلسة مكتملة':'شغالة الآن'}</span></div><div class="history-amount">${s.endedAt?money(s.amount):'جاري الحساب...'}</div></div>`).join(''):'<div class="empty">مفيش جلسات مسجلة على حسابك لسه. أول ما الإدارة تبدأ حجزك هتظهر هنا.</div>';
}
function render(){renderPlaces();renderBookings();renderSessions();}
function handleRealtime(next){Object.assign(ui,next);render();}
function watch(){if(removeListeners)removeListeners();removeListeners=cloud.watchCustomer(handleRealtime,e=>toast('مشكلة اتصال بقاعدة البيانات: '+cloud.errorText(e),true));}
async function profileReady(){
 customer=await cloud.profile();
 if(customer){updateUser();showWelcome(false);watch();}
 else {$('#welcomeInfo').textContent='الاسم بيتحفظ في Firebase Cloud Firestore على حسابك. لو عندك حساب قديم بإيميل، اضغط تسجيل الدخول بدل كتابة الاسم.';showWelcome(true);}
}
function bookModal(u){
 if(!u || u.activeSessionId || u.reserved)return toast('المكان مش متاح حاليًا.',true);
 modal(`<div class="eyebrow">RESERVATION REQUEST</div><h2 id="modalTitle">حجز ${esc(u.name)}</h2><p>الطلب هيتبعت للإدارة، والحجز مش بيتأكد إلا بعد الموافقة. سعر الساعة الحالي ${money(u.hourlyRate)}.</p><form id="bookingForm"><label for="bookingMinutes">عايز تلعب كام دقيقة؟</label><input id="bookingMinutes" required type="number" inputmode="numeric" min="1" max="1440" step="1" value="60"/><div class="notice" id="estimate">التكلفة المتوقعة: ${money(u.hourlyRate)}</div><div class="footer-actions"><button class="btn primary" type="submit" id="confirmBooking">إرسال طلب الحجز</button><button type="button" class="btn" id="cancelBookingModal">رجوع</button></div></form>`);
 $('#bookingMinutes').addEventListener('input',()=>{
  const n=Number($('#bookingMinutes').value);$('#estimate').textContent=Number.isInteger(n)&&n>0&&n<=1440?'التكلفة المتوقعة: '+money(charge(n,u.hourlyRate)):'اكتب مدة صحيحة';
 });
 $('#cancelBookingModal').onclick=closeModal;
 $('#bookingForm').onsubmit=async e=>{
  e.preventDefault();if(loading)return;const minutes=Number($('#bookingMinutes').value);
  loading=true;$('#confirmBooking').disabled=true;
  try{await cloud.requestBooking(u.id,minutes);closeModal();toast('طلب الحجز اتبعت للإدارة. هتلاقي حالته في حجوزاتي.');}
  catch(err){toast(cloud.errorText(err),true)}finally{loading=false;if($('#confirmBooking'))$('#confirmBooking').disabled=false}
 };
}
function accountModal(){
 const secured=!cloud.auth.currentUser?.isAnonymous;
 modal(`<div class="eyebrow">MY ACCOUNT</div><h2 id="modalTitle">حساب ${esc(customer?.name||'')}</h2><p>اسمك محفوظ، ومش هنسألك عليه تاني طول ما بتستخدم نفس الحساب.</p><div class="saved-user"><span>حالة الحساب</span><strong>${secured?'🔒 مؤمّن بالإيميل':'🌿 ضيف محفوظ على الجهاز'}</strong></div>${secured?'<p class="notice">تقدر تدخل من جهاز تاني بنفس الإيميل وكلمة السر.</p>':`<p class="notice alert">الحساب الحالي محفوظ في نفس المتصفح فقط. لو مسحت بيانات المتصفح أو غيرت الجهاز ممكن تفقد الوصول لحجوزاتك. اربطه بإيميل وكلمة سر للحفاظ على نفس الحساب.</p><form id="secureForm"><label for="secureEmail">الإيميل</label><input id="secureEmail" type="email" required autocomplete="email" placeholder="you@example.com"/><label for="securePassword">كلمة السر (6 أحرف على الأقل)</label><input id="securePassword" type="password" required minlength="6" autocomplete="new-password"/><button class="btn primary" style="width:100%;margin-top:18px" type="submit" id="saveCredentials">تأمين الحساب</button></form>`}<button id="logoutCustomer" class="btn danger" style="width:100%;margin-top:18px">${secured?'تسجيل خروج':'بدء حساب ضيف جديد (لا يمكن استرجاع القديم بدون ربطه)'}</button>`);
 if(!secured){
  $('#secureForm').onsubmit=async e=>{e.preventDefault();if(loading)return;loading=true;$('#saveCredentials').disabled=true;
   try{await cloud.secureCustomerAccount($('#secureEmail').value.trim(),$('#securePassword').value);toast('الحساب اتربط بالإيميل بنجاح.');closeModal();updateUser()}
   catch(err){toast(cloud.errorText(err),true)}finally{loading=false;if($('#saveCredentials'))$('#saveCredentials').disabled=false}
  };
 }
 $('#logoutCustomer').onclick=async()=>{
  if(!secured&&!confirm('متأكد؟ حساب الضيف ومعلوماته على المتصفح ده مش هتعرف ترجعهم بعد تسجيل الخروج إلا لو ربطته بإيميل.'))return;
  try{if(removeListeners){removeListeners();removeListeners=null}await cloud.logout();closeModal();location.reload()}
  catch(err){toast(cloud.errorText(err),true)}
 };
}
async function init(){
 $('#heroArt').innerHTML=heroArt();
 if(location.protocol==='file:'){
  $('#welcomeInfo').textContent='لازم تفتح الموقع من localhost، مش من ملف HTML مباشرة. اقرأ README.md.';
  $('#saveNameButton').disabled=true;return;
 }
 try{await cloud.ensureCustomer();await profileReady();}
 catch(err){$('#welcomeInfo').textContent='تعذّر تشغيل Firebase: '+cloud.errorText(err)+' راجع خطوات تفعيل Authentication وFirestore ونطاق الموقع في README.';$('#saveNameButton').disabled=true;toast(cloud.errorText(err),true)}
}
$('#filterTabs').addEventListener('click',e=>{
 const btn=e.target.closest('[data-filter]');if(!btn)return;
 chosenFilter=btn.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(n=>n.classList.toggle('active',n===btn));renderPlaces();
});
$('#placeCards').addEventListener('click',e=>{const btn=e.target.closest('[data-book]');if(!btn)return;bookModal(ui.units.find(u=>u.id===btn.dataset.book));});
$('#bookingList').addEventListener('click',async e=>{
 const btn=e.target.closest('[data-cancel]');if(!btn || loading)return;
 if(!confirm('تأكيد إلغاء طلب الحجز؟'))return;
 loading=true;btn.disabled=true;
 try{await cloud.cancelPendingBooking(btn.dataset.cancel);toast('تم إلغاء طلب الحجز.');}
 catch(err){toast(cloud.errorText(err),true)}finally{loading=false;btn.disabled=false}
});
$('#accountButton').addEventListener('click',()=>{if(customer)accountModal();else showWelcome(true)});
$('#closeModal').onclick=closeModal;
$('#modalLayer').addEventListener('click',e=>{if(e.target.id==='modalLayer')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
$('#nameForm').onsubmit=async e=>{
 e.preventDefault();if(loading)return;loading=true;$('#saveNameButton').disabled=true;
 try{await cloud.saveCustomerName($('#customerName').value);await profileReady();toast('أهلاً بيك! اسمك اتحفظ في قاعدة البيانات.');}
 catch(err){$('#welcomeInfo').textContent=cloud.errorText(err)}finally{loading=false;$('#saveNameButton').disabled=false}
};
$('#existingAccountButton').onclick=()=>$('#existingLogin').classList.toggle('hidden');
$('#existingLoginForm').onsubmit=async e=>{
 e.preventDefault();if(loading)return;loading=true;
 try{await cloud.customerEmailLogin($('#oldEmail').value.trim(),$('#oldPassword').value);await profileReady();toast('تم تسجيل الدخول لحسابك القديم.');}
 catch(err){$('#welcomeInfo').textContent=cloud.errorText(err)}finally{loading=false}
};
init();
