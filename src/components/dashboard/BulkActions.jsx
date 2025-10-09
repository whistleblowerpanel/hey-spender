import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, Trash2, Eye, EyeOff, Download, Clock, CheckCircle } from 'lucide-react';

const BulkActions = ({ 
  selectedItems, 
  onSelectAll, 
  onSelectItem, 
  onBulkStatusChange, 
  onBulkDelete,
  onBulkArchive,
  onExport,
  allItems = [],
  isAllSelected = false
}) => {
  const selectedCount = selectedItems.length;

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All ({allItems.length})
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select onValueChange={onBulkStatusChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Draft
                  </div>
                </SelectItem>
                <SelectItem value="live">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Live
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="archived">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    Archived
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkArchive}
              className="text-orange-600 hover:text-orange-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectAll(false)}
          className="self-start lg:self-auto"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;
