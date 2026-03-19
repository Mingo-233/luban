## Context

搭建一个自定义工具集合网站，基于 SolidJS + Vite 8 + TailwindCSS 技术栈。网站包含首页（工具卡片入口）和多个工具模块（图片转 WebP、SVG 转 PNG、图片裁剪），采用 liquid glass 设计主题。需要支持懒加载和后续扩展。

## Goals / Non-Goals

**Goals:**
- 实现首页，展示工具卡片，支持导航
- 实现图片转 WebP 工具
- 实现 SVG 转 PNG 工具
- 实现图片裁剪工具
- 支持懒加载模块
- 支持 Docker 构建
- 架构支持后续扩展新工具

**Non-Goals:**
- 不实现后端服务（纯前端工具）
- 不实现用户认证系统
- 不实现图片存储服务

## Decisions

### 1. 技术栈选择

**决策**: SolidJS + Vite 8 (rolldown) + TailwindCSS + JS 语法

**理由**:
- SolidJS: 响应式，性能优秀，体积小
- Vite 8 + rolldown: 更快的构建速度
- TailwindCSS: 快速构建 UI，天然支持自定义主题
- JS 语法: PRD 要求

### 2. 项目结构

**决策**: 采用 Feature-Based Structure，按功能模块组织代码

```
src/
├── components/       # 共享组件
├── pages/           # 页面组件
│   ├── Home.jsx    # 首页
│   ├── ImageToWebp.jsx
│   ├── SvgToPng.jsx
│   └── ImageCrop.jsx
├── lazy/            # 懒加载管理
├── styles/          # 全局样式
└── App.jsx
```

**理由**: 清晰的结构便于扩展新工具模块

### 3. 懒加载实现

**决策**: 使用 SolidJS 的 `lazy` 和 `Suspense` 实现模块懒加载

**理由**:
- 原生支持，无需额外依赖
- 与 SolidJS 响应式系统无缝集成
- 代码分割自动化

### 4. Liquid Glass UI 主题

**决策**: 使用 TailwindCSS 自定义 liquid glass 效果

**理由**:
- TailwindCSS 4 支持任意值语法，可灵活设置 backdrop-blur、透明度等
- 自定义 CSS 变量管理主题色

### 5. Docker 配置

**决策**: 使用多阶段构建，nginx 作为生产服务器

**理由**:
- 镜像体积小
- 适合静态前端应用

## Risks / Trade-offs

[Risk] 图片处理在浏览器端完成，大文件可能导致性能问题
→ [Mitigation] 限制上传文件大小，提供加载状态提示

[Risk] 不同浏览器对 Canvas API 支持差异
→ [Mitigation] 使用成熟的库（如 browser-image-compression）处理图片

## Migration Plan

1. 创建项目脚手架（Vite + SolidJS）
2. 配置 TailwindCSS 和 liquid glass 主题
3. 实现首页和路由系统
4. 实现懒加载框架
5. 实现各工具模块
6. 添加 Docker 配置
7. 测试和部署

## Open Questions

- 是否需要支持批量处理图片？
- 是否需要保存历史记录？
