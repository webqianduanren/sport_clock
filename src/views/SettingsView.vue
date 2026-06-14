<script setup>
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useNotify } from "@/composables/useNotify.js";
import { useCheckinStore } from "@/stores/checkin.js";
import { useCoursesStore } from "@/stores/courses.js";
import { clearAll } from "@/db/index.js";

const notify = useNotify();
const checkin = useCheckinStore();
const courses = useCoursesStore();

const form = ref({ ...notify.settings.value });
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const supported = "Notification" in window;

async function toggleNotify(val) {
  if (val) {
    if (!supported) {
      ElMessage({ message: "当前浏览器不支持通知", type: "warning" });
      form.value.enabled = false;
      notify.update({ enabled: false });
      return;
    }
    const p = await notify.ensurePermission();
    if (p !== "granted") {
      ElMessage({ message: "未获得通知权限,请在浏览器设置中允许", type: "warning" });
      form.value.enabled = false;
      notify.update({ enabled: false });
      return;
    }
  }
  notify.update({ enabled: val });
  if (val) {
    notify.start(() => checkin.hasCheckedToday);
    ElMessage({ message: "通知已开启,到点会提醒你打卡", type: "success" });
  } else {
    notify.stop();
  }
}

function updateTime() {
  notify.update({ hour: form.value.hour, minute: form.value.minute });
  if (form.value.enabled) {
    notify.stop();
    notify.start(() => checkin.hasCheckedToday);
    ElMessage({ message: `已设置每日 ${String(form.value.hour).padStart(2, "0")}:${String(form.value.minute).padStart(2, "0")} 提醒`, type: "success" });
  }
}

async function clearData() {
  try {
    await ElMessageBox.confirm("将删除所有打卡记录和自定义课程,此操作不可恢复,继续?", "危险操作", { type: "error" });
    await clearAll();
    await checkin.reset();
    await courses.load();
    ElMessage({ message: "已清空数据", type: "success" });
  } catch {}
}

async function mockCheckin(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().slice(0, 10);
  await checkin.checkIn({
    courseId: "hiit-01",
    category: "hiit",
    courseName: `测试打卡 - ${daysAgo} 天前`,
    duration: 20,
    mood: "good",
    date: dateStr,
  });
  ElMessage({ message: `已模拟 ${daysAgo} 天前打卡`, type: "success" });
}

const permText = computed(() => {
  if (!supported) return { label: "不支持", cls: "不支持" };
  switch (notify.permission.value) {
    case "granted": return { label: "已授权", cls: "granted" };
    case "denied": return { label: "已拒绝", cls: "denied" };
    default: return { label: "待授权", cls: "pending" };
  }
});
</script>

<template>
  <div class="page settings-page">
    <h2 class="page-title">设置</h2>

    <!-- 通知 -->
    <section class="block fade-up">
      <div class="block-head">
        <div>
          <div class="block-tag mono">// 通知</div>
          <div class="block-title cn-display">打卡提醒</div>
        </div>
        <div class="block-meta">
          <span class="perm mono" :class="permText.cls">{{ permText.label }}</span>
        </div>
      </div>

      <div class="setting-row">
        <div class="row-info">
          <div class="row-title">启用浏览器通知</div>
          <div class="row-sub">到达设定时间且今日未打卡时,弹出系统通知</div>
        </div>
        <el-switch v-model="form.enabled" :disabled="!supported" @change="toggleNotify" />
      </div>

      <div class="setting-row">
        <div class="row-info">
          <div class="row-title">提醒时间</div>
          <div class="row-sub">每日定时触发,仅在未打卡时弹通知</div>
        </div>
        <div class="time-picker">
          <el-input-number v-model="form.hour" :min="0" :max="23" :step="1" size="small" controls-position="right" />
          <span class="time-colon">:</span>
          <el-input-number v-model="form.minute" :min="0" :max="59" :step="5" size="small" controls-position="right" />
          <el-button size="small" type="primary" @click="updateTime">保存</el-button>
        </div>
      </div>

      <div v-if="isIOS" class="tip mono">// iOS 后台通知支持有限,保持页面在前台时使用</div>
    </section>

    <!-- 自定义课程管理 -->
    <section class="block fade-up-d2">
      <div class="block-head">
        <div>
          <div class="block-tag mono">// 自定义课程</div>
          <div class="block-title cn-display">自定义课程</div>
        </div>
        <div class="block-count mono">{{ courses.customCourses.length }} 项</div>
      </div>
      <div v-if="!courses.customCourses.length" class="empty mono">// 还没有自定义课程,去课程库添加吧</div>
      <div v-else class="custom-list">
        <div v-for="c in courses.customCourses" :key="c.id" class="custom-item">
          <div class="ci-cover" :style="{ '--accent': courses.categories.find(x => x.id === c.category)?.color }">
            <span class="ci-letter">{{ c.name[0] }}</span>
          </div>
          <div class="ci-info">
            <div class="ci-name">{{ c.name }}</div>
            <div class="ci-meta mono">
              <span>{{ courses.categories.find(x => x.id === c.category)?.name }}</span>
              <span>·</span>
              <span>{{ c.duration }} 分</span>
              <span>·</span>
              <span>{{ c.level }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 测试工具 -->
    <section class="block fade-up-d3">
      <div class="block-head">
        <div>
          <div class="block-tag mono">// 测试工具</div>
          <div class="block-title cn-display">测试工具</div>
        </div>
      </div>
      <div class="row-sub muted" style="margin-bottom: 14px;">仅用于本地验证打卡逻辑,正式使用请忽略</div>
      <div class="mock-row">
        <el-button @click="mockCheckin(0)">模拟今日打卡</el-button>
        <el-button @click="mockCheckin(1)">模拟昨天打卡</el-button>
        <el-button @click="mockCheckin(2)">模拟前天打卡</el-button>
      </div>
    </section>

    <!-- 危险区 -->
    <section class="block danger fade-up-d4">
      <div class="block-head">
        <div>
          <div class="block-tag mono danger-tag">// 危险操作</div>
          <div class="block-title cn-display">数据管理</div>
        </div>
      </div>
      <div class="row-sub muted" style="margin-bottom: 14px;">清空所有本地数据(打卡记录 + 自定义课程),种子课程会自动恢复</div>
      <el-button class="btn-danger" @click="clearData">⚠ 清空所有数据</el-button>
    </section>

    <div class="footer mono">
      <p>运动打卡 · v1.0.0</p>
      <p>// 完全本地 · 零数据上报</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-page { padding-bottom: 60px; }

.block {
  background: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius);
  padding: 22px 24px;
  margin-bottom: 14px;
  &.danger { border-color: rgba(255, 46, 46, 0.3); }
}

.block-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
.block-tag {
  font-size: 10px;
  color: var(--color-text-2);
  letter-spacing: 0.2em;
}
.danger-tag { color: var(--color-flame); }
.block-title {
  font-size: 20px;
  font-weight: 900;
  margin-top: 4px;
  letter-spacing: 0.04em;
}
.block-meta, .block-count { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.2em; }
.perm {
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 9px;
  letter-spacing: 0.2em;
  background: var(--color-ink-3);
  color: var(--color-text-2);
  &.granted { background: rgba(0, 230, 118, 0.15); color: var(--color-lime); }
  &.denied { background: rgba(255, 46, 46, 0.15); color: var(--color-flame); }
}

.setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0;
  border-top: 1px solid var(--color-line);
  &:first-of-type { border-top: none; padding-top: 0; }
  .row-title { font-size: 14px; font-weight: 600; }
  .row-sub { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
}

.time-picker { display: flex; align-items: center; gap: 8px; }
.time-colon { font-size: 18px; font-weight: 700; color: var(--color-flame); }

.tip { font-size: 11px; color: var(--color-text-2); margin-top: 12px; letter-spacing: 0.1em; }

// 自定义课程
.custom-list { display: flex; flex-direction: column; gap: 6px; }
.custom-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px;
  background: var(--color-ink-0);
  border-radius: var(--radius-sm);
}
.ci-cover {
  width: 40px; height: 40px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 40%, #000));
  flex-shrink: 0;
}
.ci-letter { font-family: var(--font-display); font-size: 22px; color: rgba(0, 0, 0, 0.7); }
.ci-name { font-size: 13px; font-weight: 600; }
.ci-meta { font-size: 10px; color: var(--color-text-2); letter-spacing: 0.15em; margin-top: 2px; display: flex; gap: 4px; }

.empty { padding: 24px; text-align: center; font-size: 11px; letter-spacing: 0.2em; color: var(--color-text-2); }

.mock-row { display: flex; gap: 10px; flex-wrap: wrap; }

.btn-danger {
  background: transparent !important;
  color: var(--color-flame) !important;
  border: 1px solid var(--color-flame) !important;
  font-family: var(--font-mono) !important;
  letter-spacing: 0.2em !important;
  font-size: 11px !important;
  &:hover {
    background: var(--color-flame) !important;
    color: #fff !important;
  }
}

.footer {
  text-align: center;
  margin-top: 30px;
  padding: 20px;
  font-size: 10px;
  color: var(--color-text-3);
  letter-spacing: 0.25em;
  p { margin: 4px 0; }
}

:deep(.el-button--primary) { background: var(--color-flame); border-color: var(--color-flame); }
:deep(.el-button) { background: var(--color-ink-3); border-color: var(--color-line); color: var(--color-text-0); }
:deep(.el-button:hover) { background: var(--color-ink-1); border-color: var(--color-text-2); color: var(--color-text-0); }
:deep(.el-switch.is-checked .el-switch__core) { background: var(--color-flame); border-color: var(--color-flame); }
:deep(.el-radio__input.is-checked + .el-radio__label) { color: var(--color-flame); }
:deep(.el-radio__input.is-checked .el-radio__inner) { background: var(--color-flame); border-color: var(--color-flame); }
:deep(.el-input-number .el-input__wrapper) { background: var(--color-ink-0); }
</style>
