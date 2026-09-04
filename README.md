# Motor Care

MVP Android-first untuk mencatat motor, odometer, jadwal perawatan, dan pengingat lokal.

## Jalankan

```sh
bun install
bunx expo prebuild
bun run android
```

`react-native-mmkv`, notifikasi, dan kalender membutuhkan development build, bukan Expo Go.

## Pemeriksaan

```sh
bun run typecheck
bun test
```

Semua data inti disimpan lokal menggunakan MMKV. Tidak ada login, backend, internet, atau cloud sync.
