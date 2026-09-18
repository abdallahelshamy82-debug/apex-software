import React, { createContext, useContext, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApexLoader from '../components/ApexLoader';

const palettes = {
  light: { bg: '#F8FAFC', text: '#0F172A', textMuted: '#64748B', card: '#FFFFFF', border: 'rgba(0,0,0,0.08)', btnBg: 'rgba(0,0,0,0.05)', primary: '#06B6D4' },
  dark: { bg: '#0F172A', text: '#F8FAFC', textMuted: '#94A3B8', card: '#1E293B', border: 'rgba(255,255,255,0.08)', btnBg: 'rgba(255,255,255,0.1)', primary: '#06B6D4' },
  black: { bg: '#000000', text: '#FFFFFF', textMuted: '#A1A1AA', card: '#18181B', border: 'rgba(255,255,255,0.1)', btnBg: 'rgba(255,255,255,0.1)', primary: '#06B6D4' },
  blue: { bg: '#0A192F', text: '#CCD6F6', textMuted: '#8892B0', card: '#112240', border: 'rgba(100,255,218,0.1)', btnBg: 'rgba(100,255,218,0.1)', primary: '#64FFDA' },
  purple: { bg: '#2E1065', text: '#F3E8FF', textMuted: '#C084FC', card: '#3B0764', border: 'rgba(216,180,254,0.15)', btnBg: 'rgba(216,180,254,0.1)', primary: '#E879F9' },
  green: { bg: '#064E3B', text: '#ECFDF5', textMuted: '#6EE7B7', card: '#065F46', border: 'rgba(110,231,183,0.15)', btnBg: 'rgba(110,231,183,0.1)', primary: '#34D399' },
  rose: { bg: '#4C0519', text: '#FFE4E6', textMuted: '#FDA4AF', card: '#701A36', border: 'rgba(253,164,175,0.15)', btnBg: 'rgba(253,164,175,0.1)', primary: '#FB7185' },
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
    startProject: 'Démarrer votre projet', costEstimator: 'Estimateur de coûts', coreOfferings: 'Nos services',
    webDev: 'Développement Web', webDevDesc: 'Sites web modernes, réactifs avec un code propre.',
    mobileApp: 'Applications Mobiles', mobileAppDesc: 'Applications multiplateformes pour iOS et Android.',
    customSys: 'Systèmes sur mesure', customSysDesc: 'Bases de données évolutives et intégrations IA.',
    settings: 'Paramètres', language: 'Langue', back: '← Retour', choosePlatform: '1. Choisir la plateforme', reqFeatures: '2. Fonctionnalités requises',
    auth: 'Authentification', authDesc: 'Connexion, Inscription, Réseaux sociaux', payment: 'Passerelle de paiement', paymentDesc: 'Intégration Stripe, PayPal',
    admin: 'Tableau de bord Admin', adminDesc: 'Gérer les utilisateurs et le contenu', ai: 'Intégration IA', aiDesc: 'Modèles IA personnalisés ou ChatGPT',
    estCost: 'Coût estimé:', reqQuote: 'Demander un devis', web: 'WEB', mobile: 'MOBILE', both: 'LES DEUX',
    email: 'Adresse e-mail', password: 'Mot de passe', loginBtn: 'Connexion', noAccount: 'Nouveau chez Apex?', signupNow: 'Créer un compte',
    fullName: 'Nom complet', companyName: 'Nom de l\'entreprise', signupBtn: 'S\'inscrire', haveAccount: 'Déjà client?',
    loginNow: 'Connectez-vous', welcomeBack: 'Bon retour!', createAccount: 'Rejoignez Apex Software', dashboard: 'Tableau de bord',
    welcomeClient: 'Bienvenue, Ahmed', activeProject: 'Projet actif: Application E-Commerce', projectProgress: 'Progression du projet',
    currentPhase: 'Phase actuelle: Conception UI/UX', recentUpdates: 'Mises à jour récentes', chatTeam: 'Discuter avec l\'équipe', viewInvoice: 'Voir les factures',
    shareReferral: 'Parrainer un ami', update1: 'Maquettes approuvées par le client', update2: 'Schéma de base de données conçu',
    portfolio: 'Notre Portfolio', portfolioDesc: 'Découvrez certains de nos récents produits numériques.'
  },
  es: {
    appName: 'APEX', appAccent: 'SOFTWARE', login: 'Acceso Cliente', chooseTheme: 'Elegir Tema:', letsBuild: 'Construyamos Juntos',
    heroTitle1: 'Transformando Ideas en', heroTitle2: 'Apps Modernas', heroSub: 'Construimos sitios web, aplicaciones móviles y soluciones digitales.',
    startProject: 'Iniciar tu Proyecto', costEstimator: 'Calculadora de Costos', coreOfferings: 'Nuestros Servicios',
    webDev: 'Desarrollo Web', webDevDesc: 'Sitios modernos y responsivos con código limpio.',
    mobileApp: 'Aplicaciones Móviles', mobileAppDesc: 'Apps multiplataforma para iOS y Android.',
    customSys: 'Sistemas a Medida', customSysDesc: 'Bases de datos escalables e integración de IA.',
    settings: 'Ajustes', language: 'Idioma', back: '← Volver', choosePlatform: '1. Elegir Plataforma', reqFeatures: '2. Funciones Requeridas',
    auth: 'Autenticación', authDesc: 'Inicio de sesión, Registro', payment: 'Pasarela de Pago', paymentDesc: 'Integración Stripe, PayPal',
    admin: 'Panel de Admin', adminDesc: 'Gestionar usuarios y contenido', ai: 'Integración de IA', aiDesc: 'Modelos personalizados o ChatGPT',
    estCost: 'Costo Estimado:', reqQuote: 'Solicitar Presupuesto', web: 'WEB', mobile: 'MÓVIL', both: 'AMBOS',
    email: 'Correo Electrónico', password: 'Contraseña', loginBtn: 'Entrar al Portal', noAccount: '¿Nuevo en Apex?', signupNow: 'Crear una Cuenta',
    fullName: 'Nombre Completo', companyName: 'Nombre de la Empresa', signupBtn: 'Registrarse', haveAccount: '¿Ya eres cliente?',
    loginNow: 'Inicia sesión aquí', welcomeBack: '¡Bienvenido de nuevo!', createAccount: 'Únete a Apex', dashboard: 'Panel de Cliente',
    welcomeClient: 'Bienvenido, Ahmed', activeProject: 'Proyecto Activo: App E-Commerce', projectProgress: 'Progreso del Proyecto',
    currentPhase: 'Fase actual: Diseño UI/UX', recentUpdates: 'Actualizaciones Recientes', chatTeam: 'Chatear con el equipo', viewInvoice: 'Ver Facturas',
    shareReferral: 'Recomendar a un Amigo', update1: 'Wireframes aprobados', update2: 'Esquema de base de datos diseñado',
    portfolio: 'Nuestro Portafolio', portfolioDesc: 'Explora nuestros productos digitales más recientes.'
  }
};

export const SettingsContext = createContext<any>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [selectedThemeOption, setSelectedThemeOption] = useState('system');
  const [language, setLanguage] = useState<'en' | 'ar' | 'fr' | 'es'>('ar');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAppReady, setIsAppReady] = useState(false);

  React.useEffect(() => {
    const initApp = async () => {
      try {
        const [userData, savedLang, savedTheme] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('appLang'),
          AsyncStorage.getItem('appTheme')
        ]);
        if (userData) setCurrentUser(JSON.parse(userData));
        if (savedLang) setLanguage(savedLang as any);
        if (savedTheme) setSelectedThemeOption(savedTheme);
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        // Luxury 1.2s smooth startup splash so fonts, auth & assets settle cleanly
        setTimeout(() => {
          setIsAppReady(true);
        }, 1200);
      }
    };

    initApp();
  }, []);

  const activeTheme = selectedThemeOption === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : selectedThemeOption;
  const theme = palettes[activeTheme as keyof typeof palettes] || palettes.light;

  const toggleTheme = () => {
    const isDark = activeTheme === 'dark' || activeTheme === 'black' || activeTheme === 'blue' || activeTheme === 'purple';
    const nextTheme = isDark ? 'light' : 'dark';
    setSelectedThemeOption(nextTheme);
    AsyncStorage.setItem('appTheme', nextTheme);
  };
  
  const t = (key: any) => (translations as any)[language]?.[key] || (translations['en'] as any)[key] || key;
  const isRTL = language === 'ar';

  return (
    <SettingsContext.Provider value={{ 
      theme, activeTheme, selectedThemeOption, setSelectedThemeOption, toggleTheme,
      language, setLanguage, t, isRTL, currentUser, setCurrentUser,
      isAppReady
    }}>
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
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
