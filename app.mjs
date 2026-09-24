import { getResult, FAQ_URL, GUIDE_URL } from './rules.mjs';

const form = document.querySelector('#decision-form');
const result = document.querySelector('#result-content');
const reset = document.querySelector('#reset-choice');

function selected(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
}

function textNode(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (className?.includes('result-mark')) element.setAttribute('aria-hidden', 'true');
  element.textContent = value;
  return element;
}

function link(label, href, className) {
  const element = document.createElement('a');
  element.className = className;
  element.href = href;
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  element.textContent = label;
  return element;
}

function render() {
  const method = selected('method');
  const change = selected('change');
  const finding = getResult(method, change);

  result.replaceChildren();
  result.dataset.state = finding?.status ?? 'empty';

  if (!finding) {
    result.append(
      textNode('span', 'result-mark result-mark--empty', '↗'),
      textNode('p', 'result-kicker', '선택을 기다리고 있어요'),
      textNode('h3', 'result-title', !method ? '어떤 방식으로 지원했나요?' : '어떤 항목을 고쳤나요?'),
      textNode('p', 'result-description', '두 가지를 고르면 이전 지원에 어떤 내용이 남는지 확인할 수 있습니다.')
    );
    return;
  }

  const mark = finding.status === 'confirmed' ? '✓' : '?';
  const actions = document.createElement('div');
  actions.className = 'result-actions';
  actions.append(
    link('알바몬 공식 FAQ 보기', FAQ_URL, 'button-link button-link--primary'),
    link('지원 현황 안내 보기', GUIDE_URL, 'button-link button-link--quiet')
  );

  result.append(
    textNode('span', 'result-mark', mark),
    textNode('p', 'result-kicker', finding.status === 'confirmed' ? '공식 FAQ에서 확인된 범위' : '이 화면의 확인 범위 밖'),
    textNode('h3', 'result-title', finding.title),
    textNode('p', 'result-context', `알바몬 온라인 지원 · ${finding.eyebrow}`.replace('알바몬 온라인 지원 · 다른 지원 방식', '다른 지원 방식')),
    textNode('p', 'result-description', finding.description),
    textNode('h4', 'result-next-heading', '다음에 할 일'),
    textNode('p', 'result-next', finding.next),
    actions,
    textNode('p', 'result-footnote', '비공식 안내입니다. 공식 FAQ에서 ‘이력서를 수정하면 과거 기업에 지원한 이력서까지 수정되는 건가요?’ 항목을 펼쳐 확인하세요. 실제 지원 상태는 알바몬에서 확인하세요.')
  );
}

form.addEventListener('change', render);
reset.addEventListener('click', () => {
  form.reset();
  render();
  form.querySelector('input[name="method"]').focus();
});

render();
