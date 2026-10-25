/* ==========================================================================
   辰光 Agent 平台 · RBAC 授权原型 · 共享脚本
   - 身份切换（超级管理员 / 平台运营 / 只读审计）
   - 权限门控（data-perm / data-perm-any）
   - 侧边栏、面包屑、抽屉、提示、权限目录与矩阵渲染
   ========================================================================== */

/* ---------------- 图标 ---------------- */

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 22v-3M16 22v-3"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 11.5l2 2 4-4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  key: '<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10.5 12.5L20 3"/><path d="M15 8l2 2"/><path d="M17.5 5.5l2 2"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  lock: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  chevron: '<path d="M9 18l6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  refresh: '<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  play: '<path d="M5 3l14 9-14 9V3z"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  matrix: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.iconDone) return;
    el.innerHTML = icon(el.dataset.icon);
    el.dataset.iconDone = '1';
  });
}

/* ---------------- 权限目录 ---------------- */

const MODULES = [
  { key: 'user', label: '用户' },
  { key: 'role', label: '角色' },
  { key: 'permission', label: '权限' },
  { key: 'apikey', label: 'API 密钥' },
  { key: 'audit', label: '审计日志' },
  { key: 'alert', label: '告警规则' },
  { key: 'settings', label: '系统配置' },
  { key: 'agent', label: 'Agent' },
  { key: 'model', label: '模型' },
  { key: 'provider', label: '供应商' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'knowledge', label: '知识库' },
  { key: 'tool', label: '工具' },
  { key: 'conversation', label: '对话日志' },
  { key: 'analytics', label: '数据统计' },
];

const MODULE_NAMES = {
  read: '查看', create: '创建', update: '编辑', delete: '删除',
  assign_role: '分配角色', assign_permission: '分配权限',
  start: '启动', stop: '停止', publish: '发布', rollback: '回滚',
  test: '测试', enable: '启用', disable: '禁用',
  config: '修改配置', upload: '上传文档', doc_delete: '删除文档', doc_retry: '重试文档',
  seg_edit: '编辑分段', seg_delete: '删除分段', retrieval: '检索测试',
};

const RAW_PERMISSIONS = {
  user: ['read', 'create', 'update', 'delete', 'assign_role'],
  role: ['read', 'create', 'update', 'delete', 'assign_permission'],
  permission: ['read', 'create', 'update', 'delete'],
  apikey: ['read', 'create', 'update', 'delete'],
  audit: ['read'],
  alert: ['read', 'create', 'update', 'delete'],
  settings: ['read', 'update'],
  agent: ['read', 'create', 'update', 'delete', 'start', 'stop', 'publish', 'rollback'],
  model: ['read', 'create', 'update', 'delete', 'test'],
  provider: ['read', 'create', 'update', 'delete', 'test'],
  prompt: ['read', 'create', 'update', 'delete', 'publish', 'rollback'],
  knowledge: ['read', 'create', 'update', 'delete', 'config', 'upload', 'doc_delete', 'doc_retry', 'seg_edit', 'seg_delete', 'retrieval'],
  tool: ['read', 'create', 'update', 'delete', 'enable', 'disable', 'test'],
  conversation: ['read'],
  analytics: ['read'],
};

const PERMISSIONS = [];
MODULES.forEach((m) => {
  (RAW_PERMISSIONS[m.key] || []).forEach((op) => {
    PERMISSIONS.push({
      code: `${m.key}:${op}`,
      module: m.key,
      moduleLabel: m.label,
      name: `${m.label}${MODULE_NAMES[op] || op}`,
      op,
    });
  });
});

const PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

/* ---------------- 身份与权限集合 ---------------- */

const ROLES = {
  admin: {
    code: 'admin',
    label: '超级管理员',
    short: '管理员',
    account: '周管理',
    accountId: 'admin',
    superuser: true,
    perms: '*',
    note: '绕过全部权限校验',
  },
  ops: {
    code: 'ops',
    label: '平台运营',
    short: '运营',
    account: '陈运营',
    accountId: 'chen.ops',
    superuser: false,
    perms: [
      'agent:read', 'agent:create', 'agent:update', 'agent:start', 'agent:stop', 'agent:publish', 'agent:rollback',
      'model:read', 'model:test', 'provider:read',
      'prompt:read', 'prompt:create', 'prompt:update', 'prompt:publish', 'prompt:rollback',
      'knowledge:read', 'knowledge:create', 'knowledge:update', 'knowledge:config', 'knowledge:upload',
      'knowledge:doc_delete', 'knowledge:doc_retry', 'knowledge:seg_edit', 'knowledge:retrieval',
      'tool:read', 'tool:create', 'tool:update', 'tool:enable', 'tool:disable', 'tool:test',
      'conversation:read', 'analytics:read', 'user:read',
    ],
    note: '业务模块可编辑，系统管理只读',
  },
  auditor: {
    code: 'auditor',
    label: '只读审计',
    short: '审计',
    account: '李审计',
    accountId: 'li.audit',
    superuser: false,
    perms: PERMISSION_CODES.filter((c) => c.endsWith(':read')),
    note: '仅可查看，不可变更任何配置',
  },
};

const ROLE_ORDER = ['admin', 'ops', 'auditor'];
const ROLE_STORAGE_KEY = 'cg-rbac-role';

function currentRoleCode() {
  const saved = localStorage.getItem(ROLE_STORAGE_KEY);
  return ROLES[saved] ? saved : 'admin';
}

function currentRole() {
  return ROLES[currentRoleCode()];
}

function can(code) {
  const role = currentRole();
  if (role.superuser) return true;
  if (!code) return true;
  return role.perms.includes(code);
}

function canAny(codes) {
  if (!codes || !codes.length) return true;
  return codes.some((c) => can(c));
}

function setRole(code) {
  if (!ROLES[code]) return;
  localStorage.setItem(ROLE_STORAGE_KEY, code);
  applyGating();
  renderRoleLabels();
  renderRoleSwitch();
  document.dispatchEvent(new CustomEvent('rolechange', { detail: { role: code } }));
  toast(`已切换为${ROLES[code].label} · 当前可见 ${visiblePermCount()} 项权限`);
}

function visiblePermCount() {
  const role = currentRole();
  return role.superuser ? PERMISSIONS.length : role.perms.length;
}

function renderRoleLabels() {
  const role = currentRole();
  document.querySelectorAll('[data-role-name]').forEach((el) => { el.textContent = role.label; });
  document.querySelectorAll('[data-role-short]').forEach((el) => { el.textContent = role.short; });
  document.querySelectorAll('[data-account-name]').forEach((el) => { el.textContent = role.account; });
  document.querySelectorAll('[data-account-id]').forEach((el) => { el.textContent = role.accountId; });
  document.querySelectorAll('[data-avatar-text]').forEach((el) => { el.textContent = role.account.slice(0, 1); });
  document.querySelectorAll('[data-role-perm-count]').forEach((el) => {
    el.textContent = `${visiblePermCount()} / ${PERMISSIONS.length}`;
  });
}

function renderRoleSwitch() {
  const wrap = document.querySelector('.role-switch');
  if (!wrap) return;
  wrap.innerHTML = ROLE_ORDER.map((code) => {
    const r = ROLES[code];
    return `<button type="button" class="role-btn" data-role-btn="${code}" aria-pressed="${code === currentRoleCode()}" title="${r.label}：${r.note}">${r.short}</button>`;
  }).join('');
  wrap.querySelectorAll('[data-role-btn]').forEach((btn) => {
    btn.addEventListener('click', () => setRole(btn.dataset.roleBtn));
  });
}

/* ---------------- 权限门控 ---------------- */

function applyGating() {
  document.querySelectorAll('[data-perm]').forEach((el) => {
    el.hidden = !can(el.dataset.perm);
  });
  document.querySelectorAll('[data-perm-any]').forEach((el) => {
    const codes = el.dataset.permAny.split(',').map((s) => s.trim()).filter(Boolean);
    el.hidden = !canAny(codes);
  });
  updateRowActions();
  updateTally();
}

// 行内操作全部被隐藏时，补一个「仅查看」占位，避免出现空白操作列
function updateRowActions() {
  document.querySelectorAll('.row-actions').forEach((group) => {
    const gated = [...group.querySelectorAll('[data-perm], [data-perm-any]')];
    if (!gated.length) return;
    const anyVisible = gated.some((el) => !el.hidden);
    let fallback = group.querySelector('.row-actions-empty');
    if (!fallback) {
      fallback = document.createElement('span');
      fallback.className = 'row-actions-empty';
      fallback.textContent = '仅查看';
      group.appendChild(fallback);
    }
    fallback.hidden = anyVisible;
  });
}

function updateTally() {
  const scope = document.querySelector('[data-gate-scope]');
  if (!scope) return;
  const gated = [...scope.querySelectorAll('[data-perm], [data-perm-any]')]
    .filter((el) => !el.hasAttribute('data-tally-ignore'));
  const hidden = gated.filter((el) => el.hidden).length;
  const visible = gated.length - hidden;
  scope.querySelectorAll('[data-visible-count]').forEach((el) => { el.textContent = String(visible); });
  scope.querySelectorAll('[data-hidden-count]').forEach((el) => { el.textContent = String(hidden); });
  scope.querySelectorAll('[data-hidden-note]').forEach((el) => { el.hidden = hidden === 0; });
}

/* ---------------- 侧边栏与顶栏 ---------------- */

const NAV_MAIN = [
  { page: 'dashboard', label: '工作台', href: 'dashboard.html', icon: 'grid' },
  { page: 'agents', label: 'Agent管理', href: '#', icon: 'bot', perm: 'agent:read' },
  { page: 'models', label: '模型管理', href: '#', icon: 'cpu', permAny: 'model:read,provider:read' },
  { page: 'prompts', label: 'Prompt管理', href: '#', icon: 'file', perm: 'prompt:read' },
  { page: 'knowledge', label: '知识库', href: '#', icon: 'database', perm: 'knowledge:read' },
  { page: 'tools', label: '工具管理', href: '#', icon: 'tool', perm: 'tool:read' },
  { page: 'conversations', label: '对话日志', href: '#', icon: 'message', perm: 'conversation:read' },
  { page: 'analytics', label: '数据统计', href: '#', icon: 'chart', perm: 'analytics:read' },
];

const NAV_SYSTEM = [
  { page: 'users', label: '用户管理', href: 'users.html', perm: 'user:read' },
  { page: 'roles', label: '角色管理', href: 'roles.html', perm: 'role:read' },
  { page: 'permissions', label: '权限管理', href: 'permissions.html', perm: 'permission:read' },
  { page: 'matrix', label: '权限矩阵', href: 'matrix.html', perm: 'role:read' },
  { page: 'apikeys', label: 'API 密钥', href: '#', perm: 'apikey:read' },
  { page: 'audit', label: '审计日志', href: '#', perm: 'audit:read' },
  { page: 'alerts', label: '告警规则', href: '#', perm: 'alert:read' },
  { page: 'settings', label: '系统配置', href: '#', perm: 'settings:read' },
];

function navItem(item, activePage, sub = false) {
  const active = item.page === activePage ? ' active' : '';
  const current = item.page === activePage ? ' aria-current="page"' : '';
  const permAttr = item.perm ? ` data-perm="${item.perm}"` : (item.permAny ? ` data-perm-any="${item.permAny}"` : '');
  const ico = item.icon ? `<span class="ico" data-icon="${item.icon}"></span>` : '';
  return `<a class="nav-item${active}" href="${item.href}"${current}${permAttr}>${ico}<span>${item.label}</span></a>`;
}

function renderShell() {
  const page = document.body.dataset.page || '';
  const sidebar = document.getElementById('sidebar');
  const topbar = document.getElementById('topbar');

  if (sidebar) {
    sidebar.innerHTML = `
      <div class="brand">
        <div class="brand-mark" data-icon="shield"></div>
        <div class="brand-text">
          <div class="brand-name">辰光 Agent</div>
          <div class="brand-sub">Enterprise</div>
        </div>
      </div>
      <nav class="nav">
        <div class="nav-label">平台功能</div>
        ${NAV_MAIN.map((i) => navItem(i, page)).join('')}
        <div class="nav-label">系统管理</div>
        <div class="nav-sub">
          ${NAV_SYSTEM.map((i) => navItem(i, page)).join('')}
        </div>
      </nav>
      <div class="sidebar-foot">
        <a class="side-link" href="denied.html"><span class="ico" data-icon="lock" style="width:13px;height:13px"></span>无权限页示例</a>
        <div class="user-chip">
          <div class="avatar" data-avatar-text>${currentRole().account.slice(0, 1)}</div>
          <div class="user-meta">
            <div class="user-name" data-account-name>${currentRole().account}</div>
            <div class="user-role"><span data-role-name>${currentRole().label}</span></div>
          </div>
          <span style="width:14px;height:14px;opacity:.5" data-icon="logout"></span>
        </div>
      </div>`;
  }

  if (topbar) {
    const group = document.body.dataset.group || '';
    const title = document.body.dataset.title || '';
    const crumbs = group
      ? `<span>首页</span><span class="sep">/</span><span>${group}</span><span class="sep">/</span><span class="now">${title}</span>`
      : `<span>首页</span><span class="sep">/</span><span class="now">${title}</span>`;
    topbar.innerHTML = `
      <div class="crumbs">${crumbs}</div>
      <div class="topbar-right">
        <span class="role-label">演示身份</span>
        <div class="role-switch" role="group" aria-label="切换演示身份"></div>
        <a class="btn btn-ghost btn-sm" href="index.html"><span style="width:14px;height:14px" data-icon="info"></span>原型说明</a>
      </div>`;
  }

  renderRoleSwitch();
  hydrateIcons();
}

/* ---------------- 抽屉 / 提示 ---------------- */

function openDrawer(id) {
  const drawer = document.getElementById(id);
  if (!drawer) return;
  const scrim = document.getElementById('scrim') || createScrim();
  drawer.classList.add('open');
  scrim.classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = drawer.querySelector('input, button, select, textarea');
  if (first) setTimeout(() => first.focus(), 60);
}

function closeDrawers() {
  document.querySelectorAll('.drawer.open').forEach((d) => d.classList.remove('open'));
  const scrim = document.getElementById('scrim');
  if (scrim) scrim.classList.remove('open');
  document.body.style.overflow = '';
}

function createScrim() {
  const scrim = document.createElement('div');
  scrim.id = 'scrim';
  scrim.className = 'scrim';
  scrim.addEventListener('click', closeDrawers);
  document.body.appendChild(scrim);
  return scrim;
}

let toastTimer = null;
function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `<span style="width:15px;height:15px" data-icon="check"></span><span>${message}</span>`;
  hydrateIcons(el);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------- 权限目录渲染 ---------------- */

const SYSTEM_KEYS = ['user', 'role', 'permission', 'apikey', 'audit', 'alert', 'settings'];

function renderCatalog() {
  const body = document.querySelector('[data-catalog-body]');
  if (!body) return;
  const filter = body.dataset.moduleFilter || 'all';
  const query = (document.querySelector('[data-catalog-search]')?.value || '').trim().toLowerCase();

  const groups = MODULES
    .filter((m) => {
      if (filter === 'all') return true;
      if (filter === 'system') return SYSTEM_KEYS.includes(m.key);
      if (filter === 'business') return !SYSTEM_KEYS.includes(m.key);
      return m.key === filter;
    })
    .map((m) => {
      const items = PERMISSIONS.filter((p) => p.module === m.key).filter((p) => {
        if (!query) return true;
        return p.code.toLowerCase().includes(query) || p.name.toLowerCase().includes(query);
      });
      return { module: m, items };
    })
    .filter((g) => g.items.length > 0);

  if (!groups.length) {
    body.innerHTML = '<div class="empty"><strong>没有匹配的权限码</strong>换个关键词，或切回「全部模块」。</div>';
    return;
  }

  body.innerHTML = groups.map(({ module, items }) => `
    <div class="perm-group" data-module-group>
      <div class="perm-group-head">
        <span>${module.label}</span>
        <span class="count">${items.length} 项</span>
      </div>
      <table class="tbl">
        <tbody>
          ${items.map((p) => `
            <tr data-filter-row>
              <td style="width:190px"><span class="code">${p.code}</span></td>
              <td class="cell-name">${p.name}</td>
              <td style="width:92px">
                <div class="row-actions">
                  <button class="btn btn-ghost btn-icon" title="编辑权限" data-tally-ignore data-perm="permission:update" data-toast="已打开「${p.name}」的编辑面板（原型示意）"><span style="width:14px;height:14px" data-icon="edit"></span></button>
                  <button class="btn btn-ghost btn-icon" title="删除权限" data-tally-ignore data-perm="permission:delete" data-toast="删除权限 ${p.code} 将影响已分配该权限的角色（原型示意）"><span style="width:14px;height:14px;color:var(--danger)" data-icon="trash"></span></button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  hydrateIcons(body);
  applyGating();
}

/* ---------------- 权限矩阵 ---------------- */

const MATRIX_MODULES = ['user', 'role', 'permission', 'apikey', 'audit', 'alert', 'settings', 'agent', 'model', 'provider', 'prompt', 'knowledge', 'tool', 'conversation', 'analytics'];
const MATRIX_COLS = ['read', 'create', 'update', 'delete'];

function hasOp(perms, module, op) {
  return perms.includes(`${module}:${op}`);
}

function specialCodes(module) {
  return (RAW_PERMISSIONS[module] || []).filter((op) => !MATRIX_COLS.includes(op));
}

function matrixCell(perms, module, op, superuser) {
  const on = superuser || hasOp(perms, module, op);
  return `<td><span class="dot ${on ? 'on' : ''}${on && superuser ? ' sup' : ''}" aria-label="${on ? '已授予' : '未授予'}"></span></td>`;
}

function renderCurrentRoleMatrix() {
  const body = document.querySelector('[data-role-matrix-body]');
  if (!body) return;
  const role = currentRole();
  const perms = role.superuser ? PERMISSION_CODES : role.perms;
  body.innerHTML = MATRIX_MODULES.map((m) => {
    const mod = MODULES.find((x) => x.key === m);
    const special = specialCodes(m);
    const specialOn = special.filter((op) => role.superuser || perms.includes(`${m}:${op}`));
    return `<tr>
      <th>${mod.label}</th>
      ${MATRIX_COLS.map((op) => matrixCell(perms, m, op, role.superuser)).join('')}
      <td>${special.length ? `<span class="dot count">${specialOn.length}/${special.length}</span>` : '<span class="dot"></span>'}</td>
    </tr>`;
  }).join('');
}

const MINI_MODULES = ['user', 'role', 'permission', 'agent', 'knowledge', 'tool'];

function renderMiniMatrix() {
  const body = document.querySelector('[data-mini-matrix-body]');
  if (!body) return;
  const role = currentRole();
  const perms = role.superuser ? PERMISSION_CODES : role.perms;
  body.innerHTML = MINI_MODULES.map((m) => {
    const mod = MODULES.find((x) => x.key === m);
    const special = specialCodes(m);
    const specialOn = special.filter((op) => role.superuser || perms.includes(`${m}:${op}`));
    return `<div class="mini-row">
      <span class="mod">${mod.label}</span>
      ${MATRIX_COLS.map((op) => `<span class="cell"><span class="dot ${role.superuser || hasOp(perms, m, op) ? 'on' : ''}${role.superuser ? ' sup' : ''}"></span></span>`).join('')}
      <span class="cell">${special.length ? `<span class="dot count">${specialOn.length}/${special.length}</span>` : '<span class="dot"></span>'}</span>
    </div>`;
  }).join('');
}

function renderFullMatrix() {
  const body = document.querySelector('[data-full-matrix-body]');
  if (!body) return;
  const roles = ROLE_ORDER.map((c) => ROLES[c]);
  body.innerHTML = MATRIX_MODULES.map((m) => {
    const mod = MODULES.find((x) => x.key === m);
    const special = specialCodes(m);
    return `<tr>
      <th>${mod.label}</th>
      ${roles.map((r) => {
        const perms = r.superuser ? PERMISSION_CODES : r.perms;
        const count = special.filter((op) => r.superuser || perms.includes(`${m}:${op}`)).length;
        const cells = MATRIX_COLS.map((op) => matrixCell(perms, m, op, r.superuser)).join('');
        const specialCell = special.length
          ? `<td><span class="dot ${count ? 'on' : ''}${count && r.superuser ? ' sup' : ''}" title="${count}/${special.length} 项专项权限"></span></td>`
          : '<td><span class="dot"></span></td>';
        return cells + specialCell;
      }).join('')}
    </tr>`;
  }).join('');
}

/* ---------------- 通用交互 ---------------- */

function bindGlobal() {
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-drawer-open]');
    if (open) {
      e.preventDefault();
      openDrawer(open.dataset.drawerOpen);
      return;
    }
    if (e.target.closest('[data-drawer-close]')) {
      e.preventDefault();
      closeDrawers();
      return;
    }
    const t = e.target.closest('[data-toast]');
    if (t) {
      e.preventDefault();
      toast(t.dataset.toast);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawers();
  });

  document.querySelectorAll('[data-search]').forEach((input) => {
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      document.querySelectorAll('[data-filter-row]').forEach((row) => {
        row.hidden = Boolean(q) && !row.textContent.toLowerCase().includes(q);
      });
    });
  });

  document.querySelectorAll('[data-check-all]').forEach((master) => {
    master.addEventListener('change', () => {
      const group = master.closest('[data-perm-group]');
      group.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        if (cb !== master) cb.checked = master.checked;
      });
    });
  });
}

function initCaptcha() {
  const el = document.querySelector('[data-captcha]');
  if (!el) return;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const draw = () => {
    let out = '';
    for (let i = 0; i < 4; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    el.textContent = out;
  };
  draw();
  el.parentElement?.addEventListener('click', draw);
}

/* ---------------- 启动 ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('no-motion')) {
    document.documentElement.style.scrollBehavior = 'auto';
  }
  // 支持 ?role=ops 直接进入指定演示身份（便于截图与评审）
  const requestedRole = new URLSearchParams(location.search).get('role');
  if (requestedRole && ROLES[requestedRole]) {
    localStorage.setItem(ROLE_STORAGE_KEY, requestedRole);
  }
  // 无权限示例页以「只读审计」身份演示，避免与超级管理员语义冲突
  if (document.body.dataset.page === 'denied' && currentRole().superuser) {
    localStorage.setItem(ROLE_STORAGE_KEY, 'auditor');
  }
  renderShell();
  hydrateIcons();
  applyGating();
  renderRoleLabels();
  bindGlobal();
  initCaptcha();

  const page = document.body.dataset.page;
  if (page === 'permissions') {
    renderCatalog();
    document.querySelectorAll('[data-module-filter-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-module-filter-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const body = document.querySelector('[data-catalog-body]');
        body.dataset.moduleFilter = btn.dataset.moduleFilterBtn;
        renderCatalog();
      });
    });
    document.querySelector('[data-catalog-search]')?.addEventListener('input', renderCatalog);
  }
  if (page === 'dashboard') {
    renderCurrentRoleMatrix();
    document.addEventListener('rolechange', renderCurrentRoleMatrix);
  }
  if (page === 'index') {
    renderMiniMatrix();
    document.addEventListener('rolechange', renderMiniMatrix);
  }
  if (page === 'matrix') {
    renderFullMatrix();
  }
  if (page === 'denied') {
    const updateDenied = () => {
      const superuser = currentRole().superuser;
      document.querySelectorAll('[data-denied-super]').forEach((el) => { el.hidden = !superuser; });
      document.querySelectorAll('[data-denied-switch]').forEach((el) => { el.hidden = superuser; });
    };
    updateDenied();
    document.addEventListener('rolechange', updateDenied);
  }

  document.dispatchEvent(new CustomEvent('prototype-ready'));
});
