import FamilyHealthDashboard from '@/components/health/FamilyHealthDashboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HealthScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FamilyHealthDashboard />
    </SafeAreaView>
  );
} 