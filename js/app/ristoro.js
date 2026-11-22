import { t } from '../i18n.js';
import { MODALITA_DEBUG } from './debug.js';

// Bar e ristorante dell'area di servizio come simboli: la tazzina per il bar, piatto e
// posate per il ristorante (fast food compresi). Il nome del locale (Autogrill, Sarni…) è nei
// dati (stazione.ristoro[].nome) ma per ora non si mostra.
const SIMBOLI = [
  ['bar', '☕', 'ristoroBar'],
  ['ristorante', '🍽️', 'ristoroRistorante'],
];

// Sul sito i servizi sono ancora in prova (dati da verificare): solo con ?debug=true.
// Nell'app iPhone (pagina servita da nexttox://) si vedono sempre, come nel motore della Live
// Activity e di CarPlay (ios/motore/motore.js). L'editor stazioni.html li mostra sempre
export const SERVIZI_NELL_APP = MODALITA_DEBUG || location.protocol === 'nexttox:';

/** Simboli dei servizi per l'app: '' se i servizi sono nascosti. */
export function simboliRistoroApp(stazione) {
  return SERVIZI_NELL_APP ? simboliRistoro(stazione) : '';
}

/** Simboli di bar e ristorante come testo ("☕ 🍽️"), '' se non ne ha o non si sa. */
export function testoRistoro(stazione) {
  const tipi = new Set((stazione.ristoro ?? []).map(l => l.tipo));
  return SIMBOLI.filter(([tipo]) => tipi.has(tipo)).map(([, simbolo]) => simbolo).join(' ');
}

/** HTML dei simboli di bar e ristorante della stazione, '' se non ne ha o non si sa. */
export function simboliRistoro(stazione) {
  const tipi = new Set((stazione.ristoro ?? []).map(l => l.tipo));
  return SIMBOLI.filter(([tipo]) => tipi.has(tipo))
    .map(([, simbolo, chiave]) => `<span class="ristoro" role="img" aria-label="${t(chiave)}" title="${t(chiave)}">${simbolo}</span>`)
    .join(' ');
}
