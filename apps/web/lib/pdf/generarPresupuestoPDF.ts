import jsPDF from 'jspdf';

interface Obra {
  id: string;
  name: string;
  direccion_completa?: string | null;
  cantidad_plantas?: number | null;
  fecha_inicio?: string | null;
  cliente?: string | null;
}

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

interface EditingMap {
  get: (tareaId: string) => { dias_reales: number | null; monto: number | null } | undefined;
}

interface GenerarPresupuestoPDFParams {
  obra: Obra;
  presupuestos: PresupuestoItem[];
  etapa: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES';
  nombreContratista: string;
  fechaGeneracion: Date;
  editing?: EditingMap;
}

function generarPDFPorEtapa({
  obra,
  presupuestos,
  etapa,
  nombreContratista,
  fechaGeneracion,
  editing,
  asBytes = false,
}: GenerarPresupuestoPDFParams & { asBytes?: boolean }): Uint8Array | void {
  if (presupuestos.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Función para agregar nueva página si es necesario
  const checkNewPage = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Datos pequeños de la obra (arriba)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const infoCompacta = [
    obra.name || 'Sin nombre',
    obra.direccion_completa || '',
    obra.fecha_inicio ? `Inicio: ${new Date(obra.fecha_inicio).toLocaleDateString('es-AR')}` : '',
  ].filter(Boolean);

  infoCompacta.forEach((line, index) => {
    if (line) {
      doc.text(line, margin, yPos + index * 4);
    }
  });
  yPos += infoCompacta.length * 4 + 5;

  // Nombre del contratista en GRANDE
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const nombreLines = doc.splitTextToSize(nombreContratista.toUpperCase(), maxWidth);
  nombreLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 10;
  });
  yPos += 5;

  // Título de la etapa
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const etapaLabel = etapa === 'ESTRUCTURA' ? 'ESTRUCTURA' : etapa === 'OBRA_GRIS' ? 'OBRA GRIS' : 'TERMINACIONES';
  doc.text(etapaLabel, margin, yPos);
  yPos += 10;

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Tabla tipo Excel
  const colWidths = {
    tarea: maxWidth * 0.6,
    dias: maxWidth * 0.2,
    monto: maxWidth * 0.2,
  };

  const colPositions = {
    tarea: margin,
    dias: margin + colWidths.tarea,
    monto: margin + colWidths.tarea + colWidths.dias,
  };

  // Encabezado de tabla
  checkNewPage(25);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 6, maxWidth, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TAREA', colPositions.tarea + 2, yPos);
  doc.text('DÍAS', colPositions.dias + 2, yPos);
  doc.text('MONTO', colPositions.monto + 2, yPos);
  
  // Línea debajo del encabezado
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 8;

  // Calcular totales
  let totalDias = 0;
  let totalMonto = 0;

  // Filas de la tabla
  presupuestos.forEach((presupuesto) => {
    checkNewPage(12);

    // Obtener valores editados si existen
    const editData = editing?.get(presupuesto.tarea_id);
    const diasReales = editData?.dias_reales !== null && editData?.dias_reales !== undefined 
      ? editData.dias_reales 
      : presupuesto.dias_reales;
    const monto = editData?.monto !== null && editData?.monto !== undefined 
      ? editData.monto 
      : presupuesto.monto;

    // Acumular totales
    if (diasReales !== null && !isNaN(diasReales)) {
      totalDias += diasReales;
    }
    if (monto !== null && !isNaN(monto)) {
      totalMonto += monto;
    }

    // Fila con fondo alternado
    const rowIndex = presupuestos.indexOf(presupuesto);
    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 6, maxWidth, 8, 'F');
    }

    // Tarea con cantidad si existe
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const taskTitle = presupuesto.tarea?.title || 'Sin título';
    
    // Agregar cantidad y unidad si existen
    let taskText = taskTitle;
    if (presupuesto.elemento?.cantidad !== null && presupuesto.elemento?.cantidad !== undefined && presupuesto.elemento?.unidad) {
      const cantidadFormateada = presupuesto.elemento.cantidad.toLocaleString('es-AR', {
        minimumFractionDigits: presupuesto.elemento.cantidad % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      });
      taskText = `${taskTitle} (${cantidadFormateada} ${presupuesto.elemento.unidad})`;
    }
    
    const taskLines = doc.splitTextToSize(taskText, colWidths.tarea - 4);
    taskLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, colPositions.tarea + 2, yPos + (lineIndex * 4));
    });
    const maxTaskLines = taskLines.length;

    // Días
    const diasText = diasReales !== null ? diasReales.toString() : '-';
    doc.text(diasText, colPositions.dias + 2, yPos);

    // Monto
    const montoText = monto !== null 
      ? `$ ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '-';
    doc.text(montoText, colPositions.monto + 2, yPos);

    // Línea divisoria entre filas
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

    yPos += Math.max(8, maxTaskLines * 4) + 2;
  });

  // Fila de totales
  checkNewPage(15);
  yPos += 5;
  doc.setDrawColor(150, 150, 150);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 6, maxWidth, 10, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL', colPositions.tarea + 2, yPos + 2);
  
  doc.text(
    totalDias.toFixed(1),
    colPositions.dias + 2,
    yPos + 2
  );
  
  doc.text(
    `$ ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    colPositions.monto + 2,
    yPos + 2
  );

  // Pie de página
  yPos = pageHeight - margin - 8;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado el ${fechaGeneracion.toLocaleDateString('es-AR')} a las ${fechaGeneracion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
    margin,
    yPos
  );

  // Nombre del archivo
  const nombreObra = obra.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fecha = fechaGeneracion.toISOString().split('T')[0];
  const etapaSlug = etapa.toLowerCase().replace('_', '-');
  const nombreArchivo = `presupuesto_${etapaSlug}_${nombreObra}_${fecha}.pdf`;

  // Descargar o devolver bytes
  if (asBytes) {
    return doc.output('arraybuffer');
  }

  doc.save(nombreArchivo);
}

interface GenerarTodosLosPresupuestosParams {
  obra: Obra;
  presupuestosAgrupadosPorEtapa: {
    ESTRUCTURA: PresupuestoItem[];
    OBRA_GRIS: PresupuestoItem[];
    TERMINACIONES: PresupuestoItem[];
  };
  nombreContratista: string;
  fechaGeneracion: Date;
  editing?: EditingMap;
}

export function generarPresupuestoPDF({
  obra,
  presupuestosAgrupadosPorEtapa,
  nombreContratista,
  fechaGeneracion,
  editing,
}: GenerarTodosLosPresupuestosParams): void {
  // Generar un PDF por cada etapa que tenga presupuestos
  const etapas = [
    { nombre: 'ESTRUCTURA' as const, presupuestos: presupuestosAgrupadosPorEtapa.ESTRUCTURA },
    { nombre: 'OBRA_GRIS' as const, presupuestos: presupuestosAgrupadosPorEtapa.OBRA_GRIS },
    { nombre: 'TERMINACIONES' as const, presupuestos: presupuestosAgrupadosPorEtapa.TERMINACIONES },
  ];

  etapas.forEach((etapa) => {
    if (etapa.presupuestos.length > 0) {
      generarPDFPorEtapa({
        obra,
        presupuestos: etapa.presupuestos,
        etapa: etapa.nombre,
        nombreContratista,
        fechaGeneracion,
        editing,
      });
    }
  });
}

/**
 * Genera el PDF de presupuesto y devuelve los bytes (Uint8Array) sin descargarlo.
 * Mantiene el diseño actual.
 * @param etapaActiva - Si se proporciona, genera el PDF solo para esa etapa. Si no, usa la primera etapa con datos.
 */
export function generarPresupuestoPDFBytes({
  obra,
  presupuestosAgrupadosPorEtapa,
  nombreContratista,
  fechaGeneracion,
  editing,
  etapaActiva,
}: GenerarTodosLosPresupuestosParams & { etapaActiva?: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES' }): Uint8Array | null {
  const etapas = [
    { nombre: 'ESTRUCTURA' as const, presupuestos: presupuestosAgrupadosPorEtapa.ESTRUCTURA },
    { nombre: 'OBRA_GRIS' as const, presupuestos: presupuestosAgrupadosPorEtapa.OBRA_GRIS },
    { nombre: 'TERMINACIONES' as const, presupuestos: presupuestosAgrupadosPorEtapa.TERMINACIONES },
  ];

  // Si se especifica una etapa activa, generar PDF solo para esa etapa
  if (etapaActiva) {
    console.log('[generarPresupuestoPDFBytes] Etapa activa recibida:', etapaActiva);
    console.log('[generarPresupuestoPDFBytes] Presupuestos por etapa:', {
      ESTRUCTURA: presupuestosAgrupadosPorEtapa.ESTRUCTURA.length,
      OBRA_GRIS: presupuestosAgrupadosPorEtapa.OBRA_GRIS.length,
      TERMINACIONES: presupuestosAgrupadosPorEtapa.TERMINACIONES.length,
    });

    // Comparación directa y exacta
    let etapaEncontrada = null;
    
    if (etapaActiva === 'ESTRUCTURA') {
      etapaEncontrada = etapas.find(e => e.nombre === 'ESTRUCTURA');
    } else if (etapaActiva === 'OBRA_GRIS') {
      etapaEncontrada = etapas.find(e => e.nombre === 'OBRA_GRIS');
    } else if (etapaActiva === 'TERMINACIONES') {
      etapaEncontrada = etapas.find(e => e.nombre === 'TERMINACIONES');
    }

    console.log('[generarPresupuestoPDFBytes] Etapa encontrada:', etapaEncontrada?.nombre, 'con', etapaEncontrada?.presupuestos.length || 0, 'presupuestos');

    if (etapaEncontrada && etapaEncontrada.presupuestos.length > 0) {
      console.log('[generarPresupuestoPDFBytes] Generando PDF para etapa:', etapaEncontrada.nombre);
      const buffer = generarPDFPorEtapa({
        obra,
        presupuestos: etapaEncontrada.presupuestos,
        etapa: etapaEncontrada.nombre,
        nombreContratista,
        fechaGeneracion,
        editing,
        asBytes: true,
      }) as ArrayBuffer | undefined;
      if (buffer) {
        console.log('[generarPresupuestoPDFBytes] PDF generado exitosamente para:', etapaEncontrada.nombre);
        return new Uint8Array(buffer);
      }
    }
    
    console.warn('[generarPresupuestoPDFBytes] No se pudo generar PDF para etapa:', etapaActiva);
    // Si la etapa activa no tiene presupuestos, retornar null
    return null;
  }

  // Si no se especifica etapa activa, buscar la primera etapa con presupuestos (comportamiento original)
  for (const etapa of etapas) {
    if (etapa.presupuestos.length > 0) {
      const buffer = generarPDFPorEtapa({
        obra,
        presupuestos: etapa.presupuestos,
        etapa: etapa.nombre,
        nombreContratista,
        fechaGeneracion,
        editing,
        asBytes: true,
      }) as ArrayBuffer | undefined;
      if (buffer) return new Uint8Array(buffer);
    }
  }

  return null;
}
