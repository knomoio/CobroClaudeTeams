'use strict';
(function(root){
 const schemas=Object.freeze({INTEGRANTES:['id','nombre','ingreso','salida','titular'],PERIODOS:['periodo','estado','cargo','cuota','validado'],RESUMEN:['periodo','integrante','cuota','abonado','estado'],MOVIMIENTOS:['id','periodo','integrante','monto','estado','fecha'],CONTACTOS:['integrante','telefono','permiso','consentimiento','excluir'],TENPO:['periodo','integrante','url','verificado'],GESTIONES:['id','periodo','integrante','fecha','tipo','frase','movimiento']});
 const yes=v=>v==='SI', month=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(v), money=v=>/^\d+$/.test(String(v))&&Number.isSafeInteger(Number(v));
 const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 function csv(text){
  if(text.length>5000000)throw Error('Archivo demasiado grande (máximo 5 MB).');
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],value='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){const c=text[i];
   if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;}
   else if(c==='"'){if(value||closed)throw Error('CSV: comillas inválidas.');quoted=true;}
   else if(c===','||c==='\n'||c==='\r'){row.push(value);value='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}}
   else{if(closed)throw Error('CSV: contenido tras comillas.');value+=c;}
  }
  if(quoted)throw Error('CSV: comillas sin cerrar.');row.push(value);if(row.some(x=>x!==''))rows.push(row);return rows;
 }
 function table(name,rows){
  if(!schemas[name]||!rows.length)throw Error('Tabla vacía o no reconocida.');const headers=rows[0].map(x=>String(x).trim().toLowerCase());
  if(new Set(headers).size!==headers.length||headers.length!==schemas[name].length||schemas[name].some(h=>!headers.includes(h)))throw Error('Columnas incompatibles en '+name+'. Consulta el formato documentado.');
  return rows.slice(1).filter(r=>r.some(x=>String(x)!=='')).map(r=>{if(r.length>headers.length)throw Error('Columnas adicionales en '+name);const obj={};headers.forEach((h,i)=>obj[h]=String(r[i]??'').trim());return obj;});
 }
 function validate(t){
  for(const n of Object.keys(schemas))if(!Array.isArray(t[n]))throw Error('Falta tabla '+n);
  const unique=(rows,key)=>{const ids=rows.map(key);if(ids.some(x=>!x)||new Set(ids).size!==ids.length)throw Error('Identificadores vacíos o duplicados.');};
  unique(t.INTEGRANTES,r=>r.id);unique(t.PERIODOS,r=>r.periodo);unique(t.RESUMEN,r=>r.periodo+'|'+r.integrante);unique(t.CONTACTOS,r=>r.integrante);unique(t.TENPO,r=>r.periodo+'|'+r.integrante);unique(t.MOVIMIENTOS,r=>r.id);unique(t.GESTIONES,r=>r.id);
  const bool=v=>['SI','NO'].includes(v),member=id=>t.INTEGRANTES.find(r=>r.id===id),period=id=>t.PERIODOS.find(r=>r.periodo===id);
  for(const r of t.INTEGRANTES)if(!r.nombre||!month(r.ingreso)||(r.salida&&(!month(r.salida)||r.salida<r.ingreso))||!bool(r.titular)||r.id.includes('|'))throw Error('Integrante inválido.');
  for(const r of t.PERIODOS)if(!month(r.periodo)||!['ACTIVO','CERRADO','BORRADOR'].includes(r.estado)||!bool(r.validado)||(r.cargo&&!date(r.cargo))||(r.cuota&&!money(r.cuota))||(yes(r.validado)&&(!date(r.cargo)||!money(r.cuota)||Number(r.cuota)<=0)))throw Error('Período inválido.');
  for(const n of ['RESUMEN','MOVIMIENTOS','TENPO','GESTIONES'])for(const r of t[n])if(!member(r.integrante)||!period(r.periodo))throw Error('Referencia desconocida en '+n);
  for(const r of t.CONTACTOS)if(!member(r.integrante)||!['permiso','consentimiento','excluir'].every(k=>bool(r[k])))throw Error('Contacto inválido.');
  for(const r of t.TENPO)if(!bool(r.verificado))throw Error('Verificación Tenpo inválida.');
  for(const r of t.MOVIMIENTOS)if(!money(r.monto)||!date(r.fecha)||!['CONFIRMADO','REVISAR'].includes(r.estado))throw Error('Movimiento inválido.');
  for(const r of t.RESUMEN){const m=member(r.integrante);
   if(r.periodo<m.ingreso||(m.salida&&r.periodo>m.salida)||!money(r.cuota)||!money(r.abonado)||!['PAGADO','PARCIAL','PENDIENTE','REVISAR','TITULAR'].includes(r.estado)||(r.estado==='TITULAR'&&!yes(m.titular)))throw Error('Resumen inválido o fuera de permanencia.');
   const sum=t.MOVIMIENTOS.filter(v=>v.periodo===r.periodo&&v.integrante===r.integrante&&v.estado==='CONFIRMADO').reduce((s,v)=>s+Number(v.monto),0);
   if(sum!==Number(r.abonado))throw Error('RESUMEN y MOVIMIENTOS no cuadran. Se rechaza la carga completa.');
   if(r.estado!=='REVISAR'&&r.estado!=='TITULAR'&&(r.estado==='PAGADO'?Number(r.abonado)<Number(r.cuota):r.estado==='PARCIAL'?!(Number(r.abonado)>0&&Number(r.abonado)<Number(r.cuota)):Number(r.abonado)!==0))throw Error('Estado de pago inconsistente.');
  }
  for(const r of t.MOVIMIENTOS)if(!t.RESUMEN.some(v=>v.periodo===r.periodo&&v.integrante===r.integrante))throw Error('Movimiento sin resumen.');
  for(const r of t.GESTIONES)if(!date(r.fecha)||!['RECORDATORIO','AGRADECIMIENTO'].includes(r.tipo)||!r.frase||(r.tipo==='AGRADECIMIENTO'&&!t.MOVIMIENTOS.some(v=>v.id===r.movimiento&&v.estado==='CONFIRMADO'&&v.periodo===r.periodo&&v.integrante===r.integrante)))throw Error('Gestión inválida.');
  const thanks=t.GESTIONES.filter(r=>r.tipo==='AGRADECIMIENTO').map(r=>r.movimiento);if(new Set(thanks).size!==thanks.length)throw Error('Agradecimiento duplicado.');return t;
 }
 const phone=v=>/^\+[1-9]\d{7,14}$/.test(v);
 function tenpo(t,p,id){const r=t.TENPO.find(r=>r.periodo===p&&r.integrante===id&&yes(r.verificado));if(!r)return null;try{const u=new URL(r.url);return u.protocol==='https:'&&u.hostname==='tenpo.cl'&&!u.username&&!u.password&&!u.port?u.href:null;}catch{return null;}}
 function today(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),get=n=>parts.find(x=>x.type===n).value;return get('year')+'-'+get('month')+'-'+get('day');}
 function eligibility(t,p,id,now=today()){
  const r=t.RESUMEN.find(r=>r.periodo===p&&r.integrante===id),m=t.INTEGRANTES.find(r=>r.id===id),c=t.CONTACTOS.find(r=>r.integrante===id),per=t.PERIODOS.find(r=>r.periodo===p),no=reason=>({allowed:false,reason});
  if(!r||!m||yes(m.titular))return no('Sin cobro de integrante.');
  if(!per||per.estado!=='ACTIVO'||!yes(per.validado)||Number(per.cuota)<=0||Number(r.cuota)!==Number(per.cuota)||!per.cargo||per.cargo>now)return no('Período, cargo o cuota sin validar.');
  if(r.estado==='REVISAR'||t.MOVIMIENTOS.some(v=>v.periodo===p&&v.integrante===id&&v.estado==='REVISAR'))return no('Conciliación pendiente de revisión.');
  if(!c||!phone(c.telefono)||!yes(c.permiso)||!yes(c.consentimiento)||yes(c.excluir))return no('Teléfono o permisos de WhatsApp no habilitados.');
  if(Number(r.abonado)>=Number(r.cuota)){const movement=t.MOVIMIENTOS.find(v=>v.periodo===p&&v.integrante===id&&v.estado==='CONFIRMADO'&&Number(v.monto)>0&&!t.GESTIONES.some(g=>g.tipo==='AGRADECIMIENTO'&&g.movimiento===v.id));return movement?{allowed:true,type:'AGRADECIMIENTO',movement:movement.id,contact:c}:no('Sin pago confirmado pendiente de agradecer.');}
  const day=v=>Date.parse(v+'T12:00:00Z');if(day(now)-day(per.cargo)<2*86400000)return no('Recordatorios desde dos días después del cargo efectivo.');
  if(t.GESTIONES.some(g=>g.periodo===p&&g.integrante===id&&g.tipo==='RECORDATORIO'&&day(now)-day(g.fecha)<2*86400000))return no('Espera dos días desde la última gestión.');
  return{allowed:true,type:'RECORDATORIO',contact:c,movement:''};
 }
 function pendingDays(t,p,id,now=today()){
  const r=t.RESUMEN.find(v=>v.periodo===p&&v.integrante===id),m=t.INTEGRANTES.find(v=>v.id===id),per=t.PERIODOS.find(v=>v.periodo===p);
  if(!r||!m||yes(m.titular)||r.estado==='REVISAR'||Number(r.abonado)>=Number(r.cuota)||!per||!yes(per.validado)||!date(per.cargo)||!date(now)||per.cargo>now||t.MOVIMIENTOS.some(v=>v.periodo===p&&v.integrante===id&&v.estado==='REVISAR'))return null;
  return Math.floor((Date.parse(now+'T12:00:00Z')-Date.parse(per.cargo+'T12:00:00Z'))/86400000);
 }
 const phrases=Object.freeze(['El calendario ya pasó por caja; ahora nos toca a nosotros 😄','La suscripción sigue entrenando su paciencia zen 🧘','Este recordatorio viene sin intereses, pero con buena onda ☕','El robot trabaja duro; su alcancía también tiene hambre 🤖','Pequeño empujón para que las cuentas duerman tranquilas 🌙','La calculadora pide vacaciones: ayudémosla a cerrar el mes 🏖️']);
 function draft(t,p,id,now){const e=eligibility(t,p,id,now);if(!e.allowed)return{text:'',phrase:'',...e};const r=t.RESUMEN.find(r=>r.periodo===p&&r.integrante===id),m=t.INTEGRANTES.find(r=>r.id===id),used=new Set(t.GESTIONES.filter(g=>g.integrante===id).map(g=>g.frase));const phrase=e.type==='AGRADECIMIENTO'?'Gracias por mantener al equipo en marcha 🙌':phrases.find(v=>!used.has(v));if(!phrase||used.has(phrase))return{...e,text:'',phrase:'',reason:'Escribe una frase nueva: las disponibles ya se usaron.'};const link=tenpo(t,p,id);return{...e,phrase,text:e.type==='AGRADECIMIENTO'?'Hola '+m.nombre+', confirmamos tu pago de Claude Team del período '+p+'. '+phrase:'Hola '+m.nombre+' 👋 Quedan $'+Math.max(0,Number(r.cuota)-Number(r.abonado)).toLocaleString('es-CL')+' pendientes de tu cuota de Claude Team del período '+p+'. '+phrase+(link?'\nTu enlace verificado: '+link:'')};}
 function wa(e,text){if(!e.allowed||!phone(e.contact?.telefono)||!text.trim()||text.length>4000)return null;return'https://wa.me/'+e.contact.telefono.slice(1)+'?text='+encodeURIComponent(text);}
 function summary(t,p){const rows=t.RESUMEN.filter(r=>r.periodo===p&&!yes(t.INTEGRANTES.find(m=>m.id===r.integrante)?.titular));return{charged:rows.reduce((s,r)=>s+Math.min(Number(r.cuota),Number(r.abonado)),0),pending:rows.reduce((s,r)=>s+Math.max(0,Number(r.cuota)-Number(r.abonado)),0),recovered:t.MOVIMIENTOS.filter(v=>v.estado==='CONFIRMADO'&&v.periodo<p&&v.fecha.slice(0,7)===p&&!yes(t.INTEGRANTES.find(m=>m.id===v.integrante)?.titular)).reduce((s,v)=>s+Number(v.monto),0)};}
 function exportCSV(rows){const headers=schemas.GESTIONES,cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';return[headers,...rows.map(r=>headers.map(h=>r[h]))].map(r=>r.map(cell).join(',')).join('\r\n');}
 const api={schemas,csv,table,validate,phone,tenpo,eligibility,pendingDays,draft,wa,summary,today,exportCSV};if(typeof module!=='undefined')module.exports=api;else root.Cobros=api;
})(globalThis);
