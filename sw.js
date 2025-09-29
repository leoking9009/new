// Service Worker for TaskFlow PWA
const CACHE_NAME = 'taskflow-v1.0.1';
const STATIC_CACHE_NAME = 'taskflow-static-v1.0.1';
const DYNAMIC_CACHE_NAME = 'taskflow-dynamic-v1.0.1';

// 캐시할 정적 파일들
const STATIC_FILES = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/app.js',
  '/js/supabase.js',
  '/manifest.json',
  // 오프라인 페이지
  '/offline.html'
];

// 캐시할 외부 리소스들
const EXTERNAL_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install 이벤트 - 서비스 워커 설치 시
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...', event);

  event.waitUntil(
    Promise.all([
      // 정적 파일 캐시
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // 외부 리소스 캐시
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching external resources');
        return cache.addAll(EXTERNAL_RESOURCES);
      })
    ]).then(() => {
      console.log('[SW] Static files cached successfully');
      // 새 서비스 워커를 즉시 활성화
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Error caching static files:', error);
    })
  );
});

// Activate 이벤트 - 서비스 워커 활성화 시
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...', event);

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 이전 버전의 캐시 삭제
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      // 모든 탭에서 새 서비스 워커를 즉시 제어
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 - 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 같은 도메인의 요청만 처리
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      handleSameOriginRequest(event.request)
    );
  } else {
    // 외부 리소스 요청 처리
    event.respondWith(
      handleExternalRequest(event.request)
    );
  }
});

// 같은 도메인 요청 처리 (Cache First 전략)
async function handleSameOriginRequest(request) {
  const url = new URL(request.url);

  try {
    // 정적 파일들은 캐시 우선
    if (isStaticFile(url.pathname)) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
    }

    // 네트워크 요청 시도
    const networkResponse = await fetch(request);

    // 성공적인 응답인 경우 캐시에 저장 (동적 컨텐츠)
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();

      if (!isStaticFile(url.pathname)) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, responseClone);
        console.log('[SW] Cached dynamic content:', request.url);
      }
    }

    return networkResponse;

  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);

    // 네트워크 실패 시 캐시에서 응답
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // HTML 요청이고 캐시에도 없으면 오프라인 페이지 제공
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    // 기본 오프라인 응답
    return new Response(
      'Offline - Content not available',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

// 외부 리소스 요청 처리
async function handleExternalRequest(request) {
  try {
    // 캐시 확인
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving external resource from cache:', request.url);
      return cachedResponse;
    }

    // 네트워크 요청
    const networkResponse = await fetch(request);

    // 성공적인 응답 캐시
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached external resource:', request.url);
    }

    return networkResponse;

  } catch (error) {
    console.log('[SW] External resource failed:', request.url);

    // 캐시된 버전 반환
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// 정적 파일 여부 확인
function isStaticFile(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const staticPaths = ['/', '/index.html', '/login.html', '/manifest.json'];

  return staticPaths.includes(pathname) ||
         staticExtensions.some(ext => pathname.endsWith(ext));
}

// 백그라운드 동기화 (향후 구현)
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...');
  // 오프라인 상태에서 저장된 데이터를 서버와 동기화
  // 향후 구현
}

// 푸시 알림 수신 (향후 구현)
self.addEventListener('push', event => {
  console.log('[SW] Push message received:', event);

  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TaskFlow', options)
  );
});

// 알림 클릭 처리 (향후 구현)
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received:', event);

  event.notification.close();

  if (event.action === 'explore') {
    // 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 수신 처리
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker script loaded');