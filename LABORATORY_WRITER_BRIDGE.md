# Laboratory Writer Bridge

Bu hujjat laboratoriya va writer orasidagi ko'prik qanday ishlashini tushuntiradi.

## Hozirgi imkoniyatlar

Hozir 3 ta oqim bor:

1. `Markdown nusxa olish`
2. `Writer'ga yuborish`
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

## 2. Writer'ga yuborish

Ishlash tartibi:

1. Natija `localStorage` ga vaqtincha yoziladi.
2. `write/new?source=laboratory` ochiladi.
3. Writer yangi draft boshiga laboratoriya eksportini qo'shadi.

Qachon ishlatiladi:

- yangi qoralama tez ochish kerak bo'lsa
- laboratoriya natijasidan alohida maqola boshlamoqchi bo'lsangiz

Key:

- `mathsphere_laboratory_export`

## 3. Live Bridge

Bu endi ishlaydi.

### Writer tomoni

1. Writer ichida `Live Lab Block` tugmasi bosiladi.
2. Matn ichiga maxsus `lab-result` block qo'shiladi.
3. Writer shu block'larni `BroadcastChannel` orqali laboratoriyaga broadcast qiladi.

### Laboratory tomoni

1. Laboratoriya ochiq writer target'larini eshitadi.
2. Foydalanuvchi kerakli target'ni tanlaydi.
3. `Live push` bosilganda structured payload writer'ga yuboriladi.

### Update

1. Writer `lab-publish` xabarini oladi.
2. Mos `targetId` topiladi.
3. O'sha block avtomatik yangilanadi.
4. Preview darrov yangi natijani ko'rsatadi.

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

### Mavjud maqolaga live yuborish

1. Writer sahifasini oching
2. `Live Lab Block` qo'shing
3. Laboratoriya sahifasini oching
4. `Live Writer Bridge` panelida target'ni tanlang
5. `Live push` bosing
6. Writer preview va content ichida natija darrov yangilanadi

### Qo'lda ishlash

1. `Markdown nusxa olish`
2. Mavjud maqolaga paste qiling

### Yangi qoralama

1. `Writer'ga yuborish`
2. Yangi draft avtomatik ochiladi

## Texnik eslatmalar

- Backend talab qilmaydi
- Bir xil brauzer ichida ishlaydi
- `BroadcastChannel` asosida ishlaydi
- Writer yopilsa target heartbeat tugaydi va laboratoriyada bir necha soniyada yo'qoladi

## Keyingi tabiiy kengayish

Keyin shu bridge orqali:

- integral natijalari
- matrix workbench natijalari
- geometry moduli
- bir maqoladagi bir nechta linked block

ham live ulanadi
