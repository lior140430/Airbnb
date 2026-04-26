import * as DialogPrimitive from '@radix-ui/react-dialog';
import React from 'react';
import './Dialog.css';

interface DialogProps extends DialogPrimitive.DialogProps {
    children: React.ReactNode;
}

const DialogRoot: React.FC<DialogProps> = (props) => (
    <DialogPrimitive.Root {...props} />
);

const DialogContent: React.FC<DialogPrimitive.DialogContentProps> = ({ children, className = "", ...props }) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='dialog-overlay' />
        <DialogPrimitive.Content className={`dialog-content ${className}`} {...props}>
            {children}
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
);

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="dialog-header">
        {children}
    </div>
);

const DialogBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className='dialog-body'>
        {children}
    </div>
);

export const Dialog = {
    Root: DialogRoot,
    Content: DialogContent,
    Header: DialogHeader,
    Body: DialogBody,
    Trigger: DialogPrimitive.Trigger,
    Close: DialogPrimitive.Close
};
