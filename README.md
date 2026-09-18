# 🌟 Apex Software Platform

المنصة الرسمية وتطبيق وكالة البرمجيات **Apex Software Agency** (تطبيق موبايل + ويب + خادم API متكامل).

---

## 📖 الدليل السريع للمطورين
للاطلاع على دليل المطور الشامل، تشغيل المشروع، إضافة معرض الأعمال، وخطوات الرفع على Google Play Store:
👉 **[اقرأ دليل المطور: DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**

---

## 🚀 التشغيل الفوري بنقرة واحدة (One-Click)
- **ويندوز (Windows):** انقر نقراً مزدوجاً على **`run_dev.bat`**
- **ماك ولينكس (Mac/Linux):** نفّذ في التيرمنال **`./run_dev.sh`**

---

## ⚡ التشغيل اليدوي (Manual Start)

### 1. تشغيل الباك إند (Backend):
```bash
cd apex-backend
npm install
npm start
```
- خادم الـ API يعمل على: `http://localhost:3000`
- تحويل أي إيميل لمدير فوراً: `npm run make-admin your-email@gmail.com your-password`
- لتهيئة وتجهيز الحسابات: `npm run seed`

### 2. تشغيل التطبيق (Frontend):
```bash
cd apex-app
npm install
npx expo start
```
- اضغط `w` لفتح الويب (`http://localhost:8081`).
- اضغط `a` لفتح محاكي الأندرويد.
- أو امسح رمز الـ QR عبر تطبيق **Expo Go** على هاتفك.

---

## 🎯 إضافة معرض الأعمال
- ملف المعرض: `apex-app/src/app/portfolio.tsx`
- قم بإضافة أو تعديل المشاريع داخل مصفوفة `projects`.

---

## 🚀 البناء لمتجر Google Play Store
- **APK تجريبي:** `cd apex-app && eas build --platform android --profile preview`
- **AAB رسمي للمتجر:** `cd apex-app && eas build --platform android --profile production`
