# Claude Team · Cobros

Panel estático para GitHub Pages, Google Sheets privado y WhatsApp exclusivamente manual. ENVIAR_MENSAJES = NO.

El repositorio estaba vacío al inspeccionarlo. Los documentos recibidos describían un starter que no estaba adjunto; esta implementación establece una base nueva e incorpora un adaptador contrastado con los encabezados reales de Sheets. La validación privada de carga se completó sin guardar filas en el proyecto.

## Ejecutar

Abre web/index.html para CSV local sin red. OAuth requiere un origen HTTP local o HTTPS autorizado. Node.js 22 o superior: npm run check. No hay dependencias de producción.

## Uso

1. Exporta/adapta privadamente las siete tablas descritas en [FORMATOS](docs/FORMATOS.md). Nunca las guardes en Git.
2. Selecciónalas juntas desde la pantalla de acceso. La carga completa se valida antes de mostrar información.
3. Revisa el período, la fuente y los estados. Prepara y edita mensajes, copia o abre WhatsApp.
4. Registra una gestión solo después de enviar tú mismo el mensaje. Exporta GESTIONES y consérvalo fuera del repositorio.
5. Al cerrar sesión o recargar se borran los datos. La sesión de Google también se cierra al vencer su token.

[Despliegue y OAuth](docs/DESPLIEGUE.md) · [Seguridad](docs/SEGURIDAD.md) · [Reglas](docs/REGLAS_NEGOCIO.md) · [Arquitectura](docs/ARQUITECTURA.md)

No se toca Apps Script, sus disparadores ni la estructura del Sheet. No hay integración con ChatGPT Sites.
