<script setup>
import { computed, onMounted } from "vue";
import dayjs from "dayjs";
import { useCheckinStore } from "@/stores/checkin.js";
import { useCoursesStore } from "@/stores/courses.js";

const checkin = useCheckinStore();
const courses = useCoursesStore();

onMounted(async () => {
  if (!courses.loaded) await courses.load();
});

// 14 天训练日志
const heatmap = computed(() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = dayjs().subtract(i, "day").format("YYYY-MM-DD");
    const rec = checkin.checkins.find((c) => c.date === d);
    days.push({ date: d, checked: !!rec, record: rec, weekday: dayjs(d).day() });
  }
  return days;
});

const monthLabel = computed(() => dayjs().format("YYYY.MM"));

const monthByCategory = computed(() => {
  const map = {};
  checkin.checkins
    .filter((c) => dayjs(c.date).isSame(dayjs(), "month"))
    .forEach((c) => { map[c.category] = (map[c.category] || 0) + 1; });
  return courses.categories
    .filter((c) => c.id !== "all")
    .map((c) => ({ ...c, count: map[c.id] || 0 }));
});

const totalMinutes = computed(() => checkin.checkins.reduce((acc, c) => acc + (c.duration || 0), 0));
const totalKcal = computed(() => Math.round(totalMinutes.value * 7));
const recent = computed(() => heatmap.value.slice(-7));

// 历史最大连续
const maxStreak = computed(() => {
  const dates = [...checkin.checkins].map((c) => c.date).sort();
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = dayjs(dates[i - 1]);
    const now = dayjs(dates[i]);
    if (now.diff(prev, "day") === 1) { cur++; best = Math.max(best, cur); }
    else if (now.diff(prev, "day") === 0) { /* same day */ }
    else { cur = 1; }
  }
  return best;
});

// 最近 14 天按周聚合(2 周)
const weekVolume = computed(() => {
  const days = heatmap.value;
  const week1 = days.slice(0, 7);
  const week2 = days.slice(7);
  return [
    { label: "W-1", count: week1.filter(d => d.checked).length, min: week1.reduce((a, d) => a + (d.record?.duration || 0), 0) },
    { label: "W-0", count: week2.filter(d => d.checked).length, min: week2.reduce((a, d) => a + (d.record?.duration || 0), 0) },
  ];
});

// PR
const prStreak = computed(() => Math.max(checkin.streakDays, maxStreak.value));
const prMinutes = computed(() => {
  let max = 0;
  checkin.checkins.forEach((c) => { if ((c.duration || 0) > max) max = c.duration; });
  return max;
});

// 徽章
const badges = computed(() => {
  const total = checkin.totalCount;
  const streak = checkin.streakDays;
  return [
    { id: "first", label: "新手", desc: "完成首次打卡", icon: "✦", unlocked: total >= 1, color: "#00E5FF" },
    { id: "week", label: "一周", desc: "累计 7 天", icon: "◆", unlocked: total >= 7, color: "#00E676" },
    { id: "month", label: "满月", desc: "累计 30 天", icon: "★", unlocked: total >= 30, color: "#FF3D8A" },
    { id: "cent", label: "百日", desc: "累计 100 天", icon: "✸", unlocked: total >= 100, color: "#FFD23C" },
    { id: "streak7", label: "连 7", desc: "连续 7 天", icon: "▰", unlocked: streak >= 7, color: "#FF8E3C" },
    { id: "streak30", label: "连 30", desc: "连续 30 天", icon: "▰▰", unlocked: streak >= 30, color: "#FF2E2E" },
  ];
});
const unlockedCount = computed(() => badges.value.filter(b => b.unlocked).length);
</script>

<template>
  <div class="page stats-page">
    <div class="head-bar fade-up">
      <div>
        <div class="page-title">训练日志</div>
        <p class="head-sub mono">// 你的训练数据 · 共 {{ checkin.totalCount }} 次打卡</p>
      </div>
      <div class="head-id">
        <div class="id-label mono">// 累计打卡</div>
        <div class="id-num display">#{{ String(checkin.totalCount).padStart(4, "0") }}</div>
      </div>
    </div>

    <!-- 头部 PR 看板 -->
    <section class="pr-row fade-up">
      <div class="pr-card pr-flame">
        <div class="pr-tag mono">// 当前连续 · 最高</div>
        <div class="pr-num display">{{ prStreak }}<span class="pr-unit">天</span></div>
        <div class="pr-label">连续天数</div>
        <div class="pr-bar"><div class="pr-fill" :style="{ width: Math.min(100, prStreak * 4) + '%' }" /></div>
      </div>
      <div class="pr-card pr-cyan">
        <div class="pr-tag mono">// 累计消耗</div>
        <div class="pr-num display">{{ totalKcal }}<span class="pr-unit">千卡</span></div>
        <div class="pr-label">{{ totalMinutes }} 分钟 · 累计</div>
        <div class="pr-bar"><div class="pr-fill" :style="{ width: Math.min(100, totalKcal / 100) + '%' }" /></div>
      </div>
      <div class="pr-card pr-pink">
        <div class="pr-tag mono">// 单次最长</div>
        <div class="pr-num display">{{ prMinutes }}<span class="pr-unit">分</span></div>
        <div class="pr-label">单次训练最长</div>
        <div class="pr-bar"><div class="pr-fill" :style="{ width: Math.min(100, prMinutes * 2) + '%' }" /></div>
      </div>
    </section>

    <!-- 4 KPI + 14 天 -->
    <section class="kpi-section">
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label mono">连续</div>
          <div class="kpi-num display tabular count-in">{{ checkin.streakDays }}</div>
          <div class="kpi-foot mono">
            <span class="dot dot-flame" /> 连续天数
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label mono">累计</div>
          <div class="kpi-num display tabular">{{ checkin.totalCount }}</div>
          <div class="kpi-foot mono">
            <span class="dot dot-cyan" /> 已完成
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label mono">本月</div>
          <div class="kpi-num display tabular">{{ checkin.currentMonthCount }}</div>
          <div class="kpi-foot mono">
            <span class="dot dot-pink" /> {{ monthLabel }}
          </div>
        </div>
        <div class="kpi">
          <div class="kpi-label mono">千卡</div>
          <div class="kpi-num display tabular">{{ totalKcal }}</div>
          <div class="kpi-foot mono">
            <span class="dot dot-acid" /> 预估
          </div>
        </div>
      </div>
    </section>

    <!-- 14 天训练日志 + 周训练量 -->
    <section class="panel fade-up-d1">
      <div class="panel-head">
        <div>
          <div class="panel-tag mono">// 训练日志 · 最近 14 天</div>
          <div class="panel-title cn-display">训练日志</div>
        </div>
        <div class="legend">
          <span class="mono">少</span>
          <div class="legend-cell" data-level="0" />
          <div class="legend-cell" data-level="1" />
          <div class="legend-cell" data-level="2" />
          <div class="legend-cell" data-level="3" />
          <span class="mono">多</span>
        </div>
      </div>
      <div class="log-row">
        <div
          v-for="d in heatmap"
          :key="d.date"
          class="log-cell"
          :class="{ on: d.checked }"
          :title="`${d.date}${d.record ? ' · ' + d.record.courseName : ''}`"
        >
          <div class="log-wd mono">{{ ['日','一','二','三','四','五','六'][d.weekday] }}</div>
          <div class="log-day display">{{ dayjs(d.date).format("D") }}</div>
          <div v-if="d.checked" class="log-mark">🔥</div>
          <div v-else class="log-mark-empty">·</div>
        </div>
      </div>
    </section>

    <!-- 周训练量 + 分类分布 -->
    <section class="row-2">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-tag mono">// 周训练量</div>
            <div class="panel-title cn-display">周训练量</div>
          </div>
        </div>
        <div class="week-bars">
          <div v-for="w in weekVolume" :key="w.label" class="week-bar">
            <div class="wb-track">
              <div class="wb-fill" :style="{ height: (w.count * 14) + '%' }">
                <div class="wb-val display">{{ w.count }}</div>
              </div>
            </div>
            <div class="wb-label mono">{{ w.label === 'W-1' ? '上周' : '本周' }}</div>
            <div class="wb-min mono">{{ w.min }} 分</div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-tag mono">// {{ monthLabel }} 各分类</div>
            <div class="panel-title cn-display">分类分布</div>
          </div>
        </div>
        <div class="cat-bars">
          <div v-for="c in monthByCategory" :key="c.id" class="cat-row">
            <div class="cat-info">
              <div class="cat-row-name">
                <span class="cat-bar" :style="{ '--cat-color': c.color }" />
                {{ c.name }}
              </div>
              <div class="cat-row-num tabular">{{ c.count }}</div>
            </div>
            <div class="cat-track">
              <div class="cat-fill" :style="{ width: c.count ? Math.min(100, c.count * 20) + '%' : '0%', background: c.color, color: c.color }" />
            </div>
          </div>
          <div v-if="!monthByCategory.some(c => c.count)" class="empty mono">// 本月暂无数据</div>
        </div>
      </article>
    </section>

    <!-- 徽章 -->
    <section class="panel fade-up-d2">
      <div class="panel-head">
        <div>
          <div class="panel-tag mono">// 成就</div>
          <div class="panel-title cn-display">徽章</div>
        </div>
        <div class="badge-count mono">
          <span>已解锁</span>
          <span class="bc-num">{{ unlockedCount }} / {{ badges.length }}</span>
        </div>
      </div>
      <div class="badges">
        <div
          v-for="b in badges"
          :key="b.id"
          class="badge"
          :class="{ unlocked: b.unlocked }"
          :style="{ '--accent': b.color }"
        >
          <div class="badge-mark">{{ b.icon }}</div>
          <div class="badge-name">{{ b.label }}</div>
          <div class="badge-desc">{{ b.desc }}</div>
          <div class="badge-stamp stamp" :class="b.unlocked ? '' : 'stamp-locked'">{{ b.unlocked ? '已解锁' : '未解锁' }}</div>
        </div>
      </div>
    </section>

    <!-- 最近一周 -->
    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-tag mono">// 最近 7 天</div>
          <div class="panel-title cn-display">最近一周</div>
        </div>
      </div>
      <div class="recent">
        <div
          v-for="d in recent"
          :key="d.date"
          class="recent-item"
          :class="{ done: d.checked }"
        >
          <div class="recent-date">
            <div class="recent-day display">{{ dayjs(d.date).format("D") }}</div>
            <div class="recent-wd mono">{{ ['日','一','二','三','四','五','六'][d.weekday] }}</div>
          </div>
          <div class="recent-body">
            <div class="recent-course">
              <span v-if="d.record">{{ d.record.courseName }}</span>
              <span v-else class="recent-empty">// 休息日</span>
            </div>
            <div class="recent-meta">
              <span v-if="d.record">⏱ {{ d.record.duration }} 分</span>
              <span v-else>—</span>
            </div>
          </div>
          <div class="recent-mark" :class="{ done: d.checked }">
            {{ d.checked ? '✓' : '·' }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.stats-page { padding-bottom: 60px; }

// 头部
.head-bar {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px; flex-wrap: wrap;
}
.head-sub { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; margin: 8px 0 0; }
.head-id { text-align: right; }
.id-label { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.2em; }
.id-num {
  font-size: 28px;
  color: var(--color-flame);
  line-height: 1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px rgba(255, 46, 46, 0.3);
}

// PR 行
.pr-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}
@media (max-width: 768px) { .pr-row { grid-template-columns: 1fr; } }
.pr-card {
  position: relative;
  padding: 22px 24px 18px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 3px;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent);
  }
  &::after {
    content: "最佳";
    position: absolute;
    right: -20px; top: -20px;
    font-family: var(--font-display);
    font-size: 140px;
    color: var(--accent);
    opacity: 0.04;
    line-height: 1;
    letter-spacing: -0.05em;
    pointer-events: none;
  }
}
.pr-flame { --accent: var(--color-flame); }
.pr-cyan  { --accent: var(--color-cyan); }
.pr-pink  { --accent: var(--color-pink); }
.pr-tag { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.25em; margin-bottom: 8px; }
.pr-num {
  font-size: 56px;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -0.04em;
  text-shadow: 0 0 16px color-mix(in srgb, var(--accent) 40%, transparent);
  .pr-unit { font-size: 18px; color: var(--color-text-1); margin-left: 4px; }
}
.pr-label { font-size: 10px; color: var(--color-text-1); letter-spacing: 0.2em; margin-top: 6px; }
.pr-bar {
  height: 4px;
  background: var(--color-ink-3);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}
.pr-fill {
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

// KPI
.kpi-section { margin-bottom: 18px; }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi {
  padding: 18px 20px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}
.kpi-label { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.25em; margin-bottom: 6px; }
.kpi-num {
  font-size: 36px;
  color: var(--color-text-0);
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}
.kpi-foot {
  display: flex; align-items: center; gap: 4px;
  font-size: 9px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
}
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-flame { background: var(--color-flame); box-shadow: 0 0 6px var(--color-flame); }
.dot-cyan   { background: var(--color-cyan); box-shadow: 0 0 6px var(--color-cyan); }
.dot-pink   { background: var(--color-pink); box-shadow: 0 0 6px var(--color-pink); }
.dot-acid   { background: var(--color-acid); box-shadow: 0 0 6px var(--color-acid); }

// 训练日志
.log-row {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 6px;
}
@media (max-width: 768px) { .log-row { grid-template-columns: repeat(7, 1fr); } }
.log-cell {
  aspect-ratio: 0.85;
  background: var(--color-ink-3);
  border: 1px solid var(--color-line);
  border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative;
  font-size: 10px;
  color: var(--color-text-2);
  transition: all 0.2s;
  &.on {
    background: linear-gradient(135deg, var(--color-flame), var(--color-pink));
    border-color: var(--color-flame);
    color: #000;
    box-shadow: 0 0 12px rgba(255, 46, 46, 0.4);
  }
}
.log-wd { font-size: 8px; opacity: 0.6; }
.log-day { font-size: 18px; font-weight: 700; line-height: 1; margin-top: 2px; }
.log-mark { font-size: 12px; margin-top: 2px; }
.log-mark-empty { font-size: 14px; opacity: 0.3; }

.legend { display: flex; align-items: center; gap: 6px; font-size: 9px; color: var(--color-text-2); letter-spacing: 0.2em; }
.legend-cell {
  width: 14px; height: 14px;
  border-radius: 3px;
  background: var(--color-ink-3);
  &[data-level="1"] { background: rgba(255, 46, 46, 0.3); }
  &[data-level="2"] { background: rgba(255, 46, 46, 0.6); }
  &[data-level="3"] { background: var(--color-flame); box-shadow: 0 0 6px var(--color-flame); }
}

// 通用面板
.panel {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 22px 24px;
  margin-bottom: 18px;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.panel-tag { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.25em; }
.panel-title { font-size: 18px; font-weight: 900; margin: 4px 0 0; letter-spacing: 0.04em; }

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 14px;
  margin-bottom: 0;
}
.row-2 > .panel { margin-bottom: 0; }
@media (max-width: 900px) { .row-2 { grid-template-columns: 1fr; } }

// 周训练量
.week-bars {
  display: flex; align-items: flex-end; gap: 18px;
  height: 200px;
  padding: 0 8px;
}
.week-bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.wb-track {
  width: 60%;
  flex: 1;
  background: var(--color-ink-3);
  border-radius: 4px;
  display: flex; align-items: flex-end;
  position: relative;
  overflow: hidden;
}
.wb-fill {
  width: 100%;
  background: linear-gradient(180deg, var(--color-flame), var(--color-pink));
  border-radius: 4px 4px 0 0;
  transition: height 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 8px;
  min-height: 6px;
  box-shadow: 0 0 12px rgba(255, 46, 46, 0.3) inset;
}
.wb-val { font-size: 18px; color: #fff; line-height: 1; }
.wb-label { font-size: 10px; color: var(--color-text-1); letter-spacing: 0.15em; }
.wb-min { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.15em; }

// 分类条
.cat-bars { display: flex; flex-direction: column; gap: 14px; }
.cat-row { display: flex; flex-direction: column; gap: 6px; }
.cat-info { display: flex; align-items: center; justify-content: space-between; }
.cat-row-name {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
}
.cat-row-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-0);
}
.cat-track {
  height: 6px;
  background: var(--color-ink-3);
  border-radius: 3px;
  overflow: hidden;
}
.cat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 0 6px currentColor;
}
.empty { padding: 20px; text-align: center; font-size: 11px; letter-spacing: 0.2em; color: var(--color-text-2); }

// 徽章
.badge-count {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  .bc-num { font-size: 18px; color: var(--color-flame); font-weight: 700; }
}
.badges {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
@media (max-width: 900px) { .badges { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 480px) { .badges { grid-template-columns: repeat(2, 1fr); } }
.badge {
  position: relative;
  padding: 18px 12px 14px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  text-align: center;
  filter: grayscale(0.85);
  opacity: 0.5;
  transition: all 0.25s;
  &.unlocked {
    filter: none;
    opacity: 1;
    border-color: var(--accent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%);
    box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 20%, transparent);
    .badge-mark { color: var(--accent); text-shadow: 0 0 12px var(--accent); }
  }
}
.badge-mark { font-size: 32px; color: var(--color-text-2); margin-bottom: 6px; line-height: 1; transition: all 0.25s; }
.badge-name { font-size: 14px; font-weight: 900; margin-bottom: 4px; letter-spacing: 0.05em; }
.badge-desc { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.1em; margin-bottom: 8px; }
.badge-stamp { font-size: 8px !important; padding: 2px 6px !important; }
.stamp-locked {
  background: var(--color-ink-3) !important;
  border-color: var(--color-line) !important;
  color: var(--color-text-2) !important;
}

// 最近一周
.recent { display: flex; flex-direction: column; gap: 6px; }
.recent-item {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 14px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  &.done {
    background: linear-gradient(90deg, rgba(255, 46, 46, 0.06), transparent);
    border-color: rgba(255, 46, 46, 0.2);
  }
}
.recent-date { text-align: center; min-width: 40px; }
.recent-day { font-size: 22px; font-weight: 700; line-height: 1; }
.recent-wd { font-size: 8px; color: var(--color-text-2); letter-spacing: 0.2em; margin-top: 2px; }
.recent-body { flex: 1; }
.recent-course {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}
.recent-meta { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.15em; }
.recent-empty { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.25em; }
.recent-mark {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--color-ink-3);
  color: var(--color-text-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  &.done {
    background: var(--color-flame);
    color: #000;
    box-shadow: 0 0 8px var(--color-flame);
  }
}
</style>