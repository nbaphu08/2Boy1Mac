---
name: spacemuse-ship
description: Shipping and submission procedure for SpaceMuse — feature freeze, preview/production deploy hand-off, 30-second demo video capture, and Space Apps submission checklist. Use from milestone M4 onward or when asked to deploy, record the demo, or prepare the submission.
---

# SpaceMuse ship procedure

Full texts (project summary, demo script, subtitles) are in `docs/SUBMISSION.md`.

## Timeline (Sat 15 Nov)
- 14:00 **Feature freeze.** Only bug fixes after this.
- 15:00 Run `spacemuse-review` fully. Fix only FAILs.
- 16:00 Humans promote the preview to production (agents never run `vercel --prod`).
- 16:30 Record demo video (below). 17:30 subtitles + upload (YouTube unlisted or Google Drive, **public link**).
- 18:00–20:00 Humans fill the Space Apps submission form. Buffer until 23:59.

## Demo video capture (≤ 30 s, English subtitles)
1. Chrome, window 1920×1080, hide bookmarks bar, macOS Do Not Disturb on.
2. Record with macOS screen recording (`Cmd+Shift+5`) or OBS at 60 fps.
3. Follow the shot list in `docs/SUBMISSION.md` §2 (hero → liftoff → space → Apollo 11 panel → Opportunity panel → Hall of Silence → end card).
4. Trim and add subtitles + end card with `ffmpeg` or iMovie/CapCut. Burned-in subtitles are safest:
   `ffmpeg -i demo.mov -vf "subtitles=demo.srt:force_style='FontName=Inter,FontSize=22,OutlineColour=&H80000000,BorderStyle=3'" -c:v libx264 -crf 20 -pix_fmt yuv420p demo.mp4`
   (`docs/SUBMISSION.md` §3 contains `demo.srt`.)
5. Check: ≤ 30 s, subtitles readable, no personal notifications visible.

## Submission checklist
- [ ] Project title, summary, details (from `docs/SUBMISSION.md` §1)
- [ ] Demo link public (open in a private window to verify)
- [ ] Final project link = production URL (and GitHub repo if required)
- [ ] NASA data & resources list (`docs/SUBMISSION.md` §4)
- [ ] AI usage disclosure if the 2026 guide asks for it (`docs/SUBMISSION.md` §5)
- [ ] Team members listed
- [ ] Re-read the 2026 Project Submission Guide for any new field
