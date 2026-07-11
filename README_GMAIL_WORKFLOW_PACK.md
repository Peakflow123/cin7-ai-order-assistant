# NexOrder AI - Gmail Workflow Pack

This pack adds practical Gmail functionality:

1. Load recent Gmail emails from a connected mailbox.
2. Show subject, sender, date, snippet, attachment names, and processed status.
3. Process a selected Gmail email with AI.
4. Create a NexOrder AI review order from the Gmail email.
5. Prevent duplicate processing of the same Gmail message.
6. If auto-create threshold is met, automatically create the Cin7 order.
7. Otherwise, send the user to the normal review screen.

## Important
This pack reads email body text and lists attachment names. It does not yet parse PDF/Excel/image attachment contents. That can be the next phase.

## Copy files
Copy all files into your existing project and replace files.

## Push
```cmd
cd C:\Users\Dell\Downloads\cin7-ai-order-assistant
git add .
git commit -m "Add Gmail inbox reading and email processing"
git push
```

## Test
1. Go to Input Channels.
2. Confirm Gmail is connected.
3. Click Load Recent Emails.
4. Click Process Email on an order email.
5. Review the created order.
