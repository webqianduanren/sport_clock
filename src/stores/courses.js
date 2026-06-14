import { defineStore } from "pinia";
import {
  getAllCourses,
  getCustomCourses,
  saveCustomCourse,
  deleteCustomCourse,
} from "@/db/index.js";
import { categories } from "@/data/seedCourses.js";

function genId() {
  return "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useCoursesStore = defineStore("courses", {
  state: () => ({
    list: [],
    categories,
    loaded: false,
  }),

  getters: {
    all(state) {
      return state.list;
    },
    byId(state) {
      const map = {};
      state.list.forEach((c) => (map[c.id] = c));
      return map;
    },
    byCategory(state) {
      return (cat) => cat === "all" || !cat
        ? state.list
        : state.list.filter((c) => c.category === cat);
    },
    customCourses(state) {
      return state.list.filter((c) => c.custom);
    },
  },

  actions: {
    async load() {
      this.list = await getAllCourses();
      this.loaded = true;
    },
    async addCustom(payload) {
      const course = {
        id: genId(),
        name: payload.name,
        category: payload.category || "shape",
        duration: Number(payload.duration) || 20,
        level: payload.level || "中级",
        desc: payload.desc || "",
        videoUrl: payload.videoUrl,
        custom: true,
      };
      await saveCustomCourse(course);
      this.list = await getAllCourses();
      return course;
    },
    async removeCustom(id) {
      await deleteCustomCourse(id);
      this.list = await getAllCourses();
    },
  },
});
