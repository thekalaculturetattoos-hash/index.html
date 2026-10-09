# The Kala Culture Tattoos — Website

Fresh build for **The Kala Culture Tattoos**, tattoo studio in Vadodara (Vasna-Bhayli).
Single-page site, no frameworks, no build step — deploy as-is on GitHub Pages / Netlify / any static host.

## Structure

```
index.html      — page markup + SEO meta + JSON-LD (TattooParlor, FAQPage)
styles.css      — all styling (dark + gold theme, responsive)
script.js       — gallery, lightbox, FAQ, counters, mobile nav
images/         — artist.webp, hero-bg.webp, clients/client-01..10.webp
gallery/        — custom-designs / fine-line / cover-up / realism / colour-tattoos / realism / matching (WebP, optimized)
```

## Image notes

- All images are local, lowercase paths, `.webp` — no more broken `images/Clients` vs `images/clients` case-mismatch bug from the old repo.
- Converted from the original repo's PNG/JPEG sources and resized for web (~2.8 MB total vs ~67 MB before).
- `gallery/realism`, `gallery/sleeve`, `gallery/matching-tattoo` had no photos in the original repo, so those styles link to Instagram instead of showing empty/broken tiles.

## Deploy

```bash
git remote add origin <new-github-repo-url>
git branch -M main
git push -u origin main
```

Then enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).
Custom domain `thekalaculturetattoos.in` is set as canonical — add a `CNAME` file with that domain if DNS is pointed at GitHub Pages.

## Edit

- Phone/WhatsApp: search `919157714414`
- Instagram: search `thekalaaculturetattoos`
- Reviews link: search `maps.app.goo.gl`
- Gallery photos: drop `.webp` files in `gallery/<category>/` and update the ranges in `script.js` (`addRange(...)`).
