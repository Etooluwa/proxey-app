import { useState, useEffect } from 'react';

const BREAKPOINT = 1024;

export function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= BREAKPOINT);

    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);
        const handler = (e) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isDesktop;
}
