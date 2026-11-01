import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword,
  linkWithCredential, EmailAuthProvider, signOut, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  writeBatch, runTransaction, query, where, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { chargedMinutes, charge, validRate, validMinutes } from './finance.js';

// Separate browser auth sessions for the two websites even on the same domain.
const authSpace = location.pathname.endsWith('/admin.html') ? 'gamehub-admin' : 'gamehub-customer';
export const app = initializeApp(firebaseConfig, authSpace);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const byId = (snap) => ({ id: snap.id, ...snap.data() });
const stamp = () => new Date().toISOString();
const unitRef = (id) => doc(db, 'units', id);
const bookingRef = (id) => doc(db, 'bookings', id);
const sessionRef = (id) => doc(db, 'sessions', id);
const venueRef = doc(db, 'settings', 'venue');
const defaults = [
  ...Array.from({ length: 10 }, (_, i) => ({ id: `PS-${String(i + 1).padStart(2,'0')}`, name: `روم ${String(i + 1).padStart(2,'0')}`, kind: 'ps', hourlyRate: 30 })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `PING-${String(i + 1).padStart(2,'0')}`, name: `بينج بونج ${String(i + 1).padStart(2,'0')}`, kind: 'ping', hourlyRate: 30 }))
];
export function errorText(e) {
  const codes = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة السر غير صحيحة.',
    'auth/invalid-email': 'البريد الإلكتروني غير صالح.',
    'auth/email-already-in-use': 'الإيميل مستخدم بالفعل. استخدم تسجيل الدخول.',
    'auth/weak-password': 'كلمة السر قصيرة. استخدم 6 أحرف على الأقل.',
    'auth/operation-not-allowed': 'فعّل تسجيل الدخول المطلوب داخل Firebase Authentication.',
    'auth/unauthorized-domain': 'أضف نطاق الموقع لقائمة Authorized domains في Firebase.',
    'permission-denied': 'صلاحيات Firestore لا تسمح بتنفيذ العملية. راجع قواعد الحماية وحساب الإدارة.',
    unavailable: 'اتصال Firebase غير متاح حاليًا. تأكد من الإنترنت وإعدادات المشروع.',
    'failed-precondition': 'تأكد من إعداد Firestore والفهارس المطلوبة.'
  };
  return codes[e?.code] || e?.message || 'حدث خطأ غير متوقع.';
}
export async function authReady() {
  await setPersistence(auth, browserLocalPersistence);
  return await new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, (u) => { off(); resolve(u); }, (e) => { off(); reject(e); });
  });
}
export async function loginAdmin(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!(await isAdmin(result.user))) { await signOut(auth); throw Error('الحساب ده مش مدير. لازم تضيف UID الخاص بيه في admins بقاعدة Firestore.'); }
  return result.user;
}
export async function isAdmin(user = auth.currentUser) {
  if (!user || user.isAnonymous) return false;
  const snap = await getDoc(doc(db, 'admins', user.uid));
  return snap.exists() && snap.data().enabled === true;
}
export async function logout() { await signOut(auth); }
export async function ensureCustomer() {
  let user = await authReady();
  if (!user) user = (await signInAnonymously(auth)).user;
  return user;
}
export async function profile() {
  const user = auth.currentUser;
  if (!user) throw Error('سجّل الدخول أولاً.');
  const data = await getDoc(doc(db, 'users', user.uid));
  return data.exists() ? byId(data) : null;
}
export async function saveCustomerName(name) {
  name = String(name || '').trim();
  if (name.length < 2 || name.length > 50) throw Error('الاسم لازم يكون من حرفين إلى 50 حرف.');
  const user = auth.currentUser;
  if (!user) throw Error('لا يوجد حساب مسجّل.');
  const ref = doc(db, 'users', user.uid);
  // Make name immutable for customers after first registration, unless admin edits it.
  await runTransaction(db, async tx => {
    const old = await tx.get(ref);
    if (old.exists()) throw Error('الاسم مسجّل بالفعل؛ مش محتاج تكتبه تاني.');
    tx.set(ref, { name, createdAt: stamp() });
  });
}
export async function secureCustomerAccount(email, password) {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) throw Error('الحساب مؤمّن بالفعل أو مش جاهز.');
  if (password.length < 6) throw Error('كلمة السر لازم تكون 6 أحرف على الأقل.');
  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(user, credential);
}
export async function customerEmailLogin(email, password) {
  // An anonymous user's history stays with that anonymous UID unless explicitly linked.
  // Do not silently migrate or overwrite someone else's bookings.
  await signInWithEmailAndPassword(auth, email, password);
  return profile();
}

export async function initializeVenue() {
  if (!(await isAdmin())) throw Error('المدير بس يقدر يجهّز الرومات.');
  // Read *all* defaults before transactions writes. Already customized docs are untouched.
  await runTransaction(db, async tx => {
    const refs = defaults.map(u => unitRef(u.id));
    const snaps = [];
    for (const ref of refs) snaps.push(await tx.get(ref));
    const venue = await tx.get(venueRef);
    snaps.forEach((snap, i) => {
      if (!snap.exists()) {
        const u = defaults[i];
        tx.set(refs[i], { name: u.name, kind: u.kind, hourlyRate: u.hourlyRate,
          reserved: false, activeSessionId: null, bookingId: null, updatedAt: stamp() });
      }
    });
    if (!venue.exists()) tx.set(venueRef, { venueName: 'GAME HUB', updatedAt: stamp() });
  });
}
export async function adminSnapshot() {
  const [units, sessions, venue, bookings, users] = await Promise.all([
    getDocs(collection(db,'units')), getDocs(collection(db,'sessions')),
    getDoc(venueRef), getDocs(collection(db,'bookings')), getDocs(collection(db,'users'))
  ]);
  return {
    units: units.docs.map(byId).sort((a,b) => a.id.localeCompare(b.id)),
    sessions: sessions.docs.map(byId).sort((a,b) => (b.startedAt||'').localeCompare(a.startedAt||'')),
    settings: venue.exists() ? venue.data() : { venueName: 'GAME HUB' },
    bookings: bookings.docs.map(byId).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),
    users: users.docs.map(byId), storage: 'firebase', serverTime: stamp()
  };
}
export function listenAdmin(onChange, onError) {
  const unsubs = [];
  const cache = { units:[], sessions:[], bookings:[], users:[], settings:{venueName:'GAME HUB'} };
  let initialized = new Set();
  let queued = false;
  function notify() {
    if (initialized.size < 5 || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      onChange({ ...cache, units:[...cache.units].sort((a,b)=>a.id.localeCompare(b.id)),
        sessions:[...cache.sessions].sort((a,b)=>(b.startedAt||'').localeCompare(a.startedAt||'')),
        bookings:[...cache.bookings].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),
        storage:'firebase', serverTime:stamp() });
    });
  }
  const observe=(key, ref, transform)=> unsubs.push(onSnapshot(ref, snap => {
    cache[key] = transform(snap); initialized.add(key); notify();
  }, onError));
  observe('units', collection(db,'units'), snap => snap.docs.map(byId));
  observe('sessions', collection(db,'sessions'), snap => snap.docs.map(byId));
  observe('bookings', collection(db,'bookings'), snap => snap.docs.map(byId));
  observe('users', collection(db,'users'), snap => snap.docs.map(byId));
  observe('settings', venueRef, snap => snap.exists() ? snap.data() : {venueName:'GAME HUB'});
  return () => unsubs.forEach(fn=>fn());
}
function assertRate(n) { if (!validRate(n)) throw Error('سعر الساعة لازم يكون من 0 إلى 100000.'); return Math.round(Number(n)*100)/100; }
function assertName(name) { name=String(name||'').trim(); if(name.length<1||name.length>48) throw Error('اسم المكان غير صحيح.'); return name; }

export async function adminAction(endpoint, data = {}) {
  if (!(await isAdmin())) throw Error('هذه العملية متاحة للمدير المصرّح له فقط.');
  const now = stamp();
  const id = String(data.unitId || '');
  if (endpoint === '/api/start') {
    if (!['fixed', 'open'].includes(data.mode)) throw Error('نوع الجلسة غير صالح.');
    const minutes = data.mode==='fixed' ? Number(data.minutes) : null;
    if(data.mode==='fixed' && !validMinutes(minutes)) throw Error('مدة الجلسة من 1 إلى 1440 دقيقة.');
    const session = doc(collection(db,'sessions'));
    await runTransaction(db, async tx => {
      const uRef = unitRef(id), uSnap = await tx.get(uRef);
      if(!uSnap.exists()) throw Error('المكان غير موجود.');
      const u = uSnap.data();
      if(u.activeSessionId) throw Error('المكان فيه جلسة نشطة بالفعل.');
      if(u.reserved && (!u.bookingId || u.bookingId !== data.bookingId)) throw Error('المكان محجوز؛ ابدأ الجلسة من طلب العميل أو ألغِ الحجز.');
      let book = null, bRef = null;
      if(u.bookingId){bRef=bookingRef(u.bookingId);const bSnap=await tx.get(bRef);
        if(!bSnap.exists() || bSnap.data().status!=='approved')throw Error('حالة الحجز غير صحيحة.');
        book=bSnap.data(); }
      const rate=assertRate(data.rate===undefined?u.hourlyRate:data.rate);
      tx.set(session,{ unitId:id, unitName:u.name, kind:u.kind, mode:data.mode,
        startedAt:now, endedAt:null, bookedMinutes:minutes, chargedMinutes:null,
        hourlyRate:rate, amount:null, customerUid:book?.userId || null,
        bookingId:book?u.bookingId:null, createdAt:now });
      tx.update(uRef, { activeSessionId:session.id, reserved:false, bookingId:null, updatedAt:now });
      if(bRef)tx.update(bRef,{ status:'in_progress', sessionId:session.id, updatedAt:now });
    });
  } else if(endpoint==='/api/stop') {
    await runTransaction(db, async tx => {
      const uRef=unitRef(id), uSnap=await tx.get(uRef);
      if(!uSnap.exists() || !uSnap.data().activeSessionId)throw Error('مفيش جلسة شغالة.');
      const sRef=sessionRef(uSnap.data().activeSessionId), sSnap=await tx.get(sRef);
      if(!sSnap.exists() || sSnap.data().endedAt)throw Error('حالة الجلسة غير صحيحة.');
      const s=sSnap.data();
      const mins=chargedMinutes(s.mode,s.startedAt,now,s.bookedMinutes);
      const amount=charge(mins,s.hourlyRate);
      const bRef=s.bookingId?bookingRef(s.bookingId):null;
      let bSnap=null;if(bRef)bSnap=await tx.get(bRef);
      tx.update(sRef,{endedAt:now,chargedMinutes:mins,amount,updatedAt:now});
      tx.update(uRef,{activeSessionId:null,updatedAt:now});
      if(bRef && bSnap?.exists())tx.update(bRef,{status:'completed',amount,endedAt:now,updatedAt:now});
    });
  } else if(endpoint==='/api/reserve') {
    await runTransaction(db, async tx=> {
      const ref=unitRef(id),snap=await tx.get(ref);
      if(!snap.exists())throw Error('المكان غير موجود.');
      if(snap.data().activeSessionId)throw Error('ماينفعش تحجز مكان فيه جلسة شغالة.');
      if(snap.data().bookingId)throw Error('ده حجز عميل. إداره من صفحة طلبات العملاء.');
      if(typeof data.reserved!=='boolean')throw Error('حالة الحجز غير صحيحة.');
      tx.update(ref,{reserved:data.reserved,updatedAt:now});
    });
  } else if(endpoint==='/api/unit') {
    await updateDoc(unitRef(id),{name:assertName(data.name),hourlyRate:assertRate(data.rate),updatedAt:now});
  } else if(endpoint==='/api/rates') {
    if(!['ps','ping'].includes(data.kind))throw Error('نوع المكان غير معروف.');
    const rate=assertRate(data.rate), snap=await getDocs(query(collection(db,'units'),where('kind','==',data.kind)));
    const batch=writeBatch(db);snap.docs.forEach(s=>batch.update(s.ref,{hourlyRate:rate,updatedAt:now}));await batch.commit();
  } else if(endpoint==='/api/setting') {
    const venueName=String(data.venueName||'').trim();
    if(!venueName || venueName.length>50)throw Error('اسم المشروع غير صحيح.');
    await setDoc(venueRef,{venueName,updatedAt:now},{merge:true});
  } else if(endpoint==='/api/booking-approve' || endpoint==='/api/booking-reject' || endpoint==='/api/booking-cancel') {
    const bookingId=String(data.bookingId||'');
    await runTransaction(db, async tx => {
      const bRef=bookingRef(bookingId), bSnap=await tx.get(bRef);
      if(!bSnap.exists())throw Error('طلب الحجز غير موجود.');
      const b=bSnap.data();
      const uRef=unitRef(b.unitId),uSnap=await tx.get(uRef);
      if(!uSnap.exists())throw Error('الروم غير موجود.');
      const u=uSnap.data();
      if(endpoint==='/api/booking-approve'){
        if(b.status!=='pending')throw Error('الطلب ده اتراجع بالفعل.');
        if(u.activeSessionId || u.reserved)throw Error('المكان مش متاح للموافقة.');
        tx.update(bRef,{status:'approved',updatedAt:now});
        tx.update(uRef,{reserved:true,bookingId,updatedAt:now});
      } else if (endpoint==='/api/booking-reject') {
        if(b.status!=='pending')throw Error('يمكن رفض الطلبات المعلقة فقط.');
        tx.update(bRef,{status:'rejected',updatedAt:now});
      } else {
        if(b.status!=='approved' || u.bookingId!==bookingId)throw Error('الحجز مش في حالة تسمح بالإلغاء.');
        tx.update(bRef,{status:'cancelled',updatedAt:now});
        tx.update(uRef,{reserved:false,bookingId:null,updatedAt:now});
      }
    });
  } else if(endpoint==='/api/clear-history'){
    throw Error('حذف السجل متوقف لحماية الفواتير والأرباح المحفوظة.');
  } else throw Error('عملية غير مدعومة.');
  return adminSnapshot();
}

export function watchCustomer(onChange,onError) {
  const uid=auth.currentUser?.uid;
  if(!uid)throw Error('سجّل الدخول أولاً.');
  const cache={units:[],bookings:[],sessions:[],venueName:'GAME HUB'};
  const started=new Set();let pending=false;
  function notify(){if(started.size<4||pending)return;pending=true;queueMicrotask(()=>{pending=false;onChange({
    units:[...cache.units].sort((a,b)=>a.id.localeCompare(b.id)),
    bookings:[...cache.bookings].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')),
    sessions:[...cache.sessions].sort((a,b)=>(b.startedAt||'').localeCompare(a.startedAt||'')),
    venueName:cache.venueName
  });});}
  const listeners=[
    onSnapshot(collection(db,'units'),s=>{cache.units=s.docs.map(byId);started.add('units');notify();},onError),
    onSnapshot(query(collection(db,'bookings'),where('userId','==',uid)),s=>{cache.bookings=s.docs.map(byId);started.add('bookings');notify();},onError),
    onSnapshot(query(collection(db,'sessions'),where('customerUid','==',uid)),s=>{cache.sessions=s.docs.map(byId);started.add('sessions');notify();},onError),
    onSnapshot(venueRef,s=>{cache.venueName=s.exists()?s.data().venueName:'GAME HUB';started.add('venue');notify();},onError)
  ];
  return ()=>listeners.forEach(fn=>fn());
}
export async function requestBooking(unitId,minutes) {
  const user=auth.currentUser;if(!user)throw Error('سجّل الدخول أولاً.');
  const p=await profile();if(!p?.name)throw Error('اكتب اسمك الأول.');
  const duration=Number(minutes);
  if(!validMinutes(duration))throw Error('مدة الطلب لازم تكون من دقيقة إلى 1440 دقيقة.');
  const unit=await getDoc(unitRef(unitId));
  if(!unit.exists() || unit.data().reserved || unit.data().activeSessionId)throw Error('المكان مش متاح حاليًا.');
  const existing=await getDocs(query(collection(db,'bookings'),where('userId','==',user.uid)));
  if(existing.docs.some(d=>d.data().unitId===unitId && ['pending','approved','in_progress'].includes(d.data().status)))throw Error('عندك طلب نشط لنفس الروم بالفعل.');
  const newRef=doc(collection(db,'bookings'));
  await setDoc(newRef,{userId:user.uid,customerName:p.name,unitId,unitName:unit.data().name,
    minutes:duration,requestedRate:unit.data().hourlyRate,status:'pending',createdAt:stamp(),updatedAt:stamp()});
  return newRef.id;
}
export async function cancelPendingBooking(bookingId) {
  const user=auth.currentUser;
  if(!user)throw Error('سجّل الدخول أولاً.');
  await runTransaction(db,async tx=>{
    const ref=bookingRef(bookingId),snap=await tx.get(ref);
    if(!snap.exists()||snap.data().userId!==user.uid||snap.data().status!=='pending')throw Error('الطلب مش قابل للإلغاء.');
    tx.update(ref,{status:'cancelled',updatedAt:stamp()});
  });
}
