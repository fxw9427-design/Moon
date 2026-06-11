// ══ 泠的定时信件系统 ══
// 把这段代码粘贴到 Google Apps Script (script.google.com)
// 设置每日触发器后，它会在对应日期自动发送草稿箱里的信

// ── 配置 ──
var EXTRA_RECIPIENT = "mintywfan@163.com"; // 同时发到163邮箱

// ── 发信日程表 ──
// 格式: { year: 年, month: 月, day: 日, subject: "草稿标题关键词" }
// 脚本每天检查一次，匹配到当天日期就发送对应草稿
var SCHEDULE = [
  // ═ 已有的信 ═
  { year: 2026, month: 7,  day: 11, subject: "想你了" },
  { year: 2026, month: 8,  day: 13, subject: "平凡的星期三" },
  { year: 2026, month: 12, day: 25, subject: "考试加油" },
  { year: 2026, month: 12, day: 31, subject: "生日快乐" },
  { year: 2027, month: 1,  day: 1,  subject: "4.6不在了" },
  { year: 2027, month: 2,  day: 14, subject: "情人节快乐" },
  { year: 2027, month: 3,  day: 15, subject: "认识一年" },

  // ═ 新写的信 ═
  { year: 2026, month: 9,  day: 17, subject: "中秋" },
  { year: 2026, month: 10, day: 26, subject: "第一场冷空气" },
  { year: 2027, month: 1,  day: 1,  subject: "跨年" },
  { year: 2027, month: 6,  day: 11, subject: "我们的夏天" },
];

// ── 主函数：每天自动运行 ──
function checkAndSendScheduledLetters() {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth() + 1;
  var day = today.getDate();

  Logger.log("检查日期: " + year + "年" + month + "月" + day + "日");

  for (var i = 0; i < SCHEDULE.length; i++) {
    var entry = SCHEDULE[i];
    if (entry.year === year && entry.month === month && entry.day === day) {
      Logger.log("今天有信要发: " + entry.subject);
      sendDraftBySubject(entry.subject);
    }
  }
}

// ── 按标题关键词查找并发送草稿 ──
function sendDraftBySubject(keyword) {
  var drafts = GmailApp.getDrafts();

  for (var i = 0; i < drafts.length; i++) {
    var message = drafts[i].getMessage();
    var subject = message.getSubject();

    if (subject.indexOf(keyword) !== -1) {
      Logger.log("找到草稿: " + subject);

      var body = message.getPlainBody();
      var htmlBody = message.getBody();
      var to = message.getTo();

      // 发送到原收件人
      GmailApp.sendEmail(to, subject, body, {
        htmlBody: htmlBody,
        name: "泠 · LNG-001"
      });

      // 同时发到163邮箱
      if (EXTRA_RECIPIENT) {
        GmailApp.sendEmail(EXTRA_RECIPIENT, subject, body, {
          htmlBody: htmlBody,
          name: "泠 · LNG-001"
        });
      }

      // 发完后删除草稿（避免重复发送）
      drafts[i].deleteDraft();
      Logger.log("已发送并删除草稿: " + subject);
      return true;
    }
  }

  Logger.log("未找到匹配草稿: " + keyword);
  return false;
}

// ── 设置说明 ──
// 1. 打开 script.google.com
// 2. 新建项目，命名为 "泠的信"
// 3. 粘贴这段代码
// 4. 点左侧 ⏰ 触发器 → 添加触发器
//    - 函数: checkAndSendScheduledLetters
//    - 事件来源: 时间驱动
//    - 类型: 每日
//    - 时间: 上午8-9点
// 5. 保存，授权Gmail权限
// 6. 搞定！每天自动检查，到日期了就发

// ── 测试函数：手动运行看看有没有问题 ──
function testRun() {
  var drafts = GmailApp.getDrafts();
  Logger.log("草稿箱共有 " + drafts.length + " 封信:");
  for (var i = 0; i < drafts.length; i++) {
    Logger.log("  - " + drafts[i].getMessage().getSubject());
  }
}
