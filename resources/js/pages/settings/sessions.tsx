import { parseUserAgent } from '@/lib/user-agent';
import { Head, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { LogOut, Monitor, Smartphone } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sessions', href: '/settings/sessions' }];

interface Session {
    id: string;
    ip_address: string;
    user_agent: string;
    last_activity: number;
    is_current: boolean;
}

export default function Sessions({ sessions }: { sessions: Session[] }) {
    const revokeSession = (sessionId: string) => {
        router.delete(route('sessions.destroy', sessionId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Active Sessions" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Active Sessions" description="Manage your active login sessions across devices" />

                    <div className="space-y-4">
                        {sessions.map((session) => {
                            const parsed = parseUserAgent(session.user_agent);
                            const isCurrent = session.is_current;

                            return (
                                <Card key={session.id} className={isCurrent ? 'border-primary' : ''}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                                                    {parsed.isMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <CardTitle className="flex items-center gap-2 text-base">
                                                        {parsed.browser} on {parsed.os}
                                                        {isCurrent && (
                                                            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                                                                Current
                                                            </span>
                                                        )}
                                                    </CardTitle>
                                                </div>
                                            </div>

                                            {!isCurrent && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => revokeSession(session.id)}
                                                    aria-label={`Logout ${parsed.browser} on ${parsed.os}`}
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>
                                            {session.ip_address} &middot;{' '}
                                            {formatDistanceToNow(session.last_activity * 1000, {
                                                addSuffix: true,
                                                locale: id,
                                            })}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {sessions.length === 0 && <p className="text-muted-foreground py-8 text-center text-sm">No active sessions found.</p>}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
