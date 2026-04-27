# Flashcard Mobile (Flutter)

Flutter client for the Flashcard app. Talks to the FastAPI backend in `../app/`.

## First-time setup

### Ubuntu / Linux

```bash
# 1. Install Flutter (stable, no sudo)
mkdir -p ~/development && cd ~/development
curl -fsSLo flutter.tar.xz \
  https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.7-stable.tar.xz
tar -xf flutter.tar.xz && rm flutter.tar.xz

# Add to PATH (persist in ~/.bashrc or ~/.zshrc)
export PATH="$HOME/development/flutter/bin:$PATH"

# 2. Install dev dependencies
cd /path/to/flashcard/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# 3. Env file
cp .env.example .env
```

For Linux desktop builds you also need `clang cmake ninja-build pkg-config libgtk-3-dev`. For Android emulator support, install Android Studio and create an AVD.

### Windows

```powershell
# 1. Install Flutter (PowerShell, no admin)
$env:FLUTTER_HOME = "$HOME\development\flutter"
mkdir $HOME\development -Force
Invoke-WebRequest `
  -Uri https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.41.7-stable.zip `
  -OutFile flutter.zip
Expand-Archive flutter.zip -DestinationPath $HOME\development
Remove-Item flutter.zip

# Add to PATH for this session (persist via System Properties → Env Vars)
$env:Path += ";$HOME\development\flutter\bin"

# 2. Install dev dependencies
cd \path\to\flashcard\mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# 3. Env file
copy .env.example .env
```

For Windows desktop builds, install Visual Studio 2022 with the "Desktop development with C++" workload. For Android emulator support, install Android Studio.

> Pin to `3.41.7` matches the version CI uses. Bump together if you upgrade.

## Run the app

```bash
flutter devices              # see what's available
flutter run -d chrome        # web — fastest UI iteration
flutter run -d linux         # native Linux desktop window
flutter run -d windows       # native Windows desktop window
flutter run                  # pick interactively (emulator / physical device)
```

Backend reachability:

| Target              | Set `API_BASE_URL` to                |
| ------------------- | ------------------------------------ |
| Android emulator    | `http://10.0.2.2:8000`               |
| iOS simulator       | `http://localhost:8000`              |
| Physical device     | `http://<your-LAN-IP>:8000`          |
| Chrome / desktop    | `http://localhost:8000`              |

While `flutter run` is attached: press `r` for hot reload, `R` for hot restart, `q` to quit. Save any `.dart` file and the app updates in <1 s.

> Mobile-only plugins (`flutter_appauth`, `camera`, `image_picker`, `pdfx`, `flutter_secure_storage`) throw `MissingPluginException` on web/desktop. Use Chrome/desktop for visual iteration on the deck and card UIs; use an Android emulator or physical device for end-to-end auth, PDF, and camera flows.

## Day-to-day commands

```bash
flutter analyze                                              # static analysis
flutter test                                                 # unit + widget tests
flutter test test/db/app_database_test.dart                  # one file
dart run build_runner watch --delete-conflicting-outputs     # regen drift on save
flutter pub upgrade                                          # bump deps
```

### Running tests on Ubuntu < 22.04

`sqlite3_flutter_libs` ships a bundled `libsqlite3.so` built against glibc 2.33. On older hosts the drift tests detect this and call `markTestSkipped` rather than failing — CI on `ubuntu-latest` (glibc ≥ 2.35) runs them. If you're on Ubuntu 20.04 and want them to run locally, upgrade the host or use a 22.04+ container.

## CI

[.github/workflows/mobile-ci.yml](../.github/workflows/mobile-ci.yml) runs on every push/PR that touches `mobile/`:

| Job              | Runner          | What it checks                                     |
| ---------------- | --------------- | -------------------------------------------------- |
| `analyze-test`   | ubuntu-latest   | `flutter analyze --fatal-infos` + `flutter test`   |
| `build-android`  | ubuntu-latest   | `flutter build apk --debug` (artifact uploaded)    |
| `build-ios`      | macos-latest    | `flutter build ios --no-codesign --debug`          |

A debug APK is uploaded as a workflow artifact for 7 days — useful for quick install on a tester's device without a Play Store round-trip.

## Project layout

```
lib/
├── main.dart
├── core/
│   ├── api/      # Dio client + interceptors
│   ├── auth/     # Zitadel OIDC
│   ├── db/       # drift SQLite (books, cached cards)
│   └── router/   # go_router config
├── features/
│   ├── books/        # PDF import, file index
│   ├── cards/        # flip-card review
│   ├── decks/        # deck management
│   └── generation/   # send text/image → draft cards
└── shared/
    ├── models/       # DTOs matching backend schemas
    └── widgets/      # reusable UI (flip card, hardness badge)
```

## Status

Issue #11's acceptance criteria are implemented across PRs `mobile-impl-slice1-api` through `mobile-impl-slice8-polish`. The merged result has:

- Typed `Dio` API services for every backend router (auth, decks, cards, books, generation, templates) with a 401-refresh-and-retry interceptor.
- Auth state machine supporting both Zitadel OIDC (when `ZITADEL_*` env vars are set) and the FastAPI username/password JWT flow.
- Material 3 shell with bottom-nav and offline banner.
- Decks + cards CRUD, with a swipeable flip-card review session (swipe right=easy, up=medium, left=hard) backed by `flutter_card_swiper`.
- Book upload via `file_picker`, page-range driven card generation, draft review (approve / reject).
- Camera + gallery capture via `image_picker` + `flutter_image_compress`, posting base64-encoded JPEG to the backend's `/generate/from-image` endpoint.
- Offline-first card review: cached cards in drift, optimistic hardness updates queued when offline, drained on reconnect / login restore.
- Production polish: zone-guarded error reporter, connectivity awareness, accessible flip-card semantics, theme switcher (system / light / dark) persisted in `SharedPreferences`, app version display.

### Branding assets

App icon and native splash are generated from three placeholder PNGs in `assets/branding/`:

| File | Purpose |
| --- | --- |
| `icon.png` (1024×1024) | iOS icon + Android legacy icon source. |
| `icon_foreground.png` (1024×1024, transparent) | Android adaptive-icon foreground. Background is the brand colour from `pubspec.yaml`. |
| `splash_logo.png` (1024×1024, transparent) | Native splash logo, centred on the splash background colour. |

Replace these files with designer-supplied art and rerun the generators to update every platform-specific asset:

```bash
dart run flutter_launcher_icons
dart run flutter_native_splash:create
```

The generated platform files (`mipmap-*`, `Assets.xcassets`, `launch_background.xml`, etc.) are committed so a fresh checkout can build without rerunning the generators.

### Production deploy still needs

- A real Zitadel client (issuer / client ID / redirect URI) — the redirect scheme `com.flashcard.mobile` is already registered in `android/app/build.gradle.kts` and `ios/Runner/Info.plist`.
- Android release signing config: replace `signingConfigs.getByName("debug")` in `android/app/build.gradle.kts` with a release keystore.
- iOS code-signing certificate + App Store provisioning profile.
- Sentry / Crashlytics adapter — `lib/core/observability/error_reporter.dart` defines an `ErrorReporter` interface; wire a Sentry implementation by reading `SENTRY_DSN` via `--dart-define`.
- Real branding artwork — drop replacement PNGs into `assets/branding/` and rerun the icon + splash generators (see above).
