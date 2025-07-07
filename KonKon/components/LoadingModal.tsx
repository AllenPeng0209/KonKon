import React from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingModalProps {
  isVisible: boolean;
  text?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isVisible, text = '正在处理...' }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        // This is required on Android. We don't want the user to be able to close it.
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.modalText}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default LoadingModal; 