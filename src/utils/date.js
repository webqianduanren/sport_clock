import dayjs from "dayjs";

export const DATE_FMT = "YYYY-MM-DD";

export function today() {
  return dayjs().format(DATE_FMT);
}

export function fmtDate(d) {
  return dayjs(d).format(DATE_FMT);
}

export function calcStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;
  const set = new Set(checkins.map((c) => c.date));
  let streak = 0;
  let cursor = dayjs();
  // 允许「今天没打卡但昨天打卡」的情况,最多少算 1 天
  if (!set.has(cursor.format(DATE_FMT))) {
    cursor = cursor.subtract(1, "day");
    if (!set.has(cursor.format(DATE_FMT))) return 0;
  }
  while (set.has(cursor.format(DATE_FMT))) {
    streak += 1;
    cursor = cursor.subtract(1, "day");
  }
  return streak;
}

export function monthCount(checkins, monthDate) {
  const m = dayjs(monthDate);
  return checkins.filter((c) => dayjs(c.date).isSame(m, "month")).length;
}
