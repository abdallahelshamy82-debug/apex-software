import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TicketAttachment {
  uri: string;
  name?: string;
  type: 'image' | 'file' | 'audio';
}

export interface ChatMessage {
  id: string;
  clientMsgId?: string;
  userId: number;
  sender: 'client' | 'admin';
  senderRole?: string;
  text: string;
  attachment?: TicketAttachment | null;
  attachmentUrl?: string | null;
  type?: 'text' | 'image' | 'document' | 'audio';
  timestamp: string;
  createdAt?: string;
}

export interface SupportTicketMeta {
  userId: number;
  id: number;
  fullName: string;
  email?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  hasAttachment?: boolean;
  updatedAt: string;
}

const STORAGE_PREFIX = 'apex_chat_messages_';
const TICKETS_INDEX_KEY = 'apex_support_tickets';

/**
 * Normalizes any message (from server or local) into the standard message format.
 */
export function normalizeMessage(raw: any, activeUserId?: number): ChatMessage {
  const role = raw.sender || raw.senderRole || 'client';
  const normRole: 'client' | 'admin' = role === 'admin' ? 'admin' : 'client';
  
  let attachment: TicketAttachment | null = null;
  if (raw.attachment && typeof raw.attachment === 'object' && raw.attachment.uri) {
    attachment = {
      uri: raw.attachment.uri,
      name: raw.attachment.name || raw.attachment.fileName || 'attachment',
      type: raw.attachment.type === 'image' ? 'image' : (raw.attachment.type === 'audio' ? 'audio' : 'file')
    };
  } else if (raw.attachmentUrl) {
    const isImg = raw.type === 'image' || raw.attachmentUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    const isAud = raw.type === 'audio' || raw.attachmentUrl.match(/\.(m4a|mp3|wav|ogg|webm)$/i);
    attachment = {
      uri: raw.attachmentUrl,
      name: (raw.attachmentUrl.split('/').pop()) || (isImg ? 'image.jpg' : 'document.file'),
      type: isImg ? 'image' : (isAud ? 'audio' : 'file')
    };
  }

  const msgType = raw.type || (attachment ? (attachment.type === 'image' ? 'image' : attachment.type === 'audio' ? 'audio' : 'document') : 'text');
  const timeStr = raw.timestamp || (raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
  const cId = raw.clientMsgId || (typeof raw.id === 'string' && raw.id.includes('_') ? raw.id : undefined);

  return {
    id: String(raw.id || Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
    clientMsgId: cId,
    userId: Number(raw.userId || activeUserId || 1),
    sender: normRole,
    senderRole: normRole,
    text: raw.text || '',
    attachment,
    attachmentUrl: raw.attachmentUrl || (attachment ? attachment.uri : null),
    type: msgType,
    timestamp: timeStr,
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

/**
 * Loads all stored messages for a specific user/ticket from AsyncStorage.
 */
export async function getStoredMessages(userId: number): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Strict deduplication when reading
    const map = new Map<string, ChatMessage>();
    parsed.forEach(m => {
      const norm = normalizeMessage(m, userId);
      const key = norm.clientMsgId || norm.id;
      map.set(key, norm);
    });
    return Array.from(map.values());
  } catch (err) {
    console.warn('Error reading stored messages for user', userId, err);
    return [];
  }
}

/**
 * Saves a full list of messages for a user/ticket to AsyncStorage.
 */
export async function saveStoredMessages(userId: number, messages: ChatMessage[]): Promise<void> {
  try {
    const map = new Map<string, ChatMessage>();
    messages.forEach(m => {
      const norm = normalizeMessage(m, userId);
      const key = norm.clientMsgId || norm.id;
      map.set(key, norm);
    });
    const unique = Array.from(map.values());
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(unique));
  } catch (err) {
    console.warn('Error saving messages for user', userId, err);
  }
}

/**
 * Adds or updates a single message in AsyncStorage and syncs the shared tickets index.
 */
export async function addStoredMessage(
  userId: number,
  msg: any,
  userMeta?: { fullName?: string; email?: string }
): Promise<ChatMessage[]> {
  try {
    const current = await getStoredMessages(userId);
    const normalized = normalizeMessage(msg, userId);

    const map = new Map<string, ChatMessage>();
    current.forEach(item => {
      const key = item.clientMsgId || item.id;
      map.set(key, item);
    });

    const newKey = normalized.clientMsgId || normalized.id;
    if (map.has(newKey)) {
      map.set(newKey, { ...map.get(newKey)!, ...normalized });
    } else {
      // Content similarity check to avoid duplication
      let matchedKey: string | null = null;
      for (const [k, item] of map.entries()) {
        if (
          item.userId === normalized.userId &&
          item.sender === normalized.sender &&
          item.type === normalized.type
        ) {
          const sameAtt = (item.attachment?.uri && normalized.attachment?.uri && item.attachment.uri === normalized.attachment.uri) ||
                          (item.attachmentUrl && normalized.attachmentUrl && item.attachmentUrl === normalized.attachmentUrl);
          const sameText = item.text && normalized.text && item.text === normalized.text;
          if (sameAtt || sameText) {
            matchedKey = k;
            break;
          }
        }
      }
      if (matchedKey) {
        map.set(matchedKey, { ...map.get(matchedKey)!, ...normalized, id: normalized.id || map.get(matchedKey)!.id });
      } else {
        map.set(newKey, normalized);
      }
    }

    const updated = Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tA - tB;
    });

    await saveStoredMessages(userId, updated);
    await updateTicketIndex(userId, normalized, userMeta);

    return updated;
  } catch (err) {
    console.warn('Error adding stored message for user', userId, err);
    return [];
  }
}

/**
 * Merges server messages with local AsyncStorage messages.
 * Preserves local attachments that may not have synced to the server yet.
 */
export function mergeServerAndLocalMessages(serverMsgs: any[], localMsgs: any[]): ChatMessage[] {
  const normalizedServer = (serverMsgs || []).map(m => normalizeMessage(m));
  const normalizedLocal = (localMsgs || []).map(m => normalizeMessage(m));

  const map = new Map<string, ChatMessage>();

  // Add server messages first
  normalizedServer.forEach(m => {
    const key = m.clientMsgId || m.id;
    map.set(key, m);
  });

  // Merge local messages without duplicating
  normalizedLocal.forEach(local => {
    const localKey = local.clientMsgId || local.id;
    if (map.has(localKey)) {
      const existing = map.get(localKey)!;
      if (!existing.attachment && local.attachment) {
        map.set(localKey, { ...existing, attachment: local.attachment, attachmentUrl: local.attachmentUrl });
      }
      return;
    }

    // Check by content similarity
    let matchedKey: string | null = null;
    for (const [k, s] of map.entries()) {
      if (s.userId === local.userId && s.sender === local.sender && s.type === local.type) {
        const sameAtt = (local.attachment?.uri && s.attachment?.uri && local.attachment.uri === s.attachment.uri) ||
                        (local.attachmentUrl && s.attachmentUrl && local.attachmentUrl.endsWith(s.attachmentUrl.split('/').pop() || ''));
        const sameText = local.text && s.text && local.text === s.text;
        if (sameAtt || sameText) {
          matchedKey = k;
          break;
        }
      }
    }

    if (matchedKey) {
      const existing = map.get(matchedKey)!;
      if (!existing.attachment && local.attachment) {
        map.set(matchedKey, { ...existing, attachment: local.attachment, attachmentUrl: local.attachmentUrl });
      }
    } else {
      map.set(localKey, local);
    }
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tA - tB;
  });

  return merged;
}

/**
 * Updates the shared support tickets list in AsyncStorage so admin can see recent tickets.
 */
async function updateTicketIndex(
  userId: number,
  lastMsg: ChatMessage,
  userMeta?: { fullName?: string; email?: string }
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TICKETS_INDEX_KEY);
    let tickets: SupportTicketMeta[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(tickets)) tickets = [];

    const summaryText = lastMsg.text 
      ? lastMsg.text 
      : (lastMsg.attachment ? (lastMsg.attachment.type === 'image' ? '📷 صورة مرفقة' : '📎 مستند مرفق') : '');

    const index = tickets.findIndex(t => t.userId === userId || t.id === userId);
    const updatedMeta: SupportTicketMeta = {
      userId,
      id: userId,
      fullName: userMeta?.fullName || (index >= 0 ? tickets[index].fullName : `عميل #${userId}`),
      email: userMeta?.email || (index >= 0 ? tickets[index].email : ''),
      lastMessage: summaryText,
      lastMessageTime: lastMsg.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      hasAttachment: !!lastMsg.attachment || !!lastMsg.attachmentUrl,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      tickets[index] = { ...tickets[index], ...updatedMeta };
    } else {
      tickets.unshift(updatedMeta);
    }

    await AsyncStorage.setItem(TICKETS_INDEX_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Error updating tickets index', err);
  }
}

/**
 * Retrieves all support tickets stored in the shared index.
 */
export async function getStoredTickets(): Promise<SupportTicketMeta[]> {
  try {
    const raw = await AsyncStorage.getItem(TICKETS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}
