import { t } from '../i18n.js';

// Filtro per operatore: si vedono solo le colonnine degli operatori scelti (per esempio quelli
// con cui si ha un abbonamento). Nessuna scelta vuol dire tutti. Una stazione con più operatori
// resta se almeno uno è scelto. La scelta si salva nel browser, per nome dell'operatore.
//
// Nelle impostazioni c'è una riga "Operatori" che apre una sottopagina: in cima gli scelti,
// poi i PRINCIPALI più diffusi, gli altri (centinaia, quasi tutti con 1-3 stazioni) si cercano.

const CHIAVE = 'operatoriScelti';
const PRINCIPALI = 25;
const MAX_RISULTATI = 60;

let scelti = leggiScelti();
// [[nome, numero di stazioni]] dal più diffuso; vuoto finché le aree non sono caricate
let conteggi = [];
let aree = [];
let onCambio = () => {};

function leggiScelti() {
  try {
    const salvati = JSON.parse(localStorage.getItem(CHIAVE));
    return new Set(Array.isArray(salvati) ? salvati : []);
  } catch {
    return new Set();
  }
}

function salvaScelti() {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify([...scelti]));
  } catch { /* non salvabile (es. navigazione privata): vale per questa sessione */ }
}

export const filtroOperatoriAttivo = () => scelti.size > 0;
export const operatoreScelto = nome => scelti.has(nome);

/** True se l'area va mostrata con il filtro attuale. */
export function passaFiltroOperatori(area) {
  return !scelti.size || (area.operatori ?? []).some(o => scelti.has(o));
}

/** Operatori scelti, dal più diffuso: "Tesla, IONITY" o "Tesla, IONITY +2". */
export function testoFiltro() {
  const ordine = new Map(conteggi.map(([nome], i) => [nome, i]));
  const nomi = [...scelti].sort((a, b) => (ordine.get(a) ?? Infinity) - (ordine.get(b) ?? Infinity));
  return nomi.length <= 2 ? nomi.join(', ') : `${nomi.slice(0, 2).join(', ')} +${nomi.length - 2}`;
}

/** Collega riga delle impostazioni e sottopagina; onCambiare viene chiamata a ogni modifica. */
export function collegaOperatori(onCambiare) {
  onCambio = onCambiare;
  document.getElementById('riga-operatori').addEventListener('click', apriOperatori);
  document.getElementById('operatori-indietro').addEventListener('click', chiudiOperatori);
  // Chiudendo le impostazioni la volta dopo si riparte dalla pagina principale
  document.getElementById('options-close').addEventListener('click', chiudiOperatori);
  const cerca = document.getElementById('operatori-cerca');
  cerca.addEventListener('input', disegnaLista);
  document.getElementById('operatori-tutti').addEventListener('click', () => {
    scelti.clear();
    cerca.value = '';
    cambiato();
  });
  document.getElementById('operatori-lista').addEventListener('change', e => {
    const casella = e.target.closest('input[type="checkbox"]');
    if (!casella) return;
    if (casella.checked) scelti.add(casella.value);
    else scelti.delete(casella.value);
    cambiato();
  });
  aggiornaIndicatori();
}

/** Dopo il caricamento delle aree: conteggi per la lista. */
export function impostaAreeOperatori(tutte) {
  aree = tutte;
  const perOperatore = new Map();
  for (const area of tutte) {
    for (const nome of area.operatori ?? []) perOperatore.set(nome, (perOperatore.get(nome) ?? 0) + 1);
  }
  conteggi = [...perOperatore].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  // Un operatore salvato che non c'è più nei dati nasconderebbe tutto senza motivo visibile
  const prima = scelti.size;
  for (const nome of [...scelti]) if (!perOperatore.has(nome)) scelti.delete(nome);
  if (scelti.size !== prima) salvaScelti();
  document.getElementById('operatori-cerca').placeholder = t('operatoriCerca', { n: conteggi.length });
  disegnaLista();
  aggiornaIndicatori();
}

/** Apre le impostazioni direttamente sulla sottopagina (anche dalla scritta del filtro nel pannello). */
export function apriOperatori() {
  document.getElementById('options-panel').classList.add('open');
  document.getElementById('operatori-pagina').hidden = false;
  disegnaLista();
}

function chiudiOperatori() {
  document.getElementById('operatori-pagina').hidden = true;
  document.getElementById('operatori-cerca').value = '';
}

function cambiato() {
  salvaScelti();
  disegnaLista();
  aggiornaIndicatori();
  onCambio();
}

/** Valore nella riga delle impostazioni e pallino sull'ingranaggio. */
function aggiornaIndicatori() {
  const attivo = filtroOperatoriAttivo();
  const valore = document.getElementById('operatori-valore');
  valore.textContent = !attivo ? t('operatoriTutti')
    : scelti.size === 1 ? testoFiltro() : t('operatoriScelti', { n: scelti.size });
  valore.classList.toggle('attivo', attivo);
  document.getElementById('options-toggle').classList.toggle('filtro-attivo', attivo);
}

const escape = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function riga([nome, n]) {
  return `
    <label class="operatore-riga">
      <input type="checkbox" value="${escape(nome)}" ${scelti.has(nome) ? 'checked' : ''} />
      <span class="operatore-nome">${escape(nome)}</span>
      <span class="operatore-n">${n}</span>
    </label>`;
}

function disegnaLista() {
  const lista = document.getElementById('operatori-lista');
  const cerca = document.getElementById('operatori-cerca').value.trim().toLowerCase();
  const sezione = testo => `<div class="operatori-sezione">${testo}</div>`;
  let html = '';
  if (cerca) {
    const trovati = conteggi.filter(([nome]) => nome.toLowerCase().includes(cerca));
    html = trovati.length
      ? sezione(t('operatoriRisultati', { n: trovati.length })) + trovati.slice(0, MAX_RISULTATI).map(riga).join('')
      : `<p class="operatori-nota">${escape(t('operatoriNessunRisultato', { testo: cerca }))}</p>`;
  } else {
    const sceltiOrdinati = conteggi.filter(([nome]) => scelti.has(nome));
    if (sceltiOrdinati.length) html += sezione(t('operatoriSezioneScelti', { n: sceltiOrdinati.length })) + sceltiOrdinati.map(riga).join('');
    const principali = conteggi.slice(0, PRINCIPALI).filter(([nome]) => !scelti.has(nome));
    if (principali.length) html += sezione(t('operatoriSezionePrincipali')) + principali.map(riga).join('');
    if (conteggi.length > PRINCIPALI) html += `<p class="operatori-nota">${t('operatoriAltri', { n: conteggi.length - PRINCIPALI })}</p>`;
  }
  const scorrimento = lista.scrollTop;
  lista.innerHTML = html;
  lista.scrollTop = scorrimento;

  const piede = document.getElementById('operatori-piede');
  piede.textContent = filtroOperatoriAttivo()
    ? t('operatoriPiede', { n: scelti.size, stazioni: aree.filter(passaFiltroOperatori).length, totale: aree.length })
    : t('operatoriPiedeTutti');
}
