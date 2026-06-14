<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import { useCheckinStore } from "@/stores/checkin.js";
import { useCoursesStore } from "@/stores/courses.js";
import { useTheme } from "@/composables/useTheme.js";

const route = useRoute();
const router = useRouter();
const checkin = useCheckinStore();
const courses = useCoursesStore();
useTheme();

const collapsed = ref(false);
const now = ref(new Date());
let clockTimer = null;

const navItems = [
  { name: "home", label: "今日", en: "Tonight", icon: "Sunny" },
  { name: "checkin", label: "打卡", en: "Check-in", icon: "Check" },
  { name: "courses", label: "课程库", en: "Library", icon: "VideoPlay" },
  { name: "stats", label: "统计", en: "Stats", icon: "DataLine" },
  { name: "settings", label: "设置", en: "Settings", icon: "Setting" },
];

const activeName = computed(() => {
  if (route.name === "checkin" || route.name === "checkin-preset") return "checkin";
  if (route.name === "course-play") return "courses";
  return route.name;
});

const headerTitle = computed(() => route.meta?.title || "今晚");

function go(name) {
  router.push({ name });
}

onMounted(() => {
  if (!courses.loaded) courses.load();
  clockTimer = setInterval(() => (now.value = new Date()), 1000);
});
onBeforeUnmount(() => clockTimer && clearInterval(clockTimer));

const clockStr = computed(() => {
  const h = String(now.value.getHours()).padStart(2, "0");
  const m = String(now.value.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
});

const dateStr = computed(() => {
  const d = now.value;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const wd = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${mm}.${dd} · ${wd}`;
});

// 连续天数作为 "athlete id" 的一部分
const athleteId = computed(() => String(checkin.streakDays).padStart(3, "0"));

</script>

<template>
  <div class="shell">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="brand">
        <div class="brand-mark">
          <div class="brand-flame flame-pulse">🔥</div>
        </div>
        <div v-if="!collapsed" class="brand-text">
          <div class="brand-title display">运动打卡</div>
          <div class="brand-sub mono">坚持每晚 30 分钟</div>
        </div>
      </div>

      <nav class="nav">
        <button
          v-for="(item, i) in navItems"
          :key="item.name"
          class="nav-item"
          :class="{ active: activeName === item.name }"
          @click="go(item.name)"
        >
          <div class="nav-num mono">0{{ i + 1 }}</div>
          <div class="nav-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div v-if="!collapsed" class="nav-text">
            <div class="nav-cn">{{ item.label }}</div>
            <div class="nav-en mono">{{ item.en }}</div>
          </div>
          <div v-if="activeName === item.name" class="nav-bar" />
        </button>
      </nav>

      <div v-if="!collapsed" class="athlete-card">
        <div class="athlete-tag mono">// 连续天数</div>
        <div class="athlete-num display">#{{ athleteId }}</div>
        <div class="athlete-meta mono">
          <span class="dot dot-flame" /> 训练中
        </div>
      </div>

      <div class="sidebar-foot">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          <span v-if="!collapsed" class="mono">收起</span>
        </button>
      </div>
    </aside>

    <!-- 主区 -->
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <div class="topbar-tag mono">// {{ headerTitle }}</div>
          <div class="topbar-clock mono">{{ clockStr }}</div>
          <div class="topbar-date mono">{{ dateStr }}</div>
        </div>

        <div class="topbar-right">
          <div class="status-pill" :class="{ done: checkin.hasCheckedToday }">
            <div class="status-dot" />
            <div class="status-text">
              <span v-if="checkin.hasCheckedToday" class="mono">已打卡 · {{ checkin.streakDays }} 天</span>
              <span v-else class="mono neon-blink">今晚 · 还没打卡</span>
            </div>
          </div>
        </div>
      </header>

      <main class="content train-bg">
        <RouterView v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>

    <!-- 场边大字幕 -->
    <div class="side-marker">运动打卡 · 每晚训练 · 30 分钟 · 坚持 · 不找借口 ·</div>
  </div>
</template>

<style lang="scss" scoped>
.shell {
  display: flex;
  height: 100vh;
  width: 100%;
}

// === 侧边栏 ===
.sidebar {
  width: 220px;
  background: var(--color-ink-0);
  border-right: 1px solid var(--color-line);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
  position: relative;
  z-index: 10;

  &::before {
    content: "";
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255, 46, 46, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 46, 46, 0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }
  > * { position: relative; z-index: 1; }
}

.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-line);
}
.brand-mark {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--color-flame), var(--color-pink));
  border-radius: 10px;
  flex-shrink: 0;
  position: relative;
  &::after {
    content: "";
    position: absolute; inset: -2px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--color-flame), var(--color-pink));
    opacity: 0.5;
    filter: blur(8px);
    z-index: -1;
  }
}
.brand-flame { font-size: 22px; }
.brand-title {
  font-size: 18px;
  color: var(--color-text-0);
  line-height: 1;
  letter-spacing: 0.1em;
}
.brand-sub {
  font-size: 9px;
  color: var(--color-text-2);
  margin-top: 5px;
  letter-spacing: 0.18em;
}

.nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
}
.nav-item {
  display: grid;
  grid-template-columns: 28px 22px 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 10px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--color-text-1);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  text-align: left;
  font-family: inherit;
  &:hover {
    background: rgba(255, 46, 46, 0.06);
    color: var(--color-text-0);
    .nav-num { color: var(--color-flame); }
  }
  &.active {
    background: linear-gradient(90deg, rgba(255, 46, 46, 0.18), rgba(255, 46, 46, 0.04));
    color: var(--color-flame);
    .nav-num { color: var(--color-flame); }
  }
}
.nav-num {
  font-size: 9px;
  color: var(--color-text-3);
  letter-spacing: 0.1em;
  text-align: right;
  transition: color 0.15s;
}
.nav-icon {
  font-size: 18px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}
.nav-text { display: flex; flex-direction: column; min-width: 0; }
.nav-cn { font-size: 14px; font-weight: 600; line-height: 1.2; }
.nav-en {
  font-size: 10px;
  color: var(--color-text-2);
  margin-top: 2px;
  letter-spacing: 0.2em;
  font-weight: 500;
}
.nav-item.active .nav-en { color: var(--color-flame); opacity: 0.7; }
.nav-bar {
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 26px;
  background: var(--color-flame);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px var(--color-flame);
}

.athlete-card {
  margin: 12px;
  padding: 14px 14px 12px;
  background: linear-gradient(160deg, rgba(255, 46, 46, 0.12), transparent 70%);
  border: 1px solid rgba(255, 46, 46, 0.3);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  &::after {
    content: "";
    position: absolute;
    right: -20px; top: -20px;
    width: 60px; height: 60px;
    background: radial-gradient(circle, rgba(255, 46, 46, 0.4), transparent 60%);
  }
}
.athlete-tag {
  font-size: 9px;
  color: var(--color-text-2);
  letter-spacing: 0.25em;
  margin-bottom: 6px;
}
.athlete-num {
  font-size: 28px;
  color: var(--color-flame);
  line-height: 1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px rgba(255, 46, 46, 0.4);
}
.athlete-meta {
  font-size: 9px;
  color: var(--color-text-1);
  margin-top: 6px;
  letter-spacing: 0.2em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-acid);
  box-shadow: 0 0 6px var(--color-acid);
  animation: neon-blink 2s ease-in-out infinite;
}
.dot-flame { background: var(--color-flame); box-shadow: 0 0 6px var(--color-flame); }

.sidebar-foot {
  padding: 12px;
  border-top: 1px solid var(--color-line);
}
.collapse-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: var(--color-text-2);
  cursor: pointer;
  border-radius: 6px;
  font-size: 11px;
  letter-spacing: 0.15em;
  &:hover { color: var(--color-text-0); background: rgba(255, 255, 255, 0.04); }
}

// === 主区 ===
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  border-bottom: 1px solid var(--color-line);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: baseline; gap: 18px; }
.topbar-tag {
  font-size: 11px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  font-weight: 500;
}
.topbar-clock {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-0);
  letter-spacing: 0.05em;
}
.topbar-date {
  font-size: 11px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  font-weight: 500;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }
.status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 10px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.1em;
  font-weight: 500;
  &.done {
    border-color: var(--color-lime);
    background: rgba(0, 230, 118, 0.08);
    color: var(--color-lime);
  }
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-acid);
  box-shadow: 0 0 6px var(--color-acid);
}
.status-pill.done .status-dot {
  background: var(--color-lime);
  box-shadow: 0 0 6px var(--color-lime);
}
.icon-btn {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  color: var(--color-text-1);
  cursor: pointer;
  font-size: 15px;
  transition: all 0.15s ease;
  &:hover { color: var(--color-flame); border-color: var(--color-flame); }
}

.content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.page-enter-active, .page-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 1100px) {
  .side-marker { display: none; }
}
@media (max-width: 768px) {
  .sidebar { width: 72px !important; }
  .brand-text, .nav-text, .collapse-btn span, .athlete-card, .nav-num { display: none; }
  .nav-item { grid-template-columns: 1fr; justify-items: center; }
  .nav-item, .collapse-btn { justify-content: center; }
  .topbar { padding: 12px 16px; }
  .status-text { display: none; }
  .topbar-clock { font-size: 18px; }
  .topbar-date { display: none; }
}
</style>