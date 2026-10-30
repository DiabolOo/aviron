import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { useProposalStore } from '@/lib/proposalStore';

import { ProposalCard } from './ProposalCard';

export function ProposalStack() {
  const proposals = useProposalStore((s) => s.proposals);
  const accept = useProposalStore((s) => s.accept);
  const reject = useProposalStore((s) => s.reject);
  const edit = useProposalStore((s) => s.edit);

  const pending = proposals.filter((p) => p.status === 'pending');
  const top = pending[0];

  const [anim] = useState(() => new Animated.Value(1));
  const topId = top?.id;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [topId, anim]);

  if (!top) return null;

  return (
    <View className="mt-6">
      <Animated.View
        style={{
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}>
        <ProposalCard
          proposal={top}
          onAccept={(id) => void accept(id)}
          onReject={(id) => void reject(id)}
          onEdit={(id, payload) => void edit(id, payload)}
        />
      </Animated.View>
      {pending.length > 1 ? (
        <View className="mx-4">
          <View className="h-3 rounded-b-3xl border border-t-0 border-fg/5 bg-surface" />
          <Label className="mt-2 self-center">+{pending.length - 1}</Label>
        </View>
      ) : null}
    </View>
  );
}
