import { show } from './navigation.js';
import { nav } from './navigation.js';
import { openResource } from './navigation.js';

// ── Render helpers ──

function mkStepsMT(steps) {
  return steps.map(([t, d], i) => `<div style="display:flex;gap:.75rem;margin-bottom:.85rem;align-items:flex-start;">
    <div style="width:26px;height:26px;background:var(--clay);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:.72rem;font-family:sans-serif;font-weight:600;flex-shrink:0;margin-top:.1rem;">${i + 1}</div>
    <div><div style="font-size:.82rem;font-family:sans-serif;font-weight:600;color:var(--brown);margin-bottom:.25rem;">${t}</div>
    <div style="font-size:.78rem;font-family:sans-serif;color:var(--brown);line-height:1.5;">${d}</div></div></div>`).join('');
}

function mkAreaLimp(sub, steps, criterios) {
  return `<div style="font-size:.75rem;font-family:sans-serif;font-style:italic;color:var(--tm);margin-bottom:1rem;">${sub}</div>`
    + mkStepsMT(steps)
    + `<div class="crit-box" style="margin-top:.5rem;"><div class="crit-lbl">Criterios de limpieza esperada</div>
    ${criterios.map(c => `<div class="crit-row">✓ ${c}</div>`).join('')}</div>`;
}

function mkRolTable(rows) {
  return `<div style="border-radius:8px;overflow:hidden;border:1px solid rgba(84,66,54,.1);">
    ${rows.map(([day, t1, a1, t2, a2], i) => `
      <div style="background:${i % 2 === 0 ? 'white' : '#faf8f4'};padding:.65rem .8rem;border-bottom:1px solid rgba(84,66,54,.06);">
        <div style="font-size:.75rem;font-family:sans-serif;font-weight:600;color:var(--brown);margin-bottom:.35rem;">${day}</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          <span style="font-size:.65rem;font-family:sans-serif;background:rgba(113,127,126,.15);color:var(--blue);padding:.15rem .45rem;border-radius:20px;white-space:nowrap;">${t1}</span>
          <span style="font-size:.7rem;font-family:sans-serif;color:var(--brown);flex:1;line-height:1.4;">${a1}</span>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.3rem;">
          <span style="font-size:.65rem;font-family:sans-serif;background:rgba(153,92,68,.12);color:var(--clay);padding:.15rem .45rem;border-radius:20px;white-space:nowrap;">${t2}</span>
          <span style="font-size:.7rem;font-family:sans-serif;color:var(--brown);flex:1;line-height:1.4;">${a2}</span>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── Manual de Limpieza ──

const MANUAL_LMP_SECS = [
  { id: 'roles',          title: 'Roles y Turnos' },
  { id: 'criterios-prep', title: 'Criterios y Preparación' },
  { id: 'detalles',       title: 'Detalles al Limpiar' },
  { divider: 'Áreas Comunes' },
  { id: 'oficina',        title: 'Oficina' },
  { id: 'juicebar',       title: 'Juice Bar' },
  { id: 'recepcion',      title: 'Recepción' },
  { id: 'comedor',        title: 'Cocina / Comedor' },
  { id: 'templo',         title: 'Templo' },
  { id: 'cowork',         title: 'Cowork' },
  { divider: 'Habitaciones' },
  { id: 'casitas-madera', title: 'Casitas de Madera' },
  { id: 'casitas-bah',    title: 'Casitas de Bahareque' },
  { id: 'productos',      title: 'Catálogo de Productos' },
];

export function renderManualLimp() {
  let html = `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1.2rem;">Estándares, procedimientos y criterios de limpieza · Versión 1.0 · 2025</div>`;
  MANUAL_LMP_SECS.forEach(s => {
    if (s.divider) html += `<div class="sec-band">${s.divider}</div>`;
    else html += `<div class="gcard" onclick="openManualSection('limp','${s.id}','${s.title}')" style="margin-bottom:.6rem;"><div class="ct">${s.title}</div></div>`;
  });
  return html;
}

// ── Manual de Mantenimiento ──

const MANUAL_MT_SECS = [
  { id: 'intro',        title: 'Introducción' },
  { id: 'criterios-mt', title: 'Criterios Generales' },
  { id: 'seguridad',    title: 'Aspectos de Seguridad' },
  { id: 'prep-mt',      title: 'Preparación del Día' },
  { id: 'organizacion', title: 'Organización de la Propiedad' },
  { id: 'agua',         title: 'Sistemas de Agua' },
  { id: 'registro',     title: 'Registro y Reporte de Anomalías' },
];

export function renderManualManto() {
  return `<div style="font-size:.75rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1.2rem;">Estándares, procedimientos e inspecciones de mantenimiento · Versión 1.0 · 2025</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;">
    ${MANUAL_MT_SECS.map(s => `<div class="gcard" onclick="openManualSection('manto','${s.id}','${s.title}')"><div class="ct">${s.title}</div></div>`).join('')}
  </div>`;
}

// ── Section content ──

const MANUAL_LMP_CONTENT = {
  roles: `<div style="font-size:.78rem;font-family:sans-serif;color:var(--brown);line-height:1.5;margin-bottom:1rem;">El equipo de limpieza opera en dos roles con asignaciones semanales rotativas. Cada rol cubre dos turnos diarios: <strong>AM</strong> (7:00am – 12:00md) y <strong>PM</strong> (12:30pm – 3:00pm).</div>
  <div style="background:rgba(113,127,126,.08);border:1px solid rgba(113,127,126,.2);border-radius:10px;padding:.9rem;margin-bottom:1rem;">
    <div style="font-size:.85rem;font-weight:600;font-family:sans-serif;color:var(--blue);margin-bottom:.6rem;font-style:italic;">Rol 1</div>
    ${mkRolTable([['Lunes','AM','Salón de Cocina y Recepción · Baños principales','PM','Casita Azul · Lavandería'],['Martes','AM','Salón de Cocina y Recepción · Baños 7600 / Baños de Madera · Oficina · Maloca y baños · Toensmeier · Hememway · Primavesi · Salatin','PM','Shiva · Savory · Yeomans · Fukuoka · Mollison'],['Miércoles','AM','Deck de Piscina · Juice Bar · Baños de Teca · Cocina de Residentes · Movement Studio · Salón de Cocina y Recepción','PM','Baños de Teca · Organización Bodega HK · Repaso Baños principales'],['Jueves','AM','Salón de Cocina y Recepción · Baños 7600 / Baños de Madera · Terralab y bodega · Maloca y baños · Baños de Bahareque · Duchas de Bahareque','PM','Lancaster · Götsch · Holzer · Ingham · Carson · Repaso Baño de Madera + Baños Principales'],['Viernes','AM','Salón de Cocina y Recepción · Duchas principales · Lavado tubos de baño','PM','Baños Principales · Lounge / Deck · Starhawk · Eisenstein · Macy']])}
  </div>
  <div style="background:rgba(153,92,68,.06);border:1px solid rgba(153,92,68,.15);border-radius:10px;padding:.9rem;">
    <div style="font-size:.85rem;font-weight:600;font-family:sans-serif;color:var(--clay);margin-bottom:.6rem;font-style:italic;">Rol 2</div>
    ${mkRolTable([['Lunes','AM','Deck de Piscina · Baños 7600 / Baños de Madera · Reunión de Operaciones','PM','Baños de Teca · Bodega de HK'],['Martes','AM','Baños principales · Juice Bar · Terralab y bodega · Maloca y baños · Baños de Bahareque · Cocina de Residentes · Salón de Cocina y Recepción','PM','Lancaster · Götsch · Holzer · Ingham · Carson · Repaso Baño de Madera + Baños Principales'],['Miércoles','AM','Salón de Cocina y Recepción · Duchas principales · Baños principales · Baños 7600 / Baños de Madera · Cocina de Residentes · Lounge / Deck · Salón de Cocina y Recepción','PM','Limpieza de Vidrios General · Casita Azul'],['Jueves','AM','Baños principales · Juice Bar · Maloca y baños · Oficina · Toensmeier · Hememway · Primavesi · Salatin','PM','Shiva · Savory · Yeomans · Fukuoka · Mollison · Ingham'],['Viernes','AM','Baños principales · Baños 7600 / Baños de Madera · Lavado de salón','PM','Baños de Teca · Movement Studio · Sillas Juice Bar · Crawford · Doherty']])}
  </div>`,

  'criterios-prep': `<div style="font-size:.78rem;font-family:sans-serif;color:var(--tm);font-style:italic;margin-bottom:1rem;">Principios base y preparación antes de comenzar el turno</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:1.2rem;">
    ${[['OBSERVABLE','Cualquier persona puede verificar el resultado.'],['REPETIBLE','El resultado no depende de quién limpió; siempre es el mismo.'],['SUFICIENTE','Limpieza efectiva sin obsesión por la perfección. El tiempo importa.'],['SOSTENIBLE','Se puede mantener con ocupación alta o baja, sin agotar al equipo.']].map(([t, d]) => `<div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.85rem .8rem;"><div style="font-size:.72rem;font-weight:600;font-family:sans-serif;color:var(--clay);letter-spacing:.06em;margin-bottom:.25rem;">${t}</div><div style="font-size:.75rem;font-family:sans-serif;color:var(--brown);line-height:1.4;">${d}</div></div>`).join('')}
  </div>
  ${mkStepsMT([['Revisión del Rol','Llegar puntualmente y revisar la asignación de áreas del día. Confirmar tareas especiales: eventos, visitas, inspecciones.'],['Preparación Personal','Usar uniforme limpio, zapatos cerrados, cabello recogido. Evitar perfumes fuertes. Lavarse las manos antes de empezar.'],['Revisión del Equipo','Trapos limpios, escoba, trapeador, cepillos, guantes, paños de microfibra, esponjas. Desinfectante, limpiavidrios, jabón multiuso, bolsas de basura.'],['Inspección Visual','Pasar por las áreas asignadas haciendo una revisión rápida. Ver ocupación, identificar zonas prioritarias, detectar peligros.'],['Coordinación del Equipo','Comunicar si se necesita apoyo. Avisar a supervisión si falta algún insumo.'],['Actitud','Buena disposición, discreción y comunicación con huéspedes y equipo.']])}`,

  detalles: `<div class="doc-note" style="margin-bottom:.9rem;">⚠️ Si hay alguien en el espacio: esperar si está activamente en uso. Nunca entrar a casitas o baños si hay alguien adentro.</div>`
    + mkStepsMT([['Preparación','Verificar que el área esté libre. Usar guantes y equipo adecuado. Reunir todos los materiales antes de empezar.'],['Superficies y Mobiliario','Quitar polvo de mesas, repisas, marcos, interruptores y ventiladores. Limpiar manchas visibles. Paño húmedo → secar de inmediato.'],['Pisos','Barrer primero, incluyendo debajo de muebles. Trapear del fondo hacia la salida. Revisar drenajes.'],['Ventanas y Vidrios','Paño seco primero, luego húmedo o limpiavidrios. Revisar marcos y rieles.'],['Baños (Compostaje)','Verificar capa de aserrín. Lavar pisos, paredes, espejos y desagües. Reponer papel, jabón y toallas.'],['Presentación Final','Revisar olor, ventilar si necesario. Alinear muebles. Apagar luces innecesarias.']]),

  oficina:    mkAreaLimp('Área administrativa y operativa',[['Revisión Previa','Confirmar sin reuniones en curso. Anunciarse al entrar.'],['Superficies','Retirar polvo de escritorios, repisas, lámparas y marcos. Limpiar pantallas con paño seco. Desinfectar teléfonos, manijas e interruptores.'],['Pisos','Barrer y trapear con desinfectante suave.'],['Basureros','Vaciar y reemplazar bolsa.'],['Organización','Alinear sillas, cerrar cajones, agrupar cables sueltos.'],['Refrigeradora','Limpiar interior y exterior. Eliminar alimentos en mal estado.'],['Revisión Final','Verificar que luces y aires estén apagados. Dejar registro en WhatsApp.']],['Ninguna superficie con polvo ni manchas','Pisos secos y sin marcas','Escritorios libres de residuos','Basureros vacíos y limpios','Olor neutro','Área lista para uso inmediato']),
  juicebar:   mkAreaLimp('Área exterior de servicio de jugos y bebidas',[['Revisión Inicial','Confirmar sin huéspedes. Retirar vasos, botellas y servilletas.'],['Superficies','Limpiar mesas, barra y repisas con paño húmedo. Secar completamente.'],['Pisos y Entorno','Barrer toda el área. Trapear con agua y desinfectante. Retirar hojas del exterior.'],['Basureros','Vaciar en cada turno. Mantener tapa cerrada.'],['Presentación','Alinear mesas, sillas y bancos. Limpiar elementos decorativos.'],['Revisión Final','Confirmar que el área luzca seca, limpia y ordenada.']],['Ningún residuo visible en superficies o pisos','Mobiliario alineado y seco','Basureros limpios y tapados','Área fresca y lista para el próximo servicio']),
  recepcion:  mkAreaLimp('Punto de bienvenida — zona de alto tránsito',[['Revisión Inicial','Confirmar sin check-in en proceso.'],['Superficies y Mobiliario','Retirar polvo y manchas del mostrador, mesas, sillas y repisas. Desinfectar áreas de alto contacto.'],['Pisos','Barrer con atención a esquinas. Trapear con desinfectante neutro.'],['Basureros y Decoración','Vaciar el basurero. Revisar plantas.'],['Revisión Final','Alinear sillas, cerrar cajones. Registrar en bitácora.']],['Ningún rastro de polvo ni basura','Mobiliario ordenado, limpio y seco','Olor agradable y fresco','Área lista para recibir huéspedes']),
  comedor:    mkAreaLimp('Área de alimentación diaria del equipo y huéspedes',[['Revisión Inicial','Verificar sin personas comiendo. Retirar platos y utensilios olvidados.'],['Superficies y Mobiliario','Limpiar mesas, bancas y sillas. Secar completamente. Alinear.'],['Estaciones de Servicio','Limpiar dispensadores, termos y condimentos. Quitar salpicaduras.'],['Pisos','Barrer restos de comida. Trapear con desinfectante neutro.'],['Basureros','Vaciar mínimo dos veces al día. Mantener tapa cerrada.'],['Revisión Final','Registrar en bitácora: hora, responsable, observaciones.']],['Mesas sin residuos, secas y desinfectadas','Sillas limpias y alineadas','Piso sin restos ni humedad','Basureros vacíos y sin olor','Área ventilada y lista']),
  templo:     `<div class="doc-note" style="margin-bottom:.9rem;">⚠️ Espacio de alta sensibilidad. Limpiar con discreción y sin alterar objetos sagrados sin autorización.</div>` + mkAreaLimp('Espacio de meditación, ceremonias y práctica espiritual',[['Revisión Inicial','Confirmar sin actividades en curso.'],['Superficies','Quitar polvo suavemente con paño seco. No mover objetos de altar sin autorización.'],['Piso','Barrer con escoba suave. Trapear con desinfectante neutro. Asegurar que quede completamente seco.'],['Textiles y Cojines','Sacudir o aspirar suavemente. Manchas: reportar para lavado.'],['Ventilación y Aroma','Abrir ventanas unos minutos. No usar ambientadores artificiales.'],['Revisión Final','Verificar que todo esté en su lugar. Registrar en bitácora.']],['Superficies libres de polvo y telarañas','Piso limpio y seco, sin marcas','Cojines alineados, altares intactos','Olor natural y fresco','Ambiente sereno']),
  cowork:     mkAreaLimp('Espacio de trabajo compartido',[['Revisión Inicial','Verificar si hay personas trabajando. Limpiar silenciosamente los sectores vacíos.'],['Superficies y Mobiliario','Quitar polvo de mesas, escritorios, repisas y sillas. Desinfectar superficies de alto contacto.'],['Equipos Electrónicos','Limpiar pantallas y teclados con paño seco — sin líquidos.'],['Pisos','Barrer incluyendo debajo de escritorios. Trapear con desinfectante neutro.'],['Basureros','Vaciar diariamente.'],['Revisión Final','Apagar luces y ventiladores. Registrar en bitácora.']],['Superficies libres de polvo y manchas','Pisos secos, sin residuos','Mobiliario alineado','Basureros vacíos','Olor fresco y ambiente profesional']),
  'casitas-madera': `<div class="doc-note" style="margin-bottom:.9rem;">⚠️ Privacidad del huésped: tocar 3 veces y anunciarse. Nunca entrar sin verificar ocupación.</div>` + mkAreaLimp('Unidades de alojamiento en madera',[['Ingreso y Protocolo','Consultar lista de habitaciones ocupadas. Nunca abrir puerta cerrada.'],['Ventilación Inicial','Abrir puertas y ventanas. Revisar si hay humedad u olores.'],['Cama y Textiles','Retirar sábanas solo si checkout. Forro ajustado → sábana uniforme → duvet centrado → almohadas con abertura hacia adentro. ⚠️ NO colocar toallas ni adornos sobre la cama.'],['Superficies y Mobiliario','Quitar polvo de repisas, mesas y lámparas. Desinfectante neutro. No usar cloro sobre madera.'],['Piso','Barrer completamente. Trapear con agua y desinfectante suave — sin exceso de humedad.'],['Ventanas','Limpiar vidrios. Revisar marcos, mosquiteros y rieles.'],['Revisión Final','Cama perfectamente hecha. Mobiliario alineado. Luces apagadas.']],['Olor fresco y natural','Piso limpio y seco, sin polvo ni insectos','Mobiliario alineado','Cama impecablemente presentada','Área lista para recibir huésped']),
  'casitas-bah':    `<div class="doc-note" style="margin-bottom:.9rem;">⚠️ Privacidad del huésped: tocar 3 veces y anunciarse.</div>` + mkAreaLimp('Unidades en materiales naturales — barro, bambú y madera',[['Ingreso y Protocolo','Consultar lista de habitaciones ocupadas. Nunca abrir puerta cerrada.'],['Ventilación Inicial','Abrir puertas y ventanas. Especial cuidado con humedad.'],['Cama y Textiles','Retirar sábanas solo si checkout. Sábana: doblar 20–25 cm sobre el borde superior. ⚠️ NO colocar toallas ni adornos sobre la cama.'],['Superficies y Mobiliario','No usar cloro. Especial cuidado en superficies de barro — evitar exceso de humedad.'],['Piso','Barrer completamente. Trapear sin exceso de humedad.'],['Revisión Final','Cama perfectamente hecha. Mobiliario alineado.']],['Olor fresco y natural','Piso limpio y seco','Cama impecablemente presentada','Materiales naturales sin daños por humedad']),
  productos: `<div class="doc-note">📌 Catálogo de insumos aprobados por efectividad, seguridad y compatibilidad con materiales naturales.</div><div class="cs" style="padding:2rem 0;"><div class="csi">🧴</div><h3>Fichas de Productos</h3><p>Próximamente: descripción · dilución recomendada · frecuencia · precauciones.</p></div>`,
};

const MANUAL_MT_CONTENT = {
  intro: `<p style="font-size:.82rem;font-family:sans-serif;color:var(--brown);line-height:1.6;margin-bottom:.8rem;">Este manual establece los estándares, procedimientos e inspecciones de mantenimiento para la totalidad de los espacios de Tierramor.</p>
  <div class="doc-note">El departamento opera con dos roles: <strong>Responsable de piscina</strong> y <strong>Responsable de sistemas de agua</strong>.</div>`,

  'criterios-mt': `<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;">${[['PREVENTIVO','Identificar problemas antes de que se conviertan en fallas.'],['DOCUMENTADO','Toda anomalía se registra. Lo que no se escribe no existe.'],['OPORTUNO','Una intervención a tiempo evita daños mayores.'],['SEGURO','No intervenir en sistemas eléctricos o estructurales sin autorización.']].map(([t, d]) => `<div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:10px;padding:.85rem .8rem;"><div style="font-size:.72rem;font-weight:600;font-family:sans-serif;color:var(--clay);letter-spacing:.06em;margin-bottom:.25rem;">${t}</div><div style="font-size:.75rem;font-family:sans-serif;color:var(--brown);line-height:1.4;">${d}</div></div>`).join('')}</div>`,

  seguridad: `<div class="doc-note">⚠️ El cumplimiento de estas normas es obligatorio. Ante cualquier duda, consultar antes de actuar.</div>` + mkStepsMT([['EPP','Guantes, calzado cerrado antideslizante, mascarilla con químicos, lentes en trabajos con partículas, protector solar en exteriores.'],['Electricidad','⚠️ NO intervenir en tableros ni cableado interno. Reportar: cables expuestos, quemaduras en outlets, olor a quemado.'],['Sistemas de Agua','Cerrar la válvula correspondiente antes de intervenir en tuberías. Reportar fugas de inmediato.'],['Trabajo en Altura','Usar escalera estable. No trabajar en altura con lluvia o piso mojado. Comunicar al compañero — nunca solo.'],['Herramientas y Químicos','Guardar herramientas en bodega. Leer instrucciones de dilución. Mantener productos etiquetados.'],['Emergencias','Falla eléctrica mayor: reportar de inmediato. Fuga significativa: cerrar válvula y reportar. Daño estructural: acordonar el área.']]),

  'prep-mt': mkStepsMT([['Revisión del Rol','Revisar la asignación del día: cluster asignado, tareas especiales y prioridades.'],['Preparación Personal','Uniforme limpio, calzado cerrado y equipo de protección disponible.'],['Revisión del Equipo','Verificar kit de herramientas: llaves, destornilladores, linterna, cinta métrica, cinta aislante.'],['Inspección Visual Inicial','Al llegar a cada área: observar antes de tocar. Detectar anomalías evidentes.'],['Registro y Comunicación','Toda anomalía debe registrarse. Clasificar: URGENTE / PRIORIDAD / PROGRAMAR.']]),

  organizacion: `${['Tránsito Constante — Oficina · Juice Bar · Salón de Cocina y Recepción','Cluster 1 — Storage · Terralab · Hanging Bridge · Movement Studio · Lounge · Main Shower · Main Bathrooms','Cluster 2 — Toensmeier · Baños 7600 · Baño del Templo · Lancaster · Götsch · Holzer · Cocina de Residentes · Ingham · Carson','Cluster 3 — Wooden Bathroom · Hememway · Primavesi · Salatin · Shiva · Savory · Yeomans · Fukuoka · Mollison','Cluster 4 — Starhawk · Crawford · Eisenstein · Doherty · Macy · Baños Bahareque · Wex Camp · Maloca','Atención Diaria — Piscina · Sistemas de Agua · Casita Azul'].map(c => `<div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:8px;padding:.75rem;margin-bottom:.5rem;font-size:.8rem;font-family:sans-serif;color:var(--brown);">${c}</div>`).join('')}`,

  agua: `<div class="doc-note" style="margin-bottom:.8rem;">⚠️ Ante cualquier anomalía en los sistemas de agua, reportar de inmediato. No intervenir sin autorización.</div>
  ${[['M1','Pozo Principal','salida del tanque a la par del pozo'],['—','Tanques Pozo Principal','sin medidor activo'],['M2','Tanques Ojoche','entrada de los tanques en la loma'],['M4','Tanque Potable','entrada del tanque a la par de la bodega'],['—','Tanques Bahareque','sin medidor activo'],['—','Sistema Pozo Maloca','sin medidor activo'],['M5/M6','Tanques Piscina','izquierda y derecha']].map(([m, n, d]) => `<div style="background:white;border:1px solid rgba(84,66,54,.1);border-radius:8px;padding:.7rem;margin-bottom:.45rem;display:flex;gap:.7rem;align-items:flex-start;"><span style="font-size:.68rem;font-family:sans-serif;font-weight:600;color:var(--clay);min-width:28px;">${m}</span><div><div style="font-size:.8rem;font-family:sans-serif;color:var(--brown);font-weight:500;">${n}</div><div style="font-size:.7rem;font-family:sans-serif;color:var(--tm);">${d}</div></div></div>`).join('')}`,

  registro: `<div class="crit-box" style="margin-bottom:1rem;"><div class="crit-lbl">Clasificación de Anomalías</div><div class="crit-row">🔴 URGENTE — Riesgo para personas, daño activo o falla crítica. Reportar de inmediato.</div><div class="crit-row">🟡 PRIORIDAD — Falla que afecta la operación sin riesgo inmediato. Resolver en 24h.</div><div class="crit-row">🟢 PROGRAMAR — Deterioro menor. Incluir en lista de proyectos semanales.</div></div>
  <div class="doc-note">Canal: Urgentes → llamada al Gerente + WhatsApp. Prioridad → WhatsApp con foto. Programar → bitácora semanal. Agua → formulario Google Forms diario.</div>`,
};

export function openManualSection(manual, sectionId, title) {
  const content = manual === 'limp' ? MANUAL_LMP_CONTENT[sectionId] : MANUAL_MT_CONTENT[sectionId];
  if (!content) return;
  document.getElementById('con-title').textContent = title;
  document.getElementById('conbody').innerHTML = `<div class="doc-viewer">${content}</div>`;
  const backFn = manual === 'limp'
    ? () => openResource('manual-limp', 'Manual de Limpieza General', 'doc')
    : () => openResource('manual-prev', 'Manual de Mantenimiento', 'doc');
  document.getElementById('con-back').onclick = backFn;
  show('con-screen');
}
