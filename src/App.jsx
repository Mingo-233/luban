import { lazy, Suspense, createSignal, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import './index.css'

const Home = lazy(() => import('./pages/Home'))
const ImageToWebp = lazy(() => import('./pages/ImageToWebp'))
const SvgToPng = lazy(() => import('./pages/SvgToPng'))
const ImageCrop = lazy(() => import('./pages/ImageCrop'))

const tools = [
  { id: 'image-to-webp', path: '/image-to-webp', name: '图片转 WebP', desc: '将图片转换为 WebP 格式', component: ImageToWebp },
  { id: 'svg-to-png', path: '/svg-to-png', name: 'SVG 转 PNG', desc: '将 SVG 转换为 PNG 格式', component: SvgToPng },
  { id: 'image-crop', path: '/image-crop', name: '图片裁剪', desc: '裁剪图片的任意区域', component: ImageCrop },
]

function Loading() {
  return (
    <div class="flex items-center justify-center min-h-[50vh]">
      <div class="spinner"></div>
    </div>
  )
}

function App() {
  const [currentPath, setCurrentPath] = createSignal(window.location.pathname)

  window.addEventListener('popstate', () => {
    setCurrentPath(window.location.pathname)
  })

  const navigate = (path) => {
    window.history.pushState(null, '', path)
    setCurrentPath(path)
  }

  const getCurrentTool = () => {
    return tools.find(t => t.path === currentPath())
  }

  const CurrentPage = () => {
    const tool = getCurrentTool()
    return tool ? tool.component : Home
  }

  const pageProps = { navigate, tools }

  return (
    <div class="min-h-screen p-6 md:p-10">
      <header class="mb-10">
        <h1 class="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
          工具集合
        </h1>
      </header>

      <Suspense fallback={<Loading />}>
        <Show when={getCurrentTool()} fallback={<Home {...pageProps} />}>
          <Dynamic component={CurrentPage()} {...pageProps} />
        </Show>
      </Suspense>
    </div>
  )
}

export default App
