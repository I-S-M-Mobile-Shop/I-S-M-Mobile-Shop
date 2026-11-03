# ISM Mobile Shop: Link-in-Bio

A fast, dark, mobile-first link page for ISM Mobile Shop. Plain HTML, CSS and JavaScript. No build step, no backend, no paid services.

## What's inside

```
ism-mobile-shop/
├── index.html     page structure, SEO and Open Graph tags
├── style.css      design and animations
├── script.js      share, copy link, QR dialog, toast
├── qr.js          small offline QR code generator
├── README.md
└── assets/
    ├── logo.jpg              official shop logo (profile avatar)
    ├── favicon.svg
    ├── apple-touch-icon.png
    └── og-image.jpg          preview image for shared links
```

## Features

- WhatsApp, website, TikTok, Instagram, Facebook, Google Maps and phone buttons, in that order
- Share (native share sheet; copies the link where unsupported), Copy link with a toast
- QR code of the page address, generated in the browser and downloadable as PNG
- Reduced-motion support, visible keyboard focus, all asset paths relative

## Deploy for free on GitHub Pages

1. Create a free account at https://github.com if you don't have one.
2. Create a new **public** repository named `ism-mobile-shop`.
3. Upload all project files, keeping the `assets` folder. `index.html` must be at the repository root.
4. Open the repository **Settings**.
5. Click **Pages** in the sidebar.
6. Under **Build and deployment**, set Source to **Deploy from a branch**.
7. Choose the **main** branch.
8. Select the **/ (root)** folder.
9. Click **Save**.
10. Wait one to two minutes for the deployment to finish.
11. Open your site. The address will be:

   `https://USERNAME.github.io/ism-mobile-shop/`

   Replace `USERNAME` with your GitHub username.

Put that address in your Instagram, TikTok and WhatsApp bios. The QR code and Copy link button use whatever address the page is opened from, so they update automatically.

## Optional: link preview image

Open Graph images need a full address to show in some apps. After deploying, change this line in `index.html`:

```html
<meta property="og:image" content="assets/og-image.jpg">
```

to

```html
<meta property="og:image" content="https://USERNAME.github.io/ism-mobile-shop/assets/og-image.jpg">
```

## Editing

Links and text are in `index.html`. Colors are the variables at the top of `style.css`.
