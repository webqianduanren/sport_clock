// 内置种子课程 —— 减脂塑形方向
// videoUrl 使用 B 站嵌入地址，均为真实可播放课程
export const seedCourses = [
  // HIIT
  { id: "hiit-01", name: "帕梅拉 · 10分钟最佳HIIT训练", category: "hiit", duration: 10, level: "中级", desc: "帕梅拉经典HIIT，高效全身燃脂，无器械", cover: "https://i0.hdslb.com/bfs/archive/1fdbcbef419d87f817f76d5fbe93ec5bb6616a45.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Np4y1i7rG&autoplay=0&high_quality=1&danmaku=0" },
  { id: "hiit-02", name: "帕梅拉 · 15分钟HIIT高强度燃脂", category: "hiit", duration: 15, level: "中级", desc: "帕梅拉最火15分钟HIIT，暴汗全身燃脂", cover: "https://i0.hdslb.com/bfs/archive/71856709c09469406aaed62f29819096590e34b5.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV19J41197c3&autoplay=0&high_quality=1&danmaku=0" },
  { id: "hiit-03", name: "周六野 · 5分钟HIIT全身燃脂", category: "hiit", duration: 5, level: "初级", desc: "周六野经典HIIT，短时高效，新手友好", cover: "https://i2.hdslb.com/bfs/archive/b4a4a639fb4a1169aa226828ea6e265efeddf5b2.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1iD4y1X7Qj&autoplay=0&high_quality=1&danmaku=0" },

  // 有氧
  { id: "cardio-01", name: "周六野 · 12分钟有氧燃脂操", category: "cardio", duration: 12, level: "初级", desc: "周六野经典有氧操，节奏明快，零基础可跟", cover: "https://i0.hdslb.com/bfs/archive/79a757ba394eb535956d33de2a7044b16dce9464.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1gp4y1p7di&autoplay=0&high_quality=1&danmaku=0" },
  { id: "cardio-02", name: "周六野 · 20分钟HIIT全身燃脂", category: "cardio", duration: 20, level: "中级", desc: "周六野20分钟有氧运动，暴汗燃脂塑形", cover: "https://i0.hdslb.com/bfs/archive/ea8bd14633da32d2271462c8d32dc525a0192929.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Yy4y1x7nJ&autoplay=0&high_quality=1&danmaku=0" },
  { id: "cardio-03", name: "MIZI · 30分钟燃脂健走训练", category: "cardio", duration: 30, level: "初级", desc: "MIZI走路减脂，无跳跃无深蹲，膝盖友好", cover: "https://i1.hdslb.com/bfs/archive/f9abb119c16ecc6c480194c7da0f162a1f883695.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1RP8iznE7c&autoplay=0&high_quality=1&danmaku=0" },

  // 搏击
  { id: "boxing-01", name: "帕梅拉 · 15分钟拳击风有氧燃脂", category: "boxing", duration: 15, level: "初级", desc: "帕梅拉拳击风格有氧，无跳跃踏步减脂", cover: "https://i0.hdslb.com/bfs/archive/a5d67c2df7de0b6b1cc154dd133a183f314948cb.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1MXVm6JEYN&autoplay=0&high_quality=1&danmaku=0" },
  { id: "boxing-02", name: "Eleni Fit · 站立搏击操燃脂训练", category: "boxing", duration: 20, level: "中级", desc: "Eleni Fit站立搏击操，结合拳击动作爆汗有氧", cover: "https://i2.hdslb.com/bfs/archive/41e32d856e9dad931d26dee31ba87b625ad55034.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1avGx6tE46&autoplay=0&high_quality=1&danmaku=0" },
  { id: "boxing-03", name: "沉浸式拳击 · 20分钟高效燃脂", category: "boxing", duration: 20, level: "中级", desc: "20分钟沉浸式打拳击，暴汗甩掉赘肉超解压", cover: "https://i0.hdslb.com/bfs/archive/761bfbb3a038a5e123fa485fd5eb55bc4d8d06a0.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1KS5K6NEn5&autoplay=0&high_quality=1&danmaku=0" },

  // 燃脂
  { id: "fatburn-01", name: "帕梅拉 · 30分钟经典燃脂三部曲", category: "fatburn", duration: 30, level: "中级", desc: "暴汗内啡肽+最佳HIIT+站立腹肌HIIT，怒燃200-350卡", cover: "https://i1.hdslb.com/bfs/archive/68a62fbf7517d148afe717532c61b20fb3dce88c.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1VTddBHEDE&autoplay=0&high_quality=1&danmaku=0" },
  { id: "fatburn-02", name: "周六野 · 20分钟暴汗有氧燃脂", category: "fatburn", duration: 20, level: "中级", desc: "周六野经典暴汗有氧，高效燃脂瘦全身", cover: "https://i0.hdslb.com/bfs/archive/261c821a75819151142afca0401a953fae0f2528.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV13B4y1w7L4&autoplay=0&high_quality=1&danmaku=0" },
  { id: "fatburn-03", name: "帕梅拉 · 10分钟暴汗有氧内啡肽", category: "fatburn", duration: 10, level: "初级", desc: "帕梅拉欢乐高强有氧舞步，内啡肽UP", cover: "https://i0.hdslb.com/bfs/archive/055d2b1b840674bf428a292865d635491d365dfc.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1A441167vg&autoplay=0&high_quality=1&danmaku=0" },

  // 塑形
  { id: "shape-01", name: "帕梅拉 · 10分钟臀部训练", category: "shape", duration: 10, level: "初级", desc: "帕梅拉蜜桃臀训练，零下蹲零跳跃膝盖友好", cover: "https://i1.hdslb.com/bfs/archive/26f300e4c8c35da3af4099f182a3e1cb3bb0dd30.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1K4411p75T&autoplay=0&high_quality=1&danmaku=0" },
  { id: "shape-02", name: "MIZI · 20分钟全站立瘦大腿训练", category: "shape", duration: 20, level: "初级", desc: "MIZI瘦大腿专属，无跳动不伤膝盖", cover: "https://i2.hdslb.com/bfs/archive/567bceb88e9915c03d1399cdd8bab515d9179b62.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1jKG46TEta&autoplay=0&high_quality=1&danmaku=0" },
  { id: "shape-03", name: "周六野 · 10分钟马甲线训练", category: "shape", duration: 10, level: "中级", desc: "周六野经典马甲线，练出钢铁核心", cover: "https://i0.hdslb.com/bfs/archive/232706a33c32295de5e96681029de4ed2eaa9135.jpg", videoUrl: "https://player.bilibili.com/player.html?bvid=BV1Mf4y1t7L8&autoplay=0&high_quality=1&danmaku=0" },
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
