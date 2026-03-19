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
        class="glass-button mb-6"
        onClick={() => props.navigate('/')}
      >
        返回首页
      </button>

      <div class="glass-card p-6">
        <h2 class="text-2xl font-semibold text-white mb-6">图片转 WebP</h2>

        <div class="mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            class="block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/20 file:text-white file:cursor-pointer hover:file:bg-white/30"
          />
        </div>

        {error() && (
          <p class="text-red-300 mb-4">{error()}</p>
        )}

        {preview() && (
          <div class="mb-6 fade-in">
            <img src={preview()} alt="Preview" class="max-w-full rounded-lg" />
          </div>
        )}

        {preview() && (
          <div class="mb-6">
            <label class="text-white block mb-2">
              质量: {quality()}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality()}
              onInput={(e) => setQuality(parseInt(e.target.value))}
              class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        )}

        {preview() && (
          <button
            class="glass-button w-full"
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
