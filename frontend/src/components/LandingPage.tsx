import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  Users,
  Utensils,
} from 'lucide-react';
import type { ThemeMode } from '../theme';

interface LandingPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenApp: () => void;
}

const benefits = [
  {
    icon: Search,
    title: 'Discover with context',
    text: 'Search by cuisine, neighborhood, occasion, price, or the atmosphere you have in mind.',
  },
  {
    icon: CalendarCheck,
    title: 'Book in one conversation',
    text: 'Check real availability, reserve a table, and receive an instant confirmation without leaving chat.',
  },
  {
    icon: Users,
    title: 'Manage every reservation',
    text: 'Review, modify, and cancel your bookings from one private account.',
  },
];

const activity = [
  ['Search understood', 'Italian · Downtown'],
  ['Availability checked', '8 venues · 24 slots'],
  ['Reservation ready', 'Tonight · 7:30 PM'],
];

export function LandingPage({ theme, onToggleTheme, onOpenApp }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-neo-canvas text-neo-main">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-[#0d0f12]/95">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Primary">
          <button onClick={onOpenApp} className="flex items-center gap-2.5" aria-label="Open GoodFoods concierge">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-sm text-white dark:bg-white dark:text-neutral-950">
              <Utensils className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">GoodFoods</span>
          </button>

          <div className="hidden items-center gap-7 text-sm text-neutral-600 md:flex dark:text-neutral-300">
            <a href="#product" className="transition hover:text-neutral-950 dark:hover:text-white">Product</a>
            <a href="#workflow" className="transition hover:text-neutral-950 dark:hover:text-white">How it works</a>
            <a href="#security" className="transition hover:text-neutral-950 dark:hover:text-white">Privacy</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={onOpenApp} className="saas-button-primary">
              Open concierge <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(91,91,214,0.11),transparent_38%)] dark:bg-[radial-gradient(circle_at_70%_20%,rgba(139,139,255,0.16),transparent_38%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
            <div className="max-w-2xl animate-fade-up">
              <div className="mb-7 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                AI dining concierge for 72 restaurants
              </div>
              <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-neutral-950 sm:text-6xl dark:text-white">
                Your next table,
                <span className="block text-neutral-400 dark:text-neutral-500">handled end to end.</span>
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-neutral-600 dark:text-neutral-300">
                Tell GoodFoods what you want. It finds the right restaurant, checks live availability, books the table, and keeps every reservation organized.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={onOpenApp} className="saas-button-primary px-5 py-3">
                  Find a table <ArrowRight className="h-4 w-4" />
                </button>
                <a href="#product" className="saas-button-secondary px-5 py-3">See how it works</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400">
                {['Live availability', 'Instant confirmation', 'Private account'].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl animate-fade-up [animation-delay:120ms]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,.10)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[0_24px_80px_rgba(0,0,0,.35)]">
                <div className="flex items-center justify-between border-b border-neutral-100 px-3 pb-3 dark:border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold">Concierge online</span>
                  </div>
                  <span className="text-xs text-neutral-400">Live availability</span>
                </div>
                <div className="space-y-4 px-3 py-5">
                  <div className="ml-auto max-w-[82%] rounded-xl bg-neutral-950 px-4 py-3 text-sm leading-6 text-white dark:bg-white dark:text-neutral-950">
                    Find a quiet Italian restaurant downtown for two tonight around 7:30.
                  </div>
                  <div className="max-w-[88%] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    I found 8 options. Bella Notte has a table at 7:30 PM and matches the quiet, intimate atmosphere you asked for.
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Recommended</span>
                        <h3 className="mt-1 font-semibold">Bella Notte · Downtown</h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Italian · Intimate · 4.8</p>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Available</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                      {['7:00 PM', '7:30 PM', '8:00 PM'].map((time, index) => (
                        <span key={time} className={`rounded-lg border px-2 py-2 text-center font-medium ${index === 1 ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950' : 'border-neutral-200 dark:border-neutral-700'}`}>{time}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg sm:block dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><Clock3 className="h-4 w-4" /></span>
                  <div><p className="text-xs text-neutral-500">Booked in</p><p className="text-sm font-semibold">under 60 seconds</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="saas-kicker">One concierge, every step</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Dining plans without the tabs, calls, or back-and-forth.</h2>
            <p className="mt-4 text-base leading-7 text-neutral-600 dark:text-neutral-300">A focused workflow for discovering, booking, and managing restaurants.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="saas-panel p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"><Icon className="h-5 w-5" /></span>
                  <span className="font-mono text-xs text-neutral-400">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="saas-kicker">Built for completion</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">The agent does more than recommend.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-neutral-600 dark:text-neutral-300">Every conversation can execute real availability checks and reservation actions—not send you to another site.</p>
              <button onClick={onOpenApp} className="saas-button-secondary mt-8">Try the concierge <ArrowRight className="h-4 w-4" /></button>
            </div>
            <div className="saas-panel divide-y divide-neutral-200 overflow-hidden dark:divide-neutral-700">
              {activity.map(([title, value], index) => (
                <div key={title} className="flex items-center gap-4 p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium">{title}</p><p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">{value}</p></div>
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="saas-kicker">Made for real plans</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">From “somewhere nice” to a confirmed table.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">The concierge understands the context around dinner—not just a cuisine filter.</p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <article className="group relative overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 p-7 lg:col-span-7 dark:border-violet-900 dark:bg-violet-950/40">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-violet-300/30 blur-3xl transition duration-700 group-hover:scale-125 dark:bg-violet-600/20" />
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Date night</p>
              <h3 className="relative mt-12 max-w-md text-2xl font-semibold tracking-tight">Quiet, intimate, and actually available tonight.</h3>
              <p className="relative mt-4 max-w-lg text-sm leading-6 text-violet-900/70 dark:text-violet-200/70">Describe the mood and timing. GoodFoods weighs atmosphere, ratings, location, and live capacity together.</p>
              <div className="relative mt-8 inline-flex rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-violet-900 shadow-sm dark:bg-violet-950 dark:text-violet-100">Romantic · Italian · 7:30 PM</div>
            </article>
            <article className="group relative overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50 p-7 lg:col-span-5 dark:border-cyan-900 dark:bg-cyan-950/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Group dinner</p>
              <h3 className="mt-12 text-2xl font-semibold tracking-tight">A table that fits everyone.</h3>
              <p className="mt-4 text-sm leading-6 text-cyan-900/70 dark:text-cyan-200/70">Capacity-aware recommendations prevent dead ends for larger parties.</p>
              <div className="mt-8 flex -space-x-2">
                {[1, 2, 3, 4, 5].map((item) => <span key={item} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cyan-50 bg-cyan-600 text-xs font-semibold text-white dark:border-cyan-950">{item}</span>)}
                <span className="flex h-9 items-center rounded-full border-2 border-cyan-50 bg-white px-3 text-xs font-semibold text-cyan-700 dark:border-cyan-950 dark:bg-cyan-950 dark:text-cyan-300">+3</span>
              </div>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-7 lg:col-span-5 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Last-minute change</p>
              <h3 className="mt-10 text-xl font-semibold">Move dinner without starting over.</h3>
              <p className="mt-3 text-sm leading-6 text-amber-900/70 dark:text-amber-200/70">Change time, date, party size, or notes from the same conversation.</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7 lg:col-span-7 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">One private account</p><h3 className="mt-10 text-xl font-semibold">Every booking, easy to find.</h3><p className="mt-3 max-w-md text-sm leading-6 text-emerald-900/70 dark:text-emerald-200/70">Upcoming plans and confirmations stay organized and isolated to you.</p></div>
                <div className="rounded-xl border border-emerald-200 bg-white/80 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950"><p className="text-xs text-emerald-700 dark:text-emerald-300">Next reservation</p><p className="mt-1 font-semibold">Friday · 7:30 PM</p></div>
              </div>
            </article>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 lg:px-8">
            {[['72', 'restaurant locations'], ['15', 'cuisine categories'], ['12', 'metro districts'], ['< 60s', 'typical booking flow']].map(([value, label]) => (
              <div key={label}><p className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{value}</p><p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{label}</p></div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-violet-50 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center dark:border-neutral-700 dark:from-neutral-900 dark:to-violet-950/30">
            <blockquote className="max-w-3xl text-2xl font-medium leading-10 tracking-[-0.02em] sm:text-3xl">“Instead of opening five tabs, I described the evening once and had a confirmed table a minute later.”</blockquote>
            <div className="lg:text-right"><p className="text-sm font-semibold">A better way to book dinner</p><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Discovery through confirmation</p></div>
          </div>
        </section>
        <section id="security" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="rounded-2xl bg-neutral-950 px-6 py-12 text-white sm:px-12 dark:bg-white dark:text-neutral-950">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl">
                <ShieldCheck className="h-8 w-8 text-emerald-400 dark:text-emerald-600" />
                <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em]">Your bookings stay yours.</h2>
                <p className="mt-4 leading-7 text-neutral-300 dark:text-neutral-600">Authenticated accounts isolate reservation history and protect every modification or cancellation with ownership checks.</p>
              </div>
              <button onClick={onOpenApp} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800">
                Start planning <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>GoodFoods AI Concierge</span>
          <span>Discover · Book · Manage</span>
        </div>
      </footer>
    </div>
  );
}
