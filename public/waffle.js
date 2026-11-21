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


  const ICONS = {
    LayoutDashboard: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    GraduationCap: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
    CheckSquare: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
    Database: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>',
    Sparkles: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>',
    Globe: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
    Bot: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>',
    Cpu: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    FileText: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    BarChart: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    Layers: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.57-3.9a1 1 0 0 0 0-1.84Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>',
    Terminal: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
    AppWindow: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/></svg>',
    Rocket: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09"/><path d="M9 12a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/></svg>',
    default: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/></svg>',
  };

  const COLOR_MAP = {
    'bg-indigo-600': '#4f46e5',
    'bg-blue-600': '#2563eb',
    'bg-emerald-600': '#059669',
    'bg-violet-600': '#7c3aed',
    'bg-amber-600': '#d97706',
    'bg-rose-600': '#e11d48',
    'bg-cyan-600': '#0891b2',
    'bg-purple-600': '#9333ea',
  };

  class DutaiWaffle extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.isOpen = false;
      this.apps = []
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
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            position: relative;
            z-index: 9999;
            vertical-align: middle;
            line-height: 1.4 !important;
            -webkit-font-smoothing: antialiased;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
          }
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
            border-radius: 18px;
            box-shadow: 0 15px 35px -5px rgba(0,0,0, ${isDark ? '0.5' : '0.12'}), 0 0 0 1px rgba(0,0,0,0.04);
            padding: 10px;
            animation: fadeIn 0.12s ease-out;
            z-index: 9999;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.97) translateY(-3px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .popover-header {
            padding: 4px 8px 10px;
            border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'};
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: ${isDark ? '#60a5fa' : '#2563eb'};
          }
          .portal-link {
            font-size: 11px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 2px;
          }
          .portal-link:hover {
            color: #2563eb;
            text-decoration: underline;
          }
          .app-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .app-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 7px 8px;
            border-radius: 12px;
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
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #4f46e5;
            color: #fff;
          }

          .app-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .app-name-row {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .app-name {
            font-size: 13px;
            font-weight: 600;
            color: ${isDark ? '#f8fafc' : '#0f172a'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3 !important;
          }
          .app-desc {
            font-size: 11px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            line-height: 1.3 !important;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .badge-current {
            font-size: 10px;
            font-weight: 600;
            padding: 1px 7px;
            border-radius: 9999px;
            background: ${isDark ? '#1e40af' : '#dbeafe'};
            color: ${isDark ? '#bfdbfe' : '#1d4ed8'};
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.4 !important;
            letter-spacing: 0;
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
              const iconSvg = ICONS[app.icon] || ICONS[app.id] || ICONS.default;
              const iconBg = COLOR_MAP[app.accentColor] || '#4f46e5';
              return `
                <a href="${app.url}" class="app-item ${isCurrent ? 'active' : ''}" target="_top">
                  <div class="app-icon" style="background-color: ${iconBg};">
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
