- Preview: https://spacemuse-hwyttcac4-nbaphu08.vercel.app (Vercel project `spacemuse`; `.vercelignore` excludes materials/ because of the 100 MB upload limit; may be behind Deployment Protection).

## M0 part 2 / M1 content start (Sonnet)
- Done: `content/{sources,exhibits,teaser,silence,site}.ts` (12 exhibits, S1–S70), `components/museum/{ExhibitPanel,ExhibitContent,Plaque,ThenNowSlider,SourceList,PageVisit}`, `components/ui/AgeCounter`, routes `/exhibit/[slug]` (12 static pages), `/gallery`, `/about`. Build + lint clean.
- Dropped/adjusted vs COPY: Spirit "unable to tilt its solar panels toward the Sun" clause removed ("Stuck in soft soil, Spirit faced…"); Hall of Silence heritage paragraph no longer claims "asking future visitors to keep their distance" (S13 not read); "Lưu ý" notes never displayed.
- Verified true: SM-L-001, L-005, M-001, M-002, M-003, M-005, M-006, M-007. False: L-002, L-003, L-004, M-004 (see CHANGE_REQUESTS).
- Next: mount `<ExhibitPanel/>` in the journey (Fable's files), 3D viewer in panel, passport/certificate, Hall of Silence + Hall III components.
- Risks: panel ←/→ listens on document; Journey must pause its engine while `activeExhibit` is set. Preview URL: not deployed (orchestrator deploys after merge).
