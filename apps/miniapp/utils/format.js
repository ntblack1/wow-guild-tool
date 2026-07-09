const statusText = {
  draft: "\u8349\u7a3f",
  signup_open: "\u62a5\u540d\u4e2d",
  locked: "\u5df2\u9501\u5b9a",
  in_progress: "\u8fdb\u884c\u4e2d",
  finished: "\u5df2\u7ed3\u675f",
  cancelled: "\u5df2\u53d6\u6d88",
  signed: "\u5df2\u62a5\u540d",
  standby: "\u5019\u8865",
  leave: "\u8bf7\u5047",
  present: "\u51fa\u52e4",
  late: "\u8fdf\u5230",
  absent: "\u7f3a\u5e2d"
};

const roleText = {
  tank: "\u5766\u514b",
  healer: "\u6cbb\u7597",
  melee: "\u8fd1\u6218",
  ranged: "\u8fdc\u7a0b"
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (input) => `${input}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

module.exports = {
  statusText,
  roleText,
  formatDateTime
};
