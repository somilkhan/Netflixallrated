---
    name: Replit proxy URLs in package-lock.json
    description: package-lock.json files generated on Replit embed Replit's internal npm proxy URLs — must be cleaned before Railway deploys.
    ---

    # Replit Proxy URLs in package-lock.json

    ## The Rule
    After any `npm install` on Replit that updates a lockfile, the `resolved` fields in `package-lock.json` will contain `http://package-firewall.replit.local/npm/...` URLs. These are invisible locally (Replit proxies them fine) but **break Railway builds** with:

    ```
    npm error code EALLOWREMOTE
    npm error Refusing to fetch "picomatch@http://package-firewall.replit.local/npm/..."
    ```

    **Why:** Replit's npm proxy intercepts installs and rewrites `resolved` URLs to its own internal host. Railway has no access to `package-firewall.replit.local`.

    ## How to Apply
    Before committing any lockfile change that will trigger a Railway deploy, run:
    ```bash
    sed -i 's|http://package-firewall.replit.local/npm|https://registry.npmjs.org|g' client/package-lock.json server/package-lock.json
    ```

    Run after every `npm install` in either `client/` or `server/`.
    