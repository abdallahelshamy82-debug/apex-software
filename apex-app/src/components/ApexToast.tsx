import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Modal, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useSettings } from '../context/SettingsContext';
import { haptics } from '../utils/haptics';

/* ────────────────────── Types ────────────────────── */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;            // ms, 0 = sticky until dismissed
  actionLabel?: string;         // optional CTA button text
  onAction?: () => void;        // optional CTA callback
}

export interface AlertModalButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertModalConfig {
  title: string;
  message?: string;
  buttons?: AlertModalButton[];
  type?: ToastType;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
  showModal: (config: AlertModalConfig) => void;
  hideModal: () => void;
}

/* ────────────────────── Context ────────────────────── */
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
  showModal: () => {},
  hideModal: () => {},
});

export const useToast = () => useContext(ToastContext);

/* ────────────────────── Icon & Color Map ────────────────────── */
const TOAST_META: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  success: { icon: 'checkmark-circle', accent: '#10B981' },
  error:   { icon: 'close-circle',     accent: '#EF4444' },
  warning: { icon: 'warning',          accent: '#F59E0B' },
  info:    { icon: 'information-circle', accent: '#06B6D4' },
};

function inferType(title: string = '', message: string = ''): ToastType {
  const combined = `${title} ${message}`.toLowerCase();
  if (combined.includes('error') || combined.includes('خطأ') || combined.includes('فشل') || combined.includes('fail')) {
    return 'error';
  }
  if (combined.includes('success') || combined.includes('تم') || combined.includes('بنجاح') || combined.includes('saved') || combined.includes('copied')) {
    return 'success';
  }
  if (combined.includes('warn') || combined.includes('تنبيه') || combined.includes('alert') || combined.includes('يرجى')) {
    return 'warning';
  }
  return 'info';
}

/* ────────────────────── Provider ────────────────────── */
export function ApexToastProvider({ children }: { children: React.ReactNode }) {
  const { theme, isRTL } = useSettings();
  const insets = useSafeAreaInsets();
  
  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<AlertModalConfig | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 120, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,    duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToastVisible(false);
      setToastConfig(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback((cfg: ToastConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const type = cfg.type || inferType(cfg.title, cfg.message);
    setToastConfig({ ...cfg, type });
    setToastVisible(true);

    // Trigger physical tactile feedback matching alert type
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.warning();
    else haptics.light();

    // Animate in from bottom (or spring bounce if already visible)
    if (toastVisible) {
      translateY.setValue(24);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, bounciness: 8, speed: 18, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, bounciness: 6, speed: 14, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    // Auto-dismiss
    const dur = cfg.duration ?? 3500;
    if (dur > 0) {
      timerRef.current = setTimeout(hideToast, dur);
    }
  }, [translateY, opacity, hideToast, toastVisible]);

  const hideModal = useCallback(() => {
    setModalVisible(false);
    setModalConfig(null);
  }, []);

  const showModal = useCallback((cfg: AlertModalConfig) => {
    const type = cfg.type || inferType(cfg.title, cfg.message);
    setModalConfig({ ...cfg, type });
    setModalVisible(true);

    if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.warning();
    else haptics.medium();
  }, []);

  // Global Alert.alert replacement bridge: intercepts standard Alert.alert calls
  // across all screens and converts them into the cohesive dark-themed sliding toast or modal
  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (title: string, message?: string, buttons?: any[]) => {
      const type = inferType(title, message);

      // If multiple action buttons are provided (like Confirm/Cancel), show Custom Dark Modal
      if (buttons && buttons.length >= 2) {
        showModal({
          title,
          message,
          type,
          buttons,
        });
      } else {
        // Single OK or simple notification: show sliding Toast
        showToast({
          type,
          title: title || (isRTL ? 'إشعار' : 'Notification'),
          message,
          actionLabel: buttons && buttons[0]?.text ? buttons[0].text : undefined,
          onAction: buttons && buttons[0]?.onPress ? buttons[0].onPress : undefined,
        });
      }
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, [showToast, showModal, isRTL]);

  const toastMeta = toastConfig ? TOAST_META[toastConfig.type || 'info'] : TOAST_META.info;
  const modalMeta = modalConfig ? TOAST_META[modalConfig.type || 'info'] : TOAST_META.info;
  const screenW = Dimensions.get('window').width;

  return (
    <ToastContext.Provider value={{ showToast, hideToast, showModal, hideModal }}>
      {children}

      {/* ────────────────── Sliding Top Toast ────────────────── */}
      {toastVisible && toastConfig && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            {
              bottom: insets.bottom + 24,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <BlurView
            intensity={40}
            tint={theme.bg === '#0B132B' || theme.bg === '#000000' ? 'dark' : 'light'}
            style={[
              styles.container,
              {
                backgroundColor: theme.card + 'E6', // E6 = 90% opacity for glass effect
                borderColor: toastMeta.accent + '40',
                maxWidth: Math.min(screenW - 32, 420),
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: toastMeta.accent, [isRTL ? 'right' : 'left']: 0 }]} />

            {/* Icon */}
            <View style={[styles.iconWrap, { marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
              <Ionicons name={toastMeta.icon} size={26} color={toastMeta.accent} />
            </View>

            {/* Text content */}
            <View style={styles.textWrap}>
              <Text
                style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {toastConfig.title}
              </Text>
              {toastConfig.message ? (
                <Text
                  style={[styles.message, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}
                  numberOfLines={3}
                >
                  {toastConfig.message}
                </Text>
              ) : null}
              {toastConfig.actionLabel && toastConfig.onAction ? (
                <TouchableOpacity
                  onPress={() => { toastConfig.onAction?.(); hideToast(); }}
                  style={[styles.actionBtn, { backgroundColor: toastMeta.accent + '20' }]}
                >
                  <Text style={[styles.actionText, { color: toastMeta.accent }]}>
                    {toastConfig.actionLabel}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Dismiss button */}
            <TouchableOpacity onPress={hideToast} style={styles.dismissBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* ────────────────── Themed Dark Modal Dialog ────────────────── */}
      <Modal
        visible={modalVisible && !!modalConfig}
        transparent
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Modal Icon Badge */}
            <View style={[styles.modalIconCircle, { backgroundColor: modalMeta.accent + '20' }]}>
              <Ionicons name={modalMeta.icon} size={32} color={modalMeta.accent} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center' }]}>
              {modalConfig?.title}
            </Text>

            {/* Message */}
            {modalConfig?.message ? (
              <Text style={[styles.modalMessage, { color: theme.textMuted, textAlign: 'center' }]}>
                {modalConfig.message}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <View style={[styles.modalButtonsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {modalConfig?.buttons && modalConfig.buttons.length > 0 ? (
                modalConfig.buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => {
                        haptics.selection();
                        hideModal();
                        btn.onPress?.();
                      }}
                      style={[
                        styles.modalBtn,
                        isCancel
                          ? { backgroundColor: theme.btnBg, borderColor: theme.border, borderWidth: 1 }
                          : isDestructive
                          ? { backgroundColor: '#EF4444' }
                          : { backgroundColor: theme.primary }
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalBtnText,
                          {
                            color: isCancel
                              ? theme.text
                              : isDestructive
                              ? '#FFFFFF'
                              : '#0B132B'
                          }
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={hideModal}
                  style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.modalBtnText, { color: '#0B132B' }]}>
                    {isRTL ? 'حسناً' : 'OK'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

/* ────────────────────── Styles ────────────────────── */
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999999,
    elevation: 9999999,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    paddingLeft: 20,
    paddingRight: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 4,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissBtn: {
    marginLeft: 8,
    padding: 4,
  },

  // Modal Dialog Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonsRow: {
    width: '100%',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
