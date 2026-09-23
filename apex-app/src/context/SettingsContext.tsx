import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApexLoader from '../components/ApexLoader';

const awwwardsBase = {
  bg: '#09090B',
  card: '#111113',
  text: '#FFFFFF',
  textMuted: '#A1A1AA',
  border: 'rgba(255,255,255,0.05)',
  btnBg: 'rgba(255,255,255,0.05)',
};

const accentOptions = {
  neonGreen: '#B4F82C',
  cyberBlue: '#00F0FF',
};

const translations = {
  en: {
    appName: 'APEX', appAccent: 'SOFTWARE', login: 'Client Login', chooseTheme: 'Choose Theme:', letsBuild: 'Let\'s Build Together',
    heroTitle1: 'Turning Ideas into', heroTitle2: 'Modern Apps', heroSub: 'We build websites, mobile apps, and digital solutions using modern technologies. From idea to deployment.',
    startProject: 'Start Your Project', costEstimator: 'Cost Estimator', coreOfferings: 'Our Core Offerings',
    webDev: 'Web Development', webDevDesc: 'Modern, responsive websites with clean code & best practices.',
    mobileApp: 'Mobile Apps', mobileAppDesc: 'Cross-platform apps for iOS & Android with React Native.',
    customSys: 'Custom Systems', customSysDesc: 'Scalable databases and AI integrations for your business.',
    settings: 'Settings', language: 'Language', back: '← Back', choosePlatform: '1. Choose Platform', reqFeatures: '2. Required Features',
    auth: 'Authentication', authDesc: 'Login, Signup, Social Auth', payment: 'Payment Gateway', paymentDesc: 'Stripe, PayPal integration',
    admin: 'Admin Dashboard', adminDesc: 'Manage users and content', ai: 'AI Integration', aiDesc: 'Custom AI models or ChatGPT',
    estCost: 'Estimated Cost:', reqQuote: 'Request Quote', web: 'WEB', mobile: 'MOBILE', both: 'BOTH',
    email: 'Email Address', password: 'Password', loginBtn: 'Login to Portal', noAccount: 'New to Apex?', signupNow: 'Create an Account',
    fullName: 'Full Name', companyName: 'Company / Project Name', signupBtn: 'Sign Up', haveAccount: 'Already a client?',
    loginNow: 'Login here', welcomeBack: 'Welcome Back!', createAccount: 'Join Apex Software', dashboard: 'Client Dashboard',
    welcomeClient: 'Welcome, Ahmed', activeProject: 'Active Project: E-Commerce App', projectProgress: 'Project Progress',
    currentPhase: 'Current Phase: UI/UX Design', recentUpdates: 'Recent Updates', chatTeam: 'Chat with Team', viewInvoice: 'View Invoices',
    shareReferral: 'Refer a Friend', update1: 'Wireframes approved by client', update2: 'Database schema designed',
    portfolio: 'Our Portfolio', portfolioDesc: 'Explore some of our recent digital products and platforms.',
    adminDashboard: 'Admin Control Panel', leads: 'Quote Requests (Leads)', clients: 'Registered Clients',
    refresh: 'Refresh Data', quotePlatform: 'Platform', quoteFeatures: 'Features', quoteCost: 'Est. Cost', noData: 'No data available.'
  },
  ar: {
    appName: 'أبيكس', appAccent: 'للبرمجيات', login: 'دخول العملاء', chooseTheme: 'اختر المظهر:', letsBuild: 'لنبني المستقبل معاً',
    heroTitle1: 'نحول أفكارك إلى', heroTitle2: 'تطبيقات حديثة', heroSub: 'نبني مواقع الويب، تطبيقات الموبايل، والحلول الرقمية المتكاملة بأحدث التقنيات. من الفكرة للبرمجة.',
    startProject: 'ابدأ مشروعك', costEstimator: 'حاسبة التكلفة', coreOfferings: 'خدماتنا الأساسية',
    webDev: 'تطوير الويب', webDevDesc: 'مواقع حديثة وسريعة متوافقة مع جميع الشاشات.',
    mobileApp: 'تطبيقات الموبايل', mobileAppDesc: 'تطبيقات احترافية للآيفون والأندرويد (React Native).',
    customSys: 'أنظمة مخصصة', customSysDesc: 'قواعد بيانات ضخمة ودمج لتقنيات الذكاء الاصطناعي.',
    settings: 'الإعدادات', language: 'اللغة (Language)', back: '← رجوع', choosePlatform: '1. اختر المنصة', reqFeatures: '2. الميزات المطلوبة',
    auth: 'نظام تسجيل الدخول', authDesc: 'حسابات مستخدمين، تسجيل عبر جوجل', payment: 'بوابات الدفع الإلكتروني', paymentDesc: 'فيزا، ماستركارد، باي بال، مدى',
    admin: 'لوحة تحكم \u2066(Admin)\u2069', adminDesc: 'إدارة شاملة للمحتوى والمستخدمين', ai: 'دمج الذكاء الاصطناعي', aiDesc: 'ربط مع ChatGPT أو نماذج خاصة ببياناتك',
    estCost: 'التكلفة التقريبية:', reqQuote: 'اطلب تسعيرة رسمية', web: 'موقع ويب', mobile: 'تطبيق موبايل', both: 'المنصتين معاً',
    email: 'البريد الإلكتروني', password: 'كلمة المرور', loginBtn: 'الدخول للبوابة', noAccount: 'عميل جديد؟', signupNow: 'أنشئ حساباً',
    fullName: 'الاسم الكامل', companyName: 'اسم الشركة / المشروع', signupBtn: 'إنشاء الحساب', haveAccount: 'لديك حساب بالفعل؟',
    loginNow: 'سجل دخولك', welcomeBack: 'مرحباً بعودتك!', createAccount: 'انضم إلى أبيكس', dashboard: 'لوحة تحكم العميل',
    welcomeClient: 'مرحباً، أحمد', activeProject: 'المشروع الحالي: تطبيق متجر إلكتروني', projectProgress: 'نسبة إنجاز المشروع',
    currentPhase: 'المرحلة الحالية: تصميم الواجهات (UI/UX)', recentUpdates: 'آخر التحديثات', chatTeam: 'تواصل مع الفريق', viewInvoice: 'الفواتير والدفعات',
    shareReferral: 'رشحنا لصديق', update1: 'تم اعتماد التخطيط المبدئي من العميل', update2: 'تم الانتهاء من تصميم قاعدة البيانات',
    portfolio: 'معرض أعمالنا', portfolioDesc: 'استكشف أحدث المنتجات والمنصات الرقمية التي قمنا ببنائها.',
    adminDashboard: 'لوحة تحكم الإدارة', leads: 'طلبات التسعير (العملاء المحتملين)', clients: 'العملاء المسجلين',
    refresh: 'تحديث البيانات', quotePlatform: 'المنصة', quoteFeatures: 'الخواص', quoteCost: 'التكلفة', noData: 'لا توجد بيانات حتى الآن.'
  },
  fr: {
    appName: 'APEX', appAccent: 'LOGICIEL', login: 'Connexion Client', chooseTheme: 'Choisir le thème:', letsBuild: 'Construisons ensemble',
    heroTitle1: 'Transformer vos idées en', heroTitle2: 'Applications Modernes', heroSub: 'Nous créons des sites web, des applications mobiles et des solutions numériques avec les technologies modernes.',
    startProject: 'Démarrer le Projet', costEstimator: 'Estimateur de Coûts', coreOfferings: 'Nos Services',
    webDev: 'Développement Web', webDevDesc: 'Sites web modernes et réactifs avec un code propre.',
    mobileApp: 'Applications Mobiles', mobileAppDesc: 'Applications multiplateformes iOS & Android avec React Native.',
    customSys: 'Systèmes Personnalisés', customSysDesc: 'Bases de données évolutives et intégration IA.',
    settings: 'Paramètres', language: 'Langue', back: '← Retour', choosePlatform: '1. Choisir la plateforme', reqFeatures: '2. Fonctionnalités requises',
    auth: 'Authentification', authDesc: 'Connexion, Inscription, Réseaux Sociaux', payment: 'Passerelle de paiement', paymentDesc: 'Intégration Stripe, PayPal',
    admin: 'Tableau de bord', adminDesc: 'Gérer les utilisateurs et le contenu', ai: 'Intégration IA', aiDesc: 'Modèles IA personnalisés',
    estCost: 'Coût Estimé:', reqQuote: 'Demander un devis', web: 'WEB', mobile: 'MOBILE', both: 'LES DEUX',
    email: 'Adresse Email', password: 'Mot de passe', loginBtn: 'Se connecter au portail', noAccount: 'Nouveau chez Apex?', signupNow: 'Créer un compte',
    fullName: 'Nom Complet', companyName: 'Nom de l\'entreprise', signupBtn: 'S\'inscrire', haveAccount: 'Déjà client?',
    loginNow: 'Connectez-vous', welcomeBack: 'Bon retour!', createAccount: 'Rejoindre Apex', dashboard: 'Tableau de bord client',
    welcomeClient: 'Bienvenue', activeProject: 'Projet Actif', projectProgress: 'Avancement du Projet',
    currentPhase: 'Phase Actuelle: Design UI/UX', recentUpdates: 'Dernières Mises à Jour', chatTeam: 'Discuter avec l\'équipe', viewInvoice: 'Voir les factures',
    shareReferral: 'Parrainer un ami', update1: 'Maquettes approuvées', update2: 'Schéma de base de données conçu',
    portfolio: 'Notre Portfolio', portfolioDesc: 'Découvrez nos récents produits numériques.',
    adminDashboard: 'Panneau d\'Administration', leads: 'Demandes de Devis', clients: 'Clients Inscrits',
    refresh: 'Actualiser', quotePlatform: 'Plateforme', quoteFeatures: 'Fonctionnalités', quoteCost: 'Coût Est.', noData: 'Aucune donnée.'
  }
};

const SettingsContext = createContext<any>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'ar' | 'fr'>('ar');
  const [accentKey, setAccentKey] = useState<'neonGreen' | 'cyberBlue'>('neonGreen');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const [userData, savedLang, savedAccent] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('appLang'),
          AsyncStorage.getItem('appAccent')
        ]);
        if (userData) setCurrentUser(JSON.parse(userData));
        if (savedLang) setLanguage(savedLang as any);
        if (savedAccent) setAccentKey(savedAccent as 'neonGreen' | 'cyberBlue');
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setTimeout(() => {
          setIsAppReady(true);
        }, 1200);
      }
    };

    initApp();
  }, []);

  const theme = {
    ...awwwardsBase,
    primary: accentOptions[accentKey] || '#B4F82C',
  };

  const toggleTheme = () => {
    const nextAccent = accentKey === 'neonGreen' ? 'cyberBlue' : 'neonGreen';
    setAccentKey(nextAccent);
    AsyncStorage.setItem('appAccent', nextAccent);
  };
  
  const t = (key: any) => (translations as any)[language]?.[key] || (translations['en'] as any)[key] || key;
  const isRTL = language === 'ar';

  return (
    <SettingsContext.Provider value={{ 
      theme, activeTheme: 'awwwards', selectedThemeOption: accentKey, setSelectedThemeOption: setAccentKey, toggleTheme,
      accentKey, setAccentKey, toggleAccent: toggleTheme,
      language, setLanguage, t, isRTL, currentUser, setCurrentUser,
      isAppReady
    }}>
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr', backgroundColor: theme.bg }}>
        {!isAppReady ? (
          <ApexLoader fullScreen theme={theme} isRTL={isRTL} message={isRTL ? 'جاري تشغيل منصة أبيكس...' : 'Initializing Apex Platform...'} />
        ) : (
          children
        )}
      </View>
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
