# Image credits

Album-cover photographs are illustrative stock memories, not depictions of the fictional participants or of real astronauts. All files are self-hosted JPEG crops at 720 × 720 pixels, downloaded on 14 November 2026. No runtime request to Unsplash is required.

| Local file               | Photographer   | Original photograph                                                                                                                          | File size     |
| ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `public/images/lily.jpg` | Erwin Bosman   | [Child digging in sand with a shovel at the beach](https://unsplash.com/photos/child-digging-in-sand-with-a-shovel-at-the-beach-FxOWW-x7kFM) | 105,886 bytes |
| `public/images/sam.jpg`  | Simon Maisch   | [Lake in the middle of mountains](https://unsplash.com/photos/lake-in-the-middle-of-mountains-lawlMewb8Xg)                                   | 86,404 bytes  |
| `public/images/maya.jpg` | Justin Buisson | [People hiking on a mountain trail](https://unsplash.com/photos/people-hiking-on-mountain-trail-vIluu0IH6Ps)                                 | 95,365 bytes  |
| `public/images/june.jpg` | Amie Roussel   | [A woman holding a bouquet of flowers in a garden](https://unsplash.com/photos/a-woman-holding-a-bouquet-of-flowers-in-a-garden-rvh3HHWlRu0) | 117,707 bytes |

Each original page states that its photograph is free to use under the [Unsplash License](https://unsplash.com/license). The license permits downloading and using images for commercial and noncommercial purposes. It prohibits selling unmodified images and compiling them into a competing image service. Attribution is retained here as a courtesy. The Unsplash License does not imply endorsement, identity, or consent for every sensitive context; obtain appropriate rights and review imagery before a real clinical or mission deployment.

Images were resized and cropped through Unsplash's image service (`fit=crop&w=720&h=720&q=78`). The people pictured are unrelated to the fictional album names. Covers are decorative examples and should be replaced by participant-chosen memories in a deployed multiuser service.

## Rustic bookshelf

The cabinet reuses the existing self-hosted wood and aged-paper materials below. Cloth-bound spines, raised bands, sewn labels, corner mounts, and the small sprout emblem in `Bookshelf.tsx` are original CSS/SVG construction. The shelf and flying cover share the same content renderer. No new raster images or external asset requests were introduced for this revision.

## Generated physical materials

The following original material textures were generated with the built-in OpenAI image-generation tool on 15 November 2026 for this application. They contain no photographs of people, text, logos, or third-party artwork. The generated PNG originals were retained outside the repository; project copies were resized and JPEG-compressed with the existing Sharp dependency, without content editing.

| Local file                        | Material                                                                                       | Dimensions  | File size     |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ----------- | ------------- |
| `public/textures/rustic-wood.jpg` | Matte rustic walnut/oak tabletop, horizontal grain, gentle wear, natural light from upper-left | 1536 × 1024 | 263,174 bytes |
| `public/textures/aged-paper.jpg`  | Pale yellowed ivory album paper with fine cellulose fibers and gentle mottling                 | 768 × 768   | 56,806 bytes  |

Both files are self-hosted. The wood texture is a full-frame surface, not a repeating seamless tile. The paper texture is deliberately subtle to preserve readable dark ink. Full generation prompts and the built-in generation method are recorded in [MATERIAL_PROMPTS.md](MATERIAL_PROMPTS.md) and the delivered `material-prompts.txt` artifact.

Handwriting uses self-hosted [Caveat](https://fontsource.org/fonts/caveat) 400 and 600 and [Kalam](https://fontsource.org/fonts/kalam) 400 from the pinned Fontsource 5.3.0 packages, under OFL-1.1. Their license files are retained under `public/licenses/` and in the installed packages; no runtime font-service request is needed. The woven cover tile `public/textures/cloth-weave.svg` and the ten stitched applique SVGs in `StickerArt.tsx` are original code-native artwork. Generated image textures are decorative materials, not photographs of an actual participant’s belongings.

## Open-album reference revision

The reference supplied on 15 November 2026 is used as visual guidance only. Its people, plant photographs, Portuguese text, and complete image are not included as application assets. The current reader's tan background reuses `aged-paper.jpg` with a CSS color wash; the former rustic wood file remains in the repository. No new raster generation or external image download was required for this revision.

The added Caveat 400 stylesheet comes from the already installed, pinned Fontsource package under OFL-1.1. The olive sprigs in `AlbumNameplate.tsx` are original code-native artwork. Photo corners, ruled paper, tape, and pencil underlines use CSS or inline vector artwork.
