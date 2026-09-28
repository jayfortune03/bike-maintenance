# Motor Care

Motor Care adalah aplikasi mobile personal untuk membantu pemilik motor memantau kondisi dan jadwal perawatan. Aplikasi ini berfungsi seperti **health dashboard untuk motor**: pengguna dapat melihat apa yang perlu diperhatikan sekarang, memperbarui odometer, mencatat servis, dan mengatur pengingat.

## Overview

- Platform utama: Android
- Tipe aplikasi: React Native client-side MVP
- Bahasa UI: Bahasa Indonesia terlebih dahulu, siap dilokalkan
- Tema: Material Design 3 dengan default biru dan aksen dinamis per motor
- Penyimpanan: lokal di perangkat
- Backend: tidak ada
- Login dan akun: tidak ada
- Fokus: sederhana, tenang, action-oriented, dan transparan mengenai sumber rekomendasi

## Fitur MVP

### Garage

- Menambah, mengubah, dan menghapus motor
- Menyimpan beberapa profil motor
- Memilih motor aktif
- Nickname, tipe, warna, foto lokal, detail motor, dan odometer saat ini
- Riwayat perubahan odometer
- Tema aksen mengikuti motor aktif

### Perawatan

- Template perawatan berdasarkan model atau tipe motor
- Jadwal berdasarkan jarak, waktu, atau kombinasi keduanya
- Status `Aman`, `Segera`, `Sudah waktunya`, dan `Terlambat`
- Menandai perawatan selesai
- Mencatat tanggal servis terakhir saat membuat jadwal atau memasukkan riwayat
- Riwayat perawatan
- Jadwal perawatan custom
- Label sumber rekomendasi seperti rekomendasi umum atau jadwal custom

### Pengingat dan kalender

- Pengingat satu kali atau berulang
- Notifikasi lokal di perangkat
- Menambah, mengubah, dan menghapus pengingat
- Sinkronisasi event dengan kalender perangkat
- Penanganan izin dan kegagalan integrasi tanpa menghapus pengingat lokal

### Pengalaman pengguna

- Home dashboard dengan motor aktif, odometer, status maintenance, aksi cepat, dan aktivitas terbaru
- Bottom navigation: Home, Garage, Perawatan, Pengaturan
- Light mode dan dark mode
- Empty state dan feedback untuk alur penting
- Dukungan offline
- Tidak menggunakan AI atau klaim rekomendasi pintar

## Tech Stack

Stack berikut mengikuti spesifikasi teknis pada `PRD.md`.

| Area | Teknologi | Peran |
| --- | --- | --- |
| Runtime | React Native | Aplikasi mobile cross-platform |
| Bahasa | TypeScript strict mode | Type safety dan kontrak domain |
| Platform | Expo | Tooling dan runtime React Native |
| Build native | Expo Development Build | Menjalankan modul native seperti MMKV, notifikasi, dan kalender |
| Navigasi | Expo Router | File-based routing dan bottom navigation |
| UI | React Native Paper | Komponen UI dengan Material Design 3 |
| Animasi | React Native Reanimated | Animasi UI yang halus |
| Gesture | React Native Gesture Handler | Interaksi gesture native |
| State | Zustand | Runtime state dan UI state |
| Persistensi state | Zustand Persist | Persistensi state melalui storage adapter |
| Storage | `react-native-mmkv` | Penyimpanan lokal native yang cepat dan sinkron |
| Form | React state + validasi lokal | Implementasi saat ini; React Hook Form + Zod di PRD belum digunakan |
| Tanggal | Day.js | Manipulasi dan perhitungan tanggal |
| Notifikasi | Expo Notifications | Scheduled local notification |
| Kalender | Expo Calendar | Integrasi event kalender perangkat |

### Arsitektur data

```text
React Native UI
      ↓
Feature components / hooks
      ↓
Zustand store
      ↓
Storage adapter
      ↓
MMKV
```

Data inti yang dipersist:

- profil motor
- log odometer
- aturan perawatan
- riwayat perawatan
- pengingat
- preferensi tema

Static template perawatan berada di `src/data/` dan disalin menjadi aturan milik motor saat motor dibuat. Template asli tidak diubah.

## Persiapan

Pastikan sudah tersedia:

- Bun
- Android Studio, Android SDK, dan emulator atau perangkat Android untuk development Android
- Xcode dan CocoaPods jika ingin menjalankan iOS

Install dependency:

```sh
bun install
```

## Menjalankan Android

Proyek `android/` dan `ios/` sudah ada dan dilacak Git. Jangan menjalankan `expo prebuild --clean` untuk build biasa karena dapat menimpa perubahan native. Jika config plugin berubah, jalankan prebuild secara sengaja dan tinjau diff native-nya.

Pilih JDK 17 dan jalankan development build pada emulator/perangkat:

```sh
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
bun run android
```

Command `JAVA_HOME` di atas khusus macOS. Di OS lain arahkan `JAVA_HOME` ke instalasi JDK 17. `react-native-mmkv` dan Expo Calendar memerlukan build native milik aplikasi; Expo Go tidak cukup untuk menjalankan seluruh fitur proyek ini.

## Menjalankan iOS

Memerlukan macOS, Xcode lengkap (bukan hanya Command Line Tools), CocoaPods, dan simulator/perangkat. Setelah dependency native terpasang:

```sh
bun run ios
```

Untuk simulator pertama kali, buka Xcode dan pasang runtime iOS. Untuk perangkat fisik, atur signing/team Apple di workspace `ios/MotorCare.xcworkspace` setelah CocoaPods selesai.

## Build APK dan iOS via EAS Cloud

`eas.json` menyediakan tiga profil: `preview` untuk pengujian internal, `simulator` untuk iOS Simulator, dan `production` untuk distribusi store. Konfigurasi saat ini sudah memiliki `extra.eas.projectId` dan owner Expo. Gunakan akun yang memiliki akses ke proyek tersebut.

Login dan periksa proyek yang terhubung:

```sh
bunx eas-cli@latest login
bunx eas-cli@latest project:info
```

Build APK Android yang bisa dipasang tanpa Metro:

```sh\
bunx eas-cli@latest build --platform android --profile preview
```

Unduh APK dari link hasil build. Pasang di Android dengan izin instalasi aplikasi dari sumber tersebut, atau `adb install -r /path/to/app.apk`. EAS akan meminta konfigurasi signing/keystore; simpan credential dengan aman, jangan commit.

Build iOS untuk perangkat fisik terdaftar:

```sh
bunx eas-cli@latest device:create
bunx eas-cli@latest build --platform ios --profile preview
```

Distribusi internal iOS memerlukan akun Apple Developer berbayar dan perangkat yang didaftarkan dalam provisioning profile. IPA tidak dapat dipasang bebas ke semua iPhone seperti APK Android.

Build untuk TestFlight/App Store dan Play Store:

```sh
bunx eas-cli@latest build --platform ios --profile production
bunx eas-cli@latest build --platform android --profile production
```

Android production menghasilkan **AAB**, bukan APK. Build iOS production dapat dikirim ke App Store Connect/TestFlight melalui EAS Submit setelah konfigurasi akun Apple. Build tidak otomatis mempublikasikan aplikasi. Pastikan identifier `com.motorcare.app` tersedia pada akun/store Anda; bila perlu diubah, sinkronkan juga project native, bukan hanya `app.json`.

Build iOS Simulator tanpa signing perangkat:

```sh
bunx eas-cli@latest build --platform ios --profile simulator
```

**Build iOS melalui EAS cloud tidak membutuhkan Mac lokal.** Menjalankan hasil simulator atau membangun iOS secara lokal tetap membutuhkan Mac dan Xcode. Build cloud membutuhkan akun Expo, internet, serta kuota/biaya sesuai paket EAS. Command di atas belum dijalankan untuk akun Anda.

## Build APK Lokal

Dengan JDK 17, Android SDK/NDK yang diminta Gradle, dan lisensi Android yang disetujui:

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 17) ./android/gradlew -p android assembleRelease
```

Hasil: `android/app/build/outputs/apk/release/app-release.apk`. Konfigurasi Gradle saat ini masih memakai **debug keystore untuk release lokal**: cocok untuk pengujian pribadi, bukan publikasi Play Store. Untuk distribusi production gunakan signing yang benar; EAS dapat mengelola credential build cloud. File APK/AAB tidak dihasilkan oleh `expo export`.

## Ikon dan Splash Screen

Aset ada di `assets/branding/`, dengan preview desain di `assets/branding/preview.html`:

- `mark.svg`: master vector motor dan tanda centang, dibuat khusus untuk Motor Care.
- `icon.png`: ikon 1024 x 1024 dengan latar biru, tanpa alpha untuk App Store.
- `adaptive-foreground.png` dan `adaptive-monochrome.png`: lapisan Android adaptive/themed icon, dengan padding untuk masker launcher.
- `splash-light.png` dan `splash-dark.png`: logo transparan untuk splash terang/gelap.
- `favicon.png`: ikon browser.

Konfigurasi Expo memakai `expo-splash-screen`. Aset launcher/splash juga sudah dipasang langsung ke project native yang dilacak Git: Android mencakup density mdpi-xxxhdpi dan iOS memakai image set 1x/2x/3x. Splash mengikuti tema sistem saat cold start, bukan warna motor yang baru tersedia setelah data aplikasi dimuat. Tidak ada timer loading buatan.

**Ikon dan splash memerlukan build native baru lalu instal ulang/update aplikasi.** Hot reload, preview web, dan Expo Go tidak menunjukkan hasil launcher/splash native final. Android 12+ dapat menentukan sendiri masker dan ukuran ikon splash. Untuk perubahan dependency iOS, CocoaPods harus diperbarui saat build berikutnya.

## Perilaku Reminder

- Notifikasi harian/mingguan/bulanan/tahunan mengikuti komponen tanggal dan jam lokal perangkat, bukan timer 24 jam sejak menekan Simpan. Android dapat menunda pengiriman akibat kebijakan baterai/OS; aplikasi ini bukan alarm presisi.
- Trigger native berulang tidak menyediakan tanggal mulai tertunda. Jika kecocokan berikutnya terjadi sebelum tanggal yang dipilih, aplikasi menolak integrasi notifikasinya dengan penjelasan, menyimpan pengingat lokal, dan tidak mengirim terlalu awal. Gunakan waktu mulai terdekat, reminder satu kali, atau kalender untuk mulai jauh di masa depan.
- Notifikasi bulanan mendukung tanggal 1-28. Notifikasi tahunan tidak memakai 29 Februari. Notifikasi custom belum didukung. Kalender mendukung pengulangan sesuai tanggal awal; interval custom tersimpan diartikan dalam hari.
- Kalender menggunakan zona waktu perangkat dan hanya memilih kalender yang dapat ditulis. Perubahan/penghapusan seri berlaku juga untuk kejadian berikutnya.
- Izin ditolak atau integrasi gagal ditampilkan sebagai peringatan. ID resource yang masih ada dipertahankan untuk percobaan ulang; penghapusan motor/reset dibatalkan jika resource terkait belum dapat dibersihkan.
- Menyelesaikan perawatan berbasis hari menjadwalkan ulang reminder satu kali yang terkait dan belum selesai. Reminder berulang mempertahankan jadwalnya; tanggal servis berbasis kilometer tidak ditebak.
- Mengetuk notifikasi membuka konteks yang masih tersimpan dan memilih motor terkait. Notifikasi untuk reminder yang sudah dihapus diabaikan.

## Preview di Web

Web hanya digunakan untuk mengecek layout dan alur UI. Jalankan:

```sh
bun run web
```

Buka `http://localhost:5050` di browser.

Preview web memakai `localStorage` sebagai fallback storage agar UI dapat dibuka di browser. Aplikasi native tetap menggunakan MMKV. Notifikasi lokal dan integrasi kalender hanya tersedia di Android/iOS.

Jika cache Metro bermasalah:

```sh
bunx expo start --web --port 5050 --clear
```

Jika muncul pesan port sedang digunakan, hentikan proses Expo lama dengan `Ctrl+C`, lalu jalankan ulang command di atas.

## Pemeriksaan

Type check:

```sh
bun run typecheck
```

Unit test:

```sh
bun run test
```

Pemeriksaan bundle web, Android, dan iOS (bukan build APK/IPA):

```sh
bunx expo export --platform all
```

## Struktur Project

```text
app/                    # Routes Expo Router
  (tabs)/               # Home, Garage, Perawatan, Pengaturan
  motorcycle/           # Alur profil motor
  maintenance/          # Detail dan custom maintenance
  reminder/             # Create dan edit reminder
src/
  components/           # Komponen UI bersama
  data/                 # Template maintenance statis
  domain/               # Tipe dan logika bisnis murni
  services/             # Notifikasi, kalender, reminder coordinator
  storage/              # Storage adapter MMKV dan web preview
  store/                # Zustand store
  theme/                # Material 3 theme dan dynamic accent
tests/                  # Unit test domain dan migration
```

## Batasan MVP

Fitur berikut memang tidak termasuk dalam scope:

- backend, REST API, database, atau cloud sync
- autentikasi dan registrasi
- remote push notification
- marketplace atau booking bengkel
- GPS, OBD, Bluetooth, dan deteksi odometer otomatis
- fuel tracking
- diagnosis atau assistant AI
- komunitas, chat, dan pembayaran
