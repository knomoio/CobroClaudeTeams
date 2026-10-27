# Seguridad

Pages publica el código y la pantalla de acceso; no ofrece privacidad integral. La interfaz vacía no es una barrera de seguridad por sí sola. Los datos proceden de archivos locales del administrador o de la API de Sheets con OAuth y permisos del archivo.

- ENVIAR_MENSAJES = NO, sin bots, Cloud API, envíos o cambios bancarios.
- Sin contraseñas falsas, claves secretas, tokens o datasets en el repositorio.
- Sin almacenamiento persistente, analítica, fuentes externas ni caché de aplicación. Solo se carga Google Identity Services cuando el usuario solicita conexión. No se solicita ese servicio en importación local.
- Importación atómica con validación; texto externo representado mediante textContent. No se ejecutan fórmulas ni HTML de CSV.
- Cabeceras OAuth con cache:no-store y referrerPolicy:no-referrer. Tokens vencidos borran el panel; cerrar sesión solicita revocación del token. OAuth y lectura son cliente a Google directamente.
- Los archivos exportados, el portapapeles y los borradores de WhatsApp quedan bajo control del usuario. El envío de número y mensaje a WhatsApp ocurre solo al pulsar Abrir WhatsApp. Nunca se registra envío automáticamente.
- La exportación GESTIONES neutraliza prefijos de fórmulas para reducir riesgo al abrir en hojas de cálculo. Mantener los archivos exportados fuera de Git.
- CSP restringe scripts, conexiones y frames; ningún dato en rutas o parámetros de navegación del panel. En localhost/file el navegador puede limitar algunas funciones; copiar manualmente sigue disponible.
- La memoria no protege frente a extensiones maliciosas o alguien con acceso al dispositivo. Cerrar la sesión borra la interfaz y referencias, sin prometer borrado forense del sistema.

El build usa lista cerrada de archivos y escanea patrones de secretos, teléfonos y almacenamiento persistente. No reemplaza revisión humana. Los tests usan solo personas y cifras inventadas; no se cargan al frontend público. Nunca subir el ZIP confidencial anterior mencionado en el brief.
