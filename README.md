# ATLAS — Observatorio de Inversiones

Dashboard estático, responsive e interactivo para **TSM, MSFT, V y COST**; también vigila **ETN, ASML, CRH, SNOW, AMX**. Toda la interfaz está en español. No coloca órdenes ni accede a ARQ.

## Contenido

- `index.html`, `styles.css`, `app.js`: interfaz web de una sola página; no requiere compilación.
- `scripts/update_data.py`: descarga precios ajustados y métricas financieras de Yahoo Finance (`yfinance`) y titulares públicos en RSS de Google News, con manejo de fallos y marca temporal.
- `data/market.json`: último corte público. Inicialmente está vacío de cotizaciones verificadas; no hay datos simulados presentados como reales.
- `.github/workflows/daily-update.yml`: actualización diaria **03:30 UTC** (21:30 en Monterrey). Github puede ejecutar jobs programados con retraso y puede suspenderlos tras inactividad prolongada del repositorio.

## Publicar en GitHub Pages — preparación inicial

1. Crear un repositorio **público** dedicado, por ejemplo `atlas-inversiones`. **No** incluir información privada ni el correo del destinatario de los reportes en el repositorio.
2. Subir los archivos y carpetas, incluida `.github/workflows/daily-update.yml` y `.nojekyll`, directamente a la rama `main`.
3. GitHub → repositorio → **Settings → Pages → Build and deployment → Source: GitHub Actions** → Save. GitHub Pages publicará `https://USUARIO.github.io/atlas-inversiones/` (sustituir usuario y repositorio reales).
4. GitHub → **Actions → Publicar y actualizar dashboard → Run workflow** para el primer corte. El push inicial a `main` también activa el flujo. Verificar que termine con éxito y que aparezca la URL del despliegue.
5. GitHub → **Settings → Actions → General → Workflow permissions → Read and write permissions** si el bot no puede hacer commit. El flujo necesita permisos `pages: write` e `id-token: write` para publicar. Puede requerir aprobación administrativa en cuentas organizacionales.
6. Verificar en la web la marca temporal; si la última actualización tiene más de tres días, interpretarla como **dato atrasado**.

> En un repositorio público, **cualquier persona con el enlace puede ver las acciones y todos los datos del sitio**, incluida la lista de activos vigilados. Esta versión nunca publica tu correo ni tus transacciones.

## Ejecutar localmente

```bash
python -m pip install -r requirements.txt
python scripts/update_data.py
python -m http.server 8000
```

Abrir `http://localhost:8000/`. Hay proveedores que bloquean solicitudes automatizadas por cuota o limitación geográfica. Si no se descargan los datos, el script deja una señal visible de actualización parcial; no crea precios falsos. Para ver el HTML antes de descargar datos, basta iniciar el servidor web.

## Metodología del riesgo

- Rendimientos diarios aproximados en MXN: `(1 + r_acción_USD) * (1 + r_USD/MXN) - 1`.
- VaR 95%: percentil 95 de pérdidas diarias observadas.
- ES 95%: promedio de pérdidas en la cola más desfavorable.
- Volatilidad: desviación diaria × √252.
- Drawdown: pérdida máxima desde el máximo acumulado.
- La ventana por defecto utiliza hasta 756 observaciones con datos alineados. La salida **no** estima probabilidades futuras de pérdida a cinco años.

## Advertencias

- `yfinance` es un proveedor comunitario y no reemplaza cotizaciones de una bolsa ni estados financieros auditados.
- Datos de Yahoo pueden presentar monedas heterogéneas en ADRs. El código evita calcular FCF yield cuando la moneda del FCF no coincide con la moneda de cotización/valor bursátil.
- Los titulares se clasifican por palabras clave; jamás asumir causalidad ni validez económica por la etiqueta. Leer las fuentes enlazadas.
- La actualización de la página funciona desde GitHub Actions **después** de configurar y publicar el repositorio. La tarea de correo semanal es separada; el código **no envía correos** y no contiene tokens ni contraseñas.
