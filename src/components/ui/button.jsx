import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-150',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:brightness-95 active:brightness-90',
				destructive:
          'bg-destructive text-destructive-foreground hover:brightness-95 active:brightness-90',
				outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
				secondary:
          'bg-secondary text-secondary-foreground hover:brightness-95 active:brightness-90',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
        custom: 'font-semibold border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] active:shadow-[0px_0px_0px_#000] active:brightness-90',
        flat: 'font-semibold hover:brightness-95 active:brightness-90'
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-11 px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };