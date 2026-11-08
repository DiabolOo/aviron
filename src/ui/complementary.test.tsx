import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/src/design';
import { BackHeader } from '@/src/ui/BackHeader';
import { ChoiceChips } from '@/src/ui/ChoiceChips';
import { ConsentBlock } from '@/src/ui/ConsentBlock';
import { DayDots } from '@/src/ui/DayDots';
import { NumberedList } from '@/src/ui/NumberedList';
import { OptionCard } from '@/src/ui/OptionCard';
import { PaceSteps } from '@/src/ui/PaceSteps';
import { PastWeekRow } from '@/src/ui/PastWeekRow';
import { PeriodCard } from '@/src/ui/PeriodCard';
import { RaceList } from '@/src/ui/RaceList';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { SettingsGroup } from '@/src/ui/SettingsGroup';
import { SourceChip } from '@/src/ui/SourceChip';
import { StepHeader } from '@/src/ui/StepHeader';
import { withPreview } from '@/src/ui/v3-test-utils';
import { WeekBars } from '@/src/ui/WeekBars';
import { WeekList } from '@/src/ui/WeekList';

jest.mock('lucide-react-native', () => ({
  Check: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  Sparkles: () => null,
}));

const bg = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style).backgroundColor;

describe('en-têtes', () => {
  it('BackHeader : retour en texte, « Fermer » pour la modale', async () => {
    const onBack = jest.fn();
    const onClose = jest.fn();
    await render(<BackHeader label="Cette semaine" onBack={onBack} onClose={onClose} />);
    await fireEvent.press(screen.getByLabelText('Retour : Cette semaine'));
    await fireEvent.press(screen.getByText('Fermer'));
    expect(onBack).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('ScreenHeader : titre, phrase de rôle, lien ; avatar d’Aujourd’hui', async () => {
    const onPress = jest.fn();
    const { unmount } = await render(<ScreenHeader title="Coach" subtitle="Tu demandes, il prépare, tu valides." action={{ label: 'Historique', onPress }} />);
    expect(screen.getByText('Tu demandes, il prépare, tu valides.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Historique'));
    expect(onPress).toHaveBeenCalled();
    await unmount();
    await render(<ScreenHeader eyebrow="Lundi 2 novembre · phase de base" title="Bonjour, Jul" avatar={{ initial: 'J', onPress }} />);
    expect(screen.getByText('Lundi 2 novembre · phase de base')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('avatar-button'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('StepHeader : « 2 sur 4 », deux segments faits, retour facultatif', async () => {
    await render(<StepHeader step={2} total={4} label="2 sur 4" />);
    expect(screen.getByText('2 sur 4')).toBeTruthy();
    expect(screen.getAllByTestId('step-done')).toHaveLength(2);
    expect(screen.getAllByTestId('step-todo')).toHaveLength(2);
    expect(screen.queryByLabelText('Étape précédente')).toBeNull();
  });

  it('SourceChip : lu « Source : … »', async () => {
    await render(<SourceChip label="COROS, via Strava" />);
    expect(screen.getByLabelText('Source : COROS, via Strava')).toBeTruthy();
  });
});

describe('Semaine', () => {
  it('WeekList : ligne du jour sur fond enfoncé, proposition en indigo, seule une séance faite se touche (Q6)', async () => {
    const onPress = jest.fn();
    await render(
      <WeekList
        days={[
          { id: 'mon', day: 'Lun 2', title: 'Footing 8 km', sub: 'Aujourd’hui', today: true, effort: { level: 'easy', scale: 'planned' } },
          { id: 'sat', day: 'Sam 7', title: 'Sortie longue 16 km', proposal: 'Le coach propose 12 km' },
          { id: 'sun', day: 'Dim 1', title: 'Footing 5 km', check: 'done', onPress },
        ]}
      />,
    );
    expect(bg('day-row-mon')).toBe(colors.light.surfaceSunken);
    expect(screen.getByText('Le coach propose 12 km').props.style).toEqual(expect.arrayContaining([{ color: colors.light.coach }]));
    expect(screen.getByTestId('day-row-sat').props.accessibilityRole).toBeUndefined();
    await fireEvent.press(screen.getByTestId('day-row-sun'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('day-check-done')).toBeTruthy();
  });

  it('PastWeekRow : période, détail, ouvre la semaine', async () => {
    const onPress = jest.fn();
    await render(<PastWeekRow title="26 oct. – 1 nov." detail="Rien d’importé" onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText('26 oct. – 1 nov., Rien d’importé'));
    expect(onPress).toHaveBeenCalled();
  });

  it('DayDots : vide, plein, aujourd’hui ; chaque jour lu avec son état', async () => {
    await render(
      <DayDots
        days={[
          { id: '1', label: 'Lun', state: 'today' },
          { id: '2', label: 'Mer', state: 'done' },
          { id: '3', label: 'Sam', date: '7', state: 'empty' },
        ]}
      />,
    );
    expect(screen.getByLabelText('Lun, aujourd’hui')).toBeTruthy();
    expect(screen.getByLabelText('Mer, fait')).toBeTruthy();
    expect(screen.getByLabelText('Sam 7')).toBeTruthy();
  });
});

describe('graphiques', () => {
  it('WeekBars : jour mis en avant en encre, jour vide en trait plat', async () => {
    await render(
      <WeekBars
        accessibilityLabel="5 séances"
        legend="Nage lun."
        bars={[
          { id: 'l', label: 'L', value: 40 },
          { id: 'j', label: 'J', value: 68, highlight: true },
          { id: 's', label: 'S', value: 0 },
        ]}
      />,
    );
    expect(bg('bar-j')).toBe(colors.light.ink);
    expect(bg('bar-l')).toBe(colors.light.barNeutral);
    expect(screen.getByTestId('bar-flat-s')).toBeTruthy();
    expect(screen.getByLabelText('5 séances')).toBeTruthy();
  });

  it('PeriodCard : période, héros, « — » au-dessus d’une semaine vide, régularité en tête semibold', async () => {
    const onPrev = jest.fn();
    await render(
      <PeriodCard
        period="Mai 2026"
        onPrev={onPrev}
        hero={{ value: '4h50', caption: 'd’entraînement · 6 séances' }}
        barsLabel="Par semaine"
        bars={[
          { id: '4', label: '4 mai', value: 0, valueLabel: '—' },
          { id: '18', label: '18', value: 243, valueLabel: '4 h 03', highlight: true },
        ]}
        regularity={{ lead: '2 semaines actives sur 4', rest: ': celles du 11 et du 18 mai.' }}
      />,
    );
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('2 semaines actives sur 4')).toBeTruthy();
    expect(screen.queryByLabelText('Période suivante')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Période précédente'));
    expect(onPrev).toHaveBeenCalled();
  });

  it('PaceSteps : légende, moyenne et bornes ; le graphique est lu par sa phrase', async () => {
    await render(
      <PaceSteps
        legend="↑ plus vite"
        averageLabel="moy. 5:22"
        pace={[{ fromKm: 0, toKm: 21.1, value: 322 }]}
        axis={['km 0', 'km 21,1']}
        accessibilityLabel="Allure régulière."
      />,
    );
    expect(screen.getByText('moy. 5:22')).toBeTruthy();
    expect(screen.getByText('km 21,1')).toBeTruthy();
    expect(screen.getByLabelText('Allure régulière.')).toBeTruthy();
  });
});

describe('Progrès', () => {
  it('SegmentedControl : le segment choisi est plein, en encre', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        options={[
          { id: 'week', label: 'Semaine' },
          { id: 'month', label: 'Mois' },
        ]}
        value="month"
        onChange={onChange}
      />,
    );
    expect(bg('segment-month')).toBe(colors.light.buttonPrimary);
    await fireEvent.press(screen.getByText('Semaine'));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('RaceList : temps, écart, pastille « Record », ligne qui ouvre le débrief', async () => {
    const onPress = jest.fn();
    await render(
      <RaceList
        title="Tes semis"
        caption="écart à ton record"
        races={[
          { id: 'a', title: '11 oct. 2026 · Reims', sub: '5:22 /km · sans cardio', time: '1h53:09', gap: '+4:53', onPress },
          { id: 'b', title: '3 mars 2024', time: '1h48:16', record: true },
        ]}
      />,
    );
    expect(screen.getByText('+4:53')).toBeTruthy();
    expect(screen.getByTestId('race-record')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('race-a'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('débrief', () => {
  it('NumberedList : numéros, titre et phrase', async () => {
    await render(<NumberedList items={[{ id: 'a', title: 'Départ · 5:55 /km', body: '33 s plus lent.' }, { id: 'b', title: 'Final' }]} />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByLabelText('1. Départ · 5:55 /km. 33 s plus lent.')).toBeTruthy();
  });
});

describe('onboarding et profil', () => {
  it('OptionCard : radio coché, contour encre épais', async () => {
    const onPress = jest.fn();
    await render(<OptionCard testID="opt" title="Je débute" description="Très peu." selected onPress={onPress} />);
    const card = screen.getByTestId('opt');
    expect(card.props.accessibilityState).toEqual({ checked: true });
    expect(StyleSheet.flatten(card.props.style).borderColor).toBe(colors.light.ink);
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('ConsentBlock : ce qui part, jamais, et l’accord', async () => {
    const onChange = jest.fn();
    await render(<ConsentBlock sends="allures." never="ton nom." accepted={false} onChange={onChange} />);
    expect(screen.getByText('Ce qui part :')).toBeTruthy();
    expect(screen.getByText('Jamais :')).toBeTruthy();
    await fireEvent(screen.getByTestId('consent-toggle'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('SettingsGroup : titre, valeur, alerte, bascule et chevron', async () => {
    const onPress = jest.fn();
    const onChange = jest.fn();
    await render(
      <SettingsGroup
        title="Toi"
        rows={[
          { id: 'gear', label: 'Équipement', value: 'Montre avec cardio', sub: 'Aucune FC reçue depuis juin.' },
          { id: 'analyse', label: 'Analyser mes séances', toggle: { value: true, onChange } },
          { id: 'data', label: 'Données', onPress },
        ]}
      />,
    );
    expect(screen.getByText('Aucune FC reçue depuis juin.')).toBeTruthy();
    await fireEvent(screen.getByTestId('toggle-analyse'), 'valueChange', false);
    expect(onChange).toHaveBeenCalledWith(false);
    await fireEvent.press(screen.getByTestId('settings-data'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ChoiceChips', () => {
  it('texte agrandi : les puces passent une par rangée', async () => {
    const choices = [
      { id: 'a', label: 'Haut du corps' },
      { id: 'b', label: 'Jambes' },
    ];
    await render(withPreview({ fontScale: 1.3 }, <ChoiceChips choices={choices} columns={2} onChoose={jest.fn()} />));
    const rowA = screen.getByTestId('choice-a').parent?.parent;
    const rowB = screen.getByTestId('choice-b').parent?.parent;
    expect(rowA).not.toBe(rowB);
  });
});
