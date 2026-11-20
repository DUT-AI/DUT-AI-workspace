/**
 * DUT-AI Workspace Waffle Menu (Google OneBar style)
 * Standalone Web Component: <dutai-waffle current="meetly"></dutai-waffle>
 * 
 * Embed into any app:
 *   <script src="https://workspace.dutai.io.vn/waffle.js" defer></script>
 *   <dutai-waffle current="manage|lms|meetly|data"></dutai-waffle>
 */
(function() {
  if (typeof window === 'undefined' || customElements.get('dutai-waffle')) return;

  const DEFAULT_APPS = [
    {
      id: 'manage',
      title: 'DUT-AI Management',
      shortName: 'Quản trị (Manage)',
      description: 'Bảng điều khiển quản trị trung tâm, tài khoản và phân quyền',
      url: 'https://manage.dutai.io.vn',
      icon: 'manage',
    },
    {
      id: 'lms',
      title: 'DUT-AI LMS',
      shortName: 'LMS Học tập & Khảo sát',
      description: 'Thi cử, bài tập và khảo sát học thuật',
      url: 'https://lms.dutai.io.vn',
      icon: 'lms',
    },
    {
      id: 'meetly',
      title: 'Meetly Tasks',
      shortName: 'Meetly Công việc',
      description: 'Kanban, quản lý công việc và lịch trình',
      url: 'https://meetly.dutai.io.vn',
      icon: 'meetly',
    },
    {
      id: 'data',
      title: 'DUT-AI Data Platform',
      shortName: 'DUT-AI Data Platform',
      description: 'Quản lý dataset, ontology và gán nhãn dữ liệu AI',
      url: 'https://dataplatform.dutai.io.vn',
      icon: 'data',
    },
  ];

  const ICONS = {
    manage: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    LayoutDashboard: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>',
    lms: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    GraduationCap: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    meetly: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    CheckSquare: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    data: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    Database: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    default: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
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
      } catch (e) {
        // Fallback to DEFAULT_APPS
      }
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
        if (!this.contains(e.target)) {
          if (this.isOpen) {
            this.isOpen = false;
            this.render();
          }
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

      this.shadowRoot.innerHTML = `
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
            background: ${this.isOpen ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent'};
            color: ${isDark ? '#e2e8f0' : '#475569'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .waffle-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
            color: ${isDark ? '#fff' : '#0f172a'};
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
            display: ${this.isOpen ? 'block' : 'none'};
            position: absolute;
            top: 46px;
            right: 0;
            width: 320px;
            background: ${isDark ? '#1e293b' : '#ffffff'};
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
            border-radius: 20px;
            box-shadow: 0 20px 45px rgba(0,0,0, ${isDark ? '0.6' : '0.18'});
            padding: 14px;
            animation: fadeIn 0.15s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.96) translateY(-4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .popover-header {
            padding: 4px 6px 12px;
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'};
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
            color: ${isDark ? '#94a3b8' : '#64748b'};
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 3px;
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
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc'};
          }
          .app-item.active {
            background: ${isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'};
            border: 1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'};
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
            color: ${isDark ? '#f8fafc' : '#0f172a'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .app-desc {
            font-size: 11.5px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            line-height: 1.4;
            margin-top: 2px;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .badge-current {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 9999px;
            background: #2563eb;
            color: #fff;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.4;
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
            ${this.apps.map(app => {
              const isCurrent = this.current === app.id;
              const iconSvg = ICONS[app.id] || ICONS[app.icon] || ICONS.default;
              return `
                <a href="${app.url}" class="app-item ${isCurrent ? 'active' : ''}" target="_top">
                  <div class="app-icon icon-${app.id || 'default'}">
                    ${iconSvg}
                  </div>
                  <div class="app-info">
                    <div class="app-name-row">
                      <span class="app-name">${app.shortName || app.title}</span>
                      ${isCurrent ? '<span class="badge-current">Đang mở</span>' : ''}
                    </div>
                    <div class="app-desc">${app.description || ''}</div>
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  customElements.define('dutai-waffle', DutaiWaffle);
})();
