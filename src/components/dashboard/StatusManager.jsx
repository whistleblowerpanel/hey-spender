import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Archive, Eye } from 'lucide-react';

const StatusManager = ({ wishlist, onStatusChange }) => {
  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Clock, color: 'bg-gray-100 text-gray-800' },
    { value: 'live', label: 'Live', icon: Eye, color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
    { value: 'archived', label: 'Archived', icon: Archive, color: 'bg-orange-100 text-orange-800' }
  ];

  const currentStatus = statusOptions.find(s => s.value === wishlist.status);

  const handleStatusChange = (newStatus) => {
    onStatusChange(wishlist.id, newStatus);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Status:</span>
      <Select value={wishlist.status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(status => (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex items-center gap-2">
                <status.icon className="w-4 h-4" />
                {status.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Badge className={currentStatus?.color || 'bg-gray-100 text-gray-800'}>
        {currentStatus?.icon && <currentStatus.icon className="w-3 h-3 mr-1" />}
        {currentStatus?.label || 'Unknown'}
      </Badge>
    </div>
  );
};

export default StatusManager;
