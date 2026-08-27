import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, FileDown, Sigma } from "lucide-react";

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

function HeroSurface() {
  return (
    <svg viewBox="0 0 520 260" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="surface-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dce9ff" />
          <stop offset="0.48" stopColor="#79a9ef" />
          <stop offset="1" stopColor="#124d9f" />
        </linearGradient>
      </defs>
      <g stroke="#c9d1de" strokeWidth="1" opacity="0.72">
        <path d="M48 208H468" />
        <path d="M72 230L408 66" />
        <path d="M96 240L96 55" />
        <path d="M142 220L142 72" opacity="0.45" />
        <path d="M190 202L190 86" opacity="0.45" />
        <path d="M238 184L238 98" opacity="0.45" />
        <path d="M286 165L286 110" opacity="0.45" />
        <path d="M334 147L334 122" opacity="0.45" />
        <path d="M382 128L382 134" opacity="0.45" />
        <path d="M118 219L440 82" opacity="0.45" />
        <path d="M145 232L458 103" opacity="0.45" />
        <path d="M84 199L397 72" opacity="0.45" />
      </g>
      <path
        d="M96 199 C130 189 149 179 170 163 C195 143 211 116 241 103 C274 88 303 88 333 101 C359 112 376 137 401 151 C424 163 447 166 466 169 L466 211 C430 213 399 209 365 199 C331 188 306 169 276 164 C239 158 211 177 177 190 C147 201 122 204 96 205 Z"
        fill="url(#surface-fill)"
        opacity="0.95"
      />
      <g fill="none" stroke="#174d97" strokeWidth="1" opacity="0.52">
        <path d="M97 199 C145 190 176 142 232 112 C289 81 345 99 378 139 C406 173 433 165 465 169" />
        <path d="M101 205 C148 197 183 153 236 124 C287 96 337 109 369 146 C398 178 432 174 463 178" />
        <path d="M113 211 C158 204 191 165 240 138 C286 113 329 124 359 155 C388 185 424 184 451 188" />
        <path d="M131 215 C172 210 200 177 244 153 C282 132 321 140 349 166 C374 190 405 194 432 197" />
        <path d="M153 217 C187 213 213 188 248 169 C280 151 313 157 337 178 C357 196 384 202 408 204" />
      </g>
      <g fill="#657080" fontSize="11" fontFamily="system-ui, sans-serif">
        <text x="473" y="216">x</text>
        <text x="411" y="62">y</text>
        <text x="87" y="49">z</text>
      </g>
    </svg>
  );
}

function TwoDPlot() {
  return (
    <svg viewBox="0 0 320 210" className="h-full w-full" aria-hidden="true">
      <g stroke="#cbd1db" strokeWidth="1">
        <path d="M18 105H303" />
        <path d="M160 18V194" />
      </g>
      <path
        d="M18 55 C50 52 70 65 88 88 C107 113 124 145 143 135 C159 126 169 83 187 76 C205 68 221 88 234 108 C248 130 266 145 302 143"
        fill="none"
        stroke="#225bd3"
        strokeWidth="2"
      />
      <g fill="#737b87" fontSize="9" fontFamily="system-ui, sans-serif">
        <text x="296" y="99">x</text>
        <text x="165" y="25">y</text>
      </g>
    </svg>
  );
}

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
    <div className="bg-[#fbfcfe] text-[#101114]">
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 pb-10 pt-12 sm:px-8 lg:grid-cols-[0.66fr_1.34fr] lg:gap-12 lg:px-10 lg:pb-8 lg:pt-7 xl:px-12">
        <div className="max-w-[470px] lg:pb-5">
          <h1 className="font-serif text-[clamp(3.4rem,5.5vw,6rem)] font-medium leading-[0.95] tracking-[-0.055em] text-[#0b0c0f]">
            Mathematics,
            <br />
            made visible.
          </h1>
          <div className="mt-6 h-[3px] w-14 bg-[#184eb8]" />
          <p className="mt-5 max-w-[420px] text-[17px] leading-7 text-[#5f6671] sm:text-[18px]">
            Solve problems, visualize results in 2D, 3D and animation, and preserve precise scientific output.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/laboratory" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#0b1f46] px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(11,31,70,0.12)]">
              Open Laboratory
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#studios" className="inline-flex h-11 items-center rounded-[10px] border border-[#dfe3ea] bg-white px-5 text-sm font-semibold text-[#252a32]">
              Explore studios
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[15px] border border-[#dfe3ea] bg-white shadow-[0_18px_48px_rgba(25,38,60,0.08)]">
          <div className="flex h-9 items-center justify-between border-b border-[#e8ebf0] px-3.5 text-[10px] text-[#707784]">
            <span>Workspace</span>
            <span>×</span>
          </div>
          <div className="grid min-h-[385px] md:grid-cols-[145px_1fr]">
            <aside className="border-b border-[#e7eaf0] bg-[#fafbfd] p-3 md:border-b-0 md:border-r">
              <div className="text-[8px] font-semibold uppercase tracking-[0.13em] text-[#9299a5]">Input</div>
              <div className="mt-2 rounded-[8px] border border-[#dde2e9] bg-white px-3 py-3 font-serif text-[18px] text-[#1b1e24] shadow-[0_2px_5px_rgba(15,23,42,0.025)]">∫₀∞ x²e⁻ˣ dx</div>
              <div className="mt-3 text-[8px] font-semibold text-[#9299a5]">Assumptions</div>
              <div className="mt-1 font-serif text-xs text-[#626a76]">x ∈ [0, ∞)</div>
              <div className="mt-5 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#9299a5]">Operations</div>
              <div className="mt-2 space-y-0.5 text-[10px] text-[#505866]">
                {['Solve', 'Simplify', 'Differentiate', 'Integrate', 'Series', 'Transform'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-[5px] px-1.5 py-1.5">
                    <span>{item}</span><span className="text-[#a3a9b2]">›</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className="grid gap-2 p-2">
              <div className="grid gap-2 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="min-h-[225px] rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-3">
                  <div className="text-[9px] text-[#777f8b]">3D Surface</div>
                  <div className="mt-1 h-[188px]"><HeroSurface /></div>
                </div>
                <div className="min-h-[225px] rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-3">
                  <div className="text-[9px] text-[#777f8b]">2D Plot</div>
                  <div className="mt-1 h-[188px]"><TwoDPlot /></div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-4">
                  <div className="text-[9px] text-[#777f8b]">Symbolic Result</div>
                  <div className="mt-2 font-serif text-[20px]">∫₀∞ x²e⁻ˣ dx = 2! = 2</div>
                  <div className="mt-1 text-[11px] text-[#737b86]">Gamma(3) = 2</div>
                </div>
                <div className="rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-4">
                  <div className="text-[9px] text-[#777f8b]">Steps</div>
                  <div className="mt-2 space-y-2 font-serif text-[12px] text-[#4d5560]">
                    <div>1. ∫₀∞ x²e⁻ˣ dx = Γ(3)</div>
                    <div>2. Γ(3) = (3 − 1)! = 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
