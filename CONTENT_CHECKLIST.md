# Brie Cakes Launch Content Checklist

Use this checklist to collect the final customer details before publishing the site.

## Contact Details

- WhatsApp number in international format: `27685533304`
- Public phone number: `068 553 3304`
- Public email address: `politendoro@gmail.com`
- Facebook page or profile URL

## Pricing

- Small cakes starting price
- Medium cakes starting price
- Large custom cakes starting price
- Cupcakes starting price per dozen
- Dessert treats starting price
- Wedding and event cake quote note, if the current wording should change

## About Polite

- Final professional photograph of Polite Ndoro
- Short personal story
- Baking experience or background
- Customer service promise

## Gallery

Add real Brie Cakes photos to `assets/`. Use descriptive filenames, such as:

- `birthday-cake-pink-florals.jpg`
- `childrens-cake-unicorn-theme.jpg`
- `cupcakes-pastel-party-box.jpg`
- `celebration-cake-gold-detail.jpg`
- `special-order-dessert-table.jpg`

Avoid stock images. The gallery should show real work from Brie Cakes.

## Final Checks

Run:

```bash
cmd.exe /c npm.cmd test
```

Then run:

```bash
cmd.exe /c npm.cmd run check:launch
```

The launch check should pass only after every bracket placeholder has been replaced, the WhatsApp links include a real recipient number, Facebook has been added, and real gallery images exist in `assets/`.
If it fails, use the reported file name and line number to update the exact field.

If you update the JSON-LD structured data in `index.html`, run:

```bash
cmd.exe /c npm.cmd run sync:csp
```
