import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeConfig {
    /** Table name to subscribe to */
    table: string;
    /** Events to listen for (defaults to all) */
    events?: RealtimeEvent[];
    /** Optional Supabase filter (e.g. "driver_id=eq.xxx") */
    filter?: string;
    /** Callback fired when a matching event occurs */
    onUpdate: () => void;
    /** Whether the subscription is active (defaults to true) */
    enabled?: boolean;
}

/**
 * Reusable hook for Supabase Realtime subscriptions.
 * Subscribes to postgres_changes on a given table and calls `onUpdate` when events fire.
 * Auto-cleans up on unmount.
 *
 * @example
 * useRealtimeSubscription({
 *   table: 'logbooks',
 *   events: ['INSERT', 'UPDATE'],
 *   onUpdate: () => fetchLogbooks(),
 * });
 */
export function useRealtimeSubscription({
    table,
    events = ['INSERT', 'UPDATE', 'DELETE'],
    filter,
    onUpdate,
    enabled = true,
}: RealtimeConfig) {
    // Use ref so the subscription always calls the latest onUpdate without re-subscribing
    const callbackRef = useRef(onUpdate);
    callbackRef.current = onUpdate;

    useEffect(() => {
        if (!enabled) return;

        const channelName = `realtime:${table}:${filter || 'all'}`;
        let channel = supabase.channel(channelName);

        for (const event of events) {
            const config: Record<string, string> = {
                event,
                schema: 'public',
                table,
            };
            if (filter) {
                config.filter = filter;
            }

            channel = channel.on(
                'postgres_changes' as any,
                config,
                () => {
                    console.log(`[Realtime] ${event} on ${table}`, filter || '');
                    callbackRef.current();
                }
            );
        }

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // Re-subscribe only when table, filter, or enabled changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, filter, enabled]);
}
