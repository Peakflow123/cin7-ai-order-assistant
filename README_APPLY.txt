NexOrder AI - Duplicate Prevention + Smarter Recognition Engine
================================================================

WHAT THIS DOES
- Stops duplicate orders from replies in the same thread (unless there is a NEW PO
  number or NEW line items — that still respects the admin auto-create threshold).
- Stops duplicate orders when the SAME email is sent to MULTIPLE connected mailboxes
  (uses the email Message-ID, deduped across the whole company).
- Flags "possible duplicates" (same PO, or same customer+items within 72h) and holds
  them in REVIEW instead of silently creating or dropping them.
- Stronger junk filtering: supplier POs, invoices, shipping notices, marketing and
  quotes are classified precisely and NOT imported (quotes go to review).
- Never auto-creates when there are 0 line items or when a possible duplicate is flagged.
- Respects the admin minimum matching threshold everywhere.

=================================================================
PART 1 - REQUIRED FILES (copy these into your project, replace when asked)
=================================================================
  prisma/schema.prisma                         (replace)
  prisma/migrations/20260828000000_dedupe_engine/migration.sql   (new)
  lib/ai.ts                                    (replace)
  lib/email-order.ts                           (replace)
  lib/gmail.ts                                 (replace)
  lib/outlook.ts                               (replace)
  app/api/gmail/process/route.ts               (replace)
  app/api/outlook/process/route.ts             (replace)

HOW TO APPLY PART 1
1. Extract this ZIP.
2. Copy the folders  prisma  lib  app  into your project root:
     C:\Users\Dell\Downloads\cin7-ai-order-assistant
3. Choose "Replace the files in the destination".

=================================================================
PART 2 - OPTIONAL "Possible duplicate" red badge in the review lists
=================================================================
Only apply these if your current files match (they are the redesign versions).
  optional-badges/app/orders/page.tsx  -> copy to  app/orders/page.tsx
  optional-badges/app/mobile/page.tsx  -> copy to  app/mobile/page.tsx
(These just add a red "Possible duplicate" badge. If you are unsure, skip Part 2
 and tell me — I will wire the badge to your exact current files.)

=================================================================
DEPLOY
=================================================================
  cd C:\Users\Dell\Downloads\cin7-ai-order-assistant

  git add prisma\schema.prisma
  git add prisma\migrations\20260828000000_dedupe_engine\migration.sql
  git add lib\ai.ts lib\email-order.ts lib\gmail.ts lib\outlook.ts
  git add app\api\gmail\process\route.ts app\api\outlook\process\route.ts
  (only if you applied Part 2:)
  git add app\orders\page.tsx app\mobile\page.tsx

  git commit -m "Add duplicate prevention and smarter email recognition"
  git push origin main

The Vercel build runs the migration automatically (prisma migrate deploy).

=================================================================
ROLLBACK (if anything goes wrong)
=================================================================
  git reset --hard stable-before-redesign
  git push origin main --force-with-lease
(The migration only ADDS columns, so it is safe; rolling back code is enough.)

=================================================================
IMPORTANT - AUTO POLL PATH
=================================================================
The manual "Process Email" button now has full duplicate protection.
If you also use the automatic Gmail/Outlook cron poll (/api/cron/...), send me that
file and I will apply the same dedupe there. Manual processing is fully protected now.
