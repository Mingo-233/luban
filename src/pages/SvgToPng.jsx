import { createSignal } from 'solid-js'

function SvgToPng(props) {
  const [file, setFile] = createSignal(null)
  const [preview, setPreview] = createSignal(null)
  const [svgContent, setSvgContent] = createSignal(null)
  const [resolution, setResolution] = createSignal(1)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.svg')) {
      setError('请选择 SVG 文件')
      return
    }

    setError(null)
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSvgContent(e.target.result)
      setPreview(e.target.result)
    }
    reader.readAsDataURL(selectedFile)
  }

  const convertToPng = async () => {
    if (!svgContent()) return

    setLoading(true)
    try {
      const img = new Image()
      img.src = svgContent()
      await new Promise((resolve) => { img.onload = resolve })

      const scale = resolution()
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file().name.replace('.svg', `.${scale}x.png`)
        a.click()
        URL.revokeObjectURL(url)
        setLoading(false)
      }, 'image/png')
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
        <h2 class="text-2xl font-semibold mb-6" style="color: var(--color-text);">SVG 转 PNG</h2>

        <div class="mb-6">
          <input
            type="file"
            accept=".svg"
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
          <>
            <div class="mb-4">
              <label class="block mb-3" style="color: var(--color-text);">分辨率</label>
              <div class="flex gap-3">
                {[{ v: 1, l: '1x' }, { v: 2, l: '2x' }, { v: 4, l: '4x' }].map(opt => (
                  <button
                    class={`soft-button px-4 py-2 text-sm ${resolution() === opt.v ? '' : ''}`}
                    style={resolution() === opt.v ? {
                      background: 'linear-gradient(145deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      boxShadow: 'inset 3px 3px 6px rgba(163, 168, 183, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.6)'
                    } : {}}
                    onClick={() => setResolution(opt.v)}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              class="soft-button-primary w-full"
              onClick={convertToPng}
              disabled={loading()}
            >
              {loading() ? '转换中...' : '转换为 PNG'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default SvgToPng
