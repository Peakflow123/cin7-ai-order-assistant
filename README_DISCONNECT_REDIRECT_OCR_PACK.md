# NexOrder AI - Disconnect Redirect and OCR Pack

## What this fixes

### 1. Gmail/Outlook remove connection user experience

Before, removing a Gmail/Outlook connection showed a raw JSON message in the browser.

Now, regular form removal redirects the user back to:

```text
/email?removed=gmail
/email?removed=outlook
```

So the user stays on the Channels page instead of seeing rough JSON.

JSON responses are still supported if a future frontend uses `fetch()` with JSON headers.

### 2. OCR for image attachments

Adds OCR support for image attachments/screenshots in Gmail and Outlook order processing.

Supported image types:

```text
PNG
JPG / JPEG
WEBP
GIF
```

The OCR uses Groq vision through `GROQ_API_KEY`.

Optional environment variable:

```text
GROQ_VISION_MODEL
```

If not set, the default used by the code is:

```text
llama-3.2-90b-vision-preview
```

## Files changed

```text
app/api/gmail/connections/[id]/route.ts
app/api/outlook/connections/[id]/route.ts
lib/ocr.ts
lib/attachment-text.ts
lib/gmail.ts
README_DISCONNECT_REDIRECT_OCR_PACK.md
```

## Deploy safely

Do not run `git add .`.

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add "app\api\gmail\connections\[id]\route.ts"
git add "app\api\outlook\connections\[id]\route.ts"
git add lib\ocr.ts
git add lib\attachment-text.ts
git add lib\gmail.ts
git add README_DISCONNECT_REDIRECT_OCR_PACK.md

git commit -m "Improve connection removal UX and add image OCR"
git push origin main
npx vercel --prod
```

## Test checklist

1. Remove Gmail connection from Channels page.
2. Confirm it redirects back to `/email` instead of showing JSON.
3. Remove Outlook connection and confirm same behavior.
4. Reconnect Gmail/Outlook.
5. Send a test order screenshot as an attachment.
6. Process email and confirm OCR text is included in AI order extraction.

## Notes

OCR quality depends on image clarity. Screenshots with typed text should work better than blurry photos.
