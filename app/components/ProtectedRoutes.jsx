"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ProtectedRoutes component to protect routes

export default function ProtectedRoutes({ children }) {
    const router = useRouter();
    const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem('accessToken');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null; // or a loading spinner

    return children;
}  


