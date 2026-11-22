import { caricaAree, versioneDati } from '../core/dati.js';
import { caricaReteAutostradale, preparaBivi } from '../core/reteAutostradale.js';
import { filtraStazioni, tutteLeStazioni, stazioniEntro } from '../core/filtroStazioni.js';
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
import { aggiornaSegnalazione, collegaSegnalazione, RAGGIO_SEGNALAZIONE_KM } from './segnalazione.js';
import { ATTESA_GPS_MS, CENTRO_ITALIA } from '../config.js';
import { MODALITA_DEBUG } from './debug.js';
import {
  contaPagina, contaEvento, slugOperatori, statisticheAttive, impostaStatistiche, segnaSimulazione,
} from '../statistiche.js';

// Subito, prima di ogni attesa: i testi della pagina nella lingua del browser
traduciPagina();
// Le guide per autostrada nella lingua dell'interfaccia (tools/genera_guide.mjs)
document.getElementById('link-guide').href = t('cartellaGuide');

const CHIAVE_SIMULAZIONE = 'debugPosizione';
// La simulazione è uno strumento di sviluppo: compare solo aprendo la pagina con ?debug=true

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
  // Da fermi vicino a una stazione (qualsiasi, anche filtrata o alle spalle) o in autostrada
  aggiornaSegnalazione({ ...stato.coords, velocita: stato.velocita }, stazioniEntro(aree, stato.coords, RAGGIO_SEGNALAZIONE_KM), Boolean(stato.codiceAutostrada));
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

const CHIAVE_ULTIMA_APERTURA = 'ultimaApertura';
const CHIAVE_PRIMA_APERTURA = 'primaApertura';
const CHIAVE_GIORNI_USO = 'giorniUso';
const GIORNO_MS = 24 * 60 * 60 * 1000;

/**
 * Prima volta su questo telefono o ritorno (entro 7 giorni o dopo), per capire quanti tornano.
 * La data dell'ultima apertura resta nel telefono: a GoatCounter va solo la categoria.
 * Chi cancella i dati del browser o naviga in privato risulta "prima volta".
 * Alla prima apertura di ogni giorno anche la fedeltà (eventiFedelta).
 */
function eventiApertura(adesso = Date.now()) {
  let precedente = null;
  let eventi = [];
  try {
    precedente = Number(localStorage.getItem(CHIAVE_ULTIMA_APERTURA)) || null;
    eventi = eventiFedelta(precedente, adesso);
    localStorage.setItem(CHIAVE_ULTIMA_APERTURA, String(adesso));
  } catch { /* non salvabile (es. navigazione privata) */ }
  const tipo = !precedente ? 'apertura/prima-volta'
    : adesso - precedente <= 7 * GIORNO_MS ? 'apertura/ritorno-entro-7-giorni' : 'apertura/ritorno-dopo-7-giorni';
  return [tipo, ...eventi];
}

/** Giorno di calendario locale, come numero (giorni dal 1970) */
function giorno(ms) {
  const d = new Date(ms);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / GIORNO_MS);
}

/**
 * Fedeltà, una volta al giorno per telefono (quindi i conteggi sono di telefoni, non di aperture):
 * in quanti giorni diversi è stata usata l'app (fedelta/giorni-uso/…) e quanti giorni sono
 * passati dalla prima apertura (fedelta/da-prima/…). Nel telefono restano la data della prima
 * apertura e il numero di giorni d'uso; a GoatCounter va solo la fascia.
 * Sui telefoni che avevano già l'app prima di questo conteggio la prima apertura è sconosciuta:
 * vale la data dell'ultima apertura salvata, quindi le loro fasce sono per difetto.
 */
function eventiFedelta(precedente, adesso) {
  const oggi = giorno(adesso);
  if (precedente && giorno(precedente) === oggi) return [];
  const prima = Number(localStorage.getItem(CHIAVE_PRIMA_APERTURA)) || precedente || adesso;
  // Senza il contatore, chi aveva già aperto l'app ha almeno un giorno d'uso prima di oggi
  const giorni = (Number(localStorage.getItem(CHIAVE_GIORNI_USO)) || (precedente ? 1 : 0)) + 1;
  localStorage.setItem(CHIAVE_PRIMA_APERTURA, String(prima));
  localStorage.setItem(CHIAVE_GIORNI_USO, String(giorni));
  const daPrima = oggi - giorno(prima);
  return [
    `fedelta/giorni-uso/${giorni >= 11 ? '11-o-piu' : giorni >= 6 ? '6-10' : giorni >= 3 ? '3-5' : giorni}`,
    `fedelta/da-prima/${daPrima === 0 ? 'oggi' : daPrima <= 7 ? '1-7-giorni' : daPrima <= 30 ? '8-30-giorni' : 'oltre-30-giorni'}`,
  ];
}

window.addEventListener('load', async () => {
  // Senza ?debug=true si usa sempre il GPS, anche se la simulazione era rimasta attiva
  const simulazione = MODALITA_DEBUG && localStorage.getItem(CHIAVE_SIMULAZIONE) === '1';

  // I controlli vanno collegati prima di ogni await, così rispondono anche senza GPS
  collegaPannelli();
  collegaSegnalazione();
  collegaImpostazioni(simulazione);
  mostraVersioneApp();
  creaMappa('map');
  segnaSimulazione(simulazione);
  contaPagina('/app', 'App di guida');
  // Aperta dall'icona sulla schermata Home (app installata) o nel browser
  const installata = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  contaEvento(installata ? 'apertura/schermata-home' : 'apertura/browser');
  for (const evento of eventiApertura()) contaEvento(evento);
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
