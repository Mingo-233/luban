import { createSignal, createEffect, For, Show, onMount } from 'solid-js'
import { jsPDF } from 'jspdf'

function ImageToPdf(props) {
  const [pages, setPages] = createSignal([])
  const [currentPageIndex, setCurrentPageIndex] = createSignal(0)
  const [selectedItem, setSelectedItem] = createSignal(null)
  const [canvasZoom, setCanvasZoom] = createSignal(1)
  const [isDragging, setIsDragging] = createSignal(false)
  const [dragOffset, setDragOffset] = createSignal({ mouseX: 0, mouseY: 0, imgX: 0, imgY: 0 })
  const [pageIdCounter, setPageIdCounter] = createSignal(1)
  const [isResizing, setIsResizing] = createSignal(false)
  const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0, width: 0, height: 0, scale: 1 })
  const [listDraggedItem, setListDraggedItem] = createSignal(null)
  const [isDownloading, setIsDownloading] = createSignal(false)

  let canvasRef
  let canvasContainerRef
  let fileInputRef

  const getCurrentPage = () => pages()[currentPageIndex()]

  onMount(() => {
    addPage()
  })

  const addPage = () => {
    const newPage = {
      id: pageIdCounter(),
      images: []
    }
    setPageIdCounter(c => c + 1)
    setPages(p => [...p, newPage])
    setCurrentPageIndex(pages().length)
  }

  const deletePage = (index) => {
    if (pages().length <= 1) return
    const newPages = pages().filter((_, i) => i !== index)
    setPages(newPages)
    if (currentPageIndex() >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1)
    }
    setSelectedItem(null)
  }

  const switchToPage = (index) => {
    setCurrentPageIndex(index)
    setSelectedItem(null)
  }

  const loadImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }

  const getImageDimensions = (src) => {
    return new Promise((resolve) => {
      const el = new Image()
      el.onload = () => resolve({ width: el.width, height: el.height })
      el.onerror = () => resolve({ width: 200, height: 200 })
      el.src = src
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('drag-active')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-active')
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-active')
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      await addImagesToCurrentPage(files)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      await addImagesToCurrentPage(files)
    }
    e.target.value = ''
  }

  const addImagesToCurrentPage = async (files) => {
    const page = getCurrentPage()
    if (!page) return
    const existingCount = page.images.length

    for (const file of files) {
      const id = Date.now() + Math.random().toString(36).substr(2, 9)
      const src = await loadImage(file)
      const dimensions = await getImageDimensions(src)

      page.images.push({
        id,
        file,
        src,
        name: file.name,
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height,
        scale: 1
      })
    }

    if (existingCount === 0 && page.images.length > 0) {
      positionImages(page)
    } else if (existingCount > 0) {
      positionNewImages(page, existingCount)
    }

    setPages([...pages()])
    setCurrentPageIndex(currentPageIndex())
  }

  const positionImages = (page) => {
    if (page.images.length === 0 || !canvasContainerRef) return

    const containerRect = canvasContainerRef.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    const maxImgWidth = Math.max(...page.images.map(i => i.width), 1)
    const maxImgHeight = Math.max(...page.images.map(i => i.height), 1)

    const baseScale = Math.min(
      (containerWidth * 0.8) / maxImgWidth,
      (containerHeight * 0.8) / maxImgHeight,
      1
    )

    if (!baseScale || !isFinite(baseScale)) return

    let totalHeight = 0
    let maxWidth = 0

    page.images.forEach(img => {
      img.scale = baseScale
      const scaledWidth = img.width * img.scale
      const scaledHeight = img.height * img.scale
      totalHeight += scaledHeight + 20
      maxWidth = Math.max(maxWidth, scaledWidth)
    })

    let currentY = -totalHeight / 2 + 20
    page.images.forEach(img => {
      img.x = -maxWidth / 2
      img.y = currentY
      currentY += img.height * img.scale + 20
    })
  }

  const positionNewImages = (page, startIndex) => {
    if (page.images.length <= startIndex || !canvasContainerRef) return

    const containerRect = canvasContainerRef.getBoundingClientRect()
    const containerWidth = containerRect.width

    const maxImgWidth = Math.max(...page.images.map(i => i.width), 1)
    const baseScale = Math.min((containerWidth * 0.6) / maxImgWidth, 0.5)

    if (!baseScale || !isFinite(baseScale)) return

    let maxX = 0
    let maxY = 0

    for (let i = 0; i < startIndex; i++) {
      const img = page.images[i]
      maxX = Math.max(maxX, img.x + img.width * img.scale)
      maxY = Math.max(maxY, img.y + img.height * img.scale)
    }

    let currentX = maxX + 30
    let currentY = 0

    for (let i = startIndex; i < page.images.length; i++) {
      const img = page.images[i]
      img.scale = baseScale

      if (currentX + img.width * img.scale > containerWidth * 0.9) {
        currentX = 0
        currentY = maxY + 30
      }

      img.x = currentX
      img.y = currentY
      currentX += img.width * img.scale + 20
      maxY = Math.max(maxY, img.y + img.height * img.scale)
    }
  }

  const handleItemMouseDown = (e, id) => {
    if (e.target.classList.contains('delete-btn') || e.target.classList.contains('resize-handle')) return

    const page = getCurrentPage()
    const img = page.images.find(i => i.id === id)
    if (!img) return

    setSelectedItem(id)
    setIsDragging(true)

    setDragOffset({
      mouseX: e.clientX,
      mouseY: e.clientY,
      imgX: img.x,
      imgY: img.y
    })
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging() || !selectedItem()) return

    const page = getCurrentPage()
    const img = page.images.find(i => i.id === selectedItem())
    if (!img) return

    img.x = dragOffset().imgX + (e.clientX - dragOffset().mouseX)
    img.y = dragOffset().imgY + (e.clientY - dragOffset().mouseY)

    setPages([...pages()])
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const startResize = (e, item) => {
    e.stopPropagation()
    setIsResizing(true)
    const id = item.dataset.id
    const page = getCurrentPage()
    const img = page.images.find(i => i.id === id)
    if (!img) return

    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: img.width * img.scale,
      height: img.height * img.scale,
      scale: img.scale
    })

    setSelectedItem(id)
  }

  const handleResize = (e) => {
    if (!isResizing() || !selectedItem()) return

    const page = getCurrentPage()
    const img = page.images.find(i => i.id === selectedItem())
    if (!img) return

    const deltaX = (e.clientX - resizeStart().x) / canvasZoom()
    const deltaY = (e.clientY - resizeStart().y) / canvasZoom()
    const avgDelta = (deltaX + deltaY) / 2

    const newScale = Math.max(0.1, resizeStart().scale + avgDelta / 200)
    img.scale = newScale

    setPages([...pages()])
  }

  const handleCanvasClick = (e) => {
    if (e.target === canvasContainerRef || e.target === canvasRef || e.target.classList.contains('drop-zone')) {
      setSelectedItem(null)
    }
  }

  const deleteImage = (id) => {
    const page = getCurrentPage()
    page.images = page.images.filter(img => img.id !== id)
    if (selectedItem() === id) {
      setSelectedItem(null)
    }
    setPages([...pages()])
  }

  const clearCurrentPage = () => {
    const page = getCurrentPage()
    if (page.images.length === 0) return
    page.images = []
    setSelectedItem(null)
    setPages([...pages()])
  }

  const handleListDragStart = (e) => {
    const item = e.target.closest('.image-item')
    if (!item) return
    setListDraggedItem(item)
    item.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleListDragEnd = (e) => {
    const item = e.target.closest('.image-item')
    if (item) {
      item.classList.remove('dragging')
    }
    setListDraggedItem(null)
    document.querySelectorAll('.image-item').forEach(item => {
      item.classList.remove('drag-over')
    })
  }

  const handleListDragOver = (e) => {
    e.preventDefault()
    const target = e.target.closest('.image-item')
    if (target && target !== listDraggedItem()) {
      target.classList.add('drag-over')
    }
  }

  const handleListDrop = (e) => {
    e.preventDefault()
    const target = e.target.closest('.image-item')
    if (!target || !listDraggedItem()) return

    const page = getCurrentPage()
    const draggedId = listDraggedItem().dataset.id
    const targetId = target.dataset.id

    const draggedIndex = page.images.findIndex(i => i.id === draggedId)
    const targetIndex = page.images.findIndex(i => i.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const [removed] = page.images.splice(draggedIndex, 1)
    page.images.splice(targetIndex, 0, removed)

    setPages([...pages()])
  }

  const handleCanvasWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setCanvasZoom(z => Math.max(0.2, Math.min(2, z + delta)))
    }
  }

  const downloadPDF = async () => {
    const pagesWithImages = pages().filter(p => p.images.length > 0)
    if (pagesWithImages.length === 0) return

    setIsDownloading(true)

    try {
      const pageConfigs = []

      for (const page of pagesWithImages) {
        for (const img of page.images) {
          if (img.width === 0) {
            const dims = await getImageDimensions(img.src)
            img.width = dims.width
            img.height = dims.height
          }
        }

        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0
        page.images.forEach(img => {
          const w = img.width * img.scale
          const h = img.height * img.scale
          minX = Math.min(minX, img.x)
          minY = Math.min(minY, img.y)
          maxX = Math.max(maxX, img.x + w)
          maxY = Math.max(maxY, img.y + h)
        })

        pageConfigs.push({
          page,
          minX,
          minY,
          width: maxX - minX,
          height: maxY - minY
        })
      }

      const maxPageWidth = Math.max(...pageConfigs.map(p => p.width))
      const maxPageHeight = Math.max(...pageConfigs.map(p => p.height))

      const pdf = new jsPDF({
        orientation: maxPageWidth > maxPageHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [maxPageWidth, maxPageHeight]
      })

      for (let i = 0; i < pageConfigs.length; i++) {
        if (i > 0) {
          pdf.addPage([maxPageWidth, maxPageHeight])
        }

        const config = pageConfigs[i]
        const page = config.page

        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, maxPageWidth, maxPageHeight, 'F')

        for (const img of page.images) {
          const w = img.width * img.scale
          const h = img.height * img.scale
          const x = img.x - config.minX
          const y = img.y - config.minY

          try {
            pdf.addImage(img.src, 'JPEG', x, y, w, h)
          } catch (err) {
            console.warn('Image add failed:', img.name, err)
          }
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10)
      pdf.save(`merged-pdf-${timestamp}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDF 生成失败，请重试')
    } finally {
      setIsDownloading(false)
    }
  }

  const getImageCount = () => {
    const page = getCurrentPage()
    return page ? page.images.length : 0
  }

  const pageCount = () => pages().length

  return (
    <main class="max-w-6xl mx-auto">
      <button
        class="glass-button mb-6"
        onClick={() => props.navigate('/')}
      >
        返回首页
      </button>

      <div class="flex flex-col h-[calc(100vh-200px)] gap-4">
        <header class="glass-card p-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">图片拼接 PDF</h2>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              <For each={pages()}>
                {(page, index) => (
                  <div
                    class={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      currentPageIndex() === index() ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-white/10'
                    }`}
                    onClick={() => switchToPage(index())}
                  >
                    <span class="text-sm">第{index() + 1}页</span>
                    <Show when={pages().length > 1}>
                      <button
                        class="ml-1 w-4 h-4 rounded-full bg-white/20 hover:bg-red-500 flex items-center justify-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePage(index())
                        }}
                      >
                        ×
                      </button>
                    </Show>
                  </div>
                )}
              </For>
              <button
                class="w-7 h-7 rounded-full bg-violet-500/30 border border-dashed border-violet-500 flex items-center justify-center text-violet-400 hover:bg-violet-500/50 transition-all"
                onClick={addPage}
                title="添加页面"
              >
                +
              </button>
            </div>
            <button
              class="glass-button !bg-white/10 !border-white/20 !hover:bg-white/20 text-sm"
              onClick={clearCurrentPage}
              disabled={getImageCount() === 0}
            >
              清空
            </button>
            <button
              class="glass-button text-sm"
              onClick={downloadPDF}
              disabled={isDownloading() || pages().every(p => p.images.length === 0)}
            >
              {isDownloading() ? '生成中...' : '下载 PDF'}
            </button>
          </div>
        </header>

        <div class="flex flex-1 gap-4 min-h-0">
          <aside class="w-64 glass-card p-4 flex flex-col">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm text-gray-400 font-medium">当前页图片</h3>
              <span class="text-xs bg-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full">
                {getImageCount()}
              </span>
            </div>
            <div
              class="flex-1 overflow-y-auto flex flex-col gap-2 pr-2"
              style={{ "scrollbar-width": "thin" }}
            >
              <For each={getCurrentPage()?.images || []}>
                {(img, index) => (
                  <div
                    class="image-item flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all"
                    draggable={true}
                    data-id={img.id}
                    onDragStart={handleListDragStart}
                    onDragEnd={handleListDragEnd}
                    onDragOver={handleListDragOver}
                    onDrop={handleListDrop}
                  >
                    <span class="text-gray-500 cursor-grab">⋮⋮</span>
                    <img src={img.src} alt={img.name} class="w-10 h-10 object-cover rounded" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-gray-300 truncate">{img.name}</div>
                      <div class="text-xs text-gray-500">第 {index() + 1} 张</div>
                    </div>
                    <button
                      class="w-6 h-6 rounded bg-white/10 hover:bg-red-500/50 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                      onClick={() => deleteImage(img.id)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </div>
          </aside>

          <section class="flex-1 glass-card p-4 flex flex-col min-h-0">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm text-gray-400 font-medium">画布预览</h3>
              <div class="flex items-center gap-2">
                <button
                  class="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  onClick={() => setCanvasZoom(z => Math.max(0.2, z - 0.1))}
                >
                  −
                </button>
                <span class="text-xs text-gray-400 w-12 text-center">
                  {Math.round(canvasZoom() * 100)}%
                </span>
                <button
                  class="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  onClick={() => setCanvasZoom(z => Math.min(2, z + 0.1))}
                >
                  +
                </button>
                <button
                  class="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  onClick={() => setCanvasZoom(1)}
                  title="重置缩放"
                >
                  ↺
                </button>
              </div>
            </div>
            <div
              ref={canvasContainerRef}
              class="flex-1 rounded-lg overflow-hidden relative"
              style={{
                background: `linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
                             linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
                             linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%),
                             linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)`,
                "background-size": "16px 16px",
                "background-position": "0 0, 0 8px, 8px -8px, -8px 0px",
                "background-color": "rgba(30,30,50,0.5)"
              }}
              onClick={handleCanvasClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onWheel={handleCanvasWheel}
            >
              <Show when={getImageCount() === 0}>
                <div class="drop-zone absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div class="w-16 h-16 rounded-xl border-2 border-dashed border-violet-500/50 flex items-center justify-center text-violet-400 text-2xl">
                    +
                  </div>
                  <p class="text-gray-500 text-sm">
                    拖拽图片到此处，或{' '}
                    <span
                      class="text-violet-400 cursor-pointer hover:underline"
                      onClick={() => fileInputRef?.click()}
                    >
                      浏览
                    </span>
                  </p>
                </div>
              </Show>

              <div
                ref={canvasRef}
                class="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${canvasZoom()})`,
                  "transform-origin": "center center"
                }}
                onMouseMove={handleResize}
                onMouseUp={handleCanvasMouseUp}
              >
                <For each={getCurrentPage()?.images || []}>
                  {(img) => (
                    <div
                      class={`canvas-item absolute cursor-move ${selectedItem() === img.id ? 'outline-2 outline-violet-500 outline-offset-2' : ''}`}
                      data-id={img.id}
                      style={{
                        left: `${img.x}px`,
                        top: `${img.y}px`,
                        width: `${img.width * img.scale}px`,
                        height: `${img.height * img.scale}px`
                      }}
                      onMouseDown={(e) => handleItemMouseDown(e, img.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItem(img.id)
                      }}
                    >
                      <img
                        src={img.src}
                        style={{ width: "100%", height: "100%", "object-fit": "contain", "pointer-events": "none" }}
                        draggable={false}
                      />
                      <div
                        class="resize-handle absolute w-3.5 h-3.5 bg-violet-500 rounded-full -right-2 -bottom-2 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
                        classList={{ "opacity-100": selectedItem() === img.id }}
                        onMouseDown={(e) => startResize(e, e.currentTarget.parentElement)}
                      />
                      <button
                        class="delete-btn absolute -top-2.5 -right-2.5 w-6 h-6 bg-violet-500 rounded-full text-white flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-opacity"
                        classList={{ "opacity-100": selectedItem() === img.id }}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteImage(img.id)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              onChange={handleFileSelect}
            />
          </section>
        </div>

        <footer class="glass-card p-3 flex justify-between items-center">
          <button
            class="glass-button !bg-white/10 !border-white/20 !hover:bg-white/20 text-sm"
            onClick={() => fileInputRef?.click()}
          >
            + 添加图片
          </button>
          <p class="text-gray-500 text-sm">
            共 {pageCount()} 页 | {getImageCount()} 张图片
          </p>
        </footer>
      </div>

      <style>{`
        .image-item.dragging {
          opacity: 0.5;
          border: 2px solid rgb(124, 58, 237);
        }
        .image-item.drag-over {
          border: 2px solid rgb(124, 58, 237);
          background: rgba(124, 58, 237, 0.1);
        }
        .drop-zone.drag-active {
          background: rgba(124, 58, 237, 0.1);
        }
        .drop-zone.drag-active .drop-zone-icon {
          border-color: rgb(124, 58, 237);
          background: rgba(124, 58, 237, 0.1);
          transform: scale(1.05);
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </main>
  )
}

export default ImageToPdf
