// Segnalazioni dagli utenti: colonnina mancante, guasta, diversa, spostata o nuova.
//
// Il pulsante "⚑ Segnala" compare solo da fermi (FERMO_DOPO_MS senza spostarsi più di
// FERMO_RAGGIO_M) vicino a una stazione nota (entro VICINO_M) o in autostrada: chi segnala è
// sul posto e non sta guidando. Il form prepara un'email a INDIRIZZO, che l'utente vede e
// invia dalla sua app di posta (niente server). La posizione va nell'email solo se l'utente
// la spunta.

import { t, lingua } from '../i18n.js';
import { distanzaKm } from '../core/geo.js';
import { versioneDati } from '../core/dati.js';
import { VERSIONE_APP } from '../versione.js';
import { contaEvento } from '../statistiche.js';

const INDIRIZZO = ['info', 'nexttox.com'].join('@');
const FERMO_DOPO_MS = 30_000;
const FERMO_RAGGIO_M = 40;
// Sopra questa velocità del GPS (m/s, ~11 km/h) si è in movimento anche se la posizione oscilla poco
const IN_MOVIMENTO_MS = 3;
const VICINO_M = 300;

export const TIPI = ['nonEsiste', 'guasta', 'potenza', 'operatore', 'posizione', 'nuova', 'altro'];
// Tipi per cui la posizione serve davvero: la casella è già spuntata (si può togliere)
const CON_POSIZIONE = new Set(['posizione', 'nuova']);

let posizioni = [];
let fermoDa = null;
let contesto = null;

/**
 * A ogni posizione: aggiorna "fermo da quando" e mostra o nasconde il pulsante.
 * stazioni: tutte le stazioni con distanza (anche quelle alle spalle); inAutostrada: la strada
 * attuale è un'autostrada riconosciuta.
 */
export function aggiornaSegnalazione({ lat, lon, velocita, ora = Date.now() }, stazioni, inAutostrada) {
  posizioni.push({ lat, lon, ora });
  posizioni = posizioni.filter(p => ora - p.ora <= FERMO_DOPO_MS * 2);
  const lontano = p => distanzaKm(p.lat, p.lon, lat, lon) * 1000 > FERMO_RAGGIO_M;
  if ((velocita != null && velocita > IN_MOVIMENTO_MS) || posizioni.some(lontano)) {
    posizioni = [{ lat, lon, ora }];
    fermoDa = ora;
  }
  fermoDa ??= ora;

  const vicina = stazioni.filter(s => s.distanza * 1000 <= VICINO_M).sort((a, b) => a.distanza - b.distanza)[0] ?? null;
  contesto = { lat, lon, stazione: vicina, inAutostrada };
  aggiornaPulsante(ora);
}

// Da fermi il GPS può non mandare posizioni nuove: il pulsante si ricontrolla anche a tempo
function aggiornaPulsante(ora = Date.now()) {
  const fermo = fermoDa != null && ora - fermoDa >= FERMO_DOPO_MS;
  document.getElementById('segnala').hidden = !(fermo && contesto && (contesto.stazione || contesto.inAutostrada));
}

/** Testo dell'email: nella lingua dell'utente, con i codici per chi la legge (noi). */
export function componiEmail({ tipo, nota, stazione, posizione, versioneApp, versioneDati: dati }) {
  const nomeTipo = t(`segnalaTipo_${tipo}`);
  const descrizioneStazione = stazione
    ? `${stazione.nome}${stazione.codiceAutostrada ? ` (${stazione.codiceAutostrada})` : ''}${stazione.operatore ? ` – ${stazione.operatore}` : ''}`
    : t('segnalaNessunaStazione');
  const righe = [
    `${t('segnalaEmailStazione')}: ${descrizioneStazione}`,
    stazione?.id ? `ID: ${stazione.id}` : null,
    `${t('segnalaEmailProblema')}: ${nomeTipo} [${tipo}]`,
    nota ? `${t('segnalaEmailNota')}: ${nota}` : null,
    posizione ? `${t('segnalaEmailPosizione')}: ${posizione.lat.toFixed(5)}, ${posizione.lon.toFixed(5)} – https://www.openstreetmap.org/?mlat=${posizione.lat.toFixed(5)}&mlon=${posizione.lon.toFixed(5)}#map=18/${posizione.lat.toFixed(5)}/${posizione.lon.toFixed(5)}` : null,
    '',
    `Next-To-X ${versioneApp ?? 'dev'} · ${t('segnalaEmailDati')} ${dati ?? '?'} · ${lingua}`,
    '',
    t('segnalaEmailFoto'),
  ].filter(r => r !== null);
  return {
    oggetto: `${t('segnalaEmailOggetto')}: ${stazione?.nome ?? t('segnalaNessunaStazione')} – ${nomeTipo}`,
    corpo: righe.join('\n'),
  };
}

export function linkEmail({ oggetto, corpo }) {
  return `mailto:${INDIRIZZO}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(corpo)}`;
}

export function collegaSegnalazione() {
  const pulsante = document.getElementById('segnala');
  const finestra = document.getElementById('segnalazione');
  const scelte = document.getElementById('segnala-scelte');
  const nota = document.getElementById('segnala-nota');
  const conPosizione = document.getElementById('segnala-con-posizione');
  const invia = document.getElementById('segnala-invia');
  let scelto = null;
  let fermato = null;

  setInterval(aggiornaPulsante, 5000);

  scelte.replaceChildren(...TIPI.map(tipo => {
    const etichetta = document.createElement('label');
    etichetta.className = 'segnala-scelta';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'segnala-tipo';
    radio.value = tipo;
    radio.addEventListener('change', () => {
      scelto = tipo;
      conPosizione.checked = CON_POSIZIONE.has(tipo);
      invia.disabled = false;
    });
    etichetta.append(radio, ' ', t(`segnalaTipo_${tipo}`));
    return etichetta;
  }));

  pulsante.addEventListener('click', () => {
    // Si fissa il momento in cui si apre il form: stazione e posizione restano quelle
    fermato = contesto;
    const s = fermato?.stazione;
    document.getElementById('segnala-stazione').textContent = s
      ? `${s.nome}${s.operatore ? ` · ${s.operatore}` : ''}`
      : t('segnalaNessunaStazione');
    scelte.querySelectorAll('input').forEach(r => { r.checked = false; });
    scelto = null;
    nota.value = '';
    conPosizione.checked = false;
    invia.disabled = true;
    finestra.hidden = false;
    contaEvento('segnalazione/aperta');
  });

  document.getElementById('segnala-annulla').addEventListener('click', () => { finestra.hidden = true; });

  invia.addEventListener('click', () => {
    if (!scelto || !fermato) return;
    const email = componiEmail({
      tipo: scelto,
      nota: nota.value.trim().slice(0, 500),
      stazione: fermato.stazione,
      posizione: conPosizione.checked ? fermato : null,
      versioneApp: VERSIONE_APP,
      versioneDati: versioneDati(),
    });
    contaEvento(`segnalazione/email/${scelto}`);
    finestra.hidden = true;
    location.href = linkEmail(email);
  });
}
