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
    name: 'DUT-AI LMS',
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

/**
 * Single Source of Truth: Central Ecosystem App Registry
 * Manage, LMS, Meetly, and Data Platform all sync from here!
 */
const ECOSYSTEM_APPS = [
  {
    id: 'manage',
    title: 'DUT-AI Management',
    shortName: 'Quản trị (Manage)',
    description: 'Bảng điều khiển quản trị trung tâm, tài khoản và phân quyền',
    url: 'https://manage.dutai.io.vn',
    icon: 'manage',
    badge: 'Quản trị',
    tags: ['Tài khoản', 'Phân quyền', 'Thống kê'],
    order: 1,
    isActive: true,
  },
  {
    id: 'lms',
    title: 'DUT-AI LMS',
    shortName: 'LMS Học tập & Khảo sát',
    description: 'Nền tảng thi trắc nghiệm thông minh, làm bài tập về nhà và khảo sát',
    url: 'https://lms.dutai.io.vn',
    icon: 'lms',
    badge: 'Đào tạo & Khảo sát',
    tags: ['Thi trắc nghiệm', 'Bài tập', 'Khảo sát'],
    order: 2,
    isActive: true,
  },
  {
    id: 'meetly',
    title: 'Meetly Tasks',
    shortName: 'Meetly Công việc',
    description: 'Quản lý công việc trực quan với bảng Kanban, biên bản cuộc họp và tiến độ',
    url: 'https://meetly.dutai.io.vn',
    icon: 'meetly',
    badge: 'Công việc & Lịch trình',
    tags: ['Bảng Kanban', 'Cuộc họp', 'Dự án'],
    order: 3,
    isActive: true,
  },
  {
    id: 'data',
    title: 'DUT-AI Data Platform',
    shortName: 'Data Platform',
    description: 'Quản lý dataset, ontology và gán nhãn dữ liệu AI phục vụ huấn luyện mô hình',
    url: 'https://dataplatform.dutai.io.vn',
    icon: 'data',
    badge: 'Dữ liệu & Gán nhãn',
    tags: ['Dataset', 'Ontology', 'Gán nhãn AI'],
    order: 4,
    isActive: true,
  },
];

function getEcosystemApps(env) {
  if (env && env.ECOSYSTEM_APPS_JSON) {
    try {
      const customApps = JSON.parse(env.ECOSYSTEM_APPS_JSON);
      if (Array.isArray(customApps) && customApps.length > 0) return customApps;
    } catch {}
  }
  return ECOSYSTEM_APPS;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'public, max-age=60, s-maxage=60',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, search } = url;

    // 0. Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // 0.1. Central App Registry API for all sub-apps
    if (pathname === '/api/v1/apps' || pathname === '/api/apps') {
      const apps = getEcosystemApps(env);
      return new Response(
        JSON.stringify({
          is_success: true,
          data: apps,
          total: apps.length,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders(request),
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 0.2. Serve Standalone Waffle Menu Web Component (<dutai-waffle>)
    if (pathname === '/waffle.js') {
      const waffleScript = generateWaffleScript(getEcosystemApps(env));
      return new Response(waffleScript, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }

    // 1. Render Central Google-style Workspace Hub at root
    if (pathname === '/' || pathname === '') {
      const user = getAuthenticatedUser(request);
      const apps = getEcosystemApps(env);
      return new Response(renderWorkspaceHub(user, apps), {
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
 * SVG Icons & Styling mapping for Ecosystem apps
 */
const APP_ICONS_MAP = {
  manage: {
    waffle: '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    card: '<svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    class: 'icon-manage',
    colorClass: 'color-manage',
    cardClass: 'card-manage',
  },
  lms: {
    waffle: '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    card: '<svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    class: 'icon-lms',
    colorClass: 'color-lms',
    cardClass: 'card-lms',
  },
  meetly: {
    waffle: '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    card: '<svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    class: 'icon-meetly',
    colorClass: 'color-meetly',
    cardClass: 'card-meetly',
  },
  data: {
    waffle: '<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    card: '<svg width="26" height="26" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    class: 'icon-data',
    colorClass: 'color-data',
    cardClass: 'card-data',
  },
};

/**
 * Generate Standalone Waffle Menu Web Component (<dutai-waffle>)
 */
function generateWaffleScript(apps) {
  const serializedApps = JSON.stringify(apps);
  return `(function() {
  if (typeof window === 'undefined' || customElements.get('dutai-waffle')) return;

  const DEFAULT_APPS = ${serializedApps};

  const ICONS = {
    manage: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    lms: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    meetly: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    data: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    default: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  };

  class DutaiWaffle extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.apps = DEFAULT_APPS;
    }

    connectedCallback() {
      this.current = (this.getAttribute('current') || '').toLowerCase();
      this.fetchApps();
      this.render();
      this.setupListeners();
    }

    async fetchApps() {
      try {
        const cached = sessionStorage.getItem('dutai_ecosystem_apps');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            this.apps = list;
            this.render();
          }
        }
        const res = await fetch('https://workspace.dutai.io.vn/api/v1/apps');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json;
          if (Array.isArray(list) && list.length > 0) {
            this.apps = list;
            sessionStorage.setItem('dutai_ecosystem_apps', JSON.stringify(list));
            this.render();
          }
        }
      } catch (e) {}
    }

    setupListeners() {
      this.shadowRoot.addEventListener('click', (e) => {
        const btn = e.target.closest('.waffle-btn');
        if (btn) {
          e.stopPropagation();
          this.isOpen = !this.isOpen;
          this.render();
        }
      });

      this.onDocClick = (e) => {
        if (!this.contains(e.target) && this.isOpen) {
          this.isOpen = false;
          this.render();
        }
      };
      this.onKeyDown = (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.isOpen = false;
          this.render();
        }
      };

      document.addEventListener('click', this.onDocClick);
      document.addEventListener('keydown', this.onKeyDown);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.onDocClick);
      document.removeEventListener('keydown', this.onKeyDown);
    }

    render() {
      const isDark = document.documentElement.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;

      this.shadowRoot.innerHTML = \`
        <style>
          :host {
            display: inline-block;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            position: relative;
            z-index: 9999;
            vertical-align: middle;
          }
          * { box-sizing: border-box; }
          .waffle-btn {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: none;
            background: \${this.isOpen ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent'};
            color: \${isDark ? '#e2e8f0' : '#475569'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .waffle-btn:hover {
            background: \${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
            color: \${isDark ? '#fff' : '#0f172a'};
          }
          .grid-dots {
            display: grid;
            grid-template-columns: repeat(3, 4px);
            gap: 3px;
          }
          .dot {
            width: 4px;
            height: 4px;
            background: currentColor;
            border-radius: 1px;
          }
          .popover {
            display: \${this.isOpen ? 'block' : 'none'};
            position: absolute;
            top: 46px;
            right: 0;
            width: 320px;
            background: \${isDark ? '#1e293b' : '#ffffff'};
            border: 1px solid \${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
            border-radius: 20px;
            box-shadow: 0 20px 45px rgba(0,0,0, \${isDark ? '0.6' : '0.18'});
            padding: 14px;
            animation: fadeIn 0.15s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.96) translateY(-4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .popover-header {
            padding: 4px 6px 12px;
            border-bottom: 1px solid \${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'};
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-title {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #3b82f6;
          }
          .portal-link {
            font-size: 11px;
            color: \${isDark ? '#94a3b8' : '#64748b'};
            text-decoration: none;
            font-weight: 500;
          }
          .portal-link:hover {
            color: #3b82f6;
            text-decoration: underline;
          }
          .app-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .app-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            border-radius: 14px;
            text-decoration: none;
            color: inherit;
            transition: all 0.15s ease;
          }
          .app-item:hover {
            background: \${isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc'};
          }
          .app-item.active {
            background: \${isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'};
            border: 1px solid \${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'};
          }
          .app-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .icon-manage { background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; box-shadow: 0 4px 10px rgba(37,99,235,0.25); }
          .icon-lms { background: linear-gradient(135deg, #059669, #10b981); color: #fff; box-shadow: 0 4px 10px rgba(16,185,129,0.25); }
          .icon-meetly { background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: #fff; box-shadow: 0 4px 10px rgba(139,92,246,0.25); }
          .icon-data { background: linear-gradient(135deg, #d97706, #f59e0b); color: #fff; box-shadow: 0 4px 10px rgba(245,158,11,0.25); }
          .icon-default { background: #64748b; color: #fff; }

          .app-info {
            flex: 1;
            min-width: 0;
          }
          .app-name-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .app-name {
            font-size: 13.5px;
            font-weight: 600;
            color: \${isDark ? '#f8fafc' : '#0f172a'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .app-desc {
            font-size: 11.5px;
            color: \${isDark ? '#94a3b8' : '#64748b'};
            line-height: 1.4;
            margin-top: 2px;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .badge-current {
            font-size: 9px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            background: #3b82f6;
            color: #fff;
          }
        </style>

        <button class="waffle-btn" title="Ứng dụng DUT-AI" type="button" aria-label="Ứng dụng DUT-AI">
          <div class="grid-dots">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
          </div>
        </button>

        <div class="popover">
          <div class="popover-header">
            <span class="header-title">DUT-AI Workspace</span>
            <a href="https://workspace.dutai.io.vn" class="portal-link" target="_top">Trang chủ &rarr;</a>
          </div>
          <div class="app-list">
            \${this.apps.map(app => {
              const isCurrent = this.current === app.id;
              const iconSvg = ICONS[app.icon] || ICONS.default;
              return \`
                <a href="\${app.url}" class="app-item \${isCurrent ? 'active' : ''}" target="_top">
                  <div class="app-icon icon-\${app.icon || 'default'}">
                    \${iconSvg}
                  </div>
                  <div class="app-info">
                    <div class="app-name-row">
                      <span class="app-name">\${app.shortName || app.title}</span>
                      \${isCurrent ? '<span class="badge-current">Đang mở</span>' : ''}
                    </div>
                    <div class="app-desc">\${app.description || ''}</div>
                  </div>
                </a>
              \`;
            }).join('')}
          </div>
        </div>
      \`;
    }
  }

  customElements.define('dutai-waffle', DutaiWaffle);
})();`;
}

/**
 * Render Google Workspace Hub UI
 */
function renderWorkspaceHub(user, apps = ECOSYSTEM_APPS) {
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
        ${apps.map((app) => {
          const iconConf = APP_ICONS_MAP[app.icon] || APP_ICONS_MAP.manage;
          return `
            <a href="${app.url}" class="waffle-item">
              <div class="card-icon ${iconConf.class}" style="width:36px;height:36px;border-radius:10px;">
                ${iconConf.waffle}
              </div>
              <div>
                <div>${app.shortName || app.title}</div>
                <div class="waffle-item-desc">${app.description}</div>
              </div>
            </a>
          `;
        }).join('')}
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

    <!-- App Launcher Cards Grid (Dynamic from Central Registry) -->
    <div class="grid-cards">
      ${apps.map((app) => {
        const iconConf = APP_ICONS_MAP[app.icon] || APP_ICONS_MAP.manage;
        const tags = Array.isArray(app.tags) ? app.tags : [];
        return `
          <a href="${app.url}" class="app-card ${iconConf.cardClass}">
            <div>
              <div class="card-top">
                <div class="card-icon ${iconConf.class}">
                  ${iconConf.card}
                </div>
                <span class="card-badge">${app.badge || 'Hệ sinh thái'}</span>
              </div>
              <div class="card-title">${app.title}</div>
              <p class="card-desc">${app.description}</p>
              <div class="tags">
                ${tags.map((t) => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
            <div class="card-footer ${iconConf.colorClass}">
              <span>Mở ứng dụng</span>
              <span>&rarr;</span>
            </div>
          </a>
        `;
      }).join('')}
    </div>

    <!-- Ecosystem Status -->
    <div class="status-bar">
      <div>
        <span class="live-dot"></span>
        <strong style="color:#e2e8f0;">Hệ sinh thái DUT-AI:</strong> ${apps.length} dịch vụ đang hoạt động ổn định trên toàn hệ thống
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
