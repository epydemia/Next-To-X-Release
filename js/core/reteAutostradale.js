import { differenzaAngolare, distanzaKm } from './geo.js';
import { codiceDaNomeStrada, estraiCodice } from './autostrade.js';
import { CARTELLA_DATI, FILE_AUTOSTRADE, AUTOSTRADA_DISTANZA_MAX_M, AUTOSTRADA_ANGOLO_MAX } from '../config.js';

// Riconoscimento locale dell'autostrada: la posizione viene confrontata con il tracciato
// scaricato da OpenStreetMap (data/autostrade.json, generato da tools/Download_OSM_Autostrade.py,
// formato descritto in cima a quello script), senza chiamate di rete durante la guida.

const SCALA = 100_000;
const CELLA_GRADI = 0.01;  // griglia dell'indice spaziale (~1 km)
const M_PER_GRADO_LAT = 110540;
const M_PER_GRADO_LON_EQUATORE = 111320;

let strade = [];
// Data di generazione di autostrade.json: identifica la versione dei dati per la cache dei bivi
let versioneRete = null;
// "riga,colonna" → segmenti che attraversano la cella: [strada, sensoUnico, lat1, lon1, lat2, lon2]
const griglia = new Map();
// Indice di strada → tracciati della stessa autostrada, per evidenziarla sulla mappa
const tracciati = new Map();
let caricamento = null;
// Bivi tra autostrade diverse, calcolati alla prima richiesta (vedi biviAutostradali)
let bivi = null;

const cella = (lat, lon) => `${Math.floor(lat / CELLA_GRADI)},${Math.floor(lon / CELLA_GRADI)}`;

/** Scarica e indicizza la rete; le chiamate successive riusano lo stesso caricamento. */
export function caricaReteAutostradale() {
  caricamento ??= fetch(CARTELLA_DATI + FILE_AUTOSTRADE)
    .then(res => {
      if (!res.ok) throw new Error(`${FILE_AUTOSTRADE}: HTTP ${res.status}`);
      return res.json();
    })
    .then(dati => {
      strade = dati.strade;
      versioneRete = dati.generato ?? null;
      dati.linee.forEach(indicizzaLinea);
      raggruppaTracciati(dati.linee);
    });
  return caricamento;
}

function indicizzaLinea([strada, sensoUnico, lat0, lon0, ...differenze]) {
  let lat = lat0 / SCALA, lon = lon0 / SCALA;
  for (let i = 0; i < differenze.length; i += 2) {
    const lat2 = lat + differenze[i] / SCALA, lon2 = lon + differenze[i + 1] / SCALA;
    const segmento = [strada, sensoUnico, lat, lon, lat2, lon2];
    // Il segmento va in tutte le celle del suo rettangolo: i tratti dritti semplificati sono lunghi
    for (let r = Math.floor(Math.min(lat, lat2) / CELLA_GRADI); r <= Math.floor(Math.max(lat, lat2) / CELLA_GRADI); r++) {
      for (let c = Math.floor(Math.min(lon, lon2) / CELLA_GRADI); c <= Math.floor(Math.max(lon, lon2) / CELLA_GRADI); c++) {
        const chiave = `${r},${c}`;
        if (!griglia.has(chiave)) griglia.set(chiave, []);
        griglia.get(chiave).push(segmento);
      }
    }
    lat = lat2;
    lon = lon2;
  }
}

// Le strade con lo stesso paese e la stessa sigla sono un'unica autostrada: in OSM l'A1, per
// esempio, è spezzata in più tratte con nomi diversi. Alcune tratte non hanno la sigla ma solo
// il nome (l'A14 tra Castel San Pietro e Imola è solo "Autostrada Adriatica"): la sigla si
// ricava da un'altra tratta con lo stesso nome o, in Italia, dalla tabella delle autostrade.
function raggruppaTracciati(linee) {
  const siglaPerNome = new Map();
  strade.forEach(({ paese, codice, nome }) => {
    if (codice && nome && !siglaPerNome.has(`${paese}|${nome}`)) siglaPerNome.set(`${paese}|${nome}`, codice);
  });
  const chiave = ({ paese, codice, nome }) => {
    const sigla = codice || siglaPerNome.get(`${paese}|${nome}`) || (paese === 'IT' ? codiceDaNomeStrada(nome) : null);
    return `${paese}|${sigla || 'nome:' + nome}`;
  };
  const perChiave = new Map();
  for (const [strada, , lat0, lon0, ...differenze] of linee) {
    const punti = [[lat0 / SCALA, lon0 / SCALA]];
    for (let i = 0; i < differenze.length; i += 2) {
      const [lat, lon] = punti[punti.length - 1];
      punti.push([lat + differenze[i] / SCALA, lon + differenze[i + 1] / SCALA]);
    }
    const k = chiave(strade[strada]);
    if (!perChiave.has(k)) perChiave.set(k, []);
    perChiave.get(k).push(punti);
  }
  strade.forEach((s, i) => tracciati.set(i, perChiave.get(chiave(s)) ?? []));
}

/** Tracciati (liste di [lat, lon]) dell'autostrada a cui appartiene la strada indicata. */
export function tracciatoAutostrada(indice) {
  return tracciati.get(indice) ?? [];
}

/** Sigla di una strada della rete ("A14"), anche quando in OSM ha solo il nome; null se ignota. */
export function siglaStrada({ codice, nome }) {
  return estraiCodice(codice) ?? estraiCodice(nome) ?? codiceDaNomeStrada(nome);
}

// Due autostrade si collegano dove le loro carreggiate passano a meno di BIVIO_DISTANZA_M:
// nei dati ci sono solo le carreggiate, non le rampe, quindi a un bivio a T l'autostrada che
// comincia finisce qualche centinaio di metri prima dell'altra. I punti di contatto della stessa
// coppia entro BIVIO_RAGGRUPPA_KM sono un solo bivio.
const BIVIO_DISTANZA_M = 1000;
const BIVIO_RAGGRUPPA_KM = 3;

/** Bivi già pronti (vedi preparaBivi), senza mai calcolarli: [] finché non lo sono. */
export function biviPronti() {
  return bivi ?? [];
}

/**
 * Bivi tra autostrade: [{ lat, lon, strade: [{ paese, sigla }, { paese, sigla }] }], uno per
 * coppia di autostrade e luogo. Vuoto finché la rete non è caricata.
 */
export function biviAutostradali() {
  if (!bivi && strade.length) bivi = leggiBiviSalvati() ?? salvaBivi(calcolaBivi());
  return bivi ?? [];
}

/**
 * Calcola i bivi quando il telefono è libero, dopo il caricamento della rete: il calcolo
 * richiede qualche centinaio di millisecondi e non deve bloccare la prima posizione.
 * Il risultato resta salvato nel browser finché autostrade.json non cambia.
 */
export function preparaBivi() {
  const calcola = () => biviAutostradali();
  if ('requestIdleCallback' in window) requestIdleCallback(calcola, { timeout: 3000 });
  else setTimeout(calcola, 500);
}

const CHIAVE_BIVI = 'biviAutostradali';

function leggiBiviSalvati() {
  try {
    const salvati = JSON.parse(localStorage.getItem(CHIAVE_BIVI));
    return versioneRete && salvati?.versione === versioneRete ? salvati.bivi : null;
  } catch {
    return null;
  }
}

function salvaBivi(calcolati) {
  try {
    if (versioneRete) localStorage.setItem(CHIAVE_BIVI, JSON.stringify({ versione: versioneRete, bivi: calcolati }));
  } catch { /* spazio pieno o navigazione privata: si ricalcolano alla prossima apertura */ }
  return calcolati;
}

function calcolaBivi() {
  const chiavi = strade.map(s => {
    const sigla = siglaStrada(s);
    return sigla ? `${s.paese}|${sigla}` : null;
  });
  // Per ogni cella la "minima" e la "massima" autostrada presenti (in ordine di chiave): due celle
  // vicine vanno confrontate solo se la massima dell'una supera la minima dell'altra, cioè se
  // lì si avvicinano due autostrade diverse. Sono poche rispetto al totale
  const celle = new Map();
  for (const [chiave, segmenti] of griglia) {
    let min = null, max = null;
    for (const seg of segmenti) {
      const k = chiavi[seg[0]];
      if (!k) continue;
      if (min === null || k < min) min = k;
      if (max === null || k > max) max = k;
    }
    if (min !== null) celle.set(chiave, { segmenti, min, max });
  }
  // coppia "IT|A1~IT|A14" → luogo arrotondato → punto di contatto [lat, lon]
  const contatti = new Map();
  for (const [cellaChiave, { segmenti, min }] of celle) {
    const virgola = cellaChiave.indexOf(',');
    const r = Number(cellaChiave.slice(0, virgola)), c = Number(cellaChiave.slice(virgola + 1));
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const vicina = celle.get(`${r + dr},${c + dc}`);
        // Ogni coppia si guarda in un verso solo (chiave di b maggiore di quella di a)
        if (!vicina || vicina.max <= min) continue;
        for (const a of segmenti) {
          const ka = chiavi[a[0]];
          if (!ka) continue;
          for (const b of vicina.segmenti) {
            const kb = chiavi[b[0]];
            if (!kb || kb <= ka || lontani(a, b)) continue;
            const punto = puntoDiContatto(a, b);
            if (!punto) continue;
            // Lo stesso segmento lungo sta in più celle: un punto per luogo (~100 m) basta
            const idCoppia = `${ka}~${kb}`;
            if (!contatti.has(idCoppia)) contatti.set(idCoppia, new Map());
            contatti.get(idCoppia).set(`${Math.round(punto[0] * 1000)},${Math.round(punto[1] * 1000)}`, punto);
          }
        }
      }
    }
  }

  const risultato = [];
  for (const [idCoppia, perLuogo] of contatti) {
    const punti = [...perLuogo.values()];
    const strade2 = idCoppia.split('~').map(k => {
      const [paese, sigla] = k.split('|');
      return { paese, sigla };
    });
    for (const gruppo of raggruppa(punti)) {
      const lat = gruppo.reduce((somma, p) => somma + p[0], 0) / gruppo.length;
      const lon = gruppo.reduce((somma, p) => somma + p[1], 0) / gruppo.length;
      risultato.push({ lat, lon, strade: strade2 });
    }
  }
  return risultato;
}

// ~1,1 km in latitudine, ~0,8 km in longitudine alle nostre latitudini: per difetto, così il
// filtro scarta solo coppie sicuramente più lontane di BIVIO_DISTANZA_M
const MARGINE_GRADI = 0.015;

/** True se i rettangoli dei due segmenti sono troppo distanti per toccarsi: test veloce. */
function lontani([, , aLat1, aLon1, aLat2, aLon2], [, , bLat1, bLon1, bLat2, bLon2]) {
  return Math.max(aLat1, aLat2) + MARGINE_GRADI < Math.min(bLat1, bLat2)
    || Math.max(bLat1, bLat2) + MARGINE_GRADI < Math.min(aLat1, aLat2)
    || Math.max(aLon1, aLon2) + MARGINE_GRADI < Math.min(bLon1, bLon2)
    || Math.max(bLon1, bLon2) + MARGINE_GRADI < Math.min(aLon1, aLon2);
}

/** Punto medio tra i due segmenti se distano meno di BIVIO_DISTANZA_M, altrimenti null. */
function puntoDiContatto([, , aLat1, aLon1, aLat2, aLon2], [, , bLat1, bLon1, bLat2, bLon2]) {
  const lat0 = aLat1, lon0 = aLon1;
  const mPerGradoLon = M_PER_GRADO_LON_EQUATORE * Math.cos(lat0 * Math.PI / 180);
  const xy = (lat, lon) => [(lon - lon0) * mPerGradoLon, (lat - lat0) * M_PER_GRADO_LAT];
  const a1 = xy(aLat1, aLon1), a2 = xy(aLat2, aLon2), b1 = xy(bLat1, bLon1), b2 = xy(bLat2, bLon2);
  let migliore = null;
  const prova = (p, q1, q2) => {
    const [vicino, distanza] = puntoSuSegmento(p, q1, q2);
    if (!migliore || distanza < migliore.distanza) migliore = { distanza, p, vicino };
  };
  if (siIncrociano(a1, a2, b1, b2)) {
    const [x, y] = intersezione(a1, a2, b1, b2);
    migliore = { distanza: 0, p: [x, y], vicino: [x, y] };
  } else {
    prova(a1, b1, b2); prova(a2, b1, b2); prova(b1, a1, a2); prova(b2, a1, a2);
  }
  if (migliore.distanza > BIVIO_DISTANZA_M) return null;
  const x = (migliore.p[0] + migliore.vicino[0]) / 2, y = (migliore.p[1] + migliore.vicino[1]) / 2;
  return [lat0 + y / M_PER_GRADO_LAT, lon0 + x / mPerGradoLon];
}

function puntoSuSegmento([px, py], [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2)) : 0;
  const q = [x1 + t * dx, y1 + t * dy];
  return [q, Math.hypot(px - q[0], py - q[1])];
}

const vettoriale = ([ax, ay], [bx, by], [cx, cy]) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);

function siIncrociano(a1, a2, b1, b2) {
  const d1 = vettoriale(b1, b2, a1), d2 = vettoriale(b1, b2, a2);
  const d3 = vettoriale(a1, a2, b1), d4 = vettoriale(a1, a2, b2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function intersezione(a1, a2, b1, b2) {
  const d1 = vettoriale(b1, b2, a1), d2 = vettoriale(b1, b2, a2);
  const t = d1 / (d1 - d2);
  return [a1[0] + t * (a2[0] - a1[0]), a1[1] + t * (a2[1] - a1[1])];
}

/** Gruppi di punti in cui ogni punto dista meno di BIVIO_RAGGRUPPA_KM da un altro del gruppo. */
function raggruppa(punti) {
  const gruppi = [];
  for (const p of punti) {
    const vicini = gruppi.filter(g => g.some(q => distanzaKm(p[0], p[1], q[0], q[1]) < BIVIO_RAGGRUPPA_KM));
    const unito = [p, ...vicini.flat()];
    vicini.forEach(g => gruppi.splice(gruppi.indexOf(g), 1));
    gruppi.push(unito);
  }
  return gruppi;
}

/**
 * Autostrada su cui si trova il punto: { paese, codice, nome, indice, distanzaM }, oppure null
 * (fuori autostrada o rete non ancora caricata). Con heading noto si scartano le carreggiate
 * percorse nel verso opposto e le strade che incrociano: evita di agganciare un'altra
 * autostrada a uno svincolo o la carreggiata opposta.
 */
export function autostradaInPosizione(lat, lon, heading) {
  const [r, c] = cella(lat, lon).split(',').map(Number);
  const mPerGradoLon = M_PER_GRADO_LON_EQUATORE * Math.cos(lat * Math.PI / 180);
  let migliore = null;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      for (const [strada, sensoUnico, lat1, lon1, lat2, lon2] of griglia.get(`${r + dr},${c + dc}`) ?? []) {
        // Piano locale in metri con origine nel punto
        const ax = (lon1 - lon) * mPerGradoLon, ay = (lat1 - lat) * M_PER_GRADO_LAT;
        const bx = (lon2 - lon) * mPerGradoLon, by = (lat2 - lat) * M_PER_GRADO_LAT;
        const dx = bx - ax, dy = by - ay;
        const lunghezza2 = dx * dx + dy * dy;
        const t = lunghezza2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lunghezza2)) : 0;
        const distanzaM = Math.hypot(ax + t * dx, ay + t * dy);
        if (distanzaM > AUTOSTRADA_DISTANZA_MAX_M || (migliore && distanzaM >= migliore.distanzaM)) continue;

        if (heading != null && lunghezza2) {
          const direzione = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
          const scarto = Math.abs(differenzaAngolare(direzione, heading));
          if ((sensoUnico ? scarto : Math.min(scarto, 180 - scarto)) > AUTOSTRADA_ANGOLO_MAX) continue;
        }
        migliore = { ...strade[strada], indice: strada, distanzaM };
      }
    }
  }
  return migliore;
}
