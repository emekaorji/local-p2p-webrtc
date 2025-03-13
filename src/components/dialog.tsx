// your-dialog.jsx
import * as React from 'react';
import {
  Close,
  Content,
  Overlay,
  Portal,
  Root,
  Trigger,
  DialogProps,
  DialogTitle,
  DialogDescription,
} from '@radix-ui/react-dialog';
import { Cross1Icon } from '@radix-ui/react-icons';

// type DialogContentProps = React.ComponentProps<typeof Content>;
type DialogContentProps = DialogProps &
  React.HTMLAttributes<HTMLDivElement> & {
    description: string;
  };

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ children, title, description, ...props }, forwardedRef) => (
  <Portal>
    <Overlay className='DialogOverlay' />
    <Content {...props} ref={forwardedRef} className='DialogContent'>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
      {children}
      <br />
      <Close aria-label='Close'>
        <Cross1Icon />
      </Close>
    </Content>
  </Portal>
));

export const Dialog = Root;
export const DialogTrigger = Trigger;
