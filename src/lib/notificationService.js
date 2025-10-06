// Notification Service for Withdrawal Management
// This service handles sending notifications for withdrawal status changes

import { supabase } from './customSupabaseClient';

export class NotificationService {
  // Send notification to admins about new withdrawal request
  static async notifyAdminsNewWithdrawal(payoutData) {
    try {
      // Get all admin users
      const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('email, user_metadata')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        return;
      }

      if (!admins || admins.length === 0) {
        console.log('No admin users found for notification');
        return;
      }

      // Send email notifications to admins
      const adminEmails = admins.map(admin => admin.email).filter(Boolean);
      
      // For now, we'll log the notification
      // In production, you would integrate with an email service like SendGrid, AWS SES, etc.
      console.log('📧 ADMIN NOTIFICATION: New withdrawal request', {
        payoutId: payoutData.id,
        amount: payoutData.amount,
        userEmail: payoutData.wallet?.user?.email,
        bankCode: payoutData.destination_bank_code,
        accountNumber: payoutData.destination_account,
        adminEmails: adminEmails,
        timestamp: new Date().toISOString()
      });

      // Store notification in database for admin dashboard
      await this.storeAdminNotification({
        type: 'new_withdrawal_request',
        title: 'New Withdrawal Request',
        message: `₦${Number(payoutData.amount).toLocaleString()} withdrawal requested by ${payoutData.wallet?.user?.email || 'Unknown user'}`,
        data: {
          payout_id: payoutData.id,
          amount: payoutData.amount,
          user_email: payoutData.wallet?.user?.email,
          bank_code: payoutData.destination_bank_code,
          account_number: payoutData.destination_account
        }
      });

      return { success: true, adminCount: adminEmails.length };
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to user about withdrawal status change
  static async notifyUserStatusChange(payoutData, oldStatus, newStatus) {
    try {
      const userEmail = payoutData.wallet?.user?.email;
      if (!userEmail) {
        console.log('No user email found for notification');
        return;
      }

      const statusMessages = {
        'requested': 'Your withdrawal request has been submitted and is under review.',
        'processing': 'Your withdrawal has been approved and is now being processed.',
        'paid': 'Your withdrawal has been completed and funds have been transferred.',
        'failed': 'Your withdrawal request was not approved. Please contact support for more information.'
      };

      const message = statusMessages[newStatus] || 'Your withdrawal status has been updated.';

      // Log the notification
      console.log('📧 USER NOTIFICATION: Withdrawal status change', {
        payoutId: payoutData.id,
        userEmail: userEmail,
        oldStatus: oldStatus,
        newStatus: newStatus,
        amount: payoutData.amount,
        message: message,
        timestamp: new Date().toISOString()
      });

      // Store notification in database for user dashboard
      await this.storeUserNotification({
        user_id: payoutData.wallet.user_id,
        type: 'withdrawal_status_change',
        title: 'Withdrawal Status Update',
        message: message,
        data: {
          payout_id: payoutData.id,
          old_status: oldStatus,
          new_status: newStatus,
          amount: payoutData.amount
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending user notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Store admin notification in database
  static async storeAdminNotification(notification) {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          is_read: false
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error storing admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Store user notification in database
  static async storeUserNotification(notification) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: notification.user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          is_read: false
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error storing user notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notifications for admin
  static async getAdminNotifications() {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, notifications: data || [] };
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notifications for user
  static async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, notifications: data || [] };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId, type = 'user') {
    try {
      const table = type === 'admin' ? 'admin_notifications' : 'user_notifications';
      const { error } = await supabase
        .from(table)
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }
}

// Helper function to send withdrawal notifications
export const sendWithdrawalNotifications = {
  // Called when a new withdrawal is requested
  async onNewWithdrawal(payoutData) {
    return await NotificationService.notifyAdminsNewWithdrawal(payoutData);
  },

  // Called when withdrawal status changes
  async onStatusChange(payoutData, oldStatus, newStatus) {
    return await NotificationService.notifyUserStatusChange(payoutData, oldStatus, newStatus);
  }
};
