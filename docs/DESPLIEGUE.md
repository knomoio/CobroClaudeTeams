# GitHub Pages y Google OAuth

## Configuración pública y privada

No hay .env ni credenciales compiladas. El ID de cliente OAuth es un identificador público, **no un secreto**. El ID público de cliente de la aplicación está configurado en app.js. El ID de planilla no se incorpora al repositorio: el usuario lo introduce una vez y puede guardar su enlace personal con #planilla=ID en favoritos. El fragmento no se envía a GitHub Pages; identifica el archivo, pero no concede acceso. No compartir ese enlace innecesariamente. No se usan almacenes persistentes del navegador para sesiones o datos. No introducir client_secret. Token de acceso solo en memoria y en la cabecera Authorization, nunca en URL, archivos o registros.

Variable de repositorio ENABLE_PAGES: por defecto ausente (despliegue bloqueado); valor exacto true habilita despliegue de main después de las comprobaciones. No es una contraseña ni protege datos; controla únicamente la publicación del frontend.

## Configurar OAuth (administrador de Google Cloud)

1. Crear/seleccionar proyecto de Google Cloud y habilitar Google Sheets API. No modificar el proyecto o disparadores de Apps Script.
2. Configurar pantalla de consentimiento y los usuarios de prueba/autorizados según corresponda a la cuenta.
3. Crear cliente OAuth tipo aplicación web. Autorizar el origen HTTPS https://knomoio.github.io (sin ruta) y, para desarrollo, el origen localhost exacto utilizado. No autorizar orígenes ajenos. El modelo token de Google Identity Services no requiere secreto en el cliente.
4. Solicitar solamente https://www.googleapis.com/auth/spreadsheets.readonly. Este alcance permite leer las planillas accesibles para el usuario, no solo una; el panel únicamente solicita la identificada por él. Los permisos reales del archivo siguen siendo obligatorios.
5. Mantener la planilla privada y comprobar que una cuenta sin permiso recibe rechazo. El CSV local sigue disponible sin OAuth. El modo local no carga Google Identity Services.
6. Comprobar el adaptador de encabezados originales y la compatibilidad del historial legado. No cambiar la estructura bancaria de producción para acomodar la interfaz.
7. En el panel, elegir la planilla una vez, pulsar Conectar con Google y después Entrar con mi cuenta de Google. Guardar la dirección resultante en favoritos. Al abrir ese enlace personal, el panel prepara la biblioteca de Google y basta pulsar Entrar con mi cuenta de Google. No consulta Sheets hasta que el usuario autoriza. Sin un enlace personal, la página genérica para CSV no contacta Google. No hay renovación automática ni refresh token.

## Revisar y publicar

1. Revisar la PR, ejecutar npm run check y revisar manualmente **todos** los archivos públicos. El escaneo por patrones es defensa adicional y no detecta cualquier dato personal posible.
2. Comprobar que dist contiene solo index.html, styles.css, logic.js, adapter.js, app.js y .nojekyll; snapshot.js debe estar vacío. No agregar CSV, teléfonos, datos reales, IDs privados o fixtures al artefacto.
3. Fusionar la PR después de su revisión. Aún no publica: ENABLE_PAGES sigue ausente.
4. En Settings → Pages elegir Source: GitHub Actions. Configurar el entorno github-pages con revisión requerida si se desea un control adicional.
5. Solo después de aprobar el artefacto, establecer ENABLE_PAGES=true y ejecutar el workflow desde main. Los siguientes cambios en main se desplegarán automáticamente si pasan validación.
6. URL prevista, hasta confirmar un despliegue exitoso: https://knomoio.github.io/CobroClaudeTeams/ . Todos los recursos son relativos ./ y funcionan bajo la ruta de repositorio; no se usa enrutamiento que requiera redirecciones.
7. Comprobar acceso vacío, carga privada, consentimiento denegado, sesión expirada y vistas móvil/escritorio en producción antes de utilizar datos operativos.

## Referencias oficiales

- [Google: modelo token](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Google: alcances OAuth](https://developers.google.com/identity/protocols/oauth2/scopes)
- [GitHub: workflows de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
