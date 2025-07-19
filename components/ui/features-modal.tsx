
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plan, Feature } from '@/lib/planService';

interface FeaturesModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FeaturesModal = ({ plan, isOpen, onClose }: FeaturesModalProps) => {
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{plan.name} Features</DialogTitle>
        </DialogHeader>
        <ScrollArea className="grid gap-4 py-4 flex-grow pr-4">
          {plan.features.map((feature: Feature, index: number) => (
            <div key={index} className="grid grid-cols-4 items-center gap-4">
              {feature.icon && <span className="text-xl">{feature.icon}</span>}
              <p className="text-sm font-medium">{feature.name}</p>
              <p className="col-span-3 text-sm">{feature.description}</p>
              {feature.limit !== undefined && feature.limit !== null && (
                <p className="col-span-4 text-xs text-muted-foreground">Limit: {feature.limit}</p>
              )}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
