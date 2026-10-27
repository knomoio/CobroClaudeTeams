# Contrato de importación v1

Hay dos entradas: CSV normalizado v1 descrito abajo y CSV original con encabezados de Sheets. El adaptador original está en web/adapter.js y fue contrastado con lectura autorizada de la fuente. No renombres ni modifiques pestañas de producción.

Siete archivos UTF-8 separados por comas, nombres exactos indicados abajo más .csv. Comillas dobles para celdas con comas, comillas o saltos de línea. Máximo 5 MB por archivo; todas las tablas son obligatorias, aunque solo contengan encabezados. Las columnas pueden cambiar de orden pero no faltar, duplicarse ni agregarse.

| Archivo / pestaña | Encabezados |
|---|---|
| INTEGRANTES | id,nombre,ingreso,salida,titular |
| PERIODOS | periodo,estado,cargo,cuota,validado |
| RESUMEN | periodo,integrante,cuota,abonado,estado |
| MOVIMIENTOS | id,periodo,integrante,monto,estado,fecha |
| CONTACTOS | integrante,telefono,permiso,consentimiento,excluir |
| TENPO | periodo,integrante,url,verificado |
| GESTIONES | id,periodo,integrante,fecha,tipo,frase,movimiento |

- Fechas AAAA-MM-DD y meses AAAA-MM. Ingreso y salida son meses inclusivos. Salida vacía = sin fecha. Los datos privados determinan quién entra o sale; ningún nombre está codificado.
- Importes enteros CLP no negativos, sin signo, separadores ni símbolo monetario. Nunca se adivinan importes.
- Booleanos SI / NO exactos (sin tilde). titular permite separar al administrador de los aportes.
- PERIODOS.estado: ACTIVO / CERRADO / BORRADOR. validado=SI requiere cargo efectivo y cuota positiva. El cargo efectivo se usa para plazos; no se sustituye por el día habitual 23.
- RESUMEN.estado: PAGADO / PARCIAL / PENDIENTE / REVISAR / TITULAR (solo para el administrador). abonado debe igualar la suma de MOVIMIENTOS CONFIRMADO del mismo integrante y mes. Los pagos repetidos por id se rechazan. No se aplican sobrepagos a otros meses.
- MOVIMIENTOS.estado: CONFIRMADO / REVISAR; fecha es fecha de pago, periodo es el mes al que corresponde. Estos pueden diferir para recuperaciones.
- CONTACTOS.telefono: + seguido de 8 a 15 dígitos internacionales, sin espacios y sin cero inicial. Es validación sintáctica E.164, no prueba de titularidad. permiso y consentimiento deben ser SI y excluir debe ser NO. Mapear D/G/I del origen explícitamente; jamás inferir consentimiento.
- TENPO: requiere verificado=SI para la combinación integrante/período y URL HTTPS del host exacto tenpo.cl sin usuario, contraseña o puerto alternativo. La bandera de la fuente es la evidencia administrativa; el panel no comprueba beneficiario ni hace pagos.
- GESTIONES.tipo: RECORDATORIO / AGRADECIMIENTO. id único; frase utilizada para no repetir; movimiento vacío en recordatorios y un id confirmado no agradecido en agradecimientos. fecha = declaración de envío manual. No demuestra entrega.

## Formato original de Sheets y OAuth

Selecciona INTEGRANTES, PERIODOS, RESUMEN, MOVIMIENTOS, CONTACTOS, GESTIONES y AVISOS (sin TENPO). Los encabezados reales exactos están en web/adapter.js. OAuth lee esas mismas siete pestañas A1:Z10000 con una única petición de solo lectura. Se rechaza lectura al límite para evitar truncado.

El adaptador conserva las fechas de ingreso/salida, usa Monto imputado CLP para conciliación y respeta los permisos D/G/I. La validación de período exige fecha, cuota positiva, cargo real positivo y estado distinto de BORRADOR. El titular conserva su cuota informativa pero no se cobra a sí mismo. El enlace general de PERIODOS no demuestra verificación individual: no se habilita Tenpo a partir de ese enlace.

Si el historial legado AVISOS/GESTIONES contiene filas, se bloquea la carga en vez de descartarlas: falta una correspondencia inequívoca entre códigos de frases, envío manual y agradecimientos. En ese caso adaptar privadamente al formato normalizado completo antes de habilitar mensajes. No se importa la hoja FRASES automáticamente. El historial exportado por este panel se incorpora como GESTIONES normalizadas desde la sección de gestiones.
