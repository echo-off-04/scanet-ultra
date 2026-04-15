import type * as React from 'react';

type MaterialElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
    disabled?: boolean;
    form?: string;
    href?: string;
    name?: string;
    target?: string;
    type?: 'button' | 'submit' | 'reset';
    value?: string;
};

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'md-elevated-button': MaterialElementProps;
            'md-filled-button': MaterialElementProps;
            'md-filled-tonal-button': MaterialElementProps;
            'md-outlined-button': MaterialElementProps;
            'md-text-button': MaterialElementProps;
            'md-icon-button': MaterialElementProps & { selected?: boolean; toggle?: boolean };
            'md-filled-icon-button': MaterialElementProps & { selected?: boolean; toggle?: boolean };
            'md-filled-tonal-icon-button': MaterialElementProps & { selected?: boolean; toggle?: boolean };
            'md-outlined-icon-button': MaterialElementProps & { selected?: boolean; toggle?: boolean };
        }
    }
}

export {};