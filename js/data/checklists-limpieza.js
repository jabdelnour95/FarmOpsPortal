export const I_BASICO = [
  'Conexión eléctrica principal funcionando',
  'Funcionamiento de outlets eléctricos',
  'Funcionamiento de luces (internas y externas)',
  'Funcionamiento de abanico(s) / ventilador(es)',
  'Funcionamiento de llavines y cerraduras',
  'Funcionamiento de ventanas (abren, cierran, traban correctamente)',
  'Daños visibles en estructura (paredes, cielo raso, piso, puertas)',
  'Presencia de humedad, manchas de agua o filtraciones',
  'Presencia de plagas o nidos de insectos',
  'Estado de basureros (limpios, con bolsa, tapados)',
];

export const I_BANO = [
  ...I_BASICO,
  'Funcionamiento de ducha (presión y temperatura)',
  'Funcionamiento de grifo del lavatorio',
  'Estado de la caja de aserrín (nivel adecuado, sin mal olor)',
  'Funcionamiento del inodoro / sistema de compostaje',
  'Presencia de fugas o taponamientos visibles',
  'Reposición de papel higiénico, jabón y toallas',
  'Estado de espejos y accesorios de baño',
];

export const I_CASITA = [
  ...I_BASICO,
  'Funcionamiento de ducha (presión y temperatura de agua)',
  'Estado del mosquitero (sin roturas ni separaciones)',
  'Estado del colchón y textiles (sin manchas, sin humedad)',
  'Funcionamiento de cerrojo interior de privacidad',
  'Estado de repisas, mesa y mobiliario',
  'Visibilidad desde exterior (privacidad del huésped)',
];

const banosSeco = (nombre) => ({
  criterios: ['Aserrín suficiente', 'Papel higiénico abastecido', 'Área limpia y sin olores'],
  sections: [{
    title: `Inspección ${nombre}`,
    desc: '',
    items: ['Revisar aserrín — cubrir contenido', 'Verificar stock de papel higiénico'],
    paperField: true,
    extraItems: [
      'Limpiar lavamanos y superficies',
      'Revisar puertas y cerraduras',
      'Reportar a mantenimiento si hay anomalías',
    ],
  }],
});

export const CL_LIMPIEZA = [
  {
    id: 'salon-recepcion', name: 'Salón y Recepción', sub: 'Áreas conjuntas',
    criterios: ['Sin polvo ni residuos en superficies', 'Mobiliario alineado y seco', 'Cubertería y servilletas organizadas', 'Sin basura ni objetos ajenos', 'Mostrador impecable y ordenado'],
    sections: [
      {
        title: 'Limpieza de Salón',
        desc: 'Limpiar el salón principal asegurando pisos, superficies, mobiliario y cubertería en orden.',
        items: ['Barrer y limpiar el piso del salón', 'Limpiar superficies de las mesas', 'Limpiar y ordenar sillas', 'Organizar cubertería y servilletas', 'Verificar que no haya basura ni objetos ajenos'],
      },
      {
        title: 'Limpieza de Recepción',
        desc: 'Mantener la recepción impecable y ordenada.',
        items: ['Limpiar mostrador de recepción', 'Barrer el área', 'Ordenar materiales y documentos visibles', 'Limpiar sillas y área de espera', 'Revisar filtro de agua — Recepción'],
      },
    ],
  },
  {
    id: 'juicebar-cl', name: 'Juice Bar', sub: 'Área exterior de servicio',
    criterios: ['Ningún residuo visible en superficies o pisos', 'Mobiliario alineado y seco', 'Basureros limpios y tapados', 'Área fresca y lista para el próximo servicio'],
    sections: [
      {
        title: 'Limpieza de Juice Bar', desc: '',
        items: ['Confirmar sin huéspedes antes de iniciar', 'Retirar vasos, botellas, cáscaras y servilletas', 'Limpiar mesas, barra y repisas con paño húmedo. Secar completamente', 'Desinfectar manijas y zonas de alto contacto', 'Barrer toda el área: esquinas, debajo de mesas y accesos', 'Trapear con agua y desinfectante', 'Retirar hojas o tierra del exterior', 'Limpiar maceteros', 'Vaciar y reponer bolsa de basura. Mantener tapa cerrada', 'Alinear mesas, sillas y bancos', 'Apagar las luces si no hay uso activo'],
      },
      {
        title: 'Filtro de Agua — Juice Bar',
        desc: 'Verificar que el filtro esté operativo.',
        items: ['Revisar filtro de agua — Juice Bar', 'Reportar cualquier anomalía o filtro que requiera cambio'],
        note: 'Agregar hielo del Juice Bar de estar disponible.',
      },
    ],
  },
  {
    id: 'maloca', name: 'Maloca', sub: 'Área de eventos',
    criterios: ['Piso limpio y seco', 'Columnas y paredes sin residuos', 'Baños limpios y abastecidos', 'Basureros colocados'],
    sections: [
      {
        title: 'Preparación de Maloca', desc: '',
        items: ['Barrer y limpiar el piso (solo con agua)', 'Limpiar columnas, paredes y superficies', 'Retirar objetos de eventos anteriores', 'Verificar que el espacio esté libre y ordenado', 'Colocar basureros', 'Agregar accesorios de yoga si se requiere', 'Limpiar y desinfectar inodoros y lavamanos de baños', 'Limpiar pisos y paredes de baños', 'Reponer papel higiénico y jabón en baños', 'Vaciar y limpiar papeleras de baños', 'Revisar cantidad de servilletas en baños'],
      },
      {
        title: 'Filtro de Agua — Maloca', desc: '',
        items: ['Revisar filtro de agua — Maloca', 'Reportar cualquier anomalía o filtro que requiera cambio'],
      },
    ],
  },
  { id: 'banos-b1',    name: 'Baños Principales B1',  sub: 'Baños secos', ...banosSeco('Baños B1') },
  { id: 'banos-b2',    name: 'Baños Principales B2',  sub: 'Baños secos', ...banosSeco('Baños B2') },
  { id: 'banos-7600',  name: 'Baños 7600',             sub: 'Baños secos', ...banosSeco('Baños 7600') },
  { id: 'banos-madera',name: 'Baños de Madera',        sub: 'Baños secos', ...banosSeco('Baños de Madera') },
  { id: 'banos-teca',  name: 'Baños de Teca',          sub: 'Baños secos', ...banosSeco('Baños de Teca') },
  {
    id: 'estudio-movimiento', name: 'Estudio de Movimiento', sub: 'Área de práctica',
    criterios: ['Piso limpio y seco', 'Superficies sin polvo', 'Espacio libre y ordenado'],
    sections: [{
      title: 'Preparación del Estudio de Movimiento', desc: '',
      items: ['Barrer y limpiar el piso (solo con agua)', 'Limpiar superficies, paredes y columnas', 'Retirar objetos de usos anteriores', 'Verificar que el espacio esté libre y ordenado', 'Colocar basureros'],
    }],
  },
  {
    id: 'cowork', name: 'Cowork', sub: 'Área de trabajo',
    criterios: ['Superficies sin polvo ni manchas', 'Piso limpio y seco', 'Mobiliario alineado', 'Basureros vacíos'],
    sections: [{
      title: 'Preparación de Cowork', desc: '',
      items: ['Barrer y limpiar el piso', 'Limpiar superficies y mobiliario', 'Retirar objetos ajenos', 'Verificar que el espacio esté libre y ordenado', 'Colocar basureros'],
    }],
  },
  {
    id: 'piscina-limp', name: 'Piscina', sub: 'Deck y área exterior',
    criterios: ['Deck limpio y seco', 'Sillas y almohadones distribuidos correctamente', 'Sin almohadones dañados'],
    sections: [{
      title: 'Preparación de Piscina', desc: '',
      items: ['Limpiar deck de la piscina', 'Distribuir sillas según la disposición acordada', 'Verificar que estén en buen estado', 'Sacar los almohadones de bodega', 'Distribuir almohadones según la disposición acordada', 'Retirar almohadones en mal estado y reportar'],
    }],
  },
];
