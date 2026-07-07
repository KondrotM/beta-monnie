// Test double for $env/dynamic/private — same behaviour as the real module
// in dev: reads straight from process.env (values set in vite.config.ts test.env).
export const env = process.env;
