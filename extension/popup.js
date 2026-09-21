const form = document.querySelector('#settings');
const fields = document.querySelector('#fields');
const nameInput = document.querySelector('#group-name');
const enabledInput = document.querySelector('#enabled');
const status = document.querySelector('#status');

function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}

async function load() {
  try {
    const settings = await chrome.storage.local.get({ groupName: '当前工作', enabled: true });
    nameInput.value = settings.groupName;
    enabledInput.checked = settings.enabled;
    fields.disabled = false;
    message('');
  } catch {
    message('无法读取设置，请关闭弹窗后重试。', true);
  }
}

nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const groupName = nameInput.value.trim();
  if (!groupName) {
    nameInput.setCustomValidity('请输入分组名称，不能只有空格。');
    nameInput.reportValidity();
    return;
  }
  fields.disabled = true;
  try {
    await chrome.storage.local.set({ groupName, enabled: enabledInput.checked });
    nameInput.value = groupName;
    message(enabledInput.checked ? `已保存，新标签将归入「${groupName}」。` : '已保存，自动归组已暂停。');
  } catch {
    message('保存失败，请重试。', true);
  } finally {
    fields.disabled = false;
  }
});

load();
