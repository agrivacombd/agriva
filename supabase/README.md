# Supabase setup for AGRIVA

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `database/schema.sql`.
4. Add the project URL and anon key to the deployment environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Enable the authentication providers you want to support.

Do not commit service-role keys or API secrets.
