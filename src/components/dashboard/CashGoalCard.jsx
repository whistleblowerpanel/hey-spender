import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreHorizontal, Edit, Eye, Share2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CashGoalCard = ({ goal, onEdit, onView, onShare }) => {
  const progress = goal.target_amount > 0 ? (goal.amount_raised / goal.target_amount) * 100 : 0;
  const visibilityLabel = {
    public: 'Public',
    unlisted: 'Unlisted',
    private: 'Private'
  }[goal.visibility];

  const visibilityColor = {
    public: 'bg-green-100 text-green-800',
    unlisted: 'bg-yellow-100 text-yellow-800',
    private: 'bg-gray-100 text-gray-800'
  }[goal.visibility];

  return (
    <div className="bg-white border-2 border-black p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{goal.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium ${visibilityColor}`}>
              {visibilityLabel}
            </span>
            {goal.deadline && (
              <span className="text-xs text-gray-500">
                Due {new Date(goal.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Raised</span>
          <span className="font-semibold">
            ₦{goal.amount_raised.toLocaleString()} / ₦{goal.target_amount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashGoalCard;
