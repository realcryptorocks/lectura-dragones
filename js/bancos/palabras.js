// Banco de palabras para los huecos de las frases. Todo en minúsculas.
// El nivel de cada palabra lo decide grafias.js, no hace falta anotarlo aquí.

export const COLORES = [
  { id: 'rojo', texto: 'rojo', hex: '#d94141' },
  { id: 'azul', texto: 'azul', hex: '#3b7dd8' },
  { id: 'verde', texto: 'verde', hex: '#4caf50' },
  { id: 'amarillo', texto: 'amarillo', hex: '#f2c14e' },
  { id: 'morado', texto: 'morado', hex: '#8e5bd9' },
  { id: 'naranja', texto: 'naranja', hex: '#f08a3c' },
];

// Rasgos binarios: `con` es el texto cuando el rasgo está, `sin` cuando no.
export const RASGOS = {
  manchas: { con: 'con manchas', sin: 'sin manchas' },
  alas: { con: 'con alas', sin: 'sin alas' },
  cuernos: { con: 'con cuernos', sin: 'sin cuernos' },
  tamano: { con: 'grande', sin: 'pequeño' },
};

export const LUGARES = [
  { id: 'cueva', texto: 'cueva', preposicion: 'en la cueva' },
  { id: 'nido', texto: 'nido', preposicion: 'en el nido' },
  { id: 'rio', texto: 'río', preposicion: 'en el río' },
  { id: 'roca', texto: 'roca', preposicion: 'en la roca' },
  { id: 'arbol', texto: 'árbol', preposicion: 'en el árbol' },
  { id: 'cama', texto: 'cama', preposicion: 'en la cama' },
];

export const NUMEROS = [
  { n: 1, texto: 'uno' },
  { n: 2, texto: 'dos' },
  { n: 3, texto: 'tres' },
  { n: 4, texto: 'cuatro' },
  { n: 5, texto: 'cinco' },
  { n: 6, texto: 'seis' },
];

export const CRIATURAS = {
  huevo: { id: 'huevo', texto: 'huevo', articulo: 'el' },
  dragon: { id: 'dragon', texto: 'dragón', articulo: 'el' },
};
