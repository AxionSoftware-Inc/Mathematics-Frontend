# Laboratory System Guide

Bu fayl laboratoriya modullarini keyinroq tez kengaytirish, xato chiqqanda to'g'ri joyni topish va yangi chatdagi agentni butun repo bo'ylab boshidan qidirtirmaslik uchun yozilgan.

## 1. Arxitektura qisqacha

Laboratoriya tizimi 4 qatlamdan iborat:

1. `lib/laboratory.ts`
2. `components/laboratory/module-registry.tsx`
3. `components/laboratory/modules/*.tsx`
4. `app/laboratory/...`

Ishlash oqimi:

1. `fetchLaboratoryModules()` modul metadata ro'yxatini oladi.
2. Backend javobi bo'lsa, u fallback metadata ustidan yoziladi.
3. `app/laboratory/page.tsx` modul kartalarini chiqaradi.
4. Modul route slug bo'yicha metadata oladi.
5. `LaboratoryWorkspaceShell` modul headeri, navigatsiya va registrdan komponentni ulashni boshqaradi.
6. `module-registry.tsx` ichida slug frontend komponentga bog'lanadi.
7. Haqiqiy interaktiv ish joyi `components/laboratory/modules/<module>.tsx` ichida ishlaydi.

Demak yangi bo'lim qo'shish uchun faqat bitta joy yetmaydi. Metadata, registry va UI komponent bir-biriga mos bo'lishi shart.

## 2. Qaysi fayl nima qiladi

### `lib/laboratory.ts`

Bu fayl modul metadata manbai.

Muhim vazifalari:

- fallback modullar ro'yxati shu yerda turadi
- backenddan kelgan metadata normalize qilinadi
- API ishlamasa yoki modul topilmasa fallback ishlaydi

Agar yangi modul kartada umuman ko'rinmasa, birinchi tekshiriladigan fayl shu.

### `components/laboratory/module-registry.tsx`

Bu fayl slug -> React component mapping.

Agar modul ro'yxatda ko'rinsa, lekin ichiga kirganda `Interfeys ulanmagan` chiqsa, muammo odatda shu faylda bo'ladi:

- slug noto'g'ri yozilgan
- component importi yo'q
- registry obyektiga yangi entry qo'shilmagan

### `components/laboratory/modules/*.tsx`

Bu haqiqiy laboratoriya modullari.

Har modul odatda shu pattern bo'yicha yoziladi:

1. `useState` yoki `useMemo` bilan parametrlar va hisob natijalari
2. `useLaboratoryNotebook()` bilan bloklar boshqaruvi
3. `LaboratoryNotebookToolbar` bilan yuqori toolbar
4. asosiy bloklar: setup, visualization, analysis, bridge
5. `LaboratoryBridgeCard` bilan writer bridge

### `components/laboratory/math-utils.ts`

Bu umumiy hisoblash qatlami.

Yangi modul uchun:

- parser
- solver
- preset
- vizualizatsiyaga tayyor data builder

shu yerga qo'shiladi.

Hisob-kitobni komponent ichida haddan tashqari ko'paytirib yubormaslik kerak. Reusable matematika logikasi shu faylda bo'lgani yaxshi.

### `app/laboratory/page.tsx`

Bu umumiy laboratoriya landing sahifasi. Yangi modul ro'yxatda chiroyli ko'rinishi uchun metadata shu sahifada o'qiladi.

### `components/laboratory/workspace-shell.tsx`

Bu barcha modullar uchun umumiy tashqi ramka:

- modul header
- capability chiplar
- chap navigatsiya
- komponent fallback holati

Agar barcha modullarda umumiy vizual problem bo'lsa, ko'pincha shu yer yoki `app/globals.css` ni tekshirish kerak.

## 3. Yangi modul qo'shish tartibi

Minimal checklist:

1. `components/laboratory/modules/your-module.tsx` yarating.
2. `module-registry.tsx` ga import qo'shing.
3. `laboratoryModuleRegistry` ichiga slug bilan component va capabilities kiriting.
4. `lib/laboratory.ts` ichidagi `fallbackLaboratoryModules` ga metadata qo'shing.
5. `summary`, `description`, `icon_name`, `accent_color`, `sort_order`, `config` ni to'ldiring.
6. Agar modul presetlarga tayanadigan bo'lsa, `math-utils.ts` ichiga `LABORATORY_PRESETS` entry qo'shing.
7. Kerak bo'lsa yangi solver/helper funksiyalarini ham `math-utils.ts` ga qo'shing.
8. Landing va workspace sahifasida slug to'g'ri ko'rinayotganini tekshiring.

Tavsiya etiladigan blok pattern:

- `setup`
- `visual`
- `analysis`
- `bridge`

Har modul aynan shu nomlarda bo'lishi shart emas, lekin mantiq bir xil bo'lsa kodni keyin o'qish osonlashadi.

## 4. `config` qanday ishlaydi

`lib/laboratory.ts` dagi fallback metadata ichida `config` maydoni bor.

Maqsadi:

- modul default qiymatlarini markazlashtirish
- backenddan kelgan modul sozlamalarini UI ga uzatish
- kelajakda kodga tegmasdan default parametrlarni almashtirish

Yaxshi pattern:

- komponent ichida `module.config` dan numeric/string defaultlarni o'qish
- noto'g'ri qiymat kelsa fallback ishlatish
- input state ni sanitizatsiya qilish

Masalan Quantum modul endi `defaultTheta` va `defaultPhi` ni `module.config` orqali o'qiydi va noto'g'ri qiymat bo'lsa clamp qiladi.

## 5. Eng ko'p uchraydigan xatolar

### 1. Modul kartada ko'rinmaydi

Tekshirish:

- `lib/laboratory.ts` ichida metadata bormi
- `slug` unique va to'g'rimi
- API javobi fallbackni bosib ketib, noto'g'ri payload qaytarmayaptimi

### 2. Modul kartada bor, lekin ichida `Interfeys ulanmagan`

Tekshirish:

- `module-registry.tsx`
- import path to'g'rimi
- registry key metadata slug bilan bir xilmi

### 3. Modul ochiladi, lekin inputlar `undefined` yoki `NaN`

Sabablar:

- `module.config` ichidan noto'g'ri tipdagi qiymat o'qilgan
- `Number(...)` dan keyin finite check qilinmagan
- controlled input state string/number aralashib ketgan

To'g'ri yondashuv:

- `Number.isFinite(...)` bilan tekshirish
- `clamp` yoki normalize helper ishlatish
- komponent ichida display value va internal state ni ajratish

### 4. Grafik bo'sh

Tekshirish:

- plotga berilayotgan data array bo'sh emasmi
- data shape to'g'rimi: `{x,y}` yoki `{x,y,z}`
- `ScientificPlot` ga raw data beryapsizmi yoki trace array
- hisoblash xatosi `useMemo` ichida swallow bo'lib ketmadimi

### 5. Yangi preset tugmasi ishlamaydi

Tekshirish:

- `LABORATORY_PRESETS` formatini modul kutayotgan shape bilan moslang
- `applyPreset` ichidagi type guardlar yangi preset turini taniyaptimi

## 6. Debug qilishning to'g'ri tartibi

Agent yoki developer quyidagi tartibda tekshirsa vaqt tejaladi:

1. `git status` bilan worktree holatini ko'rish
2. `lib/laboratory.ts` dan slug va metadata ni tekshirish
3. `module-registry.tsx` dan slug mappingni tekshirish
4. modul komponentini ochib input state, preset, computed result oqimini ko'rish
5. agar vizual muammo umumiy bo'lsa `laboratory-notebook.tsx`, `workspace-shell.tsx`, `scientific-plot.tsx`, `app/globals.css` ni tekshirish
6. writer/export muammosi bo'lsa `LABORATORY_WRITER_BRIDGE.md` va bridge fayllariga o'tish

Muhim qoida: birinchi navbatda slug zanjiri tekshiriladi. Ko'p xatolar aynan slug mismatch sababli chiqadi.

## 7. Yaxshi modul yozish qoidalari

- Og'ir hisoblashni imkon qadar `math-utils.ts` ga chiqaring.
- UI state ni sanitizatsiya qiling.
- Defaultlarni hardcode qilmasdan `module.config` bilan ulang.
- Har modulda kamida bir nechta preset bo'lsin.
- Faqat input form emas, interpretatsiya qatlami ham bo'lsin.
- Vizual qismda faqat natija emas, diagnostic ko'rsatkichlar ham bering.
- `LaboratoryBridgeCard` ni butunlay olib tashlamang, keyin writer integratsiyasi qiyinlashadi.
- Bitta modulning local helperlari haddan oshsa, umumiy helperga aylantiring.

## 8. Vizual tizimni qayerdan boshqarish kerak

Umumiy premium ko'rinish uchun birinchi navbatda shu fayllar tekshiriladi:

- `app/globals.css`
- `components/laboratory/laboratory-notebook.tsx`
- `components/laboratory/workspace-shell.tsx`
- `components/laboratory/scientific-plot.tsx`
- `components/laboratory/cartesian-plot.tsx`

Agar har modulda bir xil dizayn kamchiligi ko'rinsa, alohida modulni emas, shu reusable qatlamlarni tuzatish kerak.

## 9. Writer bridge bo'yicha eslatma

Writer bilan live/export integratsiya alohida hujjatda yozilgan:

- `LABORATORY_WRITER_BRIDGE.md`

Agar muammo matematik modulda emas, eksportda bo'lsa, o'sha faylni birinchi ochish kerak.

## 10. Qisqa xulosa

Yangi modul qo'shish uchun minimum uchlik doim kerak:

1. metadata
2. registry
3. component

Shulardan bittasi yo'q bo'lsa laboratoriya to'liq ulanmaydi.

Agar vaqt kam bo'lsa, agent birinchi bo'lib shu ikki faylni tekshiradi:

- `lib/laboratory.ts`
- `components/laboratory/module-registry.tsx`

Keyin tegishli modul komponentiga o'tadi.
