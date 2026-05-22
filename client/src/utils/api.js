import * as backend from '../backend/index';

const API_BASE = '/api/v1';

function parsePath(path) {
  const p = path.startsWith(API_BASE) ? path.slice(API_BASE.length) : path;
  const qIdx = p.indexOf('?');
  return (qIdx >= 0 ? p.slice(0, qIdx) : p).split('/').filter(Boolean);
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const segs = parsePath(path);
  const body = options.body ? JSON.parse(options.body) : {};

  try {
    const data = await dispatch(method, segs, body, path);
    return data;
  } catch (err) {
    if (err.code) throw err;
    throw { code: 'UNKNOWN_ERROR', message: err.message || '请求失败' };
  }
}

async function dispatch(method, s, body, rawPath) {
  // GET /health
  if (s[0] === 'health' && method === 'GET') {
    return { status: 'ok' };
  }

  // GET /chapters
  if (s[0] === 'chapters' && s.length === 1 && method === 'GET') {
    return backend.getChapters();
  }
  // GET /chapters/:id
  if (s[0] === 'chapters' && s.length === 2 && method === 'GET') {
    return backend.getChapter(s[1]);
  }
  // GET /chapters/:id/sections
  if (s[0] === 'chapters' && s[2] === 'sections' && method === 'GET') {
    return backend.getChapterSections(s[1]);
  }

  // GET /units/:id/content
  if (s[0] === 'units' && s[2] === 'content' && method === 'GET') {
    return backend.getUnitContent(s[1]);
  }
  // GET /units/:id/quiz
  if (s[0] === 'units' && s[2] === 'quiz' && s.length === 3 && method === 'GET') {
    return backend.getQuiz(s[1]);
  }
  // POST /units/:id/quiz/submit
  if (s[0] === 'units' && s[2] === 'quiz' && s[3] === 'submit' && method === 'POST') {
    return backend.submitQuiz(s[1], body.answers);
  }
  // GET /units/:id/review/generate
  if (s[0] === 'units' && s[2] === 'review' && s[3] === 'generate' && method === 'GET') {
    return backend.generateReview(s[1]);
  }
  // POST /units/:id/review/complete
  if (s[0] === 'units' && s[2] === 'review' && s[3] === 'complete' && method === 'POST') {
    return backend.completeReview(s[1]);
  }
  // GET /units/:id/test
  if (s[0] === 'units' && s[2] === 'test' && s.length === 3 && method === 'GET') {
    return backend.getTest(s[1]);
  }
  // POST /units/:id/test/submit
  if (s[0] === 'units' && s[2] === 'test' && s[3] === 'submit' && method === 'POST') {
    return backend.submitTest(s[1], body.answers);
  }
  // GET /units/:id/finalexam
  if (s[0] === 'units' && s[2] === 'finalexam' && s.length === 3 && method === 'GET') {
    return backend.getFinalExam(s[1]);
  }
  // POST /units/:id/finalexam/submit
  if (s[0] === 'units' && s[2] === 'finalexam' && s[3] === 'submit' && method === 'POST') {
    return backend.submitFinalExam(s[1], body.answers);
  }

  // GET /progress/overview
  if (s[0] === 'progress' && s[1] === 'overview' && method === 'GET') {
    return backend.getProgressOverview();
  }
  // GET /progress/chapter/:id
  if (s[0] === 'progress' && s[1] === 'chapter' && method === 'GET') {
    return backend.getChapterProgress(s[2]);
  }

  // GET /learning/progress/unit/:id
  if (s[0] === 'learning' && s[1] === 'progress' && s[2] === 'unit' && s.length === 4 && method === 'GET') {
    return backend.getUnitProgress(s[3]);
  }
  // POST /learning/progress/unit/:id/phase/:n/complete
  if (s[0] === 'learning' && s[1] === 'progress' && s[2] === 'unit' && s[4] === 'phase' && s[6] === 'complete' && method === 'POST') {
    return backend.completePhase(s[3], s[5]);
  }
  // GET /learning/notes/:id
  if (s[0] === 'learning' && s[1] === 'notes' && s.length === 3 && method === 'GET') {
    return backend.getNotes(s[2]);
  }
  // POST /learning/notes/:id
  if (s[0] === 'learning' && s[1] === 'notes' && s.length === 3 && method === 'POST') {
    return backend.createNote(s[2], body.text);
  }
  // DELETE /learning/notes/:id
  if (s[0] === 'learning' && s[1] === 'notes' && s.length === 3 && method === 'DELETE') {
    return backend.deleteNote(s[2]);
  }

  // GET /practice/questions
  if (s[0] === 'practice' && s[1] === 'questions' && method === 'GET') {
    const url = new URL(rawPath, 'http://x');
    return backend.getPracticeQuestions(url.searchParams.get('chapter'), url.searchParams.get('sub'));
  }
  // POST /practice/submit
  if (s[0] === 'practice' && s[1] === 'submit' && method === 'POST') {
    return backend.submitPractice(body.unitId, body.questionId, body.questionType, body.answer);
  }

  // GET /errorbook
  if (s[0] === 'errorbook' && s.length === 1 && method === 'GET') {
    return backend.getErrorBook();
  }
  // GET /errorbook/due
  if (s[0] === 'errorbook' && s[1] === 'due' && method === 'GET') {
    return backend.getErrorBookDue();
  }
  // GET /errorbook/stats
  if (s[0] === 'errorbook' && s[1] === 'stats' && method === 'GET') {
    return backend.getErrorBookStats();
  }
  // PUT /errorbook/:id/mastery
  if (s[0] === 'errorbook' && s[2] === 'mastery' && method === 'PUT') {
    return backend.updateErrorMastery(parseInt(s[1]), body.masteryLevel);
  }
  // PUT /errorbook/:id/resolve
  if (s[0] === 'errorbook' && s[2] === 'resolve' && method === 'PUT') {
    return backend.resolveError(parseInt(s[1]));
  }

  // GET /recommend
  if (s[0] === 'recommend' && method === 'GET') {
    return backend.getRecommend();
  }

  // GET /countdown
  if (s[0] === 'countdown' && s.length === 1 && method === 'GET') {
    return backend.getCountdown();
  }
  // PUT /countdown
  if (s[0] === 'countdown' && s.length === 1 && method === 'PUT') {
    return backend.updateCountdown(body.name, body.target);
  }

  // GET /search
  if (s[0] === 'search' && method === 'GET') {
    const url = new URL(rawPath, 'http://x');
    return backend.search(url.searchParams.get('q') || '');
  }

  throw { code: 'NOT_FOUND', message: `Unknown API: ${method} /${s.join('/')}` };
}

export const api = {
  get: (path, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(path + query);
  },
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) =>
    request(path, { method: 'DELETE' }),
};
