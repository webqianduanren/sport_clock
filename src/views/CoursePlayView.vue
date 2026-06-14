<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCoursesStore } from "@/stores/courses.js";
import { useCheckinStore } from "@/stores/checkin.js";

const route = useRoute();
const router = useRouter();
const courses = useCoursesStore();
const checkin = useCheckinStore();

const elapsed = ref(0);
let ticker = null;
const burning = ref(true);

onMounted(async () => {
  if (!courses.loaded) await courses.load();
  ticker = setInterval(() => {
    elapsed.value += 1;
    if (elapsed.value % 6 === 0) burning.value = !burning.value;
  }, 1000);
});
onBeforeUnmount(() => { if (ticker) clearInterval(ticker); });

const course = computed(() => courses.byId[route.params.id]);
const catName = computed(() => courses.categories.find(c => c.id === course.value?.category)?.name || "");
const catColor = computed(() => courses.categories.find(c => c.id === course.value?.category)?.color || "#FF2E2E");
const isCheckedWithThis = computed(() => {
  const t = checkin.todayCheckin;
  return t && t.courseId === course.value?.id;
});

// 心率模拟:基于类目+时间进度
const intensityMap = { hiit: 5, boxing: 4, cardio: 3, fatburn: 2, shape: 2 };
const sessionZone = computed(() => intensityMap[course.value?.category] || 3);
const bpmBase = [110, 135, 152, 168, 178];
const bpmWave = computed(() => {
  const base = bpmBase[sessionZone.value - 1];
  // 微微波动 ±6
  const noise = Math.sin(elapsed.value / 4) * 4 + Math.sin(elapsed.value / 13) * 3;
  return Math.round(base + noise);
});

async function finishCheckin() {
  if (!course.value) return;
  await checkin.checkIn({
    courseId: course.value.id,
    category: course.value.category,
    courseName: course.value.name,
    duration: course.value.duration,
    mood: "good",
  });
  ElMessage({ message: "🎉 打卡完成!坚持就是胜利", type: "success" });
  router.push({ name: "home" });
}

async function deleteCourse() {
  if (!course.value?.custom) return;
  try {
    await ElMessageBox.confirm(`确定删除「${course.value.name}」?`, "提示", { type: "warning" });
    await courses.removeCustom(course.value.id);
    ElMessage({ message: "已删除", type: "success" });
    router.push({ name: "courses" });
  } catch {}
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function fmtTimeFull(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const progress = computed(() => {
  if (!course.value) return 0;
  return Math.min(100, Math.round((elapsed.value / (course.value.duration * 60)) * 100));
});

const estKcal = computed(() => Math.round((elapsed.value / 60) * 7));

const zones = [
  { i: 1, color: "var(--color-zone-1)", name: "Z1" },
  { i: 2, color: "var(--color-zone-2)", name: "Z2" },
  { i: 3, color: "var(--color-zone-3)", name: "Z3" },
  { i: 4, color: "var(--color-zone-4)", name: "Z4" },
  { i: 5, color: "var(--color-zone-5)", name: "Z5" },
];
</script>

<template>
  <div class="page play-page">
    <button class="back mono" @click="router.back()">← 返回</button>

    <div v-if="course" class="play-wrap">
      <div class="player" :style="{ '--accent': catColor }">
        <div class="player-frame">
          <iframe
            :src="course.videoUrl"
            scrolling="no"
            frameborder="0"
            allowfullscreen
            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups"
          />
        </div>
        <div class="player-overlay scan-line">
          <div class="overlay-tag mono">
            <span class="live-dot" :class="{ off: !burning }" /> 燃脂中
          </div>
        </div>
      </div>

      <div class="info">
        <div class="info-head">
          <div class="info-left">
            <div class="info-cat">
              <span class="cat-bar" :style="{ '--cat-color': catColor }" />
              <span class="mono">{{ catName }} · {{ course.level }}</span>
            </div>
            <h2 class="info-title">{{ course.name }}</h2>
            <p class="info-desc soft">{{ course.desc }}</p>
          </div>
        </div>

        <!-- 加大计时器 + 心率 -->
        <div class="telemetry">
          <div class="tel-main">
            <div class="tel-main-label mono">已用时</div>
            <div class="tel-main-num display tabular">{{ fmtTimeFull(elapsed) }}</div>
            <div class="tel-main-foot mono">时 : 分 : 秒</div>
          </div>
          <div class="tel-divider" />
          <div class="tel-side">
            <div class="tel-cell">
              <div class="tel-label mono">目标</div>
              <div class="tel-num display">{{ course.duration }}<span class="tel-unit">分</span></div>
            </div>
            <div class="tel-cell">
              <div class="tel-label mono">进度</div>
              <div class="tel-num display">{{ progress }}<span class="tel-unit">%</span></div>
            </div>
          </div>
        </div>

        <!-- 心率条 -->
        <div class="hr-strip" :style="{ '--accent': catColor }">
          <div class="hr-num">
            <div class="hr-bpm display tabular">{{ bpmWave }}</div>
            <div class="hr-unit mono">次/分</div>
            <div class="hr-icon" :class="{ active: burning }">♥</div>
          </div>
          <div class="hr-body">
            <div class="hr-zone">
              <div class="zone-bar">
                <div
                  v-for="z in zones"
                  :key="z.i"
                  class="zone-seg"
                  :class="{ on: z.i <= sessionZone, active: z.i === sessionZone }"
                  :style="{ '--zone-color': z.color }"
                />
              </div>
              <div class="hr-zone-label mono">Z{{ sessionZone }} · {{ catName }} 强度</div>
            </div>
            <div class="hr-side">
              <div class="hr-stat">
                <div class="hs-label mono">预估消耗</div>
                <div class="hs-val display tabular">{{ estKcal }}</div>
              </div>
              <div class="hr-stat">
                <div class="hs-label mono">剩余</div>
                <div class="hs-val display tabular">{{ Math.max(0, course.duration - Math.floor(elapsed.value / 60)) }}<span class="hs-unit">分</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="progress-bar" :style="{ '--accent': catColor }">
          <div class="progress-fill" :style="{ width: progress + '%' }" />
          <div class="progress-glow" :style="{ left: progress + '%' }" />
        </div>

        <div class="actions">
          <button
            v-if="!isCheckedWithThis"
            class="btn-finish"
            :style="{ '--accent': catColor }"
            @click="finishCheckin"
          >
            <span class="flame flame-pulse">🔥</span>
            <span class="txt">
              <span class="txt-cn">跟练完成,打卡</span>
              <span class="txt-en mono">完成并记录</span>
            </span>
            <span class="arr">→</span>
          </button>
          <div v-else class="btn-done">
            <span>✓</span>
            <span class="mono">已打卡</span>
          </div>
          <button v-if="course.custom" class="btn-del mono" @click="deleteCourse">删除</button>
        </div>
        <div class="tip muted">// 训练结束随时打卡,系统不做强制</div>
      </div>
    </div>

    <div v-else class="not-found">
      <div class="not-icon">🤷</div>
      <div class="not-title">课程不存在</div>
      <button class="btn-del mono" @click="router.push({ name: 'courses' })">← 返回课程库</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.play-page { padding-bottom: 60px; }

.back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: transparent;
  color: var(--color-text-2);
  border: 1px solid var(--color-line);
  font-size: 11px;
  letter-spacing: 0.2em;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 16px;
  &:hover { color: var(--color-flame); background: var(--color-ink-2); }
}

.play-wrap { display: flex; flex-direction: column; gap: 18px; }

.player {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-line);
}
.player-frame {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
  iframe {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
  }
}
.player-overlay {
  position: absolute; top: 12px; right: 12px;
  z-index: 5;
  pointer-events: none;
}
.overlay-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid var(--color-flame);
  color: var(--color-flame);
  border-radius: 2px;
  font-size: 10px;
  letter-spacing: 0.2em;
}
.live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--color-flame);
  box-shadow: 0 0 6px var(--color-flame);
  animation: neon-blink 1.5s ease-in-out infinite;
  &.off { background: var(--color-text-3); box-shadow: none; animation: none; }
}

.info {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 22px 24px;
}

.info-cat {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  margin-bottom: 8px;
}
.info-title {
  font-size: 24px;
  font-weight: 900;
  margin: 0 0 8px;
  line-height: 1.2;
  letter-spacing: 0.02em;
}
.info-desc { font-size: 13px; line-height: 1.6; margin: 0 0 18px; }

// 遥测(加大版)
.telemetry {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 18px 22px;
  margin-bottom: 14px;
  align-items: center;
  gap: 0;
}
.tel-main {
  display: flex; flex-direction: column; gap: 4px;
}
.tel-main-label {
  font-size: 10px; color: var(--color-text-2); letter-spacing: 0.25em;
}
.tel-main-num {
  font-size: 56px;
  color: var(--color-flame);
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 0 18px rgba(255, 46, 46, 0.4);
  font-variant-numeric: tabular-nums;
}
.tel-main-foot {
  font-size: 9px; color: var(--color-text-2); letter-spacing: 0.3em;
}
.tel-divider { width: 1px; height: 60px; background: var(--color-line); justify-self: center; }
.tel-side {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.tel-cell {}
.tel-label {
  font-size: 9px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  margin-bottom: 4px;
}
.tel-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-0);
  line-height: 1;
  letter-spacing: -0.02em;
  .tel-unit { font-size: 11px; color: var(--color-text-2); margin-left: 2px; font-weight: 400; }
}

// 心率条
.hr-strip {
  display: flex; align-items: center; gap: 18px;
  padding: 16px 18px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}
.hr-num {
  display: flex; align-items: baseline; gap: 6px;
  min-width: 120px;
  position: relative;
}
.hr-bpm {
  font-size: 36px;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 40%, transparent);
}
.hr-unit { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; }
.hr-icon {
  position: absolute; right: 0; top: 0;
  font-size: 16px;
  color: var(--accent);
  opacity: 0.5;
  &.active { animation: heart-pulse 0.85s ease-in-out infinite; }
}
@keyframes heart-pulse {
  0%, 100% { transform: scale(1); opacity: 1; text-shadow: 0 0 6px var(--accent); }
  20% { transform: scale(1.3); opacity: 1; }
  40% { transform: scale(0.95); opacity: 0.7; }
}
.hr-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.hr-zone-label {
  font-size: 9px;
  color: var(--color-text-2);
  letter-spacing: 0.25em;
  margin-top: 4px;
}
.hr-side { display: flex; gap: 18px; }
.hr-stat { text-align: left; }
.hs-label {
  font-size: 9px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  margin-bottom: 2px;
}
.hs-val {
  font-size: 20px;
  color: var(--color-text-0);
  line-height: 1;
  letter-spacing: -0.02em;
  .hs-unit { font-size: 10px; color: var(--color-text-2); margin-left: 2px; }
}

// 进度条
.progress-bar {
  position: relative;
  height: 4px;
  background: var(--color-ink-3);
  border-radius: 2px;
  margin-bottom: 22px;
  overflow: visible;
}
.progress-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #fff));
  border-radius: 2px;
  transition: width 1s ease;
  box-shadow: 0 0 8px var(--accent);
}
.progress-glow {
  position: absolute;
  top: 50%;
  width: 12px; height: 12px;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 16px var(--accent);
  transition: left 1s ease;
}

.actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.btn-finish {
  flex: 1;
  display: flex; align-items: center; gap: 14px;
  padding: 16px 22px;
  background: var(--accent);
  border: none;
  color: #000;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent);
  &:hover { transform: translateY(-2px); }
  .flame { font-size: 24px; }
  .txt { flex: 1; text-align: left; display: flex; flex-direction: column; gap: 2px; }
  .txt-cn { font-size: 16px; font-weight: 900; letter-spacing: 0.05em; }
  .txt-en { font-size: 9px; letter-spacing: 0.2em; opacity: 0.7; }
  .arr { font-size: 22px; }
}
.btn-done {
  flex: 1;
  display: flex; align-items: center; gap: 10px; justify-content: center;
  padding: 16px 22px;
  background: var(--color-lime);
  color: #000;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  span:first-child { font-size: 22px; }
}
.btn-del {
  padding: 16px 22px;
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-text-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  cursor: pointer;
  &:hover { color: var(--color-flame); border-color: var(--color-flame); }
}

.tip { font-size: 10px; letter-spacing: 0.15em; text-align: center; }

.not-found {
  text-align: center;
  padding: 80px 20px;
  background: var(--color-ink-2);
  border-radius: var(--radius);
  border: 1px solid var(--color-line);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.not-icon { font-size: 48px; }
.not-title { font-size: 14px; color: var(--color-text-1); margin-bottom: 8px; }
</style>