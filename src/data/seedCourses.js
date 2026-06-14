// 内置种子课程 —— 减脂塑形方向
// videoUrl 优先使用 B 站嵌入地址;占位 BV 号可在后续替换为真实课程
export const seedCourses = [
  // HIIT
  { id: "hiit-01", name: "全身燃脂 高强度间歇 20 分钟", category: "hiit", duration: 20, level: "中级", desc: "无器械高强度间歇,适合下班后快速爆汗", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1oT411h7PL&autoplay=0&high_quality=1&danmaku=0" },
  { id: "hiit-02", name: "Tabata 4 分钟挑战", category: "hiit", duration: 15, level: "初级", desc: "20 秒训练 + 10 秒休息,循环 8 组", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Gs411o7i8&autoplay=0&high_quality=1&danmaku=0" },
  { id: "hiit-03", name: "核心强化 高强度间歇 25 分钟", category: "hiit", duration: 25, level: "高级", desc: "聚焦腹部与核心的高强度训练", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1qW411H7XW&autoplay=0&high_quality=1&danmaku=0" },

  // 有氧
  { id: "cardio-01", name: "快乐有氧操 30 分钟", category: "cardio", duration: 30, level: "初级", desc: "节奏感强的有氧操,适合零基础", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1zt411t7G5&autoplay=0&high_quality=1&danmaku=0" },
  { id: "cardio-02", name: "室内跑步训练 25 分钟", category: "cardio", duration: 25, level: "中级", desc: "原地跑步 + 开合跳组合", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1yZ4y1T7o7&autoplay=0&high_quality=1&danmaku=0" },
  { id: "cardio-03", name: "踏板有氧 35 分钟", category: "cardio", duration: 35, level: "中级", desc: "用书本/台阶替代踏板,燃脂塑形", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1JK411s7Ab&autoplay=0&high_quality=1&danmaku=0" },

  // 搏击
  { id: "boxing-01", name: "拳击基础站姿 20 分钟", category: "boxing", duration: 20, level: "初级", desc: "学习刺拳、摆拳、勾拳基本动作", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Xf4y1L7Gh&autoplay=0&high_quality=1&danmaku=0" },
  { id: "boxing-02", name: "搏击操燃脂 30 分钟", category: "boxing", duration: 30, level: "中级", desc: "结合拳击动作的爆汗有氧", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1oZ4y1F7BN&autoplay=0&high_quality=1&danmaku=0" },
  { id: "boxing-03", name: "影子拳组合 15 分钟", category: "boxing", duration: 15, level: "高级", desc: "组合拳空击训练,提升出拳速度", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1xL4y1Y7tQ&autoplay=0&high_quality=1&danmaku=0" },

  // 燃脂
  { id: "fatburn-01", name: "全身燃脂 40 分钟", category: "fatburn", duration: 40, level: "中级", desc: "低强度持续训练,稳定燃脂", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1A4411K7zt&autoplay=0&high_quality=1&danmaku=0" },
  { id: "fatburn-02", name: "睡前燃脂 15 分钟", category: "fatburn", duration: 15, level: "初级", desc: "低强度动作,不影响入睡", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1bZ4y1K7rN&autoplay=0&high_quality=1&danmaku=0" },
  { id: "fatburn-03", name: "站立燃脂 20 分钟", category: "fatburn", duration: 20, level: "初级", desc: "无需瑜伽垫,客厅即可完成", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1iK41157H8&autoplay=0&high_quality=1&danmaku=0" },

  // 塑形
  { id: "shape-01", name: "翘臀训练 25 分钟", category: "shape", duration: 25, level: "中级", desc: "针对臀部的塑形动作组合", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1R4411M7cB&autoplay=0&high_quality=1&danmaku=0" },
  { id: "shape-02", name: "瘦腿塑形 20 分钟", category: "shape", duration: 20, level: "初级", desc: "大腿小腿全方位塑形", videoUrl: "https://player.bilibili.com/player.html?bvid=BV15Z4y1M7Wv&autoplay=0&high_quality=1&danmaku=0" },
  { id: "shape-03", name: "马甲线雕刻 15 分钟", category: "shape", duration: 15, level: "中级", desc: "专注腹部的塑形训练", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Gv411B7oE&autoplay=0&high_quality=1&danmaku=0" },
];

export const categories = [
  { id: "all", name: "全部", color: "#7C7C7C" },
  { id: "hiit", name: "高强度间歇", color: "#FF4D4D" },
  { id: "cardio", name: "有氧", color: "#FF8E3C" },
  { id: "boxing", name: "搏击", color: "#FFD23C" },
  { id: "fatburn", name: "燃脂", color: "#00D9A3" },
  { id: "shape", name: "塑形", color: "#4D9AFF" },
];

export const moodOptions = [
  { value: "great", emoji: "🔥", label: "状态爆棚" },
  { value: "good", emoji: "💪", label: "还不错" },
  { value: "ok", emoji: "🙂", label: "一般般" },
  { value: "tired", emoji: "😮‍💨", label: "有点累" },
  { value: "bad", emoji: "😣", label: "身体不适" },
];
