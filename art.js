function artStatus(unit,session){return session?'busy':unit?.reserved?'reserved':'available'}
function roomArt(unit,session){
 const id=String(unit?.id||'hero').replace(/[^a-z0-9]/gi,'');
 const status=artStatus(unit,session),accent=status==='busy'?'#e05259':status==='reserved'?'#e3a728':'#1cbd72';
 const variant=(Number(String(unit?.id||'1').replace(/\D/g,''))||1)%3;
 const chair=variant===0?'#0f5066':variant===1?'#334e67':'#2c6474';
 const screen=variant===2?'#2a86ad':'#17649d';
 return `<svg class="diorama" viewBox="0 0 340 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="غرفة ألعاب مجسمة فيها كنبة ومكتب وتلفزيون وبلايستيشن، حالة المكان ${status==='busy'?'مشغول':status==='reserved'?'محجوز':'متاح'}">
  <defs>
   <linearGradient id="floor${id}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#d9e6e5"/></linearGradient>
   <linearGradient id="wall${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9fcfe"/><stop offset="1" stop-color="#dcebf2"/></linearGradient>
   <linearGradient id="tv${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0d243a"/><stop offset=".53" stop-color="${screen}"/><stop offset="1" stop-color="#48c5b5"/></linearGradient>
   <linearGradient id="sofa${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${chair}"/><stop offset="1" stop-color="#122b3e"/></linearGradient>
   <filter id="soft${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <ellipse cx="170" cy="211" rx="142" ry="14" fill="#31506b" opacity=".11" filter="url(#soft${id})"/>
  <!-- Architectural floor and two raised walls -->
  <path d="M21 113 166 35 322 114 176 202Z" fill="url(#floor${id})" stroke="#b1cbd4" stroke-width="1.5"/>
  <path d="M21 113 176 202V219L21 129Z" fill="#c0d5d8"/>
  <path d="M176 202 322 114V130L176 219Z" fill="#8daebb"/>
  <path d="M21 113 166 35V2L21 80Z" fill="#d3e7e8"/>
  <path d="M166 35 322 114V81L166 2Z" fill="url(#wall${id})"/>
  <path d="M26 84 166 11M170 12 315 84" stroke="#fff" stroke-opacity=".67" stroke-width="2"/>
  <!-- Accent LEDs along corners, changing based on live status -->
  <path d="M31 114 166 42 313 116" fill="none" stroke="${accent}" stroke-width="3.5" stroke-linejoin="round" opacity=".65"/>
  <path d="M32 82 32 105" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
  <circle cx="32" cy="79" r="4" fill="${accent}"/>
  <!-- Decorative wall slats / large window -->
  <path d="M45 70 86 48V85L45 108Z" fill="#b9d8dd" stroke="#7ca6b3" stroke-width="2"/>
  <path d="M48 75 82 57V82L48 101Z" fill="#75b4c9" opacity=".65"/>
  <path d="M53 72V97M65 67V91M77 60V85" stroke="#e5faff" opacity=".8" stroke-width="2"/>
  <path d="M42 70 88 45" stroke="#fefefe" stroke-width="3"/>
  <!-- Frame and display on right wall -->
  <path d="M208 40 294 83V138L208 95Z" fill="#182a3e" stroke="#092033" stroke-width="2"/>
  <path d="M215 48 288 86V127L215 90Z" fill="url(#tv${id})"/>
  <path d="M218 87 241 73 265 99 286 90V125L218 90Z" fill="#5ad6b2" opacity=".3"/>
  <path d="M229 62 269 83" stroke="#a3edec" opacity=".48" stroke-width="3"/>
  <path d="M244 112 261 121" stroke="#47627b" stroke-width="3"/>
  <path d="M252 120V132" stroke="#2a425b" stroke-width="3"/>
  <path d="M239 135 255 127 272 135 256 144Z" fill="#1d3449"/>
  <path d="M245 135 258 128 269 134" fill="none" stroke="#41bda4" stroke-width="2"/>
  <!-- Woven rug -->
  <path d="m125 152 67-36 75 39-69 41Z" fill="#d4e7e9" stroke="#adcccd" stroke-width="1.5"/>
  <path d="m136 152 58-31 60 34-58 34Z" fill="#eaf5ef" opacity=".95"/>
  <path d="m147 149 47-25 49 29-47 27Z" fill="none" stroke="#b5d4cd" stroke-dasharray="3 3"/>
  <!-- Sofa legs -->
  <path d="M76 161v11M157 202v11M198 165v10" stroke="#182c3b" stroke-width="4"/>
  <!-- Sofa back, armrests, cushions, 3D shading -->
  <path d="m52 125 84-45 76 41-83 47Z" fill="url(#sofa${id})"/>
  <path d="m52 125 77 43v21L52 146Z" fill="#17384d"/>
  <path d="m129 168 83-47v21l-83 47Z" fill="#0d2939"/>
  <path d="m65 123 69-37 63 35-70 38Z" fill="#426f81"/>
  <path d="m74 126 56-30 27 15-57 31Z" fill="#6b9ba3"/>
  <path d="m105 143 58-31 25 13-58 33Z" fill="#4c8290"/>
  <path d="m70 138 61 34v12l-61-33Z" fill="#2c586e"/>
  <path d="m129 172 66-37v13l-66 36Z" fill="#21465b"/>
  <path d="m51 125 19-11 17 10-19 11v26l-17-9Z" fill="#315f71"/>
  <path d="m178 134 19-11 17 9-19 12v23l-18-10Z" fill="#24465d"/>
  <path d="M99 125 114 117l15 8-15 8Z" fill="#ffcc80" opacity=".88"/>
  <path d="M142 123 156 115l13 7-14 8Z" fill="#b0e0d7"/>
  <!-- Coffee table -->
  <path d="m194 165 29-15 37 19-29 17Z" fill="#d3ad7d" stroke="#af8357" stroke-width="1.5"/>
  <path d="m194 165 37 21v7l-37-20Z" fill="#9e7859"/>
  <path d="m231 186 29-17v8l-29 16Z" fill="#896950"/>
  <path d="M207 175v13M245 184v9" stroke="#65503f" stroke-width="3"/>
  <ellipse cx="225" cy="164" rx="6" ry="3" fill="#f9fafa" opacity=".9"/>
  <!-- Game console and plant -->
  <path d="m278 154 17-9 16 9-17 10Z" fill="#112f41"/>
  <path d="m278 154 16 10v19l-16-9Z" fill="#243e50"/>
  <path d="m294 164 17-10v19l-17 10Z" fill="#152a36"/>
  <path d="m283 164 7 4" stroke="${accent}" stroke-width="2"/>
  <path d="M44 135 60 126l14 8-16 9Z" fill="#bd8061"/>
  <path d="m44 135 14 8v16l-14-8Z" fill="#ac6c52"/>
  <path d="m58 143 16-9v16l-16 9Z" fill="#8e573f"/>
  <path d="M58 132q-18-21-11-33 14 11 11 33Zm2 0q5-26 20-29-1 24-20 29Zm-1 0q-10-30 3-36 9 21-3 36Z" fill="#318566"/>
  <!-- Live state lamp -->
  <circle cx="298" cy="76" r="11" fill="${accent}" opacity=".14"/>
  <circle cx="298" cy="76" r="5" fill="${accent}"/>
 </svg>`;
}
function pingArt(unit,session){
 const id=String(unit?.id||'ping').replace(/[^a-z0-9]/gi,'');
 const st=artStatus(unit,session),accent=st==='busy'?'#e05259':st==='reserved'?'#e3a728':'#1cbd72';
 return `<svg class="diorama" viewBox="0 0 340 236" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="طاولة بينج بونج مجسمة بلون أزرق وشبكة وكرات وحالة المكان ${st==='busy'?'مشغول':st==='reserved'?'محجوز':'متاح'}">
 <defs><linearGradient id="tab${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#287fa5"/><stop offset="1" stop-color="#0c4e73"/></linearGradient>
 <linearGradient id="slab${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fffd"/><stop offset="1" stop-color="#d8e9e7"/></linearGradient>
 <filter id="sha${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter></defs>
 <ellipse cx="172" cy="207" rx="139" ry="13" fill="#1b4b64" opacity=".12" filter="url(#sha${id})"/>
 <path d="M23 116 173 37 324 113 175 201Z" fill="url(#slab${id})" stroke="#b8d2d6" stroke-width="2"/>
 <path d="M23 116 175 201v18L23 134Z" fill="#bfd5d5"/>
 <path d="M175 201 324 113v18l-149 88Z" fill="#88b1bd"/>
 <path d="M23 116 173 37V6L23 85Z" fill="#d5e9e8"/>
 <path d="M173 37 324 113V82L173 6Z" fill="#eaf4f7"/>
 <path d="M31 117 173 42 314 113" fill="none" stroke="${accent}" stroke-width="4" opacity=".7"/>
 <!-- Sport décor -->
 <path d="M46 73 97 46 97 80 46 108Z" fill="#eaf4f3" stroke="#aac5ca" stroke-width="2"/>
 <path d="m63 79 6-19 9 10M78 70l7-17" stroke="#137899" stroke-width="2.5" fill="none"/>
 <circle cx="84" cy="59" r="5" fill="#eaac39"/>
 <!-- Table legs and frame -->
 <path d="m87 139 12-6v53l-12-7Z" fill="#3c6172"/>
 <path d="m251 122 12-6v60l-12 7Z" fill="#234459"/>
 <path d="m160 179 11-6v34l-11-7Z" fill="#23485c"/>
 <path d="m106 175 148-77" stroke="#173d55" stroke-width="6"/>
 <path d="M48 111 178 44 301 109 170 182Z" fill="url(#tab${id})" stroke="#e6f7f8" stroke-width="3"/>
 <path d="m48 111 122 71v10L48 121Z" fill="#0a4a70"/>
 <path d="m170 182 131-73v10l-131 73Z" fill="#0c3859"/>
 <!-- Table white border and center stripe -->
 <path d="M60 110 178 50 290 109 170 174Z" fill="none" stroke="#e7f9ff" stroke-width="2.5"/>
 <path d="M108 81 231 149" stroke="#e7f9ff" stroke-width="2"/>
 <path d="m110 140 128-70" stroke="#e7f9ff" stroke-width="1.8" opacity=".7"/>
 <!-- Raised net -->
 <path d="M112 71 238 139V112L112 45Z" fill="#e9faff" fill-opacity=".27" stroke="#e3f8ff" stroke-width="1.4"/>
 <path d="M112 45 238 112" stroke="#173d59" stroke-width="3"/>
 <path d="M112 45v26M238 112v27" stroke="#28475b" stroke-width="3.5"/>
 ${Array.from({length:8},(_,i)=>{const x=116+i*16,y=49+i*8.5;return `<path d="M${x} ${y}v24" stroke="#f2fcff" stroke-opacity=".6" stroke-width=".9"/>`}).join('')}
 <path d="m113 55 124 66m-124-58 124 66" stroke="#f2fcff" opacity=".4"/>
 <!-- Ball, paddles, scoreboard -->
 <circle cx="231" cy="91" r="5.7" fill="#ffc851" stroke="#ffffff" stroke-width="2"/>
 <ellipse cx="230" cy="100" rx="9" ry="3" fill="#0c3150" opacity=".17"/>
 <ellipse cx="88" cy="162" rx="12" ry="18" transform="rotate(-33 88 162)" fill="#e15b4c" stroke="#b53f36" stroke-width="2"/>
 <path d="m79 178-10 15" stroke="#bb8055" stroke-width="6" stroke-linecap="round"/>
 <ellipse cx="285" cy="176" rx="10" ry="16" transform="rotate(26 285 176)" fill="#1a83ad" stroke="#0d6289" stroke-width="2"/>
 <path d="m281 190 7 15" stroke="#b47c53" stroke-width="5" stroke-linecap="round"/>
 <path d="m266 72 33 16v18l-33-17Z" fill="#243e50"/>
 <path d="m272 80 7 4m6 3 7 4" stroke="#ffdf81" stroke-width="3"/>
 <circle cx="315" cy="84" r="5" fill="${accent}"/>
 </svg>`;
}
function heroArt(){return roomArt({id:'hero',reserved:false},null).replace('class="diorama"','class="hero-svg diorama"');}

export { roomArt, pingArt, heroArt };
