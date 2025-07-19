
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plan } from '@/lib/planService';

interface PlanDetailsModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlanDetailsModal = ({ plan, isOpen, onClose }: PlanDetailsModalProps) => {
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium">Price</p>
            <p className="col-span-3 text-sm">
              {plan.originalPrice && plan.originalPrice > plan.price ? (
                <>
                  <span className="line-through text-muted-foreground">{plan.currency}{plan.originalPrice}</span>
                  <span className="font-bold text-primary ml-2">{plan.currency}{plan.price}</span>
                </>
              ) : (
                <span>{plan.currency}{plan.price}</span>
              )}
            </p>
          </div>
          {plan.savingsPercentage !== undefined && (
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-sm font-medium">Savings</p>
              <p className="col-span-3 text-sm">{plan.savingsPercentage}%</p>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium">Billing Cycle</p>
            <p className="col-span-3 text-sm">{plan.billingCycle}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium">Type</p>
            <p className="col-span-3 text-sm">{plan.type}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <p className="text-sm font-medium">Description</p>
            <p className="col-span-3 text-sm">{plan.description}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
