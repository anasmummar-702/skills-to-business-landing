# Skills to Business — Landing Page

A one-page, mobile-friendly landing page for 1-on-1 mentorship in **Coding** and **Digital Marketing**. Every course button opens WhatsApp with the course details already filled in.

## Sections
1. **Hero** – headline, two buttons, intro video and a short description
2. **Student stories** – three cards with illustrations (swap in real photos any time)
3. **What you'll learn** – a video and benefits for each course
4. **Choose your course** – Coding and Digital Marketing (1 month, $149 each) plus a 6-month Master Plan ($299), each with a WhatsApp button

## Quick setup (edit the top of `app.js`)
- `WHATSAPP_NUMBER` – your number with country code, e.g. `'+91 98765 43210'`
- `VIDEO_LINKS` – paste YouTube, Vimeo, Google Drive or `.mp4` links for `intro`, `coding` and `marketing`

## Editing content
- **Prices:** in `index.html`, change `data-pkg-price` (offer price) and `data-pkg-was` (original price). The discount badge, "You save" line and WhatsApp message update automatically.
- **Student photos:** add `assets/student-1.jpg`, `student-2.jpg` and `student-3.jpg`; they replace the illustrations automatically.
- **Fonts:** headings use Manrope and sub-headings use Times New Roman (Tinos on phones); both are bundled in `assets/fonts`.

> The three student stories are samples. Replace them with real students' stories before going live.

## Run it
No build step needed. Open `index.html` in a browser, or host the folder on GitHub Pages, Netlify or any static host.

## Credits
- Illustrations: [Notionists](https://heyzoish.gumroad.com/l/notionists) by Zoish (CC0), via DiceBear
- Fonts: Manrope and Tinos (SIL Open Font License)
