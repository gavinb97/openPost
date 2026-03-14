import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neon-pink/[0.06] blur-[100px] animate-orb-2" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-neon-cyan/[0.04] blur-[80px] animate-float" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-neon-pink to-neon-cyan flex items-center justify-center text-white font-display font-bold text-xs shadow-lg shadow-primary/30">
            OP
          </div>
          <span className="text-xl font-display font-bold gradient-text-subtle">
            OnlyPosts
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm bg-gradient-to-r from-primary to-neon-pink text-white px-5 py-2 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-24 pb-32 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          AI-Powered Social Media Automation
        </div>
        <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight leading-[1.1]">
          Your social media,{' '}
          <span className="gradient-text">
            on autopilot
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed">
          Deploy AI agents that post, reply, DM, and engage across Twitter, Reddit, YouTube, and TikTok.
          Set the personality, define the strategy — let AI handle the rest.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/register"
            className="relative bg-gradient-to-r from-primary via-neon-pink to-primary bg-[length:200%_100%] animate-gradient-shift text-white px-8 py-3.5 rounded-xl text-lg font-display font-medium shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free →
          </Link>
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground px-6 py-3.5 text-lg transition-all border border-white/[0.06] rounded-xl hover:bg-white/[0.04] backdrop-blur-sm"
          >
            Learn More
          </Link>
        </div>

        {/* Visual element: floating platform icons */}
        <div className="relative mt-20 flex justify-center gap-8 opacity-60">
          {['𝕏', '🔴', '▶️', '♪'].map((icon, i) => (
            <div
              key={i}
              className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm flex items-center justify-center text-2xl animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              {icon}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-primary tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-4xl font-display font-bold">Everything your social media needs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '⬡',
                title: 'AI Agents',
                desc: 'Create intelligent agents with custom personalities. They write posts, craft replies, and engage authentically.',
                color: 'from-primary/20 to-neon-pink/20',
                iconColor: 'text-primary text-glow',
              },
              {
                icon: '◎',
                title: 'Multi-Platform',
                desc: 'Twitter, Reddit, YouTube, TikTok — manage all platforms from one dashboard with platform-specific optimization.',
                color: 'from-neon-cyan/20 to-primary/20',
                iconColor: 'text-neon-cyan text-glow-cyan',
              },
              {
                icon: '◇',
                title: 'Smart Guardrails',
                desc: 'AI safety checks ensure content stays on-brand. Choose auto-post, manual review, or guardrail-protected modes.',
                color: 'from-neon-green/20 to-neon-cyan/20',
                iconColor: 'text-neon-green',
              },
              {
                icon: '△',
                title: 'Analytics',
                desc: 'Track agent performance, view activity timelines, and see which agents drive the most engagement.',
                color: 'from-neon-orange/20 to-neon-pink/20',
                iconColor: 'text-neon-orange',
              },
              {
                icon: '◈',
                title: 'Conversation Memory',
                desc: 'Agents remember past interactions for coherent, contextual conversations across DMs and replies.',
                color: 'from-neon-pink/20 to-primary/20',
                iconColor: 'text-neon-pink text-glow-pink',
              },
              {
                icon: '⟡',
                title: 'Smart Scheduling',
                desc: 'Random intervals that mimic human behavior. No robotic posting patterns that get flagged.',
                color: 'from-primary/20 to-neon-cyan/20',
                iconColor: 'text-primary text-glow',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-7 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 gradient-border-animated"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5`}>
                  <span className={`text-xl ${f.iconColor}`}>{f.icon}</span>
                </div>
                <h3 className="text-base font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto text-center">
        <p className="text-sm font-medium text-primary tracking-widest uppercase mb-3">Integrations</p>
        <h2 className="text-4xl font-display font-bold mb-12">Supported Platforms</h2>
        <div className="flex justify-center gap-5 flex-wrap">
          {[
            { icon: '𝕏', name: 'Twitter', status: 'Live', gradient: 'from-white/10 to-white/5' },
            { icon: '🔴', name: 'Reddit', status: 'Live', gradient: 'from-orange-500/15 to-orange-600/5' },
            { icon: '▶️', name: 'YouTube', status: 'Live', gradient: 'from-red-500/15 to-red-600/5' },
            { icon: '♪', name: 'TikTok', status: 'Live', gradient: 'from-pink-500/15 to-cyan-500/5' },
            { icon: 'f', name: 'Facebook', status: 'Soon', gradient: 'from-blue-500/10 to-blue-600/5' },
            { icon: '📷', name: 'Instagram', status: 'Soon', gradient: 'from-purple-500/10 to-pink-500/5' },
          ].map((p) => (
            <div
              key={p.name}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.06] bg-gradient-to-b ${p.gradient} backdrop-blur-sm w-32 hover:border-white/[0.12] hover:scale-105 transition-all duration-300`}
            >
              <span className="text-3xl">{p.icon}</span>
              <span className="text-sm font-display font-medium">{p.name}</span>
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                p.status === 'Live'
                  ? 'bg-neon-green/15 text-neon-green border border-neon-green/20'
                  : 'bg-white/[0.06] text-muted-foreground border border-white/[0.08]'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 via-neon-pink/5 to-neon-cyan/10 blur-3xl" />
          <div className="relative rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-16">
            <h2 className="text-4xl font-display font-bold gradient-text mb-4">Ready to automate?</h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Join and let AI agents grow your social media presence while you focus on what matters.
            </p>
            <Link
              href="/register"
              className="inline-block bg-gradient-to-r from-primary to-neon-pink text-white px-10 py-4 rounded-xl text-lg font-display font-medium hover:brightness-110 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] mt-8"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 OnlyPosts. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
