-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('reminder', 'announcement', 'welcome', 'claim_confirmation', 'payment_received', 'payout_status')),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'automatic', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  interval_days INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scheduled reminders table
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on scheduled_reminders for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_at ON scheduled_reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_status ON scheduled_reminders(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_claim_id ON scheduled_reminders(claim_id);

-- Create notification logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  reminder_id UUID REFERENCES scheduled_reminders(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reminders_updated_at BEFORE UPDATE ON scheduled_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default reminder template
INSERT INTO notification_templates (type, title, subject, body, trigger, interval_days)
VALUES (
  'reminder',
  'Claim Reminder - 2 Day Interval',
  'Don''t forget about {item_name}!',
  'Hi there!

This is a friendly reminder about the item you claimed: {item_name} from {wishlist_owner}''s wishlist.

You have {days_left} days left before your claim expires.

Here''s what you can do:
1. Send cash directly to {wishlist_owner}
2. Purchase the item and have it delivered
3. Set another reminder if you need more time

Don''t miss out! Visit your Spender List to take action.

Best regards,
The HeySpender Team',
  'automatic',
  2
) ON CONFLICT DO NOTHING;

-- Create function to schedule automatic reminders when a claim is created
CREATE OR REPLACE FUNCTION schedule_claim_reminders()
RETURNS TRIGGER AS $$
DECLARE
  reminder_date TIMESTAMPTZ;
  days_until_expiry INTEGER;
  template_interval INTEGER;
BEGIN
  -- Get the interval from the active reminder template
  SELECT interval_days INTO template_interval
  FROM notification_templates
  WHERE type = 'reminder' AND status = 'active' AND trigger = 'automatic'
  LIMIT 1;

  -- Default to 2 days if no template found
  IF template_interval IS NULL THEN
    template_interval := 2;
  END IF;

  -- Calculate days until expiry
  days_until_expiry := EXTRACT(DAY FROM (NEW.expire_at - now()));

  -- Only schedule if expiry is more than interval days away
  IF days_until_expiry > template_interval THEN
    -- Schedule first reminder at interval days
    reminder_date := now() + (template_interval || ' days')::INTERVAL;
    
    -- Keep scheduling reminders every interval days until expiry
    WHILE reminder_date < NEW.expire_at LOOP
      INSERT INTO scheduled_reminders (claim_id, user_id, scheduled_at)
      VALUES (NEW.id, NEW.supporter_user_id, reminder_date);
      
      reminder_date := reminder_date + (template_interval || ' days')::INTERVAL;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically schedule reminders for new claims
DROP TRIGGER IF EXISTS trigger_schedule_claim_reminders ON claims;
CREATE TRIGGER trigger_schedule_claim_reminders
  AFTER INSERT ON claims
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION schedule_claim_reminders();

COMMENT ON TABLE notification_templates IS 'Email notification templates for various events';
COMMENT ON TABLE scheduled_reminders IS 'Scheduled reminder emails for spenders about their claims';
COMMENT ON TABLE notification_logs IS 'Log of all sent notifications for tracking and debugging';
COMMENT ON FUNCTION schedule_claim_reminders() IS 'Automatically schedules reminder emails every 2 days for new claims';

