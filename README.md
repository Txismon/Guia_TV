# Guia de programacion para el addon de TV

Este repositorio solo existe para producir un fichero: `guide.xml.gz`, la guia de programacion en
formato XMLTV que lee el addon de Stremio. No contiene el addon.

Un flujo de GitHub Actions lo regenera dos veces al dia (05:17 y 17:17 UTC), lo comprueba y lo
publica en la rama `guide`:

```
https://raw.githubusercontent.com/<usuario>/<repositorio>/guide/guide.xml.gz
```

El addon lee esa URL y recarga la guia cada hora, de modo que refrescarla no exige volver a
desplegar nada.

## Que hace cada ejecucion

1. Clona el grabber de [iptv-org/epg](https://github.com/iptv-org/epg) e instala sus dependencias.
2. Captura tres dias de programacion solo de los canales listados en `channels.xml`.
3. Ejecuta `check-guide.js`: exige programacion para las proximas 12 horas en al menos 50 canales.
   Si no se llega, el trabajo falla y **la guia anterior sigue publicada**. Una captura fallida no
   deja un fichero roto sino uno valido y casi vacio, y sin esta comprobacion sustituiria a la buena.
4. Publica la guia en la rama `guide`, que se rehace desde cero con un unico commit en cada ejecucion
   para que el repositorio no crezca.

Si una ejecucion falla, GitHub avisa por correo al propietario del repositorio.

## Cambiar los canales

`channels.xml` decide que canales se capturan. Se genera desde el proyecto del addon, que lo cruza
con la lista M3U:

```
npm run build-channels
```

Despues se copia aqui y se sube. El flujo se ejecuta solo al cambiar este fichero.

## Ejecutarlo a mano

En la pestana Actions, flujo "Refrescar guia", boton Run workflow.

## Aviso

La programacion procede de webs de terceros, que captura el grabber de iptv-org. Este repositorio es
de uso personal.
