// Script simple para probar la API
fetch('http://localhost:3001/api/roadmap/objetivos')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Datos de la API:', data.length, 'objetivos');
    if (data.length > 0) {
      console.log('📋 Primer objetivo:', data[0].titulo);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
