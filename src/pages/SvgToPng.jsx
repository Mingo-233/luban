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
        class="glass-button mb-6"
        onClick={() => props.navigate('/')}
      >
        返回首页
      </button>

      <div class="glass-card p-6">
        <h2 class="text-2xl font-semibold text-white mb-6">SVG 转 PNG</h2>

        <div class="mb-6">
          <input
            type="file"
            accept=".svg"
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
          <>
            <div class="mb-4">
              <label class="text-white block mb-2">分辨率</label>
              <div class="flex gap-4">
                {[{ v: 1, l: '1x' }, { v: 2, l: '2x' }, { v: 4, l: '4x' }].map(opt => (
                  <button
                    class={`px-4 py-2 rounded-lg transition-all ${resolution() === opt.v ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => setResolution(opt.v)}
                  >
                    <span class="text-white">{opt.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              class="glass-button w-full"
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
