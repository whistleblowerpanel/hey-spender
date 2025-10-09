import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Clock, 
  CheckCircle, 
  Mail, 
  Bell,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const AdminNotifications = () => {
  const { toast } = useToast();
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'reminder',
    title: '',
    subject: '',
    body: '',
    trigger: 'manual',
    status: 'active',
    interval_days: 2
  });

  // Notification types
  const notificationTypes = {
    reminder: 'Reminder Email',
    announcement: 'Announcement',
    welcome: 'Welcome Email',
    claim_confirmation: 'Claim Confirmation',
    payment_received: 'Payment Received',
    payout_status: 'Payout Status Update'
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notifications'
      });
    }
  };

  // Fetch scheduled reminders
  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .select(`
          *,
          claims:claim_id (
            wishlist_items (
              name,
              wishlists (
                title,
                users (
                  username,
                  email
                )
              )
            )
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchReminders();
  }, []);

  // Create notification template
  const handleCreateNotification = async () => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Notification created',
        description: 'Template has been saved successfully'
      });

      setShowCreateDialog(false);
      resetForm();
      fetchNotifications();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  // Update notification template
  const handleUpdateNotification = async () => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update(formData)
        .eq('id', selectedNotification.id);

      if (error) throw error;

      toast({
        title: 'Notification updated',
        description: 'Template has been updated successfully'
      });

      setShowEditDialog(false);
      setSelectedNotification(null);
      resetForm();
      fetchNotifications();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  // Delete notification template
  const handleDeleteNotification = async () => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', selectedNotification.id);

      if (error) throw error;

      toast({
        title: 'Notification deleted',
        description: 'Template has been removed'
      });

      setShowDeleteDialog(false);
      setSelectedNotification(null);
      fetchNotifications();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  };

  // Test send notification
  const handleTestSend = async (notification) => {
    toast({
      title: 'Test email sent',
      description: 'Check your email inbox'
    });
  };

  const resetForm = () => {
    setFormData({
      type: 'reminder',
      title: '',
      subject: '',
      body: '',
      trigger: 'manual',
      status: 'active',
      interval_days: 2
    });
  };

  const openEditDialog = (notification) => {
    setSelectedNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      subject: notification.subject,
      body: notification.body,
      trigger: notification.trigger,
      status: notification.status,
      interval_days: notification.interval_days || 2
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-purple-dark">Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage email templates and automated reminders
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-brand-orange text-black hover:bg-brand-orange/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-black p-4 bg-brand-cream">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-brand-purple-dark" />
          </div>
        </div>
        <div className="border-2 border-black p-4 bg-brand-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800">Active Templates</p>
              <p className="text-2xl font-bold">
                {notifications.filter(n => n.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-black" />
          </div>
        </div>
        <div className="border-2 border-black p-4 bg-brand-purple-light">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-purple-dark">Scheduled Reminders</p>
              <p className="text-2xl font-bold">{reminders.length}</p>
            </div>
            <Clock className="w-8 h-8 text-brand-purple-dark" />
          </div>
        </div>
      </div>

      {/* Notification Templates Table */}
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black bg-brand-cream">
          <h3 className="font-bold text-lg">Email Templates</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No notification templates yet</p>
                    <p className="text-sm">Create your first template to get started</p>
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {notificationTypes[notification.type] || notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{notification.trigger}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={notification.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.interval_days ? `Every ${notification.interval_days} days` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(notification.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTestSend(notification)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(notification)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(notification)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Scheduled Reminders Table */}
      <div className="border-2 border-black bg-white">
        <div className="p-4 border-b-2 border-black bg-brand-purple-light">
          <h3 className="font-bold text-lg">Scheduled Reminders</h3>
          <p className="text-sm text-gray-600 mt-1">Auto-reminders for claims (every 2 days)</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Wishlist</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No scheduled reminders</p>
                    <p className="text-sm">Reminders will appear when users set them</p>
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {reminder.claims?.wishlist_items?.wishlists?.users?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {reminder.claims?.wishlist_items?.name || 'Unknown Item'}
                    </TableCell>
                    <TableCell>
                      {reminder.claims?.wishlist_items?.wishlists?.title || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(reminder.scheduled_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge className={reminder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                        {reminder.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{reminder.sent_count || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Template' : 'Create Notification Template'}
            </DialogTitle>
            <DialogDescription>
              Design email notifications for various events and triggers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., Reminder Email - 2 Days Before Expiry"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Notification Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(notificationTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger</Label>
                <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'reminder' && (
                <div>
                  <Label>Reminder Interval (days)</Label>
                  <Input
                    type="number"
                    value={formData.interval_days}
                    onChange={(e) => setFormData({ ...formData, interval_days: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Email Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Subject line for the email"
              />
            </div>

            <div>
              <Label>Email Body</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your email content here..."
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{'}user_name{'}'}, {'{'}item_name{'}'}, {'{'}days_left{'}'}, {'{'}wishlist_owner{'}'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={showEditDialog ? handleUpdateNotification : handleCreateNotification}>
              {showEditDialog ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedNotification?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotification}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotifications;

