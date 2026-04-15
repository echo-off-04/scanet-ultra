'use client';

import { createElement, type MouseEventHandler, type ReactNode } from 'react';

type MaterialButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';

interface MaterialButtonProps {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    form?: string;
    href?: string;
    icon?: ReactNode;
    name?: string;
    onClick?: MouseEventHandler<HTMLElement>;
    target?: string;
    trailingIcon?: boolean;
    type?: 'button' | 'submit' | 'reset';
    value?: string;
    variant?: MaterialButtonVariant;
}

const tagByVariant: Record<MaterialButtonVariant, string> = {
    filled: 'md-filled-button',
    tonal: 'md-filled-tonal-button',
    outlined: 'md-outlined-button',
    text: 'md-text-button',
    elevated: 'md-elevated-button',
};

function joinClasses(...classes: Array<string | undefined | false>) {
    return classes.filter(Boolean).join(' ');
}

export function MaterialButton({
    children,
    className,
    disabled,
    form,
    href,
    icon,
    name,
    onClick,
    target,
    trailingIcon = false,
    type = 'button',
    value,
    variant = 'filled',
}: MaterialButtonProps) {
    const tag = tagByVariant[variant];

    return createElement(
        tag,
        {
            className: joinClasses('material-button', `material-button--${variant}`, className),
            disabled,
            form,
            href,
            name,
            onClick,
            target,
            type,
            value,
            'has-icon': icon ? true : undefined,
            'trailing-icon': trailingIcon || undefined,
        },
        icon ? createElement('span', { slot: 'icon', className: 'material-button__icon' }, icon) : null,
        createElement('span', { className: 'material-button__label' }, children),
    );
}