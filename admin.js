(function(){
  const cfg=window.RENUKA_SHEETS_CONFIG||{};
  const adminCard=document.getElementById('adminCard');
  const loginCard=document.getElementById('loginCard');
  const adminMsg=document.getElementById('adminMsg');
  const loginMsg=document.getElementById('loginMsg');
  let all=[];
  // Security: never persist an Admin login across page opens/reloads.
  let sessionToken='';
  localStorage.removeItem('renukaAdminSession');
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function show(msg,err=false){const target=loginCard && !loginCard.classList.contains('hidden') ? loginMsg : adminMsg;if(!target)return;target.textContent=msg;target.style.display='block';target.classList.toggle('danger',err);}
  function hideMsg(){if(adminMsg)adminMsg.style.display='none';if(loginMsg)loginMsg.style.display='none';}
  function configured(){return !!String(cfg.webAppUrl||'').trim() && cfg.webAppUrl.indexOf('PASTE_')<0;}
  function indiaToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  if($('adminDate'))$('adminDate').value=indiaToday();
  function setLoggedIn(on){loginCard.classList.toggle('hidden',on);adminCard.classList.toggle('hidden',!on);}
  async function request(body){
    if(!configured()) throw new Error('Google Sheets Web App URL भरलेली नाही.');
    const res=await fetch(cfg.webAppUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
    const data=await res.json();
    if(!res.ok||data.ok===false)throw new Error(data.error||('HTTP '+res.status));
    return data;
  }
  async function login(){
    const username=$('adminUsername').value.trim(),password=$('adminPassword').value;
    if(!username||!password){show('Username आणि Password भरा.',true);return;}
    try{show('लॉगिन तपासत आहे…');const data=await request({action:'login',username,password});sessionToken=data.sessionToken;setLoggedIn(true);hideMsg();await load();}
    catch(e){show('लॉगिन अयशस्वी: '+e.message,true);setLoggedIn(false);}
  }
  async function logout(){
    const token=sessionToken;
    // Clear the browser UI/session immediately so Logout always works.
    sessionToken=''; all=[]; localStorage.removeItem('renukaAdminSession');
    setLoggedIn(false); hideMsg();
    if($('adminPassword')) $('adminPassword').value='';
    if($('adminSearch')) $('adminSearch').value='';
    try{ if(token) await request({action:'logout',sessionToken:token}); }catch(_){}
  }
  async function apiRead(){return request({action:'read',sessionToken}).then(d=>d.rows||[]);}
  async function apiUpdate(ids,changes){return request({action:'update',sessionToken,ids,changes});}
  function dateOf(r){
    const raw=String(r.created_at||'').trim();
    const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/); if(iso)return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const d=new Date(raw); if(!Number.isNaN(d.getTime()))return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
    const m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/); if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return '';
  }
  function displayDate(r){const d=dateOf(r);if(!d)return '—';const [y,m,day]=d.split('-');return `${day}/${m}/${y}`;}
  async function load(){
    try{show('नोंदी लोड होत आहेत…');all=await apiRead();hideMsg();render();}
    catch(e){if(/session/i.test(e.message)||/login/i.test(e.message)){sessionToken='';localStorage.removeItem('renukaAdminSession');setLoggedIn(false);show('सत्र समाप्त झाले. पुन्हा लॉगिन करा.',true);}else{show('नोंदी लोड करता आल्या नाहीत: '+e.message,true);render();}}
  }
  function groupedPeople(){
    const q=$('adminSearch').value.trim().toLowerCase(),date=$('adminDate').value,kind=$('adminFilter').value,pf=$('adminPrasadFilter').value;
    const grouped=new Map();
    for(const r of all){const key=(r.mobile||r.email||r.name||'').replace(/\s+/g,'').toLowerCase();if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r)}
    let people=[...grouped.values()].map(rs=>{const d=rs.find(x=>x.registration_type==='donation'),s=rs.find(x=>x.registration_type==='service'),g=rs.find(x=>x.registration_type==='gurumantra'),b=s||d||g||rs[0];const prasadRows=rs.filter(x=>x.registration_type!=='gurumantra');return {key:rs.map(x=>x.id).join('|'),rows:rs,name:b.name,mobile:b.mobile,email:b.email,address:b.address,city:b.city,pin:b.pin,donation:d,service:s,gurumantra:g,sent:prasadRows.length?prasadRows.every(x=>x.prasad_sent):true,tracking:prasadRows.map(x=>x.tracking_no).filter(Boolean).join(' / '),amount:rs.reduce((a,x)=>a+Number(x.amount||0),0)}});
    return people.filter(p=>{const text=[p.name,p.mobile,p.email,p.address,p.city,p.pin,p.donation?.utr,p.service?.utr,p.donation?.receipt_no,p.service?.receipt_no].join(' ').toLowerCase();if(q&&!text.includes(q))return false;if(date&&!p.rows.some(r=>dateOf(r)===date))return false;if(kind==='donation'&&(!p.donation||p.service))return false;if(kind==='service'&&(!p.service||p.donation))return false;if(kind==='both'&&(!p.donation||!p.service))return false;if(kind==='gurumantra'&&!p.gurumantra)return false;if(pf==='pending'&&p.sent)return false;if(pf==='sent'&&!p.sent)return false;return true;});
  }
  function render(){
    const people=groupedPeople();
    $('summary').innerHTML=`<span>भक्त: ${people.length}</span><span>देणगी: ${people.filter(p=>p.donation).length}</span><span>पूजा / अभिषेक: ${people.filter(p=>p.service).length}</span><span>दोन्ही: ${people.filter(p=>p.donation&&p.service).length}</span><span>गुरुमंत्र: ${people.filter(p=>p.gurumantra).length}</span><span>प्रसाद बाकी: ${people.filter(p=>!p.sent).length}</span>`;
    $('rows').innerHTML=people.length?people.map(p=>{const tags=[p.donation?'देणगी':'',p.service?'पूजा / अभिषेक':'',p.gurumantra?'गुरुमंत्र':''].filter(Boolean).map(x=>`<span class="tag">${x}</span>`).join(' ');const hasPrasad=!!(p.donation||p.service);const txn=p.rows.map(r=>r.registration_type==='gurumantra'?`<div><small>${esc(r.receipt_no||'')}</small><br><small><b>गुरुमंत्र दिनांक:</b> ${esc(r.service_date||'—')}</small><br><small><b>ठिकाण:</b> श्री क्षेत्र रेणुका दरबार, सद्गुरू शक्तिपीठ काचमंदीर सोनई</small></div>`:`<div><b>${esc(r.utr||'')}</b><br><small>${esc(r.receipt_no||'')}</small></div>`).join('<hr>');const prasad=hasPrasad?`<button class="status-btn ${p.sent?'sent':''}" data-key="${esc(p.key)}">${p.sent?'☑ प्रसाद पाठवला':'☐ प्रसाद पाठवायचा आहे'}</button>`:'<span class="tag">लागू नाही</span>';const tracking=hasPrasad?`<div class="track"><input data-track="${esc(p.key)}" value="${esc(p.tracking)}" placeholder="Tracking No."><button class="btn btn-outline" data-save="${esc(p.key)}">जतन</button></div>`:'<span class="tag">लागू नाही</span>';const dates=[...new Set(p.rows.map(displayDate).filter(x=>x&&x!=='—'))].join('<br>')||'—';const amount=(p.gurumantra&&!p.donation&&!p.service)?'—':`₹${p.amount.toLocaleString('en-IN')}`;return `<tr><td>${dates}</td><td><strong>${esc(p.name)}</strong><br><small>${esc(p.email||'')}</small></td><td>${esc(p.mobile)}</td><td>${tags}</td><td>${p.service?esc(p.service.service_type||'—'):'—'}</td><td>${amount}</td><td>${esc([p.address,p.city,p.pin].filter(Boolean).join(', '))}</td><td>${txn}</td><td>${prasad}</td><td>${tracking}</td></tr>`}).join(''):'<tr><td colspan="10">या फिल्टरसाठी नोंद उपलब्ध नाही.</td></tr>';
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-key]');
    if(b){try{b.disabled=true;const ids=b.dataset.key.split('|'),current=all.filter(r=>ids.includes(r.id)),next=!current.every(r=>r.prasad_sent);await apiUpdate(ids,{prasad_sent:next});await load();}catch(err){show('स्थिती जतन करता आली नाही: '+err.message,true);b.disabled=false;}}
    const s=e.target.closest('[data-save]');
    if(s){try{s.disabled=true;const ids=s.dataset.save.split('|'),input=document.querySelector(`[data-track="${CSS.escape(s.dataset.save)}"]`),value=input?.value.trim()||'';await apiUpdate(ids,{tracking_no:value});await load();}catch(err){show('Tracking No. जतन करता आली नाही: '+err.message,true);s.disabled=false;}}
  });
  $('loginBtn').addEventListener('click',login);$('adminPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login();});$('logoutBtn').addEventListener('click',logout);
  ['adminSearch','adminDate','adminFilter','adminPrasadFilter'].forEach(id=>$(id).addEventListener(id==='adminSearch'?'input':'change',render));
  $('refreshBtn').addEventListener('click',load);
  $('exportBtn').addEventListener('click',()=>{
    const data=all.filter(r=>{const q=$('adminSearch').value.trim().toLowerCase(),date=$('adminDate').value,kind=$('adminFilter').value,pf=$('adminPrasadFilter').value,text=[r.name,r.mobile,r.email,r.utr,r.receipt_no,r.address,r.city,r.pin].join(' ').toLowerCase();if(q&&!text.includes(q))return false;if(date&&dateOf(r)!==date)return false;if(kind==='donation'&&r.registration_type!=='donation')return false;if(kind==='service'&&r.registration_type!=='service')return false;if(kind==='gurumantra'&&r.registration_type!=='gurumantra')return false;if(pf==='pending'&&r.prasad_sent)return false;if(pf==='sent'&&!r.prasad_sent)return false;return true});
    const out=[['दिनांक','नोंद','नाव','मोबाईल','ई-मेल','सेवा प्रकार','रक्कम','UTR','पावती क्र.','पत्ता','शहर','PIN','प्रसाद','Tracking No.'],...data.map(r=>[dateOf(r),r.registration_type==='donation'?'देणगी':(r.registration_type==='gurumantra'?'गुरुमंत्र':'पूजा / अभिषेक'),r.name,r.mobile,r.email||'',r.service_type||'',r.amount,r.utr,r.receipt_no,r.address||'',r.city||'',r.pin||'',r.registration_type==='gurumantra'?'':(r.prasad_sent?'पाठवला':'पाठवायचा आहे'),r.registration_type==='gurumantra'?'':(r.tracking_no||'')])];
    const csv='\ufeff'+out.map(a=>a.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='renuka-darbar-daily-registrations.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  // Always require a fresh Admin login whenever admin.html is opened/reloaded.
  setLoggedIn(false);
})();
