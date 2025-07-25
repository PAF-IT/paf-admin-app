# paf-admin


### Install
1. Clone, then `npm install`
2. Install MySQL (if not already up and running)
3. Create database `paf-admin` from `paf-admin.sql`
4. Edit MySQL access data in `.env` (from `env.example`)

### Run dev
1. Run `node --env-file=.env ace serve --watch`
2. API accessible at `http://127.0.0.1:3333`, `root` user with password `@L@ycB8cCPmonw92`

### Build
1. `node ace build --production`
2. `npm ci --production`
3. `npm install pino-pretty @mapbox/node-pre-gyp argon2` (seemed to be necessary)

### References
- [AdonisJS](https://preview.adonisjs.com/guides/quick-start)
