export async function resizeImage(file, maxEdge = 1600) {
  const valid = ['image/jpeg', 'image/png', 'image/webp']
  if (!valid.includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Only JPEG, PNG or WebP images up to 5 MB are allowed.')
  const image = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale)
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image could not be resized.')), 'image/jpeg', 0.82))
}
