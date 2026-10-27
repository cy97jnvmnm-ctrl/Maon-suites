# Maon Suites — site with real owner login

No npm install needed (Node 22.13+, zero dependencies).

## How security works
- The server checks the email + password (scrypt, constant-time). The password is NOT in any file:
  you give it to the server as the environment variable OWNER_PASSWORD.
- A correct login creates a server-side session (random token, stored hashed in the database) in an HttpOnly, SameSite=Strict cookie.
- POST /api/availability returns 401 without a valid session. The dashboard is only built in the browser after the server confirms the session.
- Login is rate-limited (8 failures / 10 min / IP). Cross-origin writes are rejected.
- Availability lives in SQLite (DB_PATH). Public GET /api/availability is read-only.

## Run locally
    OWNER_PASSWORD='choose-it-here' npm start      # http://localhost:3000
    npm test                                       # 41 backend checks

## Deploy (Render.com, ~10 min)
1. Put this folder in a private GitHub repo.
2. Render → New → Web Service → the repo → Runtime: Docker.
3. Add a Disk: mount path /data, 1 GB.
4. Environment variables: OWNER_PASSWORD = (your password), OWNER_EMAIL = sara.ginsburg.5777@gmail.com (optional, this is the default).
5. Deploy, then connect your domain. Always use https.
To change the password: change OWNER_PASSWORD and redeploy.
