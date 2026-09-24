import test from 'node:test';
import assert from 'node:assert/strict';
import { getResult } from './rules.mjs';

test('미선택 상태에는 결과를 내지 않는다', () => {
  assert.equal(getResult('', ''), null);
  assert.equal(getResult('online', ''), null);
});

test('온라인 지원의 이력서 본문은 제출 당시 내용이 남는다', () => {
  const result = getResult('online', 'body');
  assert.equal(result.status, 'confirmed');
  assert.match(result.title, /제출 당시/);
  assert.match(result.next, /취소 가능 여부/);
});

test('온라인 지원의 사진, 연락처, 취업우대사항은 과거 지원에 반영된다고 안내한다', () => {
  for (const change of ['photo', 'contact', 'preference']) {
    const result = getResult('online', change);
    assert.equal(result.status, 'confirmed');
    assert.match(result.title, /반영됩니다/);
  }
});

test('공식 답변에 없는 조합은 판단하지 않는다', () => {
  assert.equal(getResult('online', 'other').status, 'unknown');
  assert.equal(getResult('other', 'body').status, 'unknown');
  assert.equal(getResult('other', 'photo').status, 'unknown');
  assert.equal(getResult('online', 'unexpected'), null);
});
