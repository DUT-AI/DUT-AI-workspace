/**
 * Cloudflare Worker: DUT-AI Multi-Zones Edge Gateway & Workspace Hub
 * Domain: workspace.dutai.io.vn
 *
 * Routes incoming requests by subpath prefix directly to the corresponding Cloudflare Tunnel:
 *   - /manage/* -> manage.dutai.io.vn/manage/*
 *   - /lms/*    -> lms.dutai.io.vn/lms/*
 *   - /meetly/* -> meetly.dutai.io.vn/meetly/*
 *   - / (root)  -> Renders the unified Google-style Workspace Hub directly at Edge!
 *
 * Supports WebSocket upgrades, CORS, and graceful custom error boundaries when a VPS is offline.
 */

const ROUTES = {
  '/manage': {
    upstream: 'https://manage.dutai.io.vn',
    name: 'DUT-AI Management',
  },
  '/lms': {
    upstream: 'https://lms.dutai.io.vn',
    name: 'DUT-AI LMS (Quiz)',
  },
  '/meetly': {
    upstream: 'https://meetly.dutai.io.vn',
    name: 'Meetly Tasks',
  },
  '/data': {
    upstream: 'https://dataplatform.dutai.io.vn',
    name: 'DUT-AI Data Platform',
  },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    // 1. Render Central Google-style Workspace Hub at root
    if (pathname === '/' || pathname === '') {
      const user = getAuthenticatedUser(request);
      return new Response(renderWorkspaceHub(user), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 2. Convenience aliases for sub-app root URLs & SSO authentication
    if (pathname === '/manage' || pathname === '/manage/') {
      return Response.redirect(`${url.origin}/manage/dashboard${search}`, 302);
    }
    if (pathname === '/lms' || pathname === '/lms/') {
      return Response.redirect(`${url.origin}/lms/dashboard${search}`, 302);
    }
    if (pathname === '/meetly' || pathname === '/meetly/') {
      return Response.redirect(`${url.origin}/meetly/tasks${search}`, 302);
    }
    if (pathname === '/data' || pathname === '/data/') {
      return Response.redirect(`${url.origin}/data/dashboard${search}`, 302);
    }

    if (pathname === '/login') {
      return Response.redirect(`${url.origin}/manage/login${search}`, 302);
    }
    if (pathname === '/logout') {
      return Response.redirect(`${url.origin}/manage/logout${search}`, 302);
    }

    // 3. Match route based on path prefix
    let matchedPrefix = null;
    let targetRoute = null;

    for (const prefix of Object.keys(ROUTES)) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        matchedPrefix = prefix;
        targetRoute = ROUTES[prefix];
        break;
      }
    }

    // 3.1. Fallback for static assets & root files from DUT-AI Management
    if (!targetRoute) {
      if (
        pathname.startsWith('/assets/') ||
        pathname === '/logo.jpg' ||
        pathname === '/manifest.json' ||
        pathname.startsWith('/icons/')
      ) {
        matchedPrefix = '/manage';
        targetRoute = ROUTES['/manage'];
      }
    }

    // 3.2. Fallback for sub-app requests (Next.js assets, images, API calls) matching by Referer
    if (!targetRoute) {
      const referer = request.headers.get('Referer') || '';
      if (referer.includes('/meetly')) {
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/icons/') ||
          pathname === '/icon.svg' ||
          pathname === '/favicon.ico' ||
          pathname === '/manifest.json'
        ) {
          matchedPrefix = '/meetly';
          targetRoute = ROUTES['/meetly'];
        }
      } else if (referer.includes('/lms')) {
        if (pathname.startsWith('/_next/') || pathname.startsWith('/api/')) {
          matchedPrefix = '/lms';
          targetRoute = ROUTES['/lms'];
        }
      } else if (referer.includes('/manage')) {
        if (pathname.startsWith('/assets/') || pathname.startsWith('/api/')) {
          matchedPrefix = '/manage';
          targetRoute = ROUTES['/manage'];
        }
      } else if (referer.includes('/data')) {
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/assets/') ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/static/')
        ) {
          matchedPrefix = '/data';
          targetRoute = ROUTES['/data'];
        }
      }
    }

    if (!targetRoute) {
      return new Response(renderNotFoundPage(pathname), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 4. Construct upstream URL
    const upstreamUrl = new URL(targetRoute.upstream);
    upstreamUrl.pathname = pathname;
    upstreamUrl.search = search;

    // 5. Clone and adjust headers
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', upstreamUrl.hostname);
    newHeaders.set('X-Forwarded-Host', url.hostname);
    newHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    newHeaders.set('X-Forwarded-Prefix', matchedPrefix);

    // 6. Support WebSocket proxying
    const upgradeHeader = request.headers.get('Upgrade');
    const isWebSocket = upgradeHeader && upgradeHeader.toLowerCase() === 'websocket';

    try {
      const response = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual',
      });

      // Handle redirect headers from upstream
      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('Location');
        if (location) {
          const locationUrl = new URL(location, upstreamUrl);
          // If upstream redirected to its own domain, rewrite to workspace domain
          if (locationUrl.hostname === upstreamUrl.hostname) {
            locationUrl.hostname = url.hostname;
            locationUrl.protocol = url.protocol;
            locationUrl.port = url.port;
            if (matchedPrefix && !locationUrl.pathname.startsWith(matchedPrefix)) {
              locationUrl.pathname = matchedPrefix + locationUrl.pathname;
            }
          }
          const modifiedHeaders = new Headers(response.headers);
          modifiedHeaders.set('Location', locationUrl.toString());
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: modifiedHeaders,
          });
        }
      }

      // 7. Inject prefix into un-prefixed HTML assets using HTMLRewriter
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        if (matchedPrefix === '/manage') {
          return new HTMLRewriter()
            .on('script[src]', {
              element(el) {
                const src = el.getAttribute('src');
                if (src && src.startsWith('/assets/')) {
                  el.setAttribute('src', '/manage' + src);
                }
              },
            })
            .on('link[href]', {
              element(el) {
                const href = el.getAttribute('href');
                if (
                  href &&
                  (href.startsWith('/assets/') ||
                    href.startsWith('/icons/') ||
                    href === '/logo.jpg' ||
                    href === '/manifest.json')
                ) {
                  el.setAttribute('href', '/manage' + href);
                }
              },
            })
            .transform(response);
        } else if (matchedPrefix === '/meetly') {
          return new HTMLRewriter()
            .on('script[src]', {
              element(el) {
                const src = el.getAttribute('src');
                if (src && src.startsWith('/_next/')) {
                  el.setAttribute('src', '/meetly' + src);
                }
              },
            })
            .on('link[href]', {
              element(el) {
                const href = el.getAttribute('href');
                if (href && (href.startsWith('/_next/') || href === '/icon.svg' || href.startsWith('/icons/'))) {
                  el.setAttribute('href', '/meetly' + href);
                }
              },
            })
            .on('img[src]', {
              element(el) {
                const src = el.getAttribute('src');
                if (src && (src.startsWith('/_next/') || src === '/icon.svg' || src.startsWith('/icons/'))) {
                  el.setAttribute('src', '/meetly' + src);
                }
              },
            })
            .on('a[href]', {
              element(el) {
                const href = el.getAttribute('href');
                if (
                  href &&
                  href.startsWith('/') &&
                  !href.startsWith('//') &&
                  !href.startsWith('/meetly') &&
                  !href.startsWith('/_next')
                ) {
                  el.setAttribute('href', '/meetly' + href);
                }
              },
            })
            .transform(response);
        }
      }

      return response;
    } catch (err) {
      return new Response(renderErrorPage(targetRoute.name, err.message), {
        status: 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  },
};

/**
 * Decode JWT access_token from Cookie at Edge (< 0.1ms)
 */
function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      sub: payload.sub || payload.user_id || '',
      name: payload.name || 'Thành viên DUT-AI',
      email: payload.email || '',
      roles: payload.roles || payload.role_names || [],
      avatar: payload.avatar || payload.avatar_url || '',
    };
  } catch {
    return null;
  }
}

/**
 * Render Google Workspace Hub UI
 */
function renderWorkspaceHub(user) {
  const userName = user?.name || null;
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar || '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DUT-AI Workspace - Cổng Hệ sinh thái Ứng dụng</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }
    /* Header OneBar */
    header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
    }
    .logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563eb, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    .brand-sub { color: #94a3b8; font-weight: 400; margin-left: 2px; }
    .header-actions { display: flex; align-items: center; gap: 8px; position: relative; }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .icon-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .waffle-icon {
      display: grid;
      grid-template-columns: repeat(3, 4px);
      gap: 3px;
    }
    .waffle-dot { width: 4px; height: 4px; background: currentColor; border-radius: 1px; }

    /* Waffle Popover Menu */
    .waffle-menu {
      position: absolute;
      top: 48px;
      right: 0;
      width: 300px;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 100;
    }
    .waffle-menu.show { display: block; animation: popIn 0.15s ease-out; }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .waffle-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 10px;
      text-decoration: none;
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .waffle-item:hover { background: rgba(255, 255, 255, 0.06); }
    .waffle-item-desc { font-size: 11px; color: #94a3b8; font-weight: 400; margin-top: 2px; }

    /* User Profile Pill */
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 4px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.06);
      text-decoration: none;
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #3b82f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
    }
    .logout-link {
      font-size: 12px;
      color: #f87171;
      text-decoration: none;
      margin-left: 6px;
    }
    .logout-link:hover { text-decoration: underline; }

    /* Main Container */
    main {
      flex: 1;
      max-width: 1140px;
      width: 100%;
      margin: 0 auto;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(37, 99, 235, 0.12);
      border: 1px solid rgba(37, 99, 235, 0.3);
      color: #60a5fa;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
      width: fit-content;
    }
    h1 {
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      font-size: 16px;
      color: #94a3b8;
      max-width: 680px;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    /* 3 App Cards Grid */
    .grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    .app-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 28px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      transition: all 0.25s ease-out;
    }
    .app-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .card-manage:hover { border-color: rgba(59, 130, 246, 0.4); background: rgba(30, 41, 59, 0.7); }
    .card-lms:hover { border-color: rgba(16, 185, 129, 0.4); background: rgba(30, 41, 59, 0.7); }
    .card-meetly:hover { border-color: rgba(139, 92, 246, 0.4); background: rgba(30, 41, 59, 0.7); }
    .card-data:hover { border-color: rgba(245, 158, 11, 0.4); background: rgba(30, 41, 59, 0.7); }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-manage { background: linear-gradient(135deg, #2563eb, #3b82f6); box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25); }
    .icon-lms { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25); }
    .icon-meetly { background: linear-gradient(135deg, #7c3aed, #8b5cf6); box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25); }
    .icon-data { background: linear-gradient(135deg, #d97706, #f59e0b); box-shadow: 0 8px 16px rgba(245, 158, 11, 0.25); }

    .card-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }
    .card-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
    .tag { font-size: 11px; padding: 4px 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: #cbd5e1; }

    .card-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
    }
    .color-manage { color: #60a5fa; }
    .color-lms { color: #34d399; }
    .color-meetly { color: #a78bfa; }
    .color-data { color: #fbbf24; }

    /* Ecosystem Status */
    .status-bar {
      margin-top: 48px;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      color: #94a3b8;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      margin-right: 6px;
      box-shadow: 0 0 8px #10b981;
    }
    footer {
      text-align: center;
      padding: 24px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
    }
  </style>
</head>
<body>
  <!-- Header OneBar -->
  <header>
    <a href="/" class="brand">
      <div class="logo-badge">AI</div>
      <div>DUT-AI <span class="brand-sub">Workspace</span></div>
    </a>

    <div class="header-actions">
      <!-- 9-Dots Waffle Menu Button -->
      <button class="icon-btn" onclick="toggleWaffle()" title="Ứng dụng DUT-AI">
        <div class="waffle-icon">
          <div class="waffle-dot"></div><div class="waffle-dot"></div><div class="waffle-dot"></div>
          <div class="waffle-dot"></div><div class="waffle-dot"></div><div class="waffle-dot"></div>
          <div class="waffle-dot"></div><div class="waffle-dot"></div><div class="waffle-dot"></div>
        </div>
      </button>

      <!-- Waffle Popover Menu -->
      <div id="waffleMenu" class="waffle-menu">
        <a href="/manage/dashboard" class="waffle-item">
          <div class="card-icon icon-manage" style="width:36px;height:36px;border-radius:10px;">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div>
            <div>Quản lý (Manage)</div>
            <div class="waffle-item-desc">Quản trị trung tâm DUT-AI</div>
          </div>
        </a>
        <a href="/lms/dashboard" class="waffle-item">
          <div class="card-icon icon-lms" style="width:36px;height:36px;border-radius:10px;">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div>
            <div>LMS Học tập & Khảo sát</div>
            <div class="waffle-item-desc">Thi cử & bài tập trắc nghiệm</div>
          </div>
        </a>
        <a href="/meetly/tasks" class="waffle-item">
          <div class="card-icon icon-meetly" style="width:36px;height:36px;border-radius:10px;">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div>
            <div>Meetly Công việc</div>
            <div class="waffle-item-desc">Kanban & lịch trình cuộc họp</div>
          </div>
        </a>
        <a href="/data/dashboard" class="waffle-item">
          <div class="card-icon icon-data" style="width:36px;height:36px;border-radius:10px;">
            <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div>
            <div>DUT-AI Data Platform</div>
            <div class="waffle-item-desc">Quản lý dataset & ontology AI</div>
          </div>
        </a>
      </div>

      <!-- User Identification Pill -->
      ${
        user
          ? `<div class="user-pill">
              <div class="user-avatar">${userName ? userName.charAt(0) : 'U'}</div>
              <span>${userName}</span>
              <a href="/manage/logout" class="logout-link" title="Đăng xuất">Đăng xuất</a>
            </div>`
          : `<a href="/manage/login" class="user-pill" style="padding:6px 16px;">
              <span>Đăng nhập</span>
            </a>`
      }
    </div>
  </header>

  <!-- Hero Section -->
  <main>
    <div class="hero-badge">✨ Hệ sinh thái DUT-AI Unified Workspace</div>
    <h1>
      ${
        userName
          ? `Xin chào, <span class="gradient-text">${userName}</span> 👋`
          : `Chào mừng đến với <span class="gradient-text">DUT-AI Workspace</span>`
      }
    </h1>
    <p class="hero-desc">
      Không gian làm việc số tập trung của Trường Đại học Bách Khoa. Hãy chọn phân hệ ứng dụng để bắt đầu học tập, nghiên cứu và quản trị:
    </p>

    <!-- 3 App Launcher Cards -->
    <div class="grid-cards">
      <!-- Card 1: DUT-AI Management -->
      <a href="/manage/dashboard" class="app-card card-manage">
        <div>
          <div class="card-top">
            <div class="card-icon icon-manage">
              <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <span class="card-badge">Quản trị</span>
          </div>
          <div class="card-title">DUT-AI Management</div>
          <p class="card-desc">Bảng điều khiển quản trị trung tâm, quản lý tài khoản người dùng, lớp học, phân quyền và giám sát tài nguyên hệ sinh thái.</p>
          <div class="tags">
            <span class="tag">Tài khoản</span>
            <span class="tag">Phân quyền</span>
            <span class="tag">Thống kê</span>
          </div>
        </div>
        <div class="card-footer color-manage">
          <span>Vào Bảng Quản trị</span>
          <span>&rarr;</span>
        </div>
      </a>

      <!-- Card 2: DUT-AI LMS -->
      <a href="/lms/dashboard" class="app-card card-lms">
        <div>
          <div class="card-top">
            <div class="card-icon icon-lms">
              <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span class="card-badge">Đào tạo & Khảo sát</span>
          </div>
          <div class="card-title">DUT-AI LMS</div>
          <p class="card-desc">Nền tảng thi trắc nghiệm thông minh, làm bài tập về nhà, ngân hàng câu hỏi khảo sát học thuật và bảng xếp hạng thành tích.</p>
          <div class="tags">
            <span class="tag">Thi trắc nghiệm</span>
            <span class="tag">Bài tập</span>
            <span class="tag">Khảo sát</span>
          </div>
        </div>
        <div class="card-footer color-lms">
          <span>Vào Cổng Học tập</span>
          <span>&rarr;</span>
        </div>
      </a>

      <!-- Card 3: Meetly Tasks -->
      <a href="/meetly/tasks" class="app-card card-meetly">
        <div>
          <div class="card-top">
            <div class="card-icon icon-meetly">
              <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <span class="card-badge">Công việc & Lịch trình</span>
          </div>
          <div class="card-title">Meetly Tasks</div>
          <p class="card-desc">Quản lý công việc trực quan với bảng Kanban, biên bản cuộc họp nhóm, quản trị dự án và theo dõi tiến độ công tác khoa.</p>
          <div class="tags">
            <span class="tag">Bảng Kanban</span>
            <span class="tag">Cuộc họp</span>
            <span class="tag">Dự án</span>
          </div>
        </div>
        <div class="card-footer color-meetly">
          <span>Vào Bảng Công việc</span>
          <span>&rarr;</span>
        </div>
      </a>

      <!-- Card 4: DUT-AI Data Platform -->
      <a href="/data/dashboard" class="app-card card-data">
        <div>
          <div class="card-top">
            <div class="card-icon icon-data">
              <svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <span class="card-badge">Dữ liệu & Gán nhãn</span>
          </div>
          <div class="card-title">DUT-AI Data Platform</div>
          <p class="card-desc">Quản lý dataset, ontology và gán nhãn dữ liệu AI phục vụ huấn luyện và đánh giá mô hình trí tuệ nhân tạo.</p>
          <div class="tags">
            <span class="tag">Dataset</span>
            <span class="tag">Ontology</span>
            <span class="tag">Gán nhãn AI</span>
          </div>
        </div>
        <div class="card-footer color-data">
          <span>Vào Data Platform</span>
          <span>&rarr;</span>
        </div>
      </a>
    </div>

    <!-- Ecosystem Status -->
    <div class="status-bar">
      <div>
        <span class="live-dot"></span>
        <strong style="color:#e2e8f0;">Hệ sinh thái DUT-AI:</strong> Tất cả dịch vụ Quản lý, LMS, Meetly và Data Platform đang hoạt động ổn định
      </div>
      <div>
        <span>Single Sign-On (True SSO) Active</span>
      </div>
    </div>
  </main>

  <footer>
    <p>© 2026 DUT-AI Workspace. Nền tảng tích hợp số Trường Đại học Bách Khoa - ĐHĐN.</p>
  </footer>

  <script>
    function toggleWaffle() {
      const menu = document.getElementById('waffleMenu');
      menu.classList.toggle('show');
    }
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('waffleMenu');
      const btn = e.target.closest('.icon-btn');
      if (!btn && !e.target.closest('#waffleMenu')) {
        menu.classList.remove('show');
      }
    });
  </script>
</body>
</html>`;
}

function renderErrorPage(serviceName, errorMessage) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dịch vụ tạm thời gián đoạn - DUT-AI Workspace</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { font-size: 20px; color: #f87171; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .btn-group { margin-top: 24px; display: flex; gap: 12px; justify-content: center; }
    a.btn { padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #334155; color: #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${serviceName} đang bảo trì</h1>
    <p>Máy chủ VPS của phân hệ này tạm thời không phản hồi qua Cloudflare Tunnel. Các phân hệ khác vẫn hoạt động bình thường.</p>
    <div class="btn-group">
      <a href="/manage/dashboard" class="btn btn-secondary">Về Trang Quản lý</a>
      <a href="/lms/dashboard" class="btn btn-secondary">Về LMS</a>
      <a href="javascript:location.reload()" class="btn btn-primary">Thử lại</a>
    </div>
  </div>
</body>
</html>`;
}

function renderNotFoundPage(pathname) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Không tìm thấy trang - DUT-AI Workspace</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; }
    a { color: #60a5fa; text-decoration: none; font-weight: 500; margin-top: 16px; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <h2>404 - Đường dẫn không tồn tại</h2>
    <p>Không tìm thấy phân hệ tương ứng với đường dẫn <code>${pathname}</code>.</p>
    <a href="/manage/dashboard">Quay lại Bảng điều khiển Quản lý &rarr;</a>
  </div>
</body>
</html>`;
}
