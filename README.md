# Control personalizado de modelos 3D

Práctica 1.3 de Desarrollo de soluciones en ambientes virtuales. Aplicación web con Three.js que muestra un personaje FBX, iluminación, sombras y una cámara interactiva. Permite seleccionar seis animaciones con el teclado y realizar transiciones suaves entre ellas.

**Alumno:** ALONSO RAMREZ G  
**Número de control:** 22200790

## Ver el proyecto

https://alonsorgt1.github.io/Control-personalizado-de-modelos-3D/

El personaje es un archivo grande (aproximadamente 122 MB); la primera carga puede tardar según la conexión. Se necesita Internet para descargar Three.js 0.180.0 y Bootstrap 5.3.3 desde jsDelivr.

## Estructura

```text
index.html
README.md
assets/
  css/styles.css
  js/main.js
  models/
    character.fbx              # Modelo local, reconstruido durante la publicación
    character.fbx.part01       # Primera parte del modelo en Git
    character.fbx.part02       # Segunda parte del modelo en Git
    animations/
      Body_Block.fbx
      Capoeira.fbx
      Falling.fbx
      Hurricane_Kick.fbx
      Standing_2H_Magic_Attack 01.fbx
      Strafing.fbx
.github/workflows/pages.yml
```

## Controles

| Tecla | Animación |
| --- | --- |
| 1 | Body Block |
| 2 | Capoeira |
| 3 | Falling |
| 4 | Hurricane Kick |
| 5 | Standing 2H Magic Attack 01 |
| 6 | Strafing |

Arrastra con el botón izquierdo para rotar la cámara, usa la rueda para acercar o alejar y el botón derecho para desplazar la vista. Body Block se reproduce al terminar la carga. Las teclas cambian la animación; no controlan la posición del personaje por el escenario.

## Ejecutar localmente

Abre la carpeta con Visual Studio Code y sirve `index.html` mediante Live Server. Utiliza un navegador moderno compatible con WebGL y mapas de importación. No abras el HTML directamente con doble clic.

Si clonaste el repositorio, reconstruye primero el personaje con PowerShell desde la carpeta del proyecto:

```powershell
$destination = [System.IO.File]::Create((Join-Path $PWD 'assets/models/character.fbx'))
try {
    foreach ($part in 'assets/models/character.fbx.part01', 'assets/models/character.fbx.part02') {
        $source = [System.IO.File]::OpenRead((Join-Path $PWD $part))
        try { $source.CopyTo($destination) } finally { $source.Dispose() }
    }
} finally { $destination.Dispose() }
```

## Publicación y cambios

GitHub Pages se publica mediante GitHub Actions cada vez que se suben cambios a `main`. El flujo reconstruye el modelo a partir de sus dos partes, verifica su integridad y publica el HTML, los estilos, el JavaScript y los modelos.

El personaje original supera el límite de 100 MiB por archivo de GitHub. Las partes conservan todos sus bytes; `character.fbx` se mantiene localmente y se excluye de Git. Si reemplazas el personaje, debes regenerar las partes y actualizar su suma SHA-256 en el flujo de publicación.
