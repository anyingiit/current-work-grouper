// Interface strings shared by the popup and the service worker.
// English is the default; the popup lets users switch to Simplified Chinese.
const DEFAULT_LANGUAGE = 'en';
const LEGACY_GROUP_NAME = '当前工作';
const STRINGS = {
  en: {
    languageName: 'English',
    defaultGroupName: 'Current Work',
    titleOn: name => `${name}: auto-grouping is on. Click for settings`,
    titleOff: name => `${name}: paused. Click for settings`,
    titleError: 'A tab could not be grouped (it may have been closed or dragged). Pause, then resume to reset.',
    pageTitle: 'Auto-Group Settings',
    eyebrow: 'Tab tidying',
    heading: 'Auto-Group',
    languageLabel: 'Language',
    groupLabel: 'Target group name',
    hint: 'Joins an open group with the same name first, and creates one if none is found.',
    enabledLabel: 'Auto-group new tabs',
    save: 'Save settings',
    loading: 'Loading settings…',
    footer: 'Newly opened, ungrouped web pages are grouped automatically, including links from other apps and pages opened inside the browser. Existing groups and tabs are left as they are.',
    loadError: 'Could not read settings. Close the popup and try again.',
    emptyName: 'Enter a group name; spaces alone are not allowed.',
    savedOn: name => `Saved. New tabs will go into “${name}”.`,
    savedOff: 'Saved. Auto-grouping is paused.',
    saveError: 'Could not save. Please try again.'
  },
  'zh-CN': {
    languageName: '简体中文',
    defaultGroupName: LEGACY_GROUP_NAME,
    titleOn: name => `${name}：自动归组已开启，点击设置`,
    titleOff: name => `${name}：已暂停，点击设置`,
    titleError: '有标签未能归组（可能已关闭或正在拖动）。暂停后再恢复即可重置。',
    pageTitle: '自动归组设置',
    eyebrow: '标签整理',
    heading: '自动归组',
    languageLabel: '语言',
    groupLabel: '目标分组名称',
    hint: '优先加入已打开的同名分组；找不到时自动创建。',
    enabledLabel: '开启自动归组',
    save: '保存设置',
    loading: '正在读取设置…',
    footer: '新开的未分组网页会自动归组，包括外部链接和浏览器内新开的未分组网页。已有分组和标签保持原样。',
    loadError: '无法读取设置，请关闭弹窗后重试。',
    emptyName: '请输入分组名称，不能只有空格。',
    savedOn: name => `已保存，新标签将归入「${name}」。`,
    savedOff: '已保存，自动归组已暂停。',
    saveError: '保存失败，请重试。'
  }
};

function languageOf(value) {
  return Object.hasOwn(STRINGS, value) ? value : DEFAULT_LANGUAGE;
}

function strings(language) {
  return STRINGS[languageOf(language)];
}
