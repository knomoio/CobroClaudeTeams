# Arquitectura

GitHub guarda únicamente código y documentación. Actions valida y genera un frontend estático por lista cerrada. GitHub Pages aloja el frontend después de habilitar expresamente la variable de publicación. Rutas relativas sirven el sitio bajo /CobroClaudeTeams/.

web/logic.js: CSV, contrato, cuadratura, cálculo por mes, elegibilidad y URLs. web/app.js: sesión de memoria, DOM seguro, OAuth token model, lectura batchGet de Sheets, registro manual y exportación. web/snapshot.js está vacío y no se despliega. No se envían datos locales a servidor alguno.

Google Sheets conserva la autoridad contable. OAuth spreadsheets.readonly deja que Google aplique permisos reales. El cliente necesita un adaptador si los encabezados reales difieren; no se hacen escrituras para resolverlo. Apps Script y sus disparadores quedan intactos.

No existe integración de ChatGPT Sites ni backend nuevo. No hay conexión de correo o banco en el frontend. WhatsApp recibe un borrador por wa.me únicamente ante clic explícito del administrador.

web/adapter.js conecta el esquema original verificado en solo lectura. No guarda filas privadas ni usa los enlaces generales de Tenpo como si fueran individuales.
