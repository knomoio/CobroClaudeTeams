# Frontend privado en memoria para GitHub Pages y Sheets

El repositorio estaba vacío. Esta propuesta añade el panel de cobros con pantalla de acceso, importación local de CSV y lectura OAuth de Sheets, manteniendo toda la información operativa fuera de los archivos públicos.

- Interfaz adaptable, selección mensual, tarjetas de cobrado/recuperado/pendiente e historial sin compensación entre meses.
- Adaptador de los encabezados originales comprobado mediante lectura privada, sin guardar filas; conserva permisos D/G/I y fechas de permanencia.
- WhatsApp exclusivamente manual, teléfono E.164, texto codificado, mensajes editables y registro explícito de gestiones exportable; abrir WhatsApp no altera pagos ni registra envío.
- OAuth spreadsheets.readonly, token solo en memoria, cierre por vencimiento, carga atómica y DOM con textContent.
- Build con lista cerrada y comprobación de datos sensibles. Workflow de Pages bajo la ruta de repositorio; publicación bloqueada hasta ENABLE_PAGES=true.

Validación completada: sintaxis JavaScript, 26 pruebas con datos ficticios, build y validación privada del adaptador contra la fuente. La ejecución de navegador local no estuvo disponible; el workflow incluye pruebas Playwright para escritorio/móvil, importación, XSS, gestiones y OAuth simulado, pendientes de ejecutar en Actions.

Antes de usar en producción: configurar cliente OAuth y probar con Google real, revisar el artefacto, ejecutar CI, verificar vistas y recién entonces habilitar Pages. El historial legado no vacío necesita adaptación privada; se bloquea en vez de descartarlo. Los enlaces generales de Tenpo no se presentan como individuales verificados.

Apps Script y sus disparadores permanecen intactos. ENVIAR_MENSAJES = NO.
