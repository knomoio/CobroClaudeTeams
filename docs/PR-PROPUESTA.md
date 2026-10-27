# Panel de cobros privado en memoria para GitHub Pages

El panel permite revisar cobros por período desde CSV locales o Google Sheets con OAuth de solo lectura. Los datos privados y el token permanecen en memoria; el frontend público no contiene integrantes, teléfonos ni saldos.

### Cambios
- Pantalla de acceso, interfaz adaptable a computador y celular, tarjetas e historial sin compensar meses; fechas de ingreso/salida y titular separados.
- Importación atómica y adaptador de los encabezados reales de Sheets, respetando los permisos D/G/I.
- Mensajes editables y WhatsApp exclusivamente manual. Abrir un borrador no registra envío ni modifica pagos; las gestiones requieren declaración explícita y se exportan privadamente.
- Build con lista cerrada de archivos y escaneo; GitHub Actions preparado para Pages bajo la ruta del repositorio. Publicación desactivada hasta `ENABLE_PAGES=true`.

### Validación
- 26 pruebas de lógica con datos ficticios y build correctos.
- Pruebas Chromium correctas en 1440×1000 y 390×844: carga CSV, texto malicioso tratado como texto, WhatsApp manual, aislamiento contable, lectura OAuth simulada, vencimiento y borrado de sesión.
- Capturas de acceso y panel revisadas visualmente en ambos tamaños.
- Artefacto de CI descargado: sus seis archivos coinciden con las fuentes públicas revisadas. No contiene fixtures, CSV privados ni snapshot.
- Adaptador contrastado contra la fuente privada en memoria, sin guardar filas.
- [Ejecución verificada de Actions](https://github.com/knomoio/CobroClaudeTeams/actions/runs/40427387526) · [Capturas con datos ficticios](https://github.com/knomoio/CobroClaudeTeams/actions/runs/40427387526/artifacts/12699639549).

### Antes de producción
Configurar el cliente OAuth y probar consentimiento y permisos reales de Google; revisar y fusionar la PR; habilitar GitHub Pages siguiendo `docs/DESPLIEGUE.md`. Las pruebas OAuth de CI son simuladas. El historial legado no vacío requiere adaptación privada y se rechaza en lugar de descartarse. Los enlaces Tenpo generales no se tratan como individuales verificados.

Apps Script y sus disparadores permanecen intactos. `ENVIAR_MENSAJES = NO`.
