'use strict';
const assert=require('node:assert/strict'),L=require('../web/logic.js');
let count=0;function test(name,fn){fn();count++;console.log('OK '+name);}
function fixture(){return{INTEGRANTES:[{id:'demo',nombre:'Persona ficticia',ingreso:'2026-01',salida:'2026-10',titular:'NO'}],PERIODOS:[{periodo:'2026-10',estado:'ACTIVO',cargo:'2026-10-24',cuota:'100',validado:'SI'},{periodo:'2026-11',estado:'BORRADOR',cargo:'',cuota:'',validado:'NO'}],RESUMEN:[{periodo:'2026-10',integrante:'demo',cuota:'100',abonado:'0',estado:'PENDIENTE'}],MOVIMIENTOS:[],CONTACTOS:[{integrante:'demo',telefono:'+15555550101',permiso:'SI',consentimiento:'SI',excluir:'NO'}],TENPO:[],GESTIONES:[]};}
const eligible=t=>L.eligibility(t,'2026-10','demo','2026-10-26');
test('CSV Unicode multiline BOM and quotes',()=>assert.deepEqual(L.csv('\uFEFFa,b\r\n"ñ,😀","a""b\nc"'),[['a','b'],['ñ,😀','a"b\nc']]));
test('Malformed CSV rejected',()=>{for(const s of ['"abc','a"b','"a"x,b'])assert.throws(()=>L.csv(s));});
test('Invalid headers rejected',()=>assert.throws(()=>L.table('INTEGRANTES',[['id','id']])));
test('Valid full load',()=>assert.equal(L.validate(fixture()).RESUMEN.length,1));
test('E164',()=>{assert(L.phone('+15555550101'));for(const s of ['555','+055555555','+1234567890123456','+1 5555550101'])assert(!L.phone(s));});
test('Effective charge date plus two days',()=>{assert(eligible(fixture()).allowed);assert(!L.eligibility(fixture(),'2026-10','demo','2026-10-25').allowed);});
test('All contact gates',()=>{for(const [key,value]of [['telefono','invalid'],['permiso','NO'],['consentimiento','NO'],['excluir','SI']]){const t=fixture();t.CONTACTOS[0][key]=value;assert(!eligible(t).allowed);}});
test('Draft/unvalidated/changed quota/future charge blocked',()=>{for(const change of [{estado:'BORRADOR'},{validado:'NO'},{cuota:'101'},{cargo:'2026-10-27'}]){const t=fixture();Object.assign(t.PERIODOS[0],change);assert(!eligible(t).allowed);}});
test('Review blocks',()=>{const t=fixture();t.RESUMEN[0].estado='REVISAR';assert(!eligible(t).allowed);});
test('Partial payment backed by movement',()=>{const t=fixture();Object.assign(t.RESUMEN[0],{abonado:'30',estado:'PARCIAL'});t.MOVIMIENTOS=[{id:'m',periodo:'2026-10',integrante:'demo',monto:'30',estado:'CONFIRMADO',fecha:'2026-10-25'}];L.validate(t);assert.deepEqual(L.summary(t,'2026-10'),{charged:30,pending:70,recovered:0});assert(L.draft(t,'2026-10','demo','2026-10-26').text.includes('$70'));});
test('Mismatch rejects load',()=>{const t=fixture();t.RESUMEN[0].abonado='30';assert.throws(()=>L.validate(t));});
test('Paid thanks requires confirmed unthanked movement',()=>{const t=fixture();Object.assign(t.RESUMEN[0],{abonado:'100',estado:'PAGADO'});assert(!eligible(t).allowed);t.MOVIMIENTOS=[{id:'m',periodo:'2026-10',integrante:'demo',monto:'100',estado:'CONFIRMADO',fecha:'2026-10-25'}];L.validate(t);assert.equal(eligible(t).type,'AGRADECIMIENTO');t.GESTIONES=[{id:'g',periodo:'2026-10',integrante:'demo',fecha:'2026-10-26',tipo:'AGRADECIMIENTO',frase:'Gracias',movimiento:'m'}];assert(!eligible(t).allowed);});
test('Membership enforces departure and joining',()=>{const t=fixture();t.INTEGRANTES[0].salida='2026-09';assert.throws(()=>L.validate(t));t.INTEGRANTES[0].salida='';t.INTEGRANTES[0].ingreso='2026-11';assert.throws(()=>L.validate(t));});
test('Tenpo exact HTTPS host and verified flag',()=>{const t=fixture();t.TENPO=[{periodo:'2026-10',integrante:'demo',verificado:'SI',url:''}];for(const url of ['https://tenpo.cl.evil.test/a','https://evil.test/tenpo.cl','http://tenpo.cl/a','https://user@tenpo.cl/a','javascript:alert(1)']){t.TENPO[0].url=url;assert.equal(L.tenpo(t,'2026-10','demo'),null);}t.TENPO[0].url='https://tenpo.cl/';assert.equal(L.tenpo(t,'2026-10','demo'),'https://tenpo.cl/');t.TENPO[0].verificado='NO';assert.equal(L.tenpo(t,'2026-10','demo'),null);});
test('WhatsApp Unicode encoding and immutable accounting',()=>{const t=fixture(),before=JSON.stringify(t),text='Hola ñ 😀 & #?';assert.equal(new URL(L.wa(eligible(t),text)).searchParams.get('text'),text);assert.equal(JSON.stringify(t),before);assert.equal(L.wa({allowed:false},text),null);});
test('Cadence and nonrepeating phrase',()=>{const t=fixture(),d=L.draft(t,'2026-10','demo','2026-10-26');t.GESTIONES=[{id:'g',periodo:'2026-10',integrante:'demo',fecha:'2026-10-24',tipo:'RECORDATORIO',frase:d.phrase,movimiento:''}];assert.notEqual(L.draft(t,'2026-10','demo','2026-10-26').phrase,d.phrase);t.GESTIONES[0].fecha='2026-10-25';assert(!eligible(t).allowed);});
test('Duplicate payment rejected',()=>{const t=fixture(),r={id:'m',periodo:'2026-10',integrante:'demo',monto:'0',estado:'CONFIRMADO',fecha:'2026-10-25'};t.MOVIMIENTOS=[r,{...r}];assert.throws(()=>L.validate(t));});
test('CSV formula export protection',()=>{const s=L.exportCSV([{id:'=HYPERLINK("bad")',frase:'@bad'}]);assert(s.includes("'=HYPERLINK"));assert(s.includes("'@bad"));});
test('No offset across months',()=>{const t=fixture();t.INTEGRANTES[0].salida='';t.RESUMEN.push({periodo:'2026-11',integrante:'demo',cuota:'100',abonado:'0',estado:'PENDIENTE'});assert.equal(L.summary(t,'2026-11').pending,100);assert.equal(L.summary(t,'2026-10').pending,100);});
test('Invalid date and negative amounts',()=>{const t=fixture();t.PERIODOS[0].cargo='2026-02-30';assert.throws(()=>L.validate(t));t.PERIODOS[0].cargo='2026-10-24';t.RESUMEN[0].cuota='-10';assert.throws(()=>L.validate(t));});
console.log(count+' tests passed');module.exports={fixture};

const A=require('../web/adapter.js');
function nativeFixture(){
 const rows={
 INTEGRANTES:[['Persona ficticia','','2026-01','2026-10','USUARIO']],
 PERIODOS:[['2026-10','2026-10-24','600','100','ACTIVO','',''],['2026-11','','','','BORRADOR','','']],
 MOVIMIENTOS:[],
 RESUMEN:[['2026-10','Persona ficticia','USUARIO','100','0','100','PENDIENTE','']],
 CONTACTOS:[['Persona ficticia','','WHATSAPP','SI','','15555550101','SI','','NO']],
 GESTIONES:[],AVISOS:[]
 };return Object.fromEntries(Object.entries(A.nativeHeaders).map(([name,header])=>[name,[header,...rows[name]]]));
}
test('Real-header adapter maps contact D/G/I without guessing',()=>{const t=A.adapt(nativeFixture(),L);assert(L.eligibility(t,'2026-10','Persona ficticia','2026-10-26').allowed);assert.equal(t.CONTACTOS[0].telefono,'+15555550101');assert.equal(t.TENPO.length,0);});
test('Native contact permissions NO remain blocked',()=>{const raw=nativeFixture();raw.CONTACTOS[1][3]='NO';assert(!L.eligibility(A.adapt(raw,L),'2026-10','Persona ficticia','2026-10-26').allowed);});
test('Legacy history cannot be silently discarded',()=>{const raw=nativeFixture();raw.GESTIONES.push(['2026-10-25','','','','','','','']);assert.throws(()=>A.adapt(raw,L));});
test('Native movement amount and local formatted date',()=>{const raw=nativeFixture();raw.MOVIMIENTOS.push(['mock-mail-id','25/10/2026 12:00:00','MOCK','','30','30','','','2026-10','Persona ficticia','CONFIRMADO','','']);raw.RESUMEN[1][4]='30';raw.RESUMEN[1][5]='70';raw.RESUMEN[1][6]='PARCIAL';const t=A.adapt(raw,L);assert.equal(t.MOVIMIENTOS[0].fecha,'2026-10-25');assert.equal(L.summary(t,'2026-10').pending,70);});
test('Native balance mismatch rejected',()=>{const raw=nativeFixture();raw.RESUMEN[1][5]='999';assert.throws(()=>A.adapt(raw,L));});
console.log(count+' total tests passed');module.exports.nativeFixture=nativeFixture;

test('Titular stays separate from member debt',()=>{const raw=nativeFixture();raw.INTEGRANTES.push(['Titular ficticio','','2026-01','','TITULAR']);raw.RESUMEN.push(['2026-10','Titular ficticio','TITULAR','100','0','0','TITULAR','']);const t=A.adapt(raw,L);assert.equal(L.summary(t,'2026-10').pending,100);assert(!L.eligibility(t,'2026-10','Titular ficticio','2026-10-26').allowed);});
console.log(count+' final tests passed');

test('Pending days use effective charge and keep periods separate',()=>{const t=fixture();assert.equal(L.pendingDays(t,'2026-10','demo','2026-10-26'),2);assert.equal(L.pendingDays(t,'2026-10','demo','2026-10-24'),0);assert.equal(L.pendingDays(t,'2026-10','demo','2026-10-23'),null);assert.equal(L.pendingDays(t,'2026-11','demo','2026-11-26'),null);t.RESUMEN[0].abonado='30';assert.equal(L.pendingDays(t,'2026-10','demo','2026-11-02'),9);t.RESUMEN[0].abonado='100';assert.equal(L.pendingDays(t,'2026-10','demo','2026-11-02'),null);});
test('Pending days suppress uncertain balances and titular',()=>{for(const change of ['titular','unvalidated','review']){const t=fixture();if(change==='titular')t.INTEGRANTES[0].titular='SI';if(change==='unvalidated')t.PERIODOS[0].validado='NO';if(change==='review')t.RESUMEN[0].estado='REVISAR';assert.equal(L.pendingDays(t,'2026-10','demo','2026-10-26'),null);}});
console.log(count+' tests including payment aging passed');
