import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemType, itemName }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-brand-accent-red" />
            Delete {itemType}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{itemName}"</strong>? This action cannot be undone.
            {itemType === 'wishlist' && ' All items and contributions will also be deleted.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-brand-accent-red hover:bg-brand-accent-red/90 text-white border-2 border-black shadow-none hover:shadow-[-2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90"
          >
            Delete {itemType}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationModal;
