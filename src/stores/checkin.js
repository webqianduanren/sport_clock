import { defineStore } from "pinia";
import { getCheckins, saveCheckin as persistCheckin, deleteCheckin as persistDelete } from "@/db/index.js";
import { today, calcStreak, monthCount } from "@/utils/date.js";
import dayjs from "dayjs";

export const useCheckinStore = defineStore("checkin", {
  state: () => ({
    checkins: [],
    loaded: false,
  }),

  getters: {
    todayCheckin(state) {
      const d = today();
      return state.checkins.find((c) => c.date === d) || null;
    },
    hasCheckedToday(state) {
      return !!this.todayCheckin;
    },
    streakDays(state) {
      return calcStreak(state.checkins);
    },
    totalCount(state) {
      return state.checkins.length;
    },
    currentMonthCount(state) {
      return monthCount(state.checkins, new Date());
    },
    checkinSet(state) {
      return new Set(state.checkins.map((c) => c.date));
    },
    // 各分类累计打卡次数
    categoryStats(state) {
      const map = {};
      state.checkins.forEach((c) => {
        map[c.category] = (map[c.category] || 0) + 1;
      });
      return map;
    },
  },

  actions: {
    async load() {
      this.checkins = await getCheckins();
      this.loaded = true;
    },
    async checkIn(payload) {
      const record = {
        ...payload,
        date: payload.date || today(),
        createdAt: Date.now(),
      };
      const next = await persistCheckin(record);
      this.checkins = next;
      return record;
    },
    async deleteToday() {
      const d = today();
      await persistDelete(d);
      this.checkins = this.checkins.filter((c) => c.date !== d);
    },
    async reset() {
      this.checkins = [];
    },
  },
});
