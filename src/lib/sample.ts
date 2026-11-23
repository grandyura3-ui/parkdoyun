import type {
  AskPersonaResponse,
  BillDraft,
  DeliberationResponse,
  ImpactResponse,
  PersonaId,
  ReflectionResponse,
  RevisionsResponse,
  ValueWeights,
} from '../types.ts';

export const EXAMPLE_BILLS: BillDraft[] = [
  {
    title: '수업 시간 휴대폰 일괄 수거',
    content:
      '아침 조회 시간(08:30)에 학급 반장이 모든 학생의 휴대폰을 수거함에 모아 교무실에 보관하고, 종례 시간(16:30) 이후에 일괄 돌려줍니다. 수업 중 사용이 필요한 경우 교과 교사의 사전 허락을 받아 일시적으로 사용할 수 있습니다.',
    purpose: '수업 중 알림과 메신저로 인한 집중력 저하를 막고, 친구들과 대면 소통하는 교실 문화를 만들기 위함입니다.',
    target: '전교생',
    sanction: '수거에 불응하거나 공기계를 제출한 경우 1차 주의, 2차 보호자 연락 및 방과 후 반성문 작성을 진행합니다.',
  },
  {
    title: '점심시간 학년별 순차 급식',
    content:
      '점심 급식실 혼잡을 줄이기 위해 3학년은 12:20, 2학년은 12:35, 1학년은 12:50에 차례로 입장합니다. 각 학년의 입장 시작 후 15분 동안은 다른 학년의 줄 서기를 제한하며, 동아리 회의 등 사유가 있는 경우 전날 신청서를 제출합니다.',
    purpose: '급식실 앞 긴 대기 줄과 새치기 갈등을 없애고 모든 학생이 최소 20분 이상 식사 시간을 확보하도록 돕기 위함입니다.',
    target: '전교생',
    sanction: '지정 시간 외 무단 입장 시 급식 도우미 학생의 안내에 따라 맨 뒤 대기 줄로 이동합니다.',
  },
  {
    title: '야간자율학습 의무 참여',
    content:
      '희망자 중심이던 야간자율학습을 평일 주 3일(월·화·목 18:30~21:00) 기본 참여로 전환합니다. 학원 수강, 예체능 실기, 가족 돌봄이나 건강 사유가 있는 학생은 학기 초에 예외 신청서를 내면 면제됩니다.',
    purpose: '사교육 접근이 어려운 학생에게도 조용하고 안정적인 자기주도 학습 공간과 진로 학습 습관을 제공하기 위함입니다.',
    target: '1학년',
    sanction: '무단 불참 3회 누적 시 담임 교사와 1:1 학습 계획 면담을 진행합니다.',
  },
];

export const SAMPLE_DELIBERATION: DeliberationResponse = {
  intake: {
    accepted: true,
    rejectReason: '',
    rejectGuide: '',
  },
  bill: {
    title: '수업 시간 휴대폰 일괄 수거에 관한 규칙안',
    clauses: [
      {
        no: '제1조',
        heading: '목적',
        text: '이 규칙은 수업 중 스마트기기 알림과 메신저 사용으로 인한 학습 방해를 줄이고, 교실 내 직접적인 대화와 집중 환경을 보호하는 것을 목적으로 합니다.',
      },
      {
        no: '제2조',
        heading: '적용 대상',
        text: '이 규칙은 본교에 재학 중인 전교생에게 일과 시간 중 적용합니다.',
      },
      {
        no: '제3조',
        heading: '내용',
        text: '학생은 오전 8시 30분 조회 시간에 학급 수거함에 휴대폰을 제출하여 교무실에 보관하고, 오후 4시 30분 종례 후 돌려받습니다. 다만 수업 자료 검색 등 교과 교사의 사전 허가가 있는 경우에는 일시적으로 사용할 수 있습니다.',
      },
      {
        no: '제4조',
        heading: '위반 시 조치',
        text: '수거에 따르지 않거나 공기계를 대신 제출한 경우 1차 구두 주의를 주며, 2차 적발 시 보호자 안내와 함께 방과 후 성찰 글쓰기를 실시합니다.',
      },
    ],
  },
  personas: [
    {
      id: 'teacher',
      roleLabel: '담당 교사',
      unseenDescription: '',
      stance: 'SUPPORT',
      headline: '수업 몰입을 위해 기준이 필요해요',
      statement:
        '수업 중간마다 진동이 울리거나 몰래 화면을 보는 학생 때문에 흐름이 자주 끊겨요. 아침에 한 번 모아두면 학생들도 눈치를 보지 않고 수업과 쉬는 시간 대화에 훨씬 잘 집중하더라고요.',
      concerns: ['수업 중 몰래 촬영·메신저 차단 어려움', '개별 제재 시 교사·학생 감정 소모'],
      demands: ['교과 수업용 태블릿과 예외 허용 절차를 명확히 안내할 것'],
      values: ['학습권', '효율'],
    },
    {
      id: 'student',
      roleLabel: '학생 대표',
      unseenDescription: '',
      stance: 'OPPOSE',
      headline: '쉬는 시간까지 일괄 수거는 과해요',
      statement:
        '수업에 집중해야 한다는 취지에는 공감하지만, 점심시간과 쉬는 시간까지 하루 종일 휴대폰을 뺏기는 건 과도하다고 느껴요. 동아리 일정 조율이나 수행평가 자료 확인도 쉬는 시간에 바로 해야 할 때가 많거든요.',
      concerns: ['쉬는·점심시간 소통 단절', '자율적 자기 조절 기회를 박탈당함'],
      demands: ['수업 시간만 가방 보관으로 제한하고 쉬는 시간 사용은 허용'],
      values: ['자유', '책임'],
    },
    {
      id: 'parent',
      roleLabel: '학부모',
      unseenDescription: '',
      stance: 'CONDITIONAL',
      headline: '분실 책임과 긴급 연락망이 걱정돼요',
      statement:
        '아이들이 수업에 집중할 수 있다면 취지는 좋아요. 하지만 고가의 휴대폰을 수거함에 한꺼번에 넣었다가 액정이 깨지거나 분실되면 누가 책임지는지 불안하고, 병원이나 집안 급한 일이 있을 때 바로 연락할 방법이 꼭 있어야 합니다.',
      concerns: ['수거함 이동 중 파손·분실 책임', '가정 내 긴급 상황 연락 지연'],
      demands: ['개별 완충 칸이 있는 잠금 보관함 설치 및 교무실 직통 비상연락 안내'],
      values: ['안전', '책임'],
    },
    {
      id: 'admin',
      roleLabel: '학교 운영',
      unseenDescription: '',
      stance: 'CONDITIONAL',
      headline: '반장이 매일 옮기는 부담이 커요',
      statement:
        '규칙을 세우는 건 어렵지 않지만 매일 아침 10여 개 학급의 무거운 수거함을 반장이 교무실까지 나르고 종례 때 다시 분배하는 행정 부담이 만만치 않아요. 보관함 설비 예산과 분실 사고 민원 처리 절차도 먼저 정해야 실행할 수 있습니다.',
      concerns: ['매일 수거·분배하는 학생·교직원 노동 부담', '파손 시 학교 배상 기준 모호'],
      demands: ['교무실 이동 대신 학급 내 잠금 캐비닛 배치 예산 검토'],
      values: ['효율', '공동체'],
    },
    {
      id: 'unseen',
      roleLabel: '보이지 않는 구성원',
      unseenDescription: '왕복 2시간 통학을 하며 버스 배차와 동생 하원 일정을 휴대폰으로 챙기는 학생',
      stance: 'OPPOSE',
      headline: '종례 직후 막차·가족 연락이 막혀요',
      statement:
        '집이 멀어 종례가 끝나자마자 바로 시외버스 정류장으로 뛰어가야 하는데, 수거함 분배가 5분만 늦어져도 버스를 놓쳐 40분을 기다려야 해요. 또 맞벌이 부모님 대신 초등학생 동생의 하원 도착 알림을 쉬는 시간에 확인해야 해서 하루 종일 마음이 불안합니다.',
      concerns: ['종례 후 수거함 대기 때문에 통학 버스 놓침', '가족 돌봄·하원 확인 알림을 확인할 수 없음'],
      demands: ['돌봄·원거리 통학 등 생활 사유가 있는 학생의 예외 소지 허가'],
      values: ['평등', '안전'],
    },
  ],
  conflicts: [
    {
      valueA: '자유·자기결정',
      valueB: '학습권·집중 환경',
      description: '개인의 기기 사용 자율성과 교실 전체의 수업 집중 분위기 사이의 충돌',
      sideA: ['student', 'unseen'],
      sideB: ['teacher', 'parent'],
    },
    {
      valueA: '집행의 효율성',
      valueB: '안전·돌봄 접근성',
      description: '아침 일괄 수거라는 단순한 관리 방식과 긴급 연락·가족 돌봄의 즉시성 사이의 충돌',
      sideA: ['teacher', 'admin'],
      sideB: ['parent', 'unseen'],
    },
    {
      valueA: '일률적 기준',
      valueB: '상황별 형평성',
      description: '모든 학생에게 똑같이 적용하는 공정함과 통학·돌봄 처지가 다른 학생에 대한 배려 사이의 충돌',
      sideA: ['teacher'],
      sideB: ['unseen', 'student'],
    },
  ],
};

export const SAMPLE_IMPACT: ImpactResponse = {
  axes: [
    {
      key: 'legitimacy',
      label: '정당성',
      score: 62,
      reason: '수업 집중 보호라는 목적은 타당하지만, 쉬는 시간과 점심시간까지 기기를 일괄 회수하는 것은 목적에 비해 제한 범위가 넓습니다.',
    },
    {
      key: 'equity',
      label: '형평성',
      score: 48,
      reason: '공기계 제출 검사를 받거나 돌봄·원거리 통학 사유가 있는 학생에게 더 큰 불안과 불편이 쏠립니다. 예외 절차가 빠져 있어 처지 차이를 반영하지 못합니다.',
    },
    {
      key: 'effectiveness',
      label: '실효성',
      score: 71,
      reason: '물리적으로 기기를 분리하므로 수업 중 알림 방해는 빠르게 줄어듭니다. 다만 공기계 제출 등 우회 행동이 생기면 감시 비용이 계속 늘어납니다.',
    },
    {
      key: 'acceptance',
      label: '수용성',
      score: 44,
      reason: '학생들의 일상 소통과 자율성이 크게 제한되어 자발적 동의를 얻기 어렵습니다. 반장과 교무실의 반복 수거 부담도 피로감을 높입니다.',
    },
  ],
  summary:
    '이 법안은 교실 수업의 집중도를 단기간에 높이는 데에는 효과가 크지만, 일괄 수거 범위가 하루 종일로 넓어 학생 자율성과 돌봄·통학이 필요한 구성원의 일상을 함께 제약합니다. 또한 수거함 파손 책임과 반장의 매일 이동 부담이 해결되지 않으면 현장에서 갈등과 편법이 반복될 가능성이 높습니다.',
  keyQuestion: '수업 집중을 지키기 위해 꼭 쉬는 시간과 점심시간까지 휴대폰을 물리적으로 분리해야 할까요?',
  sideEffects: [
    {
      title: '공기계·예비 기기 제출을 둘러싼 불신',
      type: 'EVASION',
      description: '단속이 강해질수록 실제 사용 기기 대신 여분 휴대폰을 내고 숨겨 쓰는 학생이 늘어나, 서로를 의심하며 가방 검사를 요구하는 분위기가 생깁니다.',
      affected: '전교생 및 학급 담임 교사',
      likelihood: 3,
      severity: 2,
    },
    {
      title: '원거리 통학·가족 돌봄 학생의 고립감',
      type: 'INEQUITY',
      description: '긴급 연락이나 버스·동생 돌봄 일정을 확인해야 하는 학생이 쉬는 시간마다 교무실에 허락을 구하러 가야 해 심리적 위축을 겪습니다.',
      affected: '돌봄·원거리 통학 학생',
      likelihood: 2,
      severity: 3,
    },
    {
      title: '반장·교무실의 매일 수거 노동과 파손 분쟁',
      type: 'COST',
      description: '하루 2번 수거함을 옮기는 과정에서 액정 긁힘이나 분실 의심이 발생하면 책임 소재를 가리기 어렵고 학생 간 갈등으로 번집니다.',
      affected: '학급 임원 및 행정·교무실',
      likelihood: 3,
      severity: 2,
    },
    {
      title: '수행평가·동아리 공지 전달 지연',
      type: 'UNINTENDED',
      description: '점심시간에 급히 모이거나 일정을 조정해야 하는 학생 자치 활동의 소통이 끊겨 학교 활동 효율이 떨어집니다.',
      affected: '학생회 및 동아리 참여 학생',
      likelihood: 2,
      severity: 1,
    },
  ],
  alternatives: [
    '수거함 제출 대신 수업 시작 전 "무음 전환 후 가방 보관"을 원칙으로 하고, 수업 중 적발 시에만 해당 교시 보관하는 단계적 방식',
    '교무실 일괄 이동 대신 학급별 개인 칸막이 잠금 보관함을 두어 쉬는·점심시간에는 본인이 꺼내 쓰고 수업 시간에만 잠그는 방식',
    '디지털 사용 예절 학급 자율 협약을 먼저 4주 시범 운영하고, 집중 저하가 큰 과목이나 학급만 선택적으로 보관함을 도입하는 방식',
  ],
};

export const SAMPLE_REVISIONS: RevisionsResponse = {
  revisions: [
    {
      id: 'A',
      name: '실효성 강화형',
      strategy: '학급 내 안전 보관함과 명확한 예외·책임 규정을 두어 실제로 흔들림 없이 집행되도록 보완한 안',
      clauses: [
        {
          no: '제1조',
          heading: '목적',
          text: '이 규칙은 수업 중 스마트기기 알림과 메신저 사용으로 인한 학습 방해를 줄이고, 교실 내 직접적인 대화와 집중 환경을 보호하는 것을 목적으로 합니다.',
          changeType: 'KEEP',
        },
        {
          no: '제2조',
          heading: '적용 대상',
          text: '이 규칙은 본교에 재학 중인 전교생에게 정규 수업 시간 중 적용하며, 가족 돌봄·건강 관리·원거리 통학 확인 등 정당한 사유로 학기 초 예외 승인을 받은 학생에게는 긴급 확인 용도를 허용합니다.',
          changeType: 'MODIFIED',
        },
        {
          no: '제3조',
          heading: '내용',
          text: '교무실 이동 대신 각 학급에 설치된 개별 완충 칸 잠금 보관함에 오전 8시 30분 휴대폰을 보관하며, 점심시간(12:30~13:20)과 종례 후에는 개방합니다. 수업에 필요한 경우 교과 교사 허가로 즉시 꺼내 씁니다.',
          changeType: 'MODIFIED',
        },
        {
          no: '제4조',
          heading: '위반 시 조치',
          text: '수거에 따르지 않거나 공기계를 대신 제출한 경우 1차 구두 주의를 주며, 2차 적발 시 보호자 안내와 함께 방과 후 성찰 글쓰기를 실시합니다.',
          changeType: 'KEEP',
        },
        {
          no: '제5조',
          heading: '보관 안전 및 배상',
          text: '보관함 잠금 중 학교 관리 소홀로 기기가 파손·분실된 경우 학교 안전공제 및 배상 절차에 따라 처리하며, 수거함 운반 의무는 학생에게 부과하지 않습니다.',
          changeType: 'ADDED',
        },
      ],
      changeSummary: '교무실 이동을 폐지해 파손·운반 부담을 없애고, 점심시간 개방과 정당한 사유 예외를 추가해 집행력을 높였습니다.',
      scores: {
        legitimacy: 74,
        equity: 68,
        effectiveness: 81,
        acceptance: 64,
      },
      tradeoff: '학급별 잠금 보관함 설치 예산이 들고, 쉬는 시간 사용은 여전히 제한되어 일부 학생의 불만이 남습니다.',
    },
    {
      id: 'B',
      name: '권리 보호형',
      strategy: '일괄 수거를 없애고 수업 시간 자기 조절과 최소한의 단계적 제재로 권리 침해를 줄인 안',
      clauses: [
        {
          no: '제1조',
          heading: '목적',
          text: '이 규칙은 수업 중 스마트기기 알림과 메신저 사용으로 인한 학습 방해를 줄이고, 교실 내 직접적인 대화와 집중 환경을 보호하는 것을 목적으로 합니다.',
          changeType: 'KEEP',
        },
        {
          no: '제2조',
          heading: '적용 대상',
          text: '이 규칙은 본교에 재학 중인 전교생의 정규 교과 수업 시간에 한하여 적용합니다.',
          changeType: 'MODIFIED',
        },
        {
          no: '제3조',
          heading: '내용',
          text: '일괄 수거는 실시하지 않으며, 학생은 수업 시작 종이 울리기 전 기기를 완전히 무음(진동 해제)으로 전환해 개인 가방 속에 보관합니다. 쉬는 시간과 점심시간에는 자유롭게 사용할 수 있습니다.',
          changeType: 'MODIFIED',
        },
        {
          no: '제4조',
          heading: '위반 시 조치',
          text: '수업 중 사전 허가 없이 기기를 꺼내 사용한 경우 해당 교시 종료 시까지 교사 탁자에 일시 보관한 뒤 바로 돌려줍니다. 공기계 검사나 일괄 소지품 검사는 금지합니다.',
          changeType: 'MODIFIED',
        },
      ],
      changeSummary: '일괄 수거와 종일 보관을 폐지하고, 수업 중 가방 보관과 교시 내 일시 분리만 허용해 자율성과 사생활을 보호합니다.',
      scores: {
        legitimacy: 86,
        equity: 84,
        effectiveness: 58,
        acceptance: 83,
      },
      tradeoff: '가방 속에서 몰래 사용하는 학생을 매 수업 교사가 직접 확인해야 하므로 수업 집중도 유지 효과가 들쑥날쑥할 수 있습니다.',
    },
  ],
};

export const SAMPLE_REFLECTION: ReflectionResponse = {
  profile:
    '당신은 규칙을 설계할 때 모든 사람을 한 줄로 세우기보다, 규칙 때문에 억울한 피해를 입는 소수의 상황과 구성원의 자율을 먼저 살피는 편입니다. 통제보다 신뢰를 바탕으로 합의를 만드는 입법 성향이 드러납니다.',
  tension:
    '학생의 자유와 형평성을 크게 챙긴 대신, 교사가 현장에서 느껴야 하는 지도 부담과 즉각적인 수업 집중도 확보라는 효율성은 일부 양보했습니다. 자유를 넓힐수록 각자의 책임이 더 중요해지는 긴장이 생깁니다.',
  questions: [
    '만약 자율 보관 원칙을 채택했는데도 한 달 뒤 수업 중 휴대폰 사용이 줄지 않는다면, 당신은 어떤 다음 기준을 세우겠습니까?',
    '나에게는 사소해 보이는 "5분의 대기 시간"이 다른 친구에게는 막차나 가족 돌봄과 연결될 수 있다는 점을 다른 교칙에도 적용해 본다면 어떤 규칙이 떠오르나요?',
    '규칙을 만드는 사람과 그 규칙을 매일 집행해야 하는 사람(교사·반장)의 부담은 어떻게 나누는 것이 공정할까요?',
  ],
  principle: '나는 규칙을 만들 때 모두가 편한 일률적 통제보다, 가장 크게 영향받는 사람의 사정과 자율을 먼저 지킨다.',
};

export function getSamplePersonaReply(personaId: PersonaId, question: string): AskPersonaResponse {
  const q = question.trim();
  const hasCompromise = /예외|점심|잠금|보관함|허용|완충|긴급|배상|수업/.test(q);

  const replies: Record<PersonaId, { defaultReply: string; softenedReply: string }> = {
    teacher: {
      defaultReply:
        '학생들의 불편함도 이해하지만, 30명이 모인 교실에서 자발적인 조절만 믿기에는 매 수업 흔들림이 커요. 최소한 수업 시간만큼은 알림이 울리지 않는 확실한 장치가 있어야 수업권이 지켜진다고 봅니다.',
      softenedReply:
        '말씀하신 것처럼 점심시간을 열어주거나 학급 내 안전 보관함을 두는 방식이라면 저도 찬성할 수 있어요. 수업 중 집중만 흔들리지 않는다면 학생들의 편의를 챙기는 절충안이 훨씬 좋죠.',
    },
    student: {
      defaultReply:
        '교실에 집중하자는 목표에는 저희도 동의해요. 다만 1교시부터 종례까지 온종일 휴대폰을 분리하면 학생을 믿지 못한다는 느낌을 받아요. 수업 시간만 가방에 넣는 약속으로도 충분히 해볼 수 있지 않을까요?',
      softenedReply:
        '수업 시간 외에 점심시간 사용을 보장하고 사유가 있는 친구에게 예외를 열어준다면 학생들 반발이 훨씬 줄어들 것 같아요. 학생회에서도 자율 점검 캠페인을 함께 맡아볼 수 있습니다.',
    },
    parent: {
      defaultReply:
        '학교에서 아이가 공부에 집중하길 바라는 마음은 똑같아요. 하지만 수거함에서 휴대폰이 망가지거나 급할 때 연락이 안 닿으면 부모 입장에서는 너무 불안하거든요. 안전 장치부터 먼저 약속되어야 안심할 수 있습니다.',
      softenedReply:
        '학교에서 파손 배상 기준을 분명히 하고 비상 연락 창구도 바로 연결된다면 취지에 적극 동의합니다. 아이와 가정 모두 안심할 수 있는 장치가 핵심이에요.',
    },
    admin: {
      defaultReply:
        '좋은 뜻으로 만든 규칙이라도 매일 반장이 수거함을 들고 계단을 오르내리거나 교무실이 분실 민원을 떠안게 되면 오래가지 못해요. 현장에서 감당할 수 있는 관리 방식인지 먼저 따져봐야 합니다.',
      softenedReply:
        '운반 부담을 없애고 학급별 잠금 캐비닛처럼 단순한 구조로 바꾼다면 행정적으로도 충분히 운영 가능합니다. 예산과 관리 매뉴얼만 맞으면 실행 가능성이 높아져요.',
    },
    unseen: {
      defaultReply:
        '저도 규칙을 어기고 싶은 게 아니에요. 다만 남들보다 집이 멀고 동생을 챙겨야 하는 상황이 매일 겹치다 보니, 일률적인 수거 시간 때문에 하루 종일 조마조마하게 됩니다. 저 같은 사정도 규칙 안에 자리가 있었으면 좋겠어요.',
      softenedReply:
        '그렇게 생활 사유가 있는 학생에게 예외 승인 절차를 열어주신다면 저도 마음 놓고 규칙을 따를 수 있어요. 눈치 보지 않고 정당하게 신청할 수 있는 기준만 있어도 큰 도움이 됩니다.',
    },
  };

  if (hasCompromise) {
    return {
      answer: replies[personaId].softenedReply,
      stanceShift: 'SOFTENED',
    };
  }
  return {
    answer: replies[personaId].defaultReply,
    stanceShift: 'NONE',
  };
}

export function buildSampleReflection(weights: ValueWeights, adoptedLabel: string): ReflectionResponse {
  const entries: Array<[string, number]> = [
    ['자유', weights.freedom],
    ['안전', weights.safety],
    ['평등', weights.equality],
    ['효율', weights.efficiency],
    ['책임', weights.responsibility],
    ['공동체', weights.community],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];
  const second = entries[1][0];
  const low = entries[entries.length - 1][0];

  return {
    ...SAMPLE_REFLECTION,
    profile: `${adoptedLabel}을(를) 선택한 가운데, 당신은 특히 '${top}'와 '${second}' 가치를 높게 두었습니다. 규칙이 현장에서 작동하는 방식만큼이나 그 규칙이 각 개인의 삶에 닿는 무게를 함께 살피는 입법 태도가 보입니다.`,
    tension: `'${top}' 가치를 앞세우면서 상대적으로 '${low}' 쪽의 요구는 뒤로 물러났습니다. 모든 가치를 동시에 최대로 채울 수는 없기에, 앞으로 이 선택이 현장에서 어떤 부담을 남기는지 지켜볼 필요가 있습니다.`,
  };
}
