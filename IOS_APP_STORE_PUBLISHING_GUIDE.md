# iOS App Store Publishing Guide (First Time)

Step-by-step guide to publish the spakspak app (Reels / short video app) to the Apple App Store using Xcode. Tailored for a React Native (Expo) project with Stripe payments and a custom API, first-time Apple Developer account, and no prior uploads.

---

## Production upload checklist (before every upload)

- [ ] **Version & build**: `app.json` → `version` (e.g. 1.0.6), `ios.buildNumber` (e.g. 6). Sync in `ios/spakspak/Info.plist` and Xcode project if building locally. **Increment build number for every new binary** (same version or new).
- [ ] **Production API**: `.env` and `app.json` → `extra.EXPO_PUBLIC_API_URL` must point to `https://api.spakspak.com/api/v1` (no localhost).
- [ ] **Signing**: Xcode → spakspak target → Signing & Capabilities → Release uses your Team and Distribution certificate.
- [ ] **Archive**: Device = "Any iOS Device", then Product → Clean Build Folder, then Product → Archive.
- [ ] **Upload**: Organizer → Distribute App → App Store Connect → Upload. Fix any "Invalid Binary" by addressing the email and uploading a new build with a higher build number.
- [ ] **EAS (optional)**: Run `npm run build:eas-ios-production` for a cloud build; then `eas submit --platform ios --latest` (set `appleId`, `ascAppId`, `appleTeamId` in `eas.json` submit.production.ios first).

---

## Understanding “Command PhaseScriptExecution failed with a nonzero exit code”

This error means **one of the build phases that runs a script** (a Run Script phase in Xcode, or a script from CocoaPods, Expo, React Native, etc.) exited with a failure status. Xcode only shows this generic message; the **real cause** is in the script’s output.

### How to see the real error

1. **Report navigator**  
   - In Xcode: **View → Navigators → Report** (or the last icon in the left sidebar).  
   - Select the **failed build** in the list.

2. **Find the failed phase**  
   - In the build log, locate the red **“PhaseScriptExecution”** (or “Run custom shell script …”) line.  
   - The line above or next to it usually shows the **script name**, e.g.:  
     - `[CP] Check Pods Manifest.lock`  
     - `[Expo] Configure project`  
     - `Bundle React Native code and images`  
     - `[CP] Copy Pods Resources` / `[CP] Embed Pods Frameworks`

3. **Expand and read the log**  
   - **Click the disclosure triangle** next to that phase to expand it.  
   - Scroll through the **script output**. The actual error is typically in the last few lines (e.g. “node: command not found”, “The sandbox is not in sync with the Podfile.lock”, “No such file or directory”).

4. **Fix the cause**  
   - **Pods out of sync**: run `cd ios && pod install`, then build again.  
   - **Node not found**: set `NODE_BINARY` in `ios/.xcode.env.local` (e.g. `export NODE_BINARY=/usr/local/bin/node` or your `which node` path).  
   - **Path / script not found**: ensure the script runs from the right directory (e.g. `ios`); the project’s “[Expo] Configure project” phase uses `cd "${SRCROOT}"` for this.

Once you see the real message, you can fix that specific script or environment and re-run the build.

---

## 1. Apple Developer Account Prerequisites

1.1 Create or use an Apple ID
- Use a real email you can access long-term. This Apple ID will own the app and receive App Store Connect and review emails.
- Do not use a shared or temporary email.

1.2 Enroll in the Apple Developer Program
- Go to developer.apple.com and sign in with your Apple ID.
- Click "Account" then "Join the Apple Developer Program."
- Choose the individual or organization option. For a company (e.g. Indaitechnologies), you need organization enrollment.
- Pay the annual fee (USD 99). Processing can take 24–48 hours.

1.3 Required legal and account info
- For individual: your name, address, and contact details.
- For organization: D-U-N-S number, legal entity name, and an authorized representative. Request a D-U-N-S number from Apple if you do not have one.
- Have a valid payment method and agree to the Program License Agreement.

Tip: Complete enrollment before touching Xcode signing. Many first-time failures come from using a non-enrolled Apple ID.

---

## 2. Xcode and Project Preparation

2.1 Xcode version
- Use the latest stable Xcode from the Mac App Store. For iOS 12+ (your app’s minimum), Xcode 14 or 15 is typical; newer is fine.
- After installing, open Xcode once and accept the license. Install any requested command-line tools if prompted.

2.2 Open the correct project
- For this project, always open the workspace, not the project file:
  - Open: `ios/spakspak.xcworkspace`
  - Do not open: `ios/spakspak.xcodeproj`
- Opening the workspace ensures CocoaPods and signing work correctly.

2.3 iOS deployment target
- Your app already targets iOS 12.0 (LSMinimumSystemVersion in Info.plist). Keep it at 12.0 or higher so you can support older devices without extra work.
- In Xcode: select the spakspak project in the navigator, select the spakspak target, "General" tab, check "Minimum Deployments" and ensure it matches (e.g. 12.0).

2.4 Bundle Identifier
- Your app uses: `com.Indaitechnologies.spakspak`
- It must match exactly in: app.json (expo.ios.bundleIdentifier), Xcode (spakspak target → General → Bundle Identifier), and the App ID you create in the Developer portal. Do not change it for the first release once you have created the App ID.

2.5 Version and build number rules
- Version (e.g. 1.0.0): user-facing. Bump when you ship a new release (e.g. 1.0.1, 1.1.0).
- Build number (e.g. 1): must increase for every binary you upload to App Store Connect, even for the same version. First upload can be 1, next 2, then 3, etc.
- Your app.json has version "1.0.6" and buildNumber "6". After a rejection or next release, set buildNumber to "7" (and so on). You can manage this in app.json and run a prebuild if you use EAS, or set it in Xcode under the spakspak target → General → Version and Build.

2.6 App icons and launch screen
- Icons: Your project has `ios/spakspak/Images.xcassets/AppIcon.appiconset/` with a 1024x1024 icon. App Store requires a 1024x1024 PNG, no transparency, no rounded corners (Apple applies the mask). Ensure the 1024 asset is correct; Xcode can generate other sizes from it if configured.
- Launch screen: SplashScreen.storyboard is present. Avoid placeholder text or "Loading" that might look like a crash. A simple logo or brand screen is safer for review.

Tip: Reels/video apps are often checked for proper use of camera and microphone. Your Info.plist already has NSCameraUsageDescription, NSMicrophoneUsageDescription, and NSPhotoLibraryUsageDescription. Keep these clear and specific to your app’s use (profile picture, recording reels, selecting videos).

## 3. Certificates Setup (First Time)

3.1 Apple Development certificate
- Used for: running the app on your device or simulator during development.
- Created in: Apple Developer portal → Certificates, Identifiers & Profiles → Certificates → "+" → "Apple Development."
- You need one Development certificate per machine (or a shared one for your team). Let Xcode create it automatically if you use "Automatically manage signing" (recommended for first time).

3.2 Apple Distribution certificate
- Used for: building the app for App Store (and often for Ad Hoc). Required to upload to App Store Connect.
- Created in: Certificates → "+" → "Apple Distribution."
- Limit: one Distribution certificate per Apple Developer account (or two in some cases). If you already have one, do not create another; revoke only if you lost the private key and need to start over.

3.3 Development vs Distribution
- Development: run on devices during development; used with a Development provisioning profile.
- Distribution: submit to App Store (and Ad Hoc); used with an App Store (or Ad Hoc) provisioning profile. For spakspak’s first release, you only need the App Store profile.

3.4 Private key mistakes
- The certificate is tied to a private key on the Mac that created the certificate. If you create the certificate on one Mac and move to another, signing will fail unless you export the private key (Keychain Access → certificate → right-click → Export) and import it on the new Mac.
- Do not create a Distribution certificate on a teammate’s Mac unless you will always build and upload from that Mac or export/import the key. For teams, often one person holds the Distribution certificate and does the archive/upload.

---

## 4. App ID Creation

4.1 Create an explicit App ID
- In Developer portal: Identifiers → "+" → "App IDs" → "App" → Continue.
- Description: e.g. "spakspak" or "Spakspak Reels."
- Bundle ID: "Explicit" → enter exactly `com.Indaitechnologies.spakspak` (must match Xcode and app.json).
- Register the App ID.

4.2 Capabilities to enable
- Associated Domains: your app uses `applinks:api.spakspak.com` for deep links. Enable "Associated Domains" for this App ID. The exact domain will be configured in the entitlements (you already have it in spakspak.entitlements).
- Push Notifications: enable only if you use or plan to use push. If you do not send push, leave it off to avoid unnecessary setup and review questions.

4.3 What not to enable
- Do not enable Sign in with Apple unless your app offers it.
- Do not enable In-App Purchase; you use Stripe and a custom API, not Apple IAP. Enabling IAP by mistake can confuse review.
- Enable only what the app actually uses: e.g. Associated Domains, and optionally Push Notifications.

4.4 Push and Stripe
- Stripe does not require special App ID capabilities. Payments go through your backend and Stripe; the app does not need In-App Purchase capability. In App Store Connect you will disclose that purchases are made outside the app (see section 9).

---

## 5. Provisioning Profiles

5.1 iOS Development profile
- Used when you run the app on a device (e.g. from Xcode with a cable or wireless debugging). Ties your Development certificate + device UDID + App ID.
- With "Automatically manage signing," Xcode creates and downloads this for you when you select your Team and a physical device.

5.2 App Store provisioning profile
- Used only for the build you upload to App Store Connect. Ties your Distribution certificate + App ID (no device list).
- With "Automatically manage signing" and "Release" configuration, Xcode can create and use an "App Store" or "App Store Connect" profile when you archive. If you use manual signing, create it in the portal: Profiles → "+" → "App Store Connect" (or "App Store") → select App ID → select Distribution certificate → generate → download and install (or let Xcode install it).

5.3 Automatic vs manual signing
- First time: use "Automatically manage signing" for the spakspak target. Select your Team (your Apple Developer account). Xcode will create/use Development and Distribution certificates and the right profiles.
- Use manual signing only if you need strict control (e.g. shared Distribution certificate, CI). For a first upload, automatic is simpler and reduces mistakes.

---

## 6. Xcode Signing Configuration

6.1 Enable automatic signing
- Open `ios/spakspak.xcworkspace` in Xcode.
- Select the spakspak project in the left navigator, then the spakspak target.
- Open "Signing & Capabilities."
- Check "Automatically manage signing."
- Choose your Team (the Apple Developer account). If it does not appear, add the account in Xcode → Settings → Accounts → "+" → Apple ID.

6.2 Debug vs Release
- Debug: uses Development certificate and Development profile (for running on device).
- Release: uses Distribution certificate and App Store profile (for archive and upload). Ensure both Debug and Release use the same Team and that Release shows a valid "Apple Distribution" identity when you archive.

6.3 Common signing errors
- "No signing certificate found": add your Apple ID in Xcode Settings → Accounts and ensure you are in the Developer Program. Let Xcode create the certificate or create one in the portal and ensure the private key is on this Mac.
- "Provisioning profile doesn’t include the signing certificate": in the portal, ensure the profile uses the same certificate you have in Keychain. With automatic signing, try clearing the Team, then re-selecting it; or delete derived data and archive again.
- "The app ID cannot be registered because it is not available": the Bundle ID is taken or you are not the right team. Use exactly `com.Indaitechnologies.spakspak` and the same team that owns the App ID.
- "Associated Domains" error: ensure the App ID has Associated Domains enabled and the entitlements file (spakspak.entitlements) lists `applinks:api.spakspak.com`. The domain must be served with the correct apple-app-site-association file on api.spakspak.com for deep links to work; this is separate from App Store submission.

---

## 7. Archiving the App

7.1 Select "Any iOS Device"
- In the Xcode scheme/device dropdown (top left), choose "Any iOS Device (arm64)". Do not select a simulator or a specific device. Archive is disabled for simulator.

7.2 Create the archive
- Menu: Product → Archive. Wait for the build to finish. If it fails, fix signing or build errors (often missing certificate, wrong profile, or scheme set to simulator).
- The Organizer window opens when the archive succeeds.

7.3 Organizer
- Organizer lists archives by version and build. Select the latest archive. You can "Distribute App" from here, or "Validate App" first (recommended). Validation runs many of the same checks App Store does and can catch issues before upload.

Tip: Before archiving, do a clean build: Product → Clean Build Folder, then Product → Archive. This avoids stale artifacts that can cause "invalid binary" or signing issues.

---

## 8. Uploading to App Store Connect

8.1 Distribute App flow
- In Organizer, select your archive → "Distribute App."
- Choose "App Store Connect" → Next.
- Choose "Upload" → Next.
- Leave options as default (e.g. upload symbols, manage version and build number if you want Xcode to handle it). Next.
- Select the correct signing identity (Apple Distribution) and provisioning profile (Xcode-managed or the App Store profile you use). Next.
- Review and click Upload. Wait until the upload completes.

8.2 App Store Connect upload
- The build is sent to Apple. It appears in App Store Connect under your app → TestFlight (and later under the iOS version for submission) after processing. Processing can take 5–30 minutes; you get an email when it is ready.

8.3 Upload validation warnings
- If validation fails before upload, read the message. Common issues: invalid or missing icons, wrong architecture, missing compliance (e.g. encryption). Fix in the project and archive again.
- If upload succeeds but the build later shows "Invalid Binary" or an email with rejection reasons, address those (e.g. add missing privacy usage strings, fix export compliance, or correct capabilities). Do not re-upload the same binary; fix, increment the build number, and upload a new archive.

---

## 9. App Store Connect Setup

9.1 Create the app record
- In App Store Connect (appstoreconnect.apple.com), go to "My Apps" → "+" → "New App."
- Platform: iOS. Name: e.g. "spakspak" (or your public name). Primary Language, Bundle ID (select `com.Indaitechnologies.spakspak`), SKU (e.g. "spakspak-ios-1"). User Access: Full Access if you are the only developer. Create.

9.2 General → App Information (exact values for this project)

Use these values in App Store Connect → your app → General → App Information. Copy and paste where applicable.

| Field | Value to enter |
|-------|----------------|
| **Name** | `spakspak` |
| **Subtitle** (max 30 characters) | `Watch and share short videos` |
| **Primary Language** | `English (U.S.)` |
| **Category (Primary)** | `Social Networking` (or `Entertainment` if you prefer) |
| **Category (Secondary)** | `Photo & Video` (optional) |
| **SKU** | `spakspak-ios-1` (already set when you created the app; do not change) |
| **Bundle ID** | `com.Indaitechnologies.spakspak` (already set; select from dropdown) |
| **Copyright** | `© 2025 Indaitechnologies` (change year to your release year) |

**Promotional Text** (optional, editable anytime without new version):
- `Discover reels, create your own, and connect with creators.`

**Description** (for App Store page — paste in the version’s “What’s New” or App Store listing):
- Keep it focused on short-form video and social features. Example (adjust to match your app exactly):
  “spakspak is a short-form video app. Watch reels, record and share your own, update your profile and follow creators. Profile pictures and reels use your camera, microphone, and photo library.”

**Keywords** (max 100 characters, comma-separated, no spaces after commas):
- `reels,short video,social,video,share,creators,feed`

**In-App Purchases / Payments (required disclosure for this project):**
- This app does **not** use Apple In-App Purchase. Where App Store Connect asks about in-app purchases or payment, state: **“This app does not use Apple In-App Purchase. Any paid features (e.g. ads, subscriptions, tips) are processed outside the app via our website (Stripe).”**

**Age Rating:** Complete the questionnaire; for a reels/UGC app you will typically get 12+ or 17+. Set the rating that matches your content policy.

**Export Compliance:** If you only use standard HTTPS and Stripe handles payment data: answer **No** to using encryption for purposes other than standard transport (answer the questionnaire honestly).

9.3 Screenshots and previews
- You need screenshots for at least one iPhone size (e.g. 6.7", 6.5", or 5.5"). Optional: iPad. Use real app screens; no placeholder text or "Lorem ipsum." Video previews (optional) can show reels; keep them short and representative of the app. Reels/video apps are often checked for content policy; ensure screenshots and previews do not show prohibited content.

9.4 App privacy
- In App Store Connect, open your app → App Privacy. Declare what data you collect (e.g. account info, user-generated content, identifiers). If you use analytics or third-party SDKs, declare those. For camera, microphone, and photo library, you already have usage descriptions in Info.plist; privacy labels should match that usage.

9.5 Stripe payment disclosure
- Your app uses Stripe (payments outside the app). In the app’s "App Information" or where Apple asks about in-app purchases: indicate that the app does not use Apple In-App Purchase for digital goods or services, and that purchases (e.g. ads, subscriptions, or tips) are made through your website or external payment (Stripe). If there is a "Merchant" or "Payment" section, describe external payment. Payment is completed in the user's default browser (Safari), not in-app; no WebView is used. This aligns with Guideline 3.1.1 for the US storefront (link out to default browser for payment). If you offer any paid features (e.g. promoted reels, subscriptions), make it clear they are fulfilled outside the app so review does not expect IAP.

9.6 Export compliance
- In the version’s "App Store" tab, under "General" or "App Information," there is Export Compliance. If your app only uses standard HTTPS and no custom encryption beyond that, you can often answer "No" to using encryption for purposes other than standard transport. If you use Stripe, they handle card data; your app typically does not need to declare proprietary encryption. Answer the questionnaire honestly; incorrect answers can cause rejection.

9.7 Content rating
- Complete the questionnaire (e.g. violence, sexual content, user-generated content). For a reels app with UGC, you will often get a higher rating (e.g. 12+ or 17+) depending on whether you allow mature content. Set the correct rating; mismatched content leads to rejection.

---

## 10. TestFlight Setup

10.1 Internal testing
- In App Store Connect, open your app → TestFlight. Once the build is processed, it appears under "iOS Builds." Add "Internal Testers" (team members with App Store Connect access). They get the build without Beta App Review; limit 100.

10.2 External testing
- Create an "External Group" and add testers by email. The first build for that group goes through Beta App Review (often 24–48 hours). After approval, testers can install via the TestFlight app. Useful to validate the production build and deep links (e.g. reelapp:// or https://api.spakspak.com/share/reel/...) before full App Review.

10.3 Build processing timeline
- After upload, processing usually takes 5–30 minutes. You receive an email when the build is ready. If it stays "Processing" for hours, check the resolution center and email for "Invalid Binary" or missing compliance; fix and upload a new build with an incremented build number.

---

## 11. App Review Submission

11.1 What Apple checks first
- Metadata and screenshots, privacy and permissions, crash-free launch, login/demo account if required, and adherence to guidelines (e.g. no placeholder content, no broken features). For video/reels apps they also check content policy and that the app does not facilitate harmful or prohibited content.

11.2 Common rejection reasons for reel/video apps
- Missing or vague permission strings for camera, microphone, or photo library: your Info.plist already has these; keep them specific.
- Login/demo account not provided: if the app requires sign-in, provide a test account in the "App Review Information" section and note how to use it (e.g. "Sign in with this account to see the reels feed").
- Crashes on launch or major flows: test the exact build you uploaded on a real device.
- User-generated content without moderation or reporting: if users can upload reels, mention content moderation and reporting in the app description or review notes; implement reporting and block where appropriate.
- In-App Purchase confusion: do not mention "buy" or "subscribe" in a way that suggests IAP if you use Stripe; clarify "payment is processed outside the app."

11.3 Stripe payment compliance (Guideline 3.1.1)
- **Ad Plans** must be purchased **outside the app**: the app opens the Stripe checkout URL in the **device default browser** (e.g. Safari) via `Linking.openURL`. There is no in-app WebView or in-app payment form for Ad Plans. This satisfies Guideline 3.1.1 for the US storefront (linking out to default browser for payment).
- In **App Review notes**, state: "Ad Plans are purchased outside the app. When the user taps to buy an Ad Plan, they are taken to their default browser (Safari) to complete payment via Stripe. We do not use Apple In-App Purchase for these transactions, and no payment is collected inside the app."
- For storefronts other than the US where Apple does not allow external payment for digital goods, you would need to implement Apple In-App Purchase instead; the current implementation is correct for US.

---

## 12. Post-Submission Checklist

12.1 Build status meanings
- "Processing": build is being processed; wait for the email.
- "Ready to Submit": attach the build to a version and submit for review.
- "Missing Compliance": complete export compliance and any other required fields.
- "Invalid Binary": fix the issue in the email, increment build number, and upload a new archive.

12.2 Review timelines
- First review often takes 24–48 hours; sometimes longer. You get an email when the status changes (e.g. "In Review" then "Approved" or "Rejected").

12.3 Responding to rejections
- Read the resolution center message and the guideline cited. Fix the issue (code, metadata, or compliance), then either reply in Resolution Center if it was a misunderstanding, or upload a new build (increment build number), attach it to the version, and resubmit. Do not resubmit the same binary without addressing the feedback.
- **Guideline 3.1.1 (Payments - In-App Purchase):** If rejected for "Ad Plans can be purchased in the app using payment mechanisms other than in-app purchase," ensure Ad Plan checkout opens in the **default browser** (e.g. Safari) via a link/button, not in an in-app WebView. In Resolution Center you can reply: "We have updated the app so that Ad Plan payment is completed only in the user's default browser (Safari). The in-app WebView has been removed. Users tap a button to open the payment page in the browser and return to the app afterward."

12.4 Publishing to production
- After "Approved," the app status becomes "Ready for Sale" when you release it. You can set release to "Automatically" or "Manually." If manual, click "Release This Version" when you are ready. The app then goes live in the App Store for the selected territories.

---

## Project-specific quick reference

- Open in Xcode: `ios/spakspak.xcworkspace` (not .xcodeproj).
- Bundle ID: `com.Indaitechnologies.spakspak`.
- App name: spakspak.
- Version and build: set in app.json (expo.version, expo.ios.buildNumber) and kept in sync in ios/spakspak/Info.plist and Xcode (MARKETING_VERSION, CURRENT_PROJECT_VERSION). Current: version 1.0.6, build 6. Increment build for each upload.
- Capabilities: Associated Domains (applinks:api.spakspak.com); enable Push Notifications only if used.
- Payments: Stripe (external); no In-App Purchase capability; disclose in App Store Connect.
- First archive: Product → Archive with "Any iOS Device" selected; then Distribute App → App Store Connect → Upload. Alternatively: `npm run build:eas-ios-production` then `eas submit --platform ios --latest` (configure eas.json submit.production.ios with your Apple ID and App Store Connect app ID).

**General → App Information (copy-paste):**
- Name: `spakspak` | Subtitle: `Watch and share short videos` | Primary: `Social Networking` | Copyright: `© 2025 Indaitechnologies` | Keywords: `reels,short video,social,video,share,creators,feed`

This guide is a one-time playbook for your first iOS submission. Keep a copy in the repo and update version/build and any capability changes as the app evolves.
