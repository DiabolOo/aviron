import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable', headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }} />
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-lg font-semibold text-fg">Cet écran n’existe pas.</Text>
        <Link href="/" className="mt-4">
          <Text className="text-fg underline">Retour à Aujourd’hui</Text>
        </Link>
      </View>
    </>
  );
}
