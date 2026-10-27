'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const allowed=['index.html','styles.css','logic.js','adapter.js','app.js'];
if(fs.readFileSync(path.join(root,'web/snapshot.js'),'utf8').trim())throw Error('snapshot.js must be empty');
for(const name of fs.readdirSync(path.join(root,'web')))if(![...allowed,'snapshot.js'].includes(name))throw Error('Unreviewed web file: '+name);
const deny=[/AIza[0-9A-Za-z_-]{20,}/,/-----BEGIN .*PRIVATE KEY-----/,/gh[pousr]_[A-Za-z0-9]{20,}/,/ya29\.[A-Za-z0-9_-]+/,/GOCSPX-[\w-]+/,/\b(?:localStorage|sessionStorage|indexedDB|serviceWorker)\b/,/\+\d{8,15}/,/https:\/\/wa\.me\/\d+/,/https:\/\/tenpo\.cl\/[A-Za-z0-9]/];
for(const name of allowed){const content=fs.readFileSync(path.join(root,'web',name),'utf8');if(deny.some(re=>re.test(content)))throw Error('Potential private data or persistent storage in '+name);}
if(!fs.readFileSync(path.join(root,'web/app.js'),'utf8').includes("ENVIAR_MENSAJES:'NO'"))throw Error('Manual messaging guard missing');
fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(out)){const target=path.join(out,name);if(fs.statSync(target).isDirectory())throw Error('Unexpected directory in dist');fs.unlinkSync(target);}
for(const name of allowed)fs.copyFileSync(path.join(root,'web',name),path.join(out,name));
// Change each asset URL when its content changes so a reload cannot reuse an
// earlier message template or mix scripts from different releases.
const indexPath=path.join(out,'index.html');
const html=fs.readFileSync(indexPath,'utf8').replace(/(src|href)="\.\/(styles\.css|logic\.js|adapter\.js|app\.js)"/g,(_,attribute,name)=>attribute+'="./'+name+'?v='+crypto.createHash('sha256').update(fs.readFileSync(path.join(out,name))).digest('hex').slice(0,12)+'"');
fs.writeFileSync(indexPath,html);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Production: 5 reviewed static files + .nojekyll. No fixtures, CSV or snapshot.');
for(const name of allowed)console.log(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,name))).digest('hex')+' '+name);
