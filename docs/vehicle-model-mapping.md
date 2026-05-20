# Vehicle Model Mapping

## Objetivo

Congelar el modelo actual del panel y definir un contrato frontend unico de `Vehicle` sin romper create, edit, list ni dashboard.

## Contrato frontend `Vehicle`

```js
{
  id: '',
  slug: '',

  marca: '',
  modelo: '',
  version: '',
  tipo_vehiculo: '',

  anio: '',
  kilometros: '',
  combustible: '',
  transmision: '',
  motor: '',
  color: '',

  precio: '',
  moneda: 'USD',

  telefono: '',
  ubicacion: '',

  subtitulo: '',
  descripcion: '',
  equipamiento: '',

  financiacion: {
    mostrar: false,
    logos: [],
    resumen: '',
  },

  imagen_principal: {
    src: '',
    alt: '',
  },

  galeria: [],

  estado: 'borrador',
  publicado: false,
  destacado: false,
  archivado: false,

  orden: '',
  created_at: '',
  updated_at: '',

  // compatibilidad temporal
  descripcion_parrafos: '',
  features: '',
  imagen_principal_src: '',
  imagen_principal_alt: '',
}
```

## Tabla de mapeo

| Frontend actual | Supabase actual | Vehicle objetivo | Observaciones / riesgos |
| --- | --- | --- | --- |
| `id` | `id` | `id` | Sin cambios |
| `slug` | `slug` | `slug` | Hoy se recalcula desde marca y modelo al guardar |
| `tipo_vehiculo` | `tipo_vehiculo` | `tipo_vehiculo` | Sigue normalizado a `auto` o `moto` |
| `marca` | `marca` | `marca` | Sin cambios |
| `modelo` | `modelo` | `modelo` | Sin cambios |
| `version` | `version` | `version` | Sin cambios |
| `anio` | `anio` | `anio` | UI lo usa como string, DB como integer nullable |
| `kilometros` | `kilometros` | `kilometros` | UI lo usa como string, DB como integer nullable |
| `combustible` | `combustible` | `combustible` | Sin cambios |
| `transmision` | `transmision` | `transmision` | Sin cambios |
| `motor` | `motor` | `motor` | Sin cambios |
| `color` | `color` | `color` | Sin cambios |
| `precio` | `precio` | `precio` | UI lo usa como string, DB como number nullable |
| `moneda` | `moneda` | `moneda` | Sigue como texto simple |
| `subtitulo` | `subtitulo` | `subtitulo` | Existe en el modelo actual aunque no estaba en el modelo objetivo inicial |
| `telefono` | `telefono` | `telefono` | Sin cambios |
| `ubicacion` | `ubicacion` | `ubicacion` | Sin cambios |
| `imagen_principal_src` | `imagen_principal_src` | `imagen_principal.src` | Se mantiene compatibilidad temporal con el campo legacy |
| `imagen_principal_alt` | `imagen_principal_alt` | `imagen_principal.alt` | Se mantiene compatibilidad temporal con el campo legacy |
| `galeria` | `galeria` | `galeria` | Se mantiene como array de `{ src, alt, orden }` |
| `financiacion.mostrar` | `financiacion` | `financiacion.mostrar` | Sigue derivado de la cantidad de logos |
| `financiacion.logos` | `financiacion` | `financiacion.logos` | Sin cambios de persistencia |
| `-` | `-` | `financiacion.resumen` | Solo reservado en frontend por ahora; no se persiste todavia |
| `descripcion_parrafos` | `descripcion_parrafos` | `descripcion` | Alias objetivo frontend; se sigue persistiendo en el campo legacy |
| `features` | `features` | `equipamiento` | Alias objetivo frontend; se sigue persistiendo en el campo legacy |
| `publicado` | `publicado` | `estado` + `publicado` | `estado` se deriva, pero se mantienen los flags actuales |
| `archivado` | `archivado` | `estado` + `archivado` | `estado` se deriva, pero se mantienen los flags actuales |
| `destacado` | `destacado` | `destacado` | Sin cambios |
| `orden` | `orden` | `orden` | UI lo usa como string, DB como integer nullable |
| `createdAt` | `created_at` | `created_at` | El listado actual usa camelCase en el view model |
| `updatedAt` | `updated_at` | `updated_at` | El listado actual usa camelCase en el view model |

## Funciones nuevas

- `createDefaultVehicle`
- `normalizeVehicleStatus`
- `syncLegacyVehicleFields`
- `mapVehicleDbToFormVehicle`
- `mapVehicleDbToListVehicle`
- `mapVehicleFormToDbPayload`

## Alcance de esta fase

- No renombra carpetas ni componentes.
- No cambia rutas.
- No cambia el schema de Supabase.
- No modifica la UI del formulario.
- No cambia la API publica de `src/lib/projects.js`.
