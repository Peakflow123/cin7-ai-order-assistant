# NexOrder AI - Groq OCR Model Fix

## Problem

OCR failed with:

```text
model_decommissioned
llama-3.2-90b-vision-preview has been decommissioned
```

## Fix

This pack updates the default Groq vision model from:

```text
llama-3.2-90b-vision-preview
```

to:

```text
qwen/qwen3.6-27b
```

It also includes a safety fallback. If `GROQ_VISION_MODEL` is still set to an old deprecated model in Vercel, the code automatically uses:

```text
qwen/qwen3.6-27b
```

## Files changed

```text
lib/ocr.ts
README_GROQ_OCR_MODEL_FIX.md
```

## Deploy safely

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

git add lib\ocr.ts
git add README_GROQ_OCR_MODEL_FIX.md

git commit -m "Update Groq OCR vision model"
git push origin main
npx vercel --prod
```

## Optional Vercel environment cleanup

Go to Vercel -> Project -> Settings -> Environment Variables.

If this variable exists:

```text
GROQ_VISION_MODEL
```

Set it to:

```text
qwen/qwen3.6-27b
```

or delete it and let the app use the default.

Then redeploy once.

## Test

Send a Gmail or Outlook email with a screenshot attachment and process the email again. The OCR should now produce extracted text instead of `model_decommissioned`.
