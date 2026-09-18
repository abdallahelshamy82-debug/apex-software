import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Linking, Alert } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          
          try {
            // Basic validation
            if (!href) {
              Alert.alert('خطأ', 'الرابط غير موجود أو فارغ');
              return;
            }

            // Check if the device can handle this URL scheme
            const canOpen = await Linking.canOpenURL(href);
            if (!canOpen) {
              Alert.alert('تنبيه', 'هذا الرابط غير صالح أو لا يدعمه نظامك');
              return;
            }

            // Open the link in an in-app browser.
            await openBrowserAsync(href, {
              presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
              controlsColor: '#06B6D4', // Primary theme color
            });
          } catch (error) {
            console.error('Failed to open URL:', error);
            Alert.alert('تعذر فتح الرابط', 'حدث خطأ غير متوقع أثناء محاولة فتح الرابط.');
          }
        }
      }}
    />
  );
}
