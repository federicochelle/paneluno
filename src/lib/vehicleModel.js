export const VEHICLE_STATUS = {
  DRAFT: 'borrador',
  PUBLISHED: 'publicado',
  ARCHIVED: 'archivado',
}

const baseVehicleShape = {
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
    path: '',
    publicUrl: '',
    src: '',
    alt: '',
  },

  galeria: [],

  estado: VEHICLE_STATUS.DRAFT,
  publicado: false,
  destacado: false,
  archivado: false,

  orden: '',
  created_at: '',
  updated_at: '',

  // Compatibilidad temporal con el modelo actual del panel.
  descripcion_parrafos: '',
  features: '',
  imagen_principal_src: '',
  imagen_principal_alt: '',
  imagen_principal_path: '',
}

export function createDefaultVehicle(overrides = {}) {
  return {
    ...baseVehicleShape,
    ...overrides,
    financiacion: {
      ...baseVehicleShape.financiacion,
      ...(overrides.financiacion || {}),
    },
    imagen_principal: {
      ...baseVehicleShape.imagen_principal,
      ...(overrides.imagen_principal || {}),
    },
    galeria: Array.isArray(overrides.galeria)
      ? [...overrides.galeria]
      : [...baseVehicleShape.galeria],
  }
}

export const defaultVehicleValues = createDefaultVehicle()
