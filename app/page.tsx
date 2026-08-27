import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  FileText,
  FunctionSquare,
  Grid3X3,
  Sigma,
  Sparkles,
} from "lucide-react";

const studios = [
  {
    title: "Integral Studio",
    description: "Symbolic and numerical integration with clear visual interpretation.",
    href: "/laboratory/integral-studio",
    kind: "surface",
  },
  {
    title: "Differential Studio",
    description: "Derivatives, Jacobians, Hessians and differential systems in one workspace.",
    href: "/laboratory/differential-studio",
    kind: "field",
  },
  {
    title: "Probability Studio",
    description: "Explore distributions, inference and probabilistic behaviour visually.",
    href: "/laboratory/probability-studio",
    kind: "distribution",
  },
];

function SurfaceVisual() {
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 13 }).map((_, index) => {
        const y = 22 + index * 5.8;
        const phase = index * 0.42;
        const points = Array.from({ length: 45 })
          .map((__, i) => {
            const x = i * 7.2;
            const center = 160;
            const envelope = Math.exp(-Math.pow((x - center) / 92, 2));
            const wave = Math.sin(i * 0.24 + phase) * 22 * envelope;
            return `${x},${y - wave}`;
          })
          .join(" ");
        return (
          <polyline
            key={index}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={0.12 + index * 0.018}
          />
        );
      })}
    </svg>
  );
}

function FieldVisual() {
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, row) =>
        Array.from({ length: 15 }).map((__, col) => {
          const x = 18 + col * 20;
          const y = 14 + row * 12;
          const angle = Math.atan2(y - 60, x - 160) + Math.PI / 2;
          const dx = Math.cos(angle) * 8;
          const dy = Math.sin(angle) * 8;
          return (
            <line
              key={`${row}-${col}`}
              x1={x - dx / 2}
              y1={y - dy / 2}
              x2={x + dx / 2}
              y2={y + dy / 2}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.24"
            />
          );
        }),
      )}
      <ellipse cx="160" cy="60" rx="88" ry="36" fill="none" stroke="currentColor" opacity="0.12" />
      <ellipse cx="160" cy="60" rx="55" ry="22" fill="none" stroke="currentColor" opacity="0.16" />
    </svg>
  );
}

function DistributionVisual() {
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden="true">
      <path
        d="M12 104 C48 103, 76 96, 100 79 C122 63, 133 26, 160 18 C187 26, 198 63, 220 79 C244 96, 272 103, 308 104"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.38"
      />
      {Array.from({ length: 78 }).map((_, index) => {
        const t = index / 77;
        const x = 18 + t * 284;
        const gaussian = Math.exp(-Math.pow((x - 160) / 58, 2));
        const jitter = ((index * 47) % 19) - 9;
        const y = 105 - gaussian * (60 + jitter * 1.7);
        return <circle key={index} cx={x} cy={y} r="1.35" fill="currentColor" opacity="0.2" />;
      })}
    </svg>
  );
}

function StudioVisual({ kind }: { kind: string }) {
  if (kind === "field") return <FieldVisual />;
  if (kind === "distribution") return <DistributionVisual />;
  return <SurfaceVisual />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#101014] dark:bg-black dark:text-[#f5f5f7]">
      <section className="mx-auto max-w-[1440px] px-6 pb-20 pt-16 sm:px-8 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div className="max-w-[560px]">
            <div className="mb-7 h-[3px] w-14 rounded-full bg-[#1d4ed8]" />
            <h1 className="font-serif text-[clamp(3.8rem,7vw,7.6rem)] font-medium leading-[0.88] tracking-[-0.065em]">
              Mathematics,
              <br />
              made visible.
            </h1>
            <p className="mt-9 max-w-[470px] text-lg leading-8 text-[#5f6068] dark:text-[#a1a1aa] sm:text-xl">
              Solve, explore and understand mathematical results through precise computation, large visualizations and reproducible output.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/laboratory"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#101014] px-6 text-sm font-semibold text-white transition hover:scale-[1.015] dark:bg-white dark:text-black"
              >
                Open Laboratory
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#studios"
                className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-[#202024] transition hover:bg-black/[0.03] dark:border-white/10 dark:bg-[#111] dark:text-white"
              >
                Explore studios
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-[12%] bottom-[-6%] h-24 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-black/[0.08] bg-white shadow-[0_34px_100px_-45px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#0b0b0d]">
              <div className="flex h-12 items-center justify-between border-b border-black/[0.06] px-4 dark:border-white/[0.07]">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6e6e73] dark:text-[#9a9aa0]">
                  <span className="h-2 w-2 rounded-full bg-[#1d4ed8]" />
                  Integral Studio
                </div>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
              </div>

              <div className="grid min-h-[500px] grid-cols-1 md:grid-cols-[180px_1fr]">
                <aside className="border-b border-black/[0.06] bg-[#f7f7f8] p-5 dark:border-white/[0.07] dark:bg-[#0f0f12] md:border-b-0 md:border-r">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#99999f]">Input</div>
                  <div className="mt-3 rounded-xl border border-black/[0.07] bg-white p-4 font-serif text-[21px] shadow-sm dark:border-white/[0.07] dark:bg-[#151518]">
                    ∫₀∞ x²e⁻ˣ dx
                  </div>
                  <div className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#99999f]">Assumptions</div>
                  <div className="mt-2 font-serif text-sm text-[#55555b] dark:text-[#bbbbc2]">x ∈ [0, ∞)</div>
                  <div className="mt-7 text-[9px] font-bold uppercase tracking-[0.2em] text-[#99999f]">Operations</div>
                  <div className="mt-3 space-y-1.5 text-xs font-semibold text-[#5d5d64] dark:text-[#b5b5bc]">
                    {["Solve", "Simplify", "Differentiate", "Integrate", "Series"].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-black/[0.035] dark:hover:bg-white/[0.04]">
                        <span>{item}</span>
                        <span className="text-[#b2b2b7]">›</span>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="grid gap-3 p-3 sm:p-4">
                  <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
                    <div className="min-h-[250px] rounded-2xl border border-black/[0.07] bg-[#fcfcfd] p-4 dark:border-white/[0.08] dark:bg-[#111114]">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[#8b8b91]">
                        <span>3D Surface</span>
                        <span>Isometric</span>
                      </div>
                      <div className="relative mt-2 h-[205px] overflow-hidden rounded-xl bg-[linear-gradient(to_right,rgba(30,64,175,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.055)_1px,transparent_1px)] bg-[size:26px_26px] text-[#1d4ed8]">
                        <SurfaceVisual />
                        <div className="absolute bottom-3 left-3 font-serif text-xs text-[#6f7077]">z = e⁻⁽ˣ²⁺ʸ²⁾ cos(2x)</div>
                      </div>
                    </div>
                    <div className="min-h-[250px] rounded-2xl border border-black/[0.07] bg-[#fcfcfd] p-4 dark:border-white/[0.08] dark:bg-[#111114]">
                      <div className="text-[10px] font-semibold text-[#8b8b91]">2D Plot</div>
                      <svg viewBox="0 0 250 190" className="mt-2 h-[205px] w-full text-[#1d4ed8]" aria-hidden="true">
                        <line x1="12" y1="95" x2="238" y2="95" stroke="currentColor" opacity="0.16" />
                        <line x1="125" y1="12" x2="125" y2="180" stroke="currentColor" opacity="0.16" />
                        <path d="M12 56 C38 30, 56 37, 78 77 C97 112, 110 126, 126 98 C144 64, 157 47, 177 72 C196 96, 207 127, 238 139" fill="none" stroke="currentColor" strokeWidth="2.2" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/[0.07] bg-[#fcfcfd] p-5 dark:border-white/[0.08] dark:bg-[#111114]">
                      <div className="text-[10px] font-semibold text-[#8b8b91]">Symbolic result</div>
                      <div className="mt-5 font-serif text-[25px] tracking-[-0.02em]">∫₀∞ x²e⁻ˣ dx = 2</div>
                      <div className="mt-2 text-xs text-[#77777d]">Γ(3) = 2! = 2</div>
                    </div>
                    <div className="rounded-2xl border border-black/[0.07] bg-[#fcfcfd] p-5 dark:border-white/[0.08] dark:bg-[#111114]">
                      <div className="text-[10px] font-semibold text-[#8b8b91]">Method</div>
                      <div className="mt-4 space-y-3 text-xs leading-5 text-[#5f6067] dark:text-[#b8b8bf]">
                        <div><span className="mr-2 text-[#1d4ed8]">01</span>Recognize the Gamma integral.</div>
                        <div><span className="mr-2 text-[#1d4ed8]">02</span>Evaluate Γ(3) = (3 − 1)!.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white dark:border-white/[0.07] dark:bg-[#070708]">
        <div className="mx-auto grid max-w-[1180px] gap-0 px-6 sm:grid-cols-3 sm:px-8">
          {[
            { icon: Sigma, title: "Solve", text: "Exact and numerical computation without hiding the mathematics." },
            { icon: ChartNoAxesCombined, title: "Visualize", text: "Large 2D, 3D and animated views built for understanding." },
            { icon: FileText, title: "Preserve", text: "Keep results structured, reproducible and ready to use elsewhere." },
          ].map(({ icon: Icon, title, text }, index) => (
            <div key={title} className={`flex gap-5 py-10 sm:px-8 ${index > 0 ? "border-t border-black/[0.06] dark:border-white/[0.07] sm:border-l sm:border-t-0" : ""}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#1d4ed8] dark:bg-blue-500/10">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl tracking-[-0.035em]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#73737a] dark:text-[#9d9da4]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="studios" className="mx-auto max-w-[1180px] px-6 py-24 sm:px-8 lg:py-32">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b8b91]">Studios</div>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Focused mathematical workspaces.</h2>
          </div>
          <Link href="/laboratory" className="hidden items-center gap-2 text-sm font-semibold text-[#1d4ed8] sm:flex">
            Explore all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {studios.map((studio) => (
            <Link
              key={studio.title}
              href={studio.href}
              className="group overflow-hidden rounded-[24px] border border-black/[0.07] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-40px_rgba(15,23,42,0.35)] dark:border-white/[0.08] dark:bg-[#0b0b0d]"
            >
              <div className="h-44 border-b border-black/[0.06] bg-[#f7f9ff] p-5 text-[#1d4ed8] dark:border-white/[0.07] dark:bg-[#101116]">
                <StudioVisual kind={studio.kind} />
              </div>
              <div className="p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="font-serif text-2xl tracking-[-0.035em]">{studio.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#77777e] dark:text-[#9d9da4]">{studio.description}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#1d4ed8] transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-24 sm:px-8 lg:pb-32">
        <div className="rounded-[30px] bg-[#f1f3f7] px-7 py-12 dark:bg-[#0b0b0e] sm:px-10 lg:px-14 lg:py-16">
          <h2 className="max-w-3xl font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Designed for clear mathematical work.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FunctionSquare, title: "Exact results", text: "Keep symbolic structure when an exact result exists." },
              { icon: Sparkles, title: "Visual clarity", text: "Make the result large enough to actually understand it." },
              { icon: FileText, title: "Clean output", text: "Export figures and mathematical content without degradation." },
              { icon: Grid3X3, title: "Reproducible", text: "Parameters, methods and results stay together." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1d4ed8] shadow-sm dark:bg-[#151518]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#77777e] dark:text-[#9d9da4]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-black/[0.06] bg-white dark:border-white/[0.07] dark:bg-[#070708]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center px-6 py-24 text-center sm:px-8">
          <div className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Start with the mathematics.</div>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#77777e] dark:text-[#9d9da4]">
            Choose a studio, enter a problem, and let the result become something you can see and use.
          </p>
          <Link href="/laboratory" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#101014] px-7 text-sm font-semibold text-white dark:bg-white dark:text-black">
            Launch Laboratory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
