const form = document.querySelector('#settings');
const fields = document.querySelector('#fields');
const languageInput = document.querySelector('#language');
const nameInput = document.querySelector('#group-name');
const enabledInput = document.querySelector('#enabled');
const status = document.querySelector('#status');
let text = strings(DEFAULT_LANGUAGE);
let hasSavedName = false;

function message(value, error = false) {
  status.textContent = value;
  status.classList.toggle('error', error);
}

function translate(language) {
  const previous = text;
  text = strings(language);
  document.documentElement.lang = languageOf(language);
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = text[node.dataset.i18n];
  languageInput.setAttribute('aria-label', text.languageLabel);
  nameInput.placeholder = text.defaultGroupName;
  // An unsaved default name follows the language, as it does in the background.
  if (!hasSavedName && nameInput.value === previous.defaultGroupName) nameInput.value = text.defaultGroupName;
}

async function load() {
  try {
    const settings = await chrome.storage.local.get(['groupName', 'enabled', 'language']);
    const language = languageOf(settings.language);
    hasSavedName = typeof settings.groupName === 'string' && settings.groupName.trim() !== '';
    translate(language);
    languageInput.value = language;
    nameInput.value = hasSavedName ? settings.groupName : text.defaultGroupName;
    enabledInput.checked = settings.enabled ?? true;
    fields.disabled = false;
    languageInput.disabled = false;
    message('');
  } catch {
    message(text.loadError, true);
  }
}

languageInput.addEventListener('change', async () => {
  const language = languageOf(languageInput.value);
  translate(language);
  message('');
  try {
    await chrome.storage.local.set({ language });
  } catch {
    message(text.saveError, true);
  }
});

nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const groupName = nameInput.value.trim();
  if (!groupName) {
    nameInput.setCustomValidity(text.emptyName);
    nameInput.reportValidity();
    return;
  }
  fields.disabled = true;
  try {
    await chrome.storage.local.set({ groupName, enabled: enabledInput.checked });
    hasSavedName = true;
    nameInput.value = groupName;
    message(enabledInput.checked ? text.savedOn(groupName) : text.savedOff);
  } catch {
    message(text.saveError, true);
  } finally {
    fields.disabled = false;
  }
});

load();
