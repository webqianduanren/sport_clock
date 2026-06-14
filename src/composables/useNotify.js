import { ref } from "vue";
import { today } from "@/utils/date.js";

const SETTINGS_KEY = "sport-checkin:notify-settings";

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { enabled: false, hour: 21, minute: 0 }; }
  catch { return { enabled: false, hour: 21, minute: 0 }; }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const settings = ref(loadSettings());
const permission = ref(typeof Notification !== "undefined" ? Notification.permission : "denied");

let timer = null;
let lastFiredDate = null;

function ensurePermission() {
  if (typeof Notification === "undefined") return Promise.resolve("denied");
  if (Notification.permission === "granted") {
    permission.value = "granted";
    return Promise.resolve("granted");
  }
  return Notification.requestPermission().then((p) => {
    permission.value = p;
    return p;
  });
}

function fire(hasCheckedToday) {
  if (hasCheckedToday) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("今晚还没打卡哦", {
      body: "点开跟练 30 分钟,运动打卡系统陪你变强",
      tag: "sport-checkin-reminder",
    });
    n.onclick = () => {
      window.focus();
      window.location.hash = "#/";
    };
  } catch (e) {
    console.warn("通知触发失败", e);
  }
}

function tick(hasCheckedToday) {
  const now = new Date();
  if (
    now.getHours() === settings.value.hour &&
    now.getMinutes() === settings.value.minute
  ) {
    if (lastFiredDate !== today()) {
      lastFiredDate = today();
      fire(hasCheckedToday);
    }
  }
}

export function useNotify() {
  function start(getHasChecked) {
    stop();
    if (!settings.value.enabled) return;
    timer = setInterval(() => tick(getHasChecked()), 30 * 1000);
    // 启动时也立刻检查一次(避免用户首次开启立刻被触发)
    tick(getHasChecked());
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function update(patch) {
    settings.value = { ...settings.value, ...patch };
    saveSettings(settings.value);
  }
  return {
    settings,
    permission,
    ensurePermission,
    start,
    stop,
    update,
  };
}
