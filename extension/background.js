importScripts('i18n.js');

const WAIT_MS = 10000;
let queue = Promise.resolve();

// Serialize events so a burst of links creates only one group.
function enqueue(fn) {
  queue = queue.then(fn).catch(async () => {
    // No browsing URLs are logged or saved. A closed tab is harmless;
    // other transient failures leave the tab where Chrome opened it.
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setTitle({ title: strings(await language()).titleError });
  });
  return queue;
}

async function enabled() {
  return (await chrome.storage.local.get({ enabled: true })).enabled;
}

async function language() {
  return languageOf((await chrome.storage.local.get({ language: DEFAULT_LANGUAGE })).language);
}

async function groupName() {
  const { groupName } = await chrome.storage.local.get({ groupName: '' });
  if (typeof groupName === 'string' && groupName.trim()) return groupName.trim();
  // Without a saved name, the default follows the interface language.
  return strings(await language()).defaultGroupName;
}

async function paint() {
  const on = await enabled();
  const name = await groupName();
  const text = strings(await language());
  await chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ color: on ? '#2563eb' : '#64748b' });
  await chrome.action.setTitle({ title: on ? text.titleOn(name) : text.titleOff(name) });
}

// Versions before 1.2.0 always used the Chinese default name. Keep existing
// users on that group when the default becomes English.
async function migrate(details) {
  if (details?.reason !== 'update') return;
  const [major, minor] = String(details.previousVersion).split('.').map(Number);
  if (!(major < 1 || (major === 1 && minor < 2))) return;
  const { groupName } = await chrome.storage.local.get('groupName');
  if (groupName === undefined) await chrome.storage.local.set({ groupName: LEGACY_GROUP_NAME });
}

function eligible(tab) {
  // Chrome on macOS may assign an opener even to external app links.
  return !tab.incognito && !tab.pinned
    && (tab.groupId == null || tab.groupId === -1);
}

async function forget(id) {
  await chrome.storage.session.remove(`candidate:${id}`);
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
    if (tab.active) {
      await chrome.tabGroups.update(target.id, { collapsed: false });
      await chrome.tabs.update(tab.id, { active: true });
      if (target.windowId !== tab.windowId) {
        await chrome.windows.update(target.windowId, { focused: true });
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
  if (area !== 'local' || (!changes.enabled && !changes.groupName && !changes.language)) return;
  enqueue(async () => {
    if (changes.enabled) await chrome.storage.session.clear();
    await paint();
  });
});
chrome.runtime.onInstalled.addListener(details => enqueue(async () => {
  await migrate(details);
  await paint();
}));
chrome.runtime.onStartup.addListener(() => enqueue(paint));
