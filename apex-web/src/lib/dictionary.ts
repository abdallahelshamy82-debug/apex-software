export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  desc: string;
  category: string;
  categorySlug: 'erp' | 'ecommerce' | 'edtech' | 'landing';
  img: string;
  link: string;
  technologies: string[];
  metrics: { label: string; value: string }[];
}

export const dict = {
  ar: {
    common: {
      clientPortal: "بوابة العملاء",
      startProject: "ابدأ مشروعك",
      viewWork: "استعرض أعمالنا",
      contactUs: "تواصل معنا",
      liveDemo: "معاينة حية للمشروع",
      allProjects: "الكل",
      erpCategory: "أنظمة سحابية وERP",
      ecommerceCategory: "متاجر إلكترونية",
      edtechCategory: "منصات تعليمية",
      landingCategory: "صفحات هبوط وأدوات",
      gridView: "عرض كشبكة",
      sliderView: "عرض أفقي سلايدر",
    },
    hero: {
      title: "نبتكر ونصنع الأنظمة البرمجية التي تقود نجاح أعمالك",
      highlights: ["الأنظمة", "البرمجية", "نجاح"],
      desc: "في Magixa Tech، نصمم ونبني مواقع ومتاجر إلكترونية فائقة السرعة وأنظمة ERP سحابية متفصلة بدقة على حجم نشاطك التجاري، بأحدث التقنيات وبأعلى معايير الأداء والسرعة والأمان.",
      badge: "متاحون للعمل",
      badgeDesc: "جاهزون لمشروعك القادم",
    },
    philosophy: {
      title: "فلسفتنا",
      titleHighlight: "الهندسية",
      features: [
        { 
          id: 1, 
          icon: 'bolt', 
          title: 'الأداء والسرعة الفائقة', 
          desc: 'تحسين كل بايت لضمان أوقات تحميل فورية وأداء سلس بسرعة 60 إطاراً في الثانية حتى على الأجهزة المتوسطة والقديمة.' 
        },
        { 
          id: 2, 
          icon: 'architecture', 
          title: 'بنية سحابية قابلة للتوسع', 
          desc: 'بناء أنظمة تركيبية آمنة بـ Next.js و Node.js وقواعد بيانات متقدمة تنمو بسلاسة مع توسع أعمالك وحجم عملائك.' 
        },
        { 
          id: 3, 
          icon: 'target', 
          title: 'واجهات مستخدم دقيقة ومقنعة', 
          desc: 'نجمع بين التصميم العصري الجذاب وهندسة تجربة المستخدم المتقنة (Pixel-Perfect) لتحويل الزوار إلى عملاء حقيقيين.' 
        },
      ]
    },
    services: {
      title: "خدماتنا",
      titleHighlight: "البرمجية",
      desc: "حلول تقنية متكاملة من الواجهات وحتى الخوادم وقواعد البيانات لتلبية كافة احتياجات مشروعك الرقمي.",
      list: [
        { 
          id: '01', 
          title: 'تطوير مواقع وتطبيقات ويب متكاملة', 
          desc: 'بناء منصات وتطبيقات ويب سريعة وحديثة بـ Next.js و React و Tailwind CSS تضمن سرعة تحميل فائقة وتوافق كامل مع محركات البحث.' 
        },
        { 
          id: '02', 
          title: 'أنظمة ERP ونقاط بيع (POS) سحابية', 
          desc: 'أنظمة إدارة مخازن وفواتير ومبيعات متعددة الفروع تعمل سحابياً وتدعم التشغيل بدون إنترنت (Offline-First) مع مزامنة لحظية فورية.' 
        },
        { 
          id: '03', 
          title: 'متاجر إلكترونية وحلول دفع رقمي', 
          desc: 'متاجر بيع إلكترونية سريعة مع سلة مشتريات سلسة، ربط بوابات الدفع الإلكتروني، وتسهيل استلام الطلبات عبر الواتساب بنقرة واحدة.' 
        },
        { 
          id: '04', 
          title: 'تطبيقات الموبايل الهجينة (iOS & Android)', 
          desc: 'تطوير تطبيقات هواتف ذكية متجاوبة وعالية الاستجابة بتقنيات React Native و Expo Go من قاعدة كود واحدة توفر الوقت والتكلفة.' 
        },
        { 
          id: '05', 
          title: 'تصميم واجهات وتجربة المستخدم (UI/UX)', 
          desc: 'تصميم واجهات وتجارب استخدام عصرية وفاخرة بأسلوب Glassmorphism ومؤثرات تفاعلية تعكس قوة واحترافية علامتك التجارية.' 
        },
        { 
          id: '06', 
          title: 'الأتمتة وتأمين وحماية البيانات', 
          desc: 'أتمتة سير العمل بـ n8n، حماية المسارات والصلاحيات (RBAC)، وتشفير البيانات وتأمين الـ APIs ضد الثغرات والاختراق.' 
        },
      ]
    },
    experience: {
      title: "مسيرتنا",
      titleHighlight: "المهنية",
      list: [
        { 
          year: '2024 - الحاضر', 
          role: 'تأسيس وهندسة منظومة Magixa Tech', 
          company: 'Magixa Tech Solutions', 
          desc: 'قيادة تصميم وهندسة أنظمة الـ ERP ونقاط البيع السحابية، المتاجر الإلكترونية المتطورة، والحلول البرمجية المخصصة لخدمة مختلف الأنشطة التجارية.' 
        },
        { 
          year: '2023 - 2024', 
          role: 'تطوير المنصات التعليمية وأنظمة الـ LMS', 
          company: 'DWD & University Tech Hubs', 
          desc: 'ابتكار وبناء منصات تعليمية تفاعلية للجامعات تشمل تسجيل الحضور بمستشعرات الـ GPS ومساعد ذكاء اصطناعي تفاعلي وإدارة الاختبارات الأكاديمية.' 
        },
        { 
          year: '2022 - 2023', 
          role: 'هندسة الواجهات الأمامية والأنظمة التفاعلية', 
          company: 'Full-Stack & Web Engineering', 
          desc: 'بناء أكثر من 14 مشروعاً حياً يشمل لوحات تحكم ذكية، مواقع مؤسسية، منصات 3D تفاعلية، وتطبيقات متجاوبة بنسبة أداء 100%.' 
        }
      ]
    },
    portfolio: {
      title: "أعمالنا",
      titleHighlight: "المتميزة",
      desc: "استكشف 14 مشروعاً حقيقياً تم تصميمها وبرمجتها وتشغيلها بكفاءة عالية على أرض الواقع",
      projects: [
        // 1. Leopard ERP & POS
        {
          id: 'erp-system-pos',
          title: 'Leopard ERP & POS',
          tagline: 'نظام متكامل للمحاسبة والمخازن ونقاط البيع السحابية مع العمل بدون إنترنت',
          desc: 'نظام ERP سحابي متكامل يجمع بين نقاط البيع السريعة، إدارة المخازن متعددة الفروع، إصدار الفواتير الإلكترونية المعتمدة، وإدارة صلاحيات الموظفين، مع إمكانية العمل بدون اتصال بالإنترنت والمزامنة التلقائية فور عودة الاتصال.',
          category: 'أنظمة سحابية وERP',
          categorySlug: 'erp',
          img: '/projects/erp-pos.png',
          link: 'https://erp-system-pos.vercel.app/',
          technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Offline Storage', 'RBAC Auth'],
          metrics: [
            { label: 'التشغيل', value: 'Offline-First' },
            { label: 'المعمارية', value: 'Next.js / ERP' },
            { label: 'المزامنة', value: 'سحابية لحظية' }
          ]
        },
        // 2. DWD Edu
        {
          id: 'dwd-edu',
          title: 'DWD Edu',
          tagline: 'نظام ذكي لإدارة العملية التعليمية والجامعات بمساعد ذكاء اصطناعي',
          desc: 'منصة تعليمية ذكية متقدمة للجامعات والمعاهد مزودة بمساعد أكاديمي ذكي (Ai Nano) لتقديم شروحات وإجابات فورية للطلاب، مع نظام دقيق لتسجيل حضور الطلاب عبر تحديد الموقع الجغرافي (GPS) لمنع أي تلاعب.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/dwd-edu.png',
          link: 'https://dwd-edu.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'AI Integration', 'GPS API', 'Node.js'],
          metrics: [
            { label: 'المساعد الذكي', value: 'Ai Nano' },
            { label: 'الحضور', value: 'تتبع بالـ GPS' },
            { label: 'المنصة', value: 'تطبيق ويب تفاعلي' }
          ]
        },
        // 3. Nova AI
        {
          id: 'nova-ai',
          title: 'Nova AI',
          tagline: 'صفحة هبوط تسويقية عصرية لنظارات الواقع المعزز الذكية بتصميم زجاجي',
          desc: 'تصميم وبرمجة صفحة هبوط تسويقية (Landing Page) فائقة الجاذبية لنظارات ذكية تعمل بالواقع المعزز، بتصميم زجاجي فخم (Glassmorphism)، مؤثرات إضاءة نيون محيطية، وعرض تفاعلي جذاب لمواصفات المنتج وإمكانياته.',
          category: 'صفحات هبوط وأدوات',
          categorySlug: 'landing',
          img: '/projects/nova-ai.png',
          link: 'https://nova-ai-inky.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Glassmorphism', 'Responsive UI'],
          metrics: [
            { label: 'النوع', value: 'صفحة هبوط تسويقية' },
            { label: 'التصميم', value: 'Glassmorphism' },
            { label: 'السرعة', value: 'تحميل فائق' }
          ]
        },
        // 4. CodeLevel
        {
          id: 'code-level',
          title: 'CodeLevel',
          tagline: 'بيئة تدريب وتحديات برمجية تفاعلية مع محرر أكواد Monaco Editor',
          desc: 'منصة تعليمية تفاعلية لتعلم واختبار مهارات تطوير الواجهات الأمامية، تضم محرر أكواد Monaco Editor مدمج في المتصفح لتجربة الأكواد لحظياً مع محرك أسئلة تفاعلي ومسار تعلم تحفيزي ممتع.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/code-level.png',
          link: 'https://code-level-murex.vercel.app/',
          technologies: ['JavaScript', 'Monaco Editor', 'HTML5/CSS3', 'Gamification Engine'],
          metrics: [
            { label: 'محرر الأكواد', value: 'Monaco Editor' },
            { label: 'المسار', value: 'Frontend Mastery' },
            { label: 'التفاعل', value: 'تقييم فوري' }
          ]
        },
        // 5. 0EGP (FreedomPath)
        {
          id: '0egp',
          title: '0EGP (FreedomPath)',
          tagline: 'دليل وخريطة طريق تفاعلية لمصادر الدخل الرقمي الحلال بدون رأس مال',
          desc: 'خريطة طريق رقمية تفاعلية باللغة العربية تشرح أكثر من 50 مجال دخل حلال عبر الإنترنت، تشمل خطوات عملية، أدوات مجانية، ومصادر تعلم موثوقة تبدأ من الصفر بدون أي رأس مال.',
          category: 'صفحات هبوط وأدوات',
          categorySlug: 'landing',
          img: '/projects/0egp.png',
          link: 'https://0egp.vercel.app/',
          technologies: ['JavaScript', 'CSS3', 'HTML5', 'Interactive Timeline', 'RTL UI'],
          metrics: [
            { label: 'المجالات', value: '50+ مجال دخل' },
            { label: 'رأس المال', value: '0 جنيه' },
            { label: 'التصميم', value: 'Timeline تفاعلي' }
          ]
        },
        // 6. DS Master
        {
          id: 'ds-master',
          title: 'DS Master',
          tagline: 'منصة بصرية تفاعلية لشرح واختبار تراكيب البيانات والخوارزميات',
          desc: 'منصة متخصصة لتبسيط تراكيب البيانات والخوارزميات البرمجية المعقدة من خلال شروحات مرئية تفاعلية، تصفح مقسم للفصول، اختبارات تقييمية، وتخصيص كامل لمظهر الواجهة.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/ds-master.png',
          link: 'https://ds-master.vercel.app/',
          technologies: ['JavaScript', 'HTML5', 'CSS Custom Properties', 'Testing Engine'],
          metrics: [
            { label: 'التخصص', value: 'تراكيب البيانات' },
            { label: 'المحاضرات', value: '10 فصول شاملة' },
            { label: 'الاختبارات', value: 'امتحانات تفاعلية' }
          ]
        },
        // 7. Java Study Hub
        {
          id: 'java-study-hub',
          title: 'Java Study Hub',
          tagline: 'بوابة أكاديمية شاملة لتعلم برمجة جافا مع بنك أسئلة يتجاوز 250 سؤالاً',
          desc: 'بوابة أكاديمية متكاملة لطلاب الحاسبات وتكنولوجيا المعلومات، تغطي منهج برمجة جافا على مدار 10 أسابيع مع أمثلة كودية عملية ومحرك اختبارات تفاعلي يتضمن أكثر من 250 سؤالاً مع إحصائيات تقييم فوري.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/java-study-hub.png',
          link: 'https://java-study-hup.vercel.app/',
          technologies: ['JavaScript', 'HTML5', 'CSS3', 'Chart Analytics', 'Interactive Quizzes'],
          metrics: [
            { label: 'بنك الأسئلة', value: '250+ سؤال' },
            { label: 'المنهج', value: '10 أسابيع تدريب' },
            { label: 'التحليلات', value: 'إحصائيات فورية' }
          ]
        },
        // 8. Sonix Edu (IT Learning Hub)
        {
          id: 'sonix-edu',
          title: 'Sonix Edu',
          tagline: 'منصة جامعية متكاملة لإدارة المحتوى التعليمي لطلاب تكنولوجيا المعلومات',
          desc: 'منصة تعليمية متكاملة لطلاب كليات ومعاهد تكنولوجيا المعلومات، توفر وصولاً سلساً للمحاضرات والملفات والدروس المنظمة في بيئة مستخدم حديثة وسريعة الاستجابة.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/it-lerninghup.png',
          link: 'https://it-learning-hub.netlify.app/',
          technologies: ['React', 'Tailwind CSS', 'Node.js', 'Full Stack Architecture'],
          metrics: [
            { label: 'الجمهور', value: 'طلاب الجامعات' },
            { label: 'المعمارية', value: 'Full Stack' },
            { label: 'الواجهة', value: 'تصميم متجاوب' }
          ]
        },
        // 9. Games Store Pro
        {
          id: 'game-store-pro',
          title: 'Games Store Pro',
          tagline: 'متجر إلكتروني متطور لعرض وبيع الألعاب الرقمية مع فلاتر سريعة',
          desc: 'متجر تجارة إلكترونية متكامل مخصص لعشاق الألعاب والمنتجات الرقمية، يتيح استعراض وشراء أحدث الألعاب مع فلاتر فورية حسب التصنيف، سلة مشتريات سلسة، وعرض فيديو تفاعلي للألعاب.',
          category: 'متاجر إلكترونية',
          categorySlug: 'ecommerce',
          img: '/projects/game-store-pro.png',
          link: 'https://game-store-pro.vercel.app/',
          technologies: ['React', 'CSS3', 'JavaScript', 'UI/UX Architecture'],
          metrics: [
            { label: 'النشاط', value: 'متجر ألعاب' },
            { label: 'التجربة', value: 'سريعة وسلسة' },
            { label: 'الدفع', value: 'طلب فوري' }
          ]
        },
        // 10. Go Lap
        {
          id: 'go-lap',
          title: 'Go Lap',
          tagline: 'داشبورد موحد يجمع كافة أدوات وخدمات جوجل في واجهة زجاجية ذكية',
          desc: 'لوحة تحكم تفاعلية تجمع خدمات وأدوات جوجل الأساسية في واجهة واحدة موحدة بتصميم Glassmorphism أنيق، تتيح للمستخدمين البحث الفوري والوصول إلى كافة تطبيقاتهم دون الحاجة لفتح علامات تبويب متعددة.',
          category: 'صفحات هبوط وأدوات',
          categorySlug: 'landing',
          img: '/projects/go-lap.png',
          link: 'https://go-lap.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Google APIs Integration'],
          metrics: [
            { label: 'التصميم', value: 'Glassmorphism' },
            { label: 'الخدمات', value: 'Google Ecosystem' },
            { label: 'البحث', value: 'لحظي وفوري' }
          ]
        },
        // 11. Circuit Shop
        {
          id: 'circuit-shop',
          title: 'Circuit Shop',
          tagline: 'متجر إلكتروني لمكونات الإلكترونيات والعتاد مع طلب مباشر عبر الواتساب',
          desc: 'متجر تجارة إلكترونية سريع مخصص لبيع القطع والمكونات الإلكترونية وإكسسوارات الحواسيب، مزود ببحث لحظي، سلة مشتريات جانبية سريعة، وإمكانية إتمام الطلبات بنقرة واحدة عبر الواتساب.',
          category: 'متاجر إلكترونية',
          categorySlug: 'ecommerce',
          img: '/projects/circuit-shop.png',
          link: 'https://circuit-shop.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'WhatsApp Checkout'],
          metrics: [
            { label: 'التخصص', value: 'إلكترونيات وقطع غيار' },
            { label: 'السلة', value: 'درج مشتريات عائم' },
            { label: 'الطلب', value: 'واتساب مباشر' }
          ]
        },
        // 12. Sonix IT
        {
          id: 'sonix-it',
          title: 'Sonix IT',
          tagline: 'الموقع التعريفي الرسمي لشركة خدمات تكنولوجيا المعلومات والحلول السحابية',
          desc: 'موقع مؤسسي رسمي لشركة تكنولوجيا معلومات يستعرض باقة الخدمات الرقمية، الحلول البرمجية، والاستشارات التقنية، بتصميم أنيق يعزز ثقة العملاء ويعكس الكفاءة الهندسية للشركة.',
          category: 'أنظمة سحابية وERP',
          categorySlug: 'erp',
          img: '/projects/sonix-it.png',
          link: 'https://sonix-it.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'Corporate Branding', 'Responsive UI'],
          metrics: [
            { label: 'النوع', value: 'موقع مؤسسي' },
            { label: 'القطاع', value: 'خدمات IT' },
            { label: 'الهوية', value: 'احترافية وعصرية' }
          ]
        },
        // 13. Sonix DevHub
        {
          id: 'sonix-dev-hub',
          title: 'Sonix DevHub',
          tagline: 'منصة تعليمية وبوابة دورات برمجية تفاعلية مع عرض ثلاثي الأبعاد 3D WebGL',
          desc: 'بوابة تقنية متقدمة تضم أكثر من 16 دورة وفيديو تدريبي على يوتيوب في مجالات البرمجة وتطوير الأنظمة، مع مجسم شبكي ثلاثي الأبعاد تفاعلي بتقنية Three.js WebGL ومعرض للمشاريع الحية.',
          category: 'منصات تعليمية',
          categorySlug: 'edtech',
          img: '/projects/sonix-dev-hub.png',
          link: 'https://sonix-dev-hub.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Three.js WebGL', 'Tailwind CSS'],
          metrics: [
            { label: 'الفيديوهات', value: '16+ دورة تعليمية' },
            { label: 'التقنية', value: 'Three.js 3D Mesh' },
            { label: 'المنصة', value: 'بوابة رقمية تفاعلية' }
          ]
        },
        // 14. Hardware-Software Architect Portfolio
        {
          id: 'abdallah-mohamed-portfolio',
          title: 'Abdullah Mohamed Portfolio',
          tagline: 'معرض أعمال تفاعلي يدمج بين تطوير البرمجيات وهندسة النظم المضمنة والعتاد',
          desc: 'معرض أعمال شخصي متطور يربط بين هندسة البرمجيات المتكاملة وتطوير الأنظمة المضمنة وهندسة الإلكترونيات، يضم مسارات كوكبية تفاعلية، طرفية تحكم رقمية، وعرضاً حياً للأنظمة المنجزة.',
          category: 'صفحات هبوط وأدوات',
          categorySlug: 'landing',
          img: '/projects/abdallah-portfolio.png',
          link: 'https://abdallahmohamed.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'JavaScript', 'Interactive Canvas', 'IoT'],
          metrics: [
            { label: 'التخصص', value: 'برمجيات وعتاد (IoT)' },
            { label: 'النمط', value: 'Cyber UI' },
            { label: 'التفاعل', value: 'عقد مدارية تفاعلية' }
          ]
        },
      ]
    },
    contact: {
      title: "تواصل",
      titleHighlight: "معنا",
      desc: "نحن هنا لتحويل أفكارك إلى أنظمة برمجية ناجحة. تواصل معنا مباشرة للحصول على استشارة فنية ونموذج تجريبي (Demo) يناسب نشاطك.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      message: "اشرح لنا فكرة مشروعك ومتطلباتك...",
      submit: "إرسال الرسالة",
    },
    footer: {
      rights: "© 2026 Magixa Tech. جميع الحقوق محفوظة."
    }
  },
  en: {
    common: {
      clientPortal: "Client Portal",
      startProject: "Start Your Project",
      viewWork: "Explore Our Work",
      contactUs: "Contact Us",
      liveDemo: "Live Project Demo",
      allProjects: "All",
      erpCategory: "Cloud ERP & SaaS",
      ecommerceCategory: "E-Commerce",
      edtechCategory: "EdTech & Learning",
      landingCategory: "Landing & Tools",
      gridView: "Grid View",
      sliderView: "Slider View",
    },
    hero: {
      title: "Scalable Systems, Flawless Engineering.",
      highlights: ["Systems,", "Engineering."],
      desc: "At Magixa Tech, we engineer high-performance web applications, modern e-commerce stores, and robust cloud ERP systems tailored to scale with your growing business.",
      badge: "Available for work",
      badgeDesc: "Ready for your next project",
    },
    philosophy: {
      title: "Engineering",
      titleHighlight: "Philosophy",
      features: [
        { 
          id: 1, 
          icon: 'bolt', 
          title: 'Performance First', 
          desc: 'Optimizing every byte for sub-second load times and buttery-smooth 60fps responsiveness across modern and legacy devices alike.' 
        },
        { 
          id: 2, 
          icon: 'architecture', 
          title: 'Scalable Architecture', 
          desc: 'Building modular, type-safe Next.js & Node.js systems that scale seamlessly with your growing user base and transactions.' 
        },
        { 
          id: 3, 
          icon: 'target', 
          title: 'Conversion-Driven UI', 
          desc: 'Bridging high-impact modern aesthetics with obsessive pixel-perfect precision to transform casual visitors into loyal paying customers.' 
        },
      ]
    },
    services: {
      title: "Technical",
      titleHighlight: "Services",
      desc: "End-to-end software engineering across frontends, cloud backends, database layers, and automation workflows.",
      list: [
        { 
          id: '01', 
          title: 'Full-Stack Web Applications', 
          desc: 'Fast, responsive, and scalable web apps built with Next.js, React, and Tailwind CSS with pristine SEO and lightning-fast loading speeds.' 
        },
        { 
          id: '02', 
          title: 'Cloud ERP & POS Systems', 
          desc: 'Multi-branch point of sale, inventory control, and automated billing systems engineered with offline-first capabilities and instant sync.' 
        },
        { 
          id: '03', 
          title: 'High-Converting E-Commerce', 
          desc: 'Custom online stores with streamlined checkout, secure payment gateways, and instant 1-click WhatsApp order fulfillment.' 
        },
        { 
          id: '04', 
          title: 'Cross-Platform Mobile Apps', 
          desc: 'Native-feeling iOS and Android mobile applications developed with React Native and Expo Go from a single maintainable codebase.' 
        },
        { 
          id: '05', 
          title: 'Modern UI/UX Design', 
          desc: 'Sleek, futuristic interfaces with glassmorphism touches, micro-interactions, and user journeys crafted to elevate brand authority.' 
        },
        { 
          id: '06', 
          title: 'Workflow Automation & Security', 
          desc: 'n8n automated pipelines, role-based access control (RBAC), code encryption, and API hardening against cyber threats.' 
        },
      ]
    },
    experience: {
      title: "Professional",
      titleHighlight: "Journey",
      list: [
        { 
          year: '2024 - PRESENT', 
          role: 'Founder & Lead Systems Architect', 
          company: 'Magixa Tech Solutions', 
          desc: 'Leading engineering of cloud POS & ERP systems, modern e-commerce stores, and high-performance digital platforms for diverse commercial clients.' 
        },
        { 
          year: '2023 - 2024', 
          role: 'EdTech & LMS Platform Engineer', 
          company: 'DWD & University Tech Hubs', 
          desc: 'Architected university-grade LMS platforms featuring GPS-based attendance verification, intelligent AI assistants, and real-time exam engines.' 
        },
        { 
          year: '2022 - 2023', 
          role: 'Full-Stack Web & Interface Engineer', 
          company: 'Full-Stack & Web Engineering', 
          desc: 'Shipped over 14 live systems including corporate portals, 3D WebGL interactive hubs, and ultra-fast responsive web applications.' 
        }
      ]
    },
    portfolio: {
      title: "Featured",
      titleHighlight: "Works",
      desc: "Explore 14 verified, production-grade applications engineered and deployed live in the real world",
      projects: [
        // 1. Leopard ERP & POS
        {
          id: 'erp-system-pos',
          title: 'Leopard ERP & POS',
          tagline: 'Integrated Accounting, Inventory & Offline-First POS System',
          desc: 'A complete cloud-based and offline-first ERP system for high-speed point of sale (POS), multi-branch inventory management, automated tax invoices, and granular role-based permissions with automatic cloud sync.',
          category: 'Cloud ERP & SaaS',
          categorySlug: 'erp',
          img: '/projects/erp-pos.png',
          link: 'https://erp-system-pos.vercel.app/',
          technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Offline Storage', 'RBAC Auth'],
          metrics: [
            { label: 'Operation', value: 'Offline-First' },
            { label: 'Architecture', value: 'Next.js / ERP' },
            { label: 'Sync', value: 'Cloud Sync' }
          ]
        },
        // 2. DWD Edu
        {
          id: 'dwd-edu',
          title: 'DWD Edu',
          tagline: 'AI-Powered University Learning Management System',
          desc: 'Intelligent university LMS featuring an integrated AI assistant (Ai Nano) for real-time student support and a fraud-proof GPS-based geofenced attendance verification system.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/dwd-edu.png',
          link: 'https://dwd-edu.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'AI Integration', 'GPS API', 'Node.js'],
          metrics: [
            { label: 'AI Assistant', value: 'Ai Nano' },
            { label: 'Attendance', value: 'GPS-Verified' },
            { label: 'Platform', value: 'Full Web App' }
          ]
        },
        // 3. Nova AI
        {
          id: 'nova-ai',
          title: 'Nova AI',
          tagline: 'Futuristic Glassmorphic Landing Page for AR Smart Glasses',
          desc: 'A sleek, high-converting product showcase landing page for next-gen AR smart glasses featuring Glassmorphism UI, glowing ambient effects, and interactive product highlights.',
          category: 'Landing & Tools',
          categorySlug: 'landing',
          img: '/projects/nova-ai.png',
          link: 'https://nova-ai-inky.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Glassmorphism', 'Responsive UI'],
          metrics: [
            { label: 'Format', value: 'Product Landing' },
            { label: 'Design', value: 'Glassmorphism' },
            { label: 'Speed', value: 'Instant Load' }
          ]
        },
        // 4. CodeLevel
        {
          id: 'code-level',
          title: 'CodeLevel',
          tagline: 'Gamified Frontend Coding & Interactive Monaco Quiz Engine',
          desc: 'Gamified frontend mastery platform featuring interactive coding quizzes, real-time in-browser Monaco code execution, and structured learning roadmaps.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/code-level.png',
          link: 'https://code-level-murex.vercel.app/',
          technologies: ['JavaScript', 'Monaco Editor', 'HTML5/CSS3', 'Gamification Engine'],
          metrics: [
            { label: 'Editor', value: 'Monaco Runner' },
            { label: 'Track', value: 'Frontend Mastery' },
            { label: 'Feedback', value: 'Real-Time Evaluation' }
          ]
        },
        // 5. 0EGP (FreedomPath)
        {
          id: '0egp',
          title: '0EGP (FreedomPath)',
          tagline: 'Interactive Roadmap for Zero-Capital Halal Digital Incomes',
          desc: 'Interactive Arabic roadmap guide detailing 50+ halal online income streams, step-by-step launch strategies, free toolkits, and curated learning tracks with zero starting capital.',
          category: 'Landing & Tools',
          categorySlug: 'landing',
          img: '/projects/0egp.png',
          link: 'https://0egp.vercel.app/',
          technologies: ['JavaScript', 'CSS3', 'HTML5', 'Interactive Timeline', 'RTL UI'],
          metrics: [
            { label: 'Streams', value: '50+ Incomes' },
            { label: 'Capital', value: '0 Capital Req.' },
            { label: 'UI', value: 'Timeline Nodes' }
          ]
        },
        // 6. DS Master
        {
          id: 'ds-master',
          title: 'DS Master',
          tagline: 'Interactive Visual Data Structures & Algorithms Hub',
          desc: 'Specialized CS learning hub bringing abstract data structures to life through interactive visual breakdowns, chapter navigation, progress tracking, and comprehensive quizzes.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/ds-master.png',
          link: 'https://ds-master.vercel.app/',
          technologies: ['JavaScript', 'HTML5', 'CSS Custom Properties', 'Testing Engine'],
          metrics: [
            { label: 'Discipline', value: 'Data Structures' },
            { label: 'Chapters', value: '10 Modules' },
            { label: 'Exams', value: 'Interactive Tests' }
          ]
        },
        // 7. Java Study Hub
        {
          id: 'java-study-hub',
          title: 'Java Study Hub',
          tagline: 'Academic Java Programming Portal with 250+ Question Bank',
          desc: 'Comprehensive academic platform covering university Java curriculum across 10 weeks, featuring live syntax highlighting, timed MCQ tests with 250+ questions, and grade analytics.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/java-study-hub.png',
          link: 'https://java-study-hup.vercel.app/',
          technologies: ['JavaScript', 'HTML5', 'CSS3', 'Chart Analytics', 'Interactive Quizzes'],
          metrics: [
            { label: 'Question Bank', value: '250+ Questions' },
            { label: 'Curriculum', value: '10-Week Modules' },
            { label: 'Analytics', value: 'Real-Time Insights' }
          ]
        },
        // 8. Sonix Edu (IT Learning Hub)
        {
          id: 'sonix-edu',
          title: 'Sonix Edu',
          tagline: 'University Education & Academic Resource Hub for IT Students',
          desc: 'Structured higher-education academic platform for university IT students, organizing semester courses, learning materials, and lecture archives within a sleek responsive interface.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/it-lerninghup.png',
          link: 'https://it-learning-hub.netlify.app/',
          technologies: ['React', 'Tailwind CSS', 'Node.js', 'Full Stack Architecture'],
          metrics: [
            { label: 'Audience', value: 'IT Undergrads' },
            { label: 'Stack', value: 'Full Stack' },
            { label: 'Design', value: 'Responsive LMS' }
          ]
        },
        // 9. Games Store Pro
        {
          id: 'game-store-pro',
          title: 'Games Store Pro',
          tagline: 'Modern Gaming E-Commerce Store & Interactive Catalog',
          desc: 'High-performance gaming e-commerce platform featuring dynamic category filters, immersive game media previews, real-time shopping cart, and a streamlined gaming checkout experience.',
          category: 'E-Commerce',
          categorySlug: 'ecommerce',
          img: '/projects/game-store-pro.png',
          link: 'https://game-store-pro.vercel.app/',
          technologies: ['React', 'CSS3', 'JavaScript', 'UI/UX Architecture'],
          metrics: [
            { label: 'Niche', value: 'Gaming Store' },
            { label: 'Speed', value: 'Instant Response' },
            { label: 'Checkout', value: 'Direct Streamlined' }
          ]
        },
        // 10. Go Lap
        {
          id: 'go-lap',
          title: 'Go Lap',
          tagline: 'Unified Glassmorphic Dashboard for Google Ecosystem Tools',
          desc: 'Unified productivity dashboard consolidating essential Google services and tools into an elegant glassmorphic workspace with instant search and frictionless multitasking.',
          category: 'Landing & Tools',
          categorySlug: 'landing',
          img: '/projects/go-lap.png',
          link: 'https://go-lap.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Google APIs Integration'],
          metrics: [
            { label: 'Style', value: 'Glassmorphism' },
            { label: 'Ecosystem', value: 'Google APIs' },
            { label: 'Search', value: 'Instant Access' }
          ]
        },
        // 11. Circuit Shop
        {
          id: 'circuit-shop',
          title: 'Circuit Shop',
          tagline: 'Electronics & Hardware Components E-Commerce Store',
          desc: 'Specialized online storefront for electronic components, development boards, and computer hardware featuring instant catalog search, slide-out cart drawer, and 1-click WhatsApp order routing.',
          category: 'E-Commerce',
          categorySlug: 'ecommerce',
          img: '/projects/circuit-shop.png',
          link: 'https://circuit-shop.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Tailwind CSS', 'WhatsApp Checkout'],
          metrics: [
            { label: 'Category', value: 'Electronics Store' },
            { label: 'Cart', value: 'Drawer Checkout' },
            { label: 'Orders', value: 'WhatsApp Direct' }
          ]
        },
        // 12. Sonix IT
        {
          id: 'sonix-it',
          title: 'Sonix IT',
          tagline: 'Corporate Website for IT Services & Cloud Solutions',
          desc: 'Polished corporate web presence for an IT services provider showcasing enterprise capabilities, digital transformations, and consulting packages with modern responsive aesthetics.',
          category: 'Cloud ERP & SaaS',
          categorySlug: 'erp',
          img: '/projects/sonix-it.png',
          link: 'https://sonix-it.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'Corporate Branding', 'Responsive UI'],
          metrics: [
            { label: 'Type', value: 'Corporate Website' },
            { label: 'Industry', value: 'IT & Cloud' },
            { label: 'Identity', value: 'Enterprise Ready' }
          ]
        },
        // 13. Sonix DevHub
        {
          id: 'sonix-dev-hub',
          title: 'Sonix DevHub',
          tagline: 'Interactive Tech Hub & YouTube Courses Platform with 3D WebGL',
          desc: 'Interactive developer hub and education portal showcasing 16+ YouTube engineering courses, 3D WebGL particle mesh, and verified live project demonstrations.',
          category: 'EdTech & Learning',
          categorySlug: 'edtech',
          img: '/projects/sonix-dev-hub.png',
          link: 'https://sonix-dev-hub.vercel.app/',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'Three.js WebGL', 'Tailwind CSS'],
          metrics: [
            { label: 'Videos', value: '16+ Video Courses' },
            { label: 'Graphics', value: 'Three.js 3D Mesh' },
            { label: 'Platform', value: 'Interactive Hub' }
          ]
        },
        // 14. Hardware-Software Architect Portfolio
        {
          id: 'abdallah-mohamed-portfolio',
          title: 'Abdullah Mohamed Portfolio',
          tagline: 'Interactive Portfolio Bridging Full-Stack Software & Embedded Hardware',
          desc: 'Architectural portfolio platform uniting full-stack software development with embedded hardware engineering, featuring interactive orbital nodes and a live terminal interface.',
          category: 'Landing & Tools',
          categorySlug: 'landing',
          img: '/projects/abdallah-portfolio.png',
          link: 'https://abdallahmohamed.vercel.app/',
          technologies: ['React', 'Tailwind CSS', 'JavaScript', 'Interactive Canvas', 'IoT'],
          metrics: [
            { label: 'Specialty', value: 'Software & Hardware' },
            { label: 'Aesthetic', value: 'Cyber UI' },
            { label: 'Interactivity', value: 'Orbital Nodes' }
          ]
        },
      ]
    },
    contact: {
      title: "Contact",
      titleHighlight: "Us",
      desc: "Ready to turn your vision into high-performance software? Connect with us directly for a free technical consultation and tailored demo for your business.",
      name: "Full Name",
      email: "Email Address",
      message: "Describe your project requirements and goals...",
      submit: "Send Message",
    },
    footer: {
      rights: "© 2026 Magixa Tech. All rights reserved."
    }
  }
};
