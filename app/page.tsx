import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, FileDown, Sigma } from "lucide-react";

import { AnimatedMathSurface } from "@/components/home/animated-math-surface";

const studios = [
  {
    title: "Integral Studio",
    description: "Evaluate symbolic and numerical integrals with precise visual context.",
    href: "/laboratory/integral-studio",
    visual: "integral",
  },
  {
    title: "Differential Studio",
    description: "Study derivatives, Jacobians, Hessians and differential systems.",
    href: "/laboratory/differential-studio",
    visual: "differential",
  },
  {
    title: "Probability Studio",
    description: "Explore distributions, samples, inference and probabilistic behaviour.",
    href: "/laboratory/probability-studio",
    visual: "probability",
  },
];

function StudioVisual({ visual }: { visual: string }) {
  if (visual === "differential") {
    return (
      <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
        <g fill="none" stroke="#8fb3ef" strokeWidth="1.2" opacity="0.9">
          <path d="M4 46 C35 8 79 10 112 45 C145 80 193 82 236 45" />
          <path d="M8 60 C41 29 76 28 108 49 C145 73 190 69 232 34" />
          <path d="M7 31 C39 63 78 67 111 47 C149 24 193 24 234 58" />
          <path d="M29 14 C51 42 80 53 110 47 C148 39 175 21 210 13" opacity="0.55" />
          <path d="M29 78 C55 57 82 48 111 48 C150 48 181 62 213 79" opacity="0.55" />
        </g>
        <circle cx="111" cy="47" r="4" fill="#255fc4" />
      </svg>
    );
  }

  if (visual === "probability") {
    return (
      <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
        <path d="M7 80 C44 80 66 73 82 57 C97 42 103 17 120 13 C137 17 143 42 158 57 C174 73 196 80 233 80" fill="none" stroke="#4e83d7" strokeWidth="1.6" />
        <g fill="#6fa0eb" opacity="0.55">
          <circle cx="47" cy="75" r="1.4" /><circle cx="62" cy="69" r="1.4" /><circle cx="72" cy="65" r="1.4" />
          <circle cx="82" cy="56" r="1.4" /><circle cx="91" cy="50" r="1.4" /><circle cx="99" cy="38" r="1.4" />
          <circle cx="107" cy="25" r="1.4" /><circle cx="114" cy="18" r="1.4" /><circle cx="121" cy="14" r="1.4" />
          <circle cx="128" cy="23" r="1.4" /><circle cx="137" cy="34" r="1.4" /><circle cx="145" cy="47" r="1.4" />
          <circle cx="154" cy="57" r="1.4" /><circle cx="166" cy="66" r="1.4" /><circle cx="182" cy="73" r="1.4" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
      <g fill="none" stroke="#83a9e6" strokeWidth="1" opacity="0.78">
        <path d="M2 70 C33 57 53 20 78 19 C105 18 116 70 139 68 C165 66 178 28 203 26 C219 25 229 40 238 51" />
        <path d="M4 76 C34 64 56 33 79 32 C103 31 117 73 140 72 C166 70 181 40 204 39 C220 38 230 48 238 58" opacity="0.65" />
        <path d="M6 82 C38 72 58 46 80 45 C104 44 118 78 141 77 C166 75 184 52 205 51 C221 50 231 58 238 65" opacity="0.5" />
      </g>
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[var(--ax-canvas)] text-[var(--ax-text)]">
      <section className="relative mx-auto grid min-h-[600px] max-w-[1540px] items-center gap-4 overflow-hidden px-6 pb-6 pt-8 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-0 lg:px-10 lg:pb-4 lg:pt-4 xl:px-12">
        <div className="relative z-10 max-w-[560px] py-8 lg:py-14">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">MathSphere Laboratory · scientific computation</p>
          <h1 className="mt-4 font-serif text-[clamp(3.65rem,5.9vw,6.65rem)] font-medium leading-[0.92] tracking-[-0.058em] text-[var(--ax-text)]">
            Mathematics,
            <br />
            made <span className="italic">visible.</span>
          </h1>
          <div className="mt-7 flex items-center gap-2" aria-hidden="true">
            <span className="h-[3px] w-16 rounded-full bg-[var(--ax-accent)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#9b8cf0]" />
          </div>
          <p className="mt-6 max-w-[460px] text-[17px] leading-8 text-[var(--ax-text-soft)] sm:text-[18px]">
            Solve, explore and understand mathematics through exact computation, clear visualization and living 3D scientific scenes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/laboratory" className="inline-flex h-11 items-center gap-2 rounded-[var(--ax-radius-control)] bg-[var(--ax-accent-strong)] px-5 text-sm font-semibold text-white shadow-[var(--ax-shadow-subtle)] transition-colors hover:bg-[var(--ax-accent)]">
              Open Laboratory
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#studios" className="inline-flex h-11 items-center gap-2 rounded-[var(--ax-radius-control)] px-4 text-sm font-semibold text-[var(--ax-text)] transition-colors hover:bg-[var(--ax-surface-soft)]">
              Explore studios
              <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" />
            </Link>
          </div>
        </div>

        <div className="relative min-w-0 lg:-ml-14 lg:-mr-12 xl:-ml-20 xl:-mr-20">
          <AnimatedMathSurface />
        </div>
      </section>

      <section className="border-y border-[#e8ebf0] bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-3 px-6 py-5 sm:px-8 md:grid-cols-3">
          {[
            { icon: Sigma, title: "Solve", text: "Compute exactly with symbolic and numeric methods." },
            { icon: ChartNoAxesCombined, title: "Visualize", text: "Explore clear 2D and 3D plots, surfaces and animation." },
            { icon: FileDown, title: "Export", text: "Preserve clean, reproducible mathematical results." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex min-h-[94px] items-center gap-4 rounded-[9px] border border-[#e3e7ed] bg-[#fdfefe] px-5 py-4 shadow-[0_4px_12px_rgba(20,32,50,0.025)]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#184eb8]"><Icon className="h-5 w-5" /></div>
              <div><h2 className="font-serif text-[21px] leading-none">{title}</h2><p className="mt-2 text-[12px] leading-5 text-[#67707d]">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="studios" className="mx-auto max-w-[1180px] px-6 pb-8 pt-7 sm:px-8" style={{ contentVisibility: "auto", containIntrinsicSize: "500px" }}>
        <div className="mb-2 flex items-center justify-between gap-6">
          <h2 className="font-serif text-[28px] tracking-[-0.035em]">Studios</h2>
          <Link href="/laboratory" className="text-xs font-medium text-[#184eb8]">Explore all studios →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {studios.map((studio) => (
            <Link key={studio.title} href={studio.href} className="grid min-h-[112px] grid-cols-[0.9fr_1.1fr] items-center overflow-hidden rounded-[9px] border border-[#e2e6ec] bg-white px-3 py-2 shadow-[0_3px_12px_rgba(20,32,50,0.025)]">
              <div className="h-[80px] text-[#255fc4]"><StudioVisual visual={studio.visual} /></div>
              <div className="min-w-0 px-2"><h3 className="font-serif text-[17px]">{studio.title}</h3><p className="mt-1.5 text-[11px] leading-[1.55] text-[#68717d]">{studio.description}</p><div className="mt-2 text-right text-[#184eb8]">→</div></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-5 sm:px-8" style={{ contentVisibility: "auto", containIntrinsicSize: "230px" }}>
        <h2 className="font-serif text-[27px] tracking-[-0.035em]">Designed for clear mathematical work</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["⊙", "Exact results", "Symbolic computation preserves exact forms when possible."],
            ["◉", "Visual clarity", "Large plots and focused controls keep the result readable."],
            ["⇩", "Export quality", "Figures and mathematical output remain usable outside the lab."],
            ["↻", "Reproducible", "Inputs, methods and results stay structured and repeatable."],
          ].map(([symbol, title, text]) => (
            <div key={title} className="flex gap-3 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef4ff] text-[#184eb8]">{symbol}</div>
              <div><h3 className="text-[12px] font-semibold">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#6d7581]">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 pb-8 sm:px-8" style={{ contentVisibility: "auto", containIntrinsicSize: "120px" }}>
        <div className="flex flex-col items-center justify-center rounded-[9px] border border-[#dfe5ee] bg-[#f8faff] px-6 py-4 text-center">
          <div className="font-serif text-[17px]">Ready to do your best mathematical work?</div>
          <Link href="/laboratory" className="mt-3 inline-flex h-10 items-center rounded-[9px] bg-[#0b1f46] px-6 text-xs font-semibold text-white">Launch Laboratory</Link>
        </div>
      </section>
    </div>
  );
}
