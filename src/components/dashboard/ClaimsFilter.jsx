import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

const ClaimsFilter = ({ 
  searchQuery, 
  onSearchChange, 
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search claims..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Claimed Date</SelectItem>
            <SelectItem value="expire_at">Expiry Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="wishlist_items.unit_price_estimate">Price</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderChange}
          className="px-3"
        >
          {sortOrder === 'asc' ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ClaimsFilter;
