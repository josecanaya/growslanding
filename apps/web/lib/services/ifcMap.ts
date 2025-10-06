export type IFCEntity = string;

export const IFC_PENDING_ID = "PENDIENTE_ASIGNAR" as const;

export const mapIFCtoCatalog: Record<IFCEntity, string[]> = {
  // Fundaciones
  "IfcFooting": ["HOR_ZAP001", "BAS_HA001", "EXC_MAN001", "EXC_MEC001"],
  "IfcSlabFoundation": ["HOR_PLA001", "HOR_ZAP001"],
  "IfcPadFooting": ["HOR_ZAP001", "BAS_HA001"],
  "IfcStripFooting": ["HOR_ZAP001", "HOR_PLA001"],
  "IfcPile": [IFC_PENDING_ID],
  "IfcDeepFoundation": ["HOR_PLA001", IFC_PENDING_ID],

  // Estructuras primarias
  "IfcColumn": ["COL_HA001", "COL_MET001"],
  "IfcBeam": ["VIG_HA001", "VIG_MET001"],
  "IfcMember": ["VIG_HA001", "VIG_MET001"],
  "IfcSlab": ["LOS_MAC001", "LOS_ALI001", "LOS_PRE001", "PIS_BAS_CON001", "PIS_INT_HOR001"],
  "IfcFloor": ["PIS_BAS_CON001", "PIS_INT_CER001", "PIS_INT_POR001", "PIS_INT_MAD001", "PIS_INT_MIC001"],
  "IfcPlate": ["LOS_MAC001", "LOS_ALI001"],
  "IfcReinforcingBar": [IFC_PENDING_ID],
  "IfcReinforcingMesh": [IFC_PENDING_ID],
  "IfcTendon": [IFC_PENDING_ID],

  // Muros y cerramientos
  "IfcWall": [
    "MUR_LAD15_001",
    "MUR_LAD30_001",
    "MUR_LAD_DOB001",
    "MUR_LAD_CER18_001",
    "MUR_LAD_CER20_001",
    "MUR_BLO15_001",
    "MUR_BLO20_001",
    "MUR_BLO30_001",
    "MUR_RET15_001",
    "MUR_RET20_001",
    "MUR_PAN_SAN001",
    "MUR_COR_VID001"
  ],
  "IfcWallStandardCase": [
    "MUR_LAD15_001",
    "MUR_LAD30_001",
    "MUR_BLO20_001",
    "MUR_RET15_001"
  ],
  "IfcCurtainWall": ["MUR_COR_VID001", "MUR_PAN_SAN001"],
  "IfcCovering": [IFC_PENDING_ID],

  // Cubiertas
  "IfcRoof": [
    "CUB_PLA_IMP001",
    "CUB_PLA_INV001",
    "CUB_2A_TEJ_CER001",
    "CUB_2A_TEJ_HOR001",
    "CUB_2A_CHA001",
    "CUB_4A_TEJ001",
    "CUB_4A_CHA001",
    "CUB_IND_DIE001",
    "CUB_LIV_POL001",
    "CUB_LIV_VID001"
  ],
  "IfcRoofType": [
    "CUB_PLA_IMP001",
    "CUB_2A_TEJ_CER001",
    "CUB_4A_CHA001"
  ],

  // Aberturas
  "IfcDoor": [IFC_PENDING_ID],
  "IfcWindow": [IFC_PENDING_ID],
  "IfcOpeningElement": [IFC_PENDING_ID],

  // Escaleras y circulaciones
  "IfcStair": [IFC_PENDING_ID],
  "IfcStairFlight": [IFC_PENDING_ID],
  "IfcRamp": [IFC_PENDING_ID],
  "IfcRampFlight": [IFC_PENDING_ID],
  "IfcRailing": [IFC_PENDING_ID],

  // Fachadas y paneles
  "IfcCurtainWallType": ["MUR_COR_VID001", "MUR_PAN_SAN001"],
  "IfcFacadeElement": [IFC_PENDING_ID],

  // Instalaciones sanitarias y mecanicas
  "IfcFlowSegment": ["PLO_SAN_1B001", "PLO_SAN_2B001", "PLO_SAN_3B001", "PLO_PLU_CAN001"],
  "IfcPipeSegment": ["PLO_SAN_1B001", "PLO_SAN_2B001", "PLO_SAN_3B001", "PLO_PLU_CAN001"],
  "IfcPipeFitting": ["PLO_SAN_BOM_PRE001", "PLO_SAN_TAN_SUP001", "PLO_SAN_TAN_CIS001"],
  "IfcDistributionFlowElement": ["PLO_SAN_1B001", "PLO_ELE_HAB001", "PLO_CLI_PIS001"],
  "IfcFlowTerminal": ["PLO_SAN_1B001", "PLO_SAN_2B001", "PLO_CLI_RAD001", "PLO_CLI_PIS001"],
  "IfcSanitaryTerminal": ["PLO_SAN_1B001", "PLO_SAN_2B001", "PLO_SAN_3B001"],
  "IfcFlowController": ["PLO_ELE_TAB001", "PLO_ELE_BOC001", IFC_PENDING_ID],
  "IfcPump": ["PLO_SAN_BOM_PRE001"],
  "IfcTank": ["PLO_SAN_TAN_SUP001", "PLO_SAN_TAN_CIS001"],
  "IfcFan": [IFC_PENDING_ID],
  "IfcAirTerminal": ["PLO_CLI_RAD001", "PLO_CLI_PIS001"],
  "IfcDuctSegment": ["PLO_CLI_RAD001", IFC_PENDING_ID],
  "IfcDuctFitting": ["PLO_CLI_RAD001", IFC_PENDING_ID],

  // Instalaciones electricas y especiales
  "IfcCableSegment": ["PLO_ELE_HAB001", "PLO_ELE_BOC001", "PLO_ELE_TAB001"],
  "IfcCableFitting": ["PLO_ELE_BOC001", IFC_PENDING_ID],
  "IfcLightFixture": ["PLO_ELE_ILU_EXT001", "PAR_ILU_BAL001", "PAR_ILU_REF001"],
  "IfcLamp": ["PLO_ELE_ILU_EXT001", "PAR_ILU_BAL001"],
  "IfcSwitchingDevice": ["PLO_ELE_BOC001"],
  "IfcElectricDistributionBoard": ["PLO_ELE_TAB001"],
  "IfcElectricGenerator": [IFC_PENDING_ID],
  "IfcElectricFlowStorageDevice": [IFC_PENDING_ID],

  // Equipamiento y mobiliario
  "IfcFurnishingElement": ["AME_PAR_REF001", "AME_PAR_MET001", "AME_SOL_ATE001", "AME_SOL_DECK001", IFC_PENDING_ID],
  "IfcFurniture": ["AME_PAR_REF001", "AME_PAR_MET001", IFC_PENDING_ID],
  "IfcEquipmentElement": ["AME_PIL_HOR001", "AME_PIL_FIB001", IFC_PENDING_ID],

  // Territorios y paisaje
  "IfcSite": ["PAR_CES_NAT001", "PAR_CES_SIN001", IFC_PENDING_ID],
  "IfcBuilding": ["AME_PAR_MET001", "PIS_EXT_ANT001", "PIS_EXT_DECK_MAD001", IFC_PENDING_ID],
  "IfcSpace": [IFC_PENDING_ID],
  "IfcZone": [IFC_PENDING_ID],

  DEFAULT: [IFC_PENDING_ID]
};

export const mapIFCtoCategory: Record<IFCEntity, string> = {
  "IfcFooting": "Fundaciones y Estructuras",
  "IfcSlabFoundation": "Fundaciones y Estructuras",
  "IfcPadFooting": "Fundaciones y Estructuras",
  "IfcStripFooting": "Fundaciones y Estructuras",
  "IfcPile": "Fundaciones y Estructuras",
  "IfcDeepFoundation": "Fundaciones y Estructuras",
  "IfcColumn": "Fundaciones y Estructuras",
  "IfcBeam": "Fundaciones y Estructuras",
  "IfcMember": "Fundaciones y Estructuras",
  "IfcSlab": "Fundaciones y Estructuras",
  "IfcFloor": "Suelos y Pisos",
  "IfcPlate": "Fundaciones y Estructuras",
  "IfcWall": "Muros y Cerramientos",
  "IfcWallStandardCase": "Muros y Cerramientos",
  "IfcCurtainWall": "Muros y Cerramientos",
  "IfcCovering": "Terminaciones",
  "IfcRoof": "Cubiertas",
  "IfcRoofType": "Cubiertas",
  "IfcDoor": "Aberturas",
  "IfcWindow": "Aberturas",
  "IfcOpeningElement": "Aberturas",
  "IfcStair": "Circulaciones",
  "IfcRamp": "Circulaciones",
  "IfcRailing": "Circulaciones",
  "IfcFlowSegment": "Instalaciones",
  "IfcPipeSegment": "Instalaciones",
  "IfcPipeFitting": "Instalaciones",
  "IfcDistributionFlowElement": "Instalaciones",
  "IfcFlowTerminal": "Instalaciones",
  "IfcFlowController": "Instalaciones",
  "IfcSanitaryTerminal": "Instalaciones",
  "IfcTank": "Instalaciones",
  "IfcPump": "Instalaciones",
  "IfcAirTerminal": "Instalaciones",
  "IfcDuctSegment": "Instalaciones",
  "IfcDuctFitting": "Instalaciones",
  "IfcCableSegment": "Instalaciones",
  "IfcCableFitting": "Instalaciones",
  "IfcLightFixture": "Instalaciones",
  "IfcLamp": "Instalaciones",
  "IfcSwitchingDevice": "Instalaciones",
  "IfcElectricDistributionBoard": "Instalaciones",
  "IfcFurnishingElement": "Amenities",
  "IfcFurniture": "Amenities",
  "IfcEquipmentElement": "Amenities",
  "IfcSite": "Parquizado",
  "IfcSpace": "Planeamiento",
  "IfcZone": "Planeamiento",
  DEFAULT: "Sin categoria"
};

export const mapIFCSpecificPatterns: Record<IFCEntity, Array<{ pattern: RegExp; catalogId: string }>> = {
  IfcWall: [
    { pattern: new RegExp("retak", "i"), catalogId: "MUR_RET15_001" },
    { pattern: new RegExp("bloque", "i"), catalogId: "MUR_BLO20_001" },
    { pattern: new RegExp("hollow", "i"), catalogId: "MUR_LAD15_001" },
    { pattern: new RegExp("glass", "i"), catalogId: "MUR_COR_VID001" }
  ],
  IfcSlab: [
    { pattern: new RegExp("alivianad", "i"), catalogId: "LOS_ALI001" },
    { pattern: new RegExp("pretens", "i"), catalogId: "LOS_PRE001" },
    { pattern: new RegExp("contrapiso", "i"), catalogId: "PIS_BAS_CON001" }
  ],
  IfcRoof: [
    { pattern: new RegExp("chapa", "i"), catalogId: "CUB_2A_CHA001" },
    { pattern: new RegExp("teja", "i"), catalogId: "CUB_2A_TEJ_CER001" },
    { pattern: new RegExp("industrial", "i"), catalogId: "CUB_IND_DIE001" }
  ],
  IfcPipeSegment: [
    { pattern: new RegExp("gas", "i"), catalogId: "PLO_SAN_2B001" },
    { pattern: new RegExp("pluvial", "i"), catalogId: "PLO_PLU_CAN001" }
  ],
  IfcCableSegment: [
    { pattern: new RegExp("luz", "i"), catalogId: "PLO_ELE_BOC001" },
    { pattern: new RegExp("tablero", "i"), catalogId: "PLO_ELE_TAB001" }
  ]
};

export function getCatalogSuggestions(ifcType: string | null | undefined): string[] {
  if (!ifcType) {
    return mapIFCtoCatalog.DEFAULT;
  }

  const direct = mapIFCtoCatalog[ifcType];
  if (direct && direct.length > 0) {
    return direct;
  }

  return mapIFCtoCatalog.DEFAULT;
}

export function resolvePrimaryCatalogId(ifcType: string, name?: string): string | undefined {
  const suggestions = getCatalogSuggestions(ifcType).filter((id) => id !== IFC_PENDING_ID);

  if (suggestions.length === 1) {
    return suggestions[0];
  }

  const patterns = mapIFCSpecificPatterns[ifcType];
  if (patterns && name) {
    const match = patterns.find((entry) => entry.pattern.test(name));
    if (match) {
      return match.catalogId;
    }
  }

  return undefined;
}

export function inferCategoryForIFCType(ifcType: string | null | undefined): string {
  if (!ifcType) {
    return mapIFCtoCategory.DEFAULT;
  }
  return mapIFCtoCategory[ifcType] ?? mapIFCtoCategory.DEFAULT;
}

