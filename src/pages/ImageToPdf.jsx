import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js'
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
  const [fileInputRef, setFileInputRef] = createSignal(null)

  let canvasRef
  let canvasContainerRef

  const getCurrentPage = () => {
    const p = pages()[currentPageIndex()];
    console.log('getCurrentPage, pages:', pages().length, 'index:', currentPageIndex(), 'page:', p);
    return p;
  }

  onMount(() => {
    addPage()

    // 全局鼠标事件监听，解决拖动时鼠标超出画布区域失效的问题
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleCanvasMouseUp)
  })

  onCleanup(() => {
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleCanvasMouseUp)
  })

  const addPage = () => {
    const newPage = {
      id: pageIdCounter(),
      images: []
    }
    setPageIdCounter(c => c + 1)
    setPages(p => [...p, newPage])
    setCurrentPageIndex(pages().length - 1)
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
    console.log('handleFileSelect called, files:', e.target.files);
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      await addImagesToCurrentPage(files)
    }
    e.target.value = ''
  }

  const addImagesToCurrentPage = async (files) => {
    const page = getCurrentPage()
    console.log('addImagesToCurrentPage, page:', page, 'files:', files.length);
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

    console.log('Before setPages, pages():', pages().length, 'currentPageIndex:', currentPageIndex());

    if (existingCount === 0 && page.images.length > 0) {
      positionImages(page)
    } else if (existingCount > 0) {
      positionNewImages(page, existingCount)
    }

    setPages([...pages()])
    setCurrentPageIndex(currentPageIndex())
    console.log('After setPages, pages():', pages().length, 'currentPageIndex:', currentPageIndex());
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

  let rafId = null

  const handleGlobalMouseMove = (e) => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      // 处理图片拖动
      if (isDragging() && selectedItem()) {
        const pageIndex = currentPageIndex()
        const page = pages()[pageIndex]
        const img = page?.images.find(i => i.id === selectedItem())
        if (img) {
          img.x = dragOffset().imgX + (e.clientX - dragOffset().mouseX)
          img.y = dragOffset().imgY + (e.clientY - dragOffset().mouseY)
          // 直接触发当前页更新，不触发所有页
          setPages([...pages()])
        }
      }

      // 处理缩放
      if (isResizing() && selectedItem()) {
        const pageIndex = currentPageIndex()
        const page = pages()[pageIndex]
        const img = page?.images.find(i => i.id === selectedItem())
        if (!img) return

        const deltaX = (e.clientX - resizeStart().x) / canvasZoom()
        const deltaY = (e.clientY - resizeStart().y) / canvasZoom()
        const avgDelta = (deltaX + deltaY) / 2

        const newScale = Math.max(0.1, resizeStart().scale + avgDelta / 200)
        img.scale = newScale

        setPages([...pages()])
      }
    })
  }

  const handleCanvasMouseUp = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
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
      width: img.width,
      height: img.height,
      scale: img.scale
    })

    setSelectedItem(id)
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
        class="soft-button mb-6"
        onClick={() => props.navigate('/')}
      >
        返回首页
      </button>

      <div class="flex flex-col h-[calc(100vh-200px)] gap-4">
        <header class="soft-card p-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold" style="color: var(--color-text);">图片拼接 PDF</h2>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1 rounded-xl p-1" style="background: var(--color-soft-bg); box-shadow: inset 3px 3px 6px var(--color-soft-dark), inset -3px -3px 6px var(--color-soft-light);">
              <For each={pages()}>
                {(page, index) => (
                  <div
                    class={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-all`}
                    style={{
                      background: currentPageIndex() === index() ? 'linear-gradient(145deg, #8b5cf6, #7c3aed)' : 'transparent',
                      color: currentPageIndex() === index() ? 'white' : 'var(--color-text-light)',
                      'box-shadow': currentPageIndex() === index() ? '2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light)' : 'none'
                    }}
                    onClick={() => switchToPage(index())}
                  >
                    <span class="text-sm">第{index() + 1}页</span>
                    <Show when={pages().length > 1}>
                      <button
                        class="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                        style={{
                          background: currentPageIndex() === index() ? 'rgba(255,255,255,0.3)' : 'var(--color-soft-bg)',
                          color: currentPageIndex() === index() ? 'white' : 'var(--color-text-light)'
                        }}
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
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'linear-gradient(145deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  'box-shadow': '2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light)'
                }}
                onClick={addPage}
                title="添加页面"
              >
                +
              </button>
            </div>
            <button
              class="soft-button text-sm"
              style={getImageCount() === 0 ? { opacity: 0.5 } : {}}
              onClick={clearCurrentPage}
              disabled={getImageCount() === 0}
            >
              清空
            </button>
            <button
              class="soft-button-primary text-sm"
              onClick={downloadPDF}
              disabled={isDownloading() || pages().every(p => p.images.length === 0)}
            >
              {isDownloading() ? '生成中...' : '下载 PDF'}
            </button>
          </div>
        </header>

        <div class="flex flex-1 gap-4 min-h-0">
          <aside class="w-64 soft-card p-4 flex flex-col">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm font-medium" style="color: var(--color-text-light);">当前页图片</h3>
              <span class="text-xs px-2 py-0.5 rounded-full" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed); color: white;">
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
                    class="image-item flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all"
                    style="box-shadow: 2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light);"
                    draggable={true}
                    data-id={img.id}
                    onDragStart={handleListDragStart}
                    onDragEnd={handleListDragEnd}
                    onDragOver={handleListDragOver}
                    onDrop={handleListDrop}
                  >
                    <span style="color: var(--color-text-light); cursor: grab;">⋮⋮</span>
                    <img src={img.src} alt={img.name} class="w-10 h-10 object-cover rounded" style="box-shadow: 1px 1px 2px var(--color-soft-dark), -1px -1px 2px var(--color-soft-light);" />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm truncate" style="color: var(--color-text);">{img.name}</div>
                      <div class="text-xs" style="color: var(--color-text-light);">第 {index() + 1} 张</div>
                    </div>
                    <button
                      class="w-6 h-6 rounded flex items-center justify-center transition-all"
                      style="background: var(--color-soft-bg); box-shadow: 2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light); color: var(--color-text-light);"
                      onClick={() => deleteImage(img.id)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </For>
            </div>
          </aside>

          <section class="flex-1 soft-card p-4 flex flex-col min-h-0">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm font-medium" style="color: var(--color-text-light);">画布预览</h3>
              <div class="flex items-center gap-2">
                <button
                  class="w-7 h-7 rounded flex items-center justify-center transition-all"
                  style="background: var(--color-soft-bg); box-shadow: 2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light); color: var(--color-text);"
                  onClick={() => setCanvasZoom(z => Math.max(0.2, z - 0.1))}
                >
                  −
                </button>
                <span class="text-xs w-12 text-center" style="color: var(--color-text-light);">
                  {Math.round(canvasZoom() * 100)}%
                </span>
                <button
                  class="w-7 h-7 rounded flex items-center justify-center transition-all"
                  style="background: var(--color-soft-bg); box-shadow: 2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light); color: var(--color-text);"
                  onClick={() => setCanvasZoom(z => Math.min(2, z + 0.1))}
                >
                  +
                </button>
                <button
                  class="w-7 h-7 rounded flex items-center justify-center transition-all"
                  style="background: var(--color-soft-bg); box-shadow: 2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light); color: var(--color-text);"
                  onClick={() => setCanvasZoom(1)}
                  title="重置缩放"
                >
                  ↺
                </button>
              </div>
            </div>
            <div
              ref={canvasContainerRef}
              class="flex-1 rounded-xl overflow-hidden relative"
              style={{
                background: `linear-gradient(45deg, rgba(200,204,212,0.3) 25%, transparent 25%),
                             linear-gradient(-45deg, rgba(200,204,212,0.3) 25%, transparent 25%),
                             linear-gradient(45deg, transparent 75%, rgba(200,204,212,0.3) 75%),
                             linear-gradient(-45deg, transparent 75%, rgba(200,204,212,0.3) 75%)`,
                "background-size": "16px 16px",
                "background-position": "0 0, 0 8px, 8px -8px, -8px 0px",
                "background-color": "var(--color-soft-bg)",
                "box-shadow": "inset 4px 4px 8px var(--color-soft-dark), inset -4px -4px 8px var(--color-soft-light)"
              }}
              onClick={handleCanvasClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onWheel={handleCanvasWheel}
            >
              <Show when={getImageCount() === 0}>
                <div class="drop-zone absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div class="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl"
                    style="border-color: var(--color-text-light); color: var(--color-text-light);">
                    +
                  </div>
                  <p class="text-sm" style="color: var(--color-text-light);">
                    拖拽图片到此处，或{' '}
                    <span
                      class="cursor-pointer"
                      style="color: var(--color-accent);"
                      onClick={() => fileInputRef()?.click()}
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
              >
                <For each={getCurrentPage()?.images || []}>
                  {(img) => (
                    <div
                      class={`canvas-item absolute cursor-move`}
                      data-id={img.id}
                      style={{
                        '--img-x': `${img.x}px`,
                        '--img-y': `${img.y}px`,
                        width: `${img.width * img.scale}px`,
                        height: `${img.height * img.scale}px`,
                        outline: selectedItem() === img.id ? '2px solid var(--color-accent)' : 'none',
                        "outline-offset": "2px"
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
                        class="resize-handle absolute w-3.5 h-3.5 rounded-full cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
                        classList={{ "opacity-100": selectedItem() === img.id }}
                        style={{
                          background: 'linear-gradient(145deg, #8b5cf6, #7c3aed)',
                          right: '-8px',
                          bottom: '-8px',
                          "box-shadow": '2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light)'
                        }}
                        onMouseDown={(e) => startResize(e, e.currentTarget.parentElement)}
                      />
                      <button
                        class="delete-btn absolute rounded-full text-white flex items-center justify-center text-sm opacity-0 hover:opacity-100 transition-opacity"
                        classList={{ "opacity-100": selectedItem() === img.id }}
                        style={{
                          background: 'linear-gradient(145deg, #e53e3e, #c53030)',
                          width: '24px',
                          height: '24px',
                          top: '-10px',
                          right: '-10px',
                          "box-shadow": '2px 2px 4px var(--color-soft-dark), -2px -2px 4px var(--color-soft-light)'
                        }}
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
              ref={(el) => {
                console.log('File input ref set:', el);
                setFileInputRef(el)
              }}
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              onChange={handleFileSelect}
            />
          </section>
        </div>

        <footer class="soft-card p-3 flex justify-between items-center">
          <button
            class="soft-button text-sm"
            onClick={() => {
              console.log('Button clicked, fileInputRef:', fileInputRef());
              fileInputRef()?.click()
            }}
          >
            + 添加图片
          </button>
          <p class="text-sm" style="color: var(--color-text-light);">
            共 {pageCount()} 页 | {getImageCount()} 张图片
          </p>
        </footer>
      </div>

      <style>{`
        .image-item.dragging {
          opacity: 0.5;
        }
        .image-item.drag-over {
          background: rgba(124, 58, 237, 0.1);
        }
        .drop-zone.drag-active {
          background: rgba(124, 58, 237, 0.1);
        }
        .canvas-item {
          transform: translate(var(--img-x, 0), var(--img-y, 0));
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-soft-dark);
          border-radius: 2px;
        }
      `}</style>
    </main>
  )
}

export default ImageToPdf
