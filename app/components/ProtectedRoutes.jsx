"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// ProtectedRoutes component to protect routes

export default function ProtectedRoutes({ children }) {
    const router = useRouter();
    const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem('token');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/feed');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null; // or a loading spinner

    return children;
}  


