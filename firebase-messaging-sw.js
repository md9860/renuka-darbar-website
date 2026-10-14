/* Firebase Messaging service worker — Renuka Darbar test */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyANrYNYOV56wVFEzo-hDHkVBSNbP3LFlCI',authDomain:'renuka-darbar-notifications.firebaseapp.com',projectId:'renuka-darbar-notifications',storageBucket:'renuka-darbar-notifications.firebasestorage.app',messagingSenderId:'986882733768',appId:'1:986882733768:web:a6bbb2acb438045af557fd'});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{const n=payload.notification||{};self.registration.showNotification(n.title||'श्री क्षेत्र रेणुका दरबार',{body:n.body||'नवीन आश्रम उपक्रम',icon:'./assets/sansthan-logo.png',data:{url:'./feed.html'}});});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(new URL('./feed.html',self.registration.scope).href));});
