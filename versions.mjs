import { STORAGE_KEY, MAX_BACKUP_BYTES, emptyStore, makeVariant, makeSubmission, compareSubmission, parseBackup, validateStore } from './version-model.mjs';

const $ = (selector) => document.querySelector(selector);
const ui = {
  status: $('#status'), recovery: $('#recovery'), toolbar: $('.version-toolbar'), layout: $('.version-layout'),
  list: $('#variant-list'), empty: $('#editor-empty'), editor: $('#editor-form'), title: $('#variant-title'),
  role: $('#variant-role'), body: $('#variant-body'), saveState: $('#save-state'),
  recordForm: $('#record-form'), recordLabel: $('#record-label'), recordDate: $('#record-date'),
  recordList: $('#record-list'), recordDetail: $('#record-detail'), recordButton: $('#save-record'),
  import: $('#import-data'),
};

let store = emptyStore();
let activeId = null;
let activeRecordId = null;
let dirty = false;
let locked = false;
let lastRaw = null;

function say(message, error = false) {
  ui.status.hidden = false;
  ui.status.textContent = message;
  ui.status.dataset.kind = error ? 'error' : 'ok';
  ui.status.setAttribute('role', error ? 'alert' : 'status');
}

function selectedVariant() { return store.variants.find((item) => item.id === activeId) ?? null; }
function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function load() {
  try {
    lastRaw = localStorage.getItem(STORAGE_KEY);
    store = lastRaw ? parseBackup(lastRaw) : emptyStore();
    activeId = store.variants[0]?.id ?? null;
  } catch {
    locked = true;
    ui.toolbar.hidden = true;
    ui.layout.hidden = true;
    ui.recovery.hidden = false;
    say('저장된 자료를 읽지 못해 편집을 멈췄습니다.', true);
  }
}
function save(next) {
  if (locked) { say('다른 탭의 변경이나 저장 오류가 있어 새로고침 후 다시 시도하세요. 저장하지 않은 문안은 먼저 복사하세요.', true); return false; }
  try {
    if (localStorage.getItem(STORAGE_KEY) !== lastRaw) {
      locked = true;
      say('다른 탭에서 자료가 바뀌었습니다. 지금 문안을 복사한 뒤 새로고침하세요.', true);
      return false;
    }
    const raw = JSON.stringify(next);
    if (!validateStore(next)) throw new Error('잘못된 자료');
    if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('저장 한도 초과');
    localStorage.setItem(STORAGE_KEY, raw);
    lastRaw = raw;
    store = next;
    return true;
  } catch {
    say('브라우저에 저장하지 못했습니다. 입력한 문안을 먼저 복사하고 저장 공간이나 비공개 모드를 확인하세요.', true);
    return false;
  }
}
function confirmLeaving() {
  return !dirty || window.confirm('저장하지 않은 수정이 있습니다. 이 화면을 벗어나면 수정 내용이 사라집니다. 계속할까요?');
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderList() {
  ui.list.replaceChildren();
  if (!store.variants.length) {
    ui.list.append(element('p', 'list-empty', '문안을 만들면 여기에 표시됩니다.'));
    return;
  }
  for (const item of store.variants) {
    const button = element('button', 'variant-item');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(item.id === activeId));
    button.append(element('strong', '', item.title || '이름 없는 문안'), element('span', '', item.role || '직종 메모 없음'));
    button.addEventListener('click', () => {
      if (item.id === activeId || !confirmLeaving()) return;
      activeId = item.id;
      activeRecordId = null;
      dirty = false;
      render();
    });
    ui.list.append(button);
  }
}
function renderEditor() {
  const item = selectedVariant();
  ui.empty.hidden = Boolean(item);
  ui.editor.hidden = !item;
  if (!item) return;
  ui.title.value = item.title;
  ui.role.value = item.role;
  ui.body.value = item.body;
  ui.saveState.textContent = '저장된 문안입니다.';
  dirty = false;
}
function renderRecords() {
  ui.recordList.replaceChildren();
  const item = selectedVariant();
  ui.recordButton.disabled = !item;
  if (!item) {
    ui.recordList.append(element('p', 'list-empty', '문안을 고르면 지원 기록을 남길 수 있습니다.'));
    ui.recordDetail.hidden = true;
    return;
  }
  const records = store.submissions.filter((entry) => entry.variantId === item.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!records.length) ui.recordList.append(element('p', 'list-empty', '기록이 없습니다. 실제 지원을 마친 뒤 이 문안을 기록하세요.'));
  for (const entry of records) {
    const button = element('button', 'record-item');
    button.type = 'button';
    button.dataset.recordId = entry.id;
    button.setAttribute('aria-pressed', String(entry.id === activeRecordId));
    button.append(element('strong', '', entry.label), element('span', '', `${entry.date} · ${compareSubmission(entry, item)}`));
    button.addEventListener('click', () => {
      activeRecordId = entry.id;
      for (const recordButton of ui.recordList.querySelectorAll('.record-item')) recordButton.setAttribute('aria-pressed', String(recordButton.dataset.recordId === entry.id));
      renderRecordDetail();
    });
    ui.recordList.append(button);
  }
  renderRecordDetail();
}
function renderRecordDetail() {
  const entry = store.submissions.find((record) => record.id === activeRecordId);
  const item = selectedVariant();
  if (!entry || !item || entry.variantId !== item.id) { ui.recordDetail.hidden = true; return; }
  ui.recordDetail.hidden = false;
  ui.recordDetail.replaceChildren();
  ui.recordDetail.append(element('p', 'detail-kicker', `${entry.date} · 사용자가 기록한 문안`), element('h3', '', entry.label), element('p', 'detail-status', compareSubmission(entry, item)), element('p', 'detail-note', '실제로 제출된 내용과 같은지는 이 도구에서 확인할 수 없습니다.'));
  const savedLabel = element('h4', '', '기록할 때의 내용');
  const savedText = element('pre', 'snapshot-text', entry.body);
  const currentLabel = element('h4', '', '현재 저장된 내용');
  const currentText = element('pre', 'snapshot-text', item.body || '내용 없음');
  ui.recordDetail.append(savedLabel, savedText, currentLabel, currentText);
  const copy = element('button', '', '기록한 문안 복사');
  copy.type = 'button';
  copy.addEventListener('click', () => copyText(entry.body));
  const remove = element('button', 'danger-button', '이 기록 삭제');
  remove.type = 'button';
  remove.addEventListener('click', () => {
    if (!window.confirm('이 지원 기록을 삭제할까요? 삭제 후 복원할 수 없습니다.')) return;
    const next = { ...store, submissions: store.submissions.filter((record) => record.id !== entry.id) };
    if (save(next)) { activeRecordId = null; renderRecords(); say('지원 기록을 삭제했습니다.'); }
  });
  const actions = element('div', 'detail-actions');
  actions.append(copy, remove);
  ui.recordDetail.append(actions);
}
function render() { renderList(); renderEditor(); renderRecords(); }
async function copyText(value) {
  try { await navigator.clipboard.writeText(value); say('문안을 복사했습니다. 채용 사이트에서 직접 확인하고 붙여 넣으세요.'); }
  catch { say('자동 복사에 실패했습니다. 문안 칸에서 직접 선택해 복사하세요.', true); }
}
function download(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

load();
if (!locked) render();
ui.recordDate.value = localDate();

$('#new-variant').addEventListener('click', () => {
  if (!confirmLeaving()) return;
  if (store.variants.length >= 100) { say('문안은 최대 100개까지 저장할 수 있습니다. 필요한 문안을 백업한 뒤 정리하세요.', true); return; }
  const item = makeVariant();
  if (save({ ...store, variants: [item, ...store.variants] })) {
    activeId = item.id; activeRecordId = null; render(); ui.title.focus(); say('새 문안을 만들었습니다. 내용을 입력한 뒤 저장하세요.');
  }
});
ui.editor.addEventListener('input', () => { dirty = true; ui.saveState.textContent = '저장하지 않은 수정이 있습니다.'; });
ui.editor.addEventListener('submit', (event) => {
  event.preventDefault();
  const previous = selectedVariant();
  if (!previous) return;
  const title = ui.title.value.trim();
  const body = ui.body.value.trim();
  if (!title || !body) { say('문안 이름과 내용을 모두 입력하세요.', true); return; }
  const revised = { ...previous, title, role: ui.role.value.trim(), body, updatedAt: new Date().toISOString() };
  const next = { ...store, variants: store.variants.map((item) => item.id === activeId ? revised : item) };
  if (save(next)) { dirty = false; render(); say('문안을 저장했습니다.'); }
});
$('#copy-variant').addEventListener('click', () => { if (ui.body.value.trim()) copyText(ui.body.value); else say('복사할 문안이 없습니다.', true); });
$('#duplicate-variant').addEventListener('click', () => {
  if (!confirmLeaving()) return;
  if (store.variants.length >= 100) { say('문안은 최대 100개까지 저장할 수 있습니다.', true); return; }
  const previous = selectedVariant();
  if (!previous) return;
  const item = makeVariant({ title: `${previous.title} 복사본`.slice(0, 120), role: previous.role, body: previous.body });
  if (save({ ...store, variants: [item, ...store.variants] })) { activeId = item.id; activeRecordId = null; render(); ui.title.focus(); say('복사본을 만들었습니다.'); }
});
$('#delete-variant').addEventListener('click', () => {
  const item = selectedVariant();
  if (!item) return;
  const count = store.submissions.filter((entry) => entry.variantId === item.id).length;
  const unsaved = dirty ? '저장하지 않은 수정도 사라집니다. ' : '';
  if (!window.confirm(`‘${item.title}’ 문안을 삭제할까요? ${unsaved}연결된 지원 기록 ${count}개도 함께 삭제되며 복원할 수 없습니다. 필요하면 먼저 백업을 내려받으세요.`)) return;
  const next = { ...store, variants: store.variants.filter((entry) => entry.id !== item.id), submissions: store.submissions.filter((entry) => entry.variantId !== item.id) };
  if (save(next)) { activeId = next.variants[0]?.id ?? null; activeRecordId = null; dirty = false; render(); say('문안과 연결된 기록을 삭제했습니다.'); }
});
ui.recordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (store.submissions.length >= 500) { say('지원 기록은 최대 500개까지 저장할 수 있습니다.', true); return; }
  const item = selectedVariant();
  if (!item) return;
  if (dirty) { say('수정 중인 문안을 먼저 저장하세요. 기록은 저장된 내용으로 만듭니다.', true); return; }
  let entry;
  try { entry = makeSubmission(item, ui.recordLabel.value, ui.recordDate.value); }
  catch (error) { say(error.message, true); return; }
  if (!window.confirm('채용 사이트에서 직접 지원했고, 이 문안을 사용했다고 스스로 확인했나요? 실제 제출 내용은 이 도구에서 확인할 수 없습니다.')) return;
  if (save({ ...store, submissions: [entry, ...store.submissions] })) {
    activeRecordId = entry.id; ui.recordLabel.value = ''; renderRecords(); say('사용자가 확인한 지원 문안을 기록했습니다.');
  }
});
$('#export-data').addEventListener('click', () => {
  if (dirty && !window.confirm('저장하지 않은 수정은 백업에 포함되지 않습니다. 저장된 내용만 내려받을까요?')) return;
  download(`지원서-기록-${localDate()}.json`, JSON.stringify(store));
  say('저장된 기록의 백업 파일을 내려받았습니다. 문안 내용이 평문으로 들어 있으니 안전하게 보관하세요.');
});
$('#import-trigger').addEventListener('click', () => ui.import.click());
ui.import.addEventListener('change', async () => {
  const file = ui.import.files?.[0];
  ui.import.value = '';
  if (!file) return;
  if (!confirmLeaving()) return;
  if (file.size > MAX_BACKUP_BYTES) { say('백업 파일은 2MB 이하여야 합니다.', true); return; }
  try {
    const imported = parseBackup(await file.text());
    if (!window.confirm(`문안 ${imported.variants.length}개, 지원 기록 ${imported.submissions.length}개를 가져옵니다. 현재 자료는 모두 교체됩니다. 필요하면 취소하고 먼저 백업하세요.`)) return;
    if (save(imported)) { activeId = imported.variants[0]?.id ?? null; activeRecordId = null; dirty = false; render(); say('백업을 가져왔습니다.'); }
  } catch (error) { say(error.message, true); }
});
$('#clear-data').addEventListener('click', () => {
  const unsaved = dirty ? '저장하지 않은 수정도 사라집니다. ' : '';
  if (!window.confirm(`문안과 지원 기록을 모두 삭제할까요? ${unsaved}브라우저에서 복원할 수 없습니다. 필요하면 먼저 백업 파일을 내려받으세요.`)) return;
  if (save(emptyStore())) { activeId = null; activeRecordId = null; dirty = false; render(); say('모든 기록을 삭제했습니다.'); }
});
$('#download-raw').addEventListener('click', () => {
  try { download(`지원서-읽지못한자료-${localDate()}.json`, localStorage.getItem(STORAGE_KEY) ?? ''); }
  catch { say('읽지 못한 자료를 내려받을 수 없습니다.', true); }
});
$('#reset-corrupt').addEventListener('click', () => {
  if (!window.confirm('읽지 못한 기존 자료를 삭제하고 새로 시작할까요? 먼저 원본 파일을 내려받는 것이 좋습니다.')) return;
  try { localStorage.removeItem(STORAGE_KEY); location.reload(); } catch { say('기존 자료를 삭제하지 못했습니다.', true); }
});
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY && event.newValue !== lastRaw) { locked = true; say('다른 탭에서 기록이 바뀌었습니다. 지금 작성 중인 글을 복사한 뒤 새로고침하세요.', true); }
});
window.addEventListener('beforeunload', (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
