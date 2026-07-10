// ═══════════════════════════════════════════
// Sun Data Sync · Google Apps Script
// 部署为 Web App 后，sun.html 可以跨设备同步数据
//
// 部署步骤：
// 1. 打开 Google Sheets，新建一个表格（命名随意）
// 2. 扩展程序 → Apps Script
// 3. 把这段代码粘贴进去，替换默认代码
// 4. 部署 → 新建部署 → Web 应用
//    - 执行身份：我自己
//    - 谁可以访问：任何人
// 5. 复制部署 URL，粘贴到 sun.html 的 SYNC_URL 变量里
// ═══════════════════════════════════════════

const SHEET_NAME = 'SunData';

function getSheet() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['key', 'value', 'updated']);
  }
  return sheet;
}

function doGet(e) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) result[rows[i][0]] = rows[i][1];
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getSheet();
  const payload = JSON.parse(e.postData.contents);
  const rows = sheet.getDataRange().getValues();
  const keyMap = {};
  for (let i = 1; i < rows.length; i++) keyMap[rows[i][0]] = i + 1;

  for (const [key, value] of Object.entries(payload)) {
    if (keyMap[key]) {
      sheet.getRange(keyMap[key], 2).setValue(value);
      sheet.getRange(keyMap[key], 3).setValue(new Date().toISOString());
    } else {
      sheet.appendRow([key, value, new Date().toISOString()]);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
