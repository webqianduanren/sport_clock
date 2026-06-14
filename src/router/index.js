import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", name: "home", component: () => import("@/views/HomeView.vue"), meta: { title: "今日" } },
  { path: "/checkin", name: "checkin", component: () => import("@/views/CheckinView.vue"), meta: { title: "打卡" } },
  { path: "/checkin/:courseId", name: "checkin-preset", component: () => import("@/views/CheckinView.vue"), meta: { title: "打卡" } },
  { path: "/courses", name: "courses", component: () => import("@/views/CoursesView.vue"), meta: { title: "课程库" } },
  { path: "/courses/:id", name: "course-play", component: () => import("@/views/CoursePlayView.vue"), meta: { title: "跟练" } },
  { path: "/stats", name: "stats", component: () => import("@/views/StatsView.vue"), meta: { title: "统计" } },
  { path: "/settings", name: "settings", component: () => import("@/views/SettingsView.vue"), meta: { title: "设置" } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} · 运动打卡`;
});

export default router;
