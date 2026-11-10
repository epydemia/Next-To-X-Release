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
    titoloPagina: "Next-To-X – Prossima colonnina di ricarica in autostrada",
    descrizionePagina: "La prossima colonnina di ricarica per auto elettriche lungo l'autostrada, sulla tua carreggiata. Italia, Germania, Svizzera e Austria. Gratis, senza registrazione.",
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
    versioneApp: ({ versione }) => `Versione app: ${versione}`,
    versioneSviluppo: 'sviluppo',
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
    stazioniDavanti: ({ n }) => (n === 0 ? 'Nessuna stazione davanti' : `${n} ${plurale(n, 'stazione', 'stazioni')} davanti`),
    nonDavanti: 'Già superate o su altre strade',
    colonnine: ({ n }) => `${n} ${plurale(n, 'colonnina', 'colonnine')}`,
    colonnaArea: 'Area',
    colonnaStrada: 'Strada',
    gpsNonDisponibile: "⚠️ Posizione non disponibile — tocca qui",
    avvertenzaPermesso: "<strong>Subito dopo il browser ti chiede la posizione:</strong> tocca Consenti, serve a trovare le colonnine davanti a te.",
    permessoTitolo: "📍 Serve la tua posizione",
    permessoTesto: "Next-To-X segue la tua posizione per capire su quale autostrada e in che direzione stai andando, e mostrarti la prossima colonnina <strong>sulla tua carreggiata</strong>.",
    permessoPrivacy: "La posizione si usa solo sul telefono: <strong>non la riceviamo e non la salviamo.</strong>",
    permessoNota: "Al tocco il browser ti chiede il permesso: scegli Consenti.",
    attivaPosizione: "Attiva la posizione",
    continuaSenza: "Continua senza",
    attivaPosizioneBreve: "📍 Attiva la posizione",
    aiutoGpsTitolo: "📍 Come attivare la posizione",
    aiutoGpsNegato: "Il permesso di posizione per Next-To-X è bloccato: senza, l'app non sa dove sei. Per sbloccarlo:",
    aiutoGpsSegnale: "La posizione non arriva. Controlla che sia attiva sul telefono e consentita al browser:",
    aiutoGps_ios: "<ol><li><strong>Impostazioni</strong> dell'iPhone → <strong>Privacy e sicurezza</strong> → <strong>Localizzazione</strong>: attivala, poi in <strong>Siti web di Safari</strong> scegli <strong>Mentre usi l'app</strong>.</li><li>In Safari tocca il pulsante a sinistra dell'indirizzo (<strong>aA</strong>) → <strong>Impostazioni sito web</strong> → <strong>Posizione</strong>: <strong>Consenti</strong> o <strong>Chiedi</strong>.</li><li>Torna qui e tocca <strong>Riprova</strong>.</li></ol>",
    aiutoGps_android: "<ol><li>Attiva la <strong>Posizione</strong> del telefono dalla tendina delle impostazioni rapide.</li><li>In Chrome tocca l'icona a sinistra dell'indirizzo → <strong>Autorizzazioni</strong> → <strong>Posizione</strong>: <strong>Consenti</strong>. Se usi l'app dalla schermata Home: Chrome → ⋮ → <strong>Impostazioni</strong> → <strong>Impostazioni sito</strong> → <strong>Posizione</strong>, e sblocca nexttox.com.</li><li>Torna qui e tocca <strong>Riprova</strong>.</li></ol>",
    aiutoGps_computer: "<ol><li>Clicca l'icona a sinistra dell'indirizzo e consenti la <strong>posizione</strong> a questo sito.</li><li>Clicca <strong>Riprova</strong>.</li></ol><p>Next-To-X è pensata per il telefono in auto: su molti computer la posizione è approssimativa o assente.</p>",
    riprova: "Riprova",
    chiudi: "Chiudi",
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
    titoloPagina: "Next-To-X – Next EV charger on the motorway",
    descrizionePagina: "The next EV charging station along the motorway, on your side of the road. Italy, Germany, Switzerland and Austria. Free, no sign-up.",
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
    versioneApp: ({ versione }) => `App version: ${versione}`,
    versioneSviluppo: 'development',
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
    stazioniDavanti: ({ n }) => (n === 0 ? 'No stations ahead' : `${n} ${plurale(n, 'station', 'stations')} ahead`),
    nonDavanti: 'Already passed or on other roads',
    colonnine: ({ n }) => `${n} ${plurale(n, 'charger', 'chargers')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Road',
    gpsNonDisponibile: "⚠️ Location unavailable — tap here",
    avvertenzaPermesso: "<strong>Next, your browser will ask for your location:</strong> tap Allow, it's how the app finds the chargers ahead of you.",
    permessoTitolo: "📍 Your location is needed",
    permessoTesto: "Next-To-X follows your location to work out which motorway you are on and which way you are going, and to show you the next charger <strong>on your side of the road</strong>.",
    permessoPrivacy: "Your location is only used on your phone: <strong>we never receive or store it.</strong>",
    permessoNota: "When you tap, your browser will ask for permission: choose Allow.",
    attivaPosizione: "Turn on location",
    continuaSenza: "Continue without",
    attivaPosizioneBreve: "📍 Turn on location",
    aiutoGpsTitolo: "📍 How to turn on location",
    aiutoGpsNegato: "Location permission for Next-To-X is blocked, so the app doesn't know where you are. To unblock it:",
    aiutoGpsSegnale: "Your location isn't coming through. Check that it's on in your phone and allowed for your browser:",
    aiutoGps_ios: "<ol><li>iPhone <strong>Settings</strong> → <strong>Privacy &amp; Security</strong> → <strong>Location Services</strong>: turn it on, then under <strong>Safari Websites</strong> choose <strong>While Using the App</strong>.</li><li>In Safari, tap the button to the left of the address (<strong>aA</strong>) → <strong>Website Settings</strong> → <strong>Location</strong>: <strong>Allow</strong> or <strong>Ask</strong>.</li><li>Come back here and tap <strong>Try again</strong>.</li></ol>",
    aiutoGps_android: "<ol><li>Turn on your phone's <strong>Location</strong> from the quick settings panel.</li><li>In Chrome, tap the icon to the left of the address → <strong>Permissions</strong> → <strong>Location</strong>: <strong>Allow</strong>. If you use the app from your home screen: Chrome → ⋮ → <strong>Settings</strong> → <strong>Site settings</strong> → <strong>Location</strong>, and unblock nexttox.com.</li><li>Come back here and tap <strong>Try again</strong>.</li></ol>",
    aiutoGps_computer: "<ol><li>Click the icon to the left of the address and allow <strong>location</strong> for this site.</li><li>Click <strong>Try again</strong>.</li></ol><p>Next-To-X is designed for a phone in the car: on many computers location is approximate or unavailable.</p>",
    riprova: "Try again",
    chiudi: "Close",
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
    titoloPagina: "Next-To-X – Prochaine borne de recharge sur l'autoroute",
    descrizionePagina: "La prochaine borne de recharge pour voiture électrique sur l'autoroute, de votre côté de la chaussée. Italie, Allemagne, Suisse et Autriche. Gratuit, sans inscription.",
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
    versioneApp: ({ versione }) => `Version de l'app : ${versione}`,
    versioneSviluppo: 'développement',
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
    stazioniDavanti: ({ n }) => (n === 0 ? 'Aucune station devant' : `${n} ${plurale(n, 'station', 'stations')} devant`),
    nonDavanti: 'Déjà dépassées ou sur d\'autres routes',
    colonnine: ({ n }) => `${n} ${plurale(n, 'borne', 'bornes')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Route',
    gpsNonDisponibile: "⚠️ Position indisponible — touchez ici",
    avvertenzaPermesso: "<strong>Juste après, le navigateur vous demandera votre position :</strong> touchez Autoriser, elle sert à trouver les bornes devant vous.",
    permessoTitolo: "📍 Votre position est nécessaire",
    permessoTesto: "Next-To-X suit votre position pour savoir sur quelle autoroute et dans quelle direction vous roulez, et vous montrer la prochaine borne <strong>de votre côté de la chaussée</strong>.",
    permessoPrivacy: "La position n'est utilisée que sur votre téléphone : <strong>nous ne la recevons pas et ne l'enregistrons pas.</strong>",
    permessoNota: "En touchant le bouton, le navigateur vous demandera l'autorisation : choisissez Autoriser.",
    attivaPosizione: "Activer la position",
    continuaSenza: "Continuer sans",
    attivaPosizioneBreve: "📍 Activer la position",
    aiutoGpsTitolo: "📍 Comment activer la position",
    aiutoGpsNegato: "L'autorisation de position pour Next-To-X est bloquée : sans elle, l'application ne sait pas où vous êtes. Pour la débloquer :",
    aiutoGpsSegnale: "La position n'arrive pas. Vérifiez qu'elle est activée sur le téléphone et autorisée pour le navigateur :",
    aiutoGps_ios: "<ol><li><strong>Réglages</strong> de l'iPhone → <strong>Confidentialité et sécurité</strong> → <strong>Service de localisation</strong> : activez-le, puis dans <strong>Sites web Safari</strong> choisissez <strong>Lorsque l'app est active</strong>.</li><li>Dans Safari, touchez le bouton à gauche de l'adresse (<strong>aA</strong>) → <strong>Réglages du site web</strong> → <strong>Position</strong> : <strong>Autoriser</strong> ou <strong>Demander</strong>.</li><li>Revenez ici et touchez <strong>Réessayer</strong>.</li></ol>",
    aiutoGps_android: "<ol><li>Activez la <strong>Localisation</strong> du téléphone depuis le panneau des réglages rapides.</li><li>Dans Chrome, touchez l'icône à gauche de l'adresse → <strong>Autorisations</strong> → <strong>Position</strong> : <strong>Autoriser</strong>. Si vous utilisez l'application depuis l'écran d'accueil : Chrome → ⋮ → <strong>Paramètres</strong> → <strong>Paramètres des sites</strong> → <strong>Position</strong>, et débloquez nexttox.com.</li><li>Revenez ici et touchez <strong>Réessayer</strong>.</li></ol>",
    aiutoGps_computer: "<ol><li>Cliquez sur l'icône à gauche de l'adresse et autorisez la <strong>position</strong> pour ce site.</li><li>Cliquez sur <strong>Réessayer</strong>.</li></ol><p>Next-To-X est conçue pour un téléphone en voiture : sur beaucoup d'ordinateurs, la position est approximative ou absente.</p>",
    riprova: "Réessayer",
    chiudi: "Fermer",
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
    titoloPagina: "Next-To-X – Nächste Ladesäule an der Autobahn",
    descrizionePagina: "Die nächste Ladesäule für Elektroautos an der Autobahn, auf deiner Fahrbahnseite. Italien, Deutschland, Schweiz und Österreich. Kostenlos, ohne Anmeldung.",
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
    versioneApp: ({ versione }) => `App-Version: ${versione}`,
    versioneSviluppo: 'Entwicklung',
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
    stazioniDavanti: ({ n }) => (n === 0 ? 'Keine Stationen voraus' : `${n} ${plurale(n, 'Station', 'Stationen')} voraus`),
    nonDavanti: 'Schon passiert oder auf anderen Straßen',
    colonnine: ({ n }) => `${n} ${plurale(n, 'Ladesäule', 'Ladesäulen')}`,
    colonnaArea: 'Station',
    colonnaStrada: 'Straße',
    gpsNonDisponibile: "⚠️ Standort nicht verfügbar — hier tippen",
    avvertenzaPermesso: "<strong>Gleich danach fragt der Browser nach deinem Standort:</strong> tippe auf Erlauben, damit die App die Ladesäulen vor dir findet.",
    permessoTitolo: "📍 Dein Standort wird benötigt",
    permessoTesto: "Next-To-X folgt deinem Standort, um zu erkennen, auf welcher Autobahn und in welche Richtung du fährst, und dir die nächste Ladesäule <strong>auf deiner Fahrbahnseite</strong> zu zeigen.",
    permessoPrivacy: "Der Standort wird nur auf dem Handy verwendet: <strong>wir erhalten und speichern ihn nicht.</strong>",
    permessoNota: "Beim Tippen fragt der Browser nach der Erlaubnis: wähle Erlauben.",
    attivaPosizione: "Standort aktivieren",
    continuaSenza: "Ohne fortfahren",
    attivaPosizioneBreve: "📍 Standort aktivieren",
    aiutoGpsTitolo: "📍 So aktivierst du den Standort",
    aiutoGpsNegato: "Die Standortberechtigung für Next-To-X ist blockiert, deshalb weiß die App nicht, wo du bist. So hebst du die Sperre auf:",
    aiutoGpsSegnale: "Der Standort kommt nicht an. Prüfe, ob er am Handy aktiviert und für den Browser erlaubt ist:",
    aiutoGps_ios: "<ol><li>iPhone-<strong>Einstellungen</strong> → <strong>Datenschutz &amp; Sicherheit</strong> → <strong>Ortungsdienste</strong>: einschalten, dann bei <strong>Safari-Websites</strong> <strong>Beim Verwenden der App</strong> wählen.</li><li>In Safari auf die Taste links neben der Adresse tippen (<strong>aA</strong>) → <strong>Website-Einstellungen</strong> → <strong>Standort</strong>: <strong>Erlauben</strong> oder <strong>Fragen</strong>.</li><li>Hierher zurückkehren und auf <strong>Erneut versuchen</strong> tippen.</li></ol>",
    aiutoGps_android: "<ol><li>Den <strong>Standort</strong> des Handys in den Schnelleinstellungen einschalten.</li><li>In Chrome auf das Symbol links neben der Adresse tippen → <strong>Berechtigungen</strong> → <strong>Standort</strong>: <strong>Zulassen</strong>. Wenn du die App vom Startbildschirm nutzt: Chrome → ⋮ → <strong>Einstellungen</strong> → <strong>Website-Einstellungen</strong> → <strong>Standort</strong>, und nexttox.com freigeben.</li><li>Hierher zurückkehren und auf <strong>Erneut versuchen</strong> tippen.</li></ol>",
    aiutoGps_computer: "<ol><li>Auf das Symbol links neben der Adresse klicken und den <strong>Standort</strong> für diese Website erlauben.</li><li>Auf <strong>Erneut versuchen</strong> klicken.</li></ol><p>Next-To-X ist für das Handy im Auto gedacht: Auf vielen Computern ist der Standort ungenau oder nicht verfügbar.</p>",
    riprova: "Erneut versuchen",
    chiudi: "Schließen",
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

const SITO = 'https://nexttox.com';

/**
 * Titolo e meta description nella lingua scelta (l'HTML ha quelli italiani, per chi non esegue
 * JavaScript); Google legge quelli della pagina renderizzata.
 */
export function impostaTitolo(titolo, descrizione) {
  document.title = titolo;
  document.querySelector('meta[name="description"]')?.setAttribute('content', descrizione);
}

/**
 * Canonical della pagina: l'indirizzo pubblico senza parametri (?debug, ?utm_...), con ?lang=
 * solo se la lingua è forzata, così ogni versione elencata negli hreflang dell'HTML è canonica
 * di se stessa. Nell'HTML non c'è: Google sconsiglia di avere un canonical che JavaScript cambia.
 */
export function impostaCanonical() {
  const forzata = new URLSearchParams(location.search).get('lang')?.toLowerCase();
  const url = new URL(location.pathname.replace(/\/index\.html$/, '/'), SITO);
  if (LINGUE.includes(forzata)) url.searchParams.set('lang', forzata);
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = url.href;
}
