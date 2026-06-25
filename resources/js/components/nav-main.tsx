import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Activity, ChevronDown, ClipboardList, ShieldCheck, type LucideIcon } from 'lucide-react';

const GROUP_ICONS: Record<string, LucideIcon> = {
    Operasional: Activity,
    Perencanaan: ClipboardList,
    Administrasi: ShieldCheck,
};

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const page = usePage();
    return (
        <>
            {groups.map((group) => {
                const Icon = GROUP_ICONS[group.title] ?? Activity;
                return (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        <Collapsible defaultOpen className="group/collapsible">
                            <CollapsibleTrigger asChild>
                                <SidebarGroupLabel className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer gap-2 text-sm font-semibold tracking-wider uppercase transition-colors">
                                    <Icon className="text-sidebar-primary" />
                                    <span>{group.title}</span>
                                    <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
                                </SidebarGroupLabel>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={item.url === page.url}>
                                                <Link href={item.url} prefetch>
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {item.badge != null && item.badge !== 0 && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarGroup>
                );
            })}
        </>
    );
}
