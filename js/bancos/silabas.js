// Sílabas para los nombres inventados, agrupadas por el nivel en que entran.
// Las de nivel 1 no tienen ninguna grafía difícil. ge/gi y que/qui solo en 7.
export const SILABAS = {
  1: [
    'ma', 'me', 'mi', 'mo', 'mu', 'pa', 'pe', 'pi', 'po', 'pu',
    'ta', 'te', 'ti', 'to', 'tu', 'la', 'le', 'li', 'lo', 'lu',
    'na', 'ne', 'ni', 'no', 'nu', 'sa', 'se', 'si', 'so', 'su',
    'da', 'de', 'di', 'do', 'du', 'ra', 're', 'ri', 'ro', 'ru',
    'fa', 'fe', 'fi', 'fo', 'fu', 'za', 'zo', 'zu', 'ña', 'ño',
    'lla', 'llo', 'cha', 'che', 'cho', 'xa', 'xo', 'ya', 'yo',
  ],
  3: ['ca', 'co', 'cu'],
  4: ['ga', 'go', 'gu'],
  5: ['ja', 'jo', 'ju', 'je'],
  6: ['ba', 'be', 'bi', 'bo', 'bu', 'va', 've', 'vi', 'vo', 'vu'],
  7: ['ge', 'gi', 'que', 'qui', 'gue', 'gui', 'tra', 'tre', 'tro', 'bra', 'bro', 'pla', 'plo', 'dra', 'dro', 'cra', 'cro', 'fla', 'flo', 'gra', 'gro'],
};

// Consonantes con que puede acabar un nombre.
export const FINALES = ['', '', 'n', 'r', 'l', 's', 'k'];
