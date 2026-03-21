import { createSignal, onMount } from 'solid-js'

function ImageCrop(props) {
  const [file, setFile] = createSignal(null)
  const [preview, setPreview] = createSignal(null)
  const [imageData, setImageData] = createSignal(null)
  const [cropArea, setCropArea] = createSignal({ x: 0, y: 0, w: 0, h: 0 })
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)

  let containerRef
  let imgRef
  let dragging = null

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB')
      return
    }

    setError(null)
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleImageLoad = (e) => {
    const img = e.target
    const rect = img.getBoundingClientRect()
    setImageData({
      width: img.naturalWidth,
      height: img.naturalHeight,
      displayWidth: rect.width,
      displayHeight: rect.height,
      offsetX: rect.left,
      offsetY: rect.top
    })
    setCropArea({
      x: 0,
      y: 0,
      w: rect.width,
      h: rect.height
    })
  }

  const getRelativePos = (e) => {
    const rect = imgRef.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrag = (e, type) => {
    e.stopPropagation()
    e.preventDefault()
    dragging = type
  }

  const onMouseMove = (e) => {
    if (!dragging || !imageData()) return

    const pos = getRelativePos(e)
    const img = imageData()
    const area = { ...cropArea() }

    if (dragging === 'move') {
      area.x = Math.max(0, Math.min(pos.x - (area.w / 2), img.displayWidth - area.w))
      area.y = Math.max(0, Math.min(pos.y - (area.h / 2), img.displayHeight - area.h))
    } else if (dragging === 'n') {
      const dy = pos.y - area.y
      area.y = Math.max(0, area.y + dy)
      area.h = Math.max(20, area.h - dy)
    } else if (dragging === 's') {
      area.h = Math.max(20, Math.min(pos.y - area.y, img.displayHeight - area.y))
    } else if (dragging === 'w') {
      const dx = pos.x - area.x
      area.x = Math.max(0, area.x + dx)
      area.w = Math.max(20, area.w - dx)
    } else if (dragging === 'e') {
      area.w = Math.max(20, Math.min(pos.x - area.x, img.displayWidth - area.x))
    } else if (dragging === 'nw') {
      const dx = pos.x - area.x
      const dy = pos.y - area.y
      area.x = Math.max(0, area.x + dx)
      area.y = Math.max(0, area.y + dy)
      area.w = Math.max(20, area.w - dx)
      area.h = Math.max(20, area.h - dy)
    } else if (dragging === 'ne') {
      const dy = pos.y - area.y
      area.y = Math.max(0, area.y + dy)
      area.w = Math.max(20, Math.min(pos.x - area.x, img.displayWidth - area.x))
      area.h = Math.max(20, area.h - dy)
    } else if (dragging === 'sw') {
      const dx = pos.x - area.x
      area.x = Math.max(0, area.x + dx)
      area.w = Math.max(20, area.w - dx)
      area.h = Math.max(20, Math.min(pos.y - area.y, img.displayHeight - area.y))
    } else if (dragging === 'se') {
      area.w = Math.max(20, Math.min(pos.x - area.x, img.displayWidth - area.x))
      area.h = Math.max(20, Math.min(pos.y - area.y, img.displayHeight - area.y))
    }

    setCropArea(area)
  }

  const stopDrag = () => {
    dragging = null
  }

  const cropImage = async () => {
    if (!preview() || !imageData()) return

    setLoading(true)
    try {
      const img = new Image()
      img.src = preview()
      await new Promise((resolve) => { img.onload = resolve })

      const imgData = imageData()
      const area = cropArea()

      const scaleX = imgData.width / imgData.displayWidth
      const scaleY = imgData.height / imgData.displayHeight

      const canvas = document.createElement('canvas')
      canvas.width = area.w * scaleX
      canvas.height = area.h * scaleY
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        area.x * scaleX, area.y * scaleY, area.w * scaleX, area.h * scaleY,
        0, 0, area.w * scaleX, area.h * scaleY
      )

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cropped-image.png'
        a.click()
        URL.revokeObjectURL(url)
        setLoading(false)
      }, 'image/png')
    } catch (err) {
      setError('裁剪失败，请重试')
      setLoading(false)
    }
  }

  return (
    <main class="max-w-2xl mx-auto">
      <button
        class="soft-button mb-6"
        onClick={() => props.navigate('/')}
      >
        返回首页
      </button>

      <div class="soft-card">
        <h2 class="text-2xl font-semibold mb-6" style="color: var(--color-text);">图片裁剪</h2>

        <div class="mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            class="soft-file-input"
          />
        </div>

        {error() && (
          <p class="soft-error">{error()}</p>
        )}

        {preview() && (
          <div
            ref={containerRef}
            class="mb-6 soft-fade-in relative inline-block"
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
          >
            <img
              ref={imgRef}
              src={preview()}
              alt="Preview"
              class="max-w-full rounded-xl block"
              onLoad={handleImageLoad}
              draggable={false}
              style="box-shadow: 4px 4px 8px var(--color-soft-dark), -4px -4px 8px var(--color-soft-light);"
            />

            {imageData() && (
              <>
                <div
                  class="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%,
                      0% 0%,
                      ${cropArea().x}px ${cropArea().y}px,
                      ${cropArea().x}px ${cropArea().y + cropArea().h}px,
                      ${cropArea().x + cropArea().w}px ${cropArea().y + cropArea().h}px,
                      ${cropArea().x + cropArea().w}px ${cropArea().y}px,
                      ${cropArea().x}px ${cropArea().y}px
                    )`
                  }}
                />

                <div
                  class="absolute cursor-move"
                  style={{
                    left: `${cropArea().x}px`,
                    top: `${cropArea().y}px`,
                    width: `${cropArea().w}px`,
                    height: `${cropArea().h}px`,
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.5)'
                  }}
                  onMouseDown={(e) => startDrag(e, 'move')}
                >
                  <div class="absolute inset-0 border border-white/50" />

                  <div class="absolute -top-1 -bottom-1 -left-1 -right-1 cursor-move">
                    <div
                      class="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full cursor-ns-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'n')}
                    />
                    <div
                      class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full cursor-ns-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 's')}
                    />
                    <div
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-ew-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'w')}
                    />
                    <div
                      class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-ew-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'e')}
                    />
                    <div
                      class="absolute top-0 left-0 w-4 h-4 bg-white rounded-full cursor-nwse-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'nw')}
                    />
                    <div
                      class="absolute top-0 right-0 w-4 h-4 bg-white rounded-full cursor-nesw-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'ne')}
                    />
                    <div
                      class="absolute bottom-0 left-0 w-4 h-4 bg-white rounded-full cursor-nesw-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'sw')}
                    />
                    <div
                      class="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full cursor-nwse-resize shadow-md"
                      onMouseDown={(e) => startDrag(e, 'se')}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {imageData() && (
          <button
            class="soft-button-primary w-full"
            onClick={cropImage}
            disabled={loading()}
          >
            {loading() ? '裁剪中...' : '裁剪并下载'}
          </button>
        )}
      </div>
    </main>
  )
}

export default ImageCrop
