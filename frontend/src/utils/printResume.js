export async function printResume() {
  const images = [...document.querySelectorAll('.resume-preview img')]
  await Promise.all(images.map((image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve()
    if (typeof image.decode === 'function') return image.decode().catch(() => undefined)
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }))
  window.print()
}
