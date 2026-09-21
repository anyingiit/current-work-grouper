const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ext=require('node:path').join(__dirname,'../extension');
const code=readFileSync(ext+'/background.js','utf8');
// Mirrors the service worker's importScripts by running each file in the same context.
function load(chrome){const ctx=vm.createContext({chrome,Date,console});ctx.importScripts=(...files)=>files.forEach(f=>vm.runInContext(readFileSync(ext+'/'+f,'utf8'),ctx));vm.runInContext(code,ctx);return ctx}
function fixture() {
 const tabs=new Map(), groups=new Map(), events={}, calls=[];
 const event=name=>({addListener(fn){events[name]=fn;}});
 const storage=()=>{const data={}; return {async get(q){if(q===null)return {...data}; if(typeof q==='string')return {[q]:data[q]};return {...q,...data};},async set(o){Object.assign(data,o)},async remove(keys){for(const k of [keys].flat())delete data[k]},async clear(){for(const k in data)delete data[k]}}};
 const chrome={storage:{local:storage(),session:storage(),onChanged:event('storageChange')},action:{onClicked:event('click'),async setBadgeText(o){calls.push(['badge',o.text])},async setBadgeBackgroundColor(){},async setTitle(o){calls.push(['title',o.title])}},runtime:{onInstalled:event('install'),onStartup:event('startup')},windows:{async get(){return {type:'normal'}},async update(id,o){calls.push(['focus',id])}},tabs:{onCreated:event('create'),onUpdated:event('update'),onRemoved:event('remove'),async get(id){if(!tabs.has(id))throw Error();return {...tabs.get(id)}},async move(id,o){tabs.get(id).windowId=o.windowId;calls.push(['move',id,o.windowId])},async query(q){return [...tabs.values()].filter(t=>Object.entries(q).every(([k,v])=>t[k]===v)).map(t=>({...t}))},async update(id,o){if(!tabs.has(id))throw Error('closed tab');if(o.active){for(const t of tabs.values())if(t.windowId===tabs.get(id).windowId)t.active=false;calls.push(['activate',id]);}Object.assign(tabs.get(id),o);return {...tabs.get(id)}},async group(o){const id=o.groupId??(groups.size+1);if(!groups.has(id))groups.set(id,{id,windowId:tabs.get(o.tabIds[0]).windowId});for(const tid of o.tabIds)tabs.get(tid).groupId=id;calls.push(['group',...o.tabIds]);return id}},tabGroups:{async query(){return [...groups.values()]},async update(id,o){Object.assign(groups.get(id),o)}}};
 const ctx=load(chrome);
 const drain=()=>vm.runInContext('queue',ctx);
 function create(id,extra={}){const t={id,windowId:1,groupId:-1,url:'https://example.com',active:true,...extra};if(t.active)for(const other of tabs.values())if(other.windowId===t.windowId)other.active=false;tabs.set(id,t);events.create({...t});}
 return {tabs,groups,events,calls,create,drain,chrome,ctx};
}
(async()=>{
 let count=0;
 async function test(name,fn){await fn();count++;console.log('PASS',name)}
 await test('burst creates one named group',async()=>{const f=fixture();f.create(1);f.create(2);await f.drain();assert.equal(f.groups.size,1);assert.equal(f.groups.get(1).title,'Current Work');assert.equal(f.tabs.get(2).groupId,1)});
 await test('existing group in another window is reused',async()=>{const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:2});f.create(1);await f.drain();assert.equal(f.tabs.get(1).groupId,8);assert.equal(f.tabs.get(1).windowId,2);assert.ok(f.calls.some(x=>x[0]==='focus'&&x[1]===2))});
 await test('same-window group preferred over duplicates',async()=>{const f=fixture();f.groups.set(3,{id:3,title:'Current Work',windowId:2});f.groups.set(8,{id:8,title:'Current Work',windowId:1});f.create(1);await f.drain();assert.equal(f.tabs.get(1).groupId,8)});
 await test('pinned, grouped, internal and incognito ignored',async()=>{const f=fixture();[{pinned:true},{groupId:7},{url:'chrome://newtab/'},{incognito:true},{url:'file:///tmp/a'}].forEach((v,i)=>f.create(i,v));await f.drain();assert.equal(f.groups.size,0)});
 await test('delayed URL survives service-worker restart',async()=>{const f=fixture();f.create(1,{url:''});await f.drain();assert.equal(f.groups.size,0);const ctx2=load(f.chrome);f.tabs.get(1).url='https://example.com';f.events.update(1,{url:'https://example.com'});await vm.runInContext('queue',ctx2);assert.equal(f.tabs.get(1).groupId,1)});
 await test('manual new-tab navigation not captured later',async()=>{const f=fixture();f.create(1,{url:'chrome://newtab/'});await f.drain();f.tabs.get(1).url='https://example.com';f.events.update(1,{url:'https://example.com'});await f.drain();assert.equal(f.groups.size,0)});
 await test('pause persists and resume only handles new tabs',async()=>{const f=fixture();await f.chrome.storage.local.set({enabled:false});f.events.storageChange({enabled:{newValue:false}},'local');await f.drain();f.create(1);await f.drain();assert.equal(f.groups.size,0);await f.chrome.storage.local.set({enabled:true});f.events.storageChange({enabled:{newValue:true}},'local');await f.drain();assert.equal(f.groups.size,0);f.create(2);await f.drain();assert.equal(f.tabs.get(2).groupId,1);assert.equal(f.tabs.get(1).groupId,-1)});
 await test('existing tabs ignored on unrelated update',async()=>{const f=fixture();f.tabs.set(1,{id:1,url:'https://example.com',groupId:-1});f.events.update(1,{status:'complete'});await f.drain();assert.equal(f.groups.size,0)});
 await test('user grouping while URL unknown is respected',async()=>{const f=fixture();f.create(1,{url:''});await f.drain();Object.assign(f.tabs.get(1),{groupId:99,url:'https://example.com'});f.events.update(1,{url:'https://example.com'});await f.drain();assert.equal(f.tabs.get(1).groupId,99)});
 await test('closed pending tab is harmless',async()=>{const f=fixture();f.create(1,{url:''});await f.drain();f.tabs.delete(1);f.events.remove(1);f.events.update(1,{status:'complete'});await f.drain();assert.equal(f.groups.size,0)});
 await test('custom name creates target and old group stays unchanged',async()=>{const f=fixture();f.create(1);await f.drain();await f.chrome.storage.local.set({groupName:'  项目 A * [设计]  '});f.create(2);await f.drain();assert.equal(f.groups.get(1).title,'Current Work');assert.equal(f.groups.get(2).title,'项目 A * [设计]');assert.equal(f.tabs.get(1).groupId,1)});
 await test('custom target matches literally and reuses existing group',async()=>{const f=fixture();await f.chrome.storage.local.set({groupName:'工作*'});f.groups.set(4,{id:4,title:'工作ABC',windowId:1});f.groups.set(5,{id:5,title:'工作*',windowId:1});f.create(1);await f.drain();assert.equal(f.tabs.get(1).groupId,5)});
 await test('invalid stored name falls back to default',async()=>{const f=fixture();await f.chrome.storage.local.set({groupName:'  '});f.create(1);await f.drain();assert.equal(f.groups.get(1).title,'Current Work')});
 await test('external link with Chrome-assigned opener is grouped',async()=>{const f=fixture();f.create(1,{openerTabId:1843895872});await f.drain();assert.equal(f.tabs.get(1).groupId,1)});
 await test('Chinese interface uses Chinese default name and titles',async()=>{const f=fixture();await f.chrome.storage.local.set({language:'zh-CN'});f.create(1);await f.drain();assert.equal(f.groups.get(1).title,'当前工作');assert.equal(f.calls.filter(x=>x[0]==='title').at(-1)[1],'当前工作：自动归组已开启，点击设置')});
 await test('unknown language falls back to English',async()=>{const f=fixture();await f.chrome.storage.local.set({language:'xx'});f.events.install({reason:'install'});await f.drain();assert.equal(f.calls.filter(x=>x[0]==='title').at(-1)[1],'Current Work: auto-grouping is on. Click for settings')});
 await test('language change repaints the toolbar title',async()=>{const f=fixture();await f.chrome.storage.local.set({language:'zh-CN',groupName:'Work'});f.events.storageChange({language:{newValue:'zh-CN'}},'local');await f.drain();assert.equal(f.calls.filter(x=>x[0]==='title').at(-1)[1],'Work：自动归组已开启，点击设置')});
 await test('upgrade from 1.1 keeps the Chinese default group',async()=>{const f=fixture();f.events.install({reason:'update',previousVersion:'1.1.1'});await f.drain();assert.equal((await f.chrome.storage.local.get('groupName')).groupName,'当前工作');f.create(1);await f.drain();assert.equal(f.groups.get(1).title,'当前工作')});
 await test('upgrade keeps a saved name and later upgrades change nothing',async()=>{const f=fixture();await f.chrome.storage.local.set({groupName:'Mine'});f.events.install({reason:'update',previousVersion:'1.0.0'});await f.drain();assert.equal((await f.chrome.storage.local.get('groupName')).groupName,'Mine');const g=fixture();g.events.install({reason:'update',previousVersion:'1.2.0'});g.events.install({reason:'install'});await g.drain();assert.equal((await g.chrome.storage.local.get('groupName')).groupName,undefined)});

 await test('active grouped tab is reselected to reveal its new position',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false,discarded:false});
  f.create(1);await f.drain();
  assert.deepEqual(f.calls.filter(c=>c[0]==='activate'),[['activate',9],['activate',1]]);
  assert.equal(f.tabs.get(1).active,true);assert.equal(f.tabs.get(1).groupId,8);
 });
 await test('background grouping never changes the selected tab',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:true});
  f.create(1,{active:false});await f.drain();
  assert.equal(f.tabs.get(9).active,true);assert.equal(f.tabs.get(1).groupId,8);
  assert.equal(f.calls.filter(c=>c[0]==='activate').length,0);
 });
 await test('user switching away during grouping is respected',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false});
  const group=f.chrome.tabs.group;f.chrome.tabs.group=async o=>{const id=await group(o);f.tabs.get(1).active=false;f.tabs.get(9).active=true;return id};
  f.create(1);await f.drain();assert.equal(f.tabs.get(9).active,true);
  assert.equal(f.calls.filter(c=>c[0]==='activate').length,0);
 });
 await test('user switching away during reselection is respected',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false});
  f.tabs.set(10,{id:10,windowId:1,groupId:-1,active:false});
  const update=f.chrome.tabs.update;f.chrome.tabs.update=async(id,o)=>{const tab=await update(id,o);if(id===9){f.tabs.get(9).active=false;f.tabs.get(10).active=true}return tab};
  f.create(1);await f.drain();assert.equal(f.tabs.get(10).active,true);
  assert.deepEqual(f.calls.filter(c=>c[0]==='activate'),[['activate',9]]);
 });
 await test('scroll workaround does not wake discarded tabs',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false,discarded:true});
  f.create(1);await f.drain();assert.equal(f.tabs.get(1).active,true);
  assert.equal(f.calls.filter(c=>c[0]==='activate').length,0);
 });
 await test('closed neighbor does not report successful grouping as failed',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false});
  const update=f.chrome.tabs.update;f.chrome.tabs.update=async(id,o)=>{if(id===9)f.tabs.delete(9);return update(id,o)};
  f.create(1);await f.drain();assert.equal(f.tabs.get(1).groupId,8);
  assert.equal(f.tabs.get(1).active,true);assert.ok(!f.calls.some(c=>c[0]==='badge'&&c[1]==='!'));
 });
 await test('tab moved out of the group during reselection is not activated again',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false});
  const update=f.chrome.tabs.update;f.chrome.tabs.update=async(id,o)=>{const tab=await update(id,o);if(id===9)f.tabs.get(1).groupId=-1;return tab};
  f.create(1);await f.drain();assert.equal(f.tabs.get(1).groupId,-1);
  assert.deepEqual(f.calls.filter(c=>c[0]==='activate'),[['activate',9]]);
 });
 await test('user selection just before restoring is respected',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false});
  f.tabs.set(10,{id:10,windowId:1,groupId:-1,active:false});
  const query=f.chrome.tabs.query;f.chrome.tabs.query=async q=>{if(f.calls.some(c=>c[0]==='activate'&&c[1]===9)){f.tabs.get(9).active=false;f.tabs.get(10).active=true}return query(q)};
  f.create(1);await f.drain();assert.equal(f.tabs.get(10).active,true);
  assert.deepEqual(f.calls.filter(c=>c[0]==='activate'),[['activate',9]]);
 });
 await test('neighbor discarded before temporary selection is not woken',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:false,discarded:false});
  const update=f.chrome.tabGroups.update;f.chrome.tabGroups.update=async(id,o)=>{await update(id,o);f.tabs.get(9).discarded=true};
  f.create(1);await f.drain();assert.equal(f.tabs.get(1).active,true);
  assert.equal(f.calls.filter(c=>c[0]==='activate').length,0);
 });
 await test('background tab closed right after grouping shows no error',async()=>{
  const f=fixture();f.groups.set(8,{id:8,title:'Current Work',windowId:1});
  f.tabs.set(9,{id:9,windowId:1,groupId:8,active:true});
  const group=f.chrome.tabs.group;f.chrome.tabs.group=async o=>{const id=await group(o);f.tabs.delete(1);return id};
  f.create(1,{active:false});await f.drain();
  assert.ok(!f.calls.some(c=>c[0]==='badge'&&c[1]==='!'));
 });
 console.log(`${count} tests passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
