# 辰光Agent平台 — 项目需求说明书 V2（RBAC 授权功能）

> 本文档为《辰光Agent平台项目说明书》（`docs/PROJECT_SPEC.md`，下称 V1）的**增量需求文档**，聚焦在现有 RBAC 数据模型基础上补齐**授权（Authorization）能力**。
> V1 已描述项目全貌、目录结构、分层架构、前端数据服务层等基础内容，本文档不再重复，仅对「授权」相关的新增需求做完整定义。
>
> **性质**：纯需求文档（PRD）。本文档只描述「要做什么、为什么做、验收标准」，不包含实现代码，也不指导具体编码。

---

## 一、文档说明

| 项 | 说明 |
|---|---|
| 文档名称 | PROJECT_SPEC_V2.md（辰光Agent平台需求说明书 V2） |
| 主题 | RBAC 模块授权功能（前后端全量接入） |
| 关联文档 | `docs/PROJECT_SPEC.md`（V1 项目说明书） |
| 交付物 | 本 PRD 文档本身（不涉及任何代码改动） |
| 状态 | 需求对齐完成，待评审 |

---

## 二、背景与目标

### 2.1 背景

V1 阶段已实现 RBAC 的**基础数据模型与身份认证**：

- 数据模型：`用户(users) ──M:N── 角色(roles) ──M:N── 权限(permissions)`，两张关联表 `user_roles`、`role_permissions` 已就绪。
- 身份认证：JWT 登录 + `get_current_user` 依赖（校验 token、加载用户、检查 `is_active`）。

但**授权能力尚未落地**，具体表现为：

1. `get_current_user` 只回答「你是谁」（身份认证），从不回答「你能不能做这件事」（授权）——它不读取、不校验任何权限。
2. 绝大多数接口连 `get_current_user` 都没挂载：用户/角色/权限的增删改查，以及 agent/model/prompt/knowledge/tool/provider 等业务接口，目前**全部可匿名访问**（唯一挂鉴权的只有 `/users/me`）。
3. `permissions` 表只有 `code / name / description` 三个字段，没有任何「权限 → 接口/操作」的映射，权限数据与可访问资源之间是脱节的。
4. 前端虽然已有用户/角色/权限管理页面和完整的页面/路由，但**没有任何按权限显隐菜单、路由或按钮的逻辑**，所有登录用户看到的内容完全一样。

### 2.2 目标

在现有 RBAC 数据模型之上，补齐**授权执行层**，把已有的「用户—角色—权限」数据变成真正的访问控制：

- **后端**：每个受保护接口声明所需权限码，无权限的请求返回明确的「无权限」错误。
- **前端**：按当前用户的权限码集合，控制**菜单、路由、按钮/操作**三层的可见性。
- **初始化数据**：预置一套覆盖全模块的权限码清单、内置管理员角色与超级管理员账号。

### 2.3 成功标准

- 普通用户登录后，只能看到并访问其角色所授权限对应的菜单、路由、按钮。
- 无权限用户直接调用未授权接口时，后端返回明确的无权限错误，前端给出提示而非误操作。
- 超级管理员可访问一切功能，不受权限码限制。
- 权限、角色、用户之间的授权关系可通过现有管理页面动态调整，并即时生效。

---

## 三、需求对齐结论（本次对齐决策记录）

以下为本次需求对齐过程中与需求方确认的结论，作为后续设计与验收的依据：

| # | 决策项 | 结论 |
|---|---|---|
| 1 | 授权覆盖层面 | **前后端一起**：后端接口级校验 + 前端可见性控制 |
| 2 | 权限粒度 | 采用 `资源:操作` 权限码（如 `user:create`、`agent:publish`），延续 V1 权限页「模块:操作」约定 |
| 3 | 覆盖范围 | **全模块**：系统管理（用户/角色/权限/API Key/审计/告警/配置）+ 业务模块（agent/model/provider/prompt/knowledge/tool/conversation/analytics）全部纳入 |
| 4 | 前端控制深度 | **菜单 + 路由 + 按钮/操作**三层 |
| 5 | 超级管理员语义 | `is_superuser` 绕过一切权限校验（任何接口、任何按钮均放行） |
| 6 | 授权方案 | 权限码精确校验（详见第六章） |
| 7 | 交付边界 | 仅产出本 PRD 文档，**不编写任何代码** |

---

## 四、现状分析与差距

### 4.1 已具备（无需新建）

| 能力 | 位置 | 说明 |
|---|---|---|
| 用户模型 | `src/modules/user/model.py` | 含 `is_active`、`is_superuser` 字段 |
| 角色模型 | `src/modules/role/model.py` | `code / name / description`，关联 `permissions`（M:N） |
| 权限模型 | `src/modules/permission/model.py` | `code / name / description`，`code` 唯一 |
| 关联表 | `user_roles`、`role_permissions` | 复合主键，`lazy="selectin"` 立即加载 |
| 身份认证 | `src/core/deps.py::get_current_user` | JWT 校验 + 用户加载 + `is_active` 校验 |
| 前端管理页面 | `app/src/pages/system/Users|Roles|Permissions.tsx` | 用户/角色/权限的 CRUD 与分配 |
| 前端类型 | `app/src/services/types/system.ts` | `User / Role / Permission` 类型 |

### 4.2 待补（本次新增的差距项）

| 差距 | 说明 | 影响 |
|---|---|---|
| 后端无授权依赖 | 缺少类似 `require_permission` 的权限校验依赖 | 接口无权限拦截 |
| 接口未挂鉴权 | 除 `/users/me` 外，用户/角色/权限及全部业务接口未挂 `get_current_user` | 匿名可访问 |
| 权限无资源映射 | `permissions.code` 未与任何接口/操作建立对应关系 | 权限数据形同虚设 |
| 前端无权限控制 | 菜单/路由/按钮均不按权限过滤 | 所有用户界面一致 |
| 无权限下发通道 | 前端无法获取「当前用户拥有哪些权限码」 | 前端无法做任何控制 |
| 无种子数据 | 无预置权限清单、内置角色与超级管理员 | 系统上线无初始授权 |

---

## 五、授权模型设计

### 5.1 模型关系（沿用 V1，不新增实体）

```
用户(users) ──M:N── 角色(roles) ──M:N── 权限(permissions)
     │                                   │
     └────────── is_superuser ──────────┘（超级管理员直接绕过，不查权限）
```

### 5.2 权限码规范

- **格式**：`资源:操作`，小写，操作动词统一使用英文动词。
- **标准 CRUD 动词**：`read`（查看）、`create`（创建）、`update`（编辑）、`delete`（删除）。
- **模块专用动词**：如 `start/stop/publish/rollback`（Agent/Prompt）、`enable/disable/test`（工具/供应商）、`config/upload/retrieval`（知识库）等，按各模块实际能力定义。
- **资源前缀**：`user / role / permission / apikey / audit / alert / settings`（系统管理），`agent / model / provider / prompt / knowledge / tool / conversation / analytics`（业务模块）。

### 5.3 授权判定规则

1. 超级管理员（`is_superuser == true`）：**直接放行**，不校验权限码。
2. 普通用户：取用户所有角色的权限码**并集**，判断所需权限码是否在集合中。
3. 未登录（无 token 或 token 失效）：返回「未登录」错误，前端跳转登录页。
4. 已登录但无对应权限：返回「无权限」错误，前端给出提示（不跳登录）。

---

## 六、授权方案选型

| 方案 | 描述 | 结论 |
|---|---|---|
| **方案一：权限码精确校验** | 后端每个接口声明所需权限码，用统一依赖拦截；前端菜单/路由/按钮各自绑定权限码，按当前用户权限码集合显隐；超级管理员绕过 | ✅ **采用** |
| 方案二：角色码粗校验 | 仅判断用户是否拥有某角色码（如 `admin`） | ❌ 与现有 `permissions` 表、权限管理页冲突，无法实现按钮级控制 |
| 方案三：混合（权限码 + 角色码） | 权限码校验 + 超级管理员绕过 + 少量角色码粗判断 | ❌ 实质等于方案一加白名单，无额外价值，不单独采用 |

**选定理由**：方案一是唯一贴合现有代码的选择——`permissions.code` 已在用 `模块:操作`，前端已有权限管理页，且需求要求按钮级控制必须依赖细粒度权限码。

---

## 七、权限码全量目录

> 本节为**权威权限码清单**，作为种子数据、后端接口映射、前端显隐控制的唯一依据。
> 标记 ⏳ 表示「前端页面已就绪、后端接口待实现」，其权限码先预定义，随对应模块后端落地时启用。

### 7.1 系统管理

#### 用户（user）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `user:read` | 查看用户 | 用户列表、详情、用户角色列表 |
| `user:create` | 创建用户 | 添加用户 |
| `user:update` | 编辑用户 | 修改用户信息（预留） |
| `user:delete` | 删除用户 | 删除用户 |
| `user:assign_role` | 分配角色 | 给用户分配/调整角色 |

#### 角色（role）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `role:read` | 查看角色 | 角色列表、详情 |
| `role:create` | 创建角色 | 创建角色 |
| `role:update` | 编辑角色 | 修改角色 |
| `role:delete` | 删除角色 | 删除角色 |
| `role:assign_permission` | 分配权限 | 给角色分配/调整权限 |

#### 权限（permission）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `permission:read` | 查看权限 | 权限列表、详情 |
| `permission:create` | 创建权限 | 创建权限 |
| `permission:update` | 编辑权限 | 修改权限名称/描述 |
| `permission:delete` | 删除权限 | 删除权限 |

#### API 密钥（apikey）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `apikey:read` | 查看 API 密钥 | 密钥列表 |
| `apikey:create` | 创建 API 密钥 | 生成密钥 |
| `apikey:update` | 编辑 API 密钥 | 修改密钥信息 |
| `apikey:delete` | 删除 API 密钥 | 删除/吊销密钥 |

#### 审计日志（audit）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `audit:read` | 查看审计日志 | 审计日志列表/详情（只读） |

#### 告警规则（alert）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `alert:read` | 查看告警规则 | 规则列表 |
| `alert:create` | 创建告警规则 | 新建规则 |
| `alert:update` | 编辑告警规则 | 修改规则 |
| `alert:delete` | 删除告警规则 | 删除规则 |

#### 系统配置（settings）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `settings:read` | 查看系统配置 | 查看配置项 |
| `settings:update` | 修改系统配置 | 修改配置项 |

### 7.2 业务模块

#### Agent（agent）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `agent:read` | 查看 Agent | 列表、详情、版本历史 |
| `agent:create` | 创建 Agent | 新建 Agent |
| `agent:update` | 编辑 Agent | 修改 Agent 配置 |
| `agent:delete` | 删除 Agent | 删除 Agent |
| `agent:start` | 启动 Agent | 启动运行 |
| `agent:stop` | 停止 Agent | 停止运行 |
| `agent:publish` | 发布 Agent | 发布新版本 |
| `agent:rollback` | 回滚 Agent | 回滚到历史版本 |

#### 模型（model）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `model:read` | 查看模型 | 模型列表、详情 |
| `model:create` | 创建模型 | 添加模型 |
| `model:update` | 编辑模型 | 修改模型 |
| `model:delete` | 删除模型 | 删除模型 |
| `model:test` | 测试模型 | 连接测试（前端已有入口，后端接口待补充） |

#### 供应商（provider）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `provider:read` | 查看供应商 | 供应商列表、详情 |
| `provider:create` | 创建供应商 | 添加供应商 |
| `provider:update` | 编辑供应商 | 修改供应商 |
| `provider:delete` | 删除供应商 | 删除供应商 |
| `provider:test` | 测试连接 | 供应商连通性测试 |

#### Prompt（prompt）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `prompt:read` | 查看 Prompt | 列表、详情、版本历史 |
| `prompt:create` | 创建 Prompt | 新建 Prompt |
| `prompt:update` | 编辑 Prompt | 修改 Prompt |
| `prompt:delete` | 删除 Prompt | 删除 Prompt |
| `prompt:publish` | 发布 Prompt | 发布新版本 |
| `prompt:rollback` | 回滚 Prompt | 回滚到历史版本 |

#### 知识库（knowledge）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `knowledge:read` | 查看知识库 | 知识库列表、详情、文档/分段查看 |
| `knowledge:create` | 创建知识库 | 新建知识库 |
| `knowledge:update` | 编辑知识库 | 修改知识库基本信息 |
| `knowledge:delete` | 删除知识库 | 删除知识库 |
| `knowledge:config` | 修改知识库配置 | 更新分段/检索策略 |
| `knowledge:upload` | 上传文档 | 上传文档到知识库 |
| `knowledge:doc_delete` | 删除文档 | 删除文档 |
| `knowledge:doc_retry` | 重试文档 | 重试处理失败的文档 |
| `knowledge:seg_edit` | 编辑分段 | 修改分段内容 |
| `knowledge:seg_delete` | 删除分段 | 删除分段 |
| `knowledge:retrieval` | 检索测试 | 知识库检索测试 |

#### 工具（tool）

| 权限码 | 名称 | 说明 |
|---|---|---|
| `tool:read` | 查看工具 | 工具列表、详情 |
| `tool:create` | 注册工具 | 注册新工具 |
| `tool:update` | 编辑工具 | 修改工具 |
| `tool:delete` | 删除工具 | 删除工具 |
| `tool:enable` | 启用工具 | 启用工具 |
| `tool:disable` | 禁用工具 | 禁用工具 |
| `tool:test` | 测试工具 | 工具调用测试 |

#### 对话日志（conversation）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `conversation:read` | 查看对话日志 | 对话列表、详情、链路追踪 |

#### 数据统计（analytics）⏳

| 权限码 | 名称 | 说明 |
|---|---|---|
| `analytics:read` | 查看数据统计 | 用量、费用、效果评估（只读） |

---

## 八、后端授权设计

### 8.1 公开接口（无需鉴权）

| 接口 | 说明 |
|---|---|
| `GET /health` | 健康检查 |
| `GET /api/v1/captcha` | 获取验证码 |
| `POST /api/v1/captcha` | 校验验证码 |
| `POST /api/v1/auth/login` | 登录（需验证码） |

### 8.2 登录即可访问（无需额外权限码）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/users/me` | 获取当前用户信息 + **权限码集合**（前端授权核心数据源） |

### 8.3 授权依赖（需求层定义）

- 新增统一授权依赖（命名建议 `require_permission`，以下称「授权依赖」）。
- 每个受保护接口通过声明**一个或多个权限码**接入授权依赖；声明多个时，满足**其中任意一个**即可通过（`任一` 语义，默认单权限码）。
- 授权依赖内部：超级管理员直接放行；普通用户取「角色→权限」并集后判断是否包含所需权限码。
- 为避免每请求多次查库，授权依赖应复用「用户加载时一并加载角色与权限」的能力（即用户查询时把 `roles` 及 `roles.permissions` 一次性 `selectin` 加载）。

### 8.4 接口 → 权限码映射（全量）

> 每个接口对应一个权限码；同一资源的读接口共用 `:read`，特殊操作独立权限码。

#### 用户 `/api/v1/users`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/users/search` | GET | `user:read` |
| `/users/{user_id}` | GET | `user:read` |
| `/users/{user_id}/roles` | GET | `user:read` |
| `/users` | POST | `user:create` |
| `/users/{user_id}` | PUT | `user:update`（预留） |
| `/users/{user_id}` | DELETE | `user:delete` |
| `/users/{user_id}/roles` | PUT | `user:assign_role` |

#### 角色 `/api/v1/roles`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/roles/search` | GET | `role:read` |
| `/roles/{role_id}` | GET | `role:read` |
| `/roles/` | GET | `role:read` |
| `/roles` | POST | `role:create` |
| `/roles/{role_id}` | PUT | `role:update` |
| `/roles/{role_id}` | DELETE | `role:delete` |
| `/roles/{role_id}/permissions` | PUT | `role:assign_permission` |

#### 权限 `/api/v1/permissions`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/permissions/search` | GET | `permission:read` |
| `/permissions/{permission_id}` | GET | `permission:read` |
| `/permissions/` | GET | `permission:read` |
| `/permissions` | POST | `permission:create` |
| `/permissions/{permission_id}` | PUT | `permission:update` |
| `/permissions/{permission_id}` | DELETE | `permission:delete` |

#### 供应商 `/api/v1/providers`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/providers` | GET | `provider:read` |
| `/providers/{provider_id}` | GET | `provider:read` |
| `/providers` | POST | `provider:create` |
| `/providers/{provider_id}` | PUT | `provider:update` |
| `/providers/{provider_id}` | DELETE | `provider:delete` |
| `/providers/{provider_id}/test` | POST | `provider:test` |

#### 模型 `/api/v1/models`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/models` | GET | `model:read` |
| `/models/{model_id}` | GET | `model:read` |
| `/models` | POST | `model:create` |
| `/models/{model_id}` | PUT | `model:update` |
| `/models/{model_id}` | DELETE | `model:delete` |

#### Prompt `/api/v1/prompts`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/prompts` | GET | `prompt:read` |
| `/prompts/{prompt_id}` | GET | `prompt:read` |
| `/prompts/{prompt_id}/versions` | GET | `prompt:read` |
| `/prompts` | POST | `prompt:create` |
| `/prompts/{prompt_id}` | PUT | `prompt:update` |
| `/prompts/{prompt_id}` | DELETE | `prompt:delete` |
| `/prompts/{prompt_id}/publish` | POST | `prompt:publish` |
| `/prompts/{prompt_id}/rollback` | POST | `prompt:rollback` |

#### 知识库 `/api/v1/knowledge-bases`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/knowledge-bases` | GET | `knowledge:read` |
| `/knowledge-bases/{kb_id}` | GET | `knowledge:read` |
| `/knowledge-bases/{kb_id}/documents` | GET | `knowledge:read` |
| `/knowledge-bases/{kb_id}/documents/{doc_id}/segments` | GET | `knowledge:read` |
| `/knowledge-bases/{kb_id}/segments` | GET | `knowledge:read` |
| `/knowledge-bases` | POST | `knowledge:create` |
| `/knowledge-bases/{kb_id}` | PUT | `knowledge:update` |
| `/knowledge-bases/{kb_id}` | DELETE | `knowledge:delete` |
| `/knowledge-bases/{kb_id}/config` | PUT | `knowledge:config` |
| `/knowledge-bases/{kb_id}/documents` | POST | `knowledge:upload` |
| `/knowledge-bases/{kb_id}/documents/{doc_id}` | DELETE | `knowledge:doc_delete` |
| `/knowledge-bases/{kb_id}/documents/{doc_id}/retry` | POST | `knowledge:doc_retry` |
| `/knowledge-bases/{kb_id}/segments/{seg_id}` | PUT | `knowledge:seg_edit` |
| `/knowledge-bases/{kb_id}/segments/{seg_id}` | DELETE | `knowledge:seg_delete` |
| `/knowledge-bases/{kb_id}/retrieval-test` | POST | `knowledge:retrieval` |

#### 工具 `/api/v1/tools`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/tools` | GET | `tool:read` |
| `/tools/{tool_id}` | GET | `tool:read` |
| `/tools` | POST | `tool:create` |
| `/tools/{tool_id}` | PUT | `tool:update` |
| `/tools/{tool_id}` | DELETE | `tool:delete` |
| `/tools/{tool_id}/enable` | POST | `tool:enable` |
| `/tools/{tool_id}/disable` | POST | `tool:disable` |
| `/tools/{tool_id}/test` | POST | `tool:test` |

#### Agent `/api/v1/agents`

| 接口 | 方法 | 权限码 |
|---|---|---|
| `/agents` | GET | `agent:read` |
| `/agents/{agent_id}` | GET | `agent:read` |
| `/agents/{agent_id}/versions` | GET | `agent:read` |
| `/agents` | POST | `agent:create` |
| `/agents/{agent_id}` | PUT | `agent:update` |
| `/agents/{agent_id}` | DELETE | `agent:delete` |
| `/agents/{agent_id}/start` | POST | `agent:start` |
| `/agents/{agent_id}/stop` | POST | `agent:stop` |
| `/agents/{agent_id}/publish` | POST | `agent:publish` |
| `/agents/{agent_id}/rollback` | POST | `agent:rollback` |

### 8.5 鉴权失败的错误契约

- **未登录 / token 失效**：返回 `code = 401`，消息如「未登录或 token 已过期」；前端据此跳转登录页。
- **已登录但无权限**：返回 `code = 403`，消息如「无权访问该资源」；前端据此弹出「无权限」提示，**不跳转登录页**。
- 两类错误沿用现有 `BizException` + `ResponseSchema` 统一结构（HTTP 200 + 业务码），与 V1 前端 `apiClient` 的处理逻辑对齐。

---

## 九、前端授权设计

### 9.1 权限下发与缓存

- **数据源**：登录成功后，前端调用 `GET /api/v1/users/me`，该接口返回当前用户信息 + **权限码集合**（`permissions: string[]`）。
- **缓存**：权限码集合缓存在前端内存（及可选 `localStorage`），作为全局授权判断的唯一来源。
- **失效时机**：退出登录时清空；token 失效触发 401 跳转登录时清空。
- **超级管理员**：`is_superuser` 为真时，前端视为拥有全部权限（或后端在 `/me` 中直接返回全部权限码），所有元素可见。

### 9.2 菜单控制

- 侧边栏 `DashboardLayout` 的一级菜单与「系统管理」子菜单，各绑定一个权限码。
- 无权限的菜单项**不渲染**。
- 菜单 → 权限码映射：

| 菜单 | 权限码 |
|---|---|
| 工作台 | 登录即可（无额外权限码） |
| Agent管理 | `agent:read` |
| 模型管理 | `model:read` 或 `provider:read` |
| Prompt管理 | `prompt:read` |
| 知识库 | `knowledge:read` |
| 工具管理 | `tool:read` |
| 对话日志 | `conversation:read` |
| 数据统计 | `analytics:read` |
| 系统管理/用户管理 | `user:read` |
| 系统管理/角色管理 | `role:read` |
| 系统管理/权限管理 | `permission:read` |
| 系统管理/API密钥 | `apikey:read` |
| 系统管理/审计日志 | `audit:read` |
| 系统管理/告警规则 | `alert:read` |
| 系统管理/系统配置 | `settings:read` |

### 9.3 路由控制

- 在现有 `AuthGuard`（未登录拦截）基础上，增加**权限路由守卫**。
- 直接输入无权限路由的 URL 时，重定向到工作台或展示「无权限」提示页。
- 路由 → 权限码映射与 9.2 菜单映射一致。

### 9.4 按钮/操作控制

- 提供统一的权限判断能力（建议封装为 `usePermission()` Hook 与 `<PermissionGate code="...">` 组件），按权限码控制按钮/操作显隐。
- 无权限的操作按钮**隐藏**（不渲染），而非禁用。
- 关键页面按钮 → 权限码映射（示例，其余页面遵循同规则）：

| 页面 | 按钮/操作 | 权限码 |
|---|---|---|
| 用户管理 | 添加用户 | `user:create` |
| 用户管理 | 删除（行内） | `user:delete` |
| 用户管理 | 分配角色（行内） | `user:assign_role` |
| 角色管理 | 创建角色 | `role:create` |
| 角色管理 | 编辑（行内） | `role:update` |
| 角色管理 | 删除（行内） | `role:delete` |
| 角色管理 | 分配权限（行内） | `role:assign_permission` |
| 权限管理 | 创建权限 | `permission:create` |
| 权限管理 | 编辑（行内） | `permission:update` |
| 权限管理 | 删除（行内） | `permission:delete` |
| Agent列表 | 新建 Agent | `agent:create` |
| Agent详情 | 编辑/启动/停止/发布/回滚/删除 | 分别对应 `agent:update/start/stop/publish/rollback/delete` |
| 模型/供应商列表 | 新建、编辑、删除、测试 | 分别对应 `model:*`、`provider:*` |
| Prompt列表 | 新建、编辑、删除、发布、回滚 | 分别对应 `prompt:*` |
| 知识库 | 创建/编辑/删除/配置/上传/重试/分段编辑/检索测试 | 分别对应 `knowledge:*` |
| 工具列表 | 注册/编辑/删除/启用/禁用/测试 | 分别对应 `tool:*` |

### 9.5 前端类型变更

- 后端 `User` 响应新增 `permissions: string[]`（权限码集合）与 `is_superuser: boolean`，前端 `system.ts` 类型同步镜像。

---

## 十、初始化数据（种子数据）

通过数据库迁移一次性预置，保证系统开箱即有完整授权体系：

| 种子项 | 内容 | 规则 |
|---|---|---|
| 权限清单 | 第七章全量权限码（约 60+ 条） | 幂等写入；`code` 唯一 |
| 内置角色 `admin` | 名称「管理员」，拥有**全部权限** | 受保护：不可删除、不可清空其权限 |
| 超级管理员账号 | 用户名 `admin`（或从环境变量读取），`is_superuser = true` | 受保护：不可删除、不可禁用、不可降级 |

### 保护规则（边界情况）

1. **超级管理员账号**：不可被删除、禁用、或移除 `is_superuser`；自身权限不依赖角色分配。
2. **内置 `admin` 角色**：不可被删除；不可被移除全部权限（防止系统失去管理入口）。
3. **删除权限**：若该权限已被角色引用，需先解除引用或明确提示影响范围（前端已有相关提示文案，延续之）。
4. **删除角色**：若该角色已分配给用户，需先解除分配或明确提示影响范围。
5. **无角色用户**：权限码集合为空，只能访问公开接口与 `/users/me`，前端仅见工作台等无需权限的入口。

---

## 十一、接口契约变更汇总

| 变更 | 说明 |
|---|---|
| `GET /api/v1/users/me` | 响应新增 `permissions: string[]`、`is_superuser: boolean`，作为前端授权数据源 |
| 登录响应（可选优化） | 可一并返回权限码集合，省去一次 `/me` 请求（非必需，实现时按需决定） |
| 全部受保护接口 | 挂载授权依赖并声明权限码（见 8.4） |
| 鉴权失败响应 | 未登录 `code=401`；无权限 `code=403`，均走现有 `ResponseSchema` 结构 |

---

## 十二、非目标（Anti-goals）

以下内容**不在**本次授权功能范围内，若强行纳入将导致范围蔓延：

1. **数据级（行级）权限**：如「只能看到自己创建的 Agent / 知识库」——本次只做资源级（模块/操作）授权，行级隔离列为后续扩展。
2. **多租户 / 组织隔离**：不引入租户、部门、数据域等概念。
3. **新增业务功能**：不新增任何业务模块能力，仅给现有能力补授权。
4. **改动现有业务逻辑**：授权只做「拦截/放行」，不改变接口本身的业务行为。
5. **细粒度字段级权限**：如「能看用户列表但不能看邮箱字段」——不在范围内。

---

## 十三、验收标准

以下为可验证的完成标准（供后续实现后核对）：

**后端**
- [ ] 除公开接口与 `/users/me` 外，所有接口均挂载授权依赖。
- [ ] 超级管理员调用任意接口均放行。
- [ ] 普通用户无 `user:create` 权限时，调用 `POST /api/v1/users` 返回 `code=403`。
- [ ] 未登录调用受保护接口返回 `code=401`。
- [ ] `/users/me` 返回当前用户的权限码集合，且与「角色→权限」并集一致。

**前端**
- [ ] 无 `agent:read` 权限的用户，侧边栏不显示「Agent管理」。
- [ ] 直接输入无权限路由 URL，被拦截/重定向。
- [ ] 无 `user:create` 权限的用户，用户管理页不显示「添加用户」按钮。
- [ ] 超级管理员前端可见全部菜单、路由、按钮。

**种子数据**
- [ ] 迁移后权限表含全量权限码，`admin` 角色含全部权限，超级管理员账号可正常登录。

---

## 十四、变更记录

| 日期 | 说明 |
|---|---|
| 2026-10-25 | 初始版本：完成 RBAC 授权功能的需求分析与对齐，产出本 PRD（V2） |
