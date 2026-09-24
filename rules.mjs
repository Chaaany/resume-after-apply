export const FAQ_URL = 'https://www.albamon.com/service-center/faq?pageIndex=1&pageRowSize=20&searchKeyword=&faqMemberType=PERSONAL&categoryNo=4';
export const GUIDE_URL = 'https://m.albamon.com/service-center/guide/resume/2';

const RESULTS = Object.freeze({
  body: {
    status: 'confirmed',
    eyebrow: '이력서 본문',
    title: '제출 당시의 내용이 남습니다',
    description: '알바몬 공식 FAQ에 따르면 온라인 지원 당시의 이력서 내용은 저장됩니다. 이후 이력서 본문을 고쳐도 이미 지원한 기업에 제출된 내용은 바뀌지 않습니다.',
    next: '고친 내용을 다시 전달해야 한다면, 알바몬 지원 현황에서 취소 가능 여부를 확인하고 공식 FAQ의 수정·재지원 안내를 따르세요.',
  },
  photo: {
    status: 'confirmed',
    eyebrow: '프로필 사진',
    title: '과거 지원에도 변경이 반영됩니다',
    description: '알바몬 공식 FAQ는 프로필 사진처럼 회원정보에 속하는 항목을 바꾸면 과거 기업에 지원한 이력서에도 반영된다고 설명합니다.',
    next: '알바몬에서 현재 사진과 해당 지원의 상태를 확인하세요. 기업에 실제로 보이는 범위는 공개 설정에 따라 달라질 수 있습니다.',
  },
  contact: {
    status: 'confirmed',
    eyebrow: '연락처·회원정보',
    title: '과거 지원에도 변경이 반영됩니다',
    description: '알바몬 공식 FAQ는 연락처 등 회원정보를 바꾸면 과거 기업에 지원한 이력서에도 반영된다고 설명합니다.',
    next: '알바몬에서 현재 회원정보와 해당 지원의 상태를 확인하세요. 기업에 실제로 보이는 범위는 공개 설정에 따라 달라질 수 있습니다.',
  },
  preference: {
    status: 'confirmed',
    eyebrow: '취업우대사항',
    title: '과거 지원에도 변경이 반영됩니다',
    description: '알바몬 공식 FAQ는 취업우대사항의 변경 내용도 과거 기업에 지원한 이력서에 반영된다고 설명합니다.',
    next: '알바몬에서 현재 취업우대사항을 확인하고, 해당 지원의 상태는 지원 현황에서 직접 확인하세요.',
  },
});

export function getResult(method, change) {
  if (!method || !change) return null;

  if (method !== 'online') {
    return {
      status: 'unknown',
      eyebrow: '다른 지원 방식',
      title: '이 안내로는 판단할 수 없습니다',
      description: '이 화면은 알바몬 온라인 지원 뒤의 변경 영향만 안내합니다. 문자·이메일 등 다른 방식에 같은 규칙이 적용되는지는 여기서 확인하지 않았습니다.',
      next: '지원한 방식의 안내와 알바몬 공식 FAQ를 확인하세요. 이미 연락한 곳이라면 전달한 내용을 해당 경로에서 직접 확인해야 합니다.',
    };
  }

  if (change === 'other') {
    return {
      status: 'unknown',
      eyebrow: '그 밖의 항목',
      title: '반영 여부를 확인할 수 없습니다',
      description: '고른 항목이 구체적으로 무엇인지 알 수 없습니다. 공식 FAQ가 명시한 이력서 본문, 프로필 사진, 회원정보, 연락처, 취업우대사항의 규칙을 다른 항목에 그대로 적용하지 않겠습니다.',
      next: '알바몬 공식 FAQ에서 해당 항목의 규칙을 확인하고, 필요하면 지원 현황에서 개별 지원을 확인하세요.',
    };
  }

  return RESULTS[change] ?? null;
}
