'use client';

import { useEffect } from 'react';

export function ColorVerifier() {
  useEffect(() => {
    // Verificar que no hay amarillos en el DOM
    const checkForYellow = () => {
      const elements = document.querySelectorAll('*');
      let yellowCount = 0;
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const backgroundColor = computedStyle.backgroundColor;
        const color = computedStyle.color;
        
        // Verificar si hay colores amarillos
        if (backgroundColor.includes('rgb(255, 255, 0)') || 
            backgroundColor.includes('rgb(255, 255, 128)') ||
            backgroundColor.includes('rgb(255, 255, 224)') ||
            backgroundColor.includes('rgb(255, 255, 240)') ||
            backgroundColor.includes('rgb(255, 255, 248)') ||
            color.includes('rgb(255, 255, 0)')) {
          yellowCount++;
          console.warn('🚨 AMARILLO DETECTADO:', el, { backgroundColor, color });
          console.log('Element details:', {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            textContent: el.textContent?.substring(0, 100)
          });
          
          // Forzar cambio de color inmediatamente
          if (backgroundColor.includes('rgb(255, 255, 0)')) {
            (el as HTMLElement).style.backgroundColor = '#f3f4f6'; // gray-100
          }
        }
      });
      
      if (yellowCount === 0) {
        console.log('✅ Sin amarillos detectados en el DOM');
      } else {
        console.log(`🚨 ${yellowCount} elementos con amarillo detectados`);
      }
    };
    
    // Verificar después de 2 segundos para que el DOM se renderice
    setTimeout(checkForYellow, 2000);
  }, []);

  return null;
}
