const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024
const WEBP_QUALITY = 0.82

function getFileBaseName(fileName) {
  const normalizedName = String(fileName || '').trim()
  const lastDotIndex = normalizedName.lastIndexOf('.')

  if (lastDotIndex <= 0) {
    return normalizedName || 'image'
  }

  return normalizedName.slice(0, lastDotIndex)
}

function buildWebpFileName(fileName) {
  return `${getFileBaseName(fileName)}.webp`
}

function assertSupportedImageType(file, fieldLabel) {
  if (!(file instanceof File)) {
    throw new Error(`No se recibió un archivo válido para ${fieldLabel}.`)
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `${fieldLabel} debe ser un archivo JPG, PNG o WEBP.`,
    )
  }
}

function validateProcessedFileSize(file, fieldLabel) {
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error(`${fieldLabel} no puede superar los 5 MB.`)
  }
}

function loadImageFromFile(file, fieldLabel) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`No se pudo leer ${fieldLabel} para convertirla a WEBP.`))
    }

    image.src = objectUrl
  })
}

function exportCanvasToWebp(canvas, fieldLabel, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`No se pudo convertir ${fieldLabel} a WEBP.`))
          return
        }

        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

export async function convertImageFileToWebp(
  file,
  {
    fieldLabel,
    maxWidth,
    quality = WEBP_QUALITY,
  },
) {
  assertSupportedImageType(file, fieldLabel)

  const isWebp = file.type === 'image/webp'
  const sourceImage = await loadImageFromFile(file, fieldLabel)
  const sourceWidth = sourceImage.naturalWidth || sourceImage.width
  const sourceHeight = sourceImage.naturalHeight || sourceImage.height

  if (!sourceWidth || !sourceHeight) {
    throw new Error(`No se pudieron obtener las dimensiones de ${fieldLabel}.`)
  }

  const shouldResize = sourceWidth > maxWidth

  if (isWebp && !shouldResize) {
    const webpFile = new File([file], buildWebpFileName(file.name), {
      type: 'image/webp',
      lastModified: file.lastModified,
    })

    validateProcessedFileSize(webpFile, fieldLabel)

    return {
      file: webpFile,
      width: sourceWidth,
      height: sourceHeight,
      wasConverted: false,
      wasResized: false,
    }
  }

  const targetWidth = shouldResize ? maxWidth : sourceWidth
  const targetHeight = Math.round((sourceHeight * targetWidth) / sourceWidth)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(`No se pudo preparar la conversión de ${fieldLabel} a WEBP.`)
  }

  canvas.width = targetWidth
  canvas.height = targetHeight
  context.drawImage(sourceImage, 0, 0, targetWidth, targetHeight)

  const webpBlob = await exportCanvasToWebp(canvas, fieldLabel, quality)
  const webpFile = new File([webpBlob], buildWebpFileName(file.name), {
    type: 'image/webp',
    lastModified: Date.now(),
  })

  validateProcessedFileSize(webpFile, fieldLabel)

  return {
    file: webpFile,
    width: targetWidth,
    height: targetHeight,
    wasConverted: !isWebp,
    wasResized: shouldResize,
  }
}

export {
  MAX_IMAGE_FILE_SIZE_BYTES,
  SUPPORTED_IMAGE_TYPES,
  WEBP_QUALITY,
}
