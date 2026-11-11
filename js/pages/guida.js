// Guide e pagine per autostrada (generate da tools/genera_guide.mjs): solo la visita, con il
// percorso fisso scritto nella pagina (es. /guide/de/it/a22), per vedere cosa porta la ricerca.
import { contaPagina } from '../statistiche.js';

contaPagina(document.body.dataset.statistica, document.title);
