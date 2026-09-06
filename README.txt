ANANYA PROPERTIES V12 — Firebase + Cloudinary

WHAT CHANGED
- Firebase Authentication for the Admin Panel
- Firebase Firestore for property data
- Cloudinary for property photos and videos (no Firebase Storage)
- Public website reads only properties whose status is AVAILABLE
- Admin can add, edit, delete and change status
- Shortlist remains local to the visitor

ONE-TIME CONFIGURATION
1. Firebase Console > Project settings > Your apps > Web app config.
   Paste the exact apiKey and appId into firebase-config.js.
   The projectId/storageBucket/sender ID are already filled for this project, but verify them.
2. Cloudinary: cloudinary-config.js has cloudName mzduwxt7x.
   Make sure uploadPreset exactly matches the unsigned preset you created.
3. Firestore Rules must allow public reads only for available properties and authenticated admin reads/writes.

FIRESTORE RULES
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{propertyId} {
      allow read: if resource.data.status == "available" || request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
  }
}

CLOUDINARY
Use an UNSIGNED upload preset. Do not put an API secret in the website.
For safety, restrict the preset to image/video formats and a sensible max file size.

RUNNING
Because Firebase modules are loaded from the web, use VS Code Live Server or another local HTTP server.
Open index.html for the public site and admin.html for the admin panel.

IMPORTANT
- Never paste your UPI PIN, OTP, card CVV, service-account private key, or Cloudinary API secret into the website.
- This V12 does not use Firebase Storage and does not require the Firebase Storage billing setup.

LOCAL TEST NOTE: If Firebase is not configured yet, the public pages automatically fall back to the bundled demo properties instead of showing an endless loading state.


V12 FIXED 4: Cloudinary direct browser upload endpoint corrected to /upload.

V15 Final LOCATION FEATURE
- Admin can optionally store a property address and Google Maps share link.
- Customer property pages show a professional Property Location block with an Open in Google Maps button.
- If no map link is provided, the site generates a Google Maps search link from the address/location.
- No Google Maps API key is required, so this feature does not require Google Maps billing/API setup.

V15 Final AMENITY OPTIONS
- Add Property now includes Heat Pump by default.
- Amenities can be added using the Add Amenity field.
- Existing amenity options can be removed with the × button.
- Amenity options are saved in this admin browser using localStorage.
- Reset Defaults restores Parking, Wi-Fi, Lift, Power Backup, Water Supply, Garbage Management, Balcony, and Heat Pump.
- Existing property amenities remain visible while editing even if an option was later removed.
