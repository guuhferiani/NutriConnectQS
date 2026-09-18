import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground flex items-start gap-3',
  {
    variants: {
      variant: {
        default: 'bg-slate-50 text-slate-900 border-slate-200',
        destructive:
          'border-red-200 bg-red-50/80 text-red-900 [&>svg]:text-red-600',
        success:
          'border-emerald-200 bg-emerald-50/80 text-emerald-900 [&>svg]:text-emerald-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    const defaultIcon =
      variant === 'destructive' ? (
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
      ) : variant === 'success' ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
      ) : (
        <Info className="h-5 w-5 text-slate-600 shrink-0" />
      );

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon || defaultIcon}
        <div className="flex-1 text-sm font-medium leading-relaxed">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert };
