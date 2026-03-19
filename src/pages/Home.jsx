function Home(props) {
  return (
    <main class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.tools.map(tool => (
          <button
            class="glass-card p-6 text-left cursor-pointer fade-in hover:scale-105 transition-transform"
            onClick={() => props.navigate(tool.path)}
          >
            <h2 class="text-xl font-semibold text-white mb-2">{tool.name}</h2>
            <p class="text-white/80 text-sm">{tool.desc}</p>
          </button>
        ))}
      </div>
    </main>
  )
}

export default Home
