# Laboratory 3D Visualization

Bu hujjat laboratory ichidagi 3D grafik qatlamining qanday ishlashini, qaysi fayllar markaziy ekanini va yangi 3D sahna qo'shishda qaysi yo'ldan yurish kerakligini qisqacha tushuntiradi.

## Asosiy fayllar

- `components/laboratory/unified-plot-renderer.tsx`
  - Plotly uchun markaziy render qatlam.
  - 2D va 3D trace turini ajratadi.
  - `plotly_webglcontextlost` holatini ushlab, grafikni tiklaydi.
  - 3D kamera reset va hard refresh actionlarini beradi.
  - 3D kamera presetlari (`Iso`, `Top`, `Front`, `Side`) va PNG snapshot export shu yerda.

- `components/laboratory/scientific-plot.tsx`
  - Laboratory modullari ishlatadigan yuqori darajali helper.
  - Quyidagi builderlar shu yerda:
    - `buildSurfaceData(...)`
    - `buildParametricSurfaceData(...)`
    - `buildScatter3DTrajectoryData(...)`
    - `buildWireframe3DData(...)`
    - `buildPointCloudData(...)`
    - `buildVolumeData(...)`

- `components/laboratory/math-utils.ts`
  - Domen bo'yicha 3D sahna uchun xom geometriya va sample ma'lumotlarni tayyorlaydi.
  - Muhim helperlar:
    - `buildOptimizationLandscape(...)`
    - `calculateMatrixTransformation(...)`
    - `buildBlochSphereGeometry(...)`
    - `getLightConeGeometry(...)`

## Joriy arxitektura

1. Modul matematik ma'lumotni `math-utils.ts` orqali hisoblaydi.
2. Modul shu xom ma'lumotni `scientific-plot.tsx` helperlari orqali Plotly trace'ga aylantiradi.
3. Yakuniy trace'lar `UnifiedPlotRenderer` ga beriladi.
4. Renderer 3D holatda `uirevision`, camera reset va WebGL recovery bilan ishlaydi.
5. Agar modul `insights` yuborsa, plot ustida qisqa explanation badge'lar ko'rinadi.

Bu ajratishning sababi:

- matematika va geometriya mantiqi UI'dan ajraladi
- barcha 3D grafiklar bir xil recovery/logika bilan ishlaydi
- surface, wireframe, trajectory va parametric sahnalar bir xil standartga tushadi

## Avvalgi muammolar va hozirgi yechim

- Muammo: 3D grafiklar ba'zan nuqta buluti ko'rinishida qolib ketardi.
  - Yechim: real `surface`, `parametric surface`, `wireframe` va `trajectory` builderlar qo'shildi.

- Muammo: grafik yo'qolib qolishi yoki o'zini tozalab yuborishi kuzatilardi.
  - Yechim: renderer ichidagi beqaror remount/resize logikasi soddalashtirildi va WebGL context lost recovery lokal graph div ga ko'chirildi.

- Muammo: ba'zi modullar ma'nosiz 3D ko'rinish berardi.
  - Yechim: optimization, matrix, quantum va relativity sahnalari endi ma'no beruvchi qatlamlar bilan chiziladi.

- Muammo: kuchli sahnani tushunish va eksport qilish qiyin edi.
  - Yechim: camera presetlari, insight badge'lar va snapshot export markaziy rendererga qo'shildi.

## Modul kesimida qanday ishlaydi

### Optimization

- `solveGradientDescent(...)` descent yo'lini beradi.
- `buildOptimizationLandscape(...)` shu yo'lni qamrab oladigan cost surface sample qiladi.
- Modul surface trace va trajectory trace'ni overlay qiladi.

### Matrix

- `calculateMatrixTransformation(...)` endi:
  - original cube vertex'lari
  - transformed cube vertex'lari
  - cube edge'lari
  - original/transformed basis vectors
  - determinant
  ni qaytaradi.
- Modul wireframe va basis traces bilan 3D kubni chizadi.

### Quantum

- `buildBlochSphereGeometry(...)` sfera qobig'i, equator, meridian, axis va poles qaytaradi.
- Modul state vectorni shu sfera ustiga qo'yadi.

### Relativity

- `getLightConeGeometry(...)` future cone, past cone, null ray va time axis qaytaradi.
- Modul ikki cone surface va null raylarni bitta spacetime sahnada ko'rsatadi.

## Yangi 3D sahna qo'shish qoidasi

1. Avval `math-utils.ts` da domen geometriyasini yoki sample funksiyasini yozing.
2. Agar sirt `z = f(x, y)` bo'lsa `buildSurfaceData(...)` ishlating.
3. Agar sirt parametric bo'lsa `buildParametricSurfaceData(...)` ishlating.
4. Agar geometriya karkas bo'lsa `buildWireframe3DData(...)` ishlating.
5. Agar yo'l yoki trajectory bo'lsa `buildScatter3DTrajectoryData(...)` ishlating.
6. Final trace'larni `ScientificPlot` ga bering, to'g'ridan-to'g'ri alohida Plotly wrapper yozmang.
7. Agar sahna tushuntirish talab qilsa, `ScientificPlot` ga `insights` va `snapshotFileName` bering.

## Ishonchlilik bo'yicha amaliy qoida

- 3D uchun imkon qadar sparse emas, strukturali data bering.
- Surface uchun to'liq grid yoki parametric matrix bering.
- Har yangi 3D helper uchun kamida bitta unit test yozing.
- Modul ichida trace build qilish kerak bo'lsa ham renderer'ni chetlab o'tmang.
