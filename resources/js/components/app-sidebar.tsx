import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useRegistrantNotifications } from '@/hooks/use-registrant-notifications';
import { type NavGroup, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Bell,
    Briefcase,
    Building2,
    CalendarDays,
    FileCheck,
    FileSpreadsheet,
    FolderKanban,
    HardHat,
    History,
    Inbox,
    LayoutGrid,
    Settings,
    Shield,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth, pendingRegistrantsCount } = usePage<SharedData>().props;
    const user = auth.user;

    const isSuperAdmin = user.role === 'super_admin';
    const isAdminVendor = user.role === 'admin_vendor';
    const isSubVendor = user.role === 'sub_vendor';
    const isClient = user.role === 'client';

    useRegistrantNotifications({ enabled: isSuperAdmin });

    const operasionalItems: NavItem[] = [];
    const perencanaanItems: NavItem[] = [];
    const administrasiItems: NavItem[] = [];

    if (isClient) {
        operasionalItems.push(
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Proyek Saya', url: '/projects', icon: FolderKanban },
            { title: 'Notifikasi', url: '/notifications', icon: Bell },
        );
    } else if (isSubVendor) {
        operasionalItems.push({ title: 'Dashboard', url: '/dashboard', icon: LayoutGrid }, { title: 'Tasks', url: '/tasks/inbox', icon: Inbox });
    } else {
        operasionalItems.push(
            { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
            { title: 'Projects', url: '/projects', icon: FolderKanban },
            { title: 'Calendar', url: '/calendar', icon: CalendarDays },
        );

        if (isSuperAdmin || isAdminVendor) {
            perencanaanItems.push(
                { title: 'Reports', url: '/reports', icon: BarChart3 },
                { title: 'Approvals', url: '/approvals', icon: FileCheck },
                { title: 'RAB', url: '/rab', icon: FileSpreadsheet },
            );
        }

        if (isSuperAdmin) {
            administrasiItems.push(
                { title: 'Users', url: '/admin/users', icon: Users },
                { title: 'Pendaftar', url: '/admin/registrants', icon: UserCog, badge: pendingRegistrantsCount },
                { title: 'Tim', url: '/admin/team', icon: Users },
                { title: 'Project Managers', url: '/admin/project-managers', icon: UserCog },
                { title: 'Clients', url: '/admin/clients', icon: Briefcase },
                { title: 'Sub-Vendor Users', url: '/admin/sub-vendor-users', icon: HardHat },
                { title: 'Contact History', url: '/admin/users/contact-history', icon: History },
                { title: 'Vendors', url: '/admin/vendors', icon: Building2 },
                { title: 'Sub-Vendors', url: '/admin/sub-vendors', icon: Shield },
            );
        }

        if (isAdminVendor) {
            administrasiItems.push(
                { title: 'Tim', url: '/admin/team', icon: Users },
                { title: 'Project Managers', url: '/admin/project-managers', icon: UserCog },
                { title: 'Clients', url: '/admin/clients', icon: Briefcase },
                { title: 'Sub-Vendor Users', url: '/admin/sub-vendor-users', icon: HardHat },
                { title: 'Sub-Vendors', url: '/admin/sub-vendors', icon: Shield },
            );
        }
    }

    const mainNavGroups: NavGroup[] = [{ title: 'Operasional', items: operasionalItems }];

    if (perencanaanItems.length > 0) {
        mainNavGroups.push({ title: 'Perencanaan', items: perencanaanItems });
    }
    if (administrasiItems.length > 0) {
        mainNavGroups.push({ title: 'Administrasi', items: administrasiItems });
    }

    const footerNavItems: NavItem[] = [
        {
            title: 'Settings',
            url: '/settings/profile',
            icon: Settings,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
