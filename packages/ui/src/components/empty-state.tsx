import type { LucideIcon } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
        )}
        {action &&
          (action.href ? (
            <Button asChild>
              <a href={action.href}>
                {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                {action.label}
              </a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

export { EmptyState };
