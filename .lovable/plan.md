# Fix the "Add your WhatsApp number" link

## What's going wrong
1. **Already signed in, but sent to Sign in anyway.** When the link opens, the app takes a moment to check who you are. The WhatsApp link doesn't wait for that check, so it treats you as signed out and sends you to the Sign in page.
2. **After signing in, you land on the home page instead of the WhatsApp box.** The "open the WhatsApp box next" note is only kept in that one tab, and only for that site address. Google and Facebook sign-in send you back to the plain home page, sometimes on a different site address (your screenshot ends up on preview--nuacha.lovable.app), so the note gets lost.

## What will change
- If you're already signed in, `nuacha.com/?add=whatsapp` waits for the sign-in check, then opens the "Add your WhatsApp number" box straight away. No trip to Sign in.
- If you're signed out, we note that you're on your way to add a number (the note lasts 30 minutes), then show Sign in with a short line at the top: "Sign in to add your WhatsApp number."
- After you sign in by email, Google or Facebook, you come back to `/?add=whatsapp` and the box opens right away, with no other pop-ups in front of it.
- Once you save your number or tap Later, the `?add=whatsapp` is removed from the address, so a refresh doesn't open the box again.
- The box opens even if you already have a number saved, so you can change it.

## Technical details
- `WhatsAppNumberPrompt.tsx`: read `isLoading` from `useAuth`, and do nothing until it is false. Swap `sessionStorage` for `localStorage` (`wa_prompt_pending`, which stores a timestamp and expires after 30 minutes). Signed in plus pending opens the box. Signed out goes to `navigate('/login?next=/?add=whatsapp')`. If a phone number exists, fill it in ahead of time. After save or Later, run `navigate(pathname, { replace: true })`. Skip the automatic daily prompt while a link-triggered prompt is open.
- `socialLogin.ts` and the email sign-in: use `next` (or the pending flag) as the return address after Google/Facebook sign-in (`window.location.origin + next`), and go to `next` after an email sign-in succeeds. Only allow `next` values that start with `/`, so the link can't send people to another website.
- Check it by opening `/?add=whatsapp` signed in (the box opens and you stay on the page) and signed out (Sign in page, then the box opens after an email sign-in).
