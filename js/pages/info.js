// Pagina info: mostra il testo nella lingua scelta (vedi js/i18n.js). Senza JavaScript resta
// visibile quello italiano.
import { lingua, impostaTitolo, impostaCanonical } from '../i18n.js';

const articoli = document.querySelectorAll('main > article[lang]');
const scelto = [...articoli].find(a => a.lang === lingua) ?? articoli[0];
articoli.forEach(a => { a.hidden = a !== scelto; });
document.documentElement.lang = scelto.lang;
impostaTitolo(scelto.dataset.titolo, scelto.dataset.descrizione);
impostaCanonical();
