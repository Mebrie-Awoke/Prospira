import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Minus, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const FRAME_SIZE = 220
const OUTPUT_SIZE = 512

export default function ProfilePhotoEditor({ photoUrl, shape, onApply, onRemove }) {
  const [sourceUrl, setSourceUrl] = useState('')
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState(null)
  const [error, setError] = useState('')
  const fileInput = useRef(null)
  const stage = useRef(null)

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
  }, [sourceUrl])

  const baseScale = image
    ? Math.max(FRAME_SIZE / image.naturalWidth, FRAME_SIZE / image.naturalHeight)
    : 1
  const displayScale = baseScale * zoom
  const imageWidth = image ? image.naturalWidth * displayScale : FRAME_SIZE
  const imageHeight = image ? image.naturalHeight * displayScale : FRAME_SIZE
  const maxX = Math.max(0, (imageWidth - FRAME_SIZE) / 2)
  const maxY = Math.max(0, (imageHeight - FRAME_SIZE) / 2)

  function openImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('This image is larger than 5 MB. Choose a smaller file.')
      return
    }
    const nextUrl = URL.createObjectURL(file)
    const nextImage = new Image()
    nextImage.onload = () => {
      setSourceUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return nextUrl
      })
      setImage(nextImage)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setError('')
    }
    nextImage.onerror = () => {
      URL.revokeObjectURL(nextUrl)
      setError('We could not open this image. Try a different photo.')
    }
    nextImage.src = nextUrl
  }

  function pointerDown(event) {
    if (!image) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragStart({ pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: position })
  }

  function pointerMove(event) {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return
    const rect = stage.current.getBoundingClientRect()
    const scale = FRAME_SIZE / rect.width
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, dragStart.origin.x + (event.clientX - dragStart.x) * scale)),
      y: Math.max(-maxY, Math.min(maxY, dragStart.origin.y + (event.clientY - dragStart.y) * scale)),
    })
  }

  function changeZoom(value) {
    const nextZoom = Number(value)
    const nextScale = baseScale * nextZoom
    const nextMaxX = Math.max(0, (image.naturalWidth * nextScale - FRAME_SIZE) / 2)
    const nextMaxY = Math.max(0, (image.naturalHeight * nextScale - FRAME_SIZE) / 2)
    setZoom(nextZoom)
    setPosition((current) => ({
      x: Math.max(-nextMaxX, Math.min(nextMaxX, current.x)),
      y: Math.max(-nextMaxY, Math.min(nextMaxY, current.y)),
    }))
  }

  function applyCrop() {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    if (!context || !image) {
      setError('Photo editing is unavailable in this browser.')
      return
    }
    const cropLeft = (FRAME_SIZE - imageWidth) / 2 + position.x
    const cropTop = (FRAME_SIZE - imageHeight) / 2 + position.y
    const sourceX = -cropLeft / displayScale
    const sourceY = -cropTop / displayScale
    const sourceSize = FRAME_SIZE / displayScale
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('We could not prepare this photo. Try a different image.')
        return
      }
      onApply(blob, URL.createObjectURL(blob))
      setSourceUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return ''
      })
      setImage(null)
    }, 'image/jpeg', 0.9)
  }

  function cancelCrop() {
    setSourceUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return ''
    })
    setImage(null)
    setError('')
  }

  return (
    <section className="profile-photo-editor">
      <div className="photo-editor-heading">
        <span className="photo-editor-icon"><ImagePlus size={17} /></span>
        <span><strong>Profile photo</strong><small>Optional · JPEG, PNG, or WebP · up to 5 MB</small></span>
      </div>
      {!image && (
        <div className="photo-current-row">
          {photoUrl ? <img className={`photo-current photo-${shape}`} src={photoUrl} alt="Current profile" /> : <span className={`photo-current photo-empty photo-${shape}`}><ImagePlus size={20} /></span>}
          <div className="photo-current-actions">
            <button type="button" className="button button-outline" onClick={() => fileInput.current?.click()}><Upload size={14} /> {photoUrl ? 'Replace photo' : 'Upload photo'}</button>
            {photoUrl && <button type="button" className="entry-remove" onClick={onRemove}><Trash2 size={14} /> Remove</button>}
          </div>
          <input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={openImage} />
        </div>
      )}
      {image && (
        <div className="photo-cropper">
          <p>Drag the photo to reposition it. Use the slider to zoom.</p>
          <div
            ref={stage}
            className={`photo-crop-stage photo-${shape}`}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={() => setDragStart(null)}
            onPointerCancel={() => setDragStart(null)}
          >
            <img src={sourceUrl} alt="Crop preview" draggable="false" style={{ width: imageWidth, height: imageHeight, transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }} />
          </div>
          <label className="photo-zoom"><Minus size={14} /><input aria-label="Zoom photo" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => changeZoom(event.target.value)} /><Plus size={14} /></label>
          <div className="photo-crop-actions">
            <button type="button" className="button button-quiet" onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }) }}><RotateCcw size={14} /> Reset</button>
            <button type="button" className="button button-quiet" onClick={cancelCrop}>Cancel</button>
            <button type="button" className="button button-primary" onClick={applyCrop}>Apply crop</button>
          </div>
        </div>
      )}
      {error && <p className="photo-error" role="alert">{error}</p>}
    </section>
  )
}
