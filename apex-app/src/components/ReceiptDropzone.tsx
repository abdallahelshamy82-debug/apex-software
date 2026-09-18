import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';

interface ReceiptDropzoneProps {
  receiptUri: string | null;
  onPick: () => void;
  onRemove: () => void;
  theme: any;
  isRTL: boolean;
  label?: string;
  subLabel?: string;
}

export function ReceiptDropzone({
  receiptUri,
  onPick,
  onRemove,
  theme,
  isRTL,
  label,
  subLabel,
}: ReceiptDropzoneProps) {
  const handlePick = async () => {
    await haptics.selection();
    onPick();
  };

  const handleRemove = async (e: any) => {
    e.stopPropagation?.();
    await haptics.warning();
    onRemove();
  };

  if (receiptUri) {
    return (
      <View style={[styles.previewContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Image
          source={{ uri: receiptUri }}
          style={styles.previewImage}
          resizeMode="cover"
        />

        {/* Remove Button Badge */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRemove}
          style={styles.removeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Bottom Status Bar */}
        <View style={[styles.bottomBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.bottomBarText}>
              {isRTL ? 'تم إرفاق الإيصال بنجاح' : 'Receipt attached successfully'}
            </Text>
          </View>
          <TouchableOpacity onPress={handlePick}>
            <Text style={[styles.changeText, { color: theme.primary }]}>
              {isRTL ? 'تغيير' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePick}
      style={[
        styles.dropzoneContainer,
        {
          borderColor: theme.primary,
          backgroundColor: `${theme.primary}0D`, // subtle 5% tint
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}1A` }]}>
        <Ionicons name="cloud-upload-outline" size={28} color={theme.primary} />
      </View>

      <Text style={[styles.mainLabel, { color: theme.text }]}>
        {label || (isRTL ? 'اضغط لإرفاق صورة الإيصال' : 'Tap to upload receipt')}
      </Text>

      <Text style={[styles.subLabel, { color: theme.textMuted }]}>
        {subLabel || (isRTL ? 'يدعم الصور JPG أو PNG حتى 10MB' : 'Supports JPG, PNG up to 10MB')}
      </Text>

      <View style={[styles.browsePill, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}33` }]}>
        <Ionicons name="images-outline" size={14} color={theme.primary} />
        <Text style={[styles.browsePillText, { color: theme.primary }]}>
          {isRTL ? 'تصفح من المعرض' : 'Browse Gallery'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dropzoneContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  browsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  browsePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
