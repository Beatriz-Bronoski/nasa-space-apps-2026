# Photo miniatures

1. Add a JPEG or PNG in the existing page editor, or open a photo already in the album. Click it and choose **Keep photo** or **Create miniature**.
2. Recognition runs in the browser. Supported subjects are cats, dogs, birds, teddy bears, cups, bottles, cars and airplanes. If the subject is unclear, the original photo stays on the page.
3. The photo folds into a faceted miniature colored and proportioned from the detected subject. Reduced motion skips the transition. The miniature sits on the paper under a fixed overhead camera.
4. Hover over the miniature for a rotation cue. Drag the miniature itself to rotate in any direction. With keyboard focus, use the arrow keys to rotate and Home to reset.
5. Click, tap or press Enter to rate the result, generate another variation or restore the original photo. Drafts and published pages use the album's existing browser storage.

The static export includes the detection models and browser runtime. Recognition starts only after confirmation. The dog and cat classifier checks the detected crop before a miniature is generated. Asset sources and licenses are in [the model notice](../public/ai/NOTICE.md).
