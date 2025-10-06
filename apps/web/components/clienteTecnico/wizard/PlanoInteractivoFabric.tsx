'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, 
  Bath, 
  ChefHat, 
  Sofa, 
  Car, 
  TreePine, 
  Plus, 
  Trash2, 
  Ruler,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface DimensionesPlanta {
  ancho: number;
  largo: number;
  superficie: number;
}

interface Ambiente {
  id: string;
  nombre: string;
  icon: any;
  color: string;
}

interface PlanoBloque {
  id: string;
  tipo: string;
  nombre: string;
  ancho: number;
  largo: number;
  x: number;
  y: number;
  superficie: number;
  color: string;
}

interface PlanoData {
  nombre: string;
  numero: number;
  dimensiones: DimensionesPlanta;
  bloques: PlanoBloque[];
}

interface PlanoInteractivoFabricProps {
  data: PlanoData;
  onUpdate: (data: PlanoData) => void;
  onPrevious: () => void;
  onNext: () => void;
  isLastPlanta: boolean;
}

const tiposAmbientesPlano: Ambiente[] = [
  { id: "AMB001", nombre: "Dormitorio", icon: Home, color: "bg-blue-400" },
  { id: "AMB002", nombre: "Baño", icon: Bath, color: "bg-green-400" },
  { id: "AMB003", nombre: "Cocina", icon: ChefHat, color: "bg-orange-400" },
  { id: "AMB004", nombre: "Estar", icon: Sofa, color: "bg-purple-400" },
  { id: "AMB005", nombre: "Garage", icon: Car, color: "bg-gray-400" },
  { id: "AMB006", nombre: "Jardín", icon: TreePine, color: "bg-emerald-400" },
];

export function PlanoInteractivoFabric({
  data,
  onUpdate,
  onPrevious,
  onNext,
  isLastPlanta
}: PlanoInteractivoFabricProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [selectedAmbiente, setSelectedAmbiente] = useState<Ambiente | null>(null);
  const [showDimensionesModal, setShowDimensionesModal] = useState(false);
  const [showAmbientePersonalizadoModal, setShowAmbientePersonalizadoModal] = useState(false);
  const [dimensiones, setDimensiones] = useState({ ancho: 3, largo: 3 });
  const [zoom, setZoom] = useState(1);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<'ambiente' | 'terreno' | 'poligono' | 'circulo' | 'linea'>('ambiente');
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 20, y: 20 });
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapDistance] = useState(10); // píxeles
  const [activeMap, setActiveMap] = useState<string>('base');
  const [visibleMaps, setVisibleMaps] = useState<Record<string, boolean>>({
    base: true,
    estructura: true,
    muros: true,
    cubiertas: true,
    instalaciones: true,
    suelos: true,
    terminaciones: true,
    amenities: true,
    parquizado: true
  });

  // Definición de mapas por etapas constructivas
  const mapDefinitions = {
    base: {
      name: 'Mapa Base',
      color: '#1A202C',
      description: 'Plano de ambientes y distribución básica',
      icon: '🏠',
      etapa: 'base'
    },
    estructura: {
      name: 'Estructura y Fundación',
      color: '#6B7280',
      description: 'Cimientos, bases, columnas, vigas, losas',
      icon: '🏗️',
      etapa: 'estructura'
    },
    muros: {
      name: 'Muros y Cerramientos',
      color: '#1E40AF',
      description: 'Muros exteriores e interiores, tabiques',
      icon: '🧱',
      etapa: 'muros'
    },
    cubiertas: {
      name: 'Cubiertas',
      color: '#0EA5E9',
      description: 'Techos, cubiertas, estructuras superiores',
      icon: '🏠',
      etapa: 'cubiertas'
    },
    instalaciones: {
      name: 'Instalaciones',
      color: '#059669',
      description: 'Sanitarias, eléctricas, gas, pluviales, climatización',
      icon: '⚡',
      etapa: 'instalaciones'
    },
    suelos: {
      name: 'Suelos/Pisos',
      color: '#A16207',
      description: 'Contrapisos, pisos interiores y exteriores',
      icon: '🏠',
      etapa: 'suelos'
    },
    terminaciones: {
      name: 'Terminaciones',
      color: '#EA580C',
      description: 'Revoques, pinturas, acabados',
      icon: '🎨',
      etapa: 'terminaciones'
    },
    amenities: {
      name: 'Amenities',
      color: '#7C3AED',
      description: 'Parrillas, quinchos, piletas, solárium',
      icon: '🏊',
      etapa: 'amenities'
    },
    parquizado: {
      name: 'Parquizado',
      color: '#16A34A',
      description: 'Jardines, senderos, iluminación exterior',
      icon: '🌳',
      etapa: 'parquizado'
    }
  };

  // Cargar Fabric.js dinámicamente
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabric = await import('fabric');
        window.fabric = fabric;
        setFabricLoaded(true);
      } catch (error) {
        console.error('Error loading Fabric.js:', error);
      }
    };

    loadFabric();
  }, []);

  // Inicializar canvas cuando Fabric.js esté cargado
  useEffect(() => {
    if (!fabricLoaded || !canvasRef.current || !window.fabric) return;

    const fabric = window.fabric;
    
        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff', // Fondo blanco puro
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        // Configurar fondo
        canvas.backgroundColor = '#ffffff';

        // Event listeners
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setSelectedObject(null));
        canvas.on('object:modified', handleObjectModified);
        canvas.on('object:moving', handleObjectMoving);
        canvas.on('object:moved', handleObjectMoved);
        canvas.on('object:scaling', handleObjectScaling);
        canvas.on('mouse:wheel', handleMouseWheel);
        
        // Event listeners para pan mode
        canvas.on('mouse:down', handlePanMouseDown);
        canvas.on('mouse:move', handlePanMouseMove);
        canvas.on('mouse:up', handlePanMouseUp);

    // Cargar bloques existentes
    loadExistingBlocks();

    return () => {
      canvas.dispose();
    };
  }, [fabricLoaded]);

  // Manejar teclas para eliminación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject && fabricCanvasRef.current) {
        e.preventDefault();
        eliminarSeleccionado();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  // Crear patrón de grid
  const createGridPattern = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    ctx.strokeStyle = '#f3f4f6'; // Gris más claro
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(0, size);
    ctx.lineTo(size, size);
    ctx.stroke();
    
    return canvas;
  };

  // Cargar bloques existentes
  const loadExistingBlocks = () => {
    if (!fabricCanvasRef.current || !window.fabric) return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    canvas.clear();

    // Restaurar fondo
    canvas.backgroundColor = '#ffffff';

    data.bloques.forEach((bloque) => {
      // Rectángulo principal (interactivo) con doble borde
      const rect = new fabric.Rect({
        left: bloque.x * 50,
        top: bloque.y * 50,
        width: bloque.ancho * 50,
        height: bloque.largo * 50,
        fill: '#ffffff', // Fondo blanco
        stroke: '#003366', // Borde azul oscuro
        strokeWidth: 3, // Borde principal
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        cornerStyle: 'circle',
        cornerColor: '#003366',
        cornerSize: 8,
        transparentCorners: false,
      });

      // Crear borde interior para efecto doble línea
      const innerBorder = new fabric.Rect({
        left: bloque.x * 50 + 2,
        top: bloque.y * 50 + 2,
        width: (bloque.ancho * 50) - 4,
        height: (bloque.largo * 50) - 4,
        fill: 'transparent',
        stroke: '#003366',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });

      // Agregar texto del ambiente
      const text = new fabric.Text(bloque.nombre, {
        left: rect.left! + rect.width! / 2,
        top: rect.top! + rect.height! / 2,
        originX: 'center',
        originY: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#000000', // Texto negro
        textAlign: 'center',
        selectable: false,
        evented: false,
      });

      // Agregar ID como metadata
      rect.set('data', { id: bloque.id, nombre: bloque.nombre, tipo: bloque.tipo });
      innerBorder.set('data', { id: bloque.id, nombre: bloque.nombre, tipo: bloque.tipo });
      text.set('data', { id: bloque.id, nombre: bloque.nombre, tipo: bloque.tipo });

      canvas.add(rect, innerBorder, text);
    });

    canvas.renderAll();
  };

  // Manejar selección de objetos
  const handleSelection = (e: any) => {
    const activeObjects = e.selected;
    if (activeObjects && activeObjects.length > 0) {
      const obj = activeObjects[0];
      if (obj.data) {
        setSelectedObject(obj);
      }
    }
  };

  // Manejar modificación de objetos
  const handleObjectModified = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects().filter((obj: any) => obj.data && obj.type === 'rect');
    
    const bloques: PlanoBloque[] = objects.map((obj: any) => {
      const rect = obj;
      const data = rect.data;
      const width = rect.width! / 50; // Convertir de px a metros
      const height = rect.height! / 50;
      
      return {
        id: data.id,
        tipo: data.tipo,
        nombre: data.nombre,
        ancho: width,
        largo: height,
        x: rect.left! / 50,
        y: rect.top! / 50,
        superficie: width * height,
        color: data.color || 'bg-blue-400',
      };
    });

    // Actualizar bloques de texto
    updateTextObjects();
    
    // Actualizar datos
    const updatedData = { ...data, bloques };
    onUpdate(updatedData);
  };

  // Actualizar objetos de texto y bordes
  const updateTextObjects = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    
    objects.forEach((obj: any) => {
      if (obj.data && obj.type === 'text') {
        const rect = objects.find((o: any) => o.data && o.data.id === obj.data.id && o.type === 'rect' && o.strokeWidth === 3);
        if (rect) {
          obj.set({
            left: rect.left! + rect.width! / 2,
            top: rect.top! + rect.height! / 2,
          });
        }
      }
      
      // Actualizar borde interior cuando se mueve o redimensiona el rectángulo principal
      if (obj.data && obj.type === 'rect' && obj.strokeWidth === 1) {
        const mainRect = objects.find((o: any) => o.data && o.data.id === obj.data.id && o.type === 'rect' && o.strokeWidth === 3);
        if (mainRect) {
          obj.set({
            left: mainRect.left! + 2,
            top: mainRect.top! + 2,
            width: mainRect.width! - 4,
            height: mainRect.height! - 4,
          });
        }
      }
    });
  };

  // Manejar movimiento de objetos
  const handleObjectMoving = (e: any) => {
    const obj = e.target;
    if (!obj.data) return;

    // Mantener dentro del canvas
    const canvas = fabricCanvasRef.current!;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    if (obj.left! < 0) obj.set('left', 0);
    if (obj.top! < 0) obj.set('top', 0);
    if (obj.left! + obj.width! > canvasWidth) obj.set('left', canvasWidth - obj.width!);
    if (obj.top! + obj.height! > canvasHeight) obj.set('top', canvasHeight - obj.height!);
  };

  // Manejar finalización del movimiento para aplicar snap
  const handleObjectMoved = (e: any) => {
    applySnap(e.target);
    updateTextObjects();
    handleObjectModified();
  };

  // Manejar escalado de objetos
  const handleObjectScaling = (e: any) => {
    const obj = e.target;
    if (!obj.data) return;

    // Mantener proporciones mínimas
    const minSize = 50; // 1m en píxeles
    if (obj.width! < minSize) obj.set('width', minSize);
    if (obj.height! < minSize) obj.set('height', minSize);
  };

  // Crear nuevo bloque (solo para mapa base)
  const crearBloque = (nombre: string, ancho: number, largo: number, color: string = 'bg-blue-400') => {
    if (!fabricCanvasRef.current || !window.fabric || activeMap !== 'base') return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    const id = `bloque_${Date.now()}`;
    
    // Rectángulo principal (interactivo) con doble borde
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: ancho * 50,
      height: largo * 50,
      fill: '#ffffff', // Fondo blanco
      stroke: '#003366', // Borde azul oscuro
      strokeWidth: 3, // Borde principal
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      cornerStyle: 'circle',
      cornerColor: '#003366',
      cornerSize: 8,
      transparentCorners: false,
    });

    // Crear borde interior para efecto doble línea
    const innerBorder = new fabric.Rect({
      left: 102,
      top: 102,
      width: (ancho * 50) - 4,
      height: (largo * 50) - 4,
      fill: 'transparent',
      stroke: '#003366',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    const text = new fabric.Text(nombre, {
      left: rect.left! + rect.width! / 2,
      top: rect.top! + rect.height! / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#000000', // Texto negro
      textAlign: 'center',
      selectable: false,
      evented: false,
    });

    rect.set('data', { id, nombre, tipo: 'ambiente' });
    innerBorder.set('data', { id, nombre, tipo: 'ambiente' });
    text.set('data', { id, nombre, tipo: 'ambiente' });

    canvas.add(rect, innerBorder, text);
    canvas.setActiveObject(rect);
    canvas.renderAll();

    // Actualizar datos
    handleObjectModified();
  };

  // Crear elemento de mapa específico
  const crearElementoMapa = (tipo: string, nombre: string, ancho: number, largo: number) => {
    if (!fabricCanvasRef.current || !window.fabric || activeMap === 'base') return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    const mapConfig = mapDefinitions[activeMap as keyof typeof mapDefinitions];
    const escala = 50;
    const width = ancho * escala;
    const height = largo * escala;
    const id = `elemento_${activeMap}_${Date.now()}`;

    // Crear elemento según el tipo
    let elemento;
    
    if (tipo === 'rectangulo') {
      elemento = new fabric.Rect({
        left: 150,
        top: 150,
        width: width,
        height: height,
        fill: 'transparent',
        stroke: mapConfig.color,
        strokeWidth: 2,
        strokeDashArray: activeMap === 'instalaciones' ? [5, 5] : undefined,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: mapConfig.color,
        cornerSize: 6,
        transparentCorners: false,
      });
    } else if (tipo === 'linea') {
      elemento = new fabric.Line([150, 150, 150 + width, 150 + height], {
        stroke: mapConfig.color,
        strokeWidth: 2,
        strokeDashArray: activeMap === 'instalaciones' ? [5, 5] : undefined,
        selectable: true,
        evented: true,
      });
    } else if (tipo === 'circulo') {
      elemento = new fabric.Circle({
        left: 150,
        top: 150,
        radius: ancho * escala / 2,
        fill: 'transparent',
        stroke: mapConfig.color,
        strokeWidth: 2,
        strokeDashArray: activeMap === 'instalaciones' ? [5, 5] : undefined,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: mapConfig.color,
        cornerSize: 6,
        transparentCorners: false,
      });
    }

    if (elemento) {
      elemento.set('data', { 
        id, 
        nombre, 
        tipo: 'elemento_mapa',
        mapa: activeMap,
        etapa: mapConfig.etapa,
        categoria: mapConfig.name 
      });
      
      canvas.add(elemento);
      canvas.setActiveObject(elemento);
      canvas.renderAll();
    }
  };

  // Crear terreno
  const crearTerreno = (ancho: number, largo: number) => {
    if (!fabricCanvasRef.current || !window.fabric) return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    const id = `terreno_${Date.now()}`;
    
    const terreno = new fabric.Rect({
      left: 50,
      top: 50,
      width: ancho * 50,
      height: largo * 50,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      strokeDashArray: [5, 5], // Línea punteada
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      cornerStyle: 'circle',
      cornerColor: '#000000',
      cornerSize: 8,
      transparentCorners: false,
    });

    terreno.set('data', { id, nombre: 'Terreno', tipo: 'terreno' });
    canvas.add(terreno);
    canvas.setActiveObject(terreno);
    canvas.renderAll();
  };

  // Crear círculo/elipse
  const crearCirculo = (radio: number) => {
    if (!fabricCanvasRef.current || !window.fabric) return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    const id = `circulo_${Date.now()}`;
    
    const circulo = new fabric.Circle({
      left: 100,
      top: 100,
      radius: radio * 25, // Escala: 25px = 1m de radio
      fill: 'transparent',
      stroke: '#003366',
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerStyle: 'circle',
      cornerColor: '#003366',
      cornerSize: 8,
      transparentCorners: false,
    });

    circulo.set('data', { id, nombre: 'Círculo', tipo: 'circulo' });
    canvas.add(circulo);
    canvas.setActiveObject(circulo);
    canvas.renderAll();
  };

  // Crear línea
  const crearLinea = () => {
    if (!fabricCanvasRef.current || !window.fabric) return;

    const canvas = fabricCanvasRef.current;
    const fabric = window.fabric;
    const id = `linea_${Date.now()}`;
    
    const linea = new fabric.Line([100, 100, 200, 100], {
      stroke: '#666666',
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerStyle: 'circle',
      cornerColor: '#666666',
      cornerSize: 8,
      transparentCorners: false,
    });

    linea.set('data', { id, nombre: 'Línea', tipo: 'linea' });
    canvas.add(linea);
    canvas.setActiveObject(linea);
    canvas.renderAll();
  };

  // Iniciar dibujo de polígono libre
  const iniciarPoligonoLibre = () => {
    setActiveTool('poligono');
    setIsDrawingPolygon(true);
    setPolygonPoints([]);
    
    // Cambiar cursor del canvas
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.defaultCursor = 'crosshair';
      fabricCanvasRef.current.hoverCursor = 'crosshair';
    }
  };

  // Manejar arrastre de la toolbar
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = (e.target as HTMLElement).closest('.toolbar-flotante')?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleToolbarMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      // Limitar dentro del canvas
      const maxX = canvasRect.width - (toolbarCollapsed ? 60 : 200);
      const maxY = canvasRect.height - 60;
      
      setToolbarPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleToolbarMouseUp = () => {
    setIsDragging(false);
  };

  // Manejar zoom con rueda del mouse
  const handleMouseWheel = (opt: any) => {
    if (!fabricCanvasRef.current) return;
    
    const delta = opt.e.deltaY;
    let zoom = fabricCanvasRef.current.getZoom();
    zoom *= 0.999 ** delta;
    
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    
    fabricCanvasRef.current.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    setZoom(zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
  };

  // Manejar pan mode
  const handlePanMouseDown = (opt: any) => {
    if (panMode && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.isDragging = true;
      canvas.selection = false;
      canvas.lastPosX = opt.e.clientX;
      canvas.lastPosY = opt.e.clientY;
    }
  };

  const handlePanMouseMove = (opt: any) => {
    if (panMode && fabricCanvasRef.current && fabricCanvasRef.current.isDragging) {
      const canvas = fabricCanvasRef.current;
      const e = opt.e;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] += e.clientX - canvas.lastPosX;
        vpt[5] += e.clientY - canvas.lastPosY;
        canvas.requestRenderAll();
        canvas.lastPosX = e.clientX;
        canvas.lastPosY = e.clientY;
      }
    }
  };

  const handlePanMouseUp = () => {
    if (panMode && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.isDragging = false;
      canvas.selection = true;
    }
  };

  // Función de snap magnético
  const applySnap = (obj: any) => {
    if (!snapEnabled || !fabricCanvasRef.current || !obj.data) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects().filter((o: any) => o !== obj && o.data);
    
    let snapped = false;
    const left = obj.left || 0;
    const top = obj.top || 0;
    const width = obj.width || 0;
    const height = obj.height || 0;
    
    // Snap a otros objetos
    objects.forEach((otherObj: any) => {
      const otherLeft = otherObj.left || 0;
      const otherTop = otherObj.top || 0;
      const otherWidth = otherObj.width || 0;
      const otherHeight = otherObj.height || 0;
      
      // Snap bordes izquierdos
      if (Math.abs(left - otherLeft) < snapDistance) {
        obj.set('left', otherLeft);
        snapped = true;
      }
      // Snap bordes superiores
      if (Math.abs(top - otherTop) < snapDistance) {
        obj.set('top', otherTop);
        snapped = true;
      }
      // Snap bordes derechos
      if (Math.abs((left + width) - (otherLeft + otherWidth)) < snapDistance) {
        obj.set('left', otherLeft + otherWidth - width);
        snapped = true;
      }
      // Snap bordes inferiores
      if (Math.abs((top + height) - (otherTop + otherHeight)) < snapDistance) {
        obj.set('top', otherTop + otherHeight - height);
        snapped = true;
      }
    });

    // Snap a grilla
    const gridSize = 20;
    const gridX = Math.round(left / gridSize) * gridSize;
    const gridY = Math.round(top / gridSize) * gridSize;
    
    if (Math.abs(left - gridX) < snapDistance) {
      obj.set('left', gridX);
      snapped = true;
    }
    if (Math.abs(top - gridY) < snapDistance) {
      obj.set('top', gridY);
      snapped = true;
    }

    if (snapped) {
      canvas.renderAll();
    }
  };

  // Manejar clic en ambiente
  const handleAmbienteClick = (ambiente: Ambiente) => {
    setSelectedAmbiente(ambiente);
    setShowDimensionesModal(true);
  };

  // Toggle visibilidad de mapa
  const toggleMapVisibility = (mapId: string) => {
    const newVisibility = { ...visibleMaps };
    newVisibility[mapId] = !newVisibility[mapId];
    setVisibleMaps(newVisibility);
    
    // Actualizar visibilidad de objetos en el canvas
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      
      objects.forEach((obj: any) => {
        if (obj.data && obj.data.mapa === mapId) {
          obj.set('visible', newVisibility[mapId]);
        }
      });
      
      canvas.renderAll();
    }
  };

  // Cambiar mapa activo
  const cambiarMapaActivo = (mapId: string) => {
    setActiveMap(mapId);
    
    // Limpiar selección actual
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  };

  // Confirmar dimensiones
  const confirmarDimensiones = () => {
    if (selectedAmbiente) {
      crearBloque(selectedAmbiente.nombre, dimensiones.ancho, dimensiones.largo, selectedAmbiente.color);
      setShowDimensionesModal(false);
      setSelectedAmbiente(null);
    }
  };

  // Eliminar objeto seleccionado
  const eliminarSeleccionado = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    const canvas = fabricCanvasRef.current;
    const objectsToRemove = canvas.getObjects().filter((obj: any) => 
      obj.data && obj.data.id === selectedObject.data.id
    );
    
    objectsToRemove.forEach((obj: any) => canvas.remove(obj));
    canvas.renderAll();
    setSelectedObject(null);
    handleObjectModified();
  };

  // Zoom
  const handleZoomIn = () => {
    if (!fabricCanvasRef.current) return;
    setZoom(prev => {
      const newZoom = Math.min(prev * 1.2, 3);
      fabricCanvasRef.current!.setZoom(newZoom);
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    if (!fabricCanvasRef.current) return;
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.2, 0.3);
      fabricCanvasRef.current!.setZoom(newZoom);
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(1);
    setZoom(1);
  };

  // Calcular estadísticas
  const superficieUsada = data.bloques.reduce((total, bloque) => total + bloque.superficie, 0);
  const superficieDisponible = data.dimensiones.superficie - superficieUsada;

  if (!fabricLoaded) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando editor de planos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A202C' }}>
                {data.nombre} - Planta {data.numero}
              </h2>
              <p className="text-gray-600">Diseña el plano arrastrando y redimensionando ambientes</p>
            </div>
            <div className="text-right">
              <div className="text-gray-600 text-sm mb-1">Superficie Total</div>
              <div className="text-2xl font-bold px-4 py-2 rounded-xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                {data.dimensiones.superficie.toFixed(1)} m²
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6">
          {/* Área del plano */}
          <div className="bg-white border-2 border-gray-300 rounded-xl p-4 shadow-inner mb-6">
            <div 
              className="relative"
              onMouseMove={handleToolbarMouseMove}
              onMouseUp={handleToolbarMouseUp}
            >
              <canvas 
                ref={canvasRef}
                className="border border-gray-200 rounded-lg cursor-crosshair"
              />
              
              {/* Toolbar flotante */}
              <div 
                className={`toolbar-flotante absolute bg-gray-100 bg-opacity-95 rounded-lg shadow-lg border border-gray-300 transition-all duration-300 ${
                  isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  left: `${toolbarPosition.x}px`,
                  top: `${toolbarPosition.y}px`,
                  width: toolbarCollapsed ? '60px' : '280px'
                }}
                onMouseDown={handleToolbarMouseDown}
              >
                {/* Header de la toolbar */}
                <div className="flex items-center justify-between p-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-gray-600" />
                    {!toolbarCollapsed && (
                      <span className="text-xs font-medium text-gray-700">Mapas por Etapas</span>
                    )}
                  </div>
                  <button
                    onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={toolbarCollapsed ? "Expandir" : "Plegar"}
                  >
                    <div className={`w-3 h-3 transition-transform duration-200 ${toolbarCollapsed ? 'rotate-180' : ''}`}>
                      <svg viewBox="0 0 12 12" fill="currentColor" className="text-gray-600">
                        <path d="M6 9L2 5h8z"/>
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Contenido de la toolbar */}
                {!toolbarCollapsed && (
                  <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                    {/* Sistema de Mapas por Etapas */}
                    <div className="text-xs font-medium text-gray-500 mb-2 px-1">Mapas por Etapas</div>
                    
                    {Object.entries(mapDefinitions).map(([mapId, mapConfig]) => (
                      <div key={mapId} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={visibleMaps[mapId]}
                          onChange={() => toggleMapVisibility(mapId)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <button
                          onClick={() => cambiarMapaActivo(mapId)}
                          className={`flex-1 flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                            activeMap === mapId ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                          title={mapConfig.description}
                        >
                          <span className="text-sm">{mapConfig.icon}</span>
                          <span className="flex-1 text-left">{mapConfig.name}</span>
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: mapConfig.color, borderColor: mapConfig.color }}
                          ></div>
                        </button>
                      </div>
                    ))}

                    {/* Separador */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Herramientas según mapa activo */}
                    <div className="text-xs font-medium text-gray-500 mb-2 px-1">
                      {activeMap === 'base' ? 'Ambientes' : `Elementos - ${mapDefinitions[activeMap as keyof typeof mapDefinitions].name}`}
                    </div>

                    {activeMap === 'base' && (
                      <>
                        {tiposAmbientesPlano.map((tipo) => {
                          const Icon = tipo.icon;
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => {
                                setActiveTool('ambiente');
                                setIsDrawingPolygon(false);
                                handleAmbienteClick(tipo);
                              }}
                              className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                                activeTool === 'ambiente' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${tipo.color}`}></div>
                              <Icon className="h-3 w-3" />
                              <span>+{tipo.nombre}</span>
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setShowAmbientePersonalizadoModal(true)}
                          className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-50 text-green-600"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Personalizado</span>
                        </button>
                      </>
                    )}

                    {activeMap !== 'base' && (
                      <>
                        <button
                          onClick={() => {
                            const ancho = prompt('Ancho (metros):', '2');
                            const largo = prompt('Largo (metros):', '2');
                            if (ancho && largo) {
                              crearElementoMapa('rectangulo', 'Elemento', parseFloat(ancho), parseFloat(largo));
                            }
                          }}
                          className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-50 text-gray-700"
                        >
                          <div className="w-3 h-3 border-2" style={{ borderColor: mapDefinitions[activeMap as keyof typeof mapDefinitions].color }}></div>
                          <span>+Rectángulo</span>
                        </button>
                        <button
                          onClick={() => {
                            const radio = prompt('Radio (metros):', '1');
                            if (radio) {
                              crearElementoMapa('circulo', 'Elemento', parseFloat(radio), parseFloat(radio));
                            }
                          }}
                          className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-50 text-gray-700"
                        >
                          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: mapDefinitions[activeMap as keyof typeof mapDefinitions].color }}></div>
                          <span>+Círculo</span>
                        </button>
                        <button
                          onClick={() => {
                            const largo = prompt('Largo de línea (metros):', '3');
                            if (largo) {
                              crearElementoMapa('linea', 'Línea', 0, parseFloat(largo));
                            }
                          }}
                          className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-50 text-gray-700"
                        >
                          <div className="w-3 h-0.5" style={{ backgroundColor: mapDefinitions[activeMap as keyof typeof mapDefinitions].color }}></div>
                          <span>+Línea</span>
                        </button>
                      </>
                    )}

                    {/* Separador */}
                    <div className="border-t border-gray-200 my-2"></div>

                    {/* Herramientas de navegación */}
                    <div className="text-xs font-medium text-gray-500 mb-2 px-1">Navegación</div>
                    
                    <button
                      onClick={() => {
                        const newPanMode = !panMode;
                        setPanMode(newPanMode);
                        setActiveTool('ambiente');
                        setIsDrawingPolygon(false);
                        if (fabricCanvasRef.current) {
                          fabricCanvasRef.current.defaultCursor = newPanMode ? 'grab' : 'default';
                          fabricCanvasRef.current.hoverCursor = newPanMode ? 'grab' : 'default';
                          fabricCanvasRef.current.selection = !newPanMode;
                        }
                      }}
                      className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        panMode ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      title="Desplazar canvas (Pan mode)"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Pan</span>
                    </button>

                    <button
                      onClick={() => {
                        const ancho = prompt('Ancho del terreno (metros):', '20');
                        const largo = prompt('Largo del terreno (metros):', '15');
                        if (ancho && largo) {
                          crearTerreno(parseFloat(ancho), parseFloat(largo));
                        }
                      }}
                      className="w-full flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-50 text-gray-700"
                      title="Crear terreno (línea punteada)"
                    >
                      <div className="w-2 h-2 border border-gray-600 border-dashed"></div>
                      <span>Terreno</span>
                    </button>

                    {/* Snap toggle */}
                    <div className="flex items-center space-x-2 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={snapEnabled}
                        onChange={(e) => setSnapEnabled(e.target.checked)}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">Snap magnético</span>
                    </div>
                  </div>
                )}

                {/* Versión colapsada */}
                {toolbarCollapsed && (
                  <div className="p-2 space-y-1">
                    {/* Botón para mapa activo */}
                    <button
                      onClick={() => setToolbarCollapsed(false)}
                      className={`w-full p-2 rounded transition-colors ${
                        activeMap === 'base' ? 'bg-blue-200' : 'bg-gray-200'
                      }`}
                      title={`Mapa activo: ${mapDefinitions[activeMap as keyof typeof mapDefinitions].name}`}
                    >
                      <span className="text-lg">{mapDefinitions[activeMap as keyof typeof mapDefinitions].icon}</span>
                    </button>
                    
                    {/* Pan mode */}
                    <button
                      onClick={() => {
                        const newPanMode = !panMode;
                        setPanMode(newPanMode);
                        if (fabricCanvasRef.current) {
                          fabricCanvasRef.current.defaultCursor = newPanMode ? 'grab' : 'default';
                          fabricCanvasRef.current.hoverCursor = newPanMode ? 'grab' : 'default';
                          fabricCanvasRef.current.selection = !newPanMode;
                        }
                      }}
                      className={`w-full p-2 rounded transition-colors ${
                        panMode ? 'bg-blue-200' : 'hover:bg-gray-200'
                      }`}
                      title="Pan mode"
                    >
                      <svg className="h-4 w-4 text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Snap toggle */}
                    <button
                      onClick={() => setSnapEnabled(!snapEnabled)}
                      className={`w-full p-2 rounded transition-colors ${
                        snapEnabled ? 'bg-green-200' : 'hover:bg-gray-200'
                      }`}
                      title="Snap magnético"
                    >
                      <div className="w-4 h-4 border-2 border-gray-600 mx-auto rounded"></div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Controles de zoom integrados en el canvas */}
              <div className="absolute top-4 right-4 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Alejar"
                  >
                    <ZoomOut className="h-4 w-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium min-w-[3rem] text-center text-gray-700">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Acercar"
                  >
                    <ZoomIn className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-1 hover:bg-gray-100 rounded transition-colors ml-1"
                    title="Resetear zoom"
                  >
                    <RotateCcw className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Escala */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-600">
                  Escala: 1m = 50px
                </div>
              </div>

              {/* Instrucciones para polígono libre */}
              {isDrawingPolygon && (
                <div className="absolute bottom-4 right-4 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg shadow-sm">
                  <div className="text-xs text-blue-700">
                    Clic para agregar puntos • Doble clic para finalizar
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Panel de propiedades del objeto seleccionado */}
          {selectedObject && (
            <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold mb-4 flex items-center space-x-2" style={{ color: '#1A202C' }}>
                <Ruler className="h-5 w-5" style={{ color: '#FEEB70' }} />
                <span>Propiedades de {selectedObject.data?.nombre}</span>
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block text-gray-600">Ancho (m)</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                    {(selectedObject.width! / 50).toFixed(1)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-gray-600">Largo (m)</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                    {(selectedObject.height! / 50).toFixed(1)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-gray-600">Superficie (m²)</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                    {((selectedObject.width! * selectedObject.height!) / 2500).toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={eliminarSeleccionado}
                  className="px-4 py-2 text-white rounded-lg text-sm flex items-center space-x-2 transition-colors duration-200 shadow-sm"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar Ambiente</span>
                </button>
              </div>
            </div>
          )}

          {/* Resumen del plano */}
          <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Superficie Usada</div>
                <div className="text-3xl font-bold" style={{ color: '#1A202C' }}>
                  {superficieUsada.toFixed(1)} m²
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              style={{ 
                color: '#1A202C',
                backgroundColor: '#FEEB70'
              }}
            >
              <span>Anterior</span>
            </button>

            <button
              onClick={onNext}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              style={{ backgroundColor: '#22C55E' }}
            >
              <span>{isLastPlanta ? 'Finalizar Plantas' : 'Siguiente Planta'}</span>
            </button>
          </div>
        </div>

        {/* Modal de dimensiones */}
        {showDimensionesModal && selectedAmbiente && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#1A202C' }}>
                  Dimensiones de {selectedAmbiente.nombre}
                </h3>
                <button 
                  onClick={() => setShowDimensionesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (metros)
                  </label>
                  <input
                    type="number"
                    value={dimensiones.ancho}
                    onChange={(e) => setDimensiones(prev => ({ ...prev, ancho: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largo (metros)
                  </label>
                  <input
                    type="number"
                    value={dimensiones.largo}
                    onChange={(e) => setDimensiones(prev => ({ ...prev, largo: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Superficie:</div>
                  <div className="text-lg font-bold" style={{ color: '#1A202C' }}>
                    {(dimensiones.ancho * dimensiones.largo).toFixed(1)} m²
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDimensionesModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDimensiones}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Ambiente</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de ambiente personalizado */}
        {showAmbientePersonalizadoModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#1A202C' }}>
                  Ambiente Personalizado
                </h3>
                <button 
                  onClick={() => setShowAmbientePersonalizadoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del ambiente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Oficina, Lavadero, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (metros)
                  </label>
                  <input
                    type="number"
                    value={dimensiones.ancho}
                    onChange={(e) => setDimensiones(prev => ({ ...prev, ancho: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largo (metros)
                  </label>
                  <input
                    type="number"
                    value={dimensiones.largo}
                    onChange={(e) => setDimensiones(prev => ({ ...prev, largo: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAmbientePersonalizadoModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const nombreInput = document.querySelector('input[placeholder*="Oficina"]') as HTMLInputElement;
                    const nombre = nombreInput?.value || 'Ambiente Personalizado';
                    crearBloque(nombre, dimensiones.ancho, dimensiones.largo, 'bg-indigo-400');
                    setShowAmbientePersonalizadoModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Ambiente</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Declarar fabric en window para TypeScript
declare global {
  interface Window {
    fabric: any;
  }
}