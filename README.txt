WEDDING INVITATION V2
1. Make a backup of your existing website and Supabase database.
2. Open supabase_migration.sql in Supabase SQL Editor, review and run it ONCE.
3. Confirm Authentication > Providers > Anonymous Sign-ins is enabled and saved.
4. Open index.html with VS Code Live Server (do not use file://).
5. Edit the sample names, parents, date, time and schedule in index.html.
6. Edit CONFIG at the top of script.js (date/time in YYYYMMDDTHHMMSS, venue, phone, maps URL).
7. Place your own legally usable MP3 in assets/lagu.mp3. No MP3 is included.
8. Upload your own font and uncomment the @font-face section in style.css.
9. Test RSVP submit/update/delete, guestbook and calendar link on phone.
10. Test the website on a staging URL before publishing.
NOTES:
- Music playback is attempted when the envelope is opened; browser policies may block it.
- Existing RSVP and wishes tables are reused. A failed second write may leave a partial save.
- Existing RLS policies need review; new policies do not override permissive older ones.
- Anonymous login identifies a browser session, not a verified person or phone number.
- Guestbook scroll restarts at top after reaching the bottom; it is not a seamless loop.
- Equal minimum section heights do not force overflow content to be clipped.
- This is a starter version; no decorative image assets are included.
