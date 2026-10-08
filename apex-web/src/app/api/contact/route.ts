import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'يرجى ملء جميع الحقول المطلوبة (الاسم، البريد الإلكتروني، والرسالة)' },
        { status: 400 }
      );
    }

    // Check for Formspree ID or Web3Forms Key
    const formspreeId = process.env.FORMSPREE_ID || process.env.NEXT_PUBLIC_FORMSPREE_ID || 'myekwbdv';
    const web3Key = process.env.WEB3FORMS_ACCESS_KEY || process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

    // 1. If Formspree ID is provided
    if (formspreeId) {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `استفسار جديد من موقع Magixa Tech: ${name}`,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok || data.ok) {
        return NextResponse.json({
          success: true,
          message: 'تم إرسال رسالتك بنجاح، سيتواصل معك فريق Magixa قريباً',
        });
      }
      return NextResponse.json(
        { success: false, message: data.error || 'تعذر الإرسال عبر Formspree' },
        { status: response.status || 500 }
      );
    }

    // 2. If Web3Forms Key is provided
    if (web3Key) {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3Key,
          name,
          email,
          message,
          from_name: 'Magixa Tech Website',
          subject: `استفسار جديد من موقع Magixa: ${name}`,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        return NextResponse.json({
          success: true,
          message: 'تم إرسال رسالتك بنجاح، سيتواصل معك فريق Magixa قريباً',
        });
      }
      return NextResponse.json(
        { success: false, message: data.message || 'تعذر الإرسال عبر Web3Forms' },
        { status: response.status || 500 }
      );
    }

    // 3. Fallback when keys are not configured yet
    return NextResponse.json({
      success: false,
      requiresSetup: true,
      message: 'لم يتم تفعيل مفتاح خدمة البريد بعد (WEB3FORMS_ACCESS_KEY). يرجى إضافته في ملف .env.local أو إعدادات Vercel.',
    }, { status: 422 });

  } catch (error: any) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ غير متوقع أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
