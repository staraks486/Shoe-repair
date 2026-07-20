export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

export async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  // Check if push is supported
  if (!('pushManager' in registration)) {
    console.error('Push messaging is not supported');
    return;
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.error('VITE_VAPID_PUBLIC_KEY is not set');
    return;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    console.log('User is subscribed:', subscription);
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await subscribeUserToPush();
  }
  return permission;
}

export async function sendPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  email?: string;
  userId?: string;
}) {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error };
  }
}
