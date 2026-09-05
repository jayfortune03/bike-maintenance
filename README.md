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
- Nickname, tipe, warna, detail motor, dan odometer saat ini
- Riwayat perubahan odometer
- Tema aksen mengikuti motor aktif

### Perawatan

- Template perawatan berdasarkan model atau tipe motor
- Jadwal berdasarkan jarak, waktu, atau kombinasi keduanya
- Status `Aman`, `Segera`, `Sudah waktunya`, dan `Terlambat`
- Menandai perawatan selesai
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
| Form | React Hook Form + Zod | Standar pengelolaan dan validasi form sesuai PRD |
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

Jalankan prebuild pertama kali atau setelah konfigurasi native berubah:

```sh
bunx expo prebuild
```

Lalu jalankan aplikasi:

```sh
bun run android
```

`react-native-mmkv`, Expo Notifications, dan Expo Calendar membutuhkan **Expo Development Build**. Fitur tersebut tidak ditujukan untuk Expo Go.

## Menjalankan iOS

Project ini Android-first dan tidak memiliki optimasi iOS khusus di MVP, tetapi dapat dijalankan untuk pengecekan dasar:

```sh
bunx expo prebuild
bun run ios
```

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
bun test
```

Build check untuk web:

```sh
bunx expo export --platform web
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
