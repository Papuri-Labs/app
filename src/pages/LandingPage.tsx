import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Church, Users, BookOpen, Bell, Heart, BarChart3, ArrowRight, Star, ChevronRight, Building, Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const features = [
  {
    icon: Users,
    title: "Ministry Management",
    description: "Coordinate ministries, track assignments, and keep every team member aligned with real-time updates.",
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    icon: Bell,
    title: "Announcements & Bulletins",
    description: "Publish service bulletins and church-wide announcements instantly. Everyone stays in the loop.",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
  {
    icon: BookOpen,
    title: "Bible Reading Plans",
    description: "Guide your congregation through structured reading plans, building spiritual disciplines together.",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  {
    icon: Heart,
    title: "Prayer Requests",
    description: "Create a safe space for members to share prayer requests and witness answered prayers as a community.",
    gradient: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15",
  },
  {
    icon: BarChart3,
    title: "Attendance & Giving",
    description: "Track attendance trends and financial contributions with beautiful dashboards for leadership insight.",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/15",
  },
  {
    icon: Users,
    title: "Newcomer Onboarding",
    description: "Welcome guests with a guided onboarding journey that introduces your church's heart and mission.",
    gradient: "from-sky-500/20 to-cyan-500/10",
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/15",
  },
];

const testimonials = [
  {
    quote: "Papuri has transformed how we connect with our congregation. Everything we need is right in one place.",
    name: "Pastor Marco R.",
    role: "Lead Pastor",
    initials: "MR",
    color: "from-blue-500 to-indigo-600",
  },
  {
    quote: "The attendance and prayer features alone have brought our small groups closer together than ever before.",
    name: "Sarah L.",
    role: "Ministry Leader",
    initials: "SL",
    color: "from-amber-500 to-orange-600",
  },
  {
    quote: "Managing multiple ministries used to be chaos. Now it's effortless. I wouldn't go back.",
    name: "David M.",
    role: "Church Administrator",
    initials: "DM",
    color: "from-emerald-500 to-teal-600",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const slug = orgSlug || "my-church";
  
  const [searchQuery, setSearchQuery] = useState("");
  const organizations = useQuery(api.organizations.listPublic) || [];
  const isMultiTenant = import.meta.env.VITE_IS_MULTI_TENANT !== "N";

  const filteredOrgs = organizations
    .filter((org) => 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 backdrop-blur-xl bg-[#0a0f1e]/70 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#d97706] flex items-center justify-center shadow-lg">
            <Church className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Pa</span>
            <span className="text-amber-400">puri</span>
          </span>
        </div>
        {/* Auth Buttons removed per user request */}
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24 pb-20 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px]" />
        </div>

        {/* Animated particle dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-widest uppercase mb-8">
            <Star className="h-3 w-3 fill-current" />
            Church Management Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Connect. Grow.{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Flourish.
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0" />
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/55 max-w-2xl leading-relaxed mb-10">
            Papuri is the all-in-one church management platform that empowers
            congregations to coordinate ministries, engage members, and grow
            together — all in real time.
          </p>

          {/* CTAs removed per user request */}

          {/* Quick Find Church Selector or Login CTAs */}
          {isMultiTenant ? (
            <div className="relative z-20 mt-12 w-full max-w-2xl bg-[#0a0f1e]/40 p-6 sm:p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
              <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-6 flex items-center justify-center gap-2">
                <Building className="h-3 w-3" />
                Discover Your Community
              </p>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search for your church..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                />
              </div>

              {organizations.length === 0 ? (
                  <div className="text-white/30 text-sm animate-pulse text-center">Loading churches...</div>
              ) : filteredOrgs.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-4">No churches found.</div>
              ) : (
                  <div className="flex flex-col gap-3">
                    {filteredOrgs.map((org) => (
                      <button
                        key={org._id}
                        onClick={() => navigate(`/${org.slug}/login`)}
                        className={`flex items-center gap-4 px-5 py-4 w-full rounded-2xl transition-all ${
                          slug === org.slug 
                            ? "bg-blue-500/10 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50" 
                            : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                          slug === org.slug 
                            ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                            : "bg-gradient-to-br from-white/10 to-white/5"
                        }`}>
                          <Church className={`h-5 w-5 ${slug === org.slug ? "text-white" : "text-white/50"}`} />
                        </div>
                        <span className={`text-base font-semibold tracking-wide truncate ${
                          slug === org.slug ? "text-white" : "text-white/70"
                        }`}>
                          {org.name}
                        </span>
                        <ChevronRight className="h-5 w-5 ml-auto text-white/20 shrink-0" />
                      </button>
                    ))}
                    {organizations.length > 5 && searchQuery === "" && (
                      <p className="text-xs text-center text-white/30 mt-2">
                        Use the search bar to find more communities.
                      </p>
                    )}
                  </div>
              )}
            </div>
          ) : (
            <div className="relative z-20 mt-12 flex items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold tracking-wide shadow-lg shadow-blue-500/20 hover:-translate-y-1 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-wide hover:bg-white/10 hover:-translate-y-1 transition-all"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Hero Image */}
          <div className="relative mt-16 w-full max-w-3xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-transparent via-transparent to-[#0a0f1e] z-10 pointer-events-none" />
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/30">
              <img
                src="/papuri-hero.png"
                alt="Papuri Church Community Platform"
                className="w-full object-cover"
              />
            </div>
            {/* Floating stat cards */}
            <div className="absolute -top-4 -left-6 z-20 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-white/10 shadow-xl">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium">Active Members</p>
                <p className="text-sm font-bold text-white">2,480+</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-6 z-20 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111827]/90 backdrop-blur-xl border border-white/10 shadow-xl">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium">Prayer Requests</p>
                <p className="text-sm font-bold text-white">12,300+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Built for the modern{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                church community
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Powerful tools designed to help your congregation connect, collaborate, and grow in faith together.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl bg-gradient-to-br ${f.gradient} border border-white/8 p-6 transition-all duration-300 hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 backdrop-blur-sm`}
              >
                <div className={`h-10 w-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">Community Voices</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Loved by church{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                communities
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/4 border border-white/8 p-6 backdrop-blur-sm hover:border-white/15 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex mb-4 gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="relative px-6 py-20 sm:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600/30 via-blue-700/20 to-indigo-600/30 border border-blue-500/20 p-10 sm:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/15 blur-[60px]" />
            </div>
            <div className="relative">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-amber-500 mb-6 shadow-2xl shadow-blue-500/30 mx-auto">
                <Church className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ready to transform your church?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of churches already using Papuri to connect their congregations and accelerate ministry impact.
              </p>
              {/* CTAs removed per user request */}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 sm:px-12 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-amber-500 flex items-center justify-center">
              <Church className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">
              <span className="text-white">Pa</span>
              <span className="text-amber-400">puri</span>
            </span>
          </div>
          <p className="text-white/25 text-xs text-center">
            © {new Date().getFullYear()} Papuri · Church Management Platform · Built with ♥ for communities of faith
          </p>
          {/* Footer links removed per user request */}
        </div>
      </footer>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
