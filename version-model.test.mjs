import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyStore, makeVariant, makeSubmission, compareSubmission, parseBackup } from './version-model.mjs';

test('지원 기록은 이후 문안 수정과 독립적인 사본이다', () => {
  const variant = makeVariant({ title: '카페', body: '첫 문안' });
  const submission = makeSubmission(variant, '지원처 A', '2026-09-25');
  variant.body = '나중 문안';
  assert.equal(submission.body, '첫 문안');
  assert.equal(compareSubmission(submission, variant), '현재 문안과 다름');
});

test('백업은 제품 스키마만 받아들이고 잘못된 파일을 거절한다', () => {
  assert.deepEqual(parseBackup(JSON.stringify(emptyStore())), emptyStore());
  assert.throws(() => parseBackup('{'), /JSON/);
  assert.throws(() => parseBackup(JSON.stringify({ schema: 1, variants: [{ id: 'x', title: '', body: 3 }], submissions: [] })), /백업 형식/);
});
