<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useCheckinStore } from "@/stores/checkin.js";
import { useCoursesStore } from "@/stores/courses.js";
import { moodOptions } from "@/data/seedCourses.js";

const route = useRoute();
const router = useRouter();
const checkin = useCheckinStore();
const courses = useCoursesStore();

const activeCat = ref("all");
const search = ref("");
const selectedId = ref(null);
const duration = ref(20);
const mood = ref("good");
const submitting = ref(false);
const effort = ref(3); // 1-5 自感强度

onMounted(async () => {
  if (!courses.loaded) await courses.load();
  const t = checkin.todayCheckin;
  if (t) {
    selectedId.value = t.courseId;
    duration.value = t.duration;
    mood.value = t.mood;
  } else if (route.params.courseId) {
    selectedId.value = route.params.courseId;
  }
});

const filtered = computed(() => {
  let list = courses.all;
  if (activeCat.value !== "all") list = list.filter((c) => c.category === activeCat.value);
  if (search.value.trim()) {
    const k = search.value.trim().toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(k) || (c.desc || "").toLowerCase().includes(k));
  }
  return list;
});

const selectedCourse = computed(() => (selectedId.value ? courses.byId[selectedId.value] : null));

const selectedCatColor = computed(() => {
  if (!selectedCourse.value) return "var(--color-flame)";
  return courses.categories.find(c => c.id === selectedCourse.value.category)?.color || "var(--color-flame)";
});

// 根据所选课程推断强度
const suggestedEffort = computed(() => {
  if (!selectedCourse.value) return 3;
  return { hiit: 5, boxing: 4, cardio: 3, fatburn: 2, shape: 2 }[selectedCourse.value.category] || 3;
});
watch(suggestedEffort, (v) => { effort.value = v; });

const effortZones = [
  { i: 1, color: "var(--color-zone-1)", name: "Z1", desc: "恢复" },
  { i: 2, color: "var(--color-zone-2)", name: "Z2", desc: "燃脂" },
  { i: 3, color: "var(--color-zone-3)", name: "Z3", desc: "有氧" },
  { i: 4, color: "var(--color-zone-4)", name: "Z4", desc: "阈值" },
  { i: 5, color: "var(--color-zone-5)", name: "Z5", desc: "无氧" },
];

const isUpdate = computed(() => checkin.hasCheckedToday);

async function submit() {
  if (!selectedCourse.value) {
    ElMessage({ message: "请先选择一个课程", type: "warning" });
    return;
  }
  submitting.value = true;
  try {
    await checkin.checkIn({
      courseId: selectedCourse.value.id,
      category: selectedCourse.value.category,
      courseName: selectedCourse.value.name,
      duration: duration.value,
      mood: mood.value,
      effort: effort.value,
    });
    ElMessage({
      message: isUpdate.value ? "已更新今日打卡 🔥" : "打卡成功!继续坚持 💪",
      type: "success",
    });
    router.push({ name: "home" });
  } finally {
    submitting.value = false;
  }
}

function clearSelection() { selectedId.value = null; }

const durationMarks = { 5: "5", 30: "30", 60: "60", 90: "90" };
</script>

<template>
  <div class="page checkin-page">
    <div class="head-bar fade-up">
      <div>
        <div class="page-title">打卡 · 今晚打卡</div>
        <p class="head-sub mono">// {{ isUpdate ? "更新今日记录" : "新训练" }} · 共 {{ filtered.length }} 节课</p>
      </div>
      <div class="head-tag">
        <div class="tape-strip" :style="{ background: isUpdate ? 'var(--color-cyan)' : 'var(--color-acid)', color: 'var(--color-ink-0)' }">
          {{ isUpdate ? "更新记录" : "全新训练" }}
        </div>
      </div>
    </div>

    <div class="form">
      <!-- 步骤 1: 选课程 -->
      <section class="step fade-up">
        <div class="step-head">
          <div class="step-num display">01</div>
          <div class="step-info">
            <div class="step-title cn-display">选择课程</div>
            <div class="step-sub mono">挑一节课</div>
          </div>
        </div>

        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input v-model="search" class="search-input" placeholder="搜索课程名 / 描述" />
        </div>

        <div class="cat-tabs">
          <button
            class="cat-tab"
            :class="{ active: activeCat === 'all' }"
            @click="activeCat = 'all'"
          >
            <span class="cat-tab-name">全部</span>
            <span class="cat-tab-count mono">{{ courses.all.length }}</span>
          </button>
          <button
            v-for="cat in courses.categories.filter(c => c.id !== 'all')"
            :key="cat.id"
            class="cat-tab"
            :class="{ active: activeCat === cat.id }"
            :style="{ '--accent': cat.color }"
            @click="activeCat = cat.id"
          >
            <span class="cat-tab-name">{{ cat.name }}</span>
            <span class="cat-tab-count mono">{{ courses.byCategory(cat.id).length }}</span>
          </button>
        </div>

        <div class="course-grid">
          <button
            v-for="c in filtered"
            :key="c.id"
            class="course-card"
            :class="{ selected: selectedId === c.id }"
            :style="{ '--accent': courses.categories.find(x => x.id === c.category)?.color }"
            @click="selectedId = c.id"
          >
            <div class="wedge" :style="{ '--wedge-color': courses.categories.find(x => x.id === c.category)?.color }" />
            <div class="cc-cover">
              <div class="cc-letter">{{ c.name[0] }}</div>
              <div class="cc-duration mono">{{ c.duration }} 分钟</div>
            </div>
            <div class="cc-body">
              <div class="cc-name">
                {{ c.name }}
                <span v-if="c.custom" class="cc-tag">自定义</span>
              </div>
              <div class="cc-meta mono">
                <span>{{ courses.categories.find(x => x.id === c.category)?.name }}</span>
                <span>·</span>
                <span>{{ c.level }}</span>
              </div>
            </div>
            <div v-if="selectedId === c.id" class="cc-check">✓</div>
          </button>
          <div v-if="!filtered.length" class="empty muted mono">// 没有找到课程</div>
        </div>
      </section>

      <!-- 步骤 2: 时长 -->
      <section class="step fade-up-d1">
        <div class="step-head">
          <div class="step-num display">02</div>
          <div class="step-info">
            <div class="step-title cn-display">训练时长</div>
            <div class="step-sub mono">设置时长</div>
          </div>
          <div class="duration-display">
            <div class="dur-num display tabular">{{ duration }}</div>
            <div class="dur-unit mono">分钟</div>
          </div>
        </div>
        <div class="slider-wrap">
          <el-slider
            v-model="duration"
            :min="5"
            :max="90"
            :step="5"
            :marks="durationMarks"
            :show-tooltip="false"
          />
        </div>
      </section>

      <!-- 步骤 3: 自感强度 -->
      <section class="step fade-up-d2">
        <div class="step-head">
          <div class="step-num display">03</div>
          <div class="step-info">
            <div class="step-title cn-display">自感强度</div>
            <div class="step-sub mono">强度区间</div>
          </div>
          <div class="effort-readout">
            <div class="er-z mono">Z{{ effort }}</div>
            <div class="er-name mono">{{ effortZones[effort - 1].desc }}</div>
          </div>
        </div>
        <div class="effort-bar">
          <button
            v-for="z in effortZones"
            :key="z.i"
            class="effort-cell"
            :class="{ on: z.i <= effort, active: z.i === effort }"
            :style="{ '--zone-color': z.color }"
            @click="effort = z.i"
          >
            <div class="ec-num display">Z{{ z.i }}</div>
            <div class="ec-name">{{ z.desc }}</div>
            <div class="ec-bpm mono">{{ ['', '<120', '120-140', '140-160', '160-175', '175+'][z.i] }} 次/分</div>
          </button>
        </div>
        <div v-if="selectedCourse" class="suggestion mono">
          // 建议: Z{{ suggestedEffort }} · 根据课程分类推断
        </div>
      </section>

      <!-- 步骤 4: 心情 -->
      <section class="step fade-up-d3">
        <div class="step-head">
          <div class="step-num display">04</div>
          <div class="step-info">
            <div class="step-title cn-display">训练心情</div>
            <div class="step-sub mono">感觉如何</div>
          </div>
        </div>
        <div class="mood-grid">
          <button
            v-for="m in moodOptions"
            :key="m.value"
            class="mood-pill"
            :class="{ active: mood === m.value }"
            @click="mood = m.value"
          >
            <span class="mood-emoji">{{ m.emoji }}</span>
            <span class="mood-text">
              <span class="mood-label">{{ m.label }}</span>
              <span class="mood-tag mono">{{ m.value === 'great' ? '爆棚' : m.value === 'good' ? '不错' : m.value === 'ok' ? '一般' : m.value === 'tired' ? '累' : '不适' }}</span>
            </span>
            <span v-if="mood === m.value" class="mood-check">●</span>
          </button>
        </div>
      </section>

      <!-- 提交栏 -->
      <section class="step submit-section fade-up-d4">
        <div class="submit-bar">
          <button v-if="selectedCourse" class="btn-clear mono" @click="clearSelection">清除</button>
          <button
            class="btn-submit"
            :class="{ active: !!selectedCourse, updating: isUpdate }"
            :disabled="!selectedCourse"
            @click="submit"
          >
            <span v-if="submitting" class="btn-loading mono">保存中…</span>
            <span v-else class="btn-content">
              <span class="flame flame-pulse">🔥</span>
              <span class="txt">
                <span class="txt-cn">{{ isUpdate ? "更新打卡" : "完成打卡" }}</span>
                <span class="txt-en">{{ isUpdate ? "更新今日记录" : "记录本次训练" }}</span>
              </span>
              <span class="arr">→</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.checkin-page { padding-bottom: 80px; }

.head-bar {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px; flex-wrap: wrap;
}
.head-sub { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; margin: 8px 0 0; }

.form { display: flex; flex-direction: column; gap: 16px; }

.step {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 22px 24px;
  position: relative;
}
.step-head {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 18px;
}
.step-num {
  font-size: 44px;
  color: var(--color-flame);
  line-height: 1;
  text-shadow: 0 0 14px rgba(255, 46, 46, 0.3);
  letter-spacing: -0.02em;
}
.step-info { flex: 1; }
.step-title { font-size: 18px; font-weight: 900; letter-spacing: 0.04em; }
.step-sub { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.25em; margin-top: 2px; }

// 搜索
.search-wrap { position: relative; max-width: 360px; margin-bottom: 14px; }
.search-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-2);
  font-size: 16px;
}
.search-input {
  width: 100%;
  height: 40px;
  padding: 0 14px 0 38px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  color: var(--color-text-0);
  font-family: inherit;
  font-size: 14px;
  &:focus { outline: none; border-color: var(--color-flame); }
}

// 分类 tab
.cat-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.cat-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  color: var(--color-text-1);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.15s;
  &:hover { border-color: var(--accent, var(--color-flame)); color: var(--color-text-0); }
  &.active {
    background: var(--accent, var(--color-flame));
    border-color: var(--accent, var(--color-flame));
    color: #fff;
    box-shadow: 0 0 12px var(--accent, var(--color-flame));
  }
}
.cat-tab-count { font-size: 9px; letter-spacing: 0.1em; opacity: 0.7; }

// 课程网格
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.course-card {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  position: relative;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); background: var(--color-ink-3); }
  &.selected {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 30%, transparent);
  }
}
.cc-cover {
  width: 52px; height: 52px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #000));
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.cc-letter {
  font-family: var(--font-display);
  font-size: 28px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1;
}
.cc-duration {
  position: absolute; bottom: 2px; right: 4px;
  font-size: 7px;
  color: rgba(0, 0, 0, 0.7);
  font-weight: 700;
  letter-spacing: 0.1em;
}
.cc-body { flex: 1; min-width: 0; }
.cc-name {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cc-tag {
  font-size: 8px;
  padding: 1px 4px;
  background: var(--color-cyan);
  color: var(--color-ink-0);
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.cc-meta {
  display: flex; gap: 4px;
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.1em;
}
.cc-check {
  position: absolute; top: 8px; right: 8px;
  width: 18px; height: 18px;
  background: var(--accent);
  color: #000;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 0 8px var(--accent);
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 30px;
  font-size: 11px;
  letter-spacing: 0.2em;
}

// 时长
.duration-display { text-align: right; }
.dur-num {
  font-size: 40px;
  font-weight: 700;
  color: var(--color-flame);
  line-height: 1;
  text-shadow: 0 0 12px rgba(255, 46, 46, 0.4);
}
.dur-unit { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; }
.slider-wrap { padding: 0 8px 30px; }
:deep(.el-slider__runway) { background: var(--color-ink-3); height: 4px; }
:deep(.el-slider__bar) { background: linear-gradient(90deg, var(--color-flame), var(--color-pink)); height: 4px; }
:deep(.el-slider__button) {
  width: 18px; height: 18px;
  background: var(--color-flame);
  border: 2px solid var(--color-text-0);
  box-shadow: 0 0 12px var(--color-flame);
}
:deep(.el-slider__marks-text) { font-size: 10px; color: var(--color-text-2); }

// 自感强度
.effort-readout { text-align: right; }
.er-z {
  font-size: 28px;
  color: var(--color-flame);
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 0 10px rgba(255, 46, 46, 0.3);
}
.er-name { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; margin-top: 2px; }

.effort-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 4px;
}
@media (max-width: 768px) { .effort-bar { grid-template-columns: repeat(2, 1fr); } }
.effort-cell {
  padding: 14px 10px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  &::before {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 3px;
    background: var(--zone-color);
    opacity: 0.3;
    transition: all 0.2s;
  }
  &:hover { border-color: var(--zone-color); }
  &.on { border-color: var(--zone-color); &::before { opacity: 0.5; } }
  &.active {
    border-color: var(--zone-color);
    background: color-mix(in srgb, var(--zone-color) 12%, transparent);
    box-shadow: 0 0 16px color-mix(in srgb, var(--zone-color) 30%, transparent);
    &::before { height: 100%; opacity: 0.15; }
  }
}
.ec-num {
  font-size: 24px;
  color: var(--zone-color);
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow: 0 0 10px color-mix(in srgb, var(--zone-color) 30%, transparent);
}
.ec-name { font-size: 12px; font-weight: 700; margin-top: 4px; letter-spacing: 0.05em; }
.ec-bpm { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.15em; margin-top: 2px; }
.suggestion { font-size: 10px; color: var(--color-text-2); margin-top: 10px; letter-spacing: 0.2em; }

// 心情
.mood-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
@media (max-width: 768px) { .mood-grid { grid-template-columns: repeat(2, 1fr); } }
.mood-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 12px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.15s;
  &:hover { border-color: var(--color-flame); }
  &.active {
    border-color: var(--color-flame);
    background: rgba(255, 46, 46, 0.08);
    box-shadow: 0 0 12px rgba(255, 46, 46, 0.3);
  }
}
.mood-emoji { font-size: 22px; }
.mood-text { flex: 1; }
.mood-label { font-size: 12px; font-weight: 600; }
.mood-tag {
  font-size: 8px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
  margin-top: 2px;
}
.mood-check {
  color: var(--color-flame);
  font-size: 8px;
  animation: neon-blink 1.5s ease-in-out infinite;
}

// 提交
.submit-bar {
  display: flex; gap: 10px;
  margin-top: 8px;
}
.btn-clear {
  padding: 0 24px;
  height: 60px;
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-text-2);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: var(--color-text-0); border-color: var(--color-text-1); }
}
.btn-submit {
  flex: 1;
  height: 60px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: inherit;
  color: var(--color-text-2);
  transition: all 0.2s;
  &.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 40%, transparent);
    &:hover { transform: translateY(-2px); }
  }
  &.updating.active {
    background: var(--color-cyan);
    border-color: var(--color-cyan);
    color: #fff;
    box-shadow: 0 8px 24px rgba(0, 229, 255, 0.3);
  }
}
.btn-content, .btn-loading {
  display: flex; align-items: center; gap: 14px;
  width: 100%; height: 100%;
  padding: 0 24px;
  justify-content: space-between;
}
.flame { font-size: 26px; }
.txt { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; flex: 1; min-width: 0; }
.txt-cn { font-size: 18px; font-weight: 900; letter-spacing: 0.05em; }
.txt-en { font-size: 10px; letter-spacing: 0.2em; opacity: 0.75; font-weight: 500; }
.arr { font-size: 24px; flex-shrink: 0; line-height: 1; }
.btn-loading { letter-spacing: 0.15em; font-size: 12px; justify-content: center; }
</style>