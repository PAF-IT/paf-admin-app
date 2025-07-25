# paf-admin-client

### Install
1. Clone, then `npm install`

### Run dev
1. Run `npm run dev`
2. Launch `http://localhost:8080`

### Build
1. In `src/stores/api.js` ensure the baseUrl is set correctly (local or remote)
2. In `src/stores/api.js` bump version number (`export const version = '1.1.0'`)
3. In `public/index.html` bump to same version number (`<script defer src='/build/bundle.js?v1.1.0'></script>`)
4. `npm run build`

### References
- [Svelte](https://svelte.dev/docs/svelte/overview)
