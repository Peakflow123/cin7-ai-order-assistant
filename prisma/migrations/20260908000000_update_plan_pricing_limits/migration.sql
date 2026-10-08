UPDATE "Company" SET "monthlyOrderLimit" = 300, "maxGmailConnections" = 1, "maxOutlookConnections" = 1 WHERE LOWER("planName") = 'starter';
UPDATE "Company" SET "monthlyOrderLimit" = 600, "maxGmailConnections" = 3, "maxOutlookConnections" = 3 WHERE LOWER("planName") = 'professional';
UPDATE "Company" SET "monthlyOrderLimit" = 1000, "maxGmailConnections" = 5, "maxOutlookConnections" = 5 WHERE LOWER("planName") = 'business';
