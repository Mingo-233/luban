## Why

需要搭建一个自定义工具集合网站，提供常用的图片处理功能（图片转 WebP、SVG 转 PNG、图片裁剪），为用户提供便捷的在线工具服务。设计采用 liquid glass 主题，提供现代化的视觉体验。

## What Changes

- 搭建基于 SolidJS + Vite 8 + TailwindCSS 的前端项目
- 实现首页，展示多个工具卡片入口
- 实现图片转 WebP 工具模块（懒加载）
- 实现 SVG 转 PNG 工具模块（懒加载）
- 实现图片裁剪工具模块（懒加载）
- 架构支持后续扩展新工具模块
- 提供 Docker 构建配置

## Capabilities

### New Capabilities

- `homepage`: 首页，展示工具卡片列表，支持导航到各工具页面
- `image-to-webp`: 图片转 WebP 格式工具，支持上传图片并转换为 WebP 格式下载
- `svg-to-png`: SVG 转 PNG 格式工具，支持上传 SVG 文件并转换为 PNG 格式下载
- `image-crop`: 图片裁剪工具，支持上传图片并进行裁剪后下载
- `lazy-loading-framework`: 懒加载框架，统一管理各工具模块的异步加载

### Modified Capabilities

- （无）

## Impact

- 新增项目代码库（前端应用）
- 新增 Docker 构建配置
- 项目结构设计需支持后续工具模块扩展
