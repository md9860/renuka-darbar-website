const btn = document.getElementById('menuBtn');
const links = document.getElementById('navLinks');

btn?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
});

document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  btn?.setAttribute('aria-expanded', 'false');
}));

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});
  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('in-view'));
}

const navAnchors = [...document.querySelectorAll('#navLinks a')];
const sections = navAnchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const setActiveLink = () => {
  const y = window.scrollY + 150;
  let active = sections[0];
  sections.forEach(section => { if (section.offsetTop <= y) active = section; });
  navAnchors.forEach(a => a.classList.toggle('active', active && a.getAttribute('href') === `#${active.id}`));
};
window.addEventListener('scroll', setActiveLink, {passive:true});
setActiveLink();

const backToTop = document.getElementById('backToTop');
const updateBackToTop = () => backToTop?.classList.toggle('show', window.scrollY > 700);
window.addEventListener('scroll', updateBackToTop, {passive:true});
updateBackToTop();
backToTop?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

// Creative V2: reading progress + compact header state.
const progress = document.getElementById('scrollProgress');
const updateProgress = () => {
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
  const pct = Math.min(100, Math.max(0, (doc.scrollTop / max) * 100));
  if (progress) progress.style.width = `${pct}%`;
  document.body.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', updateProgress, {passive:true});
window.addEventListener('resize', updateProgress, {passive:true});
updateProgress();

// Creative V2: gallery lightbox. Uses the existing original image files only.
const lightbox = document.getElementById('galleryLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
let lastGalleryTrigger = null;

const closeLightbox = () => {
  if (!lightbox) return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastGalleryTrigger?.focus();
};

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lastGalleryTrigger = item;
    lightboxImage.src = item.dataset.gallerySrc || '';
    lightboxImage.alt = item.dataset.galleryAlt || '';
    lightboxCaption.textContent = item.dataset.galleryAlt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  });
});
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox(); });

// Donation flow: donor details -> payment -> automatic receipt number.
const donationForm = document.getElementById('donationForm');
const paymentStage = document.getElementById('paymentStage');
const donationReceipt = document.getElementById('donationReceipt');
const receiptDetails = document.getElementById('receiptDetails');
const paymentSummary = document.getElementById('paymentSummary');
const amountInput = document.getElementById('donationAmount');
const qrBox = document.getElementById('dynamicUpiQr');
const qrAmountText = document.getElementById('qrAmountText');
const upiPayLinks = document.querySelectorAll('.upi-pay');
const esc = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const UPI_ID = 'anjanijoshi0804@okhdfcbank';
const UPI_NAME = 'श्री क्षेत्र रेणुका दरबार';
let donorData = null;

document.querySelectorAll('.copy-btn[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copy || ''); const old=button.textContent; button.textContent='कॉपी झाले'; setTimeout(()=>button.textContent=old,1400); }
    catch (_) { window.prompt('ही माहिती कॉपी करा:', button.dataset.copy || ''); }
  });
});

function buildUpiUrl(amount) {
  const params = new URLSearchParams({pa:UPI_ID,pn:UPI_NAME,cu:'INR',tn:'Donation - Shri Renuka Darbar'});
  if (amount && Number(amount)>0) params.set('am',Number(amount).toFixed(2));
  return `upi://pay?${params.toString()}`;
}
function preparePayment(amount) {
  const url=buildUpiUrl(amount);
  upiPayLinks.forEach(link=>link.href=url);
  if (!qrBox) return;
  qrBox.innerHTML='';
  if (window.QRCode) {
    new QRCode(qrBox,{text:url,width:190,height:190,correctLevel:QRCode.CorrectLevel.M});
    if(qrAmountText) qrAmountText.textContent=`₹${Number(amount).toLocaleString('en-IN')} देणगीसाठी Scan & Pay`;
  } else qrBox.innerHTML='<span>QR तयार करण्यासाठी इंटरनेट कनेक्शन आवश्यक आहे.</span>';
}
function nextReceiptNumber(){
  const now=new Date(), fyStart=now.getMonth()>=3?now.getFullYear():now.getFullYear()-1, fyEnd=String(fyStart+1).slice(-2);
  const key=`renukaReceiptSeq-${fyStart}-${fyEnd}`;
  const seq=Number(localStorage.getItem(key)||'0')+1; localStorage.setItem(key,String(seq));
  return `RD/${fyStart}-${fyEnd}/${String(seq).padStart(6,'0')}`;
}

donationForm?.addEventListener('submit',event=>{
  event.preventDefault(); if(!donationForm.reportValidity()) return;
  donorData={
    name:document.getElementById('donorName').value.trim(), mobile:document.getElementById('donorMobile').value.trim(),
    email:document.getElementById('donorEmail').value.trim()||'—', amount:document.getElementById('donationAmount').value,
    address:document.getElementById('donorAddress').value.trim(), city:document.getElementById('donorCity').value.trim(), pin:document.getElementById('donorPin').value.trim()
  };
  if(paymentSummary) paymentSummary.textContent=`${donorData.name} • देणगी ₹${Number(donorData.amount).toLocaleString('en-IN')}`;
  preparePayment(donorData.amount); paymentStage.hidden=false; donationReceipt.hidden=true;
  paymentStage.scrollIntoView({behavior:'smooth',block:'start'});
});

document.getElementById('paymentCompletedBtn')?.addEventListener('click',()=>{
  if(!donorData) return;
  const method=document.getElementById('paymentMethod'), txn=document.getElementById('transactionId');
  if(!method.value){method.focus();method.reportValidity();return;} if(!txn.value.trim()){txn.focus();txn.reportValidity();return;}
  const now=new Date(), receiptNo=nextReceiptNumber();
  const date=new Intl.DateTimeFormat('mr-IN',{dateStyle:'long',timeStyle:'short'}).format(now);
  receiptDetails.innerHTML=`<div class="receipt-data">
    <p><b>पावती क्र.:</b> ${esc(receiptNo)}</p><p><b>दिनांक:</b> ${esc(date)}</p>
    <p><b>देणगीदार:</b> ${esc(donorData.name)}</p><p><b>मोबाईल:</b> ${esc(donorData.mobile)}</p>
    <p><b>ईमेल:</b> ${esc(donorData.email)}</p><p><b>Payment:</b> ${esc(method.value)}</p>
    <p><b>रक्कम:</b> ₹${esc(Number(donorData.amount).toLocaleString('en-IN'))}</p><p><b>स्थिती:</b> व्यवहार पडताळणी प्रलंबित</p>
    <p class="wide"><b>Transaction / UTR:</b> ${esc(txn.value.trim())}</p>
    <p class="wide"><b>पत्ता:</b> ${esc(donorData.address)}, ${esc(donorData.city)} - ${esc(donorData.pin)}</p><p class="wide"><b>सूचना:</b> हा Acknowledgement देणगीदाराने नोंदवलेल्या व्यवहार संदर्भावर आधारित आहे; बँक/संस्थेकडील अंतिम पडताळणी प्रलंबित आहे.</p>
  </div>`;
  donationReceipt.hidden=false; donationReceipt.scrollIntoView({behavior:'smooth',block:'start'});
});
document.getElementById('printDonationReceipt')?.addEventListener('click',()=>window.print());
