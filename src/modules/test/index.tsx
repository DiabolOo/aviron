import { Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import type { LifeModule } from '@/src/modules/types';

function TestWidget() {
  return (
    <Card className="mt-6">
      <Label>Module test</Label>
      <Text className="mt-2 text-sm text-muted">Widget factice du registre de modules.</Text>
    </Card>
  );
}

export const testModule: LifeModule = {
  id: 'test',
  title: 'Test',
  enabledByDefault: false,
  entities: [],
  todayWidgets: [{ id: 'test-card', order: 60, Component: TestWidget }],
  dashboards: [],
  agentTools: [],
  analyzers: [],
};
