# Laboratory Writer Bridge

Bu hujjat laboratoriya va writer orasidagi ko'prik qanday ishlashini tushuntiradi.

## Hozirgi imkoniyatlar

Hozir 3 ta oqim bor:

1. `Markdown nusxa olish`
2. `Yangi draftga yuborish`
3. `Live bridge`

## Modul arxitekturasi

Bridge logikasi alohida reusable modulga ajratilgan.

Asosiy fayllar:

- `Front/lib/live-writer-bridge.ts`
- `Front/components/live-writer-bridge/laboratory-bridge-card.tsx`
- `Front/components/live-writer-bridge/use-live-writer-targets.ts`
- `Front/components/live-writer-bridge/live-writer-bridge-panel.tsx`
- `Front/components/live-writer-bridge/writer-live-targets-panel.tsx`
- `Front/components/live-writer-bridge/lab-result-card.tsx`

Adapter sifatida ulanadigan joylar:

- `Front/components/paper-editor-workspace.tsx`
- `Front/components/laboratory/modules/series-limits-studio.tsx`
- `Front/components/laboratory/modules/proof-assistant.tsx`
- `Front/components/article-rich-content.tsx`

Demak bridge qatlami writer yoki laboratoriya ichiga ko'milib ketmagan. Keyin boshqa loyiha yoki boshqa modulga ko'chirish oson.

## Standart ulash pattern

Endi yangi laboratoriya moduli uchun writer bridge'ni qayta yozish shart emas.

Standart pattern:

1. Modul o'zining `markdown export` builder'ini yozadi
2. Modul o'zining `live payload` builder'ini yozadi
3. UI qismi uchun `LaboratoryBridgeCard` ishlatiladi
4. Ochiq writer target'larini olish uchun `useLiveWriterTargets()` ishlatiladi

Shu sabab yangi modulga bridge qo'shish bir xil pattern bilan amalga oshadi.

## 1. Markdown nusxa olish

Ishlash tartibi:

1. Series, limit va Taylor natijalari markdown blokka yig'iladi.
2. Clipboard'ga ko'chiriladi.
3. Foydalanuvchi uni istalgan maqolaning istalgan joyiga paste qiladi.

Qachon ishlatiladi:

- mavjud maqola ochiq bo'lsa
- qaysi joyga tushishini qo'lda boshqarmoqchi bo'lsangiz

## 2. Yangi draftga yuborish

Ishlash tartibi:

1. Natija `requestId` bilan `localStorage` ga vaqtincha yoziladi.
2. `write/new?source=laboratory&importId=...` ochiladi.
3. Writer faqat o'sha `importId` ga mos payload'ni import qiladi.
4. Writer yangi draft boshiga laboratoriya eksportini qo'shadi.

Qachon ishlatiladi:

- yangi qoralama tez ochish kerak bo'lsa
- laboratoriya natijasidan alohida maqola boshlamoqchi bo'lsangiz

Key:

- `mathsphere_laboratory_export`

Muhim:

- bu oqim mavjud maqolaga yozmaydi
- bu oqim faqat yangi draft ochish uchun
- mavjud maqolaning aynan kerakli qismiga yozish uchun `Live bridge` ishlatiladi

## 3. Live Bridge

Bu endi ishlaydi.

### Writer tomoni

1. Writer ichida `Live Lab Block` tugmasi bosiladi.
2. Matn ichiga maxsus `lab-result` block qo'shiladi.
3. Writer shu block'larni `BroadcastChannel` orqali laboratoriyaga broadcast qiladi.
4. Har bir block qaysi heading ostida turgani aniqlanadi va target metadata sifatida uzatiladi.

### Laboratory tomoni

1. Laboratoriya ochiq writer target'larini eshitadi.
2. Agar writer oldinroq ochilgan bo'lsa, target'lar local storage orqali ham tiklanadi.
3. Laboratoriya `writer-targets-request` xabari yuborib writer'dan qayta broadcast so'raydi.
4. Foydalanuvchi kerakli `maqola + bo'lim + live block` target'ini tanlaydi.
5. `Live push` bosilganda structured payload writer'ga yuboriladi.

### Update

1. Writer `lab-publish` xabarini oladi.
2. Mos `targetId` topiladi.
3. O'sha block avtomatik yangilanadi.
4. Preview darrov yangi natijani ko'rsatadi.

Target tanlash xavfsizligi:

- tanlov endi faqat `targetId` bilan emas, `writerId::targetId` bilan saqlanadi
- bir nechta writer ochiq bo'lsa ham laboratoriya qaysi maqoladagi qaysi block tanlanganini aniq biladi
- yangi draft import'i ham `requestId` bilan bog'langan, shuning uchun payload tasodifiy boshqa tab tomonidan olinmaydi

## Block formati

Writer ichida live natija markdown code block sifatida saqlanadi:

```md
```lab-result
{
  "id": "...",
  "status": "ready",
  "moduleSlug": "series-limits-studio",
  "kind": "taylor",
  "title": "...",
  "summary": "...",
  "metrics": [],
  "coefficients": [],
  "plotSeries": []
}
```
```

Bu formatning foydasi:

- content ichida saqlanadi
- previewda chiroyli widget bo'lib render qilinadi
- keyin journal yoki boshqa rendererga ko'chirish oson

## Hozir nimalar live

Hozir `Series & Limits` modulida ayniqsa `Taylor approximation` natijasi live push qilinadi:

- title
- summary
- metrics
- coefficients
- plot data

`Matrix Workbench` modulida esa:

- matrix summary
- result matrix
- matrix tables
- live writer block
- markdown export

standart bridge orqali ishlaydi

`Integral Studio` modulida esa:

- numerical estimates
- method comparison
- function plot
- live writer block
- markdown export

standart bridge orqali ishlaydi

`Proof Assistant` modulida esa:

- theorem metadata
- strategy metrics
- assumptions va proof step notes
- live writer block
- markdown export

standart bridge orqali ishlaydi

## Foydalanuvchi uchun ishlatish yo'li

### Mavjud maqolaning aniq qismiga live yuborish

1. Writer sahifasini oching
2. Natija tushishi kerak bo'lgan bo'lim ostiga `Live Lab Block` qo'shing
3. Laboratoriya sahifasini oching
4. `Live Writer Bridge` panelida kerakli `maqola / bo'lim / block` target'ini tanlang
5. `Live push` bosing
6. Writer preview va content ichida natija darrov yangilanadi

### Qo'lda ishlash

1. `Markdown nusxa olish`
2. Mavjud maqolaga paste qiling

### Yangi qoralama

1. `Yangi draftga yuborish`
2. Yangi draft avtomatik ochiladi

## Texnik eslatmalar

- Backend talab qilmaydi
- Bir xil brauzer ichida ishlaydi
- `BroadcastChannel` asosida ishlaydi
- Writer target state local storage'da qisqa muddat saqlanadi
- Writer va laboratoriya oralig'ida handshake request mavjud
- Writer yopilsa target heartbeat tugaydi va laboratoriyada bir muddatdan keyin `stale` bo'lib, keyin yo'qoladi

## Keyingi tabiiy kengayish

Keyin shu bridge orqali:

- integral natijalari
- matrix workbench natijalari
- geometry moduli
- bir maqoladagi bir nechta linked block

ham live ulanadi
