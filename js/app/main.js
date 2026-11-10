import { caricaAree, versioneDati } from '../core/dati.js';
import { caricaReteAutostradale, preparaBivi } from '../core/reteAutostradale.js';
import { filtraStazioni, tutteLeStazioni } from '../core/filtroStazioni.js';
import { avviaPosizione, attendiPrimaPosizione, getStato, motivoSenzaPosizione } from './posizione.js';
import { caricaTracciaCSV, osservaProgresso, vaiAlPunto } from './simulazione.js';
import { creaMappa, aggiornaUtente, disegnaStazioni, evidenziaAutostrada, mostraPanoramicaItalia, aggiornaDimensioniMappa } from './mappa.js';
import {
  collegaPannelli, collegaOrientamentoBarra, seguiAltezzaPannello, mostraStrada, mostraDirezione, aggiornaPannelli,
} from './hud.js';
import { attendiAvvertenze } from './avvertenze.js';
import { attendiConsensoPosizione, mostraAvvisoPosizione, segnaPosizioneConcessa } from './permessoPosizione.js';
import { collegaOperatori, impostaAreeOperatori, passaFiltroOperatori, filtroOperatoriAttivo } from './operatori.js';
import { t, traduciPagina } from '../i18n.js';
import { VERSIONE_APP } from '../versione.js';
import { ATTESA_GPS_MS, CENTRO_ITALIA } from '../config.js';
import {
  contaPagina, contaEvento, slugOperatori, statisticheAttive, impostaStatistiche, segnaSimulazione,
} from '../statistiche.js';

// Subito, prima di ogni attesa: i testi della pagina nella lingua del browser
traduciPagina();

const CHIAVE_SIMULAZIONE = 'debugPosizione';
// La simulazione è uno strumento di sviluppo: compare solo aprendo la pagina con ?debug=true
const MODALITA_DEBUG = ['true', '1'].includes(new URLSearchParams(location.search).get('debug'));

let aree = [];
let mostraTutte = false;

// "Solo aree di servizio": nasconde le colonnine fuori dal casello e fuori autostrada
const CHIAVE_SOLO_AREE = 'soloAreeServizio';
let soloAreeServizio = leggiPreferenza(CHIAVE_SOLO_AREE);

function leggiPreferenza(chiave) {
  try {
    return localStorage.getItem(chiave) === '1';
  } catch {
    return false;
  }
}

function salvaPreferenza(chiave, attiva) {
  try {
    localStorage.setItem(chiave, attiva ? '1' : '0');
  } catch { /* non salvabile (es. navigazione privata): vale per questa sessione */ }
}

/** Aree con "Solo aree di servizio" applicato, senza il filtro per operatore. */
function areeSenzaFiltroOperatori() {
  return soloAreeServizio ? aree.filter(a => a.accesso === 'area_servizio') : aree;
}

/** Aree da mostrare: impostazioni "Solo aree di servizio" e filtro per operatore. */
function areeVisibili() {
  const base = areeSenzaFiltroOperatori();
  return filtroOperatoriAttivo() ? base.filter(passaFiltroOperatori) : base;
}

/** Ridisegna tutto dopo un cambio di impostazioni che cambia le aree visibili. */
function ridisegna() {
  if (getStato().coords) aggiorna(getStato());
  else if (aree.length) mostraSenzaPosizione();
}

/** Senza GPS: tutte le stazioni, centrate sull'Italia. */
function mostraSenzaPosizione() {
  const stazioni = tutteLeStazioni(areeVisibili(), CENTRO_ITALIA);
  disegnaStazioni(stazioni);
  aggiornaPannelli(stazioni, { conPosizione: false });
}

// Stazioni già conteggiate come "prossima" in questa visita: ognuna una volta sola
const prossimeContate = new Set();

function contaProssima(s) {
  const chiave = `${s.nome}|${s.lat}|${s.lon}`;
  if (prossimeContate.has(chiave)) return;
  prossimeContate.add(chiave);
  contaEvento(`prossima/${s.paese}/${slugOperatori(s.operatore)}`, `Prossima stazione: ${s.operatore || 'operatore sconosciuto'} (${s.paese})`, { guida: true });
}

// Avvio senza posizione entro il tempo d'attesa: se poi arriva lo si conta (una volta), per
// capire se l'attesa è troppo breve
let posizioneInRitardo = false;

function aggiorna(stato) {
  if (!stato.coords) return;
  if (posizioneInRitardo) {
    posizioneInRitardo = false;
    segnaPosizioneConcessa();
    contaEvento('avvio/gps-in-ritardo', 'Posizione arrivata dopo il tempo d\'attesa');
  }
  aggiornaUtente(stato.coords, stato.heading);
  evidenziaAutostrada(stato.autostrada);
  mostraStrada(stato);
  mostraDirezione(stato);

  const { heading, strada, codiceAutostrada, paese } = stato;
  const parametri = { ...stato.coords, heading, strada, codiceAutostrada, paese, mostraTutte };
  const stazioni = filtraStazioni(areeVisibili(), parametri);
  disegnaStazioni(stazioni);
  // Filtro per operatore senza nessuna stazione davanti: si indica comunque la più vicina di
  // qualsiasi operatore, così il filtro non lascia mai senza un'alternativa
  const ripiego = filtroOperatoriAttivo() && !stazioni.some(s => s.isNearest)
    ? filtraStazioni(areeSenzaFiltroOperatori(), parametri).find(s => s.isNearest)
    : null;
  aggiornaPannelli(stazioni, { ripiego });
  const prossima = stazioni.find(s => s.isNearest);
  if (prossima) contaProssima(prossima);
}

/** In fondo alle impostazioni: versione dell'app (tag della release, "sviluppo" in locale). */
function mostraVersioneApp() {
  document.getElementById('versione-app').textContent = t('versioneApp', { versione: VERSIONE_APP ?? t('versioneSviluppo') });
}

/** In fondo alle impostazioni: da quale compilazione di data/aree.json vengono le stazioni. */
function mostraVersioneDati() {
  const versione = versioneDati();
  const riga = document.getElementById('versione-dati');
  if (!versione || !riga) return;
  riga.textContent = t('versioneDati', { versione });
  riga.hidden = false;
}

function collegaImpostazioni(simulazione) {
  document.getElementById('riga-simulazione').hidden = !MODALITA_DEBUG;
  const toggleSimulazione = document.getElementById('toggleDebug');
  toggleSimulazione.checked = simulazione;
  // Cambiare sorgente di posizione richiede di reinizializzare tutto: si ricarica la pagina
  toggleSimulazione.addEventListener('change', e => {
    localStorage.setItem(CHIAVE_SIMULAZIONE, e.target.checked ? '1' : '0');
    location.reload();
  });

  const toggleStatistiche = document.getElementById('toggleStatistiche');
  toggleStatistiche.checked = statisticheAttive();
  toggleStatistiche.addEventListener('change', e => impostaStatistiche(e.target.checked));

  document.getElementById('toggleNearest').addEventListener('change', e => {
    mostraTutte = e.target.checked;
    aggiorna(getStato());
  });

  const toggleSoloAree = document.getElementById('toggleSoloAree');
  toggleSoloAree.checked = soloAreeServizio;
  toggleSoloAree.addEventListener('change', e => {
    soloAreeServizio = e.target.checked;
    salvaPreferenza(CHIAVE_SOLO_AREE, soloAreeServizio);
    ridisegna();
  });

  collegaOperatori(ridisegna);

  document.getElementById('csv-debug-section').hidden = !simulazione;
  document.getElementById('csvInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const punti = caricaTracciaCSV(await file.text());
    document.getElementById('csvStatus').textContent =
      punti ? t('puntiCaricati', { file: file.name, n: punti }) : t('formatoNonValido');
  });

  collegaCursoreSimulazione(simulazione);
}

// Il cursore si può nascondere, per esempio per fare screenshot puliti della simulazione
const CHIAVE_NASCONDI_CURSORE = 'nascondiCursoreSimulazione';

/** Cursore sulla mappa per scorrere avanti e indietro lungo la traccia simulata. */
function collegaCursoreSimulazione(simulazione) {
  const pannello = document.getElementById('sim-cursore');
  pannello.hidden = true;
  document.getElementById('riga-cursore').hidden = !simulazione;
  if (!simulazione) return;

  const toggleCursore = document.getElementById('toggleCursore');
  toggleCursore.checked = !leggiPreferenza(CHIAVE_NASCONDI_CURSORE);
  pannello.hidden = !toggleCursore.checked;
  toggleCursore.addEventListener('change', e => {
    pannello.hidden = !e.target.checked;
    salvaPreferenza(CHIAVE_NASCONDI_CURSORE, !e.target.checked);
  });

  const cursore = document.getElementById('simSlider');
  const tempo = document.getElementById('simTempo');
  cursore.addEventListener('input', e => vaiAlPunto(Number(e.target.value)));
  osservaProgresso(({ indice, totale, trascorsoMs, durataMs }) => {
    cursore.max = totale - 1;
    cursore.value = indice;
    tempo.textContent = `${formattaDurata(trascorsoMs)} / ${formattaDurata(durataMs)}`;
  });
}

function formattaDurata(ms) {
  const s = Math.round(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  return `${hh}:${mm}:${String(s % 60).padStart(2, '0')}`;
}

window.addEventListener('load', async () => {
  // Senza ?debug=true si usa sempre il GPS, anche se la simulazione era rimasta attiva
  const simulazione = MODALITA_DEBUG && localStorage.getItem(CHIAVE_SIMULAZIONE) === '1';

  // I controlli vanno collegati prima di ogni await, così rispondono anche senza GPS
  collegaPannelli();
  collegaImpostazioni(simulazione);
  mostraVersioneApp();
  creaMappa('map');
  segnaSimulazione(simulazione);
  contaPagina('/app', 'App di guida');
  // Aperta dall'icona sulla schermata Home (app installata) o nel browser
  const installata = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  contaEvento(installata ? 'apertura/schermata-home' : 'apertura/browser');
  collegaOrientamentoBarra(aggiornaDimensioniMappa);
  seguiAltezzaPannello();

  // Senza la rete autostradale l'app funziona lo stesso: la strada la dà Nominatim
  const rete = caricaReteAutostradale()
    // Bivi tra autostrade, per mostrare anche le stazioni dopo un bivio: calcolati quando il telefono è libero
    .then(preparaBivi)
    .catch(err => console.warn('Rete autostradale non disponibile:', err));
  aree = await caricaAree();
  impostaAreeOperatori(aree);
  mostraVersioneDati();
  await rete;
  // Il permesso di posizione si chiede dopo le avvertenze, non sopra di esse. Al primo avvio
  // la spiegazione del permesso è nelle avvertenze; poi, a chi non l'ha mai dato, una finestra apposta.
  const avvertenzeMostrate = await attendiAvvertenze();
  if (simulazione || avvertenzeMostrate || await attendiConsensoPosizione()) {
    await avviaGps(simulazione, 'avvio');
  } else {
    contaEvento('avvio/gps-senza-consenso');
    // Toccando l'avviso in alto il GPS parte più tardi
    mostraAvvisoPosizione('senza-consenso', () => avviaGps(false, 'avvio-rimandato'));
    mostraPanoramicaItalia();
    mostraSenzaPosizione();
  }
});

/**
 * Avvia GPS o simulazione e attende la prima posizione; senza, mostra la panoramica e
 * l'avviso con le istruzioni. evento: prefisso dei conteggi ('avvio' o 'avvio-rimandato').
 */
async function avviaGps(simulazione, evento) {
  avviaPosizione({ simulazione, onAggiornamento: aggiorna });

  const posizione = await attendiPrimaPosizione(ATTESA_GPS_MS);
  if (simulazione) contaEvento(`${evento}/simulazione`);
  else if (posizione) {
    segnaPosizioneConcessa();
    contaEvento(`${evento}/gps`);
  } else {
    // avvio/gps-negato, -permesso-in-attesa, -nessun-segnale, -non-supportato
    const motivo = await motivoSenzaPosizione();
    contaEvento(`${evento}/gps-${motivo}`);
    posizioneInRitardo = !getStato().coords;
    if (posizioneInRitardo) mostraAvvisoPosizione(motivo);
  }
  if (!posizione) {
    mostraPanoramicaItalia();
    mostraSenzaPosizione();
  }
}
