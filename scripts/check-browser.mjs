import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.QA_OUTPUT||path.join(root,'artifacts/browser');
let preview;
let siteUrl=process.env.SITE_URL;
if(!siteUrl){
 preview=spawn('python3',[path.join(root,'scripts/serve.py'),'--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
 siteUrl=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('No respondió el servidor local')),15000);preview.stdout.on('data',data=>{log+=data;const m=log.match(/Local: (http:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});preview.on('exit',code=>{clearTimeout(timer);reject(new Error('El servidor local terminó: '+code));});});
}
const profile=await mkdtemp(path.join(os.tmpdir(),'wiz-sunshine-check-'));
await mkdir(out,{recursive:true});
const chrome=spawn(process.env.CHROME_BIN||'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--hide-scrollbars','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='';
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Chrome no inició: '+stderr.slice(-700))),15000);
  chrome.stderr.on('data',chunk=>{stderr+=chunk;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
  chrome.on('exit',code=>{clearTimeout(timer);reject(new Error('Chrome terminó '+code+': '+stderr.slice(-700)));});
 });
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let next=0;const pending=new Map();const runtimeErrors=[];
 socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')runtimeErrors.push(msg.params.exceptionDetails.exception?.description||msg.params.exceptionDetails.text);});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Tiempo agotado: '+method));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(method,params={})=>send(method,params,sessionId);
 await call('Page.enable');await call('Runtime.enable');
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const settle=()=>evaluate('new Promise(r=>setTimeout(()=>requestAnimationFrame(()=>r(true)),650))');
 const checks=[];const assert=(name,pass,details)=>{checks.push({name,pass:!!pass,...(details===undefined?{}:{details})});if(!pass)throw new Error(name+': '+JSON.stringify(details));};
 const viewport=async(width,height=1050)=>{await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});await call('Emulation.setTouchEmulationEnabled',{enabled:width<900,maxTouchPoints:1});await settle();};
 await viewport(1440);
 const url=siteUrl;
 await call('Page.navigate',{url});
 for(let i=0;i<50;i++){if(await evaluate('document.readyState==="complete"'))break;await new Promise(r=>setTimeout(r,100));}
 await evaluate('document.fonts.ready.then(()=>true)');await settle();
 assert('Título de la marca',await evaluate('document.title.startsWith("Wiz Sunshine")'));
 assert('Fuentes y medios locales cargados',await evaluate('document.fonts.check("650 20px Manrope") && Array.from(document.images).filter(i=>i.loading!=="lazy").every(i=>i.complete&&i.naturalWidth>0)'));
 const shot=async name=>{await settle();const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});await writeFile(out+'/'+name,Buffer.from(r.data,'base64'));};
 await shot('01-inicio-escritorio.png');
 await evaluate('window.scrollTo({top:document.getElementById("trabajos").offsetTop-24,behavior:"instant"})');await shot('02-proyectos-escritorio.png');
 for(const key of ['vueltito','baltica','ladece']){
  await evaluate('document.querySelector("[data-project='+key+']").click()');await settle();
  const data=await evaluate('({open:document.getElementById("project-dialog").open,title:document.getElementById("dialog-title").textContent,status:document.getElementById("dialog-status").textContent,items:document.querySelectorAll("#dialog-scope li").length})');
  assert('Detalle de '+key,data.open&&data.title.length>5&&data.items>=3,data);assert('Ilustración del detalle '+key,await evaluate('document.querySelectorAll("#dialog-visual>.project-art").length===1'));
  if(key==='baltica')assert('Báltica enlaza a la tienda definitiva',await evaluate('!document.getElementById("dialog-external").hidden&&document.getElementById("dialog-external").href==="https://www.balticaaccesorios.com.ar/"'));
  if(key==='ladece'){assert('ERP completo identificado como proyecto futuro',data.status==='En planificación'&&data.items===6,data);await shot('03-ladece-erp.png');}
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await settle();
  assert('Escape cierra '+key,await evaluate('!document.getElementById("project-dialog").open && !document.body.classList.contains("dialog-open")'));
 }
 await evaluate('document.querySelectorAll("details.service summary")[1].click()');await settle();
 assert('Servicios desplegables',await evaluate('document.querySelectorAll("details.service[open]").length===1&&document.querySelectorAll("details.service")[1].open'));
 await evaluate('document.querySelector("#brief-form [name=name]").value="Persona de muestra";document.querySelector("#brief-form [name=business]").value="Proyecto de ejemplo";document.querySelector("#brief-form [name=message]").value="Queremos ordenar los pedidos y conectar el stock con la administración.";document.getElementById("brief-form").requestSubmit()');await settle();
 assert('La consulta se prepara con los datos ingresados',await evaluate('document.getElementById("brief-dialog").open&&document.getElementById("brief-text").value.includes("Persona de muestra")&&document.getElementById("brief-text").value.includes("sistema de gestión o ERP")'));
 assert('Consulta lista para abrir en el WhatsApp definitivo',await evaluate('(()=>{const a=document.getElementById("send-brief"),url=new URL(a.href);return !a.hidden&&url.origin==="https://wa.me"&&url.pathname==="/5493364405007"&&url.searchParams.get("text")===document.getElementById("brief-text").value})()'));
 assert('WhatsApp de contacto visible y correcto',await evaluate('!document.getElementById("contact-address").hidden&&document.querySelector("#contact-address a").href==="https://wa.me/5493364405007"'));
 await evaluate('document.getElementById("brief-text").value+="\\nPodemos empezar conversando.";document.getElementById("brief-text").dispatchEvent(new Event("input",{bubbles:true}))');
 assert('Consulta editable',await evaluate('document.getElementById("brief-text").value.endsWith("Podemos empezar conversando.")'));
 assert('WhatsApp conserva el mensaje después de editarlo',await evaluate('new URL(document.getElementById("send-brief").href).searchParams.get("text")===document.getElementById("brief-text").value'));
 await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.__testClipboard=text;}}});document.getElementById("copy-brief").click()');await settle();
 assert('Copia de la consulta en un portapapeles de prueba',await evaluate('window.__testClipboard===document.getElementById("brief-text").value&&document.getElementById("copy-status").textContent.includes("copiada")'));
 await evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw new Error("denied for test");}}});document.getElementById("copy-brief").click()');await settle();
 assert('Alternativa cuando el portapapeles no está permitido',await evaluate('document.getElementById("brief-text").selectionEnd===document.getElementById("brief-text").value.length&&document.getElementById("copy-status").textContent.includes("Seleccionamos")'));
 await evaluate('delete navigator.clipboard');
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:path.join(out,'downloads')});
 await evaluate('document.getElementById("download-brief").click()');
 let downloaded='';for(let attempt=0;attempt<30;attempt++){try{downloaded=await readFile(path.join(out,'downloads/mi-idea-para-wiz-sunshine.txt'),'utf8');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert('Descarga de consulta completa',downloaded===await evaluate('document.getElementById("brief-text").value'));
 await evaluate('document.getElementById("brief-dialog").close()');await settle();
 for(const width of [320,360,390,412,768,1440]){
  await viewport(width);const box=await evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})');assert('Sin desborde horizontal a '+width,box.document<=box.viewport,box);
 }
 await viewport(320,780);await evaluate('window.scrollTo({top:0,behavior:"instant"})');await shot('11-inicio-320.png');
 assert('Título de portada completo en el ancho mínimo',await evaluate('document.getElementById("hero-title").scrollWidth<=document.getElementById("hero-title").clientWidth'));
 await evaluate('document.querySelector("[data-project=ladece]").click()');await settle();
 assert('Detalle de proyecto dentro del celular',await evaluate('(()=>{const d=document.getElementById("project-dialog"),r=d.getBoundingClientRect();return d.scrollWidth<=d.clientWidth&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.contains(document.activeElement)})()'));
 await shot('12-detalle-celular.png');
 await evaluate('document.getElementById("project-dialog").querySelector("[data-close-dialog]").click();document.getElementById("brief-form").requestSubmit()');await settle();
 assert('Consulta legible y editable en celular',await evaluate('(()=>{const d=document.getElementById("brief-dialog");return d.open&&d.scrollWidth<=d.clientWidth&&parseFloat(getComputedStyle(document.getElementById("brief-text")).fontSize)>=16})()'));
 await shot('13-consulta-celular.png');await evaluate('document.getElementById("brief-dialog").close()');await settle();
 await viewport(844,390);await evaluate('window.scrollTo({top:0,behavior:"instant"})');
 const landscape=await evaluate('({viewport:innerWidth,document:document.documentElement.scrollWidth})');assert('Vista horizontal de celular sin desborde',landscape.document<=landscape.viewport,landscape);
 await evaluate('document.querySelector("[data-project=ladece]").click();document.getElementById("project-dialog").scrollTop=10000');await settle();
 assert('Cierre del detalle accesible en horizontal',await evaluate('(()=>{const r=document.querySelector("#project-dialog [data-close-dialog]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.width>=44&&r.height>=44})()'));
 await evaluate('document.getElementById("project-dialog").querySelector("[data-close-dialog]").click()');await settle();
 await viewport(390,1050);await evaluate('window.scrollTo({top:0,behavior:"instant"})');await shot('04-inicio-celular.png');
 await evaluate('document.querySelector(".menu-button").click()');await settle();
 assert('Menú móvil abre',await evaluate('!document.getElementById("mobile-nav").hidden&&document.querySelector(".menu-button").getAttribute("aria-expanded")==="true"'));
 const touchControls=await evaluate('Array.from(document.querySelectorAll(".menu-button,.nav-contact,.hero-actions .button,.hero-actions .text-link,.scroll-link,.type-options label,.form-submit,.person-profile-link,.footer-bottom a,.footer-credit a")).map(e=>({tag:e.className||e.tagName,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})).filter(e=>e.height<43.5||e.width<43.5)');
 assert('Controles móviles de al menos 44 px',touchControls.length===0,touchControls);
 assert('Campos móviles de al menos 16 px',await evaluate('Array.from(document.querySelectorAll(".form-body input:not([type=radio]),.form-body textarea")).every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)'));
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:10,y:560}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle();
 assert('Menú cierra al tocar fuera',await evaluate('document.getElementById("mobile-nav").hidden'));
 await evaluate('document.querySelector(".menu-button").click()');await settle();

 await evaluate('document.querySelector("#mobile-nav a").click()');await settle();assert('Menú móvil cierra al navegar',await evaluate('document.getElementById("mobile-nav").hidden'));
 await evaluate('window.scrollTo({top:document.getElementById("trabajos").offsetTop-16,behavior:"instant"})');await shot('05-proyectos-celular.png');
 await evaluate('window.scrollTo({top:document.getElementById("hablemos").offsetTop-16,behavior:"instant"})');await shot('06-contacto-celular.png');
 await viewport(1440,1050);await evaluate('window.scrollTo({top:document.getElementById("equipo").offsetTop-15,behavior:"instant"})');await settle();
 assert('Avatares correctos y cargados',await evaluate('Array.from(document.querySelectorAll(".person-avatar")).every(i=>i.complete&&i.naturalWidth>0)&&document.querySelector(".sol-art img").naturalWidth===460&&document.querySelector(".lucio-art img").naturalWidth===192'));
 assert('Referencia elegida para Mago',await evaluate('document.querySelector(".lucio-art img").getAttribute("src")==="assets/people/lucio-mago.png"'));
 await shot('07-equipo-escritorio.png');
 await evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await shot('08-footer-escritorio.png');
 assert('Crédito solicitado',await evaluate('document.querySelector(".footer-credit").textContent.includes("Designed by")&&document.querySelector(".footer-credit a").textContent==="VT Security"&&document.querySelectorAll(".footer-credit img").length===2'));
 assert('Ilustraciones originales conservadas',await evaluate('!!document.querySelector(".work-grid .receipt")&&!!document.querySelector(".work-grid .shop-window")&&!!document.querySelector(".work-grid .erp-window")&&document.querySelectorAll(".work-grid img").length===0'));
 assert('Logo aprobado con fondo transparente integrado',await evaluate('Array.from(document.querySelectorAll(".brand>img")).every(i=>i.getAttribute("src")==="assets/logo-clear.png")'));
 assert('Logo grande en la portada',await evaluate('document.querySelector(".hero-logo").getBoundingClientRect().width>=150'));

 await viewport(390,1050);await evaluate('window.scrollTo({top:document.getElementById("equipo").offsetTop-15,behavior:"instant"})');await shot('09-equipo-celular.png');
 await evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await shot('10-footer-celular.png');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert('Preferencia de movimiento reducido',await evaluate('getComputedStyle(document.documentElement).scrollBehavior==="auto"'));
 assert('Sin excepciones JavaScript',runtimeErrors.length===0,runtimeErrors);
 const report={date:new Date().toISOString(),url,checks,screenshots:['01-inicio-escritorio.png','02-proyectos-escritorio.png','03-ladece-erp.png','04-inicio-celular.png','05-proyectos-celular.png','06-contacto-celular.png','07-equipo-escritorio.png','08-footer-escritorio.png','09-equipo-celular.png','10-footer-celular.png','11-inicio-320.png','12-detalle-celular.png','13-consulta-celular.png'],limitations:['Se verifica el enlace y el texto de WhatsApp sin abrir la aplicación ni enviar mensajes.','La copia se verifica con un portapapeles de prueba para no alterar el del usuario.','Los tamaños móviles y horizontales se emulan en Chrome; no es una prueba en dispositivos físicos.']};
 await writeFile(out+'/verification.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({ok:true,checks:checks.length,output:out}));
 await send('Browser.close');
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(socket&&socket.readyState===WebSocket.OPEN)socket.close();if(chrome.exitCode===null)chrome.kill('SIGTERM');if(preview&&preview.exitCode===null)preview.kill('SIGTERM');await new Promise(r=>setTimeout(r,300));await rm(profile,{recursive:true,force:true}).catch(()=>{});}
