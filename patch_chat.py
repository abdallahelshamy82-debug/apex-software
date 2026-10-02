
import re

with open('apex-app/src/app/chat.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove expo-audio import
content = re.sub(
    r"import \{ AudioModule, createAudioPlayer, RecordingPresets, setAudioModeAsync, useAudioRecorder \} from 'expo-audio';\n",
    "",
    content
)

# 2. Add SafeAudio declaration after ticketStorage import
safe_audio_code = """
// Safe loader for expo-av
let SafeAudio: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SafeAudio = require('expo-av');
} catch (e) {
  SafeAudio = null;
}
"""
content = re.sub(
    r"(} from '\.\./utils/ticketStorage';\n)",
    r"\1" + safe_audio_code,
    content
)

# 3. Replace useAudioRecorder with recording state
content = re.sub(
    r"const audioRecorder = useAudioRecorder\(RecordingPresets\.HIGH_QUALITY\);\n",
    "const [recording, setRecording] = useState<any>(null);\n",
    content
)

# 4. Fix startRecording native block
start_rec_old = """      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          showToast({
            type: 'warning',
            title: isRTL ? 'إذن مرفوض' : 'Permission Denied',
            message: isRTL ? 'إذن استخدام الميكروفون مطلوب لتسجيل الصوت.' : 'Microphone access is required.',
          });
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
      } catch (err) {"""

start_rec_new = """      if (!SafeAudio) {
        showToast({
          type: 'info',
          title: isRTL ? 'تسجيل الصوت' : 'Voice Recording',
          message: isRTL ? 'ميزة تسجيل الصوت تتطلب نسخة مبنية (APK).' : 'Voice recording requires a standalone build.',
        });
        return;
      }
      try {
        const AudioClass = SafeAudio.Audio || SafeAudio;
        const perm = await AudioClass.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          showToast({
            type: 'warning',
            title: isRTL ? 'إذن مرفوض' : 'Permission Denied',
            message: isRTL ? 'إذن استخدام الميكروفون مطلوب لتسجيل الصوت.' : 'Microphone access is required.',
          });
          return;
        }
        await AudioClass.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording: newRecording } = await AudioClass.Recording.createAsync(AudioClass.RecordingOptionsPresets?.HIGH_QUALITY || SafeAudio.RecordingOptionsPresets?.HIGH_QUALITY);
        setRecording(newRecording);
        setIsRecording(true);
      } catch (err) {"""

content = content.replace(start_rec_old, start_rec_new)

# 5. Fix cancelRecording native block
cancel_rec_old = """    } else if (audioRecorder.isRecording) {
      await audioRecorder.stop();
    }"""
cancel_rec_new = """    } else if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }"""
content = content.replace(cancel_rec_old, cancel_rec_new)

# 6. Fix stopAndSendRecording native block
stop_rec_old = """    } else if (audioRecorder.isRecording) {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;"""
stop_rec_new = """    } else if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);"""
content = content.replace(stop_rec_old, stop_rec_new)

# 7. Fix playAudio native block
play_audio_old = """      try {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.remove();
          audioPlayerRef.current = null;
          if (playingAudioUrl === url) {
            setPlayingAudioUrl(null);
            return;
          }
        }

        const player = createAudioPlayer(fullUrl);
        audioPlayerRef.current = player;
        setPlayingAudioUrl(url);
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            subscription.remove();
            player.remove();
            if (audioPlayerRef.current === player) {
              audioPlayerRef.current = null;
              setPlayingAudioUrl(null);
            }
          }
        });
        player.play();
      } catch (e) {
        console.log('Audio playback error', e);
        setPlayingAudioUrl(null);
      }"""
play_audio_new = """      if (!SafeAudio) {
        showToast({
          type: 'info',
          title: isRTL ? 'تشغيل الصوت' : 'Play Audio',
          message: isRTL ? 'تشغيل المقاطع الصوتية متاح على متصفح الويب ونسخة الـ APK المستقلة.' : 'Audio playback is supported on web and standalone APK builds.',
        });
        return;
      }
      try {
        const AudioClass = SafeAudio.Audio || SafeAudio;
        const { sound } = await AudioClass.Sound.createAsync({ uri: fullUrl });
        await sound.playAsync();
      } catch (e) {
        console.log('Audio playback error', e);
      }"""
content = content.replace(play_audio_old, play_audio_new)

# 8. Fix audioPlayerRef in useEffect cleanup
cleanup_old = """      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
          audioPlayerRef.current.remove();
        } catch (e) {}
      }"""
cleanup_new = """      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
        } catch (e) {}
      }"""
content = content.replace(cleanup_old, cleanup_new)

with open('apex-app/src/app/chat.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to chat.tsx!")
