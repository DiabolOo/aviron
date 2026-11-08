/**
 * Écran Profil (`213`) — modale ouverte par l'avatar.
 *
 * Avatar + nom + objectif, deux SettingsGroup (Toi, Personnalisation),
 * liens vers Données et Réglages.
 */
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { NBSP } from '@/src/core/sportFormat';
import { LEVEL_OPTIONS, EQUIPMENT_OPTIONS } from '@/src/core/training/level';
import { makeStyles, useTheme } from '@/src/design';
import { BackHeader } from '@/src/ui/BackHeader';
import { SettingsGroup, type SettingsRow } from '@/src/ui/SettingsGroup';
import { Text } from '@/src/ui/Text';
import { useTabBarInset } from '@/src/ui/useTabBarInset';

// ─── Styles ────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  avatar: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: t.space.xs },
}));

// ─── Screen ────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();

  const profile = usePulseFitStore((s) => s.profile);
  const consent = usePulseFitStore((s) => s.aiConsent);
  const setConsent = usePulseFitStore((s) => s.setAiConsent);

  const firstName = profile.firstName || 'Utilisateur';
  const initial = firstName.charAt(0).toUpperCase();

  const levelLabel = LEVEL_OPTIONS.find((o) => o.id === profile.level)?.label ?? '–';
  const equipmentLabel = EQUIPMENT_OPTIONS.find((o) => o.id === profile.equipment)?.label ?? '–';

  const goalLabel = profile.athleticGoal
    ? `${profile.athleticGoal.targetName ?? 'Course'}${profile.athleticGoal.targetDate ? `${NBSP}en${NBSP}${profile.athleticGoal.targetDate}` : ''}`
    : '–';

  // ── Toi ──
  const toiRows: SettingsRow[] = [
    { id: 'level', label: 'Niveau', value: levelLabel },
    { id: 'equipment', label: 'Équipement', value: equipmentLabel },
    { id: 'goal', label: 'Objectif', value: goalLabel },
  ];

  // ── Personnalisation ──
  const personRows: SettingsRow[] = [
    {
      id: 'level-choice',
      label: 'Niveau choisi',
      value: consent ? 'Avec un coach IA' : 'Sur ton téléphone',
    },
    {
      id: 'analysis',
      label: 'Analyser mes séances',
      sub: 'Sur ton téléphone',
    },
    {
      id: 'ai-consent',
      label: 'Envoyer un résumé à l\u2019IA',
      sub: consent ? 'Le retirer ne supprime rien' : undefined,
      toggle: { value: consent, onChange: setConsent },
    },
  ];

  // ── Links ──
  const linkRows: SettingsRow[] = [
    { id: 'data', label: 'Données', onPress: () => router.push('/profile/data') },
    { id: 'settings', label: 'Réglages', value: 'Apparence, modules', onPress: () => router.push('/profile/modules') },
  ];

  return (
    <View style={styles.root} testID="profile-screen">
      <View style={styles.header}>
        <BackHeader onClose={() => router.back()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Avatar + nom ── */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text role="body" weight="semibold" color="onButtonPrimary">{initial}</Text>
          </View>
          <View style={styles.identity}>
            <Text role="title">{firstName}</Text>
            {profile.athleticGoal?.targetName ? (
              <Text role="sub" color="inkSecondary">
                {profile.athleticGoal.targetName}
                {profile.athleticGoal.targetDate ? `${NBSP}·${NBSP}${profile.athleticGoal.targetDate}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Toi ── */}
        <SettingsGroup title="Toi" rows={toiRows} />

        {/* ── Personnalisation ── */}
        <SettingsGroup title="Personnalisation" rows={personRows} />

        {/* ── Liens ── */}
        <SettingsGroup rows={linkRows} />

      </ScrollView>
    </View>
  );
}
