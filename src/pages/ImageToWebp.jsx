import { createSignal } from 'solid-js'

function ImageToWebp(props) {
  const [file, setFile] = createSignal(null)
  const [preview, setPreview] = createSignal(null)
  const [quality, setQuality] = createSignal(90)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)

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
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const convertToWebP = async () => {
    if (!file()) return

    setLoading(true)
    try {
      const img = new Image()
      img.src = preview()
      await new Promise((resolve) => { img.onload = resolve })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file().name.replace(/\.[^.]+$/, '.webp')
        a.click()
        URL.revokeObjectURL(url)
        setLoading(false)
      }, 'image/webp', quality() / 100)
    } catch (err) {
      setError('转换失败，请重试')
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
        <h2 class="text-2xl font-semibold mb-6" style="color: var(--color-text);">图片转 WebP</h2>

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
          <div class="soft-preview soft-fade-in">
            <img src={preview()} alt="Preview" />
          </div>
        )}

        {preview() && (
          <div class="mb-6">
            <label class="block mb-3" style="color: var(--color-text);">
              质量: {quality()}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality()}
              onInput={(e) => setQuality(parseInt(e.target.value))}
              class="soft-range"
            />
          </div>
        )}

        {preview() && (
          <button
            class="soft-button-primary w-full"
            onClick={convertToWebP}
            disabled={loading()}
          >
            {loading() ? '转换中...' : '转换为 WebP'}
          </button>
        )}
      </div>
    </main>
  )
}

export default ImageToWebp
