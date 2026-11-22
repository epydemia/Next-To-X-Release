import { TILE_GUIDA, CENTRO_ITALIA, ZOOM_GUIDA, RICENTRA_DOPO_MS } from '../config.js';
import { creaSfondo, preparaAttribuzioni } from '../sfondi.js';
import { tracciatoAutostrada } from '../core/reteAutostradale.js';
import { t, km, nomeRamo } from '../i18n.js';
import { simboliRistoroApp } from './ristoro.js';

let map = null;
let markerUtente = null;
let posizioneUtente = null;
// Se Leaflet non si carica la mappa resta vuota, ma il resto dell'app (pannello, barra
// distanze, elenco) deve funzionare: senza L le funzioni qui sotto non fanno nulla
const conLeaflet = typeof L !== 'undefined';
const livelloStazioni = conLeaflet ? L.layerGroup() : null;
const livelloAutostrada = conLeaflet ? L.layerGroup() : null;
let autostradaEvidenziata = null;
// Esplorazione: l'utente ha spostato, zoomato o toccato la mappa. Finché dura la mappa non
// segue la posizione; finisce RICENTRA_DOPO_MS dopo l'ultimo tocco
let esplorazione = false;
let timerRicentra = null;
// true mentre è l'app a muovere la mappa, per non scambiarlo per un gesto dell'utente
let vistaAutomatica = false;

export function creaMappa(idElemento) {
  if (!conLeaflet) {
    console.warn('Leaflet non disponibile: mappa disattivata');
    return;
  }
  map = L.map(idElemento).setView([CENTRO_ITALIA.lat, CENTRO_ITALIA.lon], ZOOM_GUIDA);
  // Prima di aggiungere livelli: spostare il controllo lo ricrea e conterebbe due volte i
  // crediti già presenti, che poi non si potrebbero più sostituire
  compattaAttribuzioni();
  creaSfondo(TILE_GUIDA).addTo(map);
  preparaAttribuzioni(map);
  livelloAutostrada.addTo(map);
  livelloStazioni.addTo(map);

  // Trascinare, zoomare (dita, rotella, bottoni) o aprire un fumetto è esplorare: ogni nuovo
  // gesto fa ripartire l'attesa
  map.on('dragstart drag dragend popupopen', toccoUtente);
  map.on('zoomstart', () => { if (!vistaAutomatica) toccoUtente(); });
  // Anche ogni dito o rotella sulla mappa: i gesti lunghi (pizzico) rimandano il ricentro
  for (const evento of ['pointerdown', 'pointerup', 'wheel']) {
    map.getContainer().addEventListener(evento, toccoUtente, { passive: true });
  }
}

function toccoUtente() {
  esplorazione = true;
  clearTimeout(timerRicentra);
  timerRicentra = setTimeout(() => {
    esplorazione = false;
    if (posizioneUtente) muoviVista([posizioneUtente.lat, posizioneUtente.lon], map.getZoom());
  }, RICENTRA_DOPO_MS);
}

/** setView fatto dall'app, non dall'utente (gli eventi di zoom partono durante la chiamata). */
function muoviVista(centro, zoom) {
  vistaAutomatica = true;
  try {
    map.setView(centro, zoom);
  } finally {
    vistaAutomatica = false;
  }
}

/**
 * Crediti in una riga in fondo, sotto il pannello della prossima stazione: sui telefoni
 * stretti il testo completo andava su più righe e copriva il nome della stazione. Quello che
 * non ci sta finisce con "…" e un tocco mostra tutto (i link restano cliccabili).
 */
function compattaAttribuzioni() {
  const crediti = map.attributionControl;
  crediti.setPosition('bottomleft');
  const elemento = crediti.getContainer();
  elemento.title = t('creditiMappa');
  elemento.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    elemento.classList.toggle('aperta');
  });
}

/** Da chiamare quando cambia lo spazio della mappa (es. la barra distanze si sposta). */
export function aggiornaDimensioniMappa() {
  map?.invalidateSize();
}

export function mostraPanoramicaItalia() {
  if (!map) return;
  muoviVista([CENTRO_ITALIA.lat, CENTRO_ITALIA.lon], 6);
}

/** Sposta il marker utente, ruota la freccia secondo l'heading e centra la mappa (se l'utente non la sta esplorando). */
export function aggiornaUtente({ lat, lon }, heading) {
  if (!map) return;
  // Se la mappa è ancora sulla panoramica (es. GPS arrivato in ritardo) torna allo zoom di guida
  const zoom = posizioneUtente ? map.getZoom() : ZOOM_GUIDA;
  posizioneUtente = { lat, lon };

  if (!markerUtente) {
    const icon = L.divIcon({
      className: 'user-heading-icon',
      html: '<div class="marker-blu"><span class="freccia"><svg viewBox="0 0 24 24"><polygon points="12,0 22,24 2,24" /></svg></span></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    markerUtente = L.marker([lat, lon], { icon }).addTo(map);
  } else {
    markerUtente.setLatLng([lat, lon]);
  }

  const freccia = markerUtente.getElement()?.querySelector('.freccia');
  if (freccia) freccia.style.transform = `rotate(${heading}deg)`;

  // Mentre l'utente esplora la mappa si sposta solo il marker
  if (!esplorazione) muoviVista([lat, lon], zoom);
}

/**
 * Evidenzia l'autostrada percorsa (indice della strada nel tracciato locale, null per
 * nessuna). Si ridisegna solo quando l'autostrada cambia.
 */
export function evidenziaAutostrada(indice) {
  if (!map || indice === autostradaEvidenziata) return;
  autostradaEvidenziata = indice;
  livelloAutostrada.clearLayers();
  if (indice == null) return;
  const tracciati = tracciatoAutostrada(indice);
  // Alone largo e linea sottile sopra: si vede sia sullo sfondo scuro sia sulle altre strade
  L.polyline(tracciati, { color: '#3b9eff', weight: 12, opacity: 0.25, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(livelloAutostrada);
  L.polyline(tracciati, { color: '#3b9eff', weight: 4, opacity: 0.9, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(livelloAutostrada);
}

// Segnaposto delle stazioni sulla mappa, per id: { marker, classe, stazione }
const segnaposto = new Map();

/**
 * Aggiorna i segnaposto delle stazioni. A ogni posizione GPS cambiano poche cose, quindi si
 * tocca solo quello che serve: si aggiungono le stazioni nuove, si tolgono quelle uscite
 * dall'elenco e si cambia l'icona solo a chi cambia stato (prossima, davanti, dietro…).
 * Ricrearli tutti ogni secondo costava quasi tutto il tempo di un aggiornamento e chiudeva il
 * fumetto aperto. Il testo del fumetto si compone quando lo si apre, con i dati più recenti.
 */
export function disegnaStazioni(stazioni) {
  if (!map) return;
  const presenti = new Set();
  for (const s of stazioni) {
    const chiave = s.id ?? `${s.lat},${s.lon}`;
    presenti.add(chiave);
    const [classe, lato] = stileMarker(s);
    const voce = segnaposto.get(chiave);
    if (!voce) {
      const nuova = { marker: L.marker([s.lat, s.lon], { icon: icona(classe, lato), zIndexOffset: sopra(s) }), classe, stazione: s };
      nuova.marker.bindPopup(() => testoPopup(nuova.stazione)).addTo(livelloStazioni);
      segnaposto.set(chiave, nuova);
      continue;
    }
    voce.stazione = s;
    if (voce.classe !== classe) {
      voce.marker.setIcon(icona(classe, lato));
      voce.marker.setZIndexOffset(sopra(s));
      voce.classe = classe;
    }
    if (voce.marker.isPopupOpen()) aggiornaFumetto(voce.marker.getPopup());
  }
  for (const [chiave, voce] of segnaposto) {
    if (presenti.has(chiave)) continue;
    livelloStazioni.removeLayer(voce.marker);
    segnaposto.delete(chiave);
  }
}

/**
 * Rinfresca il testo del fumetto aperto (distanza…) senza l'autoPan di Leaflet, che sposterebbe
 * la mappa sul fumetto a ogni posizione mentre aggiornaUtente la ricentra sull'utente.
 */
function aggiornaFumetto(fumetto) {
  const autoPan = fumetto.options.autoPan;
  fumetto.options.autoPan = false;
  fumetto.update();
  fumetto.options.autoPan = autoPan;
}

// La prossima stazione sopra le altre, anche dove i segnaposto si sovrappongono
const sopra = s => (s.isNearest ? 1000 : 0);

function icona(classe, lato) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="${classe}"></div>`,
    iconSize: [lato, lato],
    iconAnchor: [lato / 2, lato / 2],
  });
}

function stileMarker(s) {
  if (s.isNearest) return [s.exitRequired ? 'marker-uscita-prossima' : 'marker-prossima', 20];
  if (s.isAvanti && s.bivio) return [s.exitRequired ? 'marker-uscita marker-bivio' : 'marker-bivio', 14];
  if (s.isAvanti)  return [s.exitRequired ? 'marker-uscita' : 'marker-rosso', 14];
  return ['marker-grigio', 14];
}

function testoPopup(s) {
  const uscita = s.exitRequired ? `<br>⚠️ ${t('richiedeUscita')}` : '';
  const intestazione = s.isNearest ? `<strong>⚡ ${t('prossimaColonnina')}</strong><br>` : '';
  const direzione = s.isNearest && s.direzione ? `<br>→ ${s.direzione}` : '';
  const operatore = s.operatore ? `<br>🔌 ${s.operatore}` : '';
  const bivio = s.bivio ? `<br>${nomeRamo(s.bivio)} · ${t('bivioTra', { km: km(s.bivio.distanza) })}` : '';
  const ristoro = simboliRistoroApp(s);
  return `${intestazione}<strong>${s.nome}</strong><br>${s.strada}${direzione}${bivio}${operatore}<br>${km(s.distanza)}${uscita}${ristoro ? `<br>${ristoro}` : ''}`;
}
