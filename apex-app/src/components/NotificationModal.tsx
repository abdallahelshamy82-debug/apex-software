import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { theme, isRTL, currentUser } = useSettings() || {
    theme: { bg: '#0F172A', text: '#F8FAFC', textMuted: '#94A3B8', primary: '#06B6D4', card: '#1E293B', border: 'rgba(255,255,255,0.08)' },
    isRTL: true
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications && initialNotifications.length > 0
      ? initialNotifications
      : [
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
            title: isRTL ? 'رسالة ترحيبية من Apex Devs' : 'Welcome to Apex Devs',
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
        ]
  );

  React.useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications]);

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

          {/* List */}
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

          {/* Footer Actions */}
          <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
              <Text style={[styles.markReadText, { color: theme.primary }]}>
                {isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    borderRadius: 20,
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
    opacity: 0.8,
  },
  footerRow: {
    padding: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markReadText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
});
