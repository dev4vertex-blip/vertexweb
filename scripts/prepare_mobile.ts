/**
 * Mobile Preparation & Synchronization Utility
 *
 * Configures native Android and iOS projects for either:
 * - 'customer'   -> com.vertex.customer / VERTEX Customer
 * - 'technician' -> com.vertex.technician / VERTEX Technician
 *
 * Usage:
 *   npx tsx scripts/prepare_mobile.ts --target=technician --platform=android
 *   npx tsx scripts/prepare_mobile.ts --target=technician --platform=ios
 *   npx tsx scripts/prepare_mobile.ts --target=customer --platform=android
 *   npx tsx scripts/prepare_mobile.ts --target=customer --platform=ios
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TargetConfig {
  appId: string;
  appName: string;
  target: 'customer' | 'technician';
  preferenceGroup: string;
  versionCode: number;
  versionName: string;
  buildNumber: number;
  urlScheme: string;
}

const CONFIGS: Record<'customer' | 'technician', TargetConfig> = {
  customer: {
    appId: 'com.vertex.customer',
    appName: 'VERTEX Customer',
    target: 'customer',
    preferenceGroup: 'VERTEXCustomerApp',
    versionCode: 1,
    versionName: '1.0.0',
    buildNumber: 1,
    urlScheme: 'vertexcustomer',
  },
  technician: {
    appId: 'com.vertex.technician',
    appName: 'VERTEX Technician',
    target: 'technician',
    preferenceGroup: 'VERTEXTechnicianApp',
    versionCode: 1,
    versionName: '1.0.0',
    buildNumber: 1,
    urlScheme: 'vertextechnician',
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  let target: 'customer' | 'technician' = 'technician';
  let platform: 'android' | 'ios' | 'all' = 'android';
  let customVersionName: string | undefined;
  let customVersionCode: number | undefined;

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      const val = arg.split('=')[1].toLowerCase();
      if (val === 'customer' || val === 'technician') {
        target = val;
      }
    } else if (arg.startsWith('--platform=')) {
      const val = arg.split('=')[1].toLowerCase();
      if (val === 'android' || val === 'ios' || val === 'all') {
        platform = val as any;
      }
    } else if (arg.startsWith('--version-name=')) {
      customVersionName = arg.split('=')[1];
    } else if (arg.startsWith('--version-code=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!isNaN(parsed)) customVersionCode = parsed;
    }
  }

  return { target, platform, customVersionName, customVersionCode };
}

function updateAndroidConfig(cfg: TargetConfig) {
  const gradlePath = path.resolve('android/app/build.gradle');
  if (fs.existsSync(gradlePath)) {
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(/applicationId\s+"[^"]+"/, `applicationId "${cfg.appId}"`);
    gradle = gradle.replace(/namespace\s*=\s*"[^"]+"/, `namespace = "${cfg.appId}"`);
    gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${cfg.versionCode}`);
    gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${cfg.versionName}"`);
    fs.writeFileSync(gradlePath, gradle, 'utf8');
    console.log(`[Android] Updated build.gradle: applicationId="${cfg.appId}", versionCode=${cfg.versionCode}, versionName="${cfg.versionName}"`);
  }

  const stringsPath = path.resolve('android/app/src/main/res/values/strings.xml');
  if (fs.existsSync(stringsPath)) {
    let strings = fs.readFileSync(stringsPath, 'utf8');
    strings = strings.replace(/<string name="app_name">[^<]+<\/string>/, `<string name="app_name">${cfg.appName}</string>`);
    strings = strings.replace(/<string name="title_activity_main">[^<]+<\/string>/, `<string name="title_activity_main">${cfg.appName}</string>`);
    strings = strings.replace(/<string name="package_name">[^<]+<\/string>/, `<string name="package_name">${cfg.appId}</string>`);
    strings = strings.replace(/<string name="custom_url_scheme">[^<]+<\/string>/, `<string name="custom_url_scheme">${cfg.urlScheme}</string>`);
    fs.writeFileSync(stringsPath, strings, 'utf8');
    console.log(`[Android] Updated strings.xml: app_name="${cfg.appName}", scheme="${cfg.urlScheme}"`);
  }

  const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');

    const commonPermissions = `    <!-- Core Network Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <!-- Media & Camera for Issue / Job Documentation -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
    <!-- Location for Doorstep Service Address Validation & Navigation -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <!-- Push Notifications for Real-time Updates -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`;

    const technicianExtraPermissions = `
    <!-- Technician-Only Mobility: On-Duty Dispatch & Background Location -->
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />`;

    const targetPermissions = cfg.target === 'technician'
      ? `${commonPermissions}${technicianExtraPermissions}\n</manifest>`
      : `${commonPermissions}\n</manifest>`;

    manifest = manifest.replace(/<!-- Permissions -->[\s\S]*<\/manifest>/, `<!-- Permissions -->\n${targetPermissions}`);
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log(`[Android] Updated AndroidManifest.xml permissions for target: ${cfg.target}`);
  }

  // Ensure target Java package directory and MainActivity exist
  const javaPackageDir = path.resolve(`android/app/src/main/java/com/vertex/${cfg.target}`);
  if (!fs.existsSync(javaPackageDir)) {
    fs.mkdirSync(javaPackageDir, { recursive: true });
  }
  const mainActivityPath = path.join(javaPackageDir, 'MainActivity.java');
  fs.writeFileSync(
    mainActivityPath,
    `package ${cfg.appId};\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {}\n`,
    'utf8'
  );
  console.log(`[Android] Verified MainActivity.java at ${mainActivityPath} with package ${cfg.appId}`);
}

function updateIosConfig(cfg: TargetConfig) {
  const plistPath = path.resolve('ios/App/App/Info.plist');
  if (fs.existsSync(plistPath)) {
    let plist = fs.readFileSync(plistPath, 'utf8');
    plist = plist.replace(
      /<key>CFBundleDisplayName<\/key>[\s\n]*<string>[^<]+<\/string>/,
      `<key>CFBundleDisplayName</key>\n\t<string>${cfg.appName}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleIdentifier<\/key>[\s\n]*<string>[^<]+<\/string>/,
      `<key>CFBundleIdentifier</key>\n\t<string>${cfg.appId}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleShortVersionString<\/key>[\s\n]*<string>[^<]+<\/string>/,
      `<key>CFBundleShortVersionString</key>\n\t<string>${cfg.versionName}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleVersion<\/key>[\s\n]*<string>[^<]+<\/string>/,
      `<key>CFBundleVersion</key>\n\t<string>${cfg.buildNumber}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleURLName<\/key>[\s\n]*<string>[^<]+<\/string>/,
      `<key>CFBundleURLName</key>\n\t\t\t<string>${cfg.appId}</string>`
    );
    plist = plist.replace(
      /<key>CFBundleURLSchemes<\/key>[\s\n]*<array>[\s\n]*<string>[^<]+<\/string>[\s\n]*<\/array>/,
      `<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${cfg.urlScheme}</string>\n\t\t\t</array>`
    );
    fs.writeFileSync(plistPath, plist, 'utf8');
    console.log(`[iOS] Updated Info.plist: CFBundleDisplayName="${cfg.appName}", CFBundleIdentifier="${cfg.appId}", version="${cfg.versionName}" (${cfg.buildNumber}), scheme="${cfg.urlScheme}"`);
  }

  const pbxprojPath = path.resolve('ios/App/App.xcodeproj/project.pbxproj');
  if (fs.existsSync(pbxprojPath)) {
    let pbx = fs.readFileSync(pbxprojPath, 'utf8');
    pbx = pbx.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${cfg.appId};`);
    pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${cfg.versionName};`);
    pbx = pbx.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${cfg.buildNumber};`);
    fs.writeFileSync(pbxprojPath, pbx, 'utf8');
    console.log(`[iOS] Updated project.pbxproj: bundleId="${cfg.appId}", version="${cfg.versionName}"`);
  }
}

async function run() {
  const { target, platform, customVersionName, customVersionCode } = parseArgs();
  const cfg = { ...CONFIGS[target] };

  if (customVersionName) {
    cfg.versionName = customVersionName;
  }
  if (customVersionCode) {
    cfg.versionCode = customVersionCode;
    cfg.buildNumber = customVersionCode;
  }

  console.log(`====================================================`);
  console.log(`  PREPARING MOBILE TARGET: ${cfg.appName.toUpperCase()}`);
  console.log(`  Application ID: ${cfg.appId}`);
  console.log(`  Version: ${cfg.versionName} (Code/Build: ${cfg.versionCode})`);
  console.log(`  Platform: ${platform}`);
  console.log(`====================================================\n`);

  // 1. Update native project descriptors
  updateAndroidConfig(cfg);
  updateIosConfig(cfg);

  // Verify Icon & Splash status
  console.log(`\n[Assets] Verifying brand icons and launch splash configuration for ${cfg.appName}...`);
  const androidIcon = path.resolve('android/app/src/main/res/mipmap-hdpi/ic_launcher.png');
  const androidSplash = path.resolve('android/app/src/main/res/drawable/splash.png');
  const iosIcon = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  const iosSplash = path.resolve('ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png');

  if (fs.existsSync(androidIcon) && fs.existsSync(androidSplash) && fs.existsSync(iosIcon) && fs.existsSync(iosSplash)) {
    console.log(`[Assets] Native launcher icon and splash references verified (placeholders configured).`);
    console.log(`[Assets] NOTICE: Final production icon asset must be supplied.`);
    console.log(`[Assets] NOTICE: Final production splash asset must be supplied.`);
  }

  // 2. Build isolated Web bundle for the target
  console.log(`\n[Vite] Building web bundle for VITE_APP_TARGET=${cfg.target}...`);
  execSync(`VITE_APP_TARGET=${cfg.target} npx vite build`, {
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_TARGET: cfg.target, CAPACITOR_APP_TARGET: cfg.target },
  });

  // 3. Sync to Capacitor platform
  const syncPlatform = platform === 'all' ? '' : platform;
  console.log(`\n[Capacitor] Synchronizing plugins & assets to ${platform}...`);
  execSync(`CAPACITOR_APP_TARGET=${cfg.target} npx cap sync ${syncPlatform}`.trim(), {
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_TARGET: cfg.target, CAPACITOR_APP_TARGET: cfg.target },
  });

  console.log(`\n====================================================`);
  console.log(`  SUCCESSFULLY PREPARED ${cfg.appName.toUpperCase()} FOR ${platform.toUpperCase()}`);
  console.log(`====================================================\n`);
}

run().catch((err) => {
  console.error('Mobile preparation failed:', err);
  process.exit(1);
});
