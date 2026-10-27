'use strict';
// CI-only browser checks. All uploaded buffers and screenshots use invented data.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const L=require('../web/logic.js'),{fixture,nativeFixture}=require('./test_logic.js');
(async()=>{
 const root=path.resolve(__dirname,'../dist'),server=http.createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname.split('/').pop()||'index.html';if(!['index.html','app.js','logic.js','adapter.js','styles.css'].includes(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(path.join(root,file)));}catch{res.writeHead(500);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage(),url='http://127.0.0.1:'+server.address().port+'/CobroClaudeTeams/',errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.clock.install({time:new Date('2026-10-26T15:00:00Z')});
 await page.goto(url);assert(await page.locator('#access').isVisible());assert(!await page.locator('#dashboard').isVisible());
 await fs.mkdir('test-results',{recursive:true});
 for(const [width,height,label]of [[1440,1000,'desktop-access'],[390,844,'mobile-access']]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/'+label+'.png',fullPage:true});}
 const t=fixture();t.INTEGRANTES[0].nombre='<img src=x onerror=alert(1)>';
 const buffers=Object.entries(L.schemas).map(([name,headers])=>({name:name+'.csv',mimeType:'text/csv',buffer:Buffer.from([headers,...t[name].map(r=>headers.map(h=>r[h]))].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'))}));
 await page.locator('#files').setInputFiles(buffers);await page.locator('#dashboard').waitFor();assert.equal(await page.locator('#members img').count(),0);
 assert.equal(await page.locator('#pending').textContent(),'$100');
 for(const [width,height,label]of [[1440,1000,'desktop-dashboard'],[390,844,'mobile-dashboard']]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/'+label+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Preparar recordatorio',exact:true}).click();
 assert(!await page.locator('#whatsapp').isDisabled());assert(await page.locator('#record').isDisabled());
 const popup=page.waitForEvent('popup');await page.route('https://wa.me/**',route=>route.fulfill({body:'Mock WhatsApp: no envío'}));
 await page.locator('#whatsapp').click();const opened=await popup;await opened.close();
 await page.locator('#close').click();assert.equal(await page.locator('#gestiones').innerText(),'Sin gestiones registradas.');
 await page.getByRole('button',{name:'Preparar recordatorio',exact:true}).click();await page.locator('#confirmed').check();await page.locator('#record').click();
 assert((await page.locator('#gestiones').innerText()).includes('Declaración manual'));assert.equal(await page.locator('#pending').textContent(),'$100');
 await page.locator('#period').selectOption({label:'2026-11'});assert.equal(await page.locator('#members button:not([disabled])').count(),0);
 await page.locator('#logout').click();assert(!await page.locator('#dashboard').isVisible());assert.equal(await page.locator('#members').innerText(),'');
 assert(!requests.some(u=>u.includes('google')),'Local mode must not contact Google');
 // Simulate GIS and Sheets responses, never use real credentials.
 await page.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'application/javascript',body:"window.google={accounts:{oauth2:{initTokenClient:function(c){return {requestAccessToken:function(){c.callback({access_token:'synthetic-test-value',expires_in:60});}}},hasGrantedAllScopes:function(){return true},revoke:function(t,cb){cb()}}}};"}));
 let reads=0;
 await page.route('https://sheets.googleapis.com/**',route=>{reads++;assert.equal(route.request().method(),'GET');assert.equal(route.request().headers().authorization,'Bearer synthetic-test-value');return route.fulfill({json:{valueRanges:Object.values(nativeFixture()).map(values=>({values}))}});});
 await page.locator('#client').fill('synthetic.apps.googleusercontent.com');await page.locator('#sheet').fill('synthetic-sheet-identifier-only');
 await page.locator('#connect').click();await page.getByRole('button',{name:'Autorizar lectura con Google ↗'}).click();await page.locator('#dashboard').waitFor();assert.equal(reads,1);
 await page.clock.fastForward(51000);assert(!await page.locator('#dashboard').isVisible());assert.equal(await page.locator('#message').inputValue(),'');
 await page.reload();assert(await page.locator('#access').isVisible());assert.deepEqual(errors,[]);
 console.log('Browser: desktop/mobile layout, CSV, XSS, manual WhatsApp, accounting isolation, mocked OAuth read/expiry and reload passed.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
