// Strumenti e funzioni in prova: compaiono solo aprendo la pagina con ?debug=true
export const MODALITA_DEBUG = ['true', '1'].includes(new URLSearchParams(location.search).get('debug'));
