// Pagina info: mostra il testo nella lingua scelta (vedi js/i18n.js). Senza JavaScript resta
// visibile quello italiano.
import { lingua, impostaTitolo } from '../i18n.js';

const articoli = document.querySelectorAll('main > article[lang]');
const scelto = [...articoli].find(a => a.lang === lingua) ?? articoli[0];
articoli.forEach(a => { a.hidden = a !== scelto; });
document.documentElement.lang = scelto.lang;
impostaTitolo(scelto.dataset.titolo, scelto.dataset.descrizione);

// L'indirizzo email è scritto "info [at] nexttox.com" per i bot che raccolgono indirizzi;
// qui diventa un link normale
document.querySelectorAll('.email[data-utente][data-dominio]').forEach(el => {
  const indirizzo = `${el.dataset.utente}@${el.dataset.dominio}`;
  const link = document.createElement('a');
  link.href = `mailto:${indirizzo}`;
  link.textContent = indirizzo;
  el.replaceWith(link);
});
