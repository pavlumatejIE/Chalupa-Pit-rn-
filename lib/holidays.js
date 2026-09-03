function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function czechHolidays(year) {
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  const fixed = [
    [0, 1, "Nový rok"],
    [4, 1, "Svátek práce"],
    [4, 8, "Den vítězství"],
    [6, 5, "Den slovanských věrozvěstů"],
    [6, 6, "Upálení mistra Jana Husa"],
    [8, 28, "Den české státnosti"],
    [9, 28, "Vznik samostatného státu"],
    [10, 17, "Den boje za svobodu"],
    [11, 24, "Štědrý den"],
    [11, 25, "1. svátek vánoční"],
    [11, 26, "2. svátek vánoční"],
  ];

  const map = {};
  fixed.forEach(([m, d, name]) => {
    map[`${year}-${m}-${d}`] = name;
  });
  map[`${year}-${goodFriday.getMonth()}-${goodFriday.getDate()}`] = "Velký pátek";
  map[`${year}-${easterMonday.getMonth()}-${easterMonday.getDate()}`] = "Velikonoční pondělí";
  return map;
}

export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}
