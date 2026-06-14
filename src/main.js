import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import App from "./App.vue";
import router from "./router";

import "@/styles/global.scss";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: zhCn });

// 通知仅在用户开启后才执行定时任务
import { useNotify } from "@/composables/useNotify.js";
import { useCheckinStore } from "@/stores/checkin.js";

(async function bootstrap() {
  const checkin = useCheckinStore();
  await checkin.load();
  app.mount("#app");

  // 启动通知定时器
  const notify = useNotify();
  notify.start(() => checkin.hasCheckedToday);
})();
