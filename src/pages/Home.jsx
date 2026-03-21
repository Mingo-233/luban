function Home(props) {
  return (
    <main class="max-w-5xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {props.tools.map(tool => (
          <button
            class="tool-card soft-fade-in"
            onClick={() => props.navigate(tool.path)}
          >
            <h2 class="text-xl font-semibold mb-2" style="color: var(--color-text);">{tool.name}</h2>
            <p class="text-sm" style="color: var(--color-text-light);">{tool.desc}</p>
          </button>
        ))}
      </div>
    </main>
  )
}

export default Home
