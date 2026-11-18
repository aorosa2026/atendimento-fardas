/* App "Banco de Fardas" (app.html): guarda uma cópia das páginas no aparelho.
   - Páginas deste site: tenta SEMPRE a versão mais recente (as atualizações chegam sozinhas);
     só sem rede usa a cópia guardada.
   - Bibliotecas externas (leitor de QR, QR codes): usa a cópia guardada.
   - Os pedidos ao Apps Script (Google) nunca passam por aqui: os dados nunca ficam guardados. */
const CACHE = 'banco-fardas-v1';
const LIBS = ['https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
              'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'];
const PAGINAS = ['./app.html', './atendimento.html', './inventario.html', './leitor-fichas.html', './manifest.json',
                 './atendimento-180.png', './atendimento-192.png', './atendimento-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PAGINAS.concat(LIBS).map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('banco-fardas-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (LIBS.includes(e.request.url)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copia = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return resp;
    })));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(e.request).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
      return resp;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./app.html'))));
  }
  // tudo o resto (Google Apps Script, formulários…) segue pela rede, sem cópia
});
