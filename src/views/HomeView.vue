<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { useCheckinStore } from "@/stores/checkin.js";
import { useCoursesStore } from "@/stores/courses.js";
import { moodOptions } from "@/data/seedCourses.js";

const router = useRouter();
const checkin = useCheckinStore();
const courses = useCoursesStore();

onMounted(async () => {
  if (!courses.loaded) await courses.load();
});

const now = dayjs();
const weekday = ["日", "一", "二", "三", "四", "五", "六"][now.day()];
const dateLabel = now.format("YYYY.MM.DD");

const greeting = computed(() => {
  const h2 = now.hour();
  if (h2 < 6) return "夜深了";
  if (h2 < 11) return "早安";
  if (h2 < 14) return "中午好";
  if (h2 < 18) return "下午好";
  if (h2 < 22) return "晚上好,准备开练";
  return "夜深了";
});

const recommended = computed(() => {
  if (!courses.all.length) return null;
  const stats = checkin.categoryStats;
  const order = ["hiit", "cardio", "boxing", "fatburn", "shape"];
  const sortedCats = [...order].sort((a, b) => (stats[a] || 0) - (stats[b] || 0));
  for (const cat of sortedCats) {
    const pick = courses.all.find((c) => c.category === cat);
    if (pick) return pick;
  }
  return courses.all[0];
});

const todayRecord = computed(() => checkin.todayCheckin);
const todayCourse = computed(() =>
  todayRecord.value ? courses.byId[todayRecord.value.courseId] : null
);
const todayMood = computed(() => {
  if (!todayRecord.value) return null;
  return moodOptions.find((m) => m.value === todayRecord.value.mood);
});

const totalMinutes = computed(() => checkin.checkins.reduce((acc, c) => acc + (c.duration || 0), 0));
const totalKcal = computed(() => Math.round(totalMinutes.value * 7));

const monthGoal = 20;
const monthProgress = computed(() => Math.min(100, Math.round((checkin.currentMonthCount / monthGoal) * 100)));

// 强度区
const sessionIntensity = computed(() => {
  const map = { hiit: 5, boxing: 4, cardio: 3, fatburn: 2, shape: 2 };
  const cat = recommended.value?.category || todayCourse.value?.category || "cardio";
  return map[cat] || 3;
});
const zones = [
  { i: 1, color: "var(--color-zone-1)", name: "Z1 · 恢复" },
  { i: 2, color: "var(--color-zone-2)", name: "Z2 · 燃脂" },
  { i: 3, color: "var(--color-zone-3)", name: "Z3 · 有氧" },
  { i: 4, color: "var(--color-zone-4)", name: "Z4 · 阈值" },
  { i: 5, color: "var(--color-zone-5)", name: "Z5 · 无氧" },
];

const targetMin = computed(() => recommended.value?.duration || todayCourse.value?.duration || 30);
const targetKcal = computed(() => Math.round(targetMin.value * 7));

function goCheckin() { router.push({ name: "checkin" }); }
function playRecommended() {
  if (recommended.value) router.push({ name: "course-play", params: { id: recommended.value.id } });
}

const recCatLabel = computed(() => courses.categories.find(c => c.id === recommended.value?.category)?.name || "");
const recCatColor = computed(() => courses.categories.find(c => c.id === recommended.value?.category)?.color || "#FF2E2E");
const recCatForToday = computed(() => courses.categories.find(c => c.id === todayCourse.value?.category));
</script>

<template>
  <div class="page home">
    <div class="briefing-bar fade-up">
      <div class="bb-left">
        <div class="bb-num display">运动</div>
        <div class="bb-mid">
          <div class="bb-tag mono">// 任务简报 · 星期{{ weekday }}</div>
          <div class="bb-date mono">{{ dateLabel }}</div>
        </div>
      </div>
      <div class="bb-right">
        <div class="tape-strip">晚间训练</div>
        <div class="bb-status mono">
          <span class="bb-dot" :class="{ live: !checkin.hasCheckedToday, done: checkin.hasCheckedToday }" />
          {{ checkin.hasCheckedToday ? "已完成" : "待开始" }}
        </div>
      </div>
    </div>

    <section class="hero fade-up">
      <div class="hero-left">
        <div class="hero-tag mono">// 今晚训练</div>
        <h1 class="hero-greet cn-display">{{ greeting }}</h1>
        <p class="hero-sub">30 分钟,跟一场课,给自己一个交代。</p>

        <div class="intensity">
          <div class="intensity-head">
            <div class="ih-tag mono">强度区间</div>
            <div class="ih-val mono">Z{{ sessionIntensity }} · {{ zones[sessionIntensity - 1].name.split(" · ")[1] }}</div>
          </div>
          <div class="zone-bar">
            <div
              v-for="z in zones"
              :key="z.i"
              class="zone-seg"
              :class="{ on: z.i <= sessionIntensity, active: z.i === sessionIntensity }"
              :style="{ '--zone-color': z.color }"
            />
          </div>
          <div class="zone-labels mono">
            <span v-for="z in zones" :key="z.i">Z{{ z.i }}</span>
          </div>
        </div>
      </div>

      <div class="hero-right scan-line">
        <div class="hero-num-wrap">
          <div class="hero-num-bg display">{{ targetMin }}</div>
          <div class="hero-num-tick track-tick">
            <span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span />
            <span /><span /><span /><span /><span />
          </div>
          <div class="hero-num-label">
            <div class="hnl-cn cn-display">今晚目标</div>
            <div class="hnl-en mono">分钟 · 今晚</div>
          </div>
        </div>
        <div class="hero-foot">
          <div class="hf-item">
            <div class="hf-label mono">预估消耗</div>
            <div class="hf-val display">{{ targetKcal }}</div>
          </div>
          <div class="hf-sep" />
          <div class="hf-item">
            <div class="hf-label mono">连续天数</div>
            <div class="hf-val display flame">{{ checkin.streakDays }}<span class="hf-unit">天</span></div>
          </div>
          <div class="hf-sep" />
          <div class="hf-item">
            <div class="hf-label mono">强度区</div>
            <div class="hf-val display">Z{{ sessionIntensity }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta fade-up-d1">
      <button v-if="!todayRecord" class="btn-fire" @click="goCheckin">
        <span class="btn-flame flame-pulse">🔥</span>
        <span class="btn-text">
          <span class="btn-cn">开始今日打卡</span>
          <span class="btn-en mono">开始训练</span>
        </span>
        <span class="btn-arr">→</span>
      </button>
      <div v-else class="btn-done victory-pulse">
        <div class="btn-done-mark">✓</div>
        <div class="btn-done-text">
          <div class="btn-cn">今日已完成</div>
          <div class="btn-en mono">已完成 · 连续 {{ checkin.streakDays }} 天</div>
        </div>
      </div>
    </section>

    <section class="panels">
      <article class="panel panel-status fade-up-d2">
        <div class="wedge" :style="{ '--wedge-color': 'var(--color-lime)' }" />
        <div class="panel-head">
          <div>
            <div class="panel-tag mono">// 今日记录</div>
            <div class="panel-title cn-display">今日记录</div>
          </div>
          <div v-if="todayRecord" class="stamp">已完成</div>
          <div v-else class="stamp stamp-pending">待打卡</div>
        </div>

        <div v-if="todayRecord" class="status-content">
          <div class="cover-large" :class="`cat-${todayCourse?.category || 'cardio'}`">
            <div class="cover-glow" />
            <div class="cover-label mono">{{ recCatForToday?.name || '今日' }}</div>
            <div class="cover-letter">{{ todayCourse?.name?.[0] || '·' }}</div>
          </div>
          <div class="sc-info">
            <div class="info-cat">
              <span class="cat-bar" :style="{ '--cat-color': recCatForToday?.color }" />
              <span class="mono">{{ recCatForToday?.name || '今日分类' }} · {{ todayMood?.label || '—' }}</span>
            </div>
            <div class="info-title">{{ todayCourse?.name || todayRecord.courseName }}</div>
            <div class="info-meta">
              <span>⏱ {{ todayRecord.duration }} 分钟</span>
              <span class="dot-sep">/</span>
              <span class="mood">{{ todayMood?.emoji }} {{ todayMood?.label }}</span>
            </div>
            <div class="info-time mono">{{ dayjs(todayRecord.createdAt).format("HH:mm") }} · 已记录</div>
          </div>
        </div>

        <div v-else class="panel-empty">
          <div class="empty-icon">🏃</div>
          <div class="empty-title">还没有打卡</div>
          <div class="empty-sub">选一节课,记录今天 30 分钟</div>
        </div>
      </article>

      <article class="panel panel-recommend fade-up-d3" @click="playRecommended">
        <div class="wedge" :style="{ '--wedge-color': recCatColor }" />
        <div class="panel-head">
          <div>
            <div class="panel-tag mono">// 今晚推荐</div>
            <div class="panel-title cn-display">推荐课程</div>
          </div>
          <div class="corner-tag" :style="{ '--tag-color': recCatColor }">{{ recCatLabel || '—' }}</div>
        </div>

        <div v-if="recommended" class="rec-body">
          <div class="cover-large" :class="`cat-${recommended.category}`">
            <img v-if="recommended.cover" :src="recommended.cover" :alt="recommended.name" class="cover-large-img" referrerpolicy="no-referrer" />
            <template v-else>
              <div class="cover-glow" />
              <div class="cover-letter">{{ recommended.name[0] }}</div>
            </template>
            <div class="cover-label mono">{{ recCatLabel }}</div>
          </div>
          <div class="content-info">
            <div class="info-cat">
              <span class="cat-bar" :style="{ '--cat-color': recCatColor }" />
              <span class="mono">{{ recCatLabel }} · {{ recommended.level }}</span>
            </div>
            <h3 class="info-title">{{ recommended.name }}</h3>
            <p class="info-desc soft">{{ recommended.desc }}</p>
            <div class="info-meta">
              <span>⏱ {{ recommended.duration }} 分钟</span>
              <span class="dot-sep">/</span>
              <span>{{ recommended.level }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="gauges fade-up-d4">
      <div class="gauge" style="--accent: var(--color-flame)">
        <div class="gauge-label mono">连续天数</div>
        <div class="gauge-num display tabular count-in">{{ checkin.streakDays }}</div>
        <div class="gauge-bar"><div class="gauge-fill" :style="{ width: Math.min(100, checkin.streakDays * 10) + '%' }" /></div>
        <div class="gauge-foot mono">连续坚持</div>
      </div>
      <div class="gauge" style="--accent: var(--color-cyan)">
        <div class="gauge-label mono">累计天数</div>
        <div class="gauge-num display tabular count-in">{{ checkin.totalCount }}</div>
        <div class="gauge-bar"><div class="gauge-fill" :style="{ width: Math.min(100, checkin.totalCount * 5) + '%' }" /></div>
        <div class="gauge-foot mono">累计</div>
      </div>
      <div class="gauge" style="--accent: var(--color-pink)">
        <div class="gauge-label mono">本月</div>
        <div class="gauge-num display tabular count-in">{{ checkin.currentMonthCount }}</div>
        <div class="gauge-bar"><div class="gauge-fill" :style="{ width: monthProgress + '%' }" /></div>
        <div class="gauge-foot mono">{{ dateLabel }} · 目标 {{ monthGoal }}</div>
      </div>
      <div class="gauge" style="--accent: var(--color-acid)">
        <div class="gauge-label mono">消耗千卡</div>
        <div class="gauge-num display tabular count-in">{{ totalKcal }}</div>
        <div class="gauge-bar"><div class="gauge-fill" :style="{ width: Math.min(100, totalKcal / 50) + '%' }" /></div>
        <div class="gauge-foot mono">预估</div>
      </div>
    </section>

    <section class="cats fade-up-d4">
      <div class="cats-head">
        <div class="panel-tag mono">// 训练跑道</div>
        <div class="panel-title cn-display">分类跑道</div>
      </div>
      <div class="cats-grid">
        <button
          v-for="(c, i) in courses.categories.filter(c => c.id !== 'all')"
          :key="c.id"
          class="cat-tile"
          :style="{ '--accent': c.color }"
          @click="router.push({ name: 'courses', query: { cat: c.id } })"
        >
          <div class="cat-bar-mark" />
          <div class="cat-num mono">跑道 0{{ i + 1 }}</div>
          <div class="cat-name">{{ c.name }}</div>
          <div class="cat-count mono">{{ courses.byCategory(c.id).length }} 节课</div>
          <div class="cat-arrow">→</div>
        </button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home { padding-bottom: 60px; }

.briefing-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  margin-bottom: 18px;
}
.bb-left { display: flex; align-items: center; gap: 16px; }
.bb-num {
  font-size: 30px;
  color: var(--color-flame);
  line-height: 1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 12px rgba(255, 46, 46, 0.3);
}
.bb-tag { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; font-weight: 500; }
.bb-date { font-size: 14px; color: var(--color-text-0); margin-top: 2px; letter-spacing: 0.15em; }
.bb-right { display: flex; align-items: center; gap: 14px; }
.bb-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px;
  color: var(--color-text-1);
  letter-spacing: 0.15em;
  font-weight: 500;
}
.bb-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  &.live { background: var(--color-flame); box-shadow: 0 0 8px var(--color-flame); animation: neon-blink 1.5s ease-in-out infinite; }
  &.done { background: var(--color-lime); box-shadow: 0 0 8px var(--color-lime); }
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
@media (max-width: 900px) { .hero { grid-template-columns: 1fr; } }

.hero-left {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 26px 28px;
  position: relative;
  overflow: hidden;
  &::before {
    content: "运动";
    position: absolute;
    right: -20px; bottom: -50px;
    font-family: var(--font-display);
    font-size: 220px;
    color: rgba(255, 46, 46, 0.04);
    line-height: 1;
    letter-spacing: -0.05em;
    pointer-events: none;
  }
}
.hero-tag {
  font-size: 11px;
  color: var(--color-flame);
  letter-spacing: 0.25em;
  margin-bottom: 10px;
  font-weight: 600;
}
.hero-greet {
  font-size: 38px;
  font-weight: 900;
  margin: 0 0 8px;
  line-height: 1.05;
  letter-spacing: 0.04em;
}
.hero-sub { font-size: 14px; color: var(--color-text-1); margin: 0 0 24px; }

.intensity { position: relative; z-index: 1; }
.intensity-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 8px;
}
.ih-tag { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; font-weight: 500; }
.ih-val {
  font-size: 12px;
  color: var(--color-flame);
  letter-spacing: 0.15em;
  font-weight: 700;
}
.zone-labels {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--color-text-3);
  text-align: center;
  letter-spacing: 0.08em;
  font-weight: 500;
  span:first-child { color: var(--color-zone-1); }
  span:nth-child(2) { color: var(--color-zone-2); }
  span:nth-child(3) { color: var(--color-zone-3); }
  span:nth-child(4) { color: var(--color-zone-4); }
  span:nth-child(5) { color: var(--color-zone-5); }
}

.hero-right {
  background:
    radial-gradient(ellipse at top right, rgba(255, 46, 46, 0.18), transparent 60%),
    var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 24px 28px 18px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px;
}
.hero-num-wrap { position: relative; }
.hero-num-bg {
  font-size: 160px;
  font-weight: 700;
  line-height: 0.85;
  color: var(--color-flame);
  letter-spacing: -0.05em;
  text-shadow: 0 0 32px rgba(255, 46, 46, 0.4);
  display: block;
  margin: 0;
}
.hero-num-tick {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  height: 120px;
  span { width: 8px; height: 2px; background: var(--color-flame); opacity: 0.6; }
}
.hero-num-label {
  margin-top: 4px;
  .hnl-cn { font-size: 16px; font-weight: 900; letter-spacing: 0.06em; }
  .hnl-en { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.15em; margin-top: 2px; font-weight: 500; }
}

.hero-foot {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--color-line);
}
.hf-item { flex: 1; }
.hf-label { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.15em; margin-bottom: 4px; font-weight: 500; }
.hf-val {
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text-0);
  line-height: 1;
  letter-spacing: -0.02em;
  &.flame { color: var(--color-flame); text-shadow: 0 0 12px rgba(255, 46, 46, 0.3); }
  .hf-unit { font-size: 11px; color: var(--color-text-2); margin-left: 3px; font-weight: 500; }
}
.hf-sep { width: 1px; height: 36px; background: var(--color-line); }

.cta { margin-bottom: 22px; }
.btn-fire {
  width: 100%;
  display: flex; align-items: center; gap: 18px;
  padding: 22px 28px;
  background: linear-gradient(120deg, var(--color-flame) 0%, var(--color-pink) 100%);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(255, 46, 46, 0.35);
  transition: all 0.2s;
  &::before {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  &:hover { transform: translateY(-2px); box-shadow: 0 16px 44px rgba(255, 46, 46, 0.45); &::before { transform: translateX(100%); } }
  .btn-flame { font-size: 36px; }
  .btn-text { flex: 1; text-align: left; }
  .btn-cn { display: block; font-size: 22px; font-weight: 900; letter-spacing: 0.06em; }
  .btn-en { display: block; font-size: 10px; letter-spacing: 0.3em; opacity: 0.9; margin-top: 2px; }
  .btn-arr { font-size: 32px; font-family: var(--font-display); }
}

.btn-done {
  width: 100%;
  display: flex; align-items: center; gap: 18px;
  padding: 22px 28px;
  background: linear-gradient(120deg, rgba(0, 230, 118, 0.18), rgba(0, 230, 118, 0.04));
  border: 1px solid var(--color-lime);
  color: var(--color-lime);
  border-radius: var(--radius);
  font-family: inherit;
}
.btn-done-mark {
  width: 56px; height: 56px;
  background: var(--color-lime);
  color: #000;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  font-weight: 700;
  border-radius: 50%;
  box-shadow: 0 0 24px var(--color-lime);
}
.btn-done-text { flex: 1; text-align: left; }
.btn-done .btn-cn { font-size: 20px; font-weight: 900; letter-spacing: 0.06em; }
.btn-done .btn-en { font-size: 10px; letter-spacing: 0.25em; opacity: 0.8; margin-top: 2px; }

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 18px;
}
@media (max-width: 900px) { .panels { grid-template-columns: 1fr; } }
.panel {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 22px;
  position: relative;
  min-height: 200px;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.panel-tag { font-size: 11px; color: var(--color-text-2); letter-spacing: 0.2em; font-weight: 500; }
.panel-title { font-size: 18px; font-weight: 900; margin: 4px 0 0; letter-spacing: 0.04em; }

.panel-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
  padding: 20px 0;
}
.empty-icon { font-size: 44px; margin-bottom: 12px; }
.empty-title { font-size: 16px; font-weight: 900; margin-bottom: 4px; }
.empty-sub { font-size: 12px; color: var(--color-text-2); }

.status-content {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 14px;
  align-items: center;
}

.cover-large {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
  &.cat-hiit    { background: linear-gradient(135deg, #FF2E2E, #FF3D8A); }
  &.cat-cardio  { background: linear-gradient(135deg, #FF3D8A, #FFD23C); }
  &.cat-boxing  { background: linear-gradient(135deg, #FFD23C, #FF8E3C); }
  &.cat-fatburn { background: linear-gradient(135deg, #00E676, #00E5FF); }
  &.cat-shape   { background: linear-gradient(135deg, #7B5BFF, #00E5FF); }
}
.cover-large-img {
  width: 100%; height: 100%;
  object-fit: cover;
  position: absolute; inset: 0;
  z-index: 1;
}
.cover-glow {
  position: absolute; inset: -30%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 60%);
  animation: flame-pulse 3s ease-in-out infinite;
}
.cover-label {
  position: absolute; top: 6px; left: 6px;
  font-size: 8px;
  color: rgba(0, 0, 0, 0.6);
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 5px;
  border-radius: 2px;
  letter-spacing: 0.15em;
  font-weight: 700;
  z-index: 2;
}
.cover-letter {
  font-family: var(--font-display);
  font-size: 52px;
  color: rgba(0, 0, 0, 0.7);
  font-weight: 700;
  line-height: 1;
  z-index: 2;
}

.info-cat {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px;
  color: var(--color-text-1);
  letter-spacing: 0.1em;
  margin-bottom: 6px;
  font-weight: 500;
}
.info-title {
  font-size: 16px;
  font-weight: 900;
  margin-bottom: 6px;
  line-height: 1.3;
}
.info-meta {
  font-size: 11px;
  color: var(--color-text-1);
  margin-bottom: 4px;
}
.info-time { font-size: 10px; letter-spacing: 0.1em; color: var(--color-text-2); font-weight: 500; }
.dot-sep { color: var(--color-text-3); margin: 0 4px; }

.rec-body {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 14px;
  align-items: center;
}

.panel-recommend {
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--color-flame);
    transform: translateY(-2px);
  }
}

.gauges {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}
@media (max-width: 900px) { .gauges { grid-template-columns: repeat(2, 1fr); } }
.gauge-label {
  font-size: 11px;
  color: var(--color-text-1);
  letter-spacing: 0.15em;
  margin-bottom: 6px;
  font-weight: 500;
}
.gauge-num {
  font-size: 42px;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent);
  margin-bottom: 8px;
}
.gauge-bar {
  height: 3px;
  background: var(--color-ink-3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}
.gauge-fill {
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  border-radius: 2px;
  transition: width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.gauge-foot { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.15em; font-weight: 500; }

.cats-head { margin-bottom: 10px; }
.cats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
@media (max-width: 900px) { .cats-grid { grid-template-columns: repeat(2, 1fr); } }

.cat-tile {
  position: relative;
  padding: 18px 16px 16px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  font-family: inherit;
  &:hover {
    background: var(--color-ink-3);
    transform: translateY(-3px);
    .cat-arrow { transform: translate(4px, -4px); color: var(--accent); }
    .cat-bar-mark { box-shadow: 0 0 12px var(--accent); }
  }
}
.cat-bar-mark {
  position: absolute; top: 0; left: 0;
  width: 3px; height: 100%;
  background: var(--accent);
  transition: box-shadow 0.2s;
}
.cat-num {
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.15em;
  margin-bottom: 6px;
  font-weight: 500;
}
.cat-name {
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 4px;
  letter-spacing: 0.05em;
}
.cat-count {
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.15em;
  font-weight: 500;
}
.cat-arrow {
  position: absolute; top: 14px; right: 14px;
  color: var(--color-text-3);
  font-size: 14px;
  transition: all 0.2s ease;
}
</style>