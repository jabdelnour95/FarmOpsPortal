export const CAL_IDS = {
  'cal-limpieza':   'c_054c31b4e8e09f946d99b72bf667d10578fd7db7427906dd3604c39926371484@group.calendar.google.com',
  'cal-manto':      'c_13962be80e3d98529a539831bf1b832b9f1839925686f69f57b2bf86dc06984e@group.calendar.google.com',
  'cal-transporte': 'c_3d9aa6550f8f2406c869c3f26c6c5779ddbadcacae515f94bbd8b8818ae27d12@group.calendar.google.com',
};

export const CAL_LABELS = {
  'cal-limpieza':   'Limpieza',
  'cal-manto':      'Mantenimiento',
  'cal-transporte': 'Proveduría y Transportes',
};

export const DEPTS = {
  limpieza: {
    label: 'Limpieza',
    resources: [
      { id: 'manual-limp',   title: 'Manual de Limpieza General', desc: 'Procedimientos y estándares',    type: 'doc' },
      { id: 'checklist-limp',title: 'Checklist por Área',         desc: 'Verificación de tareas',         type: 'checklist' },
      { id: 'inventarios',   title: 'Inventarios',                desc: 'Control de insumos',             type: 'inventarios' },
      { id: 'frases-en',     title: 'Frases Comunes en Inglés',   desc: 'Próximamente disponible' },
      { id: 'cal-limpieza',  title: 'Calendario',                 desc: 'Turnos y eventos del equipo',    type: 'cal' },
    ],
    reports: [
      { label: 'Reporte de Labores', form: 'labores', cls: '' },
      { label: 'Limpieza de Áreas',  form: 'areas',   cls: '' },
    ],
  },
  mantenimiento: {
    label: 'Mantenimiento',
    resources: [
      { id: 'manual-prev',    title: 'Manual de Mantenimiento',  desc: 'Estándares y procedimientos',     type: 'doc' },
      { id: 'manual-piscina', title: 'Manual de Piscina',        desc: 'Mantenimiento de piscinas' },
      { id: 'checklist-manto',title: 'Checklist por Cluster',    desc: 'Inspección por zona',             type: 'checklist' },
      { id: 'cal-manto',      title: 'Calendario',               desc: 'Tareas programadas y eventos',    type: 'cal' },
    ],
    reports: [
      { label: 'Reporte de Trabajo',      form: 'trabajo',    cls: '' },
      { label: 'Reporte de Avería',        form: 'averia',     cls: 'averia' },
      { label: 'Solicitud de Materiales',  form: 'materiales', cls: 'materiales' },
    ],
  },
  proveeduria: {
    label: 'Proveduría y Transportes',
    resources: [
      { id: 'cal-transporte', title: 'Calendario de Transportes', desc: 'Viajes y logística',              type: 'cal' },
      { id: 'proveedores',    title: 'Catálogo de Proveedores',   desc: 'Contactos, productos y crédito',  type: 'proveedores' },
    ],
    reports: [],
  },
};
