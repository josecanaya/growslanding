from pathlib import Path
path = Path('apps/web/lib/services/ifcReader.ts')
text = path.read_text()
old = """      const itemIds = ifcManager.getAllItemsOfType(modelID, ifcTypeId, true) ?? []
      for (const expressID of itemIds) {
        const props = await ifcManager.getItemProperties(modelID, expressID, true);
        const guid = props.GlobalId?.value ?? typeName + '-' + expressID;
        const name =
          props.Name?.value?.trim() ??
          props.ObjectType?.value?.trim() ??
          toIfcTypeName(typeName);
        const ifcType = toIfcTypeName(typeName);
        elements.push({
          guid,
          ifcType,
          name,
          expressID,
        });
      }"""
