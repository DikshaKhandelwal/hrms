import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Hook to subscribe to realtime Postgres changes for attendance and leave_requests
// onAttendance and onLeave are optional callbacks executed when a change occurs.
export const useRealtime = (onAttendance?: () => void, onLeave?: () => void) => {
    useEffect(() => {
        const channel = supabase
            .channel('public:hrms-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance' },
                () => {
                    try {
                        onAttendance && onAttendance();
                    } catch (err) {
                        console.warn('onAttendance handler failed', err);
                    }
                    // keep existing in-page event contract for backward compatibility
                    try {
                        window.dispatchEvent(new Event('attendance-updated'));
                    } catch (err) {
                        /* ignore */
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leave_requests' },
                () => {
                    try {
                        onLeave && onLeave();
                    } catch (err) {
                        console.warn('onLeave handler failed', err);
                    }
                    try {
                        window.dispatchEvent(new Event('leave-request-updated'));
                    } catch (err) {
                        /* ignore */
                    }
                }
            )
            .subscribe();

        return () => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                channel.unsubscribe();
            } catch (err) {
                console.warn('Failed to unsubscribe realtime channel', err);
            }
        };
    }, [onAttendance, onLeave]);
};
