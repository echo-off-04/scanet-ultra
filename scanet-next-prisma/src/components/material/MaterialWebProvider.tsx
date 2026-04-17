'use client';

import { useEffect } from 'react';

export function MaterialWebProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Load custom elements dynamically to avoid SSR issues and HMR duplicate registrations
        import('@material/web/button/elevated-button.js');
        import('@material/web/button/filled-button.js');
        import('@material/web/button/filled-tonal-button.js');
        import('@material/web/button/outlined-button.js');
        import('@material/web/button/text-button.js');
        import('@material/web/iconbutton/icon-button.js');
        import('@material/web/iconbutton/filled-icon-button.js');
        import('@material/web/iconbutton/filled-tonal-icon-button.js');
        import('@material/web/iconbutton/outlined-icon-button.js');
    }, []);

    return <>{children}</>;
}