
/*
 * Shri Kshetra Renuka Darbar
 * Firebase Messaging Service Worker
 *
 * Works with Firebase notification payloads
 * sent by FirebasePushSender.gs.
 */

importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyANrYNYOV56wVFEzo-hDHkVBSNbP3LFlCI',
  authDomain: 'renuka-darbar-notifications.firebaseapp.com',
  projectId: 'renuka-darbar-notifications',
  storageBucket: 'renuka-darbar-notifications.firebasestorage.app',
  messagingSenderId: '986882733768',
  appId: '1:986882733768:web:a6bbb2acb438045af557fd'
});

const messaging = firebase.messaging();

const FEED_URL =
  'https://md9860.github.io/renuka-darbar-website/feed.html';

/*
 * Firebase automatically displays background
 * notifications when the FCM message contains
 * a notification payload.
 *
 * Do not call showNotification() again here.
 */
messaging.onBackgroundMessage(function (payload) {
  console.log(
    '[Renuka Darbar] Background FCM message received'
  );
});

/*
 * Firebase Messaging handles notification
 * clicks for its notification payloads.
 *
 * The destination is configured through:
 * webpush.fcm_options.link
 *
 * in FirebasePushSender.gs.
 */
