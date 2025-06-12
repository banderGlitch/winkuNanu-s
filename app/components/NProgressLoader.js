'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';

export default function NProgressLoader() {
    const pathname = usePathname();

    useEffect(() => {
        NProgress.start();
        NProgress.done();
      }, [pathname]);

    return null;
}