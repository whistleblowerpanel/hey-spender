# 🚀 Notifications System - Quick Start

## ✅ What's Been Built

### **1. Admin Dashboard - Notifications Tab**
- Full-featured notification management interface
- Create, edit, delete email templates
- View scheduled reminders
- Track sent notifications
- Test send functionality

### **2. Database Schema**
- `notification_templates` - Email templates
- `scheduled_reminders` - Scheduled emails for claims
- `notification_logs` - Audit trail of sent emails
- Automatic triggers for scheduling

### **3. Automated Reminder System**
- Auto-schedules reminders when users set them
- Sends emails every 2 days by default
- Configurable interval per template
- Stops when claim expires or is fulfilled

---

## 🎯 How to Use

### **Step 1: Run Database Migration**
In your Supabase SQL Editor:
```sql
-- Run the file: database/create_notifications_system.sql
```

### **Step 2: Access Admin Dashboard**
1. Go to `/admin/dashboard`
2. Click **"Notifications"** tab
3. You'll see:
   - Total Templates
   - Active Templates  
   - Scheduled Reminders

### **Step 3: Create Your First Template**
Click **"Create Template"** and fill in:
- **Title**: "2-Day Reminder"
- **Type**: Reminder Email
- **Subject**: "Don't forget about {item_name}!"
- **Body**: Your email content
- **Interval**: 2 days
- **Status**: Active

### **Step 4: Set Up Email Sending (Required)**
You need to set up a cron job to actually send the emails.

**Option A: Supabase Edge Function**
```bash
# Create edge function
supabase functions new send-reminders

# Deploy
supabase functions deploy send-reminders --no-verify-jwt

# Schedule to run every hour
# Set up in Supabase Dashboard → Database → Cron Jobs
```

**Option B: External Service**
Use Vercel Cron, GitHub Actions, or any scheduler to call your API every hour.

---

## 📧 Email Variables

Use these in your templates:
- `{user_name}` - Spender's name
- `{item_name}` - Item they claimed
- `{wishlist_owner}` - Wishlist owner's username
- `{days_left}` - Days until expiry
- `{item_price}` - Estimated price

Example:
```
Hi {user_name}!

Reminder: You claimed "{item_name}" from {wishlist_owner}'s wishlist.

You have {days_left} days left to purchase it.

Price: ₦{item_price}

Visit your Spender List to take action!
```

---

## 🔔 How Reminders Work

### **User Flow:**
1. User claims an item on someone's wishlist
2. User sets a reminder (picks date/time)
3. System automatically schedules emails every 2 days
4. Emails continue until claim expires or is fulfilled

### **Behind the Scenes:**
```
User sets reminder
    ↓
Database trigger creates scheduled_reminders
    ↓
Cron job runs every hour
    ↓
Finds pending reminders where scheduled_at <= now()
    ↓
Sends email
    ↓
Updates status to 'sent'
    ↓
Schedules next reminder (+2 days)
```

---

## 🎨 Admin Features

### **Templates Table**
- View all email templates
- See type, trigger, status
- Edit or delete templates
- Test send to yourself

### **Scheduled Reminders Table**
- See upcoming reminders
- Filter by status
- View send history
- Monitor delivery

### **Stats Cards**
- Total templates count
- Active templates
- Scheduled reminders pending

---

## ⚙️ Configuration

### **Change Reminder Frequency**
Edit template interval: 1-30 days

### **Disable Automatic Reminders**
Set template status to 'Inactive'

### **Add New Notification Types**
1. Add to template type dropdown
2. Create template
3. Trigger from your code

---

## 🚨 Important Notes

### **Email Service Required**
The system schedules emails but doesn't send them automatically. You need:
1. Email service provider (SendGrid, AWS SES, etc.)
2. Cron job to process scheduled emails
3. Edge function or API endpoint

### **Database Tables**
Make sure you run the SQL migration first!

### **Testing**
Use "Test Send" button to verify templates before activating.

---

## 📊 Monitor Your Notifications

### **Check Recent Logs**
```sql
SELECT * FROM notification_logs
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### **View Pending Reminders**
```sql
SELECT * FROM scheduled_reminders
WHERE status = 'pending'
AND scheduled_at <= now()
ORDER BY scheduled_at;
```

### **Failed Notifications**
```sql
SELECT * FROM notification_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## ✨ Next Steps

1. ✅ Run database migration
2. ✅ Create notification templates in Admin Dashboard
3. ⏳ Set up email service provider
4. ⏳ Deploy cron job for sending emails
5. ⏳ Test end-to-end flow
6. ⏳ Monitor and adjust intervals

---

## 💡 Pro Tips

- Start with 2-day intervals, adjust based on feedback
- Keep email content short and actionable
- Include clear CTAs (Call to Actions)
- Test templates before activating
- Monitor delivery rates
- Add unsubscribe option

---

## 🎉 You're All Set!

Your notification system is ready. Just need to:
1. Run the SQL migration
2. Set up email sending service
3. Create your templates

**Questions?** Check `NOTIFICATIONS_SYSTEM_GUIDE.md` for detailed documentation!

