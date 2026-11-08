import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/src/design';

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.sm,
  },
  separator: { height: t.size.hairline, backgroundColor: t.colors.line },
}));

/** Carte de lignes séparées par un liseré (semaine, semaines passées, réglages, courses). */
export function ListCard({ children, header, testID }: { children: ReactNode; header?: ReactNode; testID?: string }) {
  const styles = useStyles();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.card} testID={testID}>
      {header}
      {rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
          {i > 0 ? <View style={styles.separator} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}
