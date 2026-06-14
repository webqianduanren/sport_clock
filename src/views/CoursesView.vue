<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCoursesStore } from "@/stores/courses.js";
import { categories } from "@/data/seedCourses.js";

const route = useRoute();
const router = useRouter();
const store = useCoursesStore();

const activeCat = ref(route.query.cat || "all");
const search = ref("");
const dialogVisible = ref(false);
const form = ref({
  name: "",
  category: "shape",
  duration: 20,
  level: "中级",
  desc: "",
  videoUrl: "",
});

onMounted(async () => {
  if (!store.loaded) await store.load();
});

watch(() => route.query.cat, (v) => {
  if (v) activeCat.value = v;
});

const filtered = computed(() => {
  let list = store.all;
  if (activeCat.value !== "all") list = list.filter((c) => c.category === activeCat.value);
  if (search.value.trim()) {
    const k = search.value.trim().toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(k));
  }
  return list;
});

// 把 5 大类(去掉 all)做横向 lane
const laneCats = computed(() => categories.filter(c => c.id !== "all"));
const lanesData = computed(() => {
  return laneCats.value.map((cat) => {
    const list = store.all.filter(c => c.category === cat.id);
    return { ...cat, list };
  });
});
const featured = computed(() => filtered.value[0] || store.all[0]);
const rest = computed(() => filtered.value.slice(1));

function play(course) {
  router.push({ name: "course-play", params: { id: course.id } });
}

function openAdd() {
  form.value = { name: "", category: "shape", duration: 20, level: "中级", desc: "", videoUrl: "" };
  dialogVisible.value = true;
}

function normalizeUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const bvMatch = trimmed.match(/^BV([a-zA-Z0-9]+)/);
  if (bvMatch) return `https://player.bilibili.com/player.html?bvid=BV${bvMatch[1]}&autoplay=0&high_quality=1&danmaku=0`;
  const avMatch = trimmed.match(/^av(\d+)/i);
  if (avMatch) return `https://player.bilibili.com/player.html?aid=${avMatch[1]}&autoplay=0&high_quality=1&danmaku=0`;
  return trimmed;
}

async function submitAdd() {
  if (!form.value.name.trim()) {
    ElMessage({ message: "请填写课程名", type: "warning" });
    return;
  }
  if (!form.value.videoUrl.trim()) {
    ElMessage({ message: "请填写视频链接", type: "warning" });
    return;
  }
  await store.addCustom({ ...form.value, videoUrl: normalizeUrl(form.value.videoUrl) });
  dialogVisible.value = false;
  ElMessage({ message: "添加成功", type: "success" });
}

async function removeCourse(course) {
  if (!course.custom) return;
  try {
    await ElMessageBox.confirm(`确定删除「${course.name}」?`, "提示", { type: "warning" });
    await store.removeCustom(course.id);
    ElMessage({ message: "已删除", type: "success" });
  } catch {}
}
</script>

<template>
  <div class="page cv">
    <div class="head">
      <div>
        <div class="page-title">课程库</div>
        <p class="head-sub mono">// 共 {{ filtered.length }} 节课 · 5 条训练跑道</p>
      </div>
      <button class="btn-add" @click="openAdd">
        <span class="add-plus">+</span>
        <span class="add-text">
          <span class="add-cn">自定义课程</span>
          <span class="add-en mono">自己添加</span>
        </span>
      </button>
    </div>

    <div class="search-row">
      <div class="search-wrap">
        <span class="search-icon">⌕</span>
        <input v-model="search" class="search-input" placeholder="搜索课程名" />
      </div>
    </div>

    <div class="cat-tabs">
      <button
        class="cat-tab"
        :class="{ active: activeCat === 'all' }"
        @click="activeCat = 'all'"
      >
        <span class="cat-tab-name">全部</span>
        <span class="cat-tab-count mono">{{ store.all.length }}</span>
      </button>
      <button
        v-for="cat in categories.filter(c => c.id !== 'all')"
        :key="cat.id"
        class="cat-tab"
        :class="{ active: activeCat === cat.id }"
        :style="{ '--accent': cat.color }"
        @click="activeCat = cat.id"
      >
        <span class="cat-tab-name">{{ cat.name }}</span>
        <span class="cat-tab-count mono">{{ store.byCategory(cat.id).length }}</span>
      </button>
    </div>

    <!-- 网格视图 -->
    <div v-if="activeCat !== 'all' || search.trim()" class="grid-mode">
      <article
        v-for="c in filtered"
        :key="c.id"
        class="c-card"
        :style="{ '--accent': categories.find(x => x.id === c.category)?.color }"
        @click="play(c)"
      >
        <div class="wedge" :style="{ '--wedge-color': categories.find(x => x.id === c.category)?.color }" />
        <div class="c-cover">
          <div class="c-glow" />
          <div class="c-letter">{{ c.name[0] }}</div>
          <div class="c-duration mono">{{ c.duration }} 分钟</div>
          <div v-if="c.custom" class="c-tag">自定义</div>
          <div class="c-level mono">{{ c.level }}</div>
        </div>
        <div class="c-body">
          <div class="c-cat">
            <span class="cat-bar" :style="{ '--cat-color': categories.find(x => x.id === c.category)?.color }" />
            <span class="mono">{{ categories.find(x => x.id === c.category)?.name }}</span>
          </div>
          <h3 class="c-name">{{ c.name }}</h3>
          <p class="c-desc">{{ c.desc }}</p>
        </div>
        <div class="c-foot">
          <button class="c-play mono">▶ 开练</button>
          <button v-if="c.custom" class="c-del" @click.stop="removeCourse(c)">✕</button>
        </div>
      </article>
      <div v-if="!filtered.length" class="empty muted mono">// 没有找到课程</div>
    </div>

    <!-- Lane 模式:5 大类横向跑道 -->
    <div v-else class="lane-mode">
      <article
        v-if="featured"
        class="featured"
        :style="{ '--accent': categories.find(x => x.id === featured.category)?.color }"
        @click="play(featured)"
      >
        <div class="wedge" :style="{ '--wedge-color': categories.find(x => x.id === featured.category)?.color }" />
        <div class="feat-tag tape-strip">精选 · 今晚推荐</div>
        <div class="feat-body">
          <div class="feat-cover">
            <div class="c-glow" />
            <div class="feat-letter">{{ featured.name[0] }}</div>
            <div class="feat-cat-tag mono">{{ categories.find(x => x.id === featured.category)?.name }}</div>
          </div>
          <div class="feat-info">
            <div class="info-cat">
              <span class="cat-bar" :style="{ '--cat-color': categories.find(x => x.id === featured.category)?.color }" />
              <span class="mono">{{ categories.find(x => x.id === featured.category)?.name }} · {{ featured.level }}</span>
            </div>
            <h2 class="feat-title">{{ featured.name }}</h2>
            <p class="feat-desc">{{ featured.desc }}</p>
            <div class="feat-meta">
              <div class="meta-item">
                <div class="mi-label mono">时长</div>
                <div class="mi-val display">{{ featured.duration }}<span class="mi-unit">分</span></div>
              </div>
              <div class="meta-sep" />
              <div class="meta-item">
                <div class="mi-label mono">强度</div>
                <div class="mi-val display">{{ featured.level }}</div>
              </div>
              <div class="meta-sep" />
              <div class="meta-item">
                <div class="mi-label mono">分类</div>
                <div class="mi-val display">{{ categories.find(x => x.id === featured.category)?.name }}</div>
              </div>
            </div>
            <button class="feat-go mono">▶ 开始训练</button>
          </div>
        </div>
      </article>

      <!-- 5 条 lane -->
      <div
        v-for="(lane, i) in lanesData"
        :key="lane.id"
        class="lane"
        :data-lane="'L' + String(i + 1).padStart(2, '0')"
        :style="{ '--accent': lane.color }"
      >
        <div class="lane-head">
          <div class="lane-name">
            <span class="cat-bar" :style="{ '--cat-color': lane.color }" />
            <span class="cn-display">{{ lane.name }}</span>
          </div>
          <div class="lane-count mono">{{ lane.list.length }} 节课</div>
        </div>
        <div class="lane-track">
          <article
            v-for="c in lane.list"
            :key="c.id"
            class="lane-card"
            :style="{ '--accent': lane.color }"
            @click="play(c)"
          >
            <div class="lc-cover">
              <div class="c-glow" />
              <div class="lc-letter">{{ c.name[0] }}</div>
              <div v-if="c.custom" class="c-tag">自定义</div>
            </div>
            <div class="lc-body">
              <div class="lc-name">{{ c.name }}</div>
              <div class="lc-meta mono">
                <span>{{ c.duration }} 分钟</span>
                <span>·</span>
                <span>{{ c.level }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="添加自定义课程"
      width="480px"
      :show-close="false"
      class="dlg-dark"
    >
      <div class="form-row">
        <label class="lbl mono">// 课程名</label>
        <input v-model="form.name" class="ipt" placeholder="课程名" />
      </div>
      <div class="form-grid">
        <div>
          <label class="lbl mono">// 分类</label>
          <select v-model="form.category" class="ipt">
            <option v-for="c in categories.filter(c => c.id !== 'all')" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="lbl mono">// 强度</label>
          <select v-model="form.level" class="ipt">
            <option>初级</option>
            <option>中级</option>
            <option>高级</option>
          </select>
        </div>
        <div>
          <label class="lbl mono">// 时长(分钟)</label>
          <input v-model.number="form.duration" type="number" min="5" max="180" class="ipt" />
        </div>
      </div>
      <div class="form-row">
        <label class="lbl mono">// 视频链接</label>
        <input v-model="form.videoUrl" class="ipt" placeholder="BV 号或完整链接" />
      </div>
      <div class="form-row">
        <label class="lbl mono">// 描述</label>
        <textarea v-model="form.desc" class="ipt" rows="2" placeholder="课程描述(可选)" />
      </div>
      <template #footer>
        <button class="dlg-cancel mono" @click="dialogVisible = false">取消</button>
        <button class="dlg-confirm mono" @click="submitAdd">确认</button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.cv { padding-bottom: 60px; }

.head {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 18px; gap: 12px; flex-wrap: wrap;
}
.head-sub { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; margin: 8px 0 0; }

.btn-add {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--color-flame);
  color: var(--color-flame);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  &:hover { background: var(--color-flame); color: #fff; }
}
.add-plus { font-size: 18px; line-height: 1; font-weight: 700; }
.add-text { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.add-cn { font-size: 13px; font-weight: 700; }
.add-en { font-size: 9px; letter-spacing: 0.2em; opacity: 0.7; }

.search-row { margin-bottom: 14px; }
.search-wrap { position: relative; max-width: 360px; }
.search-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-2);
  font-size: 16px;
}
.search-input {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 38px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  color: var(--color-text-0);
  font-family: inherit;
  font-size: 14px;
  &:focus { outline: none; border-color: var(--color-flame); }
}

.cat-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 22px; }
.cat-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  background: var(--color-ink-2);
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

// === 网格模式 ===
.grid-mode {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.c-card {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; flex-direction: column;
  position: relative;
  &:hover {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--accent);
    .c-play { background: var(--accent); color: #000; }
  }
}
.c-cover {
  height: 130px;
  position: relative;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, #000));
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.c-glow {
  position: absolute; inset: -30%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent 60%);
  animation: flame-pulse 3.5s ease-in-out infinite;
}
.c-letter {
  font-family: var(--font-display);
  font-size: 72px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1;
  z-index: 2;
}
.c-duration {
  position: absolute; top: 10px; left: 10px;
  font-size: 9px;
  color: rgba(0, 0, 0, 0.7);
  background: rgba(255, 255, 255, 0.9);
  padding: 3px 8px;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.15em;
  z-index: 2;
}
.c-level {
  position: absolute; top: 10px; right: 10px;
  font-size: 9px;
  color: rgba(0, 0, 0, 0.7);
  background: rgba(255, 255, 255, 0.9);
  padding: 3px 8px;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.15em;
  z-index: 2;
}
.c-tag {
  position: absolute; bottom: 10px; right: 10px;
  font-size: 8px;
  padding: 3px 6px;
  background: var(--color-cyan);
  color: #000;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.15em;
  z-index: 2;
}
.c-body { padding: 14px 16px; flex: 1; }
.c-cat { display: flex; align-items: center; gap: 4px; font-size: 9px; color: var(--color-text-2); letter-spacing: 0.2em; margin-bottom: 6px; }
.c-name { font-size: 15px; font-weight: 700; margin: 0 0 6px; line-height: 1.3; }
.c-desc { font-size: 12px; color: var(--color-text-1); margin: 0; line-height: 1.5; }
.c-foot {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-line);
}
.c-play {
  flex: 1; padding: 8px;
  background: var(--color-ink-3);
  border: none;
  color: var(--color-text-0);
  border-radius: 4px;
  font-size: 11px; letter-spacing: 0.2em; font-weight: 700;
  cursor: pointer; transition: all 0.15s;
}
.c-del {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--color-line);
  color: var(--color-text-2);
  border-radius: 4px;
  cursor: pointer;
  &:hover { color: var(--color-flame); border-color: var(--color-flame); }
}
.empty { grid-column: 1 / -1; text-align: center; padding: 40px; font-size: 11px; letter-spacing: 0.25em; color: var(--color-text-2); }

// === Lane 模式 ===
.lane-mode { display: flex; flex-direction: column; gap: 28px; }

.featured {
  background: linear-gradient(135deg, rgba(255, 46, 46, 0.04), var(--color-ink-2));
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 24px 28px 28px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  overflow: hidden;
  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }
  &::before {
    content: "";
    position: absolute;
    right: -100px; top: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, var(--accent), transparent 60%);
    opacity: 0.06;
    pointer-events: none;
  }
}
.feat-tag { margin-bottom: 18px; }
.feat-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 28px;
  align-items: center;
  position: relative;
  z-index: 1;
}
@media (max-width: 768px) { .feat-body { grid-template-columns: 1fr; } }

.feat-cover {
  position: relative;
  aspect-ratio: 1.4;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 35%, #000));
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.feat-letter {
  font-family: var(--font-display);
  font-size: 200px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1;
  z-index: 2;
}
.feat-cat-tag {
  position: absolute; top: 14px; left: 14px;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.7);
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.2em;
  z-index: 2;
}

.feat-info { display: flex; flex-direction: column; gap: 12px; }
.feat-title {
  font-size: 32px;
  font-weight: 900;
  margin: 0;
  line-height: 1.15;
  letter-spacing: 0.02em;
}
.feat-desc { font-size: 14px; color: var(--color-text-1); line-height: 1.6; margin: 0; }
.feat-meta {
  display: flex; align-items: stretch; gap: 16px;
  padding: 16px 0;
  border-top: 1px dashed var(--color-line);
  border-bottom: 1px dashed var(--color-line);
  margin: 4px 0;
}
.meta-item { flex: 1; }
.mi-label { font-size: 9px; color: var(--color-text-2); letter-spacing: 0.2em; margin-bottom: 4px; }
.mi-val {
  font-size: 22px; color: var(--color-text-0); line-height: 1;
  letter-spacing: -0.02em;
  .mi-unit { font-size: 11px; color: var(--color-text-2); margin-left: 2px; }
}
.meta-sep { width: 1px; background: var(--color-line); }
.feat-go {
  align-self: flex-start;
  padding: 12px 24px;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  letter-spacing: 0.25em;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 30%, transparent);
  &:hover { transform: translateY(-2px); }
}

// === Lane ===
.lane {
  position: relative;
  padding-left: 70px;
  &::before {
    content: attr(data-lane);
    position: absolute;
    left: 0; top: 4px;
    font-family: var(--font-display);
    font-size: 44px;
    color: var(--accent);
    letter-spacing: 0.04em;
    line-height: 1;
    text-shadow: 0 0 12px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  &::after {
    content: "";
    position: absolute;
    left: 60px; top: 8px; bottom: 8px;
    width: 2px;
    background: linear-gradient(180deg, transparent, var(--accent), transparent);
    opacity: 0.5;
  }
}
.lane-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-line);
}
.lane-name {
  display: flex; align-items: center; gap: 8px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.05em;
}
.lane-count { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; }

.lane-track {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.lane-card {
  display: flex; align-items: center; gap: 12px;
  padding: 10px;
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    background: var(--color-ink-3);
    transform: translateX(4px);
  }
}
.lc-cover {
  width: 56px; height: 56px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 35%, #000));
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.lc-letter {
  font-family: var(--font-display);
  font-size: 32px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1;
  z-index: 2;
}
.lc-body { flex: 1; min-width: 0; }
.lc-name {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lc-meta { display: flex; gap: 4px; font-size: 9px; color: var(--color-text-2); letter-spacing: 0.15em; }

// === Dialog 表单 ===
.form-row { margin-bottom: 14px; }
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
  margin-bottom: 14px;
}
.lbl { display: block; font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; margin-bottom: 6px; }
.ipt {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  background: var(--color-ink-0);
  border: 1px solid var(--color-line);
  border-radius: 4px;
  color: var(--color-text-0);
  font-family: inherit;
  font-size: 13px;
  &:focus { outline: none; border-color: var(--color-flame); }
}
textarea.ipt { height: auto; padding: 10px 12px; resize: vertical; }
select.ipt { cursor: pointer; }
.dlg-cancel, .dlg-confirm {
  padding: 8px 18px;
  border-radius: 4px;
  font-size: 11px;
  letter-spacing: 0.2em;
  cursor: pointer;
  border: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-text-1);
}
.dlg-confirm {
  background: var(--color-flame);
  border-color: var(--color-flame);
  color: #fff;
  margin-left: 8px;
  &:hover { background: var(--color-pink); border-color: var(--color-pink); }
}
:deep(.el-dialog) { background: var(--color-ink-2); border: 1px solid var(--color-line); }
:deep(.el-dialog__title) { color: var(--color-text-0); font-family: var(--font-display); letter-spacing: 0.05em; }
:deep(.el-dialog__body) { padding: 18px 24px; }
:deep(.el-dialog__footer) { padding: 12px 24px 18px; }
</style>