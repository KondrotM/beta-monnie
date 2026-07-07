// Test double for SvelteKit's $app/environment virtual module.
// dev=true so server code takes the local-filesystem path, not S3.
export const browser = false;
export const dev = true;
export const building = false;
export const version = 'test';
