/**
 * Shri Kshetra Renuka Darbar - Google Sheets backend
 *
 * Public website can INSERT registrations using PUBLIC_WRITE_TOKEN.
 * Temple admin can READ/UPDATE only after logging in with the admin username/password.
 *
 * IMPORTANT: Deploy as Web App -> Execute as Me -> Who has access: Anyone.
 * Keep ADMIN_PASSWORD and PUBLIC_WRITE_TOKEN private in Apps Script.
 */
const SHEET_NAME = 'Registrations';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const PUBLIC_WRITE_TOKEN = 'RENukaDarbar2026_Public_Write_9f3K7mQ2';
const SESSION_TTL_SECONDS = 21600; // 6 hours
const SESSION_PREFIX = 'renuka_admin_session_';
const HEADERS = [
  'ID','Created At','Registration Type','Name','Mobile','Email','Address','City','PIN',
  'Amount','UTR','Receipt No','Payment Method','Service Type','Service Date','Gotra','Special Information',
  'Prasad Sent','Tracking No'
];

function doGet(e) {
  return json_({ok:true, message:'Renuka Darbar Google Sheets API is running.'});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');

    if (action === 'login') return login_(body.username, body.password);
    if (action === 'insert') {
      if (!publicWriteOk_(body.publicWriteToken)) return json_({ok:false,error:'Unauthorized'});
      return json_(insertRow_(body.record || {}));
    }
    if (action === 'read') {
      if (!sessionOk_(body.sessionToken)) return json_({ok:false,error:'Session expired. Please login again.'});
      return json_({ok:true, rows:readRows_()});
    }
    if (action === 'update') {
      if (!sessionOk_(body.sessionToken)) return json_({ok:false,error:'Session expired. Please login again.'});
      return json_(updateRows_(body.ids || [], body.changes || {}));
    }
    if (action === 'logout') {
      clearSession_(body.sessionToken);
      return json_({ok:true});
    }
    return json_({ok:false,error:'Unknown action'});
  } catch (err) {
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function login_(username, password) {
  if (String(username || '') !== ADMIN_USERNAME || String(password || '') !== ADMIN_PASSWORD) {
    return json_({ok:false,error:'Invalid username or password'});
  }
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();
  CacheService.getScriptCache().put(SESSION_PREFIX + token, 'admin', SESSION_TTL_SECONDS);
  return json_({ok:true,sessionToken:token,expiresIn:SESSION_TTL_SECONDS});
}

function sessionOk_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get(SESSION_PREFIX + token) === 'admin';
}

function clearSession_(token) {
  if (token) CacheService.getScriptCache().remove(SESSION_PREFIX + token);
}

function publicWriteOk_(token) {
  return !!token && token === PUBLIC_WRITE_TOKEN && PUBLIC_WRITE_TOKEN !== 'CHANGE_THIS_PUBLIC_WRITE_TOKEN';
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  else {
    const current = sh.getRange(1,1,1,HEADERS.length).getValues()[0];
    if (current.join('|') !== HEADERS.join('|')) sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  }
  return sh;
}

function setup() { sheet_(); }

function insertRow_(r) {
  const sh = sheet_();
  const utr = String(r.utr || '').trim().replace(/\s+/g,'').toUpperCase();
  const kind = String(r.kind || '');
  if (!utr && kind !== 'gurumantra') return {ok:false,error:'Transaction / UTR is required'};
  const values = sh.getDataRange().getValues();
  if (utr) {
    for (let i=1;i<values.length;i++) {
      if (String(values[i][10] || '').trim().replace(/\s+/g,'').toUpperCase() === utr) {
        return {ok:false,error:'Duplicate UTR: this transaction is already registered.',duplicate:true};
      }
    }
  }
  const id = Utilities.getUuid();
  const created = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss");
  sh.appendRow([
    id, created, r.kind || '', r.name || '', r.mobile || '', r.email || '', r.address || '', r.city || '', r.pin || '',
    Number(r.amount || 0), utr, r.receiptNo || '', r.payment || '', r.service || '', r.serviceDate || '', r.gotra || '', r.note || '',
    false, ''
  ]);
  return {ok:true,id:id};
}

function readRows_() {
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(function(v,idx){
    return {
      id:String(v[0] || ''), _row:idx+2,
      created_at:String(v[1] || ''), registration_type:String(v[2] || ''), name:String(v[3] || ''),
      mobile:String(v[4] || ''), email:String(v[5] || ''), address:String(v[6] || ''), city:String(v[7] || ''), pin:String(v[8] || ''),
      amount:Number(v[9] || 0), utr:String(v[10] || ''), receipt_no:String(v[11] || ''), payment_method:String(v[12] || ''),
      service_type:String(v[13] || ''), service_date:String(v[14] || ''), gotra:String(v[15] || ''), note:String(v[16] || ''),
      prasad_sent:v[17] === true || String(v[17]).toLowerCase() === 'true', tracking_no:String(v[18] || '')
    };
  }).reverse();
}

function updateRows_(ids, changes) {
  const wanted = {};
  (ids || []).forEach(function(id){ wanted[String(id)] = true; });
  if (!Object.keys(wanted).length) return {ok:false,error:'No records selected'};
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  let changed = 0;
  for (let i=1;i<values.length;i++) {
    const id = String(values[i][0] || '');
    if (!wanted[id]) continue;
    if (Object.prototype.hasOwnProperty.call(changes,'prasad_sent')) sh.getRange(i+1,18).setValue(!!changes.prasad_sent);
    if (Object.prototype.hasOwnProperty.call(changes,'tracking_no')) sh.getRange(i+1,19).setValue(String(changes.tracking_no || ''));
    changed++;
  }
  return {ok:true,changed:changed};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
