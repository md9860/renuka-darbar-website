SHRI KSHETRA RENUKA DARBAR - GOOGLE SHEETS + APPS SCRIPT SETUP

This version uses Google Sheets + Google Apps Script. The Google Sheet is NOT public.
Only the Admin login can read or update the registration records.

ADMIN LOGIN
Username: admin
Password: admin

The public website does not receive or use the admin password. Public visitors can only submit registrations.

1. CREATE THE GOOGLE SHEET
- Create a new Google Sheet, for example: Renuka Darbar Registrations.
- Do not publish the Sheet to the web.
- Keep the Sheet sharing restricted to the temple management Google account.

2. ADD APPS SCRIPT
- Open the Google Sheet.
- Extensions -> Apps Script.
- Open google-apps-script/Code.gs from this website package.
- Paste it into the Apps Script editor.
- Set PUBLIC_WRITE_TOKEN to a long random private value (for example 30+ characters).
- ADMIN_USERNAME is already admin.
- ADMIN_PASSWORD is already admin.
- Save.
- Run setup() once and allow Google permissions.
- A sheet tab named Registrations will be created.

3. DEPLOY AS WEB APP
- Apps Script: Deploy -> New deployment.
- Type: Web app.
- Execute as: Me.
- Who has access: Anyone.
- Deploy and copy the Web App URL ending in /exec.

4. CONFIGURE THE WEBSITE
Open google-sheets-config.js and set:
window.RENUKA_SHEETS_CONFIG = {
  webAppUrl: 'PASTE_YOUR_WEB_APP_URL_HERE',
  publicWriteToken: 'THE_SAME_PUBLIC_WRITE_TOKEN_USED_IN_CODE_GS'
};

Do NOT put ADMIN_PASSWORD in google-sheets-config.js.

5. PUBLIC WEBSITE
Visitors use the existing Donation and Puja/Abhishek forms.
After payment and UTR entry, the registration is sent to the private Google Sheet.
Duplicate UTR values are rejected centrally by Apps Script.

6. TEMPLE ADMIN
Open:
/admin.html

The admin page first shows a login screen.
Username: admin
Password: admin

After successful login, the Admin can see:
- today's registrations by default
- सर्व
- फक्त देणगी
- फक्त पूजा / अभिषेक
- दोन्ही
- प्रसाद पाठवायचा आहे
- प्रसाद पाठवला
- search by name/mobile/UTR/receipt
- mark प्रसाद पाठवला
- Tracking No.
- CSV download

7. IMPORTANT SECURITY
- Google Sheet itself remains private.
- Do not publish the Sheet or use "Anyone with the link" sharing for the Sheet.
- Admin read/update access is protected by the Apps Script login session.
- The public write token is intentionally limited to inserting registrations; it cannot read the Sheet.
- The requested default Admin credentials are admin / admin. For real production use, change ADMIN_PASSWORD in Code.gs before launch.
