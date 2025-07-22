import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';

const { width } = Dimensions.get('window');

interface DrawerProps {
  onClose: () => void;
  translateX: SharedValue<number>;
}

const Drawer: React.FC<DrawerProps> = ({ onClose, translateX }) => {
  const { user } = useAuth();
  const { userFamilies, activeFamily, switchFamily, familyMembers } = useFamily();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [modalVisible, setModalVisible] = useState(false);

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
    setModalVisible(false);
    router.push('/create-family');
    onClose();
  };

  const handleJoinFamily = () => {
    setModalVisible(false);
    router.push('/join-family');
    onClose();
  };

  const navigateToProfile = () => {
    router.push('/profile');
    onClose();
  }

  const styles = getStyles(colorScheme);

  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return 'https://example.com/default-avatar.png';
  }

  return (
    <>
      <Animated.View style={[styles.container, animatedStyle]}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.profileSection} onPress={navigateToProfile}>
            <Image
              source={{ uri: getAvatarUrl() }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.user_metadata?.display_name || user?.email}</Text>
              <Text style={styles.profileStatus}>查看個人資料</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={styles.profileStatus.color} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <ScrollView style={styles.familyList} showsVerticalScrollIndicator={false}>
            {userFamilies.map((family) => {
              const isActive = activeFamily?.id === family.id;
              return (
                <TouchableOpacity
                  key={family.id}
                  style={[styles.familyItem, isActive && styles.activeFamilyItem]}
                  onPress={() => handleSwitchFamily(family.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.familyIcon, isActive && styles.activeFamilyIcon]}>
                    <Text style={[styles.familyIconText, isActive && styles.activeFamilyIconText]}>
                      {family.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.familyInfo}>
                    <Text style={[styles.familyName, isActive && styles.activeFamilyName]}>
                      {family.name}
                    </Text>
                    <Text style={styles.familyMemberCount}>
                      {isActive ? `${familyMembers.length} 位成員` : `共 ${family.member_count || 1} 位成員`}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <Ionicons name="radio-button-on" size={22} color={Colors.light.tint} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addGroupButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={24} color={Colors.dark.text} />
              <Text style={styles.addGroupButtonText}>新建群組</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableOpacity 
          style={styles.centeredView} 
          activeOpacity={1} 
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalView}>
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateFamily}>
              <Ionicons name="add-circle-outline" size={22} color={Colors.light.tint} />
              <Text style={styles.modalButtonText}>創建新家庭</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleJoinFamily}>
              <Ionicons name="enter-outline" size={22} color={Colors.light.tint} />
              <Text style={styles.modalButtonText}>加入家庭</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 10, backgroundColor: '#f0f0f0' }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{...styles.modalButtonText, color: '#555', textAlign: 'center', width: '100%', marginLeft: 0}}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: width * 0.8,
      backgroundColor: colors.background,
      paddingTop: 40,
      zIndex: 200,
    },
    safeArea: {
      flex: 1,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
      backgroundColor: colors.icon,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    profileStatus: {
      fontSize: 14,
      color: colors.icon,
    },
    separator: {
      height: 1,
      backgroundColor: colorScheme === 'dark' ? '#333' : '#eee',
      marginHorizontal: 16,
      marginBottom: 10,
    },
    familyList: {
      flex: 1,
    },
    familyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginBottom: 8,
    },
    activeFamilyItem: {
      backgroundColor: `${Colors.light.tint}1A`,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    familyIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.tabIconDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    activeFamilyIcon: {
      backgroundColor: Colors.light.tint,
    },
    familyIconText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: 'bold',
    },
    activeFamilyIconText: {
      color: Colors.dark.text,
    },
    familyInfo: {
      flex: 1,
    },
    familyName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    activeFamilyName: {
      color: Colors.light.tint,
    },
    familyMemberCount: {
      fontSize: 13,
      color: colors.icon,
      marginTop: 2,
    },
    activeIndicator: {
      marginLeft: 12,
    },
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 20,
    },
    addGroupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.light.tint,
      paddingVertical: 12,
      borderRadius: 12,
    },
    addGroupButtonText: {
      color: Colors.dark.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalView: {
      width: '100%',
      backgroundColor: colors.background,
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      padding: 20,
      paddingBottom: 40,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    modalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      padding: 15,
      borderRadius: 10,
      backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      marginBottom: 10,
    },
    modalButtonText: {
      marginLeft: 15,
      fontSize: 16,
      color: colors.text,
    },
  });
}

export default Drawer; 