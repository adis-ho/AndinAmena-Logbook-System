import { useEffect } from 'react';

/**
 * Custom Hook for robust virtual on-screen keyboard management across mobile devices & touchscreens:
 * 1. Dismiss keyboard on intentional user scroll/swipe gestures (touchmove with movement delta > 15px).
 * 2. Dismiss keyboard when tapping outside editable elements without interrupting focus on new inputs.
 * 3. Dismiss keyboard on pressing Enter/Return on single-line inputs.
 * 4. NEVER listens to window 'scroll' directly to prevent collision loops with mobile browser auto-centering.
 */
export function useKeyboardDismiss() {
    useEffect(() => {
        let touchStartY = 0;
        let touchStartX = 0;

        // Record initial touch coordinates
        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length > 0) {
                touchStartY = event.touches[0].clientY;
                touchStartX = event.touches[0].clientX;
            }
        };

        // Dismiss ONLY on intentional user drag/scroll gesture (delta > 15px)
        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length === 0) return;

            const activeEl = document.activeElement;
            if (!activeEl) return;

            const isInputOrTextarea =
                activeEl instanceof HTMLInputElement ||
                activeEl instanceof HTMLTextAreaElement ||
                (activeEl as HTMLElement).isContentEditable;

            if (!isInputOrTextarea) return;

            const currentY = event.touches[0].clientY;
            const currentX = event.touches[0].clientX;
            const deltaY = Math.abs(currentY - touchStartY);
            const deltaX = Math.abs(currentX - touchStartX);

            // User performed a genuine drag/scroll gesture
            if (deltaY > 15 || deltaX > 15) {
                (activeEl as HTMLElement).blur();
            }
        };

        // Dismiss on tapping non-interactive / non-editable elements
        const handleClick = (event: MouseEvent | TouchEvent) => {
            const activeEl = document.activeElement;
            if (!activeEl) return;

            const isInputOrTextarea =
                activeEl instanceof HTMLInputElement ||
                activeEl instanceof HTMLTextAreaElement ||
                (activeEl as HTMLElement).isContentEditable;

            if (!isInputOrTextarea) return;

            const target = event.target as HTMLElement | null;
            if (!target) return;

            // If user clicked inside the current active element, do not blur
            if (activeEl.contains(target) || activeEl === target) return;

            // If user clicked another interactive element (input, select, button, link, option), let browser handle it
            const isInteractive = Boolean(
                target.closest(
                    'input, textarea, select, button, a, [contenteditable="true"], [role="button"], [role="option"], [data-headlessui-state]'
                )
            );

            if (!isInteractive) {
                (activeEl as HTMLElement).blur();
            }
        };

        // Dismiss on Enter / Return key for single-line inputs
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                const activeEl = document.activeElement;
                if (
                    activeEl instanceof HTMLInputElement &&
                    activeEl.type !== 'submit' &&
                    activeEl.type !== 'button'
                ) {
                    activeEl.blur();
                }
            }
        };

        // Register event listeners
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('click', handleClick, { passive: true });
        window.addEventListener('keydown', handleKeyDown, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
}

export default useKeyboardDismiss;
