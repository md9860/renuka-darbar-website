const SHEET_NAME = 'AshramFeed';
const MEDIA_FOLDER_NAME = 'Renuka Darbar - Ashram Feed Media';

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'getPosts');
    if (action === 'getPosts') return jsonResponse({ok:true, posts:getPosts()});
    return jsonResponse({ok:false,message:'Invalid action'});
  } catch(err) { return jsonResponse({ok:false,message:err.message}); }
}

function doPost(e) {
  try {
    const data=JSON.parse(e.postData&&e.postData.contents?e.postData.contents:'{}');
    const action=String(data.action||'');
    if(action==='addPost') return jsonResponse(addPost(data));
    if(action==='updatePost') return jsonResponse(updatePost(data));
    if(action==='deletePost') return jsonResponse(deletePost(data));
    if(action==='uploadMedia') return jsonResponse(uploadMedia(data));
    return jsonResponse({ok:false,message:'Invalid action'});
  } catch(err) { return jsonResponse({ok:false,message:err.message}); }
}

function uploadMedia(data) {
  const name=String(data.fileName||'').trim(), kind=String(data.kind||'photo'), dataUrl=String(data.dataUrl||'');
  if(!name||!dataUrl) throw new Error('File data is missing.');
  const m=dataUrl.match(/^data:([^;]+);base64,(.+)$/); if(!m) throw new Error('Invalid file data.');
  const bytes=Utilities.base64Decode(m[2]);
  const limit=kind==='video'?25*1024*1024:10*1024*1024;
  if(bytes.length>limit) throw new Error(kind==='video'?'Video must be under 25 MB or use YouTube link.':'Each photo must be under 10 MB.');
  const folder=getMediaFolder();
  const file=folder.createFile(Utilities.newBlob(bytes,m[1],Date.now()+'-'+name.replace(/[^\w.\-() ]+/g,'_')));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const id=file.getId();
  const url=kind==='video'?'https://drive.google.com/file/d/'+id+'/view':'https://drive.google.com/uc?export=view&id='+id;
  return {ok:true,url:url,fileId:id};
}

function getMediaFolder(){
  const props=PropertiesService.getScriptProperties(), saved=props.getProperty('ASHRAM_MEDIA_FOLDER_ID');
  if(saved){try{return DriveApp.getFolderById(saved)}catch(e){}}
  const fs=DriveApp.getFoldersByName(MEDIA_FOLDER_NAME), folder=fs.hasNext()?fs.next():DriveApp.createFolder(MEDIA_FOLDER_NAME);
  props.setProperty('ASHRAM_MEDIA_FOLDER_ID',folder.getId()); return folder;
}

function getPosts(){
  const sh=getFeedSheet(), last=sh.getLastRow(); if(last<2)return[];
  const posts=sh.getRange(2,1,last-1,7).getValues().filter(r=>r[0]).map(r=>{
    let photos=[]; try{const t=String(r[4]||'').trim();if(t)photos=t.startsWith('[')?JSON.parse(t):t.split('|').map(x=>x.trim()).filter(Boolean)}catch(e){}
    return {postId:String(r[0]||''),date:formatDateValue(r[1]),location:String(r[2]||''),caption:String(r[3]||''),photos:photos,videoURL:String(r[5]||''),createdAt:formatDateTimeValue(r[6])};
  });
  posts.sort((a,b)=>(new Date(b.createdAt).getTime()||0)-(new Date(a.createdAt).getTime()||0)); return posts;
}

function addPost(d){
  const sh=getFeedSheet(), id='POST-'+Date.now()+'-'+Math.floor(Math.random()*1000), date=String(d.date||'').trim(), caption=String(d.caption||'').trim();
  if(!date)throw new Error('Date is required.'); if(!caption)throw new Error('Caption is required.');
  const photos=Array.isArray(d.photos)?d.photos.map(String).filter(Boolean):[];
  sh.appendRow([id,date,String(d.location||''),caption,JSON.stringify(photos),String(d.videoURL||''),new Date()]); return {ok:true,postId:id};
}

function updatePost(d){
  const id=String(d.postId||'').trim(), sh=getFeedSheet(), row=findRow(sh,id); if(row<2)throw new Error('Post not found.');
  const photos=Array.isArray(d.photos)?d.photos.map(String).filter(Boolean):[];
  sh.getRange(row,2,1,5).setValues([[String(d.date||''),String(d.location||''),String(d.caption||''),JSON.stringify(photos),String(d.videoURL||'')]]); return {ok:true};
}

function deletePost(d){const sh=getFeedSheet(),row=findRow(sh,String(d.postId||''));if(row<2)throw new Error('Post not found.');sh.deleteRow(row);return{ok:true}}
function findRow(sh,id){if(!id)return-1;const last=sh.getLastRow();if(last<2)return-1;const a=sh.getRange(2,1,last-1,1).getValues();for(let i=0;i<a.length;i++)if(String(a[i][0])===id)return i+2;return-1}
function getFeedSheet(){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);if(!sh)throw new Error('AshramFeed sheet not found.');return sh}
function formatDateValue(v){if(!v)return'';return Object.prototype.toString.call(v)==='[object Date]'?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd'):String(v)}
function formatDateTimeValue(v){if(!v)return'';return Object.prototype.toString.call(v)==='[object Date]'?Utilities.formatDate(v,Session.getScriptTimeZone(),"yyyy-MM-dd'T'HH:mm:ss"):String(v)}
function jsonResponse(d){return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON)}
