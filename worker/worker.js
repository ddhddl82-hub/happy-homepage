const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'happy-homepage-upload' }, 200, cors);
    }

    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGIN)) {
      return json({ ok: false, error: '허용되지 않은 홈페이지입니다.' }, 403, cors);
    }

    if (request.headers.get('x-admin-key') !== env.ADMIN_KEY) {
      return json({ ok: false, error: '관리자 비밀번호가 올바르지 않습니다.' }, 401, cors);
    }

    try {
      if (url.pathname === '/upload' && request.method === 'POST') {
        const body = await request.json();
        validatePath(body.path, 'assets/uploads/');
        if (!body.content) throw new Error('이미지 내용이 없습니다.');
        const result = await putGitHubFile(env, body.path, body.content, body.message || 'Upload homepage image');
        return json({ ok: true, path: body.path, commit: result.commit?.sha || '' }, 200, cors);
      }

      if (url.pathname === '/content' && request.method === 'POST') {
        const body = await request.json();
        if (!body.content || typeof body.content !== 'object') throw new Error('저장할 홈페이지 내용이 없습니다.');
        const encoded = utf8ToBase64(JSON.stringify(body.content, null, 2));
        const result = await putGitHubFile(env, 'data/content.json', encoded, 'Update homepage content');
        return json({ ok: true, commit: result.commit?.sha || '' }, 200, cors);
      }

      if (url.pathname === '/delete' && request.method === 'POST') {
        const body = await request.json();
        validatePath(body.path, 'assets/uploads/');
        await deleteGitHubFile(env, body.path, body.message || 'Delete homepage image');
        return json({ ok: true }, 200, cors);
      }

      return json({ ok: false, error: '지원하지 않는 요청입니다.' }, 404, cors);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: error.message || '서버 오류가 발생했습니다.' }, 500, cors);
    }
  }
};

function isAllowedOrigin(origin, allowed) {
  if (!allowed) return true;
  if (!origin) return true;
  return origin.replace(/\/$/, '') === allowed.replace(/\/$/, '');
}

function corsHeaders(origin, allowed) {
  const useOrigin = isAllowedOrigin(origin, allowed) && origin ? origin : (allowed || '*');
  return {
    'Access-Control-Allow-Origin': useOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-admin-key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(value, status, cors) {
  return new Response(JSON.stringify(value), { status, headers: { ...JSON_HEADERS, ...cors } });
}

function validatePath(path, prefix) {
  if (!path || typeof path !== 'string' || !path.startsWith(prefix) || path.includes('..')) {
    throw new Error('허용되지 않은 파일 경로입니다.');
  }
}

function githubBase(env, path) {
  const owner = encodeURIComponent(env.GITHUB_OWNER);
  const repo = encodeURIComponent(env.GITHUB_REPO);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
}

function githubHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'happy-homepage-cloudflare-worker',
    'Content-Type': 'application/json'
  };
}

async function getExistingSha(env, path) {
  const response = await fetch(`${githubBase(env, path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH || 'main')}`, {
    headers: githubHeaders(env)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub 파일 확인 실패 (${response.status})`);
  return (await response.json()).sha || null;
}

async function putGitHubFile(env, path, base64Content, message) {
  const sha = await getExistingSha(env, path);
  const payload = {
    message,
    content: String(base64Content).replace(/^data:[^;]+;base64,/, ''),
    branch: env.GITHUB_BRANCH || 'main'
  };
  if (sha) payload.sha = sha;
  const response = await fetch(githubBase(env, path), {
    method: 'PUT', headers: githubHeaders(env), body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `GitHub 저장 실패 (${response.status})`);
  return result;
}

async function deleteGitHubFile(env, path, message) {
  const sha = await getExistingSha(env, path);
  if (!sha) return;
  const response = await fetch(githubBase(env, path), {
    method: 'DELETE', headers: githubHeaders(env), body: JSON.stringify({
      message, sha, branch: env.GITHUB_BRANCH || 'main'
    })
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `GitHub 삭제 실패 (${response.status})`);
  }
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
