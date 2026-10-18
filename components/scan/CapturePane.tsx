import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Images } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/lib/useTheme';

type CapturePaneProps = {
  onCapture: (uri: string) => void;
};

const CORNERS = [
  'left-5 top-5 rounded-tl-2xl border-l-2 border-t-2',
  'right-5 top-5 rounded-tr-2xl border-r-2 border-t-2',
  'bottom-5 left-5 rounded-bl-2xl border-b-2 border-l-2',
  'bottom-5 right-5 rounded-br-2xl border-b-2 border-r-2',
];

export function CapturePane({ onCapture }: CapturePaneProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { colors } = useTheme();

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onCapture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) onCapture(photo.uri);
  };

  return (
    <View className="flex-1">
      <Label className="mt-2">Scan IA</Label>
      <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">Ton assiette</Text>

      <View className="mt-6 flex-1 overflow-hidden rounded-4xl border border-fg/5 bg-surface">
        {permission?.granted ? (
          <View className="flex-1">
            <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />
            <View pointerEvents="none" className="absolute inset-0">
              {CORNERS.map((position) => (
                <View key={position} className={`absolute h-10 w-10 border-accent ${position}`} />
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-base text-muted">
              Calories et macros en une photo.
            </Text>
            <View className="mt-6 self-stretch">
              <PrimaryButton label="Activer la caméra" onPress={() => void requestPermission()} />
            </View>
          </View>
        )}
      </View>

      <View className="mt-6 flex-row items-center justify-between px-6">
        <IconButton label="Importer depuis la galerie" onPress={() => void pickFromLibrary()}>
          <Images color={colors.fg} size={19} strokeWidth={1.8} />
        </IconButton>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Prendre la photo"
          onPress={() => void takePhoto()}
          className="h-20 w-20 items-center justify-center rounded-full border-2 border-fg/15 active:opacity-80">
          <View className="h-16 w-16 rounded-full bg-accent" />
        </Pressable>
        <View className="h-11 w-11" />
      </View>
    </View>
  );
}
