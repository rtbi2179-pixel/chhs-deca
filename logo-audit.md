# Blue Blazer Logo Audit

The project currently references two stored logo assets:

- `/manus-storage/Untitleddesign_c1fb0d88.png`: 2000×2000 Blue Blazer suit-and-B mark on a light background. This is the canonical Blue Blazer brand mark already used by the signed-out welcome surface and the Home footer.
- `/manus-storage/blue-blazer-logo_d8b42460.png`: 512×512 white open-book icon on a transparent/dark presentation. This is a legacy study/navigation icon used by the unused top Navigation component, not the primary Blue Blazer wordmark.

The active authenticated SidebarNavigation currently renders a text-only `BB` gradient badge in its desktop expanded/collapsed brand header and mobile top bar. The restoration should replace those text-only badges with the canonical `/manus-storage/Untitleddesign_c1fb0d88.png` asset while retaining the `BLUE BLAZER` / `CHHS DECA` wordmark and responsive sizing. The existing Home footer and SignedOutWelcome canonical logo references should remain unchanged. The legacy Navigation component will remain untouched because it is not imported by the active App shell.
