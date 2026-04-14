/**
 * Redimensiona una imagen si excede los límites de dimensiones especificados
 * @param file - File object de la imagen
 * @param maxWidth - Ancho máximo permitido en píxeles (default: 1920)
 * @param maxHeight - Alto máximo permitido en píxeles (default: 1080)
 * @returns Promise<File> - Archivo redimensionado o el original si es más pequeño
 */
export async function resizeImageIfNeeded(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Si la imagen es más pequeña que los límites, retorna la original
        if (img.width <= maxWidth && img.height <= maxHeight) {
          resolve(file)
          return
        }

        // Calcula nuevas dimensiones manteniendo aspecto ratio
        let newWidth = img.width
        let newHeight = img.height

        if (newWidth > maxWidth) {
          newHeight = Math.round((newHeight * maxWidth) / newWidth)
          newWidth = maxWidth
        }

        if (newHeight > maxHeight) {
          newWidth = Math.round((newWidth * maxHeight) / newHeight)
          newHeight = maxHeight
        }

        // Redimensiona la imagen en canvas
        const canvas = document.createElement('canvas')
        canvas.width = newWidth
        canvas.height = newHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto de canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Convierte canvas a blob y crea nuevo File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo convertir canvas a blob'))
              return
            }

            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            resolve(newFile)
          },
          'image/jpeg',
          0.95 // Calidad JPEG 95%
        )
      }

      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo'))
    }

    reader.readAsDataURL(file)
  })
}
