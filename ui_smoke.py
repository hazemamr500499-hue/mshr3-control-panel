from pathlib import Path
import subprocess,time,base64
from playwright.sync_api import sync_playwright
root=Path('/mnt/data/GAME_HUB_FIREBASE_V4')
server=None
adminmock='''
const units=[...Array.from({length:10},(_,i)=>({id:'PS-'+String(i+1).padStart(2,'0'),name:'روم '+(i+1),kind:'ps',hourlyRate:30,reserved:i===2,activeSessionId:i===0?'sample':null})),...Array.from({length:4},(_,i)=>({id:'PING-'+String(i+1).padStart(2,'0'),name:'بينج بونج '+(i+1),kind:'ping',hourlyRate:40,reserved:false,activeSessionId:null}))];
let s={units,sessions:[{id:'sample',unitId:'PS-01',unitName:'روم 1',kind:'ps',mode:'fixed',startedAt:new Date().toISOString(),endedAt:null,bookedMinutes:60,hourlyRate:30,amount:null}],bookings:[{id:'book',unitId:'PS-03',unitName:'روم 3',customerName:'حازم',userId:'user1',minutes:60,status:'approved',createdAt:new Date().toISOString()}],users:[{id:'user1',name:'حازم'}],settings:{venueName:'GAME HUB'},storage:'firebase',serverTime:new Date().toISOString()};
export const auth={currentUser:{uid:'adm',isAnonymous:false}};
export const authReady=async()=>auth.currentUser;
export const isAdmin=async()=>true;
export const initializeVenue=async()=>{};
export const adminSnapshot=async()=>s;
export const listenAdmin=(cb,err)=>{cb(s);return ()=>{}};
export const adminAction=async(ep,p)=>{if(ep==='/api/booking-approve'){s.bookings[0].status='approved';s.units[2].reserved=true};return s};
export const loginAdmin=async()=>auth.currentUser;
export const logout=async()=>{};
export const errorText=e=>e.message;
'''
customermock='''
let saved=null;let onChange=null;
export const auth={currentUser:{uid:'user1',isAnonymous:true}};
export const ensureCustomer=async()=>auth.currentUser;
export const profile=async()=>saved;
export const saveCustomerName=async(name)=>{saved={id:'user1',name};};
export const errorText=e=>e.message;
export const watchCustomer=(cb,err)=>{onChange=cb;cb({units:[...Array.from({length:10},(_,i)=>({id:'PS-'+String(i+1).padStart(2,'0'),name:'روم '+(i+1),kind:'ps',hourlyRate:30,reserved:i===3,activeSessionId:i===4?'session':null})),...Array.from({length:4},(_,i)=>({id:'PING-'+String(i+1).padStart(2,'0'),name:'بينج بونج '+(i+1),kind:'ping',hourlyRate:35,reserved:false,activeSessionId:null}))],bookings:[],sessions:[],venueName:'GAME HUB'});return ()=>{};};
export const requestBooking=async()=>{return 'abc'};
export const cancelPendingBooking=async()=>{};
export const secureCustomerAccount=async()=>{auth.currentUser.isAnonymous=false};
export const customerEmailLogin=async()=>{saved={id:'user1',name:'حازم'};return saved};
export const logout=async()=>{};
'''
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for label,route_mock in [('admin',adminmock),('client',customermock)]:
   for device,width,height in [('desktop',1440,920),('mobile',390,844)]:
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    def data_uri(body):return 'data:text/javascript;base64,'+base64.b64encode(body.encode()).decode()
    if label=='admin':
     html=(root/'admin.html').read_text().replace("await import('./cloud.js')", "await import('"+data_uri(route_mock)+"')")
    else:
     script=(root/'client.js').read_text()
     script=script.replace("from './cloud.js'", "from '"+data_uri(route_mock)+"'")
     script=script.replace("from './art.js'", "from '"+data_uri((root/'art.js').read_text())+"'")
     script=script.replace("from './finance.js'", "from '"+data_uri((root/'finance.js').read_text())+"'")
     html=(root/'client.html').read_text().replace('<script type="module" src="./client.js"></script>', '<script type="module">'+script+'</script>')
    html=html.replace("@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');",'')
    page.set_content(html,wait_until='domcontentloaded',timeout=30000)
    if label=='client':
     page.locator('#customerName').fill('حازم')
     page.locator('#saveNameButton').click()
     page.wait_for_selector('#welcomeLayer',state='hidden',timeout=10000)
     page.locator('[data-book="PS-01"]').click()
     page.wait_for_selector('#bookingForm',timeout=2000)
     page.locator('#bookingMinutes').fill('25')
     assert '12.50' in page.locator('#estimate').inner_text() or '١٢٫٥٠' in page.locator('#estimate').inner_text(),page.locator('#estimate').inner_text()
     page.locator('#cancelBookingModal').click()
     assert page.locator('.card').count()==14
    else:
     page.wait_for_selector('.unit-card',timeout=20000)
     assert page.locator('.unit-card').count()==14,page.locator('.unit-card').count()
     page.locator('[data-nav="bookings"]').first.evaluate('(el)=>el.click()')
     page.wait_for_selector('[data-booking-admin="start"]',timeout=2000)
     page.locator('[data-nav="timers"]').first.evaluate('(el)=>el.click()')
    page.screenshot(path=str(root / ('preview-'+label+'-'+device+'.png')),full_page=label=='client')
    extent=page.evaluate('({body:document.body.scrollWidth,view:window.innerWidth})')
    print(label,device,'errors=',errors,'extent=',extent)
    assert not errors,(label,device,errors)
    assert extent['body']<=extent['view']+3,extent
    page.close()
  browser.close()
finally:
 pass
