// Avvertenze al primo avvio: uso alla guida, dati indicativi, app indipendente.
// Si mostrano finché non vengono accettate; cambiando VERSIONE si ripropongono a tutti.

const CHIAVE = 'avvertenzeAccettate';
const VERSIONE = '1';

function giaAccettate() {
  try {
    return localStorage.getItem(CHIAVE) === VERSIONE;
  } catch {
    return false;
  }
}

/**
 * Si risolve quando le avvertenze sono accettate (subito, se lo erano già):
 * true se sono state mostrate adesso, false se erano già accettate.
 */
export function attendiAvvertenze() {
  const finestra = document.getElementById('avvertenze');
  if (giaAccettate()) return Promise.resolve(false);
  finestra.hidden = false;
  return new Promise(resolve => {
    document.getElementById('avvertenze-ok').addEventListener('click', () => {
      try {
        localStorage.setItem(CHIAVE, VERSIONE);
      } catch { /* non salvabile (es. navigazione privata): si riproporranno alla prossima apertura */ }
      finestra.hidden = true;
      resolve(true);
    }, { once: true });
  });
}
