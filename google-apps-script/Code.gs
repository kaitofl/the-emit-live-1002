const SHEET_NAME = '参加予定';
const HEADERS = ['更新日時', '名前・ニックネーム', '人数', '参加予定', 'イベント'];
const EVENT_NAME = 'the emit live 2026.10.02';

// エディタから一度実行。作成済みの登録先は再利用します。
function setup() {
  const properties = PropertiesService.getScriptProperties();
  let id = properties.getProperty('SPREADSHEET_ID') || '1gyRIkn6_vIDuC0xjc_DokAnLUQbogbT9FJzn9meGbUY';
  const spreadsheet = id ? SpreadsheetApp.openById(id)
    : SpreadsheetApp.create('the emit 2026.10.02 — 参加予定');
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  spreadsheet.setSpreadsheetTimeZone('Asia/Tokyo');
  prepareSheet(spreadsheet);
  console.log(spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function prepareSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const sheets = spreadsheet.getSheets();
    sheet = sheets.length === 1 && sheets[0].getLastRow() === 0
      ? sheets[0].setName(SHEET_NAME) : spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F1EDE5');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 165);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 65);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 230);
  }
  return sheet;
}

// 公開URLの疎通確認用。参加者の情報は返しません。
function doGet() {
  return jsonResponse({ ok: true, event: EVENT_NAME, version: 2 });
}

function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    if (!event || !event.parameter) {
      return jsonResponse({ ok: false, error: 'No data received.' });
    }

    // Bot が埋めることの多いダミー項目。値があれば記録しません。
    if (event.parameter.website) {
      return jsonResponse({ ok: false, error: 'Invalid submission.' });
    }

    const name = String(event.parameter.name || '').trim().normalize('NFKC');
    const attendance = String(event.parameter.attendance || '');
    const partySize = attendance === '行けなくなった' ? 0 : Number(event.parameter.partySize);

    if (!name || name.length > 80) {
      return jsonResponse({ ok: false, error: 'Name is required.' });
    }

    if (!['行けそう', '行けなくなった'].includes(attendance)) {
      return jsonResponse({ ok: false, error: 'Invalid attendance.' });
    }

    if (attendance === '行けそう' && (!Number.isInteger(partySize) || partySize < 1 || partySize > 6)) {
      return jsonResponse({ ok: false, error: 'Party size must be between 1 and 6.' });
    }

    lock.waitLock(10000);

    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Run setup first.');
    const sheet = prepareSheet(SpreadsheetApp.openById(id));
    const lastRow = sheet.getLastRow();
    const names = lastRow > 1 ? sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues() : [];
    const index = names.findIndex(row => String(row[0]).trim().normalize('NFKC') === name);
    const row = index < 0 ? lastRow + 1 : index + 2;
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([[
      new Date(), cleanCell(name), partySize, attendance, EVENT_NAME,
    ]]);
    sheet.getRange(row, 1).setNumberFormat('yyyy/mm/dd hh:mm');
    SpreadsheetApp.flush();

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('Registration save failed. Check configuration and service availability.');
    return jsonResponse({ ok: false, error: 'Unable to save registration.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function cleanCell(value) {
  const text = String(value || '').trim();
  return /^[=+\-@']/.test(text) ? `'${text}` : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
