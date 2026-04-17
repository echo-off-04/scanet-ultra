'use client';

import { createElement, useEffect, useRef, type MouseEventHandler, type ReactNode } from 'react';

type MaterialIconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

interface MaterialIconButtonProps {
    ariaLabel: string;
    ariaLabelSelected?: string;
    className?: string;
    disabled?: boolean;
    icon: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
    selected?: boolean;
    selectedIcon?: ReactNode;
    toggle?: boolean;
    type?: 'button' | 'submit' | 'reset';
    variant?: MaterialIconButtonVariant;
}

const tagByVariant: Record<MaterialIconButtonVariant, string> = {
    standard: 'md-icon-button',
    filled: 'md-filled-icon-button',
    tonal: 'md-filled-tonal-icon-button',
    outlined: 'md-outlined-icon-button',
};

function joinClasses(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(' ');
}

export function MaterialIconButton({
    ariaLabel,
    ariaLabelSelected,
    className,
    disabled,
    icon,
    onClick,
    selected,
    selectedIcon,
    toggle,
    type = 'button',
    variant = 'outlined',
}: MaterialIconButtonProps) {
    const tag = tagByVariant[variant];
    const buttonRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const button = buttonRef.current;

        if (!button) return;

        if (ariaLabelSelected) {
            button.setAttribute('aria-label-selected', ariaLabelSelected);
        } else {
            button.removeAttribute('aria-label-selected');
        }
    }, [ariaLabelSelected]);

    return createElement(
        tag,
        {
            'aria-label': ariaLabel,
            className: joinClasses('material-icon-button', `material-icon-button--${variant}`, className),
            disabled,
            onClick,
            selected,
            ref: buttonRef,
            toggle,
            type,
        },
        icon,
        selectedIcon ? createElement('span', { slot: 'selected' }, selectedIcon) : null,
    );
}