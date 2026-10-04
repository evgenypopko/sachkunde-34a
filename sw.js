/* Offline-Speicher der Web-App.
   VERSION und FILES werden von "einzeldatei-erstellen.py" automatisch gesetzt –
   nach jeder Änderung an der App das Skript einmal ausführen, dann erst hochladen. */
const VERSION = "3712f56b7b";
const FILES = ["./", "index.html", "styles.css", "app.js", "manifest.webmanifest", "daten/basis.js", "daten/faelle.js", "daten/fragen-1-recht.js", "daten/fragen-2-datenschutz.js", "daten/fragen-3-bgb.js", "daten/fragen-4-strafrecht.js", "daten/fragen-5-waffen.js", "daten/fragen-6-uvv.js", "daten/fragen-7-menschen.js", "daten/fragen-8-technik.js", "daten/gesetze.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];
const CACHE = "sk34a-" + VERSION;

// Lädt eine Datei frisch vom Server; bei Verbindungsfehlern bis zu drei Versuche.
async function holen(cache, datei) {
  let fehler;
  for (let versuch = 0; versuch < 3; versuch++) {
    try {
      const antwort = await fetch(new Request(datei, { cache: "reload" }));
      if (!antwort.ok) throw new Error(datei + ": " + antwort.status);
      await cache.put(datei, antwort);
      return;
    } catch (e) { fehler = e; }
  }
  throw fehler;
}

// Dateien nacheinander in kleinen Gruppen laden – schont schwache Verbindungen.
// Schlägt etwas fehl, bleibt die bisherige Version aktiv und es wird beim nächsten Start erneut versucht.
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < FILES.length; i += 4) {
      await Promise.all(FILES.slice(i, i + 4).map((f) => holen(cache, f)));
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sk34a-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Die App fordert die neue Version erst an, wenn der Nutzer auf „Jetzt aktualisieren“ tippt.
self.addEventListener("message", (event) => {
  if (event.data === "aktualisieren") self.skipWaiting();
});

// Erst der Gerätespeicher, nur bei unbekannten Dateien das Netz.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request))
  );
});
