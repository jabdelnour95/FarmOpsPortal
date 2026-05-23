import { I_BASICO, I_BANO, I_CASITA } from './checklists-limpieza.js';

export const CL_MANTO_CLUSTERS = [
  {
    id: 'transito', name: 'Tránsito Constante', sub: 'Oficina · Juice Bar · Salón de Cocina y Recepción',
    areas: [
      { id: 'oficina', name: 'Oficina', items: [...I_BASICO, 'Funcionamiento de equipos de cómputo', 'Estado de router / conectividad', 'Funcionamiento del aire acondicionado (si aplica)', 'Estado de impresora y periféricos', 'Cables organizados, sin riesgos de tropiezo'] },
      { id: 'juicebar', name: 'Juice Bar', items: [...I_BASICO, 'Funcionamiento de licuadora / extractor', 'Estado de refrigeradora o nevera de bebidas', 'Funcionamiento del grifo / toma de agua', 'Estado de barra exterior', 'Stock visible de insumos (reportar faltantes)'] },
      { id: 'salon-rec', name: 'Salón de Cocina y Recepción', items: [...I_BASICO, 'Estado de mostrador y mobiliario', 'Estado de filtro de agua (presión y funcionamiento)'] },
    ],
  },
  {
    id: 'cluster1', name: 'Cluster 1', sub: 'Bodega · Terralab · Puente · Movement Studio · Lounge · Duchas · Baños Principales',
    areas: [
      { id: 'storage', name: 'Storage / Bodega', items: [...I_BASICO, 'Organización visible del almacenamiento', 'Estado de estantes y anclajes', 'Presencia de plagas en productos almacenados', 'Insumos críticos en stock adecuado'] },
      { id: 'terralab', name: 'Terralab', items: [...I_BASICO, 'Estado de equipos y herramientas de laboratorio', 'Funcionamiento de equipos de refrigeración o incubación', 'Organización y etiquetado de insumos', 'Ventilación adecuada del espacio'] },
      { id: 'bridge', name: 'Hanging Bridge', note: '⚠️ Estructura de seguridad crítica.', items: ['Estado de cables o estructura de soporte', 'Estado de tablones o superficie de paso', 'Barandas firmes y sin daños', 'Sin presencia de humedad excesiva o vegetación adherida', 'Iluminación del puente funcionando (si aplica)'] },
      { id: 'movement', name: 'Movement Studio', items: [...I_BASICO, 'Estado del piso', 'Estado de espejos', 'Funcionamiento de equipo de sonido', 'Estado de colchonetas / props', 'Espacio libre de obstáculos'] },
      { id: 'lounge', name: 'Lounge / Deck', items: [...I_BASICO, 'Estado de muebles y tapizado', 'Estado de hamacas o mobiliario exterior', 'Estado del deck (sin tablas sueltas, astillas o daños)', 'Iluminación exterior funcionando'] },
      { id: 'duchas-main', name: 'Duchas Principales', items: I_BANO },
      { id: 'banos-main', name: 'Baños Principales', items: I_BANO },
    ],
  },
  {
    id: 'cluster2', name: 'Cluster 2', sub: 'Toensmeier · Baños 7600 · Baño del Templo · Lancaster · Götsch · Holzer · Cocina Residentes · Ingham · Carson',
    areas: [
      { id: 'toensmeier', name: 'Toensmeier', items: I_CASITA },
      { id: 'banos7600', name: 'Baños 7600', items: I_BANO },
      { id: 'bath-bridge', name: 'Baño del Templo', items: I_BANO },
      { id: 'lancaster', name: 'Lancaster', items: I_CASITA },
      { id: 'gotsch', name: 'Götsch', items: I_CASITA },
      { id: 'holzer', name: 'Holzer', items: I_CASITA },
      {
        id: 'cocina-res', name: 'Cocina de Residentes',
        items: [...I_BASICO, 'Funcionamiento de quemadores / cocina', 'Funcionamiento de extractor de olores / campana', 'Estado de refrigeradora', 'Funcionamiento de lavaplatos y grifo', 'Presencia de fugas bajo el fregadero', 'Estado de superficies de preparación', 'Almacenamiento correcto de alimentos e insumos'],
      },
      { id: 'ingham', name: 'Ingham', items: I_CASITA },
      { id: 'carson', name: 'Carson', items: I_CASITA },
    ],
  },
  {
    id: 'cluster3', name: 'Cluster 3', sub: 'Baño de Madera · Hememway · Primavesi · Salatin · Shiva · Savory · Yeomans · Fukuoka · Mollison',
    areas: [
      { id: 'bath-wood', name: 'Baño de Madera', items: I_BANO },
      { id: 'hememway',  name: 'Hememway',  items: I_CASITA },
      { id: 'primavesi', name: 'Primavesi', items: I_CASITA },
      { id: 'salatin',   name: 'Salatin',   items: I_CASITA },
      { id: 'shiva',     name: 'Shiva',     items: I_CASITA },
      { id: 'savory',    name: 'Savory',    items: I_CASITA },
      { id: 'yeomans',   name: 'Yeomans',   items: I_CASITA },
      { id: 'fukuoka',   name: 'Fukuoka',   items: I_CASITA },
      { id: 'mollison',  name: 'Mollison',  items: I_CASITA },
    ],
  },
  {
    id: 'cluster4', name: 'Cluster 4', sub: 'Starhawk · Crawford · Eisenstein · Doherty · Macy · Baños Bahareque · Wex Camp · Maloca',
    areas: [
      { id: 'starhawk',   name: 'Starhawk',   items: I_CASITA },
      { id: 'crawford',   name: 'Crawford',   items: I_CASITA },
      { id: 'eisenstein', name: 'Eisenstein', items: I_CASITA },
      { id: 'doherty',    name: 'Doherty',    items: I_CASITA },
      { id: 'macy',       name: 'Macy',       items: I_CASITA },
      { id: 'bah-bath', name: 'Baños Bahareque', items: I_BANO },
      {
        id: 'wex-camp', name: 'Wex Camp',
        items: [...I_BASICO, 'Estado de carpa o estructura temporal', 'Estado de tarima o base elevada', 'Ventilación e iluminación adecuadas', 'Funcionamiento del sistema sanitario asociado'],
      },
      {
        id: 'maloca-ev', name: 'Maloca', note: '⚠️ Espacio de alta significancia cultural.',
        items: [...I_BASICO, 'Estado de estructura de techo', 'Estado de bambú o madera estructural expuesta', 'Estado del piso', 'Funcionamiento de sistema de audio', 'Estado del baño y bodega asociados'],
      },
      { id: 'maloca-bath', name: 'Maloca Bathroom', items: I_BANO },
      {
        id: 'maloca-st', name: 'Maloca Storage',
        items: [...I_BASICO, 'Organización visible del almacenamiento', 'Estado de estantes y anclajes', 'Presencia de plagas en productos almacenados', 'Insumos críticos en stock adecuado'],
      },
    ],
  },
  {
    id: 'diario', name: 'Atención Diaria', sub: 'Piscina · Sistemas de Agua · Casita Azul',
    areas: [
      {
        id: 'piscina-mt', name: 'Piscina',
        note: 'El sistema arranca a 20 PSI y cae a 10 PSI. Nunca debe superar los 25 PSI.',
        items: ['Estado de estructura, deck, duchas y enchapado', 'Estado inicial del sistema de bombeo y filtración', 'Niveles químicos: Sal PPM (mín. 3000), pH, ORP', 'Revisión de canastillas', 'Revisión visual de canastilla de bomba', 'Aspirado y llenado de piscina', 'Niveles químicos finales: Sal PPM (mín. 3000), pH, ORP'],
      },
      {
        id: 'agua', name: 'Sistemas de Agua',
        items: ['Nivel de agua visible o indicado en el sistema', 'Presencia de fugas, humedad inusual o manchas en tuberías', 'Estado físico del tanque o estructura', 'Lectura del medidor correspondiente', 'Presión del sistema (normal / baja / alta)', 'Estado de tapas y sellos', 'Funcionamiento de válvulas de corte', 'Presencia de vectores o contaminantes externos', 'Registro completado en formulario'],
      },
      { id: 'casita-azul', name: 'Casita Azul', items: I_BASICO },
    ],
  },
];
