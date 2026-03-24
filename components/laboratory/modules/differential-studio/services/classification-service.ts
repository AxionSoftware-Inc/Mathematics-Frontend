/**
 * DifferentialClassificationService
 *
 * Routes an incoming request to the correct mathematical lane.
 * Mirrors classification-service.ts pattern from integral-studio.
 *
 * Lanes:
 *   derivative         → ordinary f: R → R
 *   higher_order       → d²/dx², d³/dx³, ...
 *   partial            → gradient ∇f, scalar field
 *   directional        → D_u f in a given direction
 *   jacobian           → vector field F: Rⁿ → Rᵐ
 *   hessian            → curvature, local extrema analysis
 *   unknown            → unrecognized or unsupported
 */

import {
    DifferentialSolveSnapshot,
    DifferentialClassification,
    DifferentialDetectedType,
} from "../types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseVarCount(variableStr: string): number {
    return variableStr.split(",").map((v) => v.trim()).filter(Boolean).length;
}

function parseOrderInt(orderStr: string): number {
    const n = parseInt(orderStr, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Detect if the expression looks like a vector field: starts with `[` */
function isVectorExpression(expression: string): boolean {
    return expression.trim().startsWith("[") && expression.trim().endsWith("]");
}

/** Detect potential discontinuity / singularity signals from an expression. */
function detectExpressionHazards(expression: string): string[] {
    const notes: string[] = [];
    const norm = expression.replace(/\s+/g, "").toLowerCase();

    if (/\/[a-z]/.test(norm)) {
        notes.push("Ifoda nomida bo'linish bor — nuqta atrofida singularlik mumkin.");
    }
    if (/log\(|ln\(/.test(norm)) {
        notes.push("Logarifm uchun argument > 0 bo'lishi shart; domen chegarasini tekshiring.");
    }
    if (/sqrt\(|√/.test(norm)) {
        notes.push("Kvadrat ildiz uchun argument ≥ 0 bo'lishi shart.");
    }
    if (/abs\(/.test(norm)) {
        notes.push("abs() — Piecewise aniqlash tuzilishi sifatida ko'rsatilishi mumkin.");
    }
    if (/tan\(|cot\(/.test(norm)) {
        notes.push("tan/cot π/2 + πn nuqtalarida aniqlanmagan.");
    }

    return notes;
}

/** Build a coordinate-system-aware note. */
function coordinateNote(coords: string): string | undefined {
    if (coords === "polar") return "Polar koordinatalar: o'zgaruvchilar r, θ. Jacobian sifatida r ishlatiladi.";
    if (coords === "cylindrical") return "Silindrli koordinatalar: r, θ, z. Jacobian r bilan.";
    if (coords === "spherical") return "Sferik koordinatalar: ρ, θ, φ. Jacobian ρ²sin(φ) bilan.";
    return undefined;
}

function detectResearchFamily(expression: string) {
    const compact = expression.replace(/\s+/g, "").toLowerCase();
    const hasEquals = compact.includes("=");

    if (
        /(dw|dwt|brownian|ito|stratonovich|sigma.*dw|dxt=.*dw)/.test(compact)
        || (/dx=/.test(compact) && /dw/.test(compact))
    ) {
        return "sde_candidate" as const;
    }

    if (
        /(\u2202|partial|u_t|u_x|u_y|u_z|u_xx|u_yy|u_tt|laplace|laplacian|nabla|Δ)/.test(compact)
        || (hasEquals && /(u\(|p\(|heat|wave|diffusion|poisson)/.test(compact))
    ) {
        return "pde_candidate" as const;
    }

    if (
        (hasEquals && /(dy\/dx|d2y\/dx2|d3y\/dx3|y''|y'|x''|x'|theta''|theta')/.test(compact))
        || /(ode|initialvalue|boundaryvalue)/.test(compact)
    ) {
        return "ode_candidate" as const;
    }

    if (/(lagrangian|functional|euler-lagrange|action|δ|variational)/.test(expression.toLowerCase())) {
        return "variational_candidate" as const;
    }

    if (/(implicit|levelset|level-set|normalfield|meancurvature|gausscurvature|manifold|surfacepatch)/.test(compact)) {
        return "implicit_geometry_candidate" as const;
    }

    return null;
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export class DifferentialClassificationService {

    static classify(request: DifferentialSolveSnapshot): DifferentialClassification {
        const { expression, mode, variable, order, coordinates } = request;
        const trimmed = expression.trim();

        // ── Empty expression ──────────────────────────────────────────────────
        if (!trimmed) {
            return {
                kind: "unknown",
                label: "Empty Expression",
                support: "unsupported",
                summary: "Ifoda bo'sh — differensial hisoblash uchun funksiya kerak.",
                notes: ["Formula textarea'ga kiriting."],
            };
        }

        const hazardNotes = detectExpressionHazards(trimmed);
        const coordNote = coordinateNote(coordinates);
        const varCount = parseVarCount(variable);
        const orderInt = parseOrderInt(order);
        const researchFamily = detectResearchFamily(trimmed);

        if (mode === "ode") {
            return {
                kind: "ode_candidate",
                label: "ODE Lane",
                support: "supported",
                summary: "Ordinary differential equation symbolic lane. Hozir birinchi navbatda dsolve qo'llab-quvvatlagan oilalar ishlaydi.",
                notes: [
                    "Recommended syntax: y' = f(x, y); y(0)=1",
                    "Second-order case ham kiritish mumkin: y'' + y = 0; y(0)=0; y'(0)=1",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (mode === "pde") {
            return {
                kind: "pde_candidate",
                label: "PDE Lane",
                support: "supported",
                summary: "Partial differential equation symbolic lane. Hozir limited pdsolve oilalari ishlaydi.",
                notes: [
                    "Recommended syntax: u_t = u_x yoki u_t = k*u_xx",
                    "Independent vars field orqali masalan `x, t` kiriting.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (mode === "sde") {
            return {
                kind: "sde_candidate",
                label: "SDE Lane",
                support: "supported",
                summary: "Stochastic differential equation lane. Hozir Euler-Maruyama sample-path solver ishlaydi.",
                notes: [
                    "Recommended syntax: dX = mu*dt + sigma*dW; X(0)=1; t:[0,1]; n=200",
                    "Result reproducible bo'lishi uchun fixed random seed ishlatiladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (researchFamily === "ode_candidate") {
            return {
                kind: "ode_candidate",
                label: "ODE Candidate",
                support: "partial",
                summary: "Ifoda ordinary differential equation oilasiga o'xshaydi. Bu studio hozir hosila tahlili uchun kuchli, lekin ODE yechimi uchun alohida solver lane kerak.",
                notes: [
                    "Masalan: y' = f(x, y), y'' + ay' + by = g(x).",
                    "Keyingi bosqich uchun slope field, phase portrait va IVP/BVP solver kerak bo'ladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (researchFamily === "pde_candidate") {
            return {
                kind: "pde_candidate",
                label: "PDE Candidate",
                support: "partial",
                summary: "Ifoda partial differential equation oilasiga o'xshaydi. Hozirgi studio gradient/Jacobian/Hessian uchun yaxshi, lekin PDE uchun alohida time-space lane kerak.",
                notes: [
                    "Masalan: u_t = k u_xx, Laplace/Poisson, wave equation.",
                    "Keyingi bosqich uchun mesh, boundary conditions va time evolution visuali kerak bo'ladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (researchFamily === "sde_candidate") {
            return {
                kind: "sde_candidate",
                label: "SDE Candidate",
                support: "partial",
                summary: "Ifoda stochastic differential equation oilasiga o'xshaydi. Bu yerda deterministic differential audit bor, stochastic lane esa hali alohida qurilmagan.",
                notes: [
                    "Ito/Stratonovich, Brownian motion, diffusion termlar uchun path ensemble va confidence band visuali kerak.",
                    "Keyingi bosqichda Euler-Maruyama yoki Milstein oilalari bilan solve lane qo'shiladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (researchFamily === "implicit_geometry_candidate") {
            return {
                kind: "implicit_geometry_candidate",
                label: "Implicit Geometry Candidate",
                support: "partial",
                summary: "Ifoda implicit geometry yoki level-set oilasiga o'xshaydi. Hozirgi studio explicit scalar/vector lane'lar uchun optimallashtirilgan.",
                notes: [
                    "Normal field, curvature, level-set va manifold patch uchun maxsus geometry lane kerak.",
                    "Keyingi bosqichda implicit surface diagnostics va curvature visual qo'shiladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        if (researchFamily === "variational_candidate") {
            return {
                kind: "variational_candidate",
                label: "Variational Candidate",
                support: "partial",
                summary: "Ifoda variational calculus yoki functional analysis oilasiga o'xshaydi. Hozirgi differential studio lokal hosilalar uchun kuchli, functional extremum lane esa hali qurilmagan.",
                notes: [
                    "Euler-Lagrange, action functional va constraint optimization uchun alohida symbolic pipeline kerak.",
                    "Keyingi bosqichda variational templates va research report lane qo'shiladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Jacobian: always vector field ─────────────────────────────────────
        if (mode === "jacobian") {
            if (!isVectorExpression(trimmed) && !trimmed.includes(",")) {
                return {
                    kind: "jacobian_candidate",
                    label: "Jacobian — Single Function",
                    support: "partial",
                    summary: "Jacobian bir funksiyaga qo'llanilmoqda. [f1, f2, ...] formatida kiritish tavsiya etiladi.",
                    notes: [
                        "Bitta funksiya uchun Jacobian gradient bilan ekvivalent.",
                        ...hazardNotes,
                    ],
                    coordinateNote: coordNote,
                };
            }
            return {
                kind: "jacobian_candidate",
                label: `Jacobian Matrix (${varCount}×${isVectorExpression(trimmed) ? trimmed.slice(1, -1).split(",").filter(Boolean).length : 1})`,
                support: "supported",
                summary: `F: ℝ${varCount > 1 ? `^${varCount}` : ""} → ℝᵐ uchun to'liq Jacobian matritsasi. Determinant, trace va o'lcham tekshiriladi.`,
                notes: [
                    "[f1, f2, ...] ko'rinishidagi vektor funksiyadan J[i][j] = ∂Fᵢ/∂xⱼ matritsasi yasaladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Hessian: always scalar field ──────────────────────────────────────
        if (mode === "hessian") {
            if (isVectorExpression(trimmed)) {
                return {
                    kind: "hessian_candidate",
                    label: "Hessian — Vector Input Detected",
                    support: "partial",
                    summary: "Hessian scalar funksiya uchun. [f1, f2] kiritilgan — birinchi komponent ishlatiladi.",
                    notes: [
                        "Hessian skalyar maydon talab qiladi, vektor emas.",
                        ...hazardNotes,
                    ],
                    coordinateNote: coordNote,
                };
            }
            const signatureNote =
                varCount === 1
                    ? "1 o'zgaruvchili: f''(x) diagonali tekshiriladi."
                    : varCount === 2
                    ? "2×2 Hessian: determinant va f_xx orqali min/max/saddle tahlili."
                    : `${varCount}×${varCount} Hessian: diagonal belgi tomonidan tasniflanadi.`;
            return {
                kind: "hessian_candidate",
                label: `Hessian Matrix (${varCount}×${varCount})`,
                support: "supported",
                summary: `f: ℝ${varCount > 1 ? `^${varCount}` : ""} → ℝ uchun ikkinchi tartibli qisman hosilalar matritsasi. ${signatureNote}`,
                notes: [
                    "Diagonal: ∂²f/∂xᵢ² (3-nuqta stensili). Off-diagonal: ∂²f/∂xᵢ∂xⱼ (4-nuqta stensili).",
                    "Kritik nuqta turi (min/max/saddle) eigenvalue signaturasidan aniqlanadi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Directional derivative ────────────────────────────────────────────
        if (mode === "directional") {
            if (isVectorExpression(trimmed)) {
                return {
                    kind: "directional_derivative",
                    label: "Directional Derivative — Vector Input",
                    support: "partial",
                    summary: "Yo'naltirilgan hosila scalar maydon talab qiladi, vektor emas.",
                    notes: ["scalar f(x,y,...) qiymati kiriting."],
                };
            }
            return {
                kind: "directional_derivative",
                label: "Directional Derivative D_u f",
                support: "supported",
                summary: `D_u f = ∇f · û — berilgan yo'nalishda funksiyaning o'zgarish tezligi.`,
                notes: [
                    "Gradient hisoblang, keyin unit vector bilan skalyar ko'paytiriladi.",
                    "Yo'nalish vektorini 'Direction' maydonida kiriting (masalan: 1, 1).",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Partial / Gradient ────────────────────────────────────────────────
        if (mode === "partial") {
            if (isVectorExpression(trimmed)) {
                return {
                    kind: "gradient_candidate",
                    label: "Gradient — Vector Input",
                    support: "partial",
                    summary: "Gradient scalar funksiya uchun. Vektor ko'rinishi aniqlangan — Jacobian modini ko'rib chiqing.",
                    notes: ["scalar f(x,y,...) kiriting yoki Jacobian modiga o'ting."],
                };
            }
            if (varCount === 1) {
                return {
                    kind: "gradient_candidate",
                    label: "Gradient (1D = Derivative)",
                    support: "supported",
                    summary: "Bir o'zgaruvchili gradient — ∂f/∂x oddiy hosilaga teng. Derivative modiga o'tish tavsiya etiladi.",
                    notes: [
                        "Ko'p o'zgaruvchili maydon uchun `x, y` yoki `x, y, z` kiriting.",
                        ...hazardNotes,
                    ],
                    coordinateNote: coordNote,
                };
            }
            return {
                kind: "gradient_candidate",
                label: `Gradient ∇f (${varCount}D scalar field)`,
                support: "supported",
                summary: `f: ℝ^${varCount} → ℝ uchun ∇f — barcha qisman hosilalar vektori. Magnitude |∇f| va yo'nalish aniqlanadi.`,
                notes: [
                    `${varCount} ta o'zgaruvchi bo'yicha markaziy farq (central difference, h=1e-5) ishlatiladi.`,
                    "Natija: gradient vektori, normi, va 2D ko'rinishda strelka.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Ordinary derivative ───────────────────────────────────────────────
        if (mode === "derivative") {
            if (isVectorExpression(trimmed)) {
                return {
                    kind: "ordinary_derivative",
                    label: "Derivative — Vector Input",
                    support: "partial",
                    summary: "Vektor ifoda aniqlangan. Derivative oddiy skalyar funksiya uchun. Jacobian modiga o'tishni o'ylab ko'ring.",
                    notes: ["Single variable scalar function kiriting yoki Jacobian modidan foydalaning."],
                };
            }

            if (varCount > 1) {
                return {
                    kind: "partial_derivative",
                    label: "Partial Derivative (multi-var detected)",
                    support: "partial",
                    summary: "Bir nechta o'zgaruvchi aniqlandi. Derivative moda birinchi o'zgaruvchi bo'yicha hosila oladi. Gradient uchun Partial modiga o'ting.",
                    notes: [
                        "Faqat birinchi o'zgaruvchi bo'yicha hosila hisoblanadi.",
                        "Barcha qisman hosila uchun 'Partial / Grad' modini tanlang.",
                        ...hazardNotes,
                    ],
                };
            }

            if (orderInt === 1) {
                const kind: DifferentialDetectedType = "ordinary_derivative";
                return {
                    kind,
                    label: "Ordinary Derivative f\'(x)",
                    support: "supported",
                    summary: `f: ℝ → ℝ. Birinchi tartibli hosila — slope va tangent chiziq ko'rsatiladi.`,
                    notes: [
                        "Markaziy farq formulasi: f'(x) ≈ (f(x+h) - f(x-h)) / 2h, h = 1e-5.",
                        "Aniq hosila SymPy orqali backend'da ham hisoblanadi.",
                        ...hazardNotes,
                    ],
                    coordinateNote: coordNote,
                };
            }

            return {
                kind: "higher_order_derivative",
                label: `${orderInt}-tartibli hosila f⁽${orderInt}⁾(x)`,
                support: "supported",
                summary: `f: ℝ → ℝ uchun ${orderInt}-tartibli hosila. Taylor polynomial bilan birga ko'rsatiladi.`,
                notes: [
                    `Takroriy markaziy farq: D^${orderInt} da O(h²) aniqlik.`,
                    "Yuqori tartibda numerik xato biroz oshadi — step sweep ko'rish tavsiya etiladi.",
                    ...hazardNotes,
                ],
                coordinateNote: coordNote,
            };
        }

        // ── Fallback ──────────────────────────────────────────────────────────
        return {
            kind: "unknown",
            label: "Unknown Differential",
            support: "unsupported",
            summary: "Mode yoki ifoda tahlil qilinmadi.",
            notes: ["Rejimni va ifodani tekshiring."],
        };
    }
}
