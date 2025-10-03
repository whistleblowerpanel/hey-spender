# HeySpender Deployment Guide

This guide provides the necessary steps to deploy the HeySpender application and configure its backend services on Supabase.

## Step 1: Environment Variables

Your production environment requires several secret keys and configuration variables.

1.  **Navigate to Supabase:** Go to your project's dashboard.
2.  **Set Secrets:** In the left sidebar, find "Settings" > "Configuration" > "Secrets". Add the following secrets. These are used by your Edge Functions.
    *   `SUPABASE_URL`: Found in your project's API settings.
    *   `SUPABASE_ANON_KEY`: Found in your project's API settings.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Found in your project's API settings (keep this one extra safe!).
    *   `VITE_PAYSTACK_WEBHOOK_SECRET`: A strong, random string you generate. This is used to verify webhooks.

3.  **Local Environment:** Copy the `.env.example` file to a new file named `.env` in your project's root for local development. Fill in the values, especially your Paystack **test** keys. **DO NOT COMMIT `.env` TO GIT.**

## Step 2: Configure Paystack Webhook

You need to tell Paystack where to send events (like successful payments).

1.  **Find Your Webhook URL:**
    *   In your Supabase project, go to "Edge Functions".
    *   Select your payment webhook function (e.g., `process-payment-webhook`).
    *   You will see the URL for this function. It will look something like: `https://<project-ref>.supabase.co/functions/v1/process-payment-webhook`.
2.  **Add URL to Paystack:**
    *   Log in to your Paystack dashboard.
    *   Go to "Settings" > "API Keys & Webhooks".
    *   In the "Webhook URL" field, paste the URL from Supabase.
    *   In the "Secret Hash" field, paste the same random string you used for the `VITE_PAYSTACK_WEBHOOK_SECRET` in Supabase secrets.
    *   Save the changes. Paystack will now send events to your Supabase function.

## Step 3: Schedule Cron Jobs

Automated tasks for expiring claims and sending reminders are run on a schedule using cron jobs.

1.  **Navigate to Supabase:** Go to your project dashboard.
2.  **Go to Cron Jobs:** In the left sidebar, find "Edge Functions" and then select the "Cron Jobs" tab.
3.  **Schedule Claim Expiry Job:**
    *   Click "New Cron Job".
    *   **Name:** `expire-claims`
    *   **Function:** Select the Edge Function responsible for expiring claims (e.g., `expire-pending-claims`).
    *   **Schedule:** For running once every hour, use the cron expression `0 * * * *`.
    *   **Timezone:** `Africa/Lagos`.
    *   Click "Create".
4.  **Schedule Reminder Job:**
    *   Click "New Cron Job" again.
    *   **Name:** `send-reminders`
    *   **Function:** Select the `send-reminders` Edge Function.
    *   **Schedule:** For running once a day at 8:00 AM Lagos time, use `0 8 * * *`.
    *   **Timezone:** `Africa/Lagos`.
    *   Click "Create".

## Step 4: Incident Logging & Monitoring

Basic logging is available out of the box.

*   **Supabase Edge Function Logs:** In your Supabase dashboard under "Edge Functions", you can select a function to view its logs. Any `console.log()` statement in your function will appear here, which is invaluable for debugging.
*   **Paystack Dashboard:** The Paystack dashboard provides a log of all webhook attempts (successful and failed) under "Settings" > "API Keys & Webhooks". This is your first stop if payments aren't being reconciled.
*   **Browser Console:** For client-side issues, the browser's developer console is your best friend.

## Step 5: Deploy the Frontend

Your project is hosted on Hostinger.

1.  **Publish Button:** In the Hostinger Horizons AI Code Editor, click the **"Publish"** button in the top-right corner.
2.  **Automatic Deployment:** The system will automatically build your Vite project for production and deploy it to your connected Hostinger plan.
3.  **Done!** Your site is now live at your domain.

Your application is now deployed, with live webhooks and scheduled jobs configured.