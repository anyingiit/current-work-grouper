const DEFAULT_GROUP_NAME = '当前工作';
const WAIT_MS = 10000;
let queue = Promise.resolve();

// Serialize events so a burst of links creates only one group.
function enqueue(fn) {
  queue = queue.then(fn).catch(async () => {
    // No browsing URLs are logged or saved. A closed tab is harmless;
    // other transient failures leave the tab where Chrome opened it.
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setTitle({ title: '有标签未能归组（可能已关闭或正在拖动）。点击暂停，再点击恢复。' });
  });
  return queue;
}

async function enabled() {
  return (await chrome.storage.local.get({ enabled: true })).enabled;
}

async function groupName() {
  const { groupName } = await chrome.storage.local.get({ groupName: DEFAULT_GROUP_NAME });
  return typeof groupName === 'string' && groupName.trim() ? groupName.trim() : DEFAULT_GROUP_NAME;
}

async function paint() {
  const on = await enabled();
  const name = await groupName();
  await chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: on ? '#2563eb' : '#64748b' });
  await chrome.action.setTitle({ title: on
    ? `${name}：自动归组已开启，点击设置`
    : `${name}：已暂停，点击设置` });
}

function eligible(tab) {
  // Chrome on macOS may assign an opener even to external app links.
  return !tab.incognito && !tab.pinned
    && (tab.groupId == null || tab.groupId === -1);
}

async function forget(id) {
  await chrome.storage.session.remove(`candidate:${id}`);
}

async function revealActiveTab(id, target) {
  // tabs.update({active: true}) is a no-op for an already-active tab.
  // A real selection change lets the native vertical strip reveal the tab
  // at its new position. Keep the temporary selection inside the same group.
  const members = await chrome.tabs.query({ windowId: target.windowId, groupId: target.id });
  const neighbor = members.find(t => t.id !== id && !t.discarded);
  if (!neighbor) return;
  const current = await chrome.tabs.get(id);
  if (!current.active || current.windowId !== target.windowId || current.groupId !== target.id) return;
  await chrome.tabs.update(neighbor.id, { active: true });
  // Do not take focus back if the user selected something else meanwhile.
  const selected = await chrome.tabs.get(neighbor.id);
  const moved = await chrome.tabs.get(id);
  if (selected.active && selected.windowId === target.windowId
      && moved.windowId === target.windowId && moved.groupId === target.id) {
    await chrome.tabs.update(id, { active: true });
  }
}

async function route(tab) {
  if (!eligible(tab)) return;
  const sourceWindow = await chrome.windows.get(tab.windowId);
  if (sourceWindow.type !== 'normal') return;
  const name = await groupName();
  // Query all groups and compare literally: names may contain pattern characters.
  const groups = (await chrome.tabGroups.query({}))
    .filter(g => g.title === name && !g.shared)
    .sort((a, b) => Number(b.windowId === tab.windowId) - Number(a.windowId === tab.windowId) || a.id - b.id);
  const target = groups[0];
  if (target) {
    if (target.windowId !== tab.windowId) {
      await chrome.tabs.move(tab.id, { windowId: target.windowId, index: -1 });
    }
    await chrome.tabs.group({ tabIds: [tab.id], groupId: target.id });
    const movedAcrossWindows = target.windowId !== tab.windowId;
    const current = await chrome.tabs.get(tab.id);
    if (tab.active && (movedAcrossWindows || current.active)) {
      await chrome.tabGroups.update(target.id, { collapsed: false });
      if (movedAcrossWindows) {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(target.windowId, { focused: true });
      } else {
        // Cosmetic correction is best-effort: closing a tab during it must
        // not report that the already-completed grouping failed.
        try { await revealActiveTab(tab.id, target); } catch { /* Tab closed or being dragged. */ }
      }
    }
  } else {
    const id = await chrome.tabs.group({ tabIds: [tab.id] });
    await chrome.tabGroups.update(id, { title: name, color: 'blue' });
  }
  await paint();
}

async function consider(id) {
  const key = `candidate:${id}`;
  const expiry = (await chrome.storage.session.get(key))[key];
  if (!expiry) return;
  if (Date.now() > expiry || !(await enabled())) return forget(id);
  let tab;
  try { tab = await chrome.tabs.get(id); } catch { return forget(id); }
  if (!eligible(tab)) return forget(id);
  const url = tab.pendingUrl || tab.url || '';
  // onCreated can arrive before Chrome knows the destination URL.
  if (!url || url === 'about:blank') return;
  await forget(id);
  // Ignore Chrome pages, extension pages, files and manual blank new tabs.
  if (!/^https?:\/\//i.test(url)) return;
  await route(tab);
}

chrome.tabs.onCreated.addListener(tab => enqueue(async () => {
  if (!(await enabled()) || !eligible(tab)) return;
  // Prune abandoned candidates; stored values contain only IDs and deadlines.
  const state = await chrome.storage.session.get(null);
  const stale = Object.keys(state).filter(k => k.startsWith('candidate:') && state[k] < Date.now());
  if (stale.length) await chrome.storage.session.remove(stale);
  await chrome.storage.session.set({ [`candidate:${tab.id}`]: Date.now() + WAIT_MS });
  await consider(tab.id);
}));

chrome.tabs.onUpdated.addListener((id, change) => {
  if (change.url || change.status || change.groupId !== undefined) enqueue(() => consider(id));
});
chrome.tabs.onRemoved.addListener(id => enqueue(() => forget(id)));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || (!changes.enabled && !changes.groupName)) return;
  enqueue(async () => {
    if (changes.enabled) await chrome.storage.session.clear();
    await paint();
  });
});
chrome.runtime.onInstalled.addListener(() => enqueue(paint));
chrome.runtime.onStartup.addListener(() => enqueue(paint));
