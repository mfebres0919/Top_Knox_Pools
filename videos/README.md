# Services background video

Drop your video in this folder named **`services-bg.mp4`** and you're done —
the services section already points at `videos/services-bg.mp4`.

Want a different name or a hosted link instead? Open `index.html`, find the
`SERVICES SECTION` and edit the single `<source>` line:

```html
<source src="videos/services-bg.mp4" type="video/mp4">   <!-- local file -->
<source src="https://your-cdn.com/services-bg.mp4" type="video/mp4">  <!-- hosted -->
```

## Keep it small (important for GitHub)
- Target **8–15 seconds, looping, no audio** (the player is muted anyway).
- Aim for **under ~5 MB**. GitHub blocks files over 100 MB and warns over 50 MB.
- Compress with HandBrake (GUI) or ffmpeg:

```bash
ffmpeg -i input.mov -vf "scale=1280:-2" -an -crf 30 -preset slow \
  -movflags +faststart videos/services-bg.mp4
```
(`-an` strips audio, `-movflags +faststart` lets it start playing before fully downloaded.)

A `poster` image (`images/home/jpg/services-custom-d.jpeg`) shows instantly and
stays visible until the video loads — so the section looks right even with no
video file present yet.
