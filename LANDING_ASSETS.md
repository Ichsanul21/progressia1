# Landing Page Assets

This file lists suggested Unsplash + Pexels URLs for the landing page photos. All components currently use CSS gradient placeholders so the page renders correctly without these. Replace each placeholder with a downloaded file when ready.

## Workflow

1. Browse each URL below
2. Download a photo that fits the slot (aspect ratio + tone)
3. Compress to WebP (~150KB target per image). Tools: `cwebp`, Squoosh, or ImageMagick
4. Save to `public/landing/photos/<slot>.webp` using the slot name below
5. Update the corresponding component to use the asset

Once all photos are in place, also re-check the gradient fallback in `resources/js/components/landing/hero.tsx` and replace with `<img src="/landing/photos/hero.webp" />`.

## Hero

- **Slot**: `hero`
- **Aspect**: 4:5 (vertical portrait) — currently shown as 4/5
- **Size**: ~1200x1500
- **Theme**: Engineer, project manager, atau site supervisor dengan tablet/laptop. Hindari close-up wajah, pilih medium shot.
- **Search keywords**: "construction site engineer", "project manager tablet", "site supervisor laptop"
- **Suggested sources**:
  - Unsplash: https://unsplash.com/s/photos/construction-site-engineer
  - Pexels: https://www.pexels.com/search/construction%20engineer/

## Features (3 slots)

- **Slot**: `feature-1` — Gantt / planning / calendar
  - Aspect: 4:3 landscape
  - Theme: Kalender meja, sticky notes, atau laptop dengan timeline
  - Search: "project planning", "gantt chart", "calendar planning"
- **Slot**: `feature-2` — Team collaboration
  - Aspect: 4:3 landscape
  - Theme: Tim meeting / diskusi di ruang meeting
  - Search: "team meeting", "office collaboration", "construction team"
- **Slot**: `feature-3` — Progress lapangan
  - Aspect: 4:3 landscape
  - Theme: Pekerja lapangan / site progress
  - Search: "construction worker", "building site", "construction progress"

## Solutions (4 slots)

- **Slot**: `solution-konstruksi` — Bangunan tinggi / konstruksi
  - Aspect: 4:3 landscape
  - Search: "high-rise construction", "skyscraper construction"
- **Slot**: `solution-agensi` — Kantor agensi / creative
  - Aspect: 4:3 landscape
  - Search: "creative agency office", "design studio"
- **Slot**: `solution-internal` — Internal team / corporate
  - Aspect: 4:3 landscape
  - Search: "modern office workspace", "corporate team"
- **Slot**: `solution-manufaktur` — Pabrik / manufacturing
  - Aspect: 4:3 landscape
  - Search: "factory floor", "manufacturing plant", "industrial worker"

## Testimonials (3 slots)

- **Slot**: `testimonial-1`, `testimonial-2`, `testimonial-3`
- **Aspect**: 1:1 square (untuk avatar bulat) atau 4:5 portrait
- **Theme**: Portrait profesional orang Indonesia / Asia Tenggara. Pilih ekspresi friendly, professional.
- **Search**: "professional headshot asian", "business portrait southeast asia", "indonesian professional"
- **Alt**: Kalau tidak ada stok cocok, pakai avatar inisial (placeholder) di komponen tanpa download foto.

## Final CTA (1 slot)

- **Slot**: `final-cta-bg`
- **Aspect**: 16:9 wide (background overlay dengan opacity rendah)
- **Theme**: Cityscape konstruksi / wide angle site. Akan di-overlay dengan gradient dark.
- **Search**: "construction cityscape", "building site wide", "jakarta skyline construction"

## Sumber rekomendasi

- **Unsplash** — https://unsplash.com (license: free untuk komersial)
- **Pexels** — https://pexels.com (license: free untuk komersial)
- **Pixabay** — https://pixabay.com (license: CC0, lebih variatif)
- **Unsplash Source API** — Untuk quick prototype (random, kurang konsisten)

## Color & tone guidance

Pilih foto dengan tone netral (warm-cool balance). Hindari foto dengan color cast terlalu kuat (sangat biru, sangat kuning, sangat merah) karena akan clash dengan brand cyan Progressia. Foto dengan background blur atau soft focus akan lebih mudah di-blend dengan overlay gradient cyan kita.
