import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// If you have a custom hook for color scheme, import it. Otherwise, use a default value.
// import { useColorScheme } from '@/hooks/use-color-scheme';
// const colorScheme = useColorScheme();
const colorScheme = 'light'; // fallback if no hook

export default function RootLayout() {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
