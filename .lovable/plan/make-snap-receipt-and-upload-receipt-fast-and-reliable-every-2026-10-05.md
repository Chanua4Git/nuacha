# Make "Snap receipt" and "Upload receipt" fast and reliable everywhere

Covers the home page (nuacha.com/) and the app (/app → Add expense), for both guests and signed-in users, on phone and computer.

## Problems found in the code

1. **Upload button opens two pickers.** On the Upload button, an invisible file box sits on top of the button and also triggers a second picker when clicked. This can cause a double prompt, a lost selection, or the first photo being ignored.
2. **Snap on the home page reuses the upload box.** It switches one shared file box between camera and gallery mode. After one use, the mode can get stuck, so Snap opens the gallery or Upload opens the camera.
3. **Home page sends full-size phone photos.** The app shrinks large photos before reading them, but the home page sends the original 4–12 MB photo, which makes guests wait much longer.
4. **iPhone HEIC photos** are converted in the app, but not before the home-page guest path turns the photo into data to send.
5. **Snap does not open the camera when the button is used without its handlers.** The fallback just moves you to Add expense.
6. **Repeated photo previews are never cleared.** Each scan keeps its old preview in memory, so phones slow down over a session.

## What will change

- One shared, reliable receipt picker used by both pages:
  - **Snap receipt** always opens the back camera on phones, or the photo picker on computers.
  - **Upload receipt** always opens the gallery or files.
  - Choosing the same photo twice still works.
- The home page uses the same photo prep as the app (iPhone photo conversion, shrinking large photos, a quality check) before reading, for guests and signed-in users alike.
- Clear progress while reading ("Reading your receipt…"), with buttons disabled until it finishes so nobody taps twice.
- Gentle messages if the camera is blocked or a photo can't be read, with a "Type it in instead" option.
- Old previews are cleared after each scan.
- The 3-scans-a-day limit stays exactly as it is today.

## How it will be checked

- Automated browser runs as a guest at phone and computer sizes, on both / and /app?tab=add-expense: Snap and Upload each open the right picker, a sample receipt goes through and lands on the expense form, and timing is recorded before and after.
- Signed-in runs can't be done from here for this project, so you'll be asked to try one Snap and one Upload while signed in.

## Technical details

- New `src/hooks/useReceiptPicker.ts`: creates a fresh `<input type=file accept="image/*,.heic,.heif">` per click; adds `capture="environment"` for Snap only; clears its value after each pick.
- `HeroUploadSection.tsx`: remove the overlay `<input>`; both buttons call the hook; the fallback with no handlers uses the hook too, then navigates.
- `Landing.tsx`: drop the shared `fileInputRef` and route the file through the same steps as `processReceiptImage` (`convertHeicToJpeg` → `checkImageQuality` → `preprocessReceiptImage` → `handleReceiptUpload` → `processReceiptWithEdgeFunction`); add an `isProcessing` guard.
- `ExpenseForm.tsx`: replace the inline `document.createElement('input')` handlers with the hook; call `URL.revokeObjectURL` on old previews.
- `receipt/ReceiptUpload.tsx` / `UploadArea.tsx`: switch to the same hook so every entry point behaves the same.
- No database or backend changes.
