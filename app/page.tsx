import Link from "next/link";
import { ArrowRight, BookOpenText, ChartNoAxesCombined, FileDown, Sigma } from "lucide-react";

import { AnimatedMathSurface } from "@/components/home/animated-math-surface";
import { SiteContainer } from "@/components/public-shell";

const studios = [
  {
    title: "Integral Studio",
    description: "Symbolic, numerical and geometric integration in one focused workspace.",
    href: "/laboratory/integral-studio",
    visual: "integral",
  },
  {
    title: "Differential Studio",
    description: "Derivatives, Jacobians, Hessians and differential systems with visual analysis.",
    href: "/laboratory/differential-studio",
    visual: "differential",
  },
  {
    title: "Matrix Studio",
    description: "Linear algebra, transformations and spectral structure with geometric context.",
    href: "/laboratory/matrix-studio",
    visual: "matrix",
  },
  {
    title: "Probability Studio",
    description: "Distributions, inference and simulation designed for visual inspection.",
    href: "/laboratory/probability-studio",
    visual: "probability",
  },
  {
    title: "Series & Limit Studio",
    description: "Limits, sequences and convergence with exact and numerical comparison.",
    href: "/laboratory/series-limit-studio",
    visual: "series",
  },
];

function StudioVisual({ visual }: { visual: string }) {
  if (visual === "probability") {
    return (
      <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
        <path d="M7 80 C44 80 66 73 82 57 C97 42 103 17 120 13 C137 17 143 42 158 57 C174 73 196 80 233 80" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 80H230" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
        <g fill="currentColor" opacity="0.45">
          {[47,62,72,82,91,99,107,114,121,128,137,145,154,166,182].map((cx, index) => (
            <circle key={cx} cx={cx} cy={[75,69,65,56,50,38,25,18,14,23,34,47,57,66,73][index]} r="1.35" />
          ))}
        </g>
      </svg>
    );
  }

  if (visual === "matrix") {
    return (
      <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.48">
          <path d="M38 70L92 18L145 70L92 84Z" />
          <path d="M96 65L146 27L205 54L151 82Z" />
          <path d="M92 18L146 27M145 70L205 54M92 84L151 82" />
        </g>
        <path d="M92 51L151 52" stroke="currentColor" strokeWidth="2" />
        <path d="M151 52l-9-5v10z" fill="currentColor" />
      </svg>
    );
  }

  if (visual === "series") {
    return (
      <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
        <path d="M8 73 C30 35 50 21 68 31 C87 42 96 68 111 66 C132 63 137 42 150 40 C167 37 173 53 185 53 C199 53 208 45 232 45" fill="none" stroke="currentColor" strokeWidth="1.45" />
        <path d="M8 45H232" stroke="currentColor" strokeWidth="0.9" opacity="0.24" strokeDasharray="4 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 92" className="h-full w-full" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.65">
        <path d="M2 70 C33 57 53 20 78 19 C105 18 116 70 139 68 C165 66 178 28 203 26 C219 25 229 40 238 51" />
        <path d="M4 76 C34 64 56 33 79 32 C103 31 117 73 140 72 C166 70 181 40 204 39 C220 38 230 48 238 58" opacity="0.58" />
        <path d="M6 82 C38 72 58 46 80 45 C104 44 118 78 141 77 C166 75 184 52 205 51 C221 50 231 58 238 65" opacity="0.4" />
      </g>
    </svg>
  );
}

function SurfacePreview() {
  return (
    <svg viewBox="0 0 620 360" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="math-product-surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff2ff" />
          <stop offset="0.45" stopColor="#8fc1f3" />
          <stop offset="1" stopColor="#6c67d8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#bed2eb" strokeWidth="1" opacity="0.5">
        <path d="M72 294H554" />
        <path d="M100 314L468 70" />
        <path d="M122 326V58" />
      </g>
      <path d="M95 259 C148 246 177 181 236 157 C301 130 335 199 389 199 C442 199 481 130 536 143 L536 276 C485 271 442 247 394 245 C331 242 298 286 238 291 C182 296 138 278 95 276Z" fill="url(#math-product-surface)" opacity="0.68" />
      <g fill="none" stroke="#326dae" strokeWidth="1" opacity="0.46">
        <path d="M96 258 C153 246 181 183 237 158 C298 130 337 197 388 198 C443 200 480 130 535 144" />
        <path d="M98 267 C154 258 185 201 240 177 C298 153 337 211 388 213 C438 215 477 157 532 164" />
        <path d="M106 275 C159 269 190 220 244 198 C296 177 336 225 385 228 C433 231 471 183 522 185" />
        <path d="M119 282 C168 279 198 239 248 219 C297 201 335 239 381 243 C426 248 459 207 509 207" />
      </g>
      <g fill="#5275a7" fontFamily="Georgia, serif" fontStyle="italic" opacity="0.62">
        <text x="398" y="62" fontSize="18">z = f(x,y)</text>
        <text x="73" y="92" fontSize="16">∇²f</text>
        <text x="468" y="311" fontSize="14">x</text>
        <text x="112" y="49" fontSize="14">z</text>
      </g>
    </svg>
  );
}

function WavePlot() {
  return (
    <svg viewBox="0 0 620 230" className="h-full w-full" aria-hidden="true">
      <g stroke="#d8e0ea" strokeWidth="1">
        <path d="M24 116H596" />
        <path d="M310 20V210" />
      </g>
      <path d="M25 116 C58 47 95 44 129 116 C163 187 199 187 234 116 C269 46 303 46 338 116 C373 186 408 186 443 116 C478 47 516 47 595 116" fill="none" stroke="#2c67b6" strokeWidth="2.2" />
      <path d="M25 116 C72 78 105 79 146 116 C187 153 218 153 260 116 C302 79 333 79 375 116 C417 153 450 153 492 116 C534 79 562 85 595 116" fill="none" stroke="#82a9df" strokeWidth="1.2" opacity="0.72" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[var(--ax-canvas)] text-[var(--ax-text)]">
      <SiteContainer>
        <section className="relative grid min-h-[620px] items-center gap-6 overflow-hidden pb-8 pt-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-0 lg:pb-5 lg:pt-5">
          <div className="relative z-10 max-w-[570px] py-10 lg:py-16">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">MathSphere Laboratory · scientific computation</p>
            <h1 className="mt-4 font-serif text-[clamp(3.75rem,5.9vw,6.8rem)] font-medium leading-[0.92] tracking-[-0.058em] text-[var(--ax-text)]">
              Mathematics,
              <br />
              made <span className="italic">visible.</span>
            </h1>
            <div className="mt-7 flex items-center gap-2" aria-hidden="true"><span className="h-[3px] w-16 rounded-full bg-[var(--ax-accent)]" /><span className="h-1.5 w-1.5 rounded-full bg-[#9b8cf0]" /></div>
            <p className="mt-6 max-w-[470px] text-[17px] leading-8 text-[var(--ax-text-soft)] sm:text-[18px]">Solve, explore and understand mathematics through exact computation, clear visualization and living 3D scientific scenes.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/laboratory" className="inline-flex h-11 items-center gap-2 rounded-[var(--ax-radius-control)] bg-[var(--ax-accent-strong)] px-5 text-sm font-semibold text-white shadow-[var(--ax-shadow-subtle)] transition-colors hover:bg-[var(--ax-accent)]">Open Laboratory <ArrowRight className="h-4 w-4" /></Link>
              <Link href="#product" className="inline-flex h-11 items-center gap-2 rounded-[var(--ax-radius-control)] px-4 text-sm font-semibold text-[var(--ax-text)] transition-colors hover:bg-[var(--ax-surface-soft)]">Explore the product <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" /></Link>
            </div>
          </div>
          <div className="relative min-w-0 lg:-ml-14 lg:-mr-8 xl:-ml-20 xl:-mr-12"><AnimatedMathSurface /></div>
        </section>
      </SiteContainer>

      <section className="border-y border-[var(--ax-line)] bg-[var(--ax-surface)]">
        <SiteContainer className="grid md:grid-cols-3 md:divide-x md:divide-[var(--ax-line)]">
          {[
            ["Solve", "Exact symbolic work, numerical methods and transparent assumptions."],
            ["Visualize", "Large 2D, 3D and animated scientific output as a primary result."],
            ["Preserve", "Keep the result structured, reproducible and ready for the Project."],
          ].map(([title, text]) => (
            <div key={title} className="border-b border-[var(--ax-line)] py-7 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
              <div className="font-serif text-[24px] tracking-[-0.035em]">{title}</div>
              <p className="mt-2 max-w-sm text-[13px] leading-6 text-[var(--ax-text-soft)]">{text}</p>
            </div>
          ))}
        </SiteContainer>
      </section>

      <section id="product" className="py-20 md:py-24 lg:py-28">
        <SiteContainer>
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">The product</p>
              <h2 className="mt-4 max-w-[650px] font-serif text-[clamp(2.8rem,4.2vw,5.1rem)] leading-[0.98] tracking-[-0.05em]">A laboratory built around the mathematical result.</h2>
            </div>
            <p className="max-w-[650px] text-[16px] leading-8 text-[var(--ax-text-soft)] lg:justify-self-end">The interface stays quiet until the mathematics needs depth. Enter the problem once, then move naturally from exact form to numerical verification, geometry, interpretation and export.</p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[18px] border border-[var(--ax-line)] bg-[var(--ax-surface)] shadow-[var(--ax-shadow-floating)]">
            <div className="grid min-h-[520px] lg:grid-cols-[210px_minmax(0,1fr)]">
              <aside className="border-b border-[var(--ax-line)] bg-[var(--ax-surface-soft)] p-5 lg:border-b-0 lg:border-r lg:p-6">
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-text-faint)]">Integral Studio</div>
                <div className="mt-4 rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface)] p-3.5 font-serif text-[20px]">∫₀∞ x²e⁻ˣ dx</div>
                <div className="mt-7 space-y-1.5 text-[11px] font-semibold text-[var(--ax-text-soft)]">
                  {['Problem', 'Visualization', 'Result', 'Interpretation', 'Advanced'].map((item, index) => (
                    <div key={item} className={`rounded-[7px] px-3 py-2.5 ${index === 2 ? 'bg-[var(--ax-surface)] text-[var(--ax-text)] shadow-[0_1px_2px_rgb(23_36_54_/_0.05)]' : ''}`}>{item}</div>
                  ))}
                </div>
                <div className="mt-8 border-t border-[var(--ax-line)] pt-5 text-[10px] leading-5 text-[var(--ax-text-faint)]">Exact first<br />Numeric verification<br />Local computation</div>
              </aside>

              <div className="grid min-w-0 gap-0 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="min-h-[360px] border-b border-[var(--ax-line)] p-5 sm:p-7 xl:border-b-0 xl:border-r">
                  <div className="flex items-center justify-between gap-4">
                    <div><div className="text-[9px] uppercase tracking-[0.13em] text-[var(--ax-text-faint)]">Primary visualization</div><div className="mt-1 text-sm font-semibold">Surface interpretation</div></div>
                    <div className="text-[10px] font-semibold text-[var(--ax-accent)]">Interactive</div>
                  </div>
                  <div className="mt-4 h-[340px]"><SurfacePreview /></div>
                </div>
                <div className="grid content-start gap-0">
                  <div className="border-b border-[var(--ax-line)] p-6 sm:p-7">
                    <div className="text-[9px] uppercase tracking-[0.13em] text-[var(--ax-text-faint)]">Exact result</div>
                    <div className="mt-4 font-serif text-[34px] tracking-[-0.04em]">Γ(3) = 2</div>
                    <p className="mt-3 text-[12px] leading-6 text-[var(--ax-text-soft)]">The improper integral resolves exactly through the Gamma function, then remains available for numerical verification.</p>
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="text-[9px] uppercase tracking-[0.13em] text-[var(--ax-text-faint)]">Interpretation</div>
                    <div className="mt-4 space-y-3 font-serif text-[14px] leading-6 text-[var(--ax-text)]">
                      <div>1. Recognize Γ(n + 1).</div>
                      <div>2. Evaluate Γ(3) = 2!.</div>
                      <div>3. Preserve method + assumptions.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SiteContainer>
      </section>

      <section id="studios" className="border-y border-[var(--ax-line)] bg-[var(--ax-surface)] py-20 md:py-24">
        <SiteContainer>
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">Focused studios</p>
              <h2 className="mt-4 font-serif text-[clamp(2.8rem,4vw,4.7rem)] leading-[1] tracking-[-0.05em]">One problem class. One focused instrument.</h2>
              <p className="mt-5 max-w-[430px] text-[15px] leading-7 text-[var(--ax-text-soft)]">No giant universal control panel. Each studio exposes the controls, diagnostics and visual language appropriate to its mathematics.</p>
              <Link href="/laboratory" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ax-accent-strong)]">Explore all studios <ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="divide-y divide-[var(--ax-line)] border-y border-[var(--ax-line)]">
              {studios.map((studio, index) => (
                <Link key={studio.title} href={studio.href} className="group grid gap-5 py-6 transition-colors hover:bg-[var(--ax-surface-soft)] sm:grid-cols-[56px_minmax(0,1fr)_180px_auto] sm:items-center sm:px-4">
                  <div className="font-serif text-[20px] text-[var(--ax-text-faint)]">{String(index + 1).padStart(2, "0")}</div>
                  <div className="min-w-0"><h3 className="font-serif text-[27px] tracking-[-0.035em]">{studio.title}</h3><p className="mt-1 max-w-xl text-[12px] leading-5 text-[var(--ax-text-soft)]">{studio.description}</p></div>
                  <div className="hidden h-[72px] text-[var(--ax-accent)] sm:block"><StudioVisual visual={studio.visual} /></div>
                  <ArrowRight className="h-4 w-4 text-[var(--ax-text-faint)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--ax-accent)]" />
                </Link>
              ))}
            </div>
          </div>
        </SiteContainer>
      </section>

      <section id="capabilities" className="py-20 md:py-24 lg:py-28">
        <SiteContainer>
          <div className="max-w-[760px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">Built for serious mathematical work</p>
            <h2 className="mt-4 font-serif text-[clamp(2.9rem,4.4vw,5.2rem)] leading-[0.98] tracking-[-0.05em]">Depth when you need it. Clarity before everything else.</h2>
          </div>

          <div className="mt-14 divide-y divide-[var(--ax-line)] border-y border-[var(--ax-line)]">
            <article className="grid gap-8 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:py-14">
              <div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-text-faint)]">01 · Exact first</div><h3 className="mt-3 font-serif text-[34px] tracking-[-0.04em]">Keep the mathematics exact as long as possible.</h3><p className="mt-4 max-w-[470px] text-sm leading-7 text-[var(--ax-text-soft)]">Symbolic form remains primary. Numerical methods verify, extend or approximate only where they add value.</p></div>
              <div className="grid gap-4 border-l-0 border-[var(--ax-line)] lg:border-l lg:pl-12">
                <div className="font-serif text-[clamp(1.5rem,3vw,2.8rem)]">∫₀∞ x<sup>s−1</sup>e<sup>−x</sup>dx = Γ(s)</div>
                <div className="font-serif text-[clamp(1.25rem,2.4vw,2.15rem)] text-[var(--ax-text-soft)]">Γ(n + 1) = n!</div>
                <div className="text-[11px] uppercase tracking-[0.13em] text-[var(--ax-text-faint)]">symbolic result · assumptions · numerical verification</div>
              </div>
            </article>

            <article className="grid gap-8 py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:py-14">
              <div className="order-2 min-h-[260px] lg:order-1"><WavePlot /></div>
              <div className="order-1 lg:order-2 lg:pl-10"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-text-faint)]">02 · Visual by default</div><h3 className="mt-3 font-serif text-[34px] tracking-[-0.04em]">A graph is part of the answer.</h3><p className="mt-4 max-w-[470px] text-sm leading-7 text-[var(--ax-text-soft)]">Plots, surfaces and animation get enough space to explain structure instead of being squeezed into a tiny afterthought.</p></div>
            </article>

            <article className="grid gap-8 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:py-14">
              <div><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-text-faint)]">03 · Reproducible by design</div><h3 className="mt-3 font-serif text-[34px] tracking-[-0.04em]">The result remembers how it was made.</h3><p className="mt-4 max-w-[470px] text-sm leading-7 text-[var(--ax-text-soft)]">Inputs, parameters, assumptions and provenance stay structured so the work can move into a Project without becoming a screenshot.</p></div>
              <div className="border-l-0 border-[var(--ax-line)] lg:border-l lg:pl-12">
                {[["Source", "Integral Studio"],["Execution", "This device"],["Method", "Symbolic + numeric check"],["Object", "calculation · math.integral"],["Status", "Saved to Project"]].map(([label,value]) => (
                  <div key={label} className="grid grid-cols-[110px_1fr] border-b border-[var(--ax-line)] py-3 text-[12px]"><span className="text-[var(--ax-text-faint)]">{label}</span><span className="font-semibold text-[var(--ax-text)]">{value}</span></div>
                ))}
              </div>
            </article>
          </div>
        </SiteContainer>
      </section>

      <section id="ecosystem" className="border-y border-[var(--ax-line)] bg-[var(--ax-surface)] py-20 md:py-24 lg:py-28">
        <SiteContainer>
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">Beyond the calculation</p>
              <h2 className="mt-4 font-serif text-[clamp(2.8rem,4.2vw,5rem)] leading-[1] tracking-[-0.05em]">The result should survive the handoff.</h2>
              <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[var(--ax-text-soft)]">Save a mathematical result to the active Project, reason about it in Notebook, then use the same scientific evidence in Writer.</p>
            </div>

            <div className="grid gap-0 md:grid-cols-3">
              {[
                { step: "01", title: "Math", text: "Solve and visualize.", icon: Sigma },
                { step: "02", title: "Notebook", text: "Reason and observe.", icon: BookOpenText },
                { step: "03", title: "Writer", text: "Publish the evidence.", icon: FileDown },
              ].map((item, index) => (
                <div key={item.title} className={`relative border-t border-[var(--ax-line)] py-6 md:border-t-0 md:px-7 ${index ? 'md:border-l' : ''}`}>
                  <div className="flex items-center justify-between"><item.icon className="h-5 w-5 text-[var(--ax-accent)]" /><span className="font-serif text-[18px] text-[var(--ax-text-faint)]">{item.step}</span></div>
                  <div className="mt-8 font-serif text-[28px] tracking-[-0.04em]">{item.title}</div>
                  <p className="mt-2 text-[12px] leading-6 text-[var(--ax-text-soft)]">{item.text}</p>
                  {index < 2 ? <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[var(--ax-text-faint)] md:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </SiteContainer>
      </section>

      <section className="py-24 md:py-32">
        <SiteContainer>
          <div className="mx-auto max-w-[980px] text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-accent)]">MathSphere Laboratory</p>
            <h2 className="mt-5 font-serif text-[clamp(3rem,5.2vw,6.2rem)] leading-[0.95] tracking-[-0.055em]">Mathematics should be something you can <span className="italic">see.</span></h2>
            <p className="mx-auto mt-6 max-w-[600px] text-[16px] leading-8 text-[var(--ax-text-soft)]">Open a focused studio and work directly with the mathematics — exact, visual and reproducible.</p>
            <Link href="/laboratory" className="mt-8 inline-flex h-12 items-center gap-2 rounded-[var(--ax-radius-control)] bg-[var(--ax-accent-strong)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--ax-accent)]">Open Laboratory <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </SiteContainer>
      </section>
    </div>
  );
}
