#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';

const root = path.resolve(process.cwd());
const dataDir = path.join(root, 'data');

const ajv = new Ajv({ allErrors: true, strict: false });

async function loadJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

async function saveJson(filePath, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filePath, json, 'utf8');
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function validate(schemaPath, data, name) {
  const schema = await loadJson(schemaPath);
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (!ok) {
    const details = (validate.errors || []).map(e => `${e.instancePath || '/'} ${e.message}`).join('; ');
    throw new Error(`Invalid ${name} payload: ${details}`);
  }
}

function nowIso() {
  return new Date().toISOString();
}

async function safeFetch(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchGitHub(username) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GH_PAT;
  const headers = {
    'Accept': 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'User-Agent': 'prowess-collector'
  };

  // 1) Repos (owner)
  const repos = [];
  try {
    let page = 1;
    // up to 2 pages (200 repos) to be safe
    while (page <= 2) {
      const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=updated&page=${page}`;
      const res = await safeFetch(url, { headers });
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      repos.push(...data);
      if (data.length < 100) break;
      page++;
    }
  } catch (err) {
    console.warn(`collect-prowess: GitHub repos fetch failed: ${err?.message || err}`);
  }

  const simplifiedRepos = repos.map(r => ({
    name: r.name,
    url: r.html_url,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    language: r.language || '',
    commitCount: 0,
  }));

  // Totals
  const totalStars = simplifiedRepos.reduce((acc, r) => acc + (r.stars || 0), 0);
  let totals = { commits: 0, prs: 0, issues: 0, stars: totalStars };

  // PRs + Issues via Search API (fast, unauth has low rate)
  try {
    const qPr = `https://api.github.com/search/issues?q=author:${encodeURIComponent(username)}+type:pr+is:public`;
    const qIs = `https://api.github.com/search/issues?q=author:${encodeURIComponent(username)}+type:issue+is:public`;
    const [prRes, isRes] = await Promise.all([
      safeFetch(qPr, { headers }).catch(() => null),
      safeFetch(qIs, { headers }).catch(() => null),
    ]);
    const prJson = prRes ? await prRes.json() : { total_count: 0 };
    const isJson = isRes ? await isRes.json() : { total_count: 0 };
    totals.prs = Number(prJson.total_count || 0);
    totals.issues = Number(isJson.total_count || 0);
  } catch (_) {
    // ignore
  }

  // Concurrency util
  async function mapLimit(items, limit, mapper) {
    const results = new Array(items.length);
    let index = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      while (true) {
        const i = index++;
        if (i >= items.length) break;
        results[i] = await mapper(items[i], i);
      }
    });
    await Promise.all(workers);
    return results;
  }

  const RECENT_WEEKS = Math.max(1, Number(process.env.GH_RECENT_WEEKS || 12));

  // Helper: repo commit activity (last 52 weeks) for commitCount and recent weekly totals
  async function repoCommitActivity(owner, repoName, retries = 4) {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/stats/commit_activity`;
    let json = null;
    for (let i = 0; i < retries; i++) {
      const res = await safeFetch(url, { headers }).catch(() => null);
      if (!res) break;
      if (res.status === 202) {
        // GitHub is computing stats; wait then retry
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      try {
        json = await res.json();
      } catch (_) {
        json = null;
      }
      break;
    }
    if (!Array.isArray(json)) {
      return { commitCount: 0, recentWeeks: Array(RECENT_WEEKS).fill(0) };
    }
    const commitCount = json.reduce((acc, w) => acc + (Number(w.total) || 0), 0);
    const weeklyTotals = json.map(w => Number(w.total || 0));
    let recentWeeks = weeklyTotals.slice(-RECENT_WEEKS);
    if (recentWeeks.length < RECENT_WEEKS) {
      recentWeeks = Array(RECENT_WEEKS - recentWeeks.length).fill(0).concat(recentWeeks);
    }
    return { commitCount, recentWeeks };
  }

  const nowUtc = new Date();
  const sinceDate = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), 1));
  const sinceIso = sinceDate.toISOString();

  async function repoCommitsSince(owner, repoName, since, author, retries = 3) {
    let total = 0;
    for (let page = 1; page <= 5; page++) {
      const params = new URLSearchParams({ since, per_page: '100', page: String(page) });
      if (author) params.set('author', author);
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/commits?${params.toString()}`;
      const res = await safeFetch(url, { headers }).catch(() => null);
      if (!res) break;
      if (res.status === 202 && retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        page--;
        retries--;
        continue;
      }
      const data = await res.json().catch(() => []);
      if (!Array.isArray(data) || data.length === 0) break;
      total += data.length;
      if (data.length < 100) break;
    }
    return total;
  }

  // Fetch commit stats and languages for ALL repos with concurrency control
  const concurrency = Number(process.env.GH_CONCURRENCY || 4);
  const statsMap = new Map();
  const globalLangBytes = new Map();
  await mapLimit(simplifiedRepos, concurrency, async (repo) => {
    // commit activity
    let commitCount = 0;
    let recentWeeks = Array(RECENT_WEEKS).fill(0);
    let recentMonthCommits = 0;
    try {
      const stats = await repoCommitActivity(username, repo.name);
      commitCount = stats.commitCount;
      recentWeeks = stats.recentWeeks;
    } catch (_) {}

    try {
      recentMonthCommits = await repoCommitsSince(username, repo.name, sinceIso, username);
    } catch (_) {}

    // repo languages
    let repoLangPercents = {};
    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`;
      const res = await safeFetch(url, { headers });
      const data = await res.json();
      const total = Object.values(data || {}).reduce((a, b) => a + Number(b || 0), 0) || 0;
      if (total > 0) {
        for (const [name, bytes] of Object.entries(data)) {
          const val = Number(bytes || 0);
          const pct = Math.round((val / total) * 100);
          repoLangPercents[name] = pct;
          globalLangBytes.set(name, (globalLangBytes.get(name) || 0) + val);
        }
      }
    } catch (_) {}

    statsMap.set(repo.name, { commitCount, recentWeeks, recentMonthCommits, languages: repoLangPercents });
  });

  // Compute overall languages from aggregated bytes
  const globalTotal = Array.from(globalLangBytes.values()).reduce((a, b) => a + b, 0) || 0;
  const languages = globalTotal
    ? Array.from(globalLangBytes.entries())
        .map(([name, bytes]) => ({ name, percent: Math.round((bytes / globalTotal) * 100) }))
        .sort((a, b) => b.percent - a.percent)
    : [];
  const dominantLanguage = languages[0] || { name: '', percent: 0 };

  // Top repo by commitCount (fallback to stars)
  const rankedByCommits = simplifiedRepos
    .map(r => {
      const stat = statsMap.get(r.name) || {};
      return {
        ...r,
        commitCount: stat.commitCount || 0,
        recentMonthCommits: stat.recentMonthCommits || 0,
      };
    })
    .sort((a, b) =>
      (b.recentMonthCommits || 0) - (a.recentMonthCommits || 0) ||
      (b.commitCount || 0) - (a.commitCount || 0) ||
      (b.stars || 0) - (a.stars || 0)
    );
  const topRepoNode = rankedByCommits[0] || null;
  const topRepo = topRepoNode
    ? {
        name: topRepoNode.name,
        url: topRepoNode.url,
        stars: topRepoNode.stars,
        description: '',
        commitCount: topRepoNode.commitCount,
        recentMonthCommits: topRepoNode.recentMonthCommits || 0,
      }
    : { name: '', url: '', stars: 0, description: '', commitCount: 0, recentMonthCommits: 0 };

  // Attempt GraphQL for commits, streak and monthly if token present
  let streak = { current: 0, longest: 0 };
  let monthlyCommits = [];
  if (token) {
    try {
      const gql = `query($login:String!){
        user(login:$login){
          contributionsCollection{
            contributionCalendar{weeks{contributionDays{date contributionCount}}}
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
          }
        }
      }`;
      const resp = await safeFetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gql, variables: { login: username } }),
      });
      const json = await resp.json();
      const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
      const days = weeks.flatMap(w => w.contributionDays || []);
      // Streaks
      let current = 0, longest = 0, run = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        if ((days[i].contributionCount || 0) > 0) {
          run++;
          if (current === 0) current = run; // captures tail run
          if (run > longest) longest = run;
        } else {
          if (current && run) break;
          run = 0;
        }
      }
      streak = { current: current || 0, longest: longest || current || 0 };
      // Monthly commits (last 12 months)
      const monthly = new Map();
      for (const day of days) {
        const date = new Date(day.date);
        if (isNaN(date.getTime())) continue;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly.set(key, (monthly.get(key) || 0) + (day.contributionCount || 0));
      }
      monthlyCommits = Array.from(monthly.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
      totals.commits = days.reduce((acc, d) => acc + (d.contributionCount || 0), 0);
      // Update totals from GraphQL if REST search omitted or rate-limited (best effort)
      if (!totals.prs) totals.prs = json?.data?.user?.contributionsCollection?.totalPullRequestContributions || totals.prs;
      if (!totals.issues) totals.issues = json?.data?.user?.contributionsCollection?.totalIssueContributions || totals.issues;
    } catch (err) {
      console.warn(`collect-prowess: GitHub GraphQL failed: ${err?.message || err}`);
    }
  }

  // Compose repos list to include stats (for repos we fetched) and defaults for others
  const mergedRepos = simplifiedRepos.map(r => {
    const stat = statsMap.get(r.name);
    return {
      ...r,
      commitCount: stat?.commitCount || 0,
      recentMonthCommits: stat?.recentMonthCommits || 0,
      recentCommits: stat?.recentWeeks || Array(RECENT_WEEKS).fill(0),
      languages: stat?.languages || {}
    };
  });

  return {
    user: username,
    generatedAt: nowIso(),
    totals,
    streak,
    dominantLanguage,
    topRepo,
    repos: mergedRepos,
    monthlyCommits,
    languages,
  };
}

function toYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoDay(ts) {
  const d = new Date(ts * 1000);
  return toYmd(d);
}

function weekKey(date) {
  // ISO week key YYYY-W##
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function fetchLeetCode(username) {
  const endpoint = process.env.LC_ENDPOINT || 'https://leetcode.com/graphql/';
  const body = {
    query: `query($username:String!){
      matchedUser(username:$username){
        username
        submitStats: submitStatsGlobal{ acSubmissionNum{ difficulty count } }
        submissionCalendar
      }
      recentSubmissionList(username:$username){ title titleSlug lang statusDisplay timestamp }
    }`,
    variables: { username }
  };
  let data = null;
  try {
    const res = await safeFetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }, 25000);
    data = await res.json();
  } catch (err) {
    console.warn(`collect-prowess: LeetCode fetch failed: ${err?.message || err}`);
  }

  const stats = data?.data?.matchedUser?.submitStats?.acSubmissionNum || [];
  const totals = {
    solved: Number(stats.reduce((a, x) => a + (x.count || 0), 0)),
    easy: Number(stats.find(s => s.difficulty === 'Easy')?.count || 0),
    medium: Number(stats.find(s => s.difficulty === 'Medium')?.count || 0),
    hard: Number(stats.find(s => s.difficulty === 'Hard')?.count || 0),
  };

  // submissionCalendar: stringified JSON of { timestampSec: count }
  let calendar = {};
  try {
    const calStr = data?.data?.matchedUser?.submissionCalendar || '{}';
    const parsed = JSON.parse(calStr);
    if (parsed && typeof parsed === 'object') calendar = parsed;
  } catch (_) {}

  // Streak (current)
  const days = Object.keys(calendar).map(k => Number(k)).sort((a, b) => a - b);
  let streakDays = 0;
  if (days.length) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let cursor = new Date(today);
    for (;;) {
      const key = Math.floor(cursor.getTime() / 1000);
      const keyStr = Object.prototype.hasOwnProperty.call(calendar, String(key))
        ? String(key)
        : String(key); // direct check; calendar keys are midnight seconds
      const count = calendar[keyStr] || 0;
      if (count > 0) {
        streakDays++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
      if (streakDays > 366) break;
    }
  }

  // Weekly (last 52 weeks)
  const byWeek = new Map();
  for (const [ts, count] of Object.entries(calendar)) {
    const d = new Date(Number(ts) * 1000);
    const wk = weekKey(d);
    byWeek.set(wk, (byWeek.get(wk) || 0) + Number(count || 0));
  }
  const weekly = Array.from(byWeek.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-52).map(([week, count]) => ({ week, count }));

  const recent = Array.isArray(data?.data?.recentSubmissionList)
    ? data.data.recentSubmissionList.map(item => ({
        id: item.titleSlug,
        title: item.title,
        difficulty: '—',
        language: item.lang || '',
        status: item.statusDisplay || '',
        url: `https://leetcode.com/problems/${item.titleSlug}/`
      }))
    : [];

  const difficulty = [
    { name: 'Easy', count: totals.easy },
    { name: 'Medium', count: totals.medium },
    { name: 'Hard', count: totals.hard },
  ];

  return {
    user: username,
    generatedAt: nowIso(),
    totals,
    streakDays,
    weekly,
    recent,
    difficulty,
  };
}

async function main() {
  const profile = await loadJson(path.join(dataDir, 'profile.json'), {});
  const ghUser = process.env.GH_USERNAME || profile?.github?.username;
  const lcUser = process.env.LC_USERNAME || profile?.leetcode?.username;

  if (!ghUser && !lcUser) {
    console.error('collect-prowess: Missing usernames. Provide GH_USERNAME and/or LC_USERNAME or data/profile.json');
    process.exitCode = 1;
    return;
  }

  const tasks = [];
  if (ghUser) {
    tasks.push((async () => {
      const payload = await fetchGitHub(ghUser);
      await validate(path.join(root, 'scripts/schemas/github.schema.json'), payload, 'GitHub');
      const outPath = path.join(dataDir, 'github.json');
      await ensureDir(outPath);
      await saveJson(outPath, payload);
      console.log(`collect-prowess: wrote ${path.relative(root, outPath)}`);
    })());
  }

  if (lcUser) {
    tasks.push((async () => {
      const payload = await fetchLeetCode(lcUser);
      await validate(path.join(root, 'scripts/schemas/leetcode.schema.json'), payload, 'LeetCode');
      const outPath = path.join(dataDir, 'leetcode.json');
      await ensureDir(outPath);
      await saveJson(outPath, payload);
      console.log(`collect-prowess: wrote ${path.relative(root, outPath)}`);
    })());
  }

  await Promise.all(tasks);
}

main().catch(err => {
  console.error('collect-prowess: fatal error');
  console.error(err?.stack || err?.message || String(err));
  process.exitCode = 1;
});
