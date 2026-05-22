export const PHASES = {
  NOT_STARTED: 0,
  LEARNED: 1,
  QUIZZED: 2,
  REVIEWED: 3,
  TESTED: 4,
  FINAL_EXAM_DONE: 5,
  COMPLETED: 6,
};

export const PHASE_LABELS = {
  0: '未开始',
  1: '已学习',
  2: '已测验',
  3: '已回顾',
  4: '已测试',
  5: '已完成真题',
  6: '全部完成',
};

export const QUESTION_TYPES = {
  FILL_BLANK: 'fill_blank',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  TERM_EXPLANATION: 'term_explanation',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
};

export const CHAPTER_NAMES = {
  'chapter-01': '运动系统', 'chapter-02': '消化系统', 'chapter-03': '呼吸系统',
  'chapter-04': '泌尿系统', 'chapter-05': '生殖系统', 'chapter-06': '循环系统',
  'chapter-07': '感觉器', 'chapter-08': '神经系统', 'chapter-09': '内分泌系统',
  'chapter-00': '绪论',
};

export const TABS = [
  { key: 'home', label: '总览', path: '/' },
  { key: 'systems', label: '系统', path: '/modules' },
  { key: 'review', label: '复习', path: '/review' },
  { key: 'exam', label: '考试', path: '/exam' },
  { key: 'me', label: '我的', path: '/me' },
];
