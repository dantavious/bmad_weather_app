// Service Worker for BMad Weather App
// Handles push notifications for precipitation alerts

self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  const title = data.title || 'Weather Alert';
  const options = {
    body: data.body || 'Precipitation starting soon',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'weather-alert',
    data: {
      locationId: data.locationId,
      precipitationType: data.precipitationType,
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/assets/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/dismiss-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to the location details
    event.waitUntil(
      clients.openWindow('/dashboard?location=' + event.notification.data.locationId)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Background sync for offline alert queue
self.addEventListener('sync', event => {
  if (event.tag === 'sync-alerts') {
    console.log('Service Worker: Syncing offline alerts');
    event.waitUntil(syncOfflineAlerts());
  }
});

async function syncOfflineAlerts() {
  try {
    // Get queued alerts from IndexedDB
    const db = await openDB();
    const tx = db.transaction('queuedAlerts', 'readonly');
    const store = tx.objectStore('queuedAlerts');
    const alerts = await store.getAll();
    
    // Process each queued alert
    for (const alert of alerts) {
      await processAlert(alert);
    }
    
    // Clear processed alerts
    const clearTx = db.transaction('queuedAlerts', 'readwrite');
    const clearStore = clearTx.objectStore('queuedAlerts');
    await clearStore.clear();
    
    console.log('Service Worker: Offline alerts synced successfully');
  } catch (error) {
    console.error('Service Worker: Error syncing offline alerts:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BMadWeatherDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedAlerts')) {
        db.createObjectStore('queuedAlerts', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function processAlert(alert) {
  // Send the alert to the backend
  try {
    const response = await fetch('/api/precipitation/process-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alert)
    });
    
    if (!response.ok) {
      throw new Error('Failed to process alert');
    }
    
    console.log('Service Worker: Alert processed successfully');
  } catch (error) {
    console.error('Service Worker: Error processing alert:', error);
    throw error;
  }
}