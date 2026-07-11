# NexOrder AI - Groq Token Optimization Pack

This pack reduces Groq token usage and rate-limit errors.

## What changed

1. Gmail list/loading now uses only:
   - Subject
   - Sender
   - Snippet
   - Attachment names

2. Gmail list/loading does NOT parse full attachments anymore.

3. Full body + PDF/Excel/DOCX/TXT attachment parsing happens only when clicking:

```text
Process Email
```

4. Classification uses a smaller model by default:

```text
GROQ_CLASSIFIER_MODEL=llama-3.1-8b-instant
```

5. Extraction still uses:

```text
GROQ_MODEL=llama-3.3-70b-versatile
```

6. Added `max_tokens` limits and one retry for Groq rate-limit errors.

## Optional Vercel variable

Add this if you want to control the classifier model:

```text
GROQ_CLASSIFIER_MODEL=llama-3.1-8b-instant
```

## Deploy

Copy files into project and replace existing files, then:

```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Optimize Groq token usage for Gmail classification"
git push origin main
npx vercel --prod
```
