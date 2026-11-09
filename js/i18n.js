// Lingua dell'interfaccia: italiano, inglese, francese o tedesco, scelta dalle preferenze del
// browser (la prima delle sue lingue che conosciamo); per tutte le altre, inglese.
// Per provarla: ?lang=de nell'indirizzo.
//
// Si traduce solo l'interfaccia: nomi di stazioni, strade, operatori e destinazioni restano
// come nelle fonti. Nell'HTML: data-i18n (testo), data-i18n-html (testo con markup nostro),
// data-i18n-aria (aria-label); nel codice: t('chiave', {valori}).

export const LINGUE = ['it', 'en', 'fr', 'de'];
const PREDEFINITA = 'en';

export function scegliLingua(preferenze, forzata = null) {
  for (const l of [forzata, ...preferenze]) {
    const codice = l?.toLowerCase().split('-')[0];
    if (LINGUE.includes(codice)) return codice;
  }
  return PREDEFINITA;
}

export const lingua = scegliLingua(
  navigator.languages?.length ? navigator.languages : [navigator.language],
  new URLSearchParams(location.search).get('lang'),
);

const plurale = (n, uno, molti) => (n === 1 ? uno : molti);

export const TESTI = {
  it: {
    impostazioni: 'Impostazioni',
    simulaPosizione: 'Simula posizione',
    mostraCursore: 'Mostra cursore simulazione',
    tracciaCsv: 'Traccia GPS (CSV)',
    cursoreSimulazione: 'Posizione nella traccia simulata',
    mostraTutte: 'Mostra tutte le stazioni',
    soloAree: 'Solo aree di servizio',
    soloAreeSpiegazione: "Nasconde le colonnine fuori dal casello (⚠️ uscita), per non dover uscire dall'autostrada.",
    statistiche: 'Statistiche anonime',
    statisticheSpiegazione: "Senza cookie e senza la tua posizione: si contano solo le aperture, da quale sito arrivi, se il GPS funziona e quali operatori vengono suggeriti. Aiuta a decidere come migliorare l'app.",
    infoPrivacy: 'Info, avvertenze e privacy',
    versioneDati: ({ versione }) => `Versione dati: ${versione}`,
    avvertenzeTitolo: 'Prima di partire',
    avvertenzaTelefono: '<strong>Non usare il telefono mentre guidi:</strong> affidalo al passeggero o fissalo a un supporto.',
    avvertenzaDati: "<strong>Dati indicativi:</strong> una colonnina può mancare, essere guasta o occupata. Verifica con l'app dell'operatore e tieni un margine di autonomia.",
    avvertenzaPosizione: "<strong>La tua posizione non viene salvata.</strong> Si usa sul telefono; fuori dall'autostrada le coordinate vanno a OpenStreetMap solo per il nome della strada.",
    avvertenzaIndipendente: "App indipendente, <strong>non affiliata</strong> a Free To X, Autostrade per l'Italia, Autostrada del Brennero né agli operatori citati.",
    hoCapito: 'Ho capito',
    infoBreve: 'Info e privacy',
    stazioniVicine: 'Stazioni nelle vicinanze',
    stazioni: ({ n }) => (n === 0 ? 'Nessuna stazione' : `${n} ${plurale(n, 'stazione', 'stazioni')}`),
    colonnine: ({ n }) => `${n} ${plurale(n, 'colonnina', 'colonnine')}`,
    colonnaArea: 'Area',
    colonnaStrada: 'Strada',
    gpsNonDisponibile: '⚠️ GPS non disponibile — attiva la posizione',
    uscita: 'uscita',
    bivioTra: ({ km }) => `bivio tra ${km}`,
    tra: ({ km }) => `tra ${km}`,
    richiedeUscita: 'Richiede uscita dal casello',
    prossimaColonnina: 'PROSSIMA COLONNINA',
    stradaSconosciuta: 'Strada sconosciuta',
    creditiMappa: 'Crediti della mappa',
    puntiCaricati: ({ file, n }) => `✅ ${file} (${n} punti)`,
    formatoNonValido: '❌ Formato non valido',
    NORD: 'NORD', EST: 'EST', SUD: 'SUD', OVEST: 'OVEST',
    NORD_BREVE: 'N', EST_BREVE: 'E', SUD_BREVE: 'S', OVEST_BREVE: 'O',
    apriBivio: ({ sigla, km }) => `Bivio ${sigla} tra ${km}: mostra le diramazioni`,
    chiudiBivio: ({ sigla }) => `Bivio ${sigla}: nascondi le diramazioni`,
    operatori: 'Operatori',
    operatoriTutti: 'Tutti',
    operatoriScelti: ({ n }) => `${n} scelti`,
    operatoriSpiegazione: 'Mostra solo le colonnine degli operatori scelti, per esempio quelli con cui hai un abbonamento.',
    operatoriCerca: ({ n }) => `Cerca tra ${n} operatori`,
    operatoriCercaAria: 'Cerca operatore',
    operatoriSezioneScelti: ({ n }) => `Scelti · ${n}`,
    operatoriSezionePrincipali: 'Più diffusi',
    operatoriRisultati: ({ n }) => `Risultati · ${n}`,
    operatoriNessunRisultato: ({ testo }) => `Nessun operatore contiene “${testo}”.`,
    operatoriAltri: ({ n }) => `Altri ${n} operatori: cercali per nome.`,
    operatoriPiede: ({ n, stazioni, totale }) => `${n} ${plurale(n, 'scelto', 'scelti')} · ${stazioni} stazioni su ${totale}`,
    operatoriPiedeTutti: 'Nessuna spunta: si vedono tutti gli operatori',
    indietro: 'Indietro',
    filtroOperatori: ({ nomi }) => `Filtro: ${nomi}`,
    nessunaDeiTuoi: 'Nessuna colonnina dei tuoi operatori davanti',
    piuVicinaQualsiasi: 'La più vicina di qualsiasi operatore:',
  },
  en: {
    impostazioni: 'Settings',
    simulaPosizione: 'Simulate position',
    mostraCursore: 'Show simulation slider',
    tracciaCsv: 'GPS track (CSV)',
    cursoreSimulazione: 'Position in the simulated track',
    mostraTutte: 'Show all stations',
    soloAree: 'Service areas only',
    soloAreeSpiegazione: 'Hides chargers outside the toll gate (⚠️ exit), so you never have to leave the motorway.',
    statistiche: 'Anonymous statistics',
    statisticheSpiegazione: 'No cookies and never your location: only app opens, the site you came from, whether GPS works and which operators are suggested are counted. It helps decide how to improve the app.',
    infoPrivacy: 'About, notices and privacy',
    versioneDati: ({ versione }) => `Data version: ${versione}`,
    avvertenzeTitolo: 'Before you set off',
    avvertenzaTelefono: "<strong>Don't use your phone while driving:</strong> hand it to a passenger or put it in a holder.",
    avvertenzaDati: "<strong>The data is indicative:</strong> a charger may be missing, out of order or busy. Check the operator's app and keep some range in reserve.",
    avvertenzaPosizione: '<strong>Your location is never stored.</strong> It is used on your phone; off the motorway the coordinates are sent to OpenStreetMap only to get the road name.',
    avvertenzaIndipendente: "Independent app, <strong>not affiliated</strong> with Free To X, Autostrade per l'Italia, Autostrada del Brennero or any operator mentioned.",
    hoCapito: 'Got it',
    infoBreve: 'About and privacy',
    stazioniVicine: 'Nearby stations',
    stazioni: ({ n }) => (n === 0 ? 'No stations' : `${n} ${plurale(n, 'station', 'stations')}`),
    colonnine: ({ n }) => `${n} ${plurale(n, 'charger', 'chargers')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Road',
    gpsNonDisponibile: '⚠️ GPS unavailable — turn on location',
    uscita: 'exit',
    bivioTra: ({ km }) => `junction in ${km}`,
    tra: ({ km }) => `in ${km}`,
    richiedeUscita: 'Requires leaving the motorway',
    prossimaColonnina: 'NEXT CHARGER',
    stradaSconosciuta: 'Unknown road',
    creditiMappa: 'Map credits',
    puntiCaricati: ({ file, n }) => `✅ ${file} (${n} points)`,
    formatoNonValido: '❌ Invalid format',
    NORD: 'NORTH', EST: 'EAST', SUD: 'SOUTH', OVEST: 'WEST',
    NORD_BREVE: 'N', EST_BREVE: 'E', SUD_BREVE: 'S', OVEST_BREVE: 'W',
    apriBivio: ({ sigla, km }) => `${sigla} junction in ${km}: show the branches`,
    chiudiBivio: ({ sigla }) => `${sigla} junction: hide the branches`,
    operatori: 'Operators',
    operatoriTutti: 'All',
    operatoriScelti: ({ n }) => `${n} selected`,
    operatoriSpiegazione: 'Show only the chargers of the operators you pick, for example the ones you have a subscription with.',
    operatoriCerca: ({ n }) => `Search ${n} operators`,
    operatoriCercaAria: 'Search operator',
    operatoriSezioneScelti: ({ n }) => `Selected · ${n}`,
    operatoriSezionePrincipali: 'Most common',
    operatoriRisultati: ({ n }) => `Results · ${n}`,
    operatoriNessunRisultato: ({ testo }) => `No operator contains “${testo}”.`,
    operatoriAltri: ({ n }) => `${n} more operators: search them by name.`,
    operatoriPiede: ({ n, stazioni, totale }) => `${n} selected · ${stazioni} of ${totale} stations`,
    operatoriPiedeTutti: 'Nothing ticked: all operators are shown',
    indietro: 'Back',
    filtroOperatori: ({ nomi }) => `Filter: ${nomi}`,
    nessunaDeiTuoi: 'No charger from your operators ahead',
    piuVicinaQualsiasi: 'Nearest from any operator:',
  },
  fr: {
    impostazioni: 'Réglages',
    simulaPosizione: 'Simuler la position',
    mostraCursore: 'Afficher le curseur de simulation',
    tracciaCsv: 'Trace GPS (CSV)',
    cursoreSimulazione: 'Position dans la trace simulée',
    mostraTutte: 'Afficher toutes les stations',
    soloAree: 'Aires de service uniquement',
    soloAreeSpiegazione: "Masque les bornes situées après le péage (⚠️ sortie), pour ne jamais devoir quitter l'autoroute.",
    statistiche: 'Statistiques anonymes',
    statisticheSpiegazione: "Sans cookies et jamais votre position : seuls les ouvertures, le site d'où vous venez, le fonctionnement du GPS et les opérateurs proposés sont comptés. Cela aide à améliorer l'application.",
    infoPrivacy: 'Infos, avertissements et confidentialité',
    versioneDati: ({ versione }) => `Version des données : ${versione}`,
    avvertenzeTitolo: 'Avant de partir',
    avvertenzaTelefono: "<strong>N'utilisez pas votre téléphone en conduisant :</strong> confiez-le au passager ou fixez-le sur un support.",
    avvertenzaDati: "<strong>Données indicatives :</strong> une borne peut manquer, être en panne ou occupée. Vérifiez dans l'application de l'opérateur et gardez une marge d'autonomie.",
    avvertenzaPosizione: "<strong>Votre position n'est jamais enregistrée.</strong> Elle est utilisée sur votre téléphone ; hors autoroute, les coordonnées sont envoyées à OpenStreetMap uniquement pour obtenir le nom de la route.",
    avvertenzaIndipendente: "Application indépendante, <strong>non affiliée</strong> à Free To X, Autostrade per l'Italia, Autostrada del Brennero ni aux opérateurs cités.",
    hoCapito: "J'ai compris",
    infoBreve: 'Infos et confidentialité',
    stazioniVicine: 'Stations à proximité',
    stazioni: ({ n }) => (n === 0 ? 'Aucune station' : `${n} ${plurale(n, 'station', 'stations')}`),
    colonnine: ({ n }) => `${n} ${plurale(n, 'borne', 'bornes')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Route',
    gpsNonDisponibile: '⚠️ GPS indisponible — activez la localisation',
    uscita: 'sortie',
    bivioTra: ({ km }) => `bifurcation dans ${km}`,
    tra: ({ km }) => `dans ${km}`,
    richiedeUscita: "Nécessite de sortir de l'autoroute",
    prossimaColonnina: 'PROCHAINE BORNE',
    stradaSconosciuta: 'Route inconnue',
    creditiMappa: 'Crédits de la carte',
    puntiCaricati: ({ file, n }) => `✅ ${file} (${n} points)`,
    formatoNonValido: '❌ Format non valide',
    NORD: 'NORD', EST: 'EST', SUD: 'SUD', OVEST: 'OUEST',
    NORD_BREVE: 'N', EST_BREVE: 'E', SUD_BREVE: 'S', OVEST_BREVE: 'O',
    apriBivio: ({ sigla, km }) => `Bifurcation ${sigla} dans ${km} : afficher les branches`,
    chiudiBivio: ({ sigla }) => `Bifurcation ${sigla} : masquer les branches`,
    operatori: 'Opérateurs',
    operatoriTutti: 'Tous',
    operatoriScelti: ({ n }) => `${n} ${plurale(n, 'choisi', 'choisis')}`,
    operatoriSpiegazione: 'Affiche seulement les bornes des opérateurs choisis, par exemple ceux auxquels vous êtes abonné.',
    operatoriCerca: ({ n }) => `Rechercher parmi ${n} opérateurs`,
    operatoriCercaAria: 'Rechercher un opérateur',
    operatoriSezioneScelti: ({ n }) => `Choisis · ${n}`,
    operatoriSezionePrincipali: 'Les plus répandus',
    operatoriRisultati: ({ n }) => `Résultats · ${n}`,
    operatoriNessunRisultato: ({ testo }) => `Aucun opérateur ne contient « ${testo} ».`,
    operatoriAltri: ({ n }) => `${n} autres opérateurs : recherchez-les par nom.`,
    operatoriPiede: ({ n, stazioni, totale }) => `${n} ${plurale(n, 'choisi', 'choisis')} · ${stazioni} stations sur ${totale}`,
    operatoriPiedeTutti: 'Aucune case cochée : tous les opérateurs sont affichés',
    indietro: 'Retour',
    filtroOperatori: ({ nomi }) => `Filtre : ${nomi}`,
    nessunaDeiTuoi: 'Aucune borne de vos opérateurs devant',
    piuVicinaQualsiasi: 'La plus proche, tous opérateurs :',
  },
  de: {
    impostazioni: 'Einstellungen',
    simulaPosizione: 'Position simulieren',
    mostraCursore: 'Simulationsregler anzeigen',
    tracciaCsv: 'GPS-Track (CSV)',
    cursoreSimulazione: 'Position im simulierten Track',
    mostraTutte: 'Alle Stationen anzeigen',
    soloAree: 'Nur Raststätten',
    soloAreeSpiegazione: 'Blendet Ladesäulen nach der Ausfahrt aus (⚠️ Ausfahrt), damit du die Autobahn nicht verlassen musst.',
    statistiche: 'Anonyme Statistiken',
    statisticheSpiegazione: 'Ohne Cookies und nie dein Standort: gezählt werden nur App-Aufrufe, die Website, von der du kommst, ob GPS funktioniert und welche Betreiber vorgeschlagen werden. Das hilft, die App zu verbessern.',
    infoPrivacy: 'Info, Hinweise und Datenschutz',
    versioneDati: ({ versione }) => `Datenversion: ${versione}`,
    avvertenzeTitolo: 'Vor der Fahrt',
    avvertenzaTelefono: '<strong>Benutze das Handy nicht während der Fahrt:</strong> gib es dem Beifahrer oder setze es in eine Halterung.',
    avvertenzaDati: '<strong>Die Daten sind unverbindlich:</strong> eine Ladesäule kann fehlen, defekt oder belegt sein. Prüfe in der App des Betreibers und plane eine Reichweitenreserve ein.',
    avvertenzaPosizione: '<strong>Dein Standort wird nicht gespeichert.</strong> Er wird auf dem Handy verwendet; abseits der Autobahn gehen die Koordinaten nur für den Straßennamen an OpenStreetMap.',
    avvertenzaIndipendente: "Unabhängige App, <strong>nicht verbunden</strong> mit Free To X, Autostrade per l'Italia, Autostrada del Brennero oder den genannten Betreibern.",
    hoCapito: 'Verstanden',
    infoBreve: 'Info und Datenschutz',
    stazioniVicine: 'Stationen in der Nähe',
    stazioni: ({ n }) => (n === 0 ? 'Keine Stationen' : `${n} ${plurale(n, 'Station', 'Stationen')}`),
    colonnine: ({ n }) => `${n} ${plurale(n, 'Ladesäule', 'Ladesäulen')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Straße',
    gpsNonDisponibile: '⚠️ GPS nicht verfügbar — Standort aktivieren',
    uscita: 'Ausfahrt',
    bivioTra: ({ km }) => `Kreuz in ${km}`,
    tra: ({ km }) => `in ${km}`,
    richiedeUscita: 'Autobahn muss verlassen werden',
    prossimaColonnina: 'NÄCHSTE LADESÄULE',
    stradaSconosciuta: 'Unbekannte Straße',
    creditiMappa: 'Kartennachweise',
    puntiCaricati: ({ file, n }) => `✅ ${file} (${n} Punkte)`,
    formatoNonValido: '❌ Ungültiges Format',
    NORD: 'NORD', EST: 'OST', SUD: 'SÜD', OVEST: 'WEST',
    NORD_BREVE: 'N', EST_BREVE: 'O', SUD_BREVE: 'S', OVEST_BREVE: 'W',
    apriBivio: ({ sigla, km }) => `Kreuz ${sigla} in ${km}: Abzweigungen zeigen`,
    chiudiBivio: ({ sigla }) => `Kreuz ${sigla}: Abzweigungen ausblenden`,
    operatori: 'Betreiber',
    operatoriTutti: 'Alle',
    operatoriScelti: ({ n }) => `${n} ausgewählt`,
    operatoriSpiegazione: 'Zeigt nur Ladesäulen der gewählten Betreiber, zum Beispiel derer, bei denen du ein Abo hast.',
    operatoriCerca: ({ n }) => `In ${n} Betreibern suchen`,
    operatoriCercaAria: 'Betreiber suchen',
    operatoriSezioneScelti: ({ n }) => `Ausgewählt · ${n}`,
    operatoriSezionePrincipali: 'Am häufigsten',
    operatoriRisultati: ({ n }) => `Ergebnisse · ${n}`,
    operatoriNessunRisultato: ({ testo }) => `Kein Betreiber enthält „${testo}“.`,
    operatoriAltri: ({ n }) => `${n} weitere Betreiber: nach Namen suchen.`,
    operatoriPiede: ({ n, stazioni, totale }) => `${n} ausgewählt · ${stazioni} von ${totale} Stationen`,
    operatoriPiedeTutti: 'Nichts angehakt: alle Betreiber werden angezeigt',
    indietro: 'Zurück',
    filtroOperatori: ({ nomi }) => `Filter: ${nomi}`,
    nessunaDeiTuoi: 'Keine Ladesäule deiner Betreiber voraus',
    piuVicinaQualsiasi: 'Nächste, beliebiger Betreiber:',
  },
};

/** Testo nella lingua scelta; se manca, quello italiano (e se manca anche quello, la chiave). */
export function t(chiave, valori = {}) {
  const testo = TESTI[lingua][chiave] ?? TESTI.it[chiave] ?? chiave;
  return typeof testo === 'function' ? testo(valori) : testo;
}

const formatoKm = new Intl.NumberFormat(lingua, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Distanza con un decimale e il separatore della lingua: "36,1 km" / "36.1 km". */
/**
 * Senso di marcia dopo un bivio, per pannello, barra, fumetti e mappa: freccia del lato verso
 * cui si gira, sigla e, se dal bivio partono entrambi i sensi, il punto cardinale ("↖ A14 N").
 */
export function nomeRamo({ sigla, lato, cardinale }, conFreccia = true) {
  const freccia = conFreccia ? `${lato === 'sx' ? '↖' : '↗'} ` : '';
  return `${freccia}${sigla}${cardinale ? ` ${t(`${cardinale}_BREVE`)}` : ''}`;
}

export function km(valore) {
  return `${formatoKm.format(valore)} km`;
}

/** Traduce gli elementi marcati con data-i18n* e imposta la lingua del documento. */
export function traduciPagina(radice = document) {
  document.documentElement.lang = lingua;
  radice.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  radice.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  radice.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
