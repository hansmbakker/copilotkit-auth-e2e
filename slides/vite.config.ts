import { defineConfig } from 'vite'

export default defineConfig({
    // WORKAROUND for https://github.com/slidevjs/slidev/issues/2616
    server: { fs: { strict: false } },
});