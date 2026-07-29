const json = (data, status = 200, origin = "*") => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "content-type,x-admin-key",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "cache-control": "no-store"
  }
});

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
  return origin && origin.replace(/\/$/, "") === allowed ? origin : allowed || "*";
}

function authorized(request, env) {
  const key = request.headers.get("X-Admin-Key") || "";
  return Boolean(env.ADMIN_KEY) && key === env.ADMIN_KEY;
}

async function github(env, path, init = {}) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "accept": "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "happy-homepage-worker",
      ...(init.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function getSha(env, path) {
  try {
    const data = await github(env, `${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`);
    return data.sha || null;
  } catch (e) {
    if (String(e.message).includes("GitHub 404")) return null;
    throw e;
  }
}

async function putFile(env, path, base64, message) {
  const sha = await getSha(env, path);
  const body = {
    message,
    content: base64,
    branch: env.GITHUB_BRANCH || "main"
  };
  if (sha) body.sha = sha;
  return github(env, path, { method: "PUT", body: JSON.stringify(body) });
}

async function deleteFile(env, path, message) {
  const sha = await getSha(env, path);
  if (!sha) return { deleted: false };
  await github(env, path, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: env.GITHUB_BRANCH || "main" })
  });
  return { deleted: true };
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);
    const url = new URL(request.url);
    try {
      if (url.pathname === "/health") return json({ ok: true, service: "happy-homepage-upload" }, 200, origin);
      if (!authorized(request, env)) return json({ ok: false, error: "관리자 인증이 필요합니다." }, 401, origin);

      if (url.pathname === "/upload" && request.method === "POST") {
        const body = await request.json();
        if (!body.base64 || !body.fileName) return json({ ok: false, error: "파일 정보가 없습니다." }, 400, origin);
        const safeName = String(body.fileName).replace(/[^a-zA-Z0-9._-]/g, "-");
        const folder = String(body.folder || "assets/gallery").replace(/[^a-zA-Z0-9/_-]/g, "");
        const path = `${folder}/${safeName}`.replace(/\/+/g, "/");
        await putFile(env, path, body.base64, `Upload gallery image: ${safeName}`);
        return json({ ok: true, path, url: `/${env.GITHUB_REPO}/${path}` }, 200, origin);
      }

      if (url.pathname === "/content" && request.method === "PUT") {
        const body = await request.json();
        const raw = JSON.stringify(body.content, null, 2);
        const base64 = btoa(unescape(encodeURIComponent(raw)));
        await putFile(env, "data/content.json", base64, "Update homepage content");
        return json({ ok: true }, 200, origin);
      }

      if (url.pathname === "/delete" && request.method === "DELETE") {
        const body = await request.json();
        const path = String(body.path || "");
        if (!path.startsWith("assets/gallery/")) return json({ ok: false, error: "삭제할 수 없는 경로입니다." }, 400, origin);
        const result = await deleteFile(env, path, `Delete gallery image: ${path}`);
        return json({ ok: true, ...result }, 200, origin);
      }

      return json({ ok: false, error: "지원하지 않는 요청입니다." }, 404, origin);
    } catch (e) {
      return json({ ok: false, error: e.message || "서버 오류" }, 500, origin);
    }
  }
};
