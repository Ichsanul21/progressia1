import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: number | string | null;
}

export interface SharedData {
    name: string;
    auth: Auth;
    pendingRegistrantsCount: number;
    [key: string]: unknown;
}

export type UserRole = 'super_admin' | 'admin_vendor' | 'team' | 'client';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    role: UserRole;
    vendor_id: number | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
