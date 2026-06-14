# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

运动打卡系统 —— 纯前端 Vue 3 单页应用,围绕"每晚 30 分钟跟课运动"场景设计,包含 B 站视频嵌入、连续打卡日历、浏览器通知提醒等功能。所有数据持久化在浏览器本地(IndexedDB),无后端。

设计语言: NEON TRACK / 深夜训练场(深色为主,火焰红 + 霓虹强调),支持亮/暗主题切换。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 启动 Vite 开发服务器(端口 5173)
npm run build    # 生产构建(输出到 dist/)
npm run preview  # 预览构建产物
```

无测试 / 无 lint / 无格式化脚本(项目暂未配置 ESLint / Prettier / Vitest)。

## 技术栈

- **构建**: Vite 5 + `@vitejs/plugin-vue`
- **框架**: Vue 3.4 (Composition API + `<script setup>`)
- **状态**: Pinia 2(两个 store: `checkin` / `courses`)
- **路由**: vue-router 4,**使用 hash 模式**(`createWebHashHistory`)
- **UI**: Element Plus 2.8(中文 locale),图标用 `@element-plus/icons-vue`
- **样式**: SCSS + CSS 变量主题;`unplugin-auto-import` + `unplugin-vue-components` 自动按需引入 Element Plus
- **存储**: IndexedDB via `idb-keyval`(打卡记录 + 自定义课程);`localStorage`(通知设置 + 主题)
- **日期**: `dayjs`
- **路径别名**: `@` → `src`

## 目录结构与职责

```
src/
├── main.js                    # 应用入口: 注册 Pinia / router / Element Plus,bootstrap 中加载 store,启动通知定时器
├── App.vue                    # 整体外壳: 侧边栏导航 + 顶栏(时钟/打卡状态/主题切换) + RouterView
├── router/index.js            # 6 个路由,全部用懒加载;hash 模式
├── stores/
│   ├── checkin.js             # 打卡 store: checkins 数组 + 派生 getter(连续天数、累计、当月等)
│   └── courses.js             # 课程 store: 合并种子 + 自定义课程,提供 byId / byCategory
├── db/index.js                # IndexedDB 封装层(原生 key/value 操作,get/save/delete + getAllCourses 合并)
├── data/seedCourses.js        # 15 个内置种子课程(B 站嵌入链接) + categories 分类 + moodOptions 心情选项
├── composables/
│   ├── useNotify.js           # 浏览器通知模块(localStorage 存设置,30s 轮询触发)
│   └── useTheme.js            # 主题切换(ref 单例,localStorage 持久化,data-theme 属性)
├── utils/date.js              # dayjs 工具:today / fmtDate / calcStreak(连续天数) / monthCount
├── views/                     # 6 个页面(对应 6 个路由)
│   ├── HomeView.vue           # 今日仪表盘: 推荐课程 + 今日打卡概览 + 月度进度 + 强度区
│   ├── CheckinView.vue        # 打卡表单: 选课程 + 搜索 + 时长/心情/强度 + 提交
│   ├── CoursePlayView.vue     # 跟练播放: B 站 iframe 嵌入
│   ├── CoursesView.vue        # 课程库: 分类筛选 + 自定义课程管理
│   ├── StatsView.vue          # 统计: 日历视图 + 连续天数 + 累计数据
│   └── SettingsView.vue       # 设置: 通知开关/时间 + 主题 + 数据清空 + 模拟打卡
└── styles/
    ├── theme.scss             # SCSS 变量 + :root CSS 变量 + Element Plus 暗色变量覆盖(深色默认 / [data-theme="light"] 亮色)
    └── global.scss            # 全局样式(自动通过 vite.config.js 的 additionalData 注入到所有 SCSS)
```

## 架构关键点

### 启动流程 (`main.js`)
1. 创建 app,注册 Pinia、router、Element Plus(zh-cn)
2. 引入全局样式 `global.scss`(vite 配置中通过 SCSS `additionalData` 注入 `theme.scss`)
3. **bootstrap 异步函数**: 先 `await checkin.load()` 加载数据,再 `mount`,最后才 `notify.start()` 启动通知定时器(确保读取到当日打卡状态)

### 数据层
- **IndexedDB** 通过 `idb-keyval` 存储:`sport-checkin:checkins`(打卡)、`sport-checkin:custom-courses`(自定义)
- 打卡记录字段: `date(YYYY-MM-DD)`、`courseId`、`category`、`courseName`、`duration`、`mood`、`createdAt`
- 课程合并策略: 种子课程硬编码 + 用户自定义追加,均带 `custom: boolean` 标记
- localStorage 存: `sport-checkin:notify-settings`、`sport-checkin:theme`

### Store 设计
两个 store 都用 options API(非 setup 语法)。`checkin` store 的派生 getter(`streakDays`/`categoryStats` 等)被多个视图复用;`courses.byId` 是 O(1) 索引。

### 路由
- `/`、`/checkin`、`/checkin/:courseId`(预设课程)、`/courses`、`/courses/:id`(跟练)、`/stats`、`/settings`
- `meta.title` 用于顶栏标题与 document.title 同步
- `App.vue` 中 `activeName` 计算属性把子路由(checkin / course-play)归并到主导航项

### 通知机制
`useNotify` 是**模块级单例**(导出 `settings` / `permission` 共享 ref)。`tick()` 每 30s 检查当前时分是否匹配用户设置,通过 `lastFiredDate` 避免同日重复触发。仅在 `!hasCheckedToday` 时弹出,点击通知跳到 `#/`。

### 主题切换
`useTheme` 同样模块级单例,默认 `dark`,通过 `<html>` 的 `data-theme` 属性 + CSS 变量切换(深/亮两套变量在 `theme.scss` 定义)。`App.vue` 监听 `theme` 同步 `dark` class(Element Plus 兼容)。

### 设计系统
所有颜色、字体、圆角都用 CSS 变量(`--color-flame`、`--font-display` 等),组件内通过 `var()` 引用,而**非**直接写颜色字面量。新增 UI 时保持这一约定。

字体: `Bebas Neue`(展示) / `JetBrains Mono`(等宽) / `Manrope` + `Noto Sans SC`(正文) —— 已在 `index.html` 通过 Google Fonts 预加载。

## 开发注意

- 路由使用 hash 模式,部署到子路径或静态托管无影响
- 修改 `theme.scss` 中的 CSS 变量时,深/亮两套都要同步
- 新增分类时:在 `seedCourses.js` 的 `categories` 数组中加项(包含 `id` / `name` / `color`),并在 `HomeView.vue` 的推荐排序数组(`order`)、强度映射(map)中加对应分支
- 打卡记录以 `date` 字符串(YYYY-MM-DD)为主键,同日二次打卡会覆盖而非追加
- 截图位于 `screenshots/`,包含 6 个页面与调试用目录 `_debug/`
