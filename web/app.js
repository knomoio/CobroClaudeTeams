'use strict';
const CONFIG=Object.freeze({ENVIAR_MENSAJES:'NO',scope:'https://www.googleapis.com/auth/spreadsheets.readonly'});
const L=Cobros,$=id=>document.getElementById(id);
let data=null,source='',loaded=0,selected=null,token='',expiry=null,generation=0,busy=false,oauthClient=null;
const currency=v=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(v);
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function notice(text){$('notice').textContent=text;}
function wipe(){
 generation++;clearTimeout(expiry);token='';data=null;selected=null;oauthClient=null; $('connect').onclick=prepareGoogle; $('connect').textContent='Continuar con Google ↗'; $('connect').disabled=false;
 $('composer').close();for(const id of ['message','phrase','client','sheet'])$(id).value='';
 for(const id of ['members','history','gestiones','period','compose-title','reason','compose-status','source','period-info'])$(id).replaceChildren();
 for(const id of ['charged','recovered','pending'])$(id).textContent='—';
 $('files').value='';$('import-gestiones').value='';$('dashboard').hidden=true;$('access').hidden=false;$('logout').hidden=true;
}
$('logout').onclick=()=>{const old=token;wipe();if(old&&globalThis.google?.accounts?.oauth2)google.accounts.oauth2.revoke(old,()=>{});notice('Sesión cerrada. Se borraron los datos de esta página.');};
window.addEventListener('pagehide',()=>wipe());
window.addEventListener('pageshow',e=>{if(e.persisted)wipe();});
function enter(t,label){
 data=L.validate(t);source=label;loaded=Date.now();$('period').replaceChildren();
 const periods=[...data.PERIODOS].sort((a,b)=>b.periodo.localeCompare(a.periodo));for(const p of periods)$('period').append(el('option',p.periodo));
 const active=periods.find(p=>p.estado==='ACTIVO');if(active)$('period').value=active.periodo;
 $('access').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;notice('');render();
}
$('files').onchange=async e=>{
 const batch=[...e.target.files],version=++generation;if(busy)return;busy=true;
 try{
  if(batch.length!==Object.keys(L.schemas).length)throw Error('Selecciona las 7 tablas CSV juntas.');
  const raw={};
  for(const file of batch){const name=file.name.replace(/\.csv$/i,'').toUpperCase();if(!L.schemas[name]&&name!=='AVISOS'||raw[name])throw Error('Archivo no reconocido o duplicado.');if(file.size>5000000)throw Error('Máximo 5 MB por archivo.');raw[name]=L.csv(await file.text());}
  if(version===generation){const native=Boolean(raw.AVISOS);const parsed=native?SheetAdapter.adapt(raw,L):Object.fromEntries(Object.keys(L.schemas).map(name=>[name,L.table(name,raw[name])]));enter(parsed,'CSV local · carga manual');}
 }catch{notice('No se importaron datos. Revisa nombres de archivos, encabezados, fechas, duplicados y cuadratura RESUMEN/MOVIMIENTOS según FORMATOS.md.');}
 finally{busy=false;e.target.value='';}
};
function render(){
 if(!data)return;const p=$('period').value,per=data.PERIODOS.find(v=>v.periodo===p),s=L.summary(data,p);
 $('source').textContent=source+' · Carga: '+new Date(loaded).toLocaleString('es-CL')+' · '+(Date.now()-loaded>15*60000?'Carga antigua; vuelve a importar o conectar.':'Sin actualización automática; confirma vigencia en Sheets.');
 for(const k of ['charged','recovered','pending'])$(k).textContent=currency(s[k]);
 $('period-info').textContent=per?per.estado+' · Ciclo habitual: 23 · Cargo efectivo: '+(per.cargo||'sin confirmar')+' · Cuota: '+(per.validado==='SI'?currency(per.cuota):'sin validar'):'Sin períodos disponibles.';
 $('members').replaceChildren();
 const rows=data.RESUMEN.filter(r=>r.periodo===p);
 for(const r of rows){
  const m=data.INTEGRANTES.find(m=>m.id===r.integrante),card=el('article',undefined,'member'),top=el('div',undefined,'member-top');
  top.append(el('h3',m.nombre),el('span',m.titular==='SI'?'TITULAR':r.estado,'badge '+r.estado));card.append(top);
  const amounts=el('div',undefined,'amounts');
  for(const [label,value]of [['Cuota',r.cuota],['Abonado',r.abonado],['Pendiente',m.titular==='SI'?0:Math.max(0,Number(r.cuota)-Number(r.abonado))]]){const x=el('div',label);x.append(el('strong',currency(value)));amounts.append(x);}card.append(amounts);
  card.append(el('p','Ingreso: '+m.ingreso+' · Salida: '+(m.salida||'sin fecha'),'hint'));
  const e=L.eligibility(data,p,m.id),link=L.tenpo(data,p,m.id);
  if(link){const a=el('a','Enlace Tenpo verificado ↗');a.href=link;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}else card.append(el('p','Enlace Tenpo verificado no disponible.','hint'));
  const b=el('button',e.allowed?(e.type==='AGRADECIMIENTO'?'Preparar agradecimiento':'Preparar recordatorio'):'Gestión no habilitada');b.disabled=!e.allowed;b.onclick=()=>compose(m.id);card.append(b);if(!e.allowed)card.append(el('p',e.reason,'hint'));$('members').append(card);
 }
 if(!rows.length)$('members').append(el('p','No hay integrantes con resumen para este período. No se crean cuotas automáticamente.','hint'));
 const name=id=>data.INTEGRANTES.find(m=>m.id===id)?.nombre||'Integrante';
 $('history').replaceChildren();for(const m of data.MOVIMIENTOS.filter(m=>m.periodo===p).sort((a,b)=>b.fecha.localeCompare(a.fecha)))$('history').append(el('p',m.fecha+' · '+name(m.integrante)+' · '+currency(m.monto)+' · '+m.estado+' · Período '+m.periodo));
 if(!$('history').children.length)$('history').append(el('p','Sin movimientos para este período.'));
 $('gestiones').replaceChildren();for(const g of data.GESTIONES.filter(g=>g.periodo===p))$('gestiones').append(el('p',g.fecha+' · '+name(g.integrante)+' · '+g.tipo+' · Declaración manual, sin comprobación de entrega.'));
 if(!$('gestiones').children.length)$('gestiones').append(el('p','Sin gestiones registradas.'));
}
$('period').onchange=render;setInterval(()=>{if(data)render();},60000);
function compose(id){
 selected={id,period:$('period').value};const d=L.draft(data,selected.period,id);
 $('compose-title').textContent=data.INTEGRANTES.find(m=>m.id===id).nombre;$('message').value=d.text;$('phrase').value=d.phrase;$('reason').textContent=d.reason||'Revisa el mensaje antes de compartirlo.';$('confirmed').checked=false;$('compose-status').textContent='';composerState();$('composer').showModal();
}
function composerState(){
 if(!data||!selected)return;const e=L.eligibility(data,selected.period,selected.id),phrase=$('phrase').value.trim(),text=$('message').value.trim();
 const reused=data.GESTIONES.some(g=>g.integrante===selected.id&&g.frase.normalize('NFKC').toLowerCase()===phrase.normalize('NFKC').toLowerCase());
 const valid=Boolean(L.wa(e,text)&&phrase&&!reused&&text.includes(phrase));
 $('whatsapp').disabled=!valid;$('copy').disabled=!valid;$('record').disabled=!valid||!$('confirmed').checked;
 $('reason').textContent=!e.allowed?e.reason:reused?'Esta frase ya se usó. Escribe otra e inclúyela en el mensaje.':!valid?'Incluye una frase nueva en el mensaje. Máximo 4000 caracteres.':'Listo para revisar y compartir manualmente.';
 return{e,valid,phrase,text};
}
for(const id of ['message','phrase','confirmed'])$(id).oninput=composerState;
$('close').onclick=()=>$('composer').close();
$('copy').onclick=async()=>{const s=composerState();if(!s?.valid)return;try{await navigator.clipboard.writeText(s.text);$('compose-status').textContent='Mensaje copiado.';}catch{$('compose-status').textContent='No se pudo copiar. Selecciona y copia el texto manualmente.';}};
$('whatsapp').onclick=()=>{const s=composerState();if(s?.valid){window.open(L.wa(s.e,s.text),'_blank','noopener,noreferrer');$('compose-status').textContent='Se solicitó abrir WhatsApp. Esto no registra un envío.';}};
$('record').onclick=()=>{
 const s=composerState();if(!s?.valid||!$('confirmed').checked)return;
 const row={id:crypto.randomUUID(),periodo:selected.period,integrante:selected.id,fecha:L.today(),tipo:s.e.type,frase:s.phrase,movimiento:s.e.movement||''};
 const next={...data,GESTIONES:[...data.GESTIONES,row]};L.validate(next);data=next;$('composer').close();selected=null;render();notice('Gestión manual registrada en memoria. Exporta GESTIONES para conservarla. No se modificó ningún pago.');
};
$('export').onclick=()=>{if(!data)return;const url=URL.createObjectURL(new Blob(['\uFEFF'+L.exportCSV(data.GESTIONES)],{type:'text/csv;charset=utf-8'})),a=el('a');a.href=url;a.download='GESTIONES.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exportación privada: guarda GESTIONES fuera del repositorio.');};
$('import-gestiones').onchange=async e=>{
 const version=generation;try{const file=e.target.files[0];if(!file||file.size>5000000)throw Error();const rows=L.table('GESTIONES',L.csv(await file.text()));if(version!==generation||!data)return;const merged=new Map(data.GESTIONES.map(g=>[g.id,g]));for(const r of rows){if(merged.has(r.id)&&!L.schemas.GESTIONES.every(key=>merged.get(r.id)[key]===r[key]))throw Error();merged.set(r.id,r);}const next={...data,GESTIONES:[...merged.values()]};L.validate(next);data=next;render();notice('Gestiones incorporadas sin duplicar identificadores.');}catch{notice('No se incorporaron gestiones: archivo inválido, referencias desconocidas o identificadores en conflicto.');}finally{e.target.value='';}
};
async function loadGIS(){
 if(globalThis.google?.accounts?.oauth2)return;
 await new Promise((resolve,reject)=>{const old=document.getElementById('gis');if(old)old.remove();const script=document.createElement('script');script.id='gis';script.src='https://accounts.google.com/gsi/client';script.onload=resolve;script.onerror=reject;document.head.append(script);});
}
const prepareGoogle=async()=>{
 if(busy)return;
 const client=$('client').value.trim(),sheet=$('sheet').value.trim(),version=++generation;
 if(!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(client)||!/^[\w-]{20,}$/.test(sheet)){notice('Introduce un ID de cliente OAuth válido y el ID de tu planilla. No introduzcas claves secretas.');return;}
 busy=true;$('connect').disabled=true;notice('Preparando conexión de solo lectura…');
 try{
  await loadGIS();if(version!==generation)return;
  // A second user click keeps the OAuth popup inside a direct browser gesture.
  oauthClient=google.accounts.oauth2.initTokenClient({client_id:client,scope:CONFIG.scope,include_granted_scopes:false,
   error_callback:()=>{busy=false;$('connect').disabled=false;notice('No se completó el acceso de Google. Puedes reintentar o usar CSV local.');},
   callback:async response=>{
    if(version!==generation)return;
    if(response.error||!response.access_token||!google.accounts.oauth2.hasGrantedAllScopes(response,CONFIG.scope)){notice('No se autorizó lectura de Sheets.');return;}
    token=response.access_token;clearTimeout(expiry);expiry=setTimeout(()=>{wipe();notice('La sesión de Google venció. Conecta nuevamente.');},Math.max(0,Number(response.expires_in)*1000-10000));
    try{
     const ranges=Object.keys(SheetAdapter.nativeHeaders).map(n=>'ranges='+encodeURIComponent("'"+n+"'!A1:Z10000")).join('&');
     const res=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(sheet)+'/values:batchGet?'+ranges+'&valueRenderOption=FORMATTED_VALUE',{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
     if(version!==generation)return;if(!res.ok)throw Error();const body=await res.json();if(version!==generation)return;
     const raw={};Object.keys(SheetAdapter.nativeHeaders).forEach((name,i)=>{const rows=body.valueRanges?.[i]?.values;if(!rows||rows.length>=10000)throw Error();raw[name]=rows;});enter(SheetAdapter.adapt(raw,L),'Google Sheets · lectura autorizada');
    }catch{token='';clearTimeout(expiry);notice('No se cargaron datos. Comprueba tu permiso, el formato de las 7 pestañas y la compatibilidad del historial de gestiones. No se han modificado archivos.');}
   }});
  $('connect').textContent='Autorizar lectura con Google ↗';
  $('connect').onclick=()=>{notice('');oauthClient.requestAccessToken({prompt:'consent'});};
  notice('Conexión preparada. Pulsa Autorizar lectura con Google.');
 }catch{notice('No se pudo cargar Google. La importación local sigue disponible.');}
 finally{busy=false;$('connect').disabled=false;}
};

$('connect').onclick=prepareGoogle;
