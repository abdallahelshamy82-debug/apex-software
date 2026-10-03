import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '../context/SettingsContext';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unread: boolean;
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  initialNotifications?: NotificationItem[];
}

export default function NotificationModal({ visible, onClose, unreadCount, setUnreadCount, initialNotifications }: NotificationModalProps) {
  const router = useRouter();
  const { theme, isRTL, currentUser } = useSettings() || {
    theme: { bg: '#0F172A', text: '#F8FAFC', textMuted: '#94A3B8', primary: '#06B6D4', card: '#1E293B', border: 'rgba(255,255,255,0.08)' },
    isRTL: true,
    currentUser: null
  };

  const getInitialList = (): NotificationItem[] => {
    if (initialNotifications && initialNotifications.length > 0) {
      return initialNotifications;
    }
    if (!currentUser) {
      return [];
    }
    return [
      {
        id: '1',
        title: isRTL ? 'تحديث في مرحلة مشروعك' : 'Project Phase Update',
        body: isRTL 
          ? `مشروعك (${currentUser?.projectName || 'تطبيق المتجر الإلكتروني'}) تقدم إلى نسبة ${currentUser?.projectProgress || 45}% - المرحلة: ${currentUser?.projectPhase || 'تصميم الواجهات'}`
          : `Your project (${currentUser?.projectName || 'E-Commerce App'}) reached ${currentUser?.projectProgress || 45}% progress.`,
        time: isRTL ? 'منذ ساعة' : '1 hour ago',
        icon: 'rocket',
        color: '#06B6D4',
        unread: true,
      },
      {
        id: '2',
        title: isRTL ? 'رسالة ترحيبية من Magixa' : 'Welcome to Magixa',
        body: isRTL 
          ? 'أهلاً بك في بوابتك الرقمية! يمكنك التحدث مباشرة مع المهندسين عبر الشات وتتبع كل خطوة.'
          : 'Welcome to your portal! You can chat with our engineering team anytime.',
        time: isRTL ? 'اليوم' : 'Today',
        icon: 'sparkles',
        color: '#10B981',
        unread: true,
      },
      {
        id: '3',
        title: isRTL ? 'إشعار الدفع والفواتير' : 'Billing Notification',
        body: isRTL 
          ? 'تم إصدار إشعار الفاتورة لمرحلة التطوير. يمكنك إرفاق إيصال التحويل البنكي أو فودافون كاش.'
          : 'Invoice generated for the development milestone. Receipt upload is available.',
        time: isRTL ? 'أمس' : 'Yesterday',
        icon: 'receipt',
        color: '#F59E0B',
        unread: true,
      }
    ];
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(getInitialList());

  useEffect(() => {
    setNotifications(getInitialList());
  }, [initialNotifications, currentUser]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="notifications" size={22} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {isRTL ? 'مركز الإشعارات' : 'Notifications'}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* List or Empty State */}
          {!currentUser ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="notifications-off-outline" size={36} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {isRTL ? 'لا توجد إشعارات حالياً' : 'No Notifications Yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                {isRTL 
                  ? 'سجّل الدخول إلى حسابك في بوابة العملاء لمتابعة تحديثات مشروعك البرمجي، الفواتير، والتواصل مع المهندسين.'
                  : 'Sign in to the Client Portal to track your project progress, milestones, and developer updates.'}
              </Text>
              <TouchableOpacity 
                style={[styles.loginCtaBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  onClose();
                  router.push('/login');
                }}
              >
                <Ionicons name="log-in-outline" size={18} color="#0B0F19" />
                <Text style={styles.loginCtaText}>{isRTL ? 'تسجيل الدخول لبوابة العملاء' : 'Sign In to Portal'}</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {isRTL ? 'لا توجد إشعارات جديدة' : 'All Caught Up'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                {isRTL ? 'تم الاطلاع على جميع التحديثات والإشعارات الخاصة بمشروعك.' : 'No new notifications right now.'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map((item) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.notificationItem, 
                    { 
                      borderBottomColor: theme.border, 
                      backgroundColor: item.unread ? `${theme.primary}08` : 'transparent',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={[styles.itemContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.itemBody, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{item.body}</Text>
                    <Text style={[styles.itemTime, { color: theme.textMuted }]}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer Actions */}
          {currentUser && notifications.length > 0 && (
            <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
              <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
                <Text style={[styles.markReadText, { color: theme.primary }]}>
                  {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    padding: 12,
  },
  notificationItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 11,
  },
  footerRow: {
    padding: 14,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  loginCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginCtaText: {
    color: '#0B0F19',
    fontWeight: '700',
    fontSize: 14,
  },
});
