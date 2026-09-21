const vm=require('node:vm'), fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const ext=path.join(__dirname,'../extension');
const html=fs.readFileSync(path.join(ext,'popup.html'),'utf8');
function node(extra={}){return {value:'',checked:false,disabled:true,textContent:'',placeholder:'',dataset:{},attrs:{},listeners:{},addEventListener(t,f){this.listeners[t]=f},setAttribute(k,v){this.attrs[k]=v},setCustomValidity(v){this.validity=v},reportValidity(){},classList:{toggle(){}},...extra}}
function popup(saved={}){
 const nodes={};for(const id of ['settings','fields','language','group-name','enabled','status'])nodes['#'+id]=node();
 // Every data-i18n key in popup.html gets a stand-in element.
 const texts=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>node({dataset:{i18n:m[1]}}));
 const documentElement={lang:''};
 const ctx=vm.createContext({document:{documentElement,querySelector:s=>nodes[s],querySelectorAll:()=>texts},chrome:{storage:{local:{async get(keys){return Object.fromEntries(keys.filter(k=>k in saved).map(k=>[k,saved[k]]))},async set(o){Object.assign(saved,o)}}}}});
 for(const f of ['i18n.js','popup.js'])vm.runInContext(fs.readFileSync(path.join(ext,f),'utf8'),ctx);
 return {nodes,texts,saved,documentElement,ready:()=>new Promise(r=>setImmediate(r))};
}
const submit=p=>p.nodes['#settings'].listeners.submit({preventDefault(){}});
(async()=>{
 {const p=popup();await p.ready();const n=p.nodes;
  assert.equal(n['#group-name'].value,'Current Work');assert.equal(n['#language'].value,'en');assert.equal(p.documentElement.lang,'en');assert.equal(n['#fields'].disabled,false);assert.equal(n['#language'].disabled,false);
  assert.ok(p.texts.every(t=>typeof t.textContent==='string'&&t.textContent));
  n['#group-name'].value='   ';await submit(p);assert.equal(p.saved.groupName,undefined);assert.equal(n['#group-name'].validity,'Enter a group name; spaces alone are not allowed.');
  n['#group-name'].value='  项目 B  ';n['#group-name'].listeners.input();n['#enabled'].checked=false;await submit(p);assert.equal(p.saved.groupName,'项目 B');assert.equal(p.saved.enabled,false);assert.equal(n['#fields'].disabled,false);assert.equal(n['#status'].textContent,'Saved. Auto-grouping is paused.');
  console.log('PASS popup defaults to English, rejects whitespace, trims and pauses');}
 {const p=popup();await p.ready();const n=p.nodes;
  n['#language'].value='zh-CN';await n['#language'].listeners.change();
  assert.equal(p.saved.language,'zh-CN');assert.equal(p.documentElement.lang,'zh-CN');assert.equal(n['#group-name'].value,'当前工作');assert.equal(n['#group-name'].placeholder,'当前工作');
  assert.equal(p.texts.find(t=>t.dataset.i18n==='save').textContent,'保存设置');
  await submit(p);assert.equal(n['#status'].textContent,'已保存，新标签将归入「当前工作」。');
  n['#language'].value='en';await n['#language'].listeners.change();assert.equal(n['#group-name'].value,'当前工作');
  console.log('PASS language switch translates the popup and keeps saved names');}
 {const p=popup({language:'zh-CN',groupName:'Work',enabled:false});await p.ready();const n=p.nodes;
  assert.equal(n['#language'].value,'zh-CN');assert.equal(n['#group-name'].value,'Work');assert.equal(n['#enabled'].checked,false);assert.equal(p.texts.find(t=>t.dataset.i18n==='heading').textContent,'自动归组');
  console.log('PASS saved language and settings are restored');}
 {const {STRINGS}=vm.runInContext(fs.readFileSync(path.join(ext,'i18n.js'),'utf8')+';({STRINGS})',vm.createContext({}));
  const keys=Object.keys(STRINGS.en).sort();for(const l in STRINGS)assert.deepEqual(Object.keys(STRINGS[l]).sort(),keys,l);
  const messages=l=>Object.keys(JSON.parse(fs.readFileSync(path.join(ext,'_locales',l,'messages.json'),'utf8'))).sort();assert.deepEqual(messages('zh_CN'),messages('en'));
  console.log('PASS every language defines the same strings');}
})().catch(e=>{console.error(e);process.exitCode=1});
