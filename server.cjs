'use strict';
// Static server only. Authentication and all database writes happen via Firebase SDK.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||3000),host='127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535){console.error('GAME HUB: رقم PORT غير صحيح.');process.exit(1);}
const map={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ico':'image/x-icon','.png':'image/png'};
const allowed=new Set(['index.html','admin.html','client.html','client.js','cloud.js','firebase-config.js','finance.js','art.js']);
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,`http://${host}:${port}`);
 const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
 if(req.method!=='GET'||!allowed.has(file)){res.writeHead(404);res.end('Not found');return}
 fs.readFile(path.join(root,file),(err,buf)=>{
  if(err){res.writeHead(500);res.end('Cannot read file');return}
  res.writeHead(200,{'Content-Type':map[path.extname(file)]||'text/plain','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"frame-ancestors 'none'"});res.end(buf)
 });
});
server.on('error',err=>{
 if(err.code==='EADDRINUSE')console.error(`GAME HUB: المنفذ ${port} مشغول. اقفل السيرفر القديم أو غيّر PORT.`);
 else console.error('GAME HUB: فشل تشغيل الخادم:',err.message);
 process.exitCode=1;
});
server.listen(port,host,()=>console.log(`GAME HUB FIREBASE: http://${host}:${port}`));
