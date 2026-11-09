import { bearing, distanzaKm, isDavanti, stessaDirezione, differenzaAngolare } from './geo.js';
import { codiciAutostradali } from './autostrade.js';
import { nomeStrada } from './dati.js';
import { t } from '../i18n.js';
import { biviPronti } from './reteAutostradale.js';
import { RAGGIO_STAZIONI_KM } from '../config.js';

/**
 * Stazione pronta per la UI:
 * { nome, strada, direzione, operatore, lat, lon, distanza, colonnine, exitRequired,
 *   isAvanti: raggiungibile proseguendo sulla strada attuale o girando a un bivio davanti,
 *   isNearest: la più vicina tra quelle avanti sulla strada attuale,
 *   bivio: se si raggiunge girando a un bivio davanti, altrimenti null:
 *          { id, sigla, distanza, lato, cardinale }
 *          id: identifica il bivio; sigla: l'altra autostrada; distanza: km fino al bivio;
 *          lato: 'sx' o 'dx', da che parte si gira al bivio per quel senso di marcia;
 *          cardinale: 'NORD'/'EST'/'SUD'/'OVEST' del senso di marcia, solo se dal bivio
 *          partono entrambi i sensi dell'altra autostrada (altrimenti null) }
 *   La distanza di una stazione dopo un bivio è la somma dei due tratti: dall'utente al bivio
 *   e dal bivio alla stazione, non la distanza in linea d'aria dall'utente. 
 */
function versoStazione(area, lat, lon) {
  return {
    nome: area.nome,
    strada: nomeStrada(area) || area.indirizzo || t('stradaSconosciuta'),
    direzione: area.destinazione ?? '',
    operatore: (area.operatori ?? []).join(', '),
    paese: area.paese,
    lat: area.lat,
    lon: area.lon,
    distanza: distanzaKm(lat, lon, area.lat, area.lon),
    colonnine: area.colonnine ?? [],
    // Fuori dal casello (o fuori autostrada) si raggiunge da entrambe le direzioni
    exitRequired: area.accesso !== 'area_servizio',
    isAvanti: false,
    isNearest: false,
    bivio: null,
  };
}

/** Tutte le stazioni ordinate per distanza, senza alcun filtro (es. GPS non disponibile). */
export function tutteLeStazioni(aree, { lat, lon }) {
  return aree.map(a => versoStazione(a, lat, lon)).sort((a, b) => a.distanza - b.distanza);
}

/**
 * Stazioni entro RAGGIO_STAZIONI_KM ordinate per distanza, con isAvanti calcolato da:
 * 1. strada compatibile: codice autostrada (es. "A14") se noto, altrimenti
 *    confronto testuale col nome restituito dal reverse geocoding;
 * 2. stessa carreggiata (salvo stazioni fuori dal casello, raggiungibili da entrambe);
 * 3. stazione davanti rispetto all'heading, non già superata.
 * Con mostraTutte nessun filtro viene applicato e tutte risultano "avanti".
 */
export function filtraStazioni(aree, { lat, lon, heading, strada, codiceAutostrada, paese, mostraTutte }) {
  const stradaUtente = normalizza(strada);

  const candidati = aree
    .map(area => {
      const stazione = versoStazione(area, lat, lon);
      if (!mostraTutte && stazione.distanza > RAGGIO_STAZIONI_KM) return null;

      stazione.isAvanti = mostraTutte || (
        stradaCompatibile(area, codiceAutostrada, stradaUtente, paese) &&
        (stazione.exitRequired || heading == null || stessaDirezione(area.carreggiata, heading)) &&
        (heading == null || isDavanti(lat, lon, heading, area.lat, area.lon))
      );
      return { area, stazione };
    })
    .filter(Boolean);

  if (!mostraTutte && codiceAutostrada && heading != null) {
    aggiungiStazioniDopoIBivi(candidati, { lat, lon, heading, codiceAutostrada, paese });
  }

  const stazioni = candidati.map(c => c.stazione).sort((a, b) => a.distanza - b.distanza);
  const prossima = stazioni.find(s => s.isAvanti && !s.bivio);
  if (prossima) prossima.isNearest = true;
  return stazioni;
}

/**
 * Stazioni sulle autostrade che si staccano a un bivio davanti, entro RAGGIO_STAZIONI_KM di
 * strada stimata (fino al bivio, poi dal bivio alla stazione), sulla carreggiata che si
 * allontana dal bivio. Così chi viaggia le vede senza dover dire dove va: quando poi gira, la
 * nuova autostrada diventa quella attuale.
 */
function aggiungiStazioniDopoIBivi(candidati, { lat, lon, heading, codiceAutostrada, paese }) {
  const biviAvanti = [];
  for (const bivio of biviPronti()) {
    const mia = bivio.strade.findIndex(s => s.sigla === codiceAutostrada && (!paese || s.paese === paese));
    if (mia < 0) continue;
    const distanza = distanzaKm(lat, lon, bivio.lat, bivio.lon);
    if (distanza > RAGGIO_STAZIONI_KM || !isDavanti(lat, lon, heading, bivio.lat, bivio.lon)) continue;
    const altra = bivio.strade[1 - mia];
    const id = `${altra.paese}|${altra.sigla}|${bivio.lat.toFixed(3)},${bivio.lon.toFixed(3)}`;
    biviAvanti.push({ ...bivio, id, distanza, altra });
  }
  if (!biviAvanti.length) return;

  for (const { area, stazione } of candidati) {
    if (stazione.isAvanti) continue;
    for (const bivio of biviAvanti) {
      const { sigla, paese: paeseAltra } = bivio.altra;
      if (area.paese !== paeseAltra || !codiciAutostradali(area.autostrada).includes(sigla)) continue;
      const totale = bivio.distanza + distanzaKm(bivio.lat, bivio.lon, area.lat, area.lon);
      if (totale > RAGGIO_STAZIONI_KM || (stazione.bivio && stazione.distanza <= totale)) continue;
      // Carreggiata di chi si allontana dal bivio (le stazioni fuori dal casello vanno bene in entrambe)
      if (!stazione.exitRequired && !stessaDirezione(area.carreggiata, bearing(bivio.lat, bivio.lon, area.lat, area.lon))) continue;
      stazione.isAvanti = true;
      stazione.distanza = totale;
      stazione.bivio = { id: bivio.id, sigla, distanza: bivio.distanza, lato: null, cardinale: null };
    }
  }

  for (const bivio of biviAvanti) {
    const dopo = candidati.map(c => c.stazione).filter(s => s.bivio?.id === bivio.id);
    if (dopo.length) assegnaSensi(dopo, bivio, { lat, lon, heading });
  }
}

// Fino a questa distanza dal bivio conta l'heading; più lontano la direzione verso il bivio,
// che segue meglio l'andamento dell'autostrada di quanto faccia l'heading del momento
const BIVIO_VICINO_KM = 2;

/**
 * Divide le stazioni dopo un bivio nei due sensi di marcia dell'altra autostrada e assegna a
 * ciascun senso il lato verso cui si gira arrivando al bivio: 'sx' o 'dx'. Con entrambi i
 * sensi presenti uno va a sinistra e l'altro a destra, e ognuno ha il suo punto cardinale.
 * Le direzioni si calcolano sugli spostamenti dal bivio, non sugli angoli: le stazioni lontane
 * pesano di più e indicano l'andamento dell'autostrada meglio di quelle a pochi metri dal bivio.
 */
function assegnaSensi(stazioni, bivio, { lat, lon, heading }) {
  const arrivo = bivio.distanza > BIVIO_VICINO_KM ? bearing(lat, lon, bivio.lat, bivio.lon) : heading;
  const kmPerGradoLon = 111.32 * Math.cos(bivio.lat * Math.PI / 180);
  const conVettore = stazioni.map(s => ({ s, x: (s.lon - bivio.lon) * kmPerGradoLon, y: (s.lat - bivio.lat) * 110.54 }));
  // Riferimento: la stazione più lontana dal bivio; il senso opposto è quello che va dall'altra parte
  const rif = conVettore.reduce((a, b) => (Math.hypot(b.x, b.y) > Math.hypot(a.x, a.y) ? b : a));
  const gruppi = [[], []];
  conVettore.forEach(v => gruppi[v.x * rif.x + v.y * rif.y >= 0 ? 0 : 1].push(v));
  const sensi = gruppi.filter(g => g.length).map(g => {
    const x = g.reduce((somma, v) => somma + v.x, 0), y = g.reduce((somma, v) => somma + v.y, 0);
    const dir = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
    return { g, dir, relativo: differenzaAngolare(dir, arrivo) };
  });
  if (sensi.length === 2) {
    sensi.sort((a, b) => a.relativo - b.relativo);
    sensi[0].lato = 'sx';
    sensi[1].lato = 'dx';
  } else {
    sensi[0].lato = sensi[0].relativo < 0 ? 'sx' : 'dx';
  }
  if (sensi.length === 2) assegnaCardinali(sensi);
  for (const senso of sensi) {
    for (const { s } of senso.g) Object.assign(s.bivio, { lato: senso.lato, cardinale: senso.cardinale ?? null });
  }
}

/**
 * Punti cardinali opposti per i due sensi: N/S se l'autostrada corre più in verticale, E/O se
 * più in orizzontale. Così l'A14 a Pescara è N e S anche se verso Bari scende a sud-est.
 */
function assegnaCardinali([a, b]) {
  const rad = d => d * Math.PI / 180;
  const dx = Math.sin(rad(a.dir)) - Math.sin(rad(b.dir));
  const dy = Math.cos(rad(a.dir)) - Math.cos(rad(b.dir));
  if (Math.abs(dy) >= Math.abs(dx)) [a.cardinale, b.cardinale] = dy > 0 ? ['NORD', 'SUD'] : ['SUD', 'NORD'];
  else [a.cardinale, b.cardinale] = dx > 0 ? ['EST', 'OVEST'] : ['OVEST', 'EST'];
}

function stradaCompatibile(area, codiceAutostrada, stradaUtente, paese) {
  // La stessa sigla indica strade diverse in paesi diversi (A5 in Germania e in Svizzera)
  if (paese && area.paese !== paese) return false;
  // Un'area può stare su un tratto comune a più autostrade ("A11/A12")
  if (codiceAutostrada) return codiciAutostradali(area.autostrada).includes(codiceAutostrada);
  const stradaArea = normalizza(area.indirizzo);
  if (!stradaUtente || !stradaArea) return false;
  return stradaArea.includes(stradaUtente) || stradaUtente.includes(stradaArea);
}

function normalizza(s) {
  return s?.toLowerCase().trim() ?? '';
}
