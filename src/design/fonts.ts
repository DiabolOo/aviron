import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { InterTight_600SemiBold, InterTight_700Bold } from '@expo-google-fonts/inter-tight';

import { fontFamily } from './theme';

/** Polices de la v3.1, indexées par le nom utilisé dans `fontFamily` : à passer à `useFonts`. */
export const designFonts = {
  [fontFamily.text.regular]: Inter_400Regular,
  [fontFamily.text.semibold]: Inter_600SemiBold,
  [fontFamily.display.semibold]: InterTight_600SemiBold,
  [fontFamily.display.bold]: InterTight_700Bold,
};
