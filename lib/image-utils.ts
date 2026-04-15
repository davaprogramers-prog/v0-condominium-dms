/**
 * Redimensiona una imagen si excede los límites de dimensiones especificados
 * @param file - File object de la imagen
 * @param maxWidth - Ancho máximo permitido en píxeles (default: 600)
 * @param maxHeight - Alto máximo permitido en píxeles (default: 600)
 * @returns Promise<File> - Archivo redimensionado o el original si es más pequeño
 */
export async function resizeImageIfNeeded(
  file: File,
  maxWidth: number = 600,
  maxHeight: number = 600
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        console.log(`[v0] Image dimensions: ${img.width}x${img.height}, max allowed: ${maxWidth}x${maxHeight}`)
        
        // Si la imagen es más pequeña que los límites, retorna la original
        if (img.width <= maxWidth && img.height <= maxHeight) {
          console.log('[v0] Image is within limits, returning original file')
          resolve(file)
          return
        }

        console.log('[v0] Image exceeds limits, resizing...')

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

        console.log(`[v0] New image dimensions: ${newWidth}x${newHeight}`)

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

            console.log(`[v0] Image resized successfully, new size: ${(newFile.size / 1024).toFixed(2)}KB`)
            resolve(newFile)
          },
          'image/jpeg',
          0.75 // Calidad JPEG 75% para mejor compresión
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
