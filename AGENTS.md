<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public informational sections use separate TanStack leaf routes and a shared ContentPage shell so navigation and page metadata remain consistent.
- Desktop dropdowns and mobile expandable navigation share link definitions in the site header so both menus stay consistent.
- Uploaded brand media is referenced through Lovable Assets pointers; preserve the supplied logo instead of regenerating it.
- Editorial starter content lives in a browser-safe site-content module; do not invent named staff, partner endorsements or customer reviews.
- Visitor mutations verify a single-use, expiring database-backed image CAPTCHA before writing; staff forms already behind authentication retain their existing permission checks.
- Shared visitor controls own consent preferences and notification permission; permissions alone do not provide a push-delivery service.
- Archive photography is exposed by a shared media module; generic area imagery must not be represented as a listing's actual photograph.
- Site photos and the homepage background video are managed in the admin Media page; hero video and gallery images serve through the /api/public/site-media proxy from the private site-media bucket.
- The inspection booking form always discloses the service fee and advisor scheduling step before a request is submitted.
