import { Link } from "wouter";
import { BrainCircuit, Zap, Trophy, Users, BarChart2, BookOpen, MessageSquare, Swords, Globe, Star, ChevronRight, CheckCircle2, Flame, Map, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/AuthProvider";
import { Redirect } from "wouter";
import { useState, useEffect } from "react";

const HERO_GIFS = ["/assets/hero.gif", "/assets/hero2.gif", "/assets/hero3.gif"];

const LANGUAGES = ["English", "हिन्दी", "বাংলা", "தமிழ்", "తెలుగు", "मराठी", "ਪੰਜਾਬੀ", "ગુજરાતી"];

const FEATURES = [
  { icon: MessageSquare, img: "/assets/machine.webp", title: "AI Tutor — Any Language", desc: "Get step-by-step explanations in English, Hindi, Bengali, Tamil, Telugu, Marathi, Punjabi, Gujarati & more. Switch languages on the fly!", color: "text-primary", border: "border-primary/30", bg: "bg-primary/5" },
  { icon: BookOpen, img: "/assets/books.png", title: "Adaptive Practice", desc: "Questions adapt to your level with Easy → Medium → Hard progression. AI generates personalized problems just for you.", color: "text-sky-500", border: "border-sky-500/30", bg: "bg-sky-500/5" },
  { icon: Map, img: "/assets/tree.png", title: "Knowledge Map", desc: "Visualize your learning journey with an interactive skill tree. Unlock topics as you master prerequisites.", color: "text-emerald-500", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
  { icon: Swords, img: "/assets/game.png", title: "Math Battles", desc: "Challenge friends to real-time multiplayer math duels. First to solve wins XP!", color: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-500/5" },
  { icon: Trophy, img: "/assets/badge.png", title: "Gamification", desc: "Earn XP, unlock badges, maintain streaks, and climb the global leaderboard.", color: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-500/5" },
  { icon: BarChart2, img: "/assets/growth.png", title: "Smart Analytics", desc: "Track accuracy, identify weak topics, and monitor your learning progress over time.", color: "text-violet-500", border: "border-violet-500/30", bg: "bg-violet-500/5" },
  { icon: GraduationCap, img: "/assets/course-banner.gif", title: "Course Marketplace", desc: "Compare courses from Khan Academy, Coursera, Vedantu & more — with AI-powered syllabus matching.", color: "text-indigo-500", border: "border-indigo-500/30", bg: "bg-indigo-500/5" },
  { icon: Users, img: "/assets/start-up.png", title: "Friends & Social", desc: "Add friends, challenge them to battles, and learn together as a community.", color: "text-teal-500", border: "border-teal-500/30", bg: "bg-teal-500/5" },
];

const PHASES = [
  { num: "01", title: "Adaptive Learning Paths", desc: "Structured sub-topics with concept explanations, real-world examples, and adaptive difficulty (Easy → Medium → Hard)." },
  { num: "02", title: "Course Marketplace", desc: "Compare courses from top platforms by price, duration, ratings & syllabus coverage with AI recommendations." },
  { num: "03", title: "Explainable AI Support", desc: "Every answer includes a 'Why?' section. AI identifies specific misconceptions — not just correct answers." },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthContext();
  const [heroIdx, setHeroIdx] = useState(0);
  const [langIdx, setLangIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_GIFS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLangIdx(i => (i + 1) % LANGUAGES.length), 1200);
    return () => clearInterval(t);
  }, []);

  if (isAuthenticated) return <Redirect to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="AI Tutor Logo" className="w-8 h-8 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center" style={{ display: 'none' }}>
              <BrainCircuit className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-foreground">AI Tutor</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#languages" className="hover:text-foreground transition-colors">Languages</a>
            <a href="#mission" className="hover:text-foreground transition-colors">Mission</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="btn-glow">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(ellipse, hsl(var(--primary) / 0.1) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">EdTech & Skill Innovation</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
                AI Tutor<br />
                <span className="text-2xl sm:text-3xl font-bold text-muted-foreground">in </span>
                <span className="text-2xl sm:text-3xl font-bold gradient-text transition-all">{LANGUAGES[langIdx]}</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-md">
                Personalized step-by-step explanations, adaptive learning paths, multiplayer battles, and smart analytics. Supporting <strong>8 Indian & global languages</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/register">
                  <Button size="lg" className="btn-glow px-8 font-semibold">
                    Start Learning Free <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
              {/* Stats Row */}
              <div className="flex flex-wrap gap-5">
                {[
                  { val: "10K+", label: "Students", icon: "/assets/star.png" },
                  { val: "50K+", label: "Questions", icon: "/assets/book.png" },
                  { val: "8", label: "Languages", icon: "/assets/globe.svg" },
                  { val: "4.9★", label: "Rating", icon: "/assets/badge.png" },
                ].map(({ val, label, icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <img src={icon} alt={label} className="w-6 h-6 object-contain" onError={() => {}} />
                    <div>
                      <div className="text-lg font-bold text-foreground">{val}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero GIF */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
                  <img
                    src={HERO_GIFS[heroIdx]}
                    alt="AI Tutor Learning"
                    className="w-full object-cover transition-opacity duration-500"
                    style={{ maxHeight: 380 }}
                    onError={e => { (e.target as HTMLImageElement).src = "/assets/hero.gif"; }}
                  />
                  {/* Floating badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-card/90 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-lg">
                    <img src="/assets/fire.png" alt="Streak" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-bold text-amber-500">12 Day Streak!</span>
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-card/90 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-lg">
                    <img src="/assets/star.png" alt="XP" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-bold text-primary">+50 XP Earned!</span>
                  </div>
                </div>
                {/* Mascot walk */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16">
                  <img src="/assets/alex_walk.gif" alt="Alex mascot" className="w-full h-full object-contain" onError={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Language Banner */}
      <section id="languages" className="py-8 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <img src="/assets/globe.svg" alt="Globe" className="w-6 h-6" onError={() => {}} />
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-foreground">Multilingual Support:</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {[
                { name: "English", flag: "🇬🇧" },
                { name: "हिन्दी", flag: "🇮🇳" },
                { name: "বাংলা", flag: "🇮🇳" },
                { name: "தமிழ்", flag: "🇮🇳" },
                { name: "తెలుగు", flag: "🇮🇳" },
                { name: "मराठी", flag: "🇮🇳" },
                { name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
                { name: "ગુજરાતી", flag: "🇮🇳" },
              ].map(l => (
                <span key={l.name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs font-medium text-foreground">
                  {l.flag} {l.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-14 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Mission</Badge>
          <h2 className="text-3xl font-bold mb-4">Move Beyond Memorization</h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto mb-10">
            Every student learns differently. We eliminate the "one-size-fits-all" friction by building an <strong>adaptive, explainable, and multilingual</strong> environment that builds student confidence through mastery.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {PHASES.map(p => (
              <div key={p.num} className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 transition-all">
                <div className="text-3xl font-extrabold text-primary/20 mb-2">{p.num}</div>
                <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-sky-500/10 text-sky-500 border-sky-500/20">Features</Badge>
            <h2 className="text-3xl font-bold mb-2">Everything You Need to Excel</h2>
            <p className="text-muted-foreground">Comprehensive tools for personalized, adaptive, and multilingual learning</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <Card key={f.title} className={`card-hover border transition-all hover:-translate-y-0.5 hover:shadow-lg ${f.border} ${f.bg}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden mb-3 bg-muted flex items-center justify-center">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 ${f.color}"/></div>`;
                      }} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Confidence & Misconceptions */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Adaptive AI</Badge>
            <h2 className="text-3xl font-bold mb-2">AI That Understands <em>Why</em> You Struggle</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Not just right or wrong — our AI identifies the <strong>specific misconception</strong> in your thinking and guides you to understanding.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: "🔍", title: "Misconception Finder", desc: "When you get an answer wrong, AI pinpoints exactly what you misunderstood — not just what the right answer is." },
              { emoji: "📊", title: "Confidence Scoring", desc: "After every lesson, rate your confidence. The next session adapts its difficulty based on your 'Learning Friction' score." },
              { emoji: "🌐", title: "Multilingual Bridge", desc: "Learn a complex Physics concept in your mother tongue, then bridge back to English for technical terms — seamlessly." },
            ].map(item => (
              <div key={item.title} className="bg-card rounded-2xl border border-border p-6 text-center hover:border-primary/30 transition-all">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Marketplace Preview */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Course Marketplace</Badge>
              <h2 className="text-3xl font-bold mb-4">Find the Right Course for <em>You</em></h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Compare courses from Khan Academy, Coursera, Vedantu, Unacademy, Physics Wallah & more. Our AI recommends the best match based on your knowledge gaps.
              </p>
              {[
                "Price, duration & student ratings compared side-by-side",
                "AI-powered syllabus coverage matching",
                "Supports JEE, NEET, CBSE & competitive exams",
                "Free & paid courses from verified providers",
              ].map(pt => (
                <div key={pt} className="flex items-center gap-2.5 mb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-foreground">{pt}</span>
                </div>
              ))}
              <Link href="/register">
                <Button className="mt-4 btn-glow">Explore Courses <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
              <img src="/assets/course-banner.gif" alt="Course Marketplace" className="w-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src = "/assets/books.png";
                  (e.target as HTMLImageElement).style.maxHeight = "280px";
                  (e.target as HTMLImageElement).style.objectFit = "contain";
                  (e.target as HTMLImageElement).style.padding = "2rem";
                }} />
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Learning Should Be Fun</h2>
          <p className="text-muted-foreground mb-10">Earn XP, maintain streaks, win battles, and climb the global leaderboard</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { img: "/assets/fire.png", label: "Day Streaks", val: "🔥 Keep Going!" },
              { img: "/assets/star.png", label: "XP System", val: "⭐ Level Up!" },
              { img: "/assets/badge.png", label: "Achievements", val: "🏆 Unlock All!" },
              { img: "/assets/game.png", label: "Math Battles", val: "⚔️ Challenge Friends!" },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-2xl border border-border p-4 text-center hover:border-primary/30 transition-all">
                <img src={item.img} alt={item.label} className="w-14 h-14 mx-auto object-contain mb-3" onError={() => {}} />
                <div className="font-semibold text-sm text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center rounded-2xl p-10 gradient-primary text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src="/assets/alex_walk.gif" alt="" className="absolute right-0 bottom-0 h-32 object-contain" onError={() => {}} />
          </div>
          <h2 className="text-3xl font-bold mb-3 relative">Ready to Master Your Subjects?</h2>
          <p className="opacity-90 mb-6 relative">Join thousands of students learning with AI in their own language. Free to start, no credit card needed.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="font-semibold px-10">
              Create Free Account <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <p className="text-xs opacity-70 mt-4">Available in 8 languages • English, Hindi & 6 regional Indian languages</p>
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/assets/logo.png" alt="AI Tutor" className="w-5 h-5 rounded object-cover" onError={() => {}} />
          <span className="font-semibold">AI Tutor</span>
        </div>
        © 2026 AI Tutor. Built with ❤️ for learners across India and the world.
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/login"><span className="hover:text-foreground cursor-pointer transition-colors">Sign In</span></Link>
          <Link href="/register"><span className="hover:text-foreground cursor-pointer transition-colors">Get Started</span></Link>
        </div>
      </footer>
    </div>
  );
}
