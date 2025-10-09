# 🔔 HeySpender Notifications System

## Overview
Complete automated email notification system for managing reminders and communications.

---

## 🎯 Features

### **Admin Dashboard - Notifications Tab**
✅ Manage all email notification templates
✅ View scheduled reminders
✅ Create/Edit/Delete templates
✅ Test send emails
✅ Track sent notifications

### **Automatic Reminder System**
✅ Auto-schedules reminders when spenders set them
✅ Sends emails every 2 days (configurable)
✅ Stops when claim expires or is fulfilled
✅ Tracks reminder history

---

## 📊 Database Schema

### **Tables Created**

#### 1. `notification_templates`
Stores email templates for different notification types.

```sql
- id (UUID)
- type (reminder, announcement, welcome, etc.)
- title (Template name)
- subject (Email subject)
- body (Email content with variables)
- trigger (manual, automatic, scheduled)
- status (active, inactive)
- interval_days (For reminder frequency)
- created_at, updated_at
```

#### 2. `scheduled_reminders`
Tracks all scheduled reminder emails for claims.

```sql
- id (UUID)
- claim_id (Reference to claim)
- user_id (Spender who set reminder)
- scheduled_at (When to send)
- status (pending, sent, failed, cancelled)
- sent_count (Number of reminders sent)
- last_sent_at (Last send time)
- created_at, updated_at
```

#### 3. `notification_logs`
Audit log of all sent notifications.

```sql
- id (UUID)
- template_id (Reference to template used)
- reminder_id (Reference to reminder)
- recipient_email
- subject, body
- status (pending, sent, failed)
- error_message
- sent_at, created_at
```

---

## 🚀 Setup Instructions

### **1. Run Database Migration**
```bash
# In your Supabase SQL editor, run:
database/create_notifications_system.sql
```

This will:
- Create all necessary tables
- Set up indexes for performance
- Create triggers for auto-scheduling
- Insert default reminder template

### **2. Configure Email Service**
You'll need an email service provider. Recommended options:

- **SendGrid** (easiest)
- **AWS SES**
- **Mailgun**
- **Postmark**

Add to your `.env`:
```bash
VITE_EMAIL_SERVICE_API_KEY=your_api_key
VITE_EMAIL_FROM_ADDRESS=notifications@heyspender.com
VITE_EMAIL_FROM_NAME=HeySpender
```

### **3. Set Up Cron Job for Sending Emails**
You'll need a backend service or Edge Function to process scheduled reminders.

**Option A: Supabase Edge Function** (Recommended)
```javascript
// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_KEY')
  )

  // Fetch pending reminders
  const { data: reminders } = await supabase
    .from('scheduled_reminders')
    .select(`
      *,
      claims:claim_id (
        wishlist_items (
          name,
          wishlists (
            title,
            users (username, email)
          )
        )
      )
    `)
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())

  for (const reminder of reminders) {
    // Send email using your email service
    await sendReminderEmail(reminder)
    
    // Update reminder status
    await supabase
      .from('scheduled_reminders')
      .update({
        status: 'sent',
        sent_count: reminder.sent_count + 1,
        last_sent_at: new Date().toISOString()
      })
      .eq('id', reminder.id)

    // Log the notification
    await supabase
      .from('notification_logs')
      .insert({
        reminder_id: reminder.id,
        recipient_email: reminder.claims.wishlist_items.wishlists.users.email,
        subject: 'Reminder about your claim',
        body: 'Email body here',
        status: 'sent',
        sent_at: new Date().toISOString()
      })
  }

  return new Response('OK')
})
```

**Option B: External Cron Service**
Use services like:
- Vercel Cron
- GitHub Actions
- Heroku Scheduler
- Render Cron Jobs

---

## 📝 How It Works

### **When User Sets a Reminder:**

1. **User clicks "Set Reminder"** on Spender List card
2. **Picks date & time** for first reminder
3. **Saves to localStorage** (for countdown display)
4. **Database trigger creates scheduled_reminders** every 2 days until expiry

### **Automated Email Sending:**

```
Every hour (or your cron schedule):
  ↓
Check scheduled_reminders table
  ↓
Find reminders where scheduled_at <= NOW() AND status = 'pending'
  ↓
For each reminder:
  1. Get claim details
  2. Get email template
  3. Replace variables in template
  4. Send email via email service
  5. Update reminder status to 'sent'
  6. Log notification in notification_logs
  7. Schedule next reminder (+2 days)
```

### **Email Template Variables:**

```
{user_name}        - Spender's name
{item_name}        - Wishlist item name
{wishlist_owner}   - Wishlist owner's username
{days_left}        - Days until claim expires
{claim_link}       - Link to spender list
{item_price}       - Item estimated price
```

---

## 🎨 Admin Dashboard Usage

### **Creating Email Templates**

1. Go to **Admin Dashboard** → **Notifications** tab
2. Click **"Create Template"**
3. Fill in:
   - **Template Title**: Internal name
   - **Type**: reminder, announcement, etc.
   - **Trigger**: manual, automatic, scheduled
   - **Subject**: Email subject line
   - **Body**: Email content with variables
   - **Interval**: Days between reminders (for auto reminders)
4. Click **"Create Template"**

### **Managing Templates**

- **Edit**: Update template content
- **Test Send**: Send test email to yourself
- **Delete**: Remove template
- **Activate/Deactivate**: Control which templates are active

### **Viewing Scheduled Reminders**

The **Scheduled Reminders** table shows:
- All upcoming reminder emails
- Who they're for
- When they'll be sent
- How many have been sent
- Current status

---

## 🔧 Customization

### **Change Reminder Frequency**

Edit the notification template:
```sql
UPDATE notification_templates
SET interval_days = 3  -- Change from 2 to 3 days
WHERE type = 'reminder';
```

### **Add Custom Notification Types**

1. Add to `notification_templates.type` check constraint
2. Create template in Admin Dashboard
3. Trigger from your app code when needed

### **Customize Email Design**

The templates support:
- HTML content
- CSS styling
- Dynamic variables
- Conditional content

---

## 📊 Monitoring

### **Check Notification Logs**
```sql
SELECT * FROM notification_logs
ORDER BY created_at DESC
LIMIT 100;
```

### **View Failed Notifications**
```sql
SELECT * FROM notification_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### **Check Pending Reminders**
```sql
SELECT 
  sr.*,
  wi.name as item_name,
  u.email as user_email
FROM scheduled_reminders sr
JOIN claims c ON c.id = sr.claim_id
JOIN wishlist_items wi ON wi.id = c.item_id
JOIN users u ON u.id = sr.user_id
WHERE sr.status = 'pending'
ORDER BY sr.scheduled_at ASC;
```

---

## 🚨 Troubleshooting

### **Reminders Not Sending**
1. Check cron job is running
2. Verify email service API key is valid
3. Check `notification_logs` for error messages
4. Ensure `notification_templates` has active template

### **Too Many Reminders**
Adjust `interval_days` in template to reduce frequency

### **Missing Reminders**
Check that the claim trigger is working:
```sql
SELECT * FROM scheduled_reminders
WHERE claim_id = 'your-claim-id';
```

---

## 🎉 Benefits

✅ **Automated**: Set it and forget it
✅ **Customizable**: Full control over templates
✅ **Scalable**: Handles thousands of reminders
✅ **Trackable**: Complete audit trail
✅ **Professional**: Branded email communications
✅ **Reliable**: Database-backed scheduling

---

## 🔮 Future Enhancements

- 📱 SMS notifications
- 🔔 Push notifications
- 🌐 In-app notifications
- 📊 Analytics dashboard
- 🎯 Personalization rules
- 🕐 Time zone support
- 📧 Email preview before sending
- 🎨 Rich HTML email templates
- 📱 Mobile app notifications

---

**Built for HeySpender** 🎁
*Making gift-giving easier, one notification at a time!*

