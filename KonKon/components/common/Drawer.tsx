import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFamily } from '../../contexts/FamilyContext';

const { width } = Dimensions.get('window');

interface DrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const Drawer: React.FC<DrawerProps> = ({ isVisible, onClose }) => {
  const { userFamilies, activeFamily, switchFamily, familyMembers } = useFamily();
  const router = useRouter();
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withTiming(isVisible ? 0 : -width, { duration: 300 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleSwitchFamily = async (familyId: string) => {
    if (familyId !== activeFamily?.id) {
      await switchFamily(familyId);
    }
    onClose();
  };

  const handleCreateFamily = () => {
    onClose();
    router.push('/create-family');
  };

  const handleJoinFamily = () => {
    onClose();
    router.push('/join-family');
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>切换家庭</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.familyList}>
          {userFamilies.map((family) => (
            <TouchableOpacity 
              key={family.id} 
              style={[styles.familyItem, activeFamily?.id === family.id && styles.activeFamilyItem]}
              onPress={() => handleSwitchFamily(family.id)}
            >
              <View style={styles.familyIcon}>
                <Text style={styles.familyIconText}>{family.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.familyName}>{family.name}</Text>
                {activeFamily?.id === family.id &&
                  <Text style={styles.familyMemberCount}>{familyMembers.length} members</Text>
                }
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleCreateFamily}>
            <Ionicons name="add-circle-outline" size={20} color="#4A90E2" />
            <Text style={styles.buttonText}>创建新家庭</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleJoinFamily}>
            <Ionicons name="enter-outline" size={20} color="#4A90E2" />
            <Text style={styles.buttonText}>加入家庭</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: 'white',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  familyList: {
    flex: 1,
  },
  familyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activeFamilyItem: {
    backgroundColor: '#E8F0FE',
  },
  familyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  familyIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  familyName: {
    fontSize: 16,
  },
  familyMemberCount: {
    fontSize: 12,
    color: 'gray',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4A90E2',
  },
});

export default Drawer; 