/**
 * Sentinel URL host carrying source locations through PDF link annotations.
 * Lives in its own module so viewer code can import it without pulling the
 * render worker's module graph onto the main thread.
 */
export const LOC_URL_PREFIX = 'https://loc.invalid/?p=';
