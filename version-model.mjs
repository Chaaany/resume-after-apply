export const STORAGE_KEY = 'resume-version-record:v1';
export const MAX_BACKUP_BYTES = 2_000_000;

export function emptyStore() {
  return { schema: 1, variants: [], submissions: [] };
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validString(value, max) {
  return typeof value === 'string' && value.length <= max;
}

export function validateStore(value) {
  if (!value || value.schema !== 1 || !Array.isArray(value.variants) || !Array.isArray(value.submissions)) return false;
  if (value.variants.length > 100 || value.submissions.length > 500) return false;
  const ids = new Set();
  for (const item of value.variants) {
    if (!item || !validString(item.id, 100) || !item.id || ids.has(item.id) || !validString(item.title, 120) || !validString(item.role, 120) || !validString(item.body, 50_000) || !validString(item.updatedAt, 40)) return false;
    ids.add(item.id);
  }
  ids.clear();
  for (const item of value.submissions) {
    if (!item || !validString(item.id, 100) || !item.id || ids.has(item.id) || !validString(item.variantId, 100) || !value.variants.some((variant) => variant.id === item.variantId) || !validString(item.label, 120) || !validString(item.date, 20) || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !validString(item.title, 120) || !validString(item.body, 50_000) || !validString(item.createdAt, 40)) return false;
    ids.add(item.id);
  }
  return true;
}

export function parseBackup(raw) {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('백업 파일이 2MB를 넘습니다.');
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('JSON 파일을 읽을 수 없습니다.'); }
  if (!validateStore(parsed)) throw new Error('이 서비스에서 만든 백업 형식이 아닙니다.');
  return parsed;
}

export function makeVariant({ title = '새 문안', role = '', body = '' } = {}) {
  return { id: newId(), title, role, body, updatedAt: new Date().toISOString() };
}

export function makeSubmission(variant, label, date) {
  if (!variant || !variant.body.trim()) throw new Error('내용이 있는 문안을 먼저 저장하세요.');
  if (!label.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('지원처 별칭과 날짜를 입력하세요.');
  return {
    id: newId(), variantId: variant.id, label: label.trim(), date,
    title: variant.title, body: variant.body, createdAt: new Date().toISOString(),
  };
}

export function compareSubmission(submission, variant) {
  if (!variant) return '문안 삭제됨';
  return submission.body === variant.body ? '내용 같음' : '현재 문안과 다름';
}
