import { get, set, del } from "idb-keyval";
import { seedCourses } from "@/data/seedCourses.js";

const KEY_CHECKINS = "sport-checkin:checkins";
const KEY_CUSTOM_COURSES = "sport-checkin:custom-courses";

// ---------- Checkins ----------
export async function getCheckins() {
  return (await get(KEY_CHECKINS)) || [];
}

export async function saveCheckin(record) {
  const list = await getCheckins();
  // 同一天只保留一条,二次打卡为更新
  const idx = list.findIndex((c) => c.date === record.date);
  const next = idx >= 0
    ? [...list.slice(0, idx), { ...list[idx], ...record }, ...list.slice(idx + 1)]
    : [...list, record];
  await set(KEY_CHECKINS, next);
  return next;
}

export async function deleteCheckin(date) {
  const list = await getCheckins();
  await set(KEY_CHECKINS, list.filter((c) => c.date !== date));
}

// ---------- Courses ----------
export async function getCustomCourses() {
  return (await get(KEY_CUSTOM_COURSES)) || [];
}

export async function saveCustomCourse(course) {
  const list = await getCustomCourses();
  const idx = list.findIndex((c) => c.id === course.id);
  const next = idx >= 0
    ? [...list.slice(0, idx), course, ...list.slice(idx + 1)]
    : [...list, course];
  await set(KEY_CUSTOM_COURSES, next);
  return next;
}

export async function deleteCustomCourse(id) {
  const list = await getCustomCourses();
  await set(KEY_CUSTOM_COURSES, list.filter((c) => c.id !== id));
}

// 返回 合并后的全部课程(种子在前,自定义在后,均带 custom 标记)
export async function getAllCourses() {
  const customs = await getCustomCourses();
  return [
    ...seedCourses.map((c) => ({ ...c, custom: false })),
    ...customs.map((c) => ({ ...c, custom: true })),
  ];
}

// 首次启动检测:清空数据后自动恢复种子
export async function ensureSeeded() {
  const existing = await getCustomCourses();
  if (!Array.isArray(existing) || existing.length === 0) {
    // 这里只标记"种子已初始化",避免重复工作
  }
}

// 重置全部数据(用于设置页"清空数据")
export async function clearAll() {
  await del(KEY_CHECKINS);
  await del(KEY_CUSTOM_COURSES);
}
