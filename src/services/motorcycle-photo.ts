import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

function photoDirectory() {
  return new Directory(Paths.document, 'motorcycle-photos');
}

export function persistMotorcyclePhoto(uri: string): string {
  if (Platform.OS === 'web') throw new Error('Simpan foto profil tersedia di aplikasi Android atau iOS.');

  const directory = photoDirectory();
  if (!directory.exists) directory.create({ intermediates: true });

  const source = new File(uri);
  const extension = ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(source.extension.toLowerCase())
    ? source.extension.toLowerCase()
    : '.jpg';
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`);
  source.copy(destination);
  return destination.uri;
}

export function removeMotorcyclePhoto(uri?: string): void {
  if (!uri || Platform.OS === 'web') return;
  try {
    const directory = photoDirectory();
    if (!uri.startsWith(`${directory.uri}/`)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A stale photo must not block a motorcycle edit, delete, or data reset.
  }
}
