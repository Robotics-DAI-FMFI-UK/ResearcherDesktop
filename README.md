# ResearcherDesktop

A web application for organizing research data — publications, conferences, contacts and related
materials — with keyword search, file attachments, a built-in calendar and Google Calendar / Gmail
integration. The backend is a Spring Boot REST API; the frontend is a React (Vite) single-page
application.

## Development environment

| Component  | Version            |
|------------|--------------------|
| Java (JDK) | 21                 |
| Maven      | bundled wrapper (`./mvnw`) |
| Node.js    | 18 or newer        |
| npm        | 9 or newer         |
| PostgreSQL | 14 or newer        |

The backend uses the Maven wrapper, so a separate Maven installation is not required.

## Project dependencies

- **Backend:** Spring Boot 4 (Web MVC, Data JPA, Security, Validation, Mail), Flyway, PostgreSQL
  driver, JJWT, Lombok, JSch (SFTP). Managed through `backend/pom.xml`.
- **Frontend:** React, React Router, Axios, Vite. Managed through `frontend/package.json`.

Install frontend dependencies once:

```bash
cd frontend
npm install
```

## Database configuration

The application uses PostgreSQL and applies its schema automatically with Flyway on startup
(`spring.jpa.hibernate.ddl-auto=validate`; migrations live in
`backend/src/main/resources/db/migration`). Create a database and a user, then point the
backend at them through environment variables (see below).

```sql
CREATE DATABASE researcher;
CREATE USER researcher WITH PASSWORD 'researcher';
GRANT ALL PRIVILEGES ON DATABASE researcher TO researcher;
```

The matching local defaults are `DB_URL=jdbc:postgresql://localhost:5432/researcher`,
`DB_USERNAME=researcher`, `DB_PASSWORD=researcher`.

## Environment configuration

All secrets and environment-specific values are read from a `.env` file that is **not** committed.
Each part of the project ships a committed example:

- `backend/.env.example` — backend configuration template
- `frontend/.env.example` — frontend configuration template

Copy the examples and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The backend loads `backend/.env` automatically (via `spring.config.import` in
`application.properties`). The file must sit in the working directory the backend is started from
(the `backend/` folder in development, or next to the JAR in production).

Key backend variables:

| Variable | Purpose |
|----------|---------|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | Signing key for auth tokens (use a random string, 32+ characters) |
| `APP_BASE_URL`, `APP_FRONTEND_URL` | Public URLs used in emails and redirects |
| `ADMIN_EMAIL` | Address that receives registration-approval requests |
| `MAIL_*` | Outgoing email (SMTP) settings |
| `GOOGLE_*` | Google OAuth credentials and redirect URI |
| `SFTP_*` | Optional remote file storage; leave empty to store uploads locally |

## Running locally

1. Start PostgreSQL and create the database (see above).
2. Create `backend/.env` and `frontend/.env` from the examples.
3. Start the backend:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   The API runs on `http://localhost:8080`.

4. Start the frontend in a second terminal:

   ```bash
   cd frontend
   npm run dev
   ```

   The app is served on `http://localhost:5173`.

With `SFTP_HOST` empty, uploaded files are stored in the local `uploads/` folder.

## Running in production

1. On the server, create the PostgreSQL database and user.
2. Build the artifacts:

   ```bash
   cd backend && ./mvnw clean package          # produces backend/target/researcher-*.jar
   cd ../frontend && npm install && npm run build   # produces frontend/dist
   ```

3. Place a production `backend/.env` next to the JAR with production values, for example:

   ```
   DB_URL=jdbc:postgresql://localhost:5432/<db>
   DB_USERNAME=<user>
   DB_PASSWORD=<password>
   JWT_SECRET=<random-32+-char-string>
   APP_BASE_URL=https://<your-host>
   APP_FRONTEND_URL=https://<your-host>
   ADMIN_EMAIL=<admin@your-domain>
   MAIL_HOST=<smtp-host>
   MAIL_PORT=465
   MAIL_USERNAME=<smtp-user>
   MAIL_PASSWORD=<smtp-password>
   MAIL_SMTP_SSL=true
   MAIL_SMTP_STARTTLS=false
   MAIL_FROM=<from-address>
   GOOGLE_CLIENT_ID=<oauth-client-id>
   GOOGLE_CLIENT_SECRET=<oauth-client-secret>
   GOOGLE_REDIRECT_URI=https://<your-host>/api/calendar/callback
   GOOGLE_FRONTEND_URL=https://<your-host>
   SFTP_HOST=<sftp-host>
   SFTP_USERNAME=<sftp-user>
   SFTP_PASSWORD=<sftp-password>
   SFTP_BASE_PATH=/path/to/uploads
   ```

4. Run the backend:

   ```bash
   java -jar target/researcher-*.jar
   ```

5. Serve `frontend/dist` with any static web server (or behind the same reverse proxy as the API).
   Set `VITE_API_URL` in `frontend/.env` to the public API URL **before** running `npm run build`.

## Configuring Google OAuth (administrator)

Google Calendar and Gmail integration require an OAuth 2.0 client created in Google Cloud:

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Under **APIs & Services → Library**, enable the **Google Calendar API** and the **Gmail API**.
3. Under **APIs & Services → OAuth consent screen**, configure the consent screen (External user
   type is sufficient) and add the scopes for Calendar and Gmail read access. While the app is in
   testing, add the accounts that will use it as **Test users**.
4. Under **APIs & Services → Credentials**, choose **Create credentials → OAuth client ID**, select
   **Web application**, and add the redirect URI:
   - Local: `http://localhost:8080/api/calendar/callback`
   - Production: `https://<your-host>/api/calendar/callback`
5. Copy the generated **Client ID** and **Client secret** into `backend/.env` as `GOOGLE_CLIENT_ID`
   and `GOOGLE_CLIENT_SECRET`, and set `GOOGLE_REDIRECT_URI` to match the URI registered above.

## Email service

Outgoing email (registration approvals, account-approved notices, password resets) is sent over
SMTP. Configure the `MAIL_*` variables in `backend/.env`. For Gmail, create an **App Password**
(Google Account → Security → App passwords) and use it as `MAIL_PASSWORD`; for an institutional SMTP
server, set `MAIL_HOST`, `MAIL_PORT` and the SSL/STARTTLS flags accordingly.

## Adjustable limits

- **Uploaded file size.** The maximum upload size is set in
  `backend/src/main/resources/application.properties` via
  `spring.servlet.multipart.max-file-size` and `spring.servlet.multipart.max-request-size`
  (default `500MB`). Change both values and restart the backend.
- **Calendar data volume.** The number of events fetched from Google Calendar per request is the
  `maxResults` query parameter in `GoogleCalendarService` (default `2500`). The Gmail conference
  scan limit (`maxResults`, default `20`) and its look-back window (default 90 days) are set in
  `GmailParserService`.

## Setting the administrator email

New registrations must be approved by an administrator, who receives the approval link by email.
The administrator address is the `ADMIN_EMAIL` value in `backend/.env`; it is wired into the
application through `app.admin-email` in `backend/src/main/resources/application.properties`. To
change the administrator, update `ADMIN_EMAIL` and restart the backend.
