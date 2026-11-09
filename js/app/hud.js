import { puntoCardinale } from '../core/geo.js';
import { estraiCodice } from '../core/autostrade.js';
import { contaEvento, slugOperatori } from '../statistiche.js';
import { t, km, nomeRamo } from '../i18n.js';
import { filtroOperatoriAttivo, operatoreScelto, testoFiltro, apriOperatori } from './operatori.js';

// Tutto ciò che nell'app di guida non è mappa: HUD, pannelli, barra distanze, tabella.

export function collegaPannelli() {
  const opzioni = document.getElementById('options-panel');
  document.getElementById('options-toggle').addEventListener('click', () => opzioni.classList.toggle('open'));
  document.getElementById('options-close').addEventListener('click', () => opzioni.classList.remove('open'));

  const lista = document.getElementById('stations-list');
  const chevron = document.getElementById('stations-chevron');
  document.getElementById('stations-toggle-btn').addEventListener('click', () => {
    lista.hidden = !lista.hidden;
    chevron.classList.toggle('open', !lista.hidden);
  });

  // La scritta del filtro per operatore nel pannello apre la scelta degli operatori
  document.getElementById('next-station').addEventListener('click', e => {
    if (e.target.closest('.filtro-operatori')) apriOperatori();
  });
}

export function mostraStrada({ strada, codiceAutostrada }) {
  if (!strada) {
    document.getElementById('strada').textContent = '🛣️';
    return;
  }
  const testo = codiceAutostrada && estraiCodice(strada) !== codiceAutostrada
    ? `${codiceAutostrada} – ${strada}`
    : strada;
  document.getElementById('strada').textContent = `🛣️ ${testo}`;
}

export function mostraAvvisoGps() {
  document.getElementById('strada').textContent = t('gpsNonDisponibile');
}

/** L'asterisco indica un heading stimato dallo spostamento anziché letto dal dispositivo. */
export function mostraDirezione({ heading, headingStimato }) {
  document.getElementById('direzione').textContent =
    `🧭 ${heading.toFixed(0)}°${headingStimato ? '*' : ''} (${t(puntoCardinale(heading))})`;
}

// Ultime stazioni ricevute: per ridisegnare quando si apre o si chiude un bivio senza attendere il GPS
let ultimeStazioni = [];
let ultimoRipiego = null;
let ultimaConPosizione = true;

/**
 * ripiego: con il filtro per operatore e nessuna stazione davanti, la più vicina di qualsiasi
 * operatore (calcolata senza filtro), da indicare comunque.
 */
export function aggiornaPannelli(stazioni, { ripiego = null, conPosizione = true } = {}) {
  ultimeStazioni = stazioni;
  ultimoRipiego = ripiego;
  ultimaConPosizione = conPosizione;
  const avanti = stazioni.filter(s => s.isAvanti);
  const bivi = biviDavanti(avanti);
  aggiornaBivioAperto(bivi);
  mostraProssimaStazione(stazioni.find(s => s.isNearest), righeBivioAperto(bivi), ripiego);
  aggiornaBarraDistanze(avanti, bivi);
  aggiornaTabella(stazioni, conPosizione);
}

// Bivio aperto sulla barra (le sue diramazioni sono visibili): uno alla volta.
// Il più vicino si apre da solo a APERTURA_AUTOMATICA_KM, una volta sola: se l'utente lo chiude resta chiuso
let bivioAperto = null;
const biviApertiDaSoli = new Set();
const APERTURA_AUTOMATICA_KM = 5;

/**
 * Bivi davanti che hanno stazioni dopo, in ordine di distanza:
 * [{ id, sigla, distanza, sensi: [{ lato, cardinale, stazioni }] }], sensi con 'sx' per primo.
 */
function biviDavanti(avanti) {
  const perId = new Map();
  for (const s of avanti) {
    if (!s.bivio) continue;
    const { id, sigla, distanza, lato } = s.bivio;
    if (!perId.has(id)) perId.set(id, { id, sigla, distanza, sensi: new Map() });
    const sensi = perId.get(id).sensi;
    if (!sensi.has(lato)) sensi.set(lato, { lato, cardinale: s.bivio.cardinale, stazioni: [] });
    sensi.get(lato).stazioni.push(s);
  }
  return [...perId.values()]
    .map(b => ({ ...b, sensi: [...b.sensi.values()].sort((a, c) => (a.lato === 'sx' ? -1 : c.lato === 'sx' ? 1 : 0)) }))
    .sort((a, b) => a.distanza - b.distanza);
}

function aggiornaBivioAperto(bivi) {
  const ids = new Set(bivi.map(b => b.id));
  // Bivio superato (o non più davanti): si chiude, la nuova autostrada è ormai quella attuale
  if (bivioAperto && !ids.has(bivioAperto)) bivioAperto = null;
  for (const id of biviApertiDaSoli) if (!ids.has(id)) biviApertiDaSoli.delete(id);
  const vicino = bivi[0];
  if (vicino && vicino.distanza <= APERTURA_AUTOMATICA_KM && !biviApertiDaSoli.has(vicino.id)) {
    biviApertiDaSoli.add(vicino.id);
    bivioAperto = vicino.id;
  }
}

function apriChiudiBivio(id) {
  bivioAperto = bivioAperto === id ? null : id;
  aggiornaPannelli(ultimeStazioni, { ripiego: ultimoRipiego, conPosizione: ultimaConPosizione });
  // Il ridisegno ricrea i pulsanti: il focus torna su quello appena toccato
  document.querySelector(`#distance-bar .bar-bivio[data-id="${CSS.escape(id)}"]`)?.focus();
}

/** Righe sotto la prossima stazione: per il bivio aperto, la prima stazione di ogni senso. */
function righeBivioAperto(bivi) {
  const bivio = bivi.find(b => b.id === bivioAperto);
  if (!bivio) return [];
  return bivio.sensi.map(senso => senso.stazioni.reduce((a, b) => (b.distanza < a.distanza ? b : a)));
}

function rigaBivio(s) {
  return `
    <span class="bivio-riga">
      <span class="bivio-sigla">${nomeRamo(s.bivio)}</span>
      <span class="bivio-tra">${t('tra', { km: `${Math.round(s.bivio.distanza)} km` })}</span>
      <span class="bivio-nome">${s.nome}</span>
      <span class="bivio-dist${s.exitRequired ? ' bivio-dist--uscita' : ''}">${s.exitRequired ? '⚠️ ' : ''}${km(s.distanza)}</span>
    </span>`;
}

const escape = testo => String(testo).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Operatori della stazione, con quelli scelti nel filtro in evidenza. */
function testoOperatori(s) {
  if (!filtroOperatoriAttivo()) return s.operatore;
  return s.operatori.map(o => (operatoreScelto(o) ? `<b>${o}</b>` : o)).join(', ');
}

function mostraProssimaStazione(s, dopoIBivi = [], ripiego = null) {
  const pannello = document.getElementById('next-station');
  const bivi = dopoIBivi.length ? `<span class="next-station-bivi">${dopoIBivi.map(rigaBivio).join('')}</span>` : '';
  // Con il filtro per operatore attivo lo si dice sempre: senza, chi guida potrebbe credere
  // che non ci siano colonnine quando sono solo nascoste
  const filtro = filtroOperatoriAttivo()
    ? `<span class="next-station-filtro"><button type="button" class="filtro-operatori">${escape(t('filtroOperatori', { nomi: testoFiltro() }))}</button></span>`
    : '';
  if (!s) {
    const nessuna = filtroOperatoriAttivo() && ripiego
      ? `<span class="next-station-nessuna">${t('nessunaDeiTuoi')}</span>
         <span class="next-station-ripiego">${t('piuVicinaQualsiasi')} <b>${ripiego.nome}</b>${ripiego.operatore ? ` (${ripiego.operatore})` : ''} · ${ripiego.exitRequired ? `⚠️ ${t('uscita')} · ` : ''}${km(ripiego.distanza)}</span>`
      : '<span class="next-station-info">–</span>';
    pannello.innerHTML = `${filtro}${nessuna}${bivi}`;
    return;
  }
  const dettaglio = s.exitRequired
    ? `<span class="next-station-exit">⚠️ ${t('uscita')}</span>`
    : s.direzione ? `<span class="next-station-dir">→ ${s.direzione}</span>` : '';
  pannello.innerHTML = `
    ${filtro}
    <span class="next-station-titolo">
      <span class="next-station-name">${s.nome}</span>
      ${s.operatore ? `<span class="next-station-op">${testoOperatori(s)}</span>` : ''}
    </span>
    ${dettaglio}
    <span class="next-station-dist">${km(s.distanza)}</span>
    ${bivi}
  `;
}

// Stazione di cui è aperto il fumetto nella barra: sopravvive al ridisegno a ogni posizione GPS
let fumettoAperto = null;
let timerFumetto = null;
const DURATA_FUMETTO_MS = 6000;

// Schermo in verticale: barra verticale sul bordo della mappa; in orizzontale: nel pannello in basso
const SCHERMO_VERTICALE = matchMedia('(orientation: portrait)');

// Fondo scala della barra e distanza tra le tacche, scelti in base alla stazione più lontana
const SCALE = [
  { km: 10, passo: 5 }, { km: 20, passo: 5 }, { km: 40, passo: 10 },
  { km: 60, passo: 20 }, { km: 80, passo: 20 }, { km: 100, passo: 25 },
];

// Forcella del pulsante del bivio; nella barra verticale la ruota il CSS
const FORCELLA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h7l8-6M10 12l8 6" /></svg>';

const SPAZIO_BIVI_PX = 24;
const SPAZIO_SIGLE_PX = 44;

const FULMINE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>';

const chiaveStazione = s => `${s.nome}|${s.lat}|${s.lon}`;

/** Altezza del pannello della prossima stazione in --altezza-prossima: la barra verticale ci sta sopra. */
export function seguiAltezzaPannello() {
  const pannello = document.getElementById('next-station');
  const wrapper = document.getElementById('map-wrapper');
  const aggiorna = () => wrapper.style.setProperty('--altezza-prossima', `${pannello.offsetHeight}px`);
  if ('ResizeObserver' in window) new ResizeObserver(aggiorna).observe(pannello);
  aggiorna();
}

/** Sposta la barra tra mappa e pannello quando si gira lo schermo; onCambio dopo ogni spostamento. */
export function collegaOrientamentoBarra(onCambio) {
  const contenitore = document.getElementById('distance-bar-container');
  const applica = () => {
    chiudiFumetto();
    const verticale = SCHERMO_VERTICALE.matches;
    contenitore.classList.toggle('verticale', verticale);
    if (verticale) document.getElementById('map-wrapper').appendChild(contenitore);
    else document.getElementById('bottom-panel').prepend(contenitore);
    onCambio?.();
  };
  SCHERMO_VERTICALE.addEventListener('change', applica);
  applica();
}

function elemento(tag, classe, pos) {
  const el = document.createElement(tag);
  el.className = classe;
  if (pos != null) el.style.setProperty('--pos', pos);
  return el;
}

/** Stazioni avanti lungo la barra: la prossima con un'etichetta, le altre come pallini.
 *  Toccandole si apre un fumetto con i dati: l'attributo title non funziona al tocco. */
function aggiornaBarraDistanze(avanti, bivi) {
  const barra = document.getElementById('distance-bar');
  barra.innerHTML = '';
  const contenitore = document.getElementById('distance-bar-container');
  const aperto = bivi.find(b => b.id === bivioAperto);
  contenitore.classList.toggle('bivio-aperto', Boolean(aperto));
  contenitore.classList.toggle('ramo-dx', Boolean(aperto?.sensi.some(x => x.lato === 'dx')));
  if (avanti.length === 0) return chiudiFumetto();

  const scala = SCALE.find(sc => sc.km >= Math.max(...avanti.map(s => s.distanza)) * 1.1) ?? SCALE.at(-1);
  const pos = km => `${Math.min(km / scala.km, 1) * 100}%`;

  const prossima = avanti.find(s => s.isNearest);
  if (prossima) barra.appendChild(elemento('div', 'bar-percorso', pos(prossima.distanza)));
  for (let km = scala.passo; km <= scala.km; km += scala.passo) {
    const tacca = elemento('div', km === scala.km ? 'bar-tacca bar-tacca--fine' : 'bar-tacca', pos(km));
    tacca.textContent = km;
    barra.appendChild(tacca);
  }

  // Simboli dei bivi distanziati di almeno SPAZIO_BIVI_PX, altrimenti due bivi a pochi km
  // (RA12 e A14 a Pescara) si sovrappongono e non si riesce a toccare quello giusto
  const lunghezza = SCHERMO_VERTICALE.matches ? barra.clientHeight : barra.clientWidth;
  const spazio = lunghezza ? SPAZIO_BIVI_PX / lunghezza * 100 : 0;
  // In orizzontale le sigle sono più larghe dello spazio tra i simboli: senza posto, la sigla
  // del bivio successivo non si mostra (compare nel pannello quando lo si apre)
  const spazioSigla = !SCHERMO_VERTICALE.matches && lunghezza ? SPAZIO_SIGLE_PX / lunghezza * 100 : 0;
  const posBivio = new Map();
  const senzaSigla = new Set();
  let ultima = -Infinity, ultimaSigla = -Infinity;
  for (const b of bivi) {
    ultima = Math.min(Math.max(Math.min(b.distanza / scala.km, 1) * 100, ultima + spazio), 100);
    posBivio.set(b.id, `${ultima}%`);
    if (ultima - ultimaSigla < spazioSigla) senzaSigla.add(b.id);
    else ultimaSigla = ultima;
  }

  // Bivio aperto: per ogni senso di marcia un attacco obliquo e una linea parallela alla barra,
  // da un lato o dall'altro secondo dove si gira; in fondo il nome del senso ("A14 N")
  if (aperto) {
    for (const senso of aperto.sensi) {
      barra.appendChild(elemento('div', `bar-ramo-attacco lato-${senso.lato}`, posBivio.get(aperto.id)));
      const linea = elemento('div', `bar-ramo lato-${senso.lato}`, posBivio.get(aperto.id));
      linea.innerHTML = `<span>${nomeRamo({ ...senso, sigla: aperto.sigla }, false)}</span>`;
      barra.appendChild(linea);
    }
  }

  // Un pulsante per ogni bivio davanti: toccandolo si aprono o si chiudono le diramazioni
  for (const b of bivi) {
    const isAperto = b === aperto;
    // Con un bivio aperto, le sigle dei bivi da lì in avanti finirebbero sulle diramazioni
    const coperto = (aperto && b.distanza >= aperto.distanza) || senzaSigla.has(b.id);
    const pulsante = elemento('button', `bar-bivio${isAperto ? ' bar-bivio--aperto' : ''}${coperto ? ' bar-bivio--coperto' : ''}`, posBivio.get(b.id));
    pulsante.type = 'button';
    pulsante.dataset.id = b.id;
    pulsante.setAttribute('aria-pressed', isAperto);
    pulsante.setAttribute('aria-label', isAperto
      ? t('chiudiBivio', { sigla: b.sigla })
      : t('apriBivio', { sigla: b.sigla, km: km(b.distanza) }));
    pulsante.innerHTML = `${FORCELLA}<span>${b.sigla}</span>`;
    pulsante.addEventListener('click', e => {
      e.stopPropagation();
      apriChiudiBivio(b.id);
    });
    barra.appendChild(pulsante);
  }

  let ancoraPresente = false;
  avanti.forEach(s => {
    // Le stazioni dopo un bivio si vedono solo con il bivio aperto, sulla sua diramazione
    if (s.bivio && s.bivio.id !== bivioAperto) return;
    const uscita = (s.exitRequired ? ' bar-punto--uscita' : '') + (s.bivio ? ' bar-punto--bivio' : '');
    let comando;
    if (s.isNearest) {
      barra.appendChild(elemento('span', `bar-punto bar-punto--prossima${uscita}`, pos(s.distanza)));
      comando = elemento('button', `bar-etichetta${s.exitRequired ? ' bar-etichetta--uscita' : ''}`, pos(s.distanza));
      comando.innerHTML = `${FULMINE}${Math.round(s.distanza)} km`;
    } else {
      const ramo = s.bivio ? ` bar-punto--ramo lato-${s.bivio.lato}` : '';
      comando = elemento('button', `bar-punto${uscita}${ramo}`, pos(s.distanza));
    }
    comando.type = 'button';
    comando.setAttribute('aria-label', `${s.nome}, ${km(s.distanza)}${s.bivio ? `, ${nomeRamo(s.bivio)}` : ''}`);
    comando.addEventListener('click', e => {
      e.stopPropagation();
      if (fumettoAperto === chiaveStazione(s)) return chiudiFumetto();
      fumettoAperto = chiaveStazione(s);
      contaEvento(`tocco/${s.paese}/${slugOperatori(s.operatore)}`, `Tocco su stazione: ${s.operatore || 'operatore sconosciuto'} (${s.paese})`, { guida: true });
      clearTimeout(timerFumetto);
      timerFumetto = setTimeout(chiudiFumetto, DURATA_FUMETTO_MS);
      mostraFumetto(barra, comando, s, pos(s.distanza));
    });
    barra.appendChild(comando);
    if (fumettoAperto === chiaveStazione(s)) {
      ancoraPresente = true;
      mostraFumetto(barra, comando, s, pos(s.distanza));
    }
  });
  if (!ancoraPresente) chiudiFumetto();
}

function mostraFumetto(barra, ancora, s, pos) {
  barra.querySelector('.bar-tooltip')?.remove();
  const fumetto = elemento('div', 'bar-tooltip', pos);
  fumetto.innerHTML = `
    <strong>${s.nome}</strong>
    <span>${s.strada}${s.direzione ? ` → ${s.direzione}` : ''}</span>
    ${s.bivio ? `<span class="bar-tooltip-bivio">${nomeRamo(s.bivio)} · ${t('bivioTra', { km: km(s.bivio.distanza) })}</span>` : ''}
    <span class="bar-tooltip-dist">${km(s.distanza)}${s.exitRequired ? ` · ⚠️ ${t('uscita')}` : ''}</span>
    <span>${s.operatore ? `${s.operatore} · ` : ''}${t('colonnine', { n: s.colonnine.length })}</span>
  `;
  barra.appendChild(fumetto);
  if (SCHERMO_VERTICALE.matches) return;
  // In orizzontale: centrato sulla stazione ma senza uscire dai bordi della barra
  const larghezza = barra.clientWidth;
  const meta = fumetto.offsetWidth / 2;
  fumetto.style.left = `${Math.min(Math.max(ancora.offsetLeft, meta), Math.max(larghezza - meta, meta))}px`;
}

function chiudiFumetto() {
  fumettoAperto = null;
  clearTimeout(timerFumetto);
  document.querySelector('#distance-bar .bar-tooltip')?.remove();
}

// Su iOS un tocco su un elemento non cliccabile non genera "click": si ascolta anche touchstart
['click', 'touchstart'].forEach(evento => document.addEventListener(evento, e => {
  if (fumettoAperto && !e.target.closest('.bar-tooltip, .bar-punto, .bar-etichetta')) chiudiFumetto();
}, { passive: true }));

/**
 * Elenco delle stazioni vicine. Con la posizione in cima quelle davanti, le sole raggiungibili;
 * sotto, in grigio, quelle già superate o su altre strade, che altrimenti si confondono con le
 * prime (distanze in linea d'aria, senza senso di marcia). Senza posizione tutte, per distanza.
 */
function aggiornaTabella(stazioni, conPosizione) {
  const tbody = document.querySelector('#stations-table tbody');
  tbody.innerHTML = '';
  const riga = (s, classe = '') => {
    const tr = document.createElement('tr');
    if (classe) tr.className = classe;
    tr.innerHTML = `
      <td>${s.nome}</td>
      <td class="td-road">${s.bivio ? `<span class="td-bivio">${s.bivio.lato === 'sx' ? '↖' : '↗'}</span> ` : ''}${s.strada}</td>
      <td class="${s.exitRequired ? 'td-exit' : 'td-dist'}">${s.exitRequired ? '⚠️ ' : ''}${km(s.distanza)}</td>
    `;
    tbody.appendChild(tr);
  };
  const etichetta = document.getElementById('stations-count-label');
  if (!conPosizione) {
    stazioni.forEach(s => riga(s));
    etichetta.textContent = t('stazioni', { n: stazioni.length });
    return;
  }
  const davanti = stazioni.filter(s => s.isAvanti);
  const altre = stazioni.filter(s => !s.isAvanti);
  davanti.forEach(s => riga(s));
  if (altre.length) {
    const separatore = document.createElement('tr');
    separatore.className = 'tr-separatore';
    separatore.innerHTML = `<td colspan="3">${t('nonDavanti')}</td>`;
    tbody.appendChild(separatore);
    altre.forEach(s => riga(s, 'tr-non-davanti'));
  }
  etichetta.textContent = t('stazioniDavanti', { n: davanti.length });
}
