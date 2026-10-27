'use strict';
(function(root){
 const nativeHeaders={
 INTEGRANTES:['Integrante','Alias bancarios (separar con |)','Desde (AAAA-MM)','Hasta (AAAA-MM o vacio)','Rol'],
 PERIODOS:['Periodo (AAAA-MM)','Fecha cargo (AAAA-MM-DD)','Cobro Anthropic CLP','Cuota CLP','Estado','Link Tenpo','Notas'],
 MOVIMIENTOS:['ID Gmail','Fecha y hora','Fuente','Nombre origen','Monto recibido CLP','Monto imputado CLP','Referencia','Concepto','Periodo','Integrante','Decision','Correo evidencia','Observaciones'],
 RESUMEN:['Periodo','Integrante','Rol','Cuota CLP','Total imputado CLP','Saldo CLP','Estado','Ultima revision'],
 CONTACTOS:['Integrante','Email confirmado','Canal','Permitir avisos (SI/NO)','Notas / validación','WhatsApp 569…','Consentimiento WA (SI/NO)','Fecha consentimiento','Excluir WA (SI/NO)'],
 GESTIONES:['Fecha/hora','Período','Integrante','Canal utilizado','Tipo de gestión','Resultado','Próximo seguimiento','Observaciones'],
 AVISOS:['Clave de evento','Fecha/hora','Período','Integrante','Tipo','Código frase','Canal','Destinatario','Texto generado','Estado','ID Gmail de pago','Detalle / error']
 };
 function amount(v){let s=String(v??'').trim().replace(/^\$\s*/,'');if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');if(!/^\d+$/.test(s))throw Error('Importe del origen no válido.');return s;}
 function date(v){const s=String(v??'').trim(),iso=s.match(/^(\d{4}-\d{2}-\d{2})(?:[ T]|$)/);if(iso)return iso[1];const cl=s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T]|$)/);if(cl)return cl[3]+'-'+cl[2]+'-'+cl[1];return '';}
 function adapt(raw,L){
 const rows={};for(const [name,headers]of Object.entries(nativeHeaders)){
  const grid=raw[name];if(!grid?.length||headers.some((h,i)=>String(grid[0][i]??'').trim()!==h))throw Error('Encabezados reales incompatibles.');rows[name]=grid.slice(1).filter(r=>r.some(v=>String(v??'').trim()!==''));
 }
 // Legacy history lacks a reliably recorded exact phrase. Never discard it to unlock reminders.
 if(rows.AVISOS.length||rows.GESTIONES.length)throw Error('Historial legado requiere adaptación privada de frases y gestiones; no se habilitan recordatorios ignorándolo.');
 const t=Object.fromEntries(Object.keys(L.schemas).map(k=>[k,[]]));
 t.INTEGRANTES=rows.INTEGRANTES.map(r=>{if(!['TITULAR','USUARIO'].includes(r[4]))throw Error('Rol no reconocido.');return{id:String(r[0]).trim(),nombre:String(r[0]).trim(),ingreso:String(r[2]??'').trim(),salida:String(r[3]??'').trim(),titular:r[4]==='TITULAR'?'SI':'NO'};});
 t.PERIODOS=rows.PERIODOS.map(r=>{const cuota=r[3]===''||r[3]==null?'':amount(r[3]),cargo=date(r[1]),estado=String(r[4]??'').trim();return{periodo:String(r[0]).trim(),estado,cargo,cuota,validado:estado!=='BORRADOR'&&cargo&&Number(cuota)>0&&Number(amount(r[2]))>0?'SI':'NO'};});
 t.RESUMEN=rows.RESUMEN.map(r=>{const cuota=amount(r[3]),abonado=amount(r[4]);if(r[6]!=='TITULAR'&&Number(amount(r[5]))!==Math.max(0,Number(cuota)-Number(abonado)))throw Error('Saldo del origen inconsistente.');return{periodo:String(r[0]).trim(),integrante:String(r[1]).trim(),cuota,abonado,estado:String(r[6]).trim()};});
 t.MOVIMIENTOS=rows.MOVIMIENTOS.map(r=>{if(!r[0])throw Error('Movimiento sin identificador.');return{id:String(r[0])+'|'+String(r[8])+'|'+String(r[9]),periodo:String(r[8]).trim(),integrante:String(r[9]).trim(),monto:amount(r[5]),estado:String(r[10]).trim(),fecha:date(r[1])};});
 t.CONTACTOS=rows.CONTACTOS.map(r=>{const tel=String(r[5]??'').trim();return{integrante:String(r[0]).trim(),telefono:tel&&!tel.startsWith('+')?'+'+tel:tel,permiso:String(r[3]??'').trim(),consentimiento:String(r[6]??'').trim(),excluir:String(r[8]??'').trim()};});
 // PERIODOS.Link Tenpo is a general link, not individual verification.
 return L.validate(t);
 }
 const api={nativeHeaders,adapt};if(typeof module!=='undefined')module.exports=api;else root.SheetAdapter=api;
})(globalThis);
