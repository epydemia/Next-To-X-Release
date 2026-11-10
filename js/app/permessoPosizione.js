// Permesso di posizione: una spiegazione prima della richiesta del browser e, se il permesso è
// bloccato o il GPS non risponde, le istruzioni per riattivarlo sul proprio dispositivo.
//
// La spiegazione compare solo a chi non ha mai dato la posizione all'app: chi l'ha già data
// almeno una volta non deve fare un tocco in più a ogni apertura (Safari su iPhone richiede
// spesso il permesso). Al primo avvio la spiegazione è già nelle avvertenze.

import { t } from '../i18n.js';
import { contaEvento } from '../statistiche.js';

const CHIAVE_CONCESSA = 'posizioneConcessa';
const CHIAVE_AIUTO_VISTO = 'aiutoGpsVisto';

function leggi(chiave) {
  try {
    return localStorage.getItem(chiave) === '1';
  } catch {
    return false;
  }
}

function segna(chiave) {
  try {
    localStorage.setItem(chiave, '1');
  } catch { /* non salvabile (es. navigazione privata) */ }
}

/** Da chiamare alla prima posizione reale: da qui in poi niente spiegazione prima della richiesta. */
export function segnaPosizioneConcessa() {
  segna(CHIAVE_CONCESSA);
}

/** 'granted' | 'denied' | 'prompt', o null se il browser non lo dice. */
async function statoPermesso() {
  try {
    const permesso = await navigator.permissions?.query({ name: 'geolocation' });
    return permesso?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Chiede, se serve, il consenso prima della richiesta del browser.
 * Si risolve true per avviare il GPS, false se l'utente sceglie di continuare senza.
 */
export async function attendiConsensoPosizione() {
  if (leggi(CHIAVE_CONCESSA)) return true;
  const stato = await statoPermesso();
  if (stato === 'granted') {
    segnaPosizioneConcessa();
    return true;
  }
  // Già bloccato: la richiesta non comparirebbe, ci pensano le istruzioni dopo l'avvio
  if (stato === 'denied') return true;

  const finestra = document.getElementById('permesso');
  finestra.hidden = false;
  contaEvento('permesso/spiegazione');
  return new Promise(resolve => {
    const chiudi = consenso => {
      finestra.hidden = true;
      resolve(consenso);
    };
    document.getElementById('permesso-ok').addEventListener('click', () => chiudi(true), { once: true });
    document.getElementById('permesso-no').addEventListener('click', () => chiudi(false), { once: true });
  });
}

function piattaforma() {
  const ua = navigator.userAgent;
  // iPadOS si presenta come un Mac, ma con il touch
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}

/**
 * Avviso nella barra in alto quando la posizione non c'è. motivo: 'negato', 'nessun-segnale',
 * 'non-supportato', 'permesso-in-attesa' o 'senza-consenso' (l'utente ha scelto "Continua senza").
 * Toccandolo: con 'senza-consenso' parte avviaGps, negli altri casi si aprono le istruzioni.
 * Con il permesso bloccato le istruzioni si aprono anche da sole, la prima volta.
 */
export function mostraAvvisoPosizione(motivo, avviaGps) {
  const avviso = document.createElement('button');
  avviso.type = 'button';
  avviso.className = 'avviso-gps';
  avviso.textContent = motivo === 'senza-consenso' ? t('attivaPosizioneBreve') : t('gpsNonDisponibile');
  avviso.addEventListener('click', () => {
    if (motivo === 'senza-consenso') {
      avviso.remove();
      avviaGps();
    } else {
      apriAiuto(motivo);
    }
  });
  document.getElementById('strada').replaceChildren(avviso);

  if (motivo === 'negato' && !leggi(CHIAVE_AIUTO_VISTO)) {
    segna(CHIAVE_AIUTO_VISTO);
    apriAiuto(motivo, { automatico: true });
  }
}

function apriAiuto(motivo, { automatico = false } = {}) {
  const finestra = document.getElementById('aiuto-gps');
  document.getElementById('aiuto-gps-motivo').textContent =
    t(motivo === 'negato' ? 'aiutoGpsNegato' : 'aiutoGpsSegnale');
  const sistema = piattaforma();
  document.getElementById('aiuto-gps-passi').innerHTML = t(`aiutoGps_${sistema}`);
  finestra.hidden = false;
  contaEvento(`aiuto-gps/${automatico ? 'automatico' : 'aperto'}/${sistema}`);

  const riprova = document.getElementById('aiuto-gps-riprova');
  const chiudi = document.getElementById('aiuto-gps-chiudi');
  const suRiprova = () => {
    contaEvento('aiuto-gps/riprova');
    // Un attimo per far partire il conteggio prima di ricaricare
    setTimeout(() => location.reload(), 300);
  };
  const suChiudi = () => {
    finestra.hidden = true;
    riprova.removeEventListener('click', suRiprova);
  };
  riprova.addEventListener('click', suRiprova, { once: true });
  chiudi.addEventListener('click', suChiudi, { once: true });
}
