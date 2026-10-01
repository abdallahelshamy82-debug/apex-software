/**
 * Apex AI Project Copilot Engine 2.0 (Generative & Deep Architecture)
 * Supports Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, and Deep Semantic Fallback Engine.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'ai_config.json');

// Auto-load .env file if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

function getAiConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return {
        geminiApiKey: data.geminiApiKey || process.env.GEMINI_API_KEY || '',
        openaiApiKey: data.openaiApiKey || process.env.OPENAI_API_KEY || '',
        provider: data.provider || 'gemini'
      };
    }
  } catch (e) {}

  return {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    provider: 'gemini'
  };
}

function saveAiConfig(newConfig) {
  try {
    const current = getAiConfig();
    const merged = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return { success: true, config: merged };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function safeParseJson(rawText) {
  if (!rawText) return null;
  let text = String(rawText).trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(text);
  } catch (e1) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (e2) {}
    }
    return null;
  }
}

// -------------------------------------------------------------
async function callGeminiAI(prompt, apiKey, language = 'ar') {
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];
  let lastError = null;

  const systemPrompt = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Apex Software Agency.
Your mission is to perform an EXTREMELY DETAILED, SPECIFIC, HIGHLY TAILORED architectural, technical, operational, and financial analysis of the user's software concept.

CRITICAL ARCHITECTURAL & PRICING RULES:
1. Lean MVP Philosophy: Always configure the Minimum Viable Product (MVP) package at the absolute lowest realistic cost to let the client launch and test market demand with minimal financial risk.
   - For simple projects or lean MVPs: start around 18,000 - 28,000 EGP ($380 - $600).
   - For Pro systems: 45,000 - 65,000 EGP ($950 - $1,400).
   - For Enterprise: 85,000 - 130,000 EGP ($1,800 - $2,800).
2. Transparent Annual Recurring Third-Party Costs:
   Under "annualOperationalEstimate", you MUST clearly itemize the essential recurring fees that the client pays directly to third-party providers (Apple, Google, Cloud hosting, Domain):
   - "appleDeveloper": "حساب مطور Apple App Store: $99 سنوياً (يدفع لشركة Apple مباشرة للحفاظ على نشر تطبيق iOS في متجر التطبيقات)",
   - "googlePlay": "حساب مطور Google Play Console: $25 تدفع لمرة واحدة مدى الحياة (لشركة Google لنشر تطبيقات أندرويد)",
   - "hosting": "خادم سحابي وسيرفر VPS: تبدأ من $10 - $20 شهرياً (تدفع لمزود السحابة وفق الاستهلاك الفعلي)",
   - "domainSsl": "اسم النطاق الدولي (.com/.net) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً",
   - "mapsApi": "خرائط جوجل وتحديد المواقع: رصيد مجاني شهري $200 من Google Cloud يغطي آلاف العمليات مجاناً",
   - "paymentGateways": "بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك شهري، نسبة 2.5% تقتطع عند نجاح العمليات فقط"
3. STRICT RELEVANCE & NO INVENTED SCOPE (DO NOT ADD UNREQUESTED APPS OR PLATFORMS):
   - You MUST tailor the platforms strictly to what the client actually requested in the prompt and chat:
     * If the client asked ONLY for a "website" (موقع إلكتروني), "landing page" (صفحة هبوط), "web portal" (بوابة ويب), or "CRM / Web dashboard" (لوحة إدارة ويب) and DID NOT ask for mobile apps:
       -> "platforms" MUST contain ONLY the web platforms (e.g. Responsive Web App, Admin Dashboard).
       -> DO NOT include Mobile Apps (iOS & Android) in "platforms".
       -> In "annualOperationalEstimate", DO NOT include "appleDeveloper" ($99) or "googlePlay" ($25) because there are no mobile apps!
     * If the client asked for a "mobile app" (تطبيق موبايل / أندرويد / آيفون):
       -> Include Mobile App(s) and include the App Store ($99) & Google Play ($25) developer accounts.
     * If the client asked for a complete on-demand system (e.g. delivery, ride hailing, marketplace):
       -> Include the required platforms (Customer App, Courier/Partner App, Web Super Admin).
     * NEVER add extra platforms, mobile apps, or hardware features that contradict the user's explicit scope!

Avoid generic boilerplates. Provide realistic numbers, specific local competitors, actual risks, and tailored screens according to their unique idea.
You MUST output ONLY a well-formed JSON object (no markdown code blocks, no explanation text).
Language of the output: ${language === 'ar' ? 'Professional Arabic (العربية الفصحى التقنية الدقيقة)' : 'English'}.

The JSON must follow this exact schema:
{
  "projectName": "Commercial & technical project name",
  "domainName": "Industry & domain specialization",
  "tagline": "Compelling short tagline",
  "summary": "Executive technical and architectural summary (3-4 detailed sentences customized to their specific idea)",
  "strategicAnalysis": {
    "valueProposition": "Core competitive advantage and value created for users/market",
    "businessModel": "How the platform monetizes (commission percentages, subscription tiers, delivery markups, ads, etc.)",
    "keyChallenges": [
      "Operational/logistical challenge 1 and the recommended technical mitigation",
      "Regulatory/compliance challenge 2 and mitigation",
      "Technical scalability challenge 3 and mitigation"
    ],
    "mvpStrategy": "Actionable strategy for the Minimum Viable Product launch to validate the market with lowest cost"
  },
  "platforms": [
    {
      "id": "client_app",
      "name": "Customer Mobile App (iOS & Android)",
      "icon": "phone-portrait-outline",
      "role": "Role and target user experience",
      "keyFeatures": [
        "Feature 1 specific to their idea",
        "Feature 2",
        "Feature 3",
        "Feature 4",
        "Feature 5"
      ],
      "screens": [
        { "name": "Screen name 1", "desc": "Detailed function and user journey inside this screen" },
        { "name": "Screen name 2", "desc": "Detailed function and user journey inside this screen" },
        { "name": "Screen name 3", "desc": "Detailed function and user journey inside this screen" },
        { "name": "Screen name 4", "desc": "Detailed function and user journey inside this screen" }
      ]
    }
  ],
  "systemArchitecture": {
    "architectureType": "e.g. Modular Microservices & Event-Driven Architecture",
    "microservices": [
      "Identity & Auth Service (JWT & Role-based Access)",
      "Core Order & Dispatching Engine",
      "Geolocation & Live Tracking Cluster",
      "Financial Ledger & Wallet Engine",
      "Notification & Socket Broker"
    ],
    "databaseSchema": [
      {
        "table": "Users",
        "description": "User accounts and authentication credentials",
        "fields": ["id", "fullName", "email", "phone", "role", "avatarUrl", "createdAt"]
      },
      {
        "table": "Orders / Transactions",
        "description": "Core business transactions",
        "fields": ["id", "userId", "partnerId", "status", "totalAmount", "paymentStatus", "createdAt"]
      }
    ],
    "realtimeEvents": [
      "order:created",
      "location:update",
      "status:changed"
    ]
  },
  "techStack": {
    "mobile": "React Native (Expo) - Unified high-performance codebase for iOS & Android",
    "web": "React.js / Next.js with Tailwind CSS for rapid responsive admin operations",
    "backend": "Node.js & Express / NestJS with modular REST & WebSocket architecture",
    "realtime": "Socket.io & Redis Pub/Sub for sub-second location & chat synchronization",
    "database": "PostgreSQL with Prisma ORM for relational integrity & ACID compliance",
    "maps": "Google Maps Platform / Mapbox for accurate geocoding & route optimization",
    "payments": "Paymob / Vodafone Cash / InstaPay / Stripe for omnichannel payments",
    "devops": "Docker & Nginx reverse proxy with SSL certificate & automated daily backups",
    "aiVision": "AI / OCR module if applicable to project, or null"
  },
  "timelineWeeks": 8,
  "milestones": [
    {
      "phase": 1,
      "title": "المرحلة 1: دراسة المتطلبات وتصميم الواجهات وتجربة المستخدم (UI/UX Design)",
      "durationWeeks": 2,
      "sprintTasks": [
        "إعداد Wireframes التفاعلية لكافة المنصات والشاشات",
        "بناء دليل الهوية الرقمية ونظام المكونات Design System",
        "اعتماد النماذج التفاعلية الحية Prototype على Figma"
      ]
    },
    {
      "phase": 2,
      "title": "المرحلة 2: بناء خوادم الباك إند وقواعد البيانات والربط اللحظي والخرائط",
      "durationWeeks": 2,
      "sprintTasks": [
        "بناء الـ RESTful APIs ونظام التوثيق والمصادقة المشفر JWT",
        "هندسة قواعد البيانات وعلاقات الجداول وخدمات التتبع",
        "دمج بوابات الدفع الإلكتروني ونظام المقابس اللحظية Socket.io"
      ]
    },
    {
      "phase": 3,
      "title": "المرحلة 3: تطوير وتكامل تطبيقات الموبايل ولوحة التحكم المركزية",
      "durationWeeks": 2,
      "sprintTasks": [
        "برمجة شاشات التطبيقات لجميع أطراف المنظومة",
        "ربط الـ APIs واختبار مسار العمليات والرحلات الكاملة End-to-End",
        "بناء لوحة إدارة المشرفين والتقارير والإحصائيات الحية"
      ]
    },
    {
      "phase": 4,
      "title": "المرحلة 4: الاختبارات الشاملة (QA) والإطلاق الرسمي في Google Play & App Store",
      "durationWeeks": 2,
      "sprintTasks": [
        "اختبارات الأمان ومقاومة الضغط والأداء Security & Load Testing",
        "تجهيز ملفات البناء ورفع التطبيقات للمتاجر الرسمية",
        "تسليم السورس كود وتدريب فريق الإدارة على تشغيل النظام"
      ]
    }
  ],
  "budgetBreakdown": {
    "currencyEGP": 48000,
    "currencyUSD": 1050,
    "items": [
      { "category": "تصميم تجربة وواجهات المستخدم (UI/UX Design)", "costEGP": 11000, "costUSD": 240, "desc": "تصميم تفاعلي كامل لكافة المنصات والشاشات على Figma" },
      { "category": "تطوير الباك إند وقواعد البيانات والـ APIs", "costEGP": 16000, "costUSD": 350, "desc": "الخوادم، المقابس اللحظية، محرك الخرائط، وبوابات الدفع" },
      { "category": "برمجة وتطوير تطبيقات الموبايل الموحدة", "costEGP": 14000, "costUSD": 310, "desc": "تطبيقات أندرويد وآيفون بأحدث تقنيات React Native" },
      { "category": "لوحة التحكم السحابية المركزية (Super Admin)", "costEGP": 7000, "costUSD": 150, "desc": "لوحة ويب سحابية شاملة للتحكم في العمليات والتقارير المالية" }
    ],
    "annualOperationalEstimate": {
      "appleDeveloper": "حساب مطور Apple App Store: $99 سنوياً (يدفع لشركة Apple مباشرة لرفع وتحديث تطبيق iOS)",
      "googlePlay": "حساب مطور Google Play Console: $25 تدفع لمرة واحدة مدى الحياة (لشركة Google لنشر تطبيقات أندرويد)",
      "hosting": "استضافة سحابية VPS وسيرفر: تبدأ من $10 - $20 شهرياً (تدفع لمزود السحابة وفق الاستهلاك الفعلي)",
      "domainSsl": "اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً",
      "mapsApi": "خرائط جوجل: رصيد مجاني شهري $200 من Google Cloud يكفي للبداية مجاناً",
      "paymentGateways": "بوابات الدفع (Paymob / فيزا): 0 رسوم تأسيس، اقتطاع 2.5% فقط عند العمليات الناجحة"
    }
  },
  "paymentPlan": [
    { "milestone": "الدفعة الأولى (40%)", "desc": "عند توقيع العقد والبدء في التصميم وهندسة واجهات وتجربة المستخدم" },
    { "milestone": "الدفعة الثانية (30%)", "desc": "عند تسليم النسخة التجريبية الحية (Staging Preview) واكتمال الخوادم" },
    { "milestone": "الدفعة النهائية (30%)", "desc": "عند الاعتماد النهائي، تسليم الكود المصدري ورفع التطبيقات للمتاجر الرسمية" }
  ],
  "feasibilityScore": 88,
  "feasibilityAnalysis": "تحليل الجدوى التسويقية والتقنية والمالية وفرص التميز بالسوق...",
  "competitors": [
    { "name": "المنافس الأول", "marketShareOrType": "تطبيق محلي رئيسي", "ourEdge": "نقاط تميز حلول Apex المعمارية والتقنية" },
    { "name": "المنافس الثاني", "marketShareOrType": "منصة إقليمية", "ourEdge": "نقاط تميز حلول Apex المعمارية والتقنية" }
  ],
  "packages": {
    "mvp": {
      "title": "باقة إطلاق النموذج الأولي (MVP - الأقل تكلفة)",
      "costEGP": 22000,
      "costUSD": 480,
      "weeks": 4,
      "desc": "النسخة الأساسية الرشيقة للتحقق السريع من السوق واختبار الإقبال بأقل تكلفة ومخاطرة مالية",
      "keyDeliverables": [
        "تطبيق موبايل مخصص (Android & iOS)",
        "لوحة إدارة مصغرة للمشرفين",
        "خادم سحابي وبنية بيانات أساسية",
        "بوابة دفع إلكتروني واحدة أساسية"
      ]
    },
    "pro": {
      "title": "باقة المنظومة المتكاملة (Pro Growth - الموصى بها)",
      "costEGP": 48000,
      "costUSD": 1050,
      "weeks": 8,
      "desc": "المنظومة الاحترافية المتكاملة مع كافة تطبيقات الأطراف والتتبع اللحظي والإشعارات المتقدمة",
      "keyDeliverables": [
        "تطبيقات العملاء والشركاء مع التتبع الحي",
        "لوحة تحكم إدارية مركزية متطورة مع تقارير وإحصائيات حية",
        "خرائط وتتبع لحظي GPS فائق الدقة ومحفظة رقمية",
        "بوابات دفع متعددة (Paymob, فودافون كاش, بطاقات بنكية)",
        "دعم فني وصيانة مجانية لمدة 6 أشهر مع ضمان استقرار الخوادم"
      ]
    },
    "enterprise": {
      "title": "باقة المؤسسات والأنظمة الكبرى (Enterprise Scale)",
      "costEGP": 89000,
      "costUSD": 1950,
      "weeks": 12,
      "desc": "حلول برمجية ضخمة بمواصفات مخصصة، معمارية Microservices، خوادم مخصصة وميزات ذكاء اصطناعي",
      "keyDeliverables": [
        "كافة تطبيقات ومنصات المنظومة (عميل، كابتن، شركاء، لوحة سوبر أدمن)",
        "معمارية سحابية Microservices عالية التحمل ومصممة لملايين المستخدمين",
        "أنظمة ذكاء اصطناعي وأتمتة مخصصة وفق نشاط المشروع",
        "تكامل شامل مع بوابات دفع دولية ومحلية وفواتير إلكترونية",
        "دعم فني 24/7 مع اتفاقية مستوى خدمة رسمية SLA"
      ]
    }
  }
}`;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: `[فكرة العميل لتحليلها بدقة وبشكل مخصص وعميق جداً]:\n"${prompt}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.65,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${model} returned HTTP ${response.status}, trying next model...`);
        lastError = new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find(p => p.text && !p.thought) || parts[parts.length - 1];
      let text = textPart?.text;
      if (!text) throw new Error(`No content returned from Gemini API (${model})`);

      const parsed = safeParseJson(text);
      if (!parsed) throw new Error(`Could not parse JSON response from Gemini (${model})`);
      parsed.isLiveAI = true;
      parsed.engine = `Google Gemini Live LLM (${model})`;
      return parsed;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed');
}

// -------------------------------------------------------------
// 2. OpenAI GPT-4o-mini API Caller
// -------------------------------------------------------------
async function callOpenAI(prompt, apiKey, language = 'ar') {
  const url = 'https://api.openai.com/v1/chat/completions';

  const systemPrompt = `You are an elite Principal Software Architect and CTO at Apex Software Agency.
Analyze the user's software project concept in extreme technical, operational, and financial depth.
Output ONLY a well-formed JSON object according to standard Apex specifications.
Language: ${language === 'ar' ? 'Arabic' : 'English'}.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this project concept thoroughly: "${prompt}"` }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No content returned from OpenAI API');

  const parsed = JSON.parse(text);
  parsed.isLiveAI = true;
  parsed.engine = 'OpenAI GPT-4o-mini (Live LLM)';
  return parsed;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 2.1 Google Gemini Interactive Chat Consultant
// -------------------------------------------------------------
async function callGeminiChatConsultant(messages, apiKey, language = 'ar') {
  // Reliable models ordered by current official availability & sub-second performance
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];
  let lastError = null;

  const systemInstruction = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Apex Software Agency (شركة إيبكس لحلول البرمجيات وتطوير التطبيقات).
You are having an interactive live consultation discussion with a client exploring a new software, mobile app, or SaaS idea.

Core Behavioral Guidelines:
1. Persona: Speak with the authority, clarity, warmth, technical mastery, and strategic wisdom of a world-class CTO and Software Architect.
2. Identity: If the user asks who you are, what your name is, or what they should call you, answer warmly and directly: tell them you are "مستشار Apex البرمجي الذكي" (Apex Chief Architect & CTO) and they can call you "مستشار Apex" or "بشمهندس".
3. Greetings: If the user greets you or says hi, greet them back warmly and ask how you can assist with their software idea or technical question today.
4. Lean MVP Philosophy & Lowest Cost Strategy:
   - Always prioritize the client's return on investment. Emphasize starting with the leanest viable MVP (النموذج الأولي بأقل ميزانية ممكنة) to test and validate their idea in the market without draining their capital.
   - Tailor the tech stack and architecture to avoid unnecessary overhead in the beginning while keeping it scalable.
5. COMPLETE TRANSPARENCY ON RECURRING OPERATIONAL COSTS (مصاريف الطرف الثالث المستمرة):
   Whenever discussing pricing, budgets, mobile apps (especially iOS), cloud servers, or feasibility:
   - Clarify that Apex's software development is a one-time project fee divided across completed deliverables and milestones.
   - PROACTIVELY and clearly explain the essential ongoing operational costs that the client pays directly to global providers:
     * Apple Developer Program: $99 / سنة (اشتراك سنوي إلزامي لشركة Apple لنشر وإبقاء تطبيق iOS في متجر App Store باسم العميل أو الشركة).
     * Google Play Console: $25 تدفع لمرة واحدة فقط مدى الحياة (لشركة Google لنشر تطبيقات Android).
     * Cloud Server / VPS: يبدأ من $10 - $20 شهرياً ويتم ترقيته تدريجياً وفق عدد المستخدمين الفعليين دون إهدار.
     * Domain & SSL: حوالي $12 - $15 سنوياً لحجز النطاق الدولي (.com/.net).
     * Payment Gateways: بدون رسوم اشتراك شهرية ثابتة، اقتطاع نسبة بسيطة (~2.5%) فقط عند نجاح أي عملية شراء.
6. Tailored Engagement: If the user describes an idea, engage deeply with THEIR specific idea: analyze its core value, suggest modern tech stack elements (React Native, Node.js, real-time sockets, cloud databases), and ask 1 to 2 sharp clarifying questions.
7. NEVER assume or invent a project domain (like food delivery or restaurants) that the user did not explicitly mention!
8. Smart Suggestion Chips: Suggest 2 to 4 high-value, actionable quick-reply chips ("suggestions") in Arabic that directly advance the discussion (e.g. asking for MVP budget, discussing iOS fees, reviewing tech stack, or moving to contract generation).
9. CRITICAL RULE FOR "readyForSpec":
   - Set "readyForSpec" to true ONLY IF:
     a) The client explicitly requests generating the blueprint / feasibility study / packages ("استخراج الخطة", "دراسة الجدوى", "الباقات", "التعاقد").
     b) OR after sufficient interactive consultation (usually after 2 to 4 back-and-forth messages) where the core workflow, platforms (web vs mobile), and user types have been clearly explained and understood!
   - DO NOT set "readyForSpec" to true on the very first message unless the user provided a full, multi-paragraph comprehensive technical specification in that single message.
   - NEVER set "readyForSpec" to true for greetings, questions about your identity/name, general pricing questions, or complaints!

Language: ${language === 'ar' ? 'Professional, natural Modern Arabic (العربية الفصحى التقنية الراقية والودودة بطابع مهندس معمار برمجيات خبير)' : 'English'}.
You MUST respond with a VALID JSON object ONLY (strictly no markdown backticks, no wrapping text):
{
  "reply": "نص الرد الاستشاري الحواري...",
  "suggestions": [
    "اقتراح إجابة سريعة 1",
    "اقتراح إجابة سريعة 2",
    "اقتراح إجابة سريعة 3"
  ],
  "readyForSpec": false
}`;

  // Format contents for Gemini:
  // Must alternate strictly: user -> model -> user -> model ...
  const rawContents = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    const text = (msg.text || msg.content || '').trim();
    if (text) {
      rawContents.push({ role, text });
    }
  }

  // Ensure first message is user
  if (rawContents.length === 0 || rawContents[0].role !== 'user') {
    rawContents.unshift({ role: 'user', text: 'مرحباً، أود استشارتك في مشروعي.' });
  }

  // Merge adjacent messages with same role to guarantee strict alternation
  const alternating = [];
  for (const item of rawContents) {
    if (alternating.length > 0 && alternating[alternating.length - 1].role === item.role) {
      alternating[alternating.length - 1].text += '\n\n' + item.text;
    } else {
      alternating.push({ role: item.role, text: item.text });
    }
  }

  // Ensure last message is user (if last is model, add a user continuation prompt)
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'model') {
    alternating.push({ role: 'user', text: 'تابع الشرح والتحليل المعماري.' });
  }

  const contents = alternating.map(c => ({
    role: c.role,
    parts: [{ text: c.text }]
  }));

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${model} returned HTTP ${response.status}, trying next model...`);
        lastError = new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find(p => p.text && !p.thought) || parts[parts.length - 1];
      let text = textPart?.text;
      if (!text) throw new Error(`No content returned from Gemini API (${model})`);

      const parsed = safeParseJson(text);
      if (!parsed) throw new Error(`Failed to parse JSON response from Gemini API (${model})`);

      return {
        reply: parsed.reply || 'أهلاً بك! أنا مستشارك البرمجي الذكي في Apex Software. كيف يمكنني مساعدتك في تطوير فكرتك اليوم؟',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        readyForSpec: !!parsed.readyForSpec,
        isLiveAI: true,
        engine: `Google Gemini Live LLM (${model})`
      };
    } catch (err) {
      lastError = err;
      console.warn(`Attempt with ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed for chat');
}

// -------------------------------------------------------------
// 2.2 OpenAI Interactive Chat Consultant
// -------------------------------------------------------------
async function callOpenAIChatConsultant(messages, apiKey, language = 'ar') {
  const url = 'https://api.openai.com/v1/chat/completions';
  const systemPrompt = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Apex Software Agency.
Interactive live consultation with a client.
Output JSON only:
{
  "reply": "Consultative Arabic answer",
  "suggestions": ["quick reply 1", "quick reply 2"],
  "readyForSpec": false
}`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
      content: m.text || m.content || ''
    }))
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: formattedMessages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No content returned from OpenAI API');
  const parsed = JSON.parse(text);
  return {
    reply: parsed.reply || 'مرحباً بك في Apex Software. كيف نساعدك؟',
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    readyForSpec: !!parsed.readyForSpec,
    isLiveAI: true,
    engine: 'OpenAI GPT-4o-mini (Live LLM)'
  };
}

// -------------------------------------------------------------
// 2.3 Deep Semantic Chat Consultant (Offline / Fallback)
// -------------------------------------------------------------
// -------------------------------------------------------------
// 2.3 Deep Semantic Chat Consultant (Smart Conversational Engine)
// -------------------------------------------------------------
function deepSemanticChatConsultant(messages = [], language = 'ar') {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserMsg = (userMessages[userMessages.length - 1]?.text || '').trim();
  const allUserText = userMessages.map(m => m.text || '').join(' ');
  const userMsgCount = userMessages.length;

  const ent = extractKeywordsAndEntities(lastUserMsg);
  const allEnt = extractKeywordsAndEntities(allUserText);

  let reply = '';
  let suggestions = [];
  let readyForSpec = false;

  // 1. Identity & Name Questions ("انت مين", "اسمك ايه", "اقولك ايه عشان معرفش اسمك")
  if (ent.isIdentity) {
    reply = 'أهلاً بك يا فندم! أنا **مستشار Apex البرمجي الذكي (Apex Software Architect)**.\n\nتقدر تناديني **"مستشار Apex"** أو **"بشمهندس"** زي ما تحب! 😊\n\nأنا مهندسك المعماري التقني هنا في شركة **Apex Software**: أسمع فكرة تطبيقك، أساعدك في اختيار أفضل لغات البرمجة والمعمارية (React Native، Node.js، الخرائط، الدفع الإلكتروني)، وأستخرج لك دراسة جدوى فنية و3 باقات استثمارية واضحة بالتكلفة والمدة.\n\nقول لي، هل في فكرة تطبيق أو مشروع يدور في بالك تحب نبدأ ندردش فيها ونحللها؟';
    suggestions = [
      'عندي فكرة تطبيق وأريد استشارتك فيها',
      'ما هي الخدمات التي تقدمها شركة Apex؟',
      'كيف يتم تحديد تكلفة ومدة أي مشروع؟'
    ];
    readyForSpec = false;
  }
  // 2. Apology / Misunderstanding / Complaint Handling ("مش فاهمني", "انت مش فاهم", "محللتش")
  else if (ent.isComplaint) {
    reply = 'أعتذر منك بشدة يا فندم، حقك عليّ تماماً! 🙏\n\nأنا هنا الآن بكامل تركيزي معك دون أي افتراضات مسبقة. تفضل باختصار أو بالتفصيل: ما هي الفكرة أو السؤال الذي يدور في ذهنك؟ وسأجيبك عليه بدقة كمهندس برمجيات.';
    suggestions = [
      'أريد شرح فكرة تطبيقي بالتفصيل',
      'عندي استفسار عن تكلفة تطبيق موبايل',
      'ما هي خطوات التعاقد وتطوير المشروع؟'
    ];
    readyForSpec = false;
  }
  // 3. Greetings & Casual Welcome ("السلام عليكم", "مرحبا", "ازيك", "صباح الخير")
  else if (ent.isGreeting && !ent.hasRealProjectIdea) {
    reply = 'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك في **Apex Software**.\n\nأنا مهندسك المعماري ومستشارك التقني المخصص. يسعدني جداً التحدث معك ومساعدتك في تحويل أي فكرة برمجية أو تطبيق في ذهنك إلى خطة عمل ونظام تقني متكامل.\n\nتفضل شاركني فكرتك أو اسألني عن أي استشارة تقنية تحتاجها!';
    suggestions = [
      'عندي فكرة تطبيق وأريد معرفة التكلفة التقريبية',
      'تطبيق توصيل وخدمات مع كباتن وتتبع GPS',
      'متجر إلكتروني متعدد التجار مع بوابات دفع',
      'ما هي خطوات العمل والمدة الزمنية للتسليم؟'
    ];
    readyForSpec = false;
  }
  // 4. Gratitude / Thanks ("شكرا", "تسلم", "الله يخليك")
  else if (ent.isGratitude) {
    reply = 'العفو يا فندم، تحت أمرك دائماً! في Apex Software هدفنا تقديم أفضل قيمة واستشارة تقنية بأعلى المعايير.\n\nإذا كان لديك أي استفسار آخر أو ترغب في بدء التخطيط لمشروعك، أنا معك دائماً.';
    suggestions = [
      'أريد مناقشة فكرة مشروع جديدة',
      'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات',
      'التواصل مباشرة مع فريق التطوير عبر واتساب'
    ];
    readyForSpec = false;
  }
  // 5. Inquiries about Apex Agency & Services ("مين شركة ايبكس", "خدماتكم ايه", "بتعملوا ايه")
  else if (ent.isAgencyInquiry) {
    reply = 'شركة **Apex Software** هي شريكك التقني لتطوير الحلول البرمجية المتكاملة:\n\n1. **تطبيقات الموبايل (iOS & Android):** نطور تطبيقات فائقة السرعة والأمان بتقنية React Native الموحدة.\n2. **المنصات السحابية ولوحات التحكم:** لوحات Super Admin تفاعلية ومؤتمتة لإدارة العمليات والمبيعات.\n3. **البنية التحتية والربط اللحظي:** خوادم Microservices، خرائط وتتبع GPS، وبوابات الدفع (Paymob، فودافون كاش، فيزا، كاش).\n4. **الضمان والدعم الفني:** نقدم عقوداً موثقة وضماناً مجانياً 6 أشهر بعد الإطلاق.\n\nهل تخطط لإطلاق تطبيقك الخاص وتود حساب تكلفته؟';
    suggestions = [
      'نعم، عندي فكرة وأريد حساب التكلفة والمدة',
      'كيف تضمنون جودة الكود واستقرار السيرفر؟',
      'ما هي مراحل تسليم المشروع والدفعات؟'
    ];
    readyForSpec = false;
  }
  // 6. General Pricing Inquiries ("اسعاركم كام", "التكلفة كام", "بكام")
  else if (ent.isPricing && !ent.hasRealProjectIdea) {
    reply = 'في **Apex Software** نعتمد فلسفة الهندسة الرشيقة (Lean Architecture): نبدأ معك بأقل ميزانية ممكنة لإطلاق النموذج الأولي (MVP) لتجربة السوق والتحقق من فكرتك بأقل مخاطرة مالية، مع شفافية كاملة في كافة التكاليف:\n\n• **باقة الانطلاق السريع (MVP):** تبدأ من 18,000 - 28,000 ج.م / $380 - $600 (أقل تكلفة لتطبيق عملي متقن لاختبار الإقبال في السوق بأقل مخاطرة).\n• **باقة النمو المتكاملة (Pro):** تبدأ من 45,000 - 65,000 ج.م / $950 - $1,400 (تطبيقات متكاملة مع تتبع GPS ودفع إلكتروني ولوحة تحكم).\n• **باقة المؤسسات (Enterprise):** أنظمة ضخمة ومعمارية Microservices متطورة.\n\n⚠️ **الشفافية في التكاليف التشغيلية السنوية (رسوم الطرف الثالث):**\nلضمان دراستك للمشروع باحترافية، نوضح لك التكاليف التي تدفعها مباشرة للشركات الخارجية:\n- **تطبيق آبل (iOS):** حساب مطور أبل ($99 سنوياً تدفع لشركة Apple مباشرة لإبقاء التطبيق على App Store).\n- **تطبيق أندرويد:** حساب مطور جوجل ($25 لمرة واحدة مدى الحياة تدفع لـ Google).\n- **السيرفر والاستضافة السحابية:** تبدأ من $10 - $20 شهرياً وتزيد تدريجياً مع نمو الزوار.\n- **الدومين وشهادة الأمان:** حوالي $12 - $15 سنوياً للنطاق الدولي.\n\nما هي فكرة تطبيقك التي تود حساب تكلفتها بدقة؟';
    suggestions = [
      'أريد باقة MVP بأقل تكلفة ممكنة',
      'تطبيق موبايل متكامل للآيفون والأندرويد',
      'ما هي خطة الدفعات ومراحل التسليم؟',
      'مناقشة فكرة مشروعي بالتفصيل'
    ];
    readyForSpec = false;
  }
  // 7. Domain-Specific Project Ideas (With strict word boundary check!)
  else if (allEnt.isPharmacy) {
    if (userMsgCount <= 2 && !lastUserMsg.includes('استخراج')) {
      reply = 'فكرة ممتازة جداً! تطبيقات توصيل الأدوية والصيدليات (PharmaTech) من أعلى القطاعات طلباً. لبناء معمارية برمجية صحيحة تضمن سرعة الاستجابة:\n\n1. هل ترغب في ربط الكاميرا بقارئ ذكي للروشتات (OCR) لمساعدة العميل في قراءة الوصفة الطبية؟\n2. هل المنظومة ستعتمد على صيدليات محددة أم فتح الانضمام لكافة الصيدليات في المنطقة؟';
      suggestions = [
        'نعم، نحتاج قارئ ذكي للروشتات OCR مع تتبع GPS',
        'الانضمام متاح لكافة الصيدليات المعتمدة مع نسبة عمولة',
        'توفير محفظة دفع إلكترونية وفودافون كاش وكاش',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات الآن'
      ];
    } else {
      reply = 'عظيم جداً! متطلبات مشروع توصيل الصيدليات أصبحت واضحة تماماً: تطبيق عميل، تطبيق كابتن للملاحة بالـ GPS، بوابة ويب للصيدليات لمراجعة الروشتات، ولوحة تحكم مركزية Super Admin لحساب العمولات. نحن جاهزون لاستخراج دراسة الجدوى والـ 3 باقات فوراً!';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'ما هي مدة تسليم النسخة التجريبية الأولى (MVP)؟'
      ];
      readyForSpec = true;
    }
  } else if (allEnt.isFood) {
    if (userMsgCount <= 2 && !lastUserMsg.includes('استخراج')) {
      reply = 'منصات طلب الطعام والوجبات تحقق عائداً ممتازاً عند ضبط العمليات اللوجستية. لضمان تفوق تطبيقك:\n\n1. هل سيكون لديك أسطول كباتن خاص بالتطبيق لتوصيل الطلبات أم التوصيل عن طريق المطاعم نفسها؟\n2. هل تحتاج لوحة ويب أو تطبيق تابلت مخصص للمطابخ لتأكيد الطلبات وطباعة الفواتير فورياً؟';
      suggestions = [
        'أسطول كباتن خاص مع تتبع GPS لحظي على الخريطة',
        'تطبيق تابلت مخصص للمطابخ لاستقبال الطلبات',
        'نظام عروض وكوبونات خصم ومحفظة كاش باك',
        'جاهز لاستخراج خطة المشروع ودراسة الجدوى'
      ];
    } else {
      reply = 'ممتاز! حددنا نموذج العمل التقني بالكامل لتطبيق المطاعم والوجبات: تطبيق عميل React Native، تطبيق كابتن مع خوارزميات التوزيع الجغرافي، بوابة ويب للمطاعم، ولوحة تحكم مركزية. متطلباتك جاهزة لاستخراج وثيقة المشروع ودراسة الجدوى والـ 3 باقات.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'هل يدعم النظام الدفع بـ Apple Pay و Google Pay؟'
      ];
      readyForSpec = true;
    }
  } else if (allEnt.isRide) {
    if (userMsgCount <= 2 && !lastUserMsg.includes('استخراج')) {
      reply = 'تطبيقات النقل والمواصلات الذكية (مثل أوبر وكريم) تحتاج بنية تحتية سريعة جداً لمزامنة الموقع بالثواني (WebSockets + Redis). هل الفكرة مخصصة للسيارات الملاكي فقط أم تشمل التاكسي، السكوتر، والشحن؟';
      suggestions = [
        'سيارات ملاكي وتاكسي وسكوتر مع تسعير ديناميكي',
        'دعم الدفع كاش والمحافظ الرقمية وتقسيم الأجرة',
        'زر طوارئ SOS ومشاركة مسار الرحلة لحظياً للأمان',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات'
      ];
    } else {
      reply = 'رائع جداً! تم تثبيت معمارية التتبع والملاحة ونظام الأمان المالي لمنظومة النقل التشاركي. نحن جاهزون الآن لاستخراج الخطة المعمارية الكاملة ودراسة الجدوى والـ 3 باقات.';
      suggestions = [
        'استخراج خطة المشروع والـ 3 باقات الآن',
        'ما هي المتطلبات اللازمة لرفع التطبيق على المتاجر؟'
      ];
      readyForSpec = true;
    }
  } else if (allEnt.isEcommerce) {
    if (userMsgCount <= 2 && !lastUserMsg.includes('استخراج')) {
      reply = 'الأسواق الرقمية المتعددة (Multi-Vendor Marketplace) نموذج استثماري قوي ومربح جداً. لضمان تجربة مميزة للعملاء والتجار:\n\n1. هل ترغب في توفير لوحة خاصة بكل تاجر لإدارة منتجاته وأرباحه ومخزونه؟\n2. هل ستتعاقد مع شركات شحن عبر الـ API لتوليد بوالص الشحن آلياً؟';
      suggestions = [
        'لوحة تاجر متقدمة لإدارة المنتجات والأرباح والطلبات',
        'ربط آلي مع شركات الشحن وتوليد بوالص الشحن تلقائياً',
        'تكامل مع بوابات الدفع Paymob والدفع عند الاستلام',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات'
      ];
    } else {
      reply = 'اختيارات ممتازة! المعمارية ستعتمد على قاعدة بيانات موثوقة ومحرك دفع آمن ومزامنة للمخزون والتجار. المتطلبات مكتملة وجاهزة لتوليد خطة العمل وباقات الأسعار فوراً.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'هل يمكن ربط النظام مع برنامج الفاتورة الإلكترونية؟'
      ];
      readyForSpec = true;
    }
  } else {
    // General Project Idea Discussion
    if (userMsgCount <= 1 || !allEnt.hasRealProjectIdea) {
      reply = `أهلاً بك! في **Apex Software** نرحب بفكرتك ونحن متحمسون لتحويلها إلى منتج رقمي استثنائي في السوق.\n\nلتصميم أفضل معمارية هندسية وتحديد الميزانية بدقة: ما هي أهم الميزات والخدمات التي يقدمها تطبيقك للعميل؟ ومن هم المستخدمون المستهدفون؟`;
      suggestions = [
        'التركيز على إطلاق نسخة أولية (MVP) لاختبار السوق بأسرع وقت',
        'تطبيق موبايل موحد للآيفون والأندرويد مع لوحة تحكم سحابية',
        'إضافة بوابات دفع إلكترونية ومحفظة رقمية للمستخدمين',
        'جاهز لاستخراج خطة المشروع ودراسة الجدوى والـ 3 باقات'
      ];
      readyForSpec = false;
    } else {
      reply = 'رائع جداً! استوعبنا طبيعة الفكرة وأطراف المنظومة والحلول التقنية المناسبة لها. نحن جاهزون الآن لاستخراج وثيقة المواصفات الفنية الكاملة مع دراسة الجدوى وتفاصيل الباقات الثلاث.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'ما هي خطة الدفع والمراحل الزمنية للتسليم؟'
      ];
      readyForSpec = true;
    }
  }

  return {
    reply,
    suggestions,
    readyForSpec,
    isLiveAI: false,
    engine: 'Apex Intelligent Architectural Consultation Engine 3.0'
  };
}

// -------------------------------------------------------------
// 2.4 Main Chat Consultant Entry Point
// -------------------------------------------------------------
async function chatConsultant(messages = [], options = {}) {
  const config = getAiConfig();
  const lang = typeof options === 'string' ? options : (options?.language || 'ar');
  const userApiKey = typeof options === 'object' ? options.apiKey : null;
  const userProvider = typeof options === 'object' ? options.provider : null;

  const activeProvider = userProvider || config.provider || 'gemini';
  const geminiKey = userApiKey || config.geminiApiKey || process.env.GEMINI_API_KEY;
  const openaiKey = userApiKey || config.openaiApiKey || process.env.OPENAI_API_KEY;

  // 1. If OpenAI is requested & key available -> Call OpenAI Chat Consultant
  if (activeProvider === 'openai' && openaiKey && openaiKey.trim().length > 10) {
    try {
      return await callOpenAIChatConsultant(messages, openaiKey.trim(), lang);
    } catch (err) {
      console.warn('OpenAI chat consultant failed, falling back to Intelligent Engine:', err.message);
    }
  }

  // 2. If Gemini is requested & key available -> Call Gemini Chat Consultant
  if (activeProvider === 'gemini' && geminiKey && geminiKey.trim().length > 10) {
    try {
      return await callGeminiChatConsultant(messages, geminiKey.trim(), lang);
    } catch (err) {
      console.warn('Gemini chat consultant failed, falling back to Intelligent Engine:', err.message);
    }
  }

  // 3. Fallback to Intelligent Conversational Engine 3.0
  return deepSemanticChatConsultant(messages, lang);
}

// -------------------------------------------------------------
// 3. Deep Generative Semantic Analysis Engine (Offline / Fallback)
// -------------------------------------------------------------
function extractKeywordsAndEntities(prompt = '') {
  const p = prompt.toLowerCase();

  // Helper: Match full word or clean token (prevents 'اكلمك' from matching 'اكل')
  const matchWord = (word) => {
    try {
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${word}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
      return regex.test(p);
    } catch {
      return p.includes(word);
    }
  };

  const matchAny = (words) => words.some(w => matchWord(w));

  const entities = {
    // Conversational & Identity Intents
    isIdentity: matchAny(['اسمك', 'اسمك ايه', 'مين انت', 'انت مين', 'عرفني بنفسك', 'اقولك ايه', 'اناديلك', 'اناديك', 'من انت', 'مين معايا', 'مع مين بتكلم', 'مين بيتكلم', 'who are you', 'your name']),
    isGreeting: matchAny(['السلام عليكم', 'سلام عليكم', 'مرحبا', 'مرحباً', 'اهلا', 'أهلاً', 'صباح الخير', 'مساء الخير', 'هاي', 'hello', 'hi', 'ازيك', 'عامل ايه', 'اخبارك']),
    isGratitude: matchAny(['شكرا', 'شكراً', 'تسلم', 'الله يخليك', 'مشكور', 'تمام شكرا', 'thank you', 'thanks']),
    isComplaint: matchAny(['مش فاهم', 'مش فاهمني', 'انت مش فاهم', 'محللتش', 'غبى', 'غبي', 'ضعيف', 'نفس الكلام', 'كلام تاني', 'روبوت غبي']),
    isAgencyInquiry: matchAny(['مين ايبكس', 'مين apex', 'شركة ايه', 'خدماتكم', 'بتعملوا ايه', 'عنوانكم', 'مقركم', 'فين شركتكم', 'معلومات عنكم']),
    isPricing: matchAny(['اسعاركم', 'بكام', 'التكلفة كام', 'باقاتكم', 'طريقة الدفع', 'كم التكلفة', 'اسعار التطبيقات', 'تكلفة المشروع']),
    hasRealProjectIdea: matchAny(['فكرة', 'تطبيق', 'مشروع', 'منصة', 'موقع', 'سيستم', 'برنامج', 'عايز اعمل', 'عندي فكرة', 'نظام']),

    // Business Domains (Strict word matching to avoid substring collisions!)
    isPharmacy: matchAny(['صيدلية', 'صيدليات', 'دواء', 'أدوية', 'ادوية', 'روشتة', 'روشتات', 'علاج', 'مستلزمات طبية', 'pharmacy', 'medicine']),
    isFood: matchAny(['مطعم', 'مطاعم', 'وجبات', 'وجبة', 'طعام', 'دليفري', 'مطبخ', 'أغذية', 'أكلات', 'أكل', 'restaurant', 'food']),
    isRide: matchAny(['أوبر', 'اوبر', 'كريم', 'تاكسي', 'سائقين', 'كباتن', 'توصيل ركاب', 'مشاوير', 'سكوتر', 'ride', 'taxi']),
    isEcommerce: matchAny(['متجر', 'متاجر', 'سوق', 'متعدد التجار', 'بيع وشراء', 'منتجات', 'شوبينج', 'ecommerce', 'shop', 'store', 'marketplace']),
    isHealth: matchAny(['عيادة', 'عيادات', 'طبيب', 'أطباء', 'دكتور', 'كشف طبي', 'حجز مواعيد', 'مرضى', 'clinic', 'doctor', 'health']),
    isRealEstate: matchAny(['عقارات', 'عقار', 'شقق', 'إيجار', 'ايجار', 'سمسار', 'أراضي', 'real estate', 'property']),
    isAuction: matchAny(['مزاد', 'مزادات', 'مزايدة', 'مزايدات', 'سوم', 'auction']),
    isEdu: matchAny(['كورس', 'كورسات', 'تعليم', 'مدرس', 'أكاديمية', 'اكاديمية', 'دروس', 'course', 'learning']),
    isServices: matchAny(['صيانة', 'فني', 'سباك', 'كهربائي', 'تنظيف', 'خدمات منزلية', 'handyman']),
    
    // Feature flags
    hasDelivery: matchAny(['توصيل', 'مندوب', 'كابتن', 'شحن', 'دليفري']),
    hasMaps: matchAny(['خريطة', 'خرائط', 'gps', 'تتبع', 'موقع']),
    hasPayment: matchAny(['دفع', 'فيزا', 'كاش', 'محفظة', 'pay', 'فودافون كاش']),
    hasChat: matchAny(['شات', 'محادثة', 'رسائل', 'دردشة', 'chat']),
    hasVideo: matchAny(['فيديو', 'كاميرا', 'بث حي', 'مكالمة', 'video']),
    hasAI: matchAny(['ذكاء اصطناعي', 'ai', 'روشتات', 'تعرف على الصوت', 'ocr'])
  };

  return entities;
}

function deepSemanticAnalysis(prompt = '', language = 'ar') {
  const ent = extractKeywordsAndEntities(prompt);
  const cleanPrompt = prompt.trim();

  // Dynamic project title synthesis
  let projectName = 'منظومة المنصة الرقمية الذكية المتكاملة';
  let domainName = 'الحلول الرقمية الذكية المخصصة (Enterprise On-Demand)';
  let tagline = 'منظومة برمجية متكاملة مصممة خصيصاً لتحويل الفكرة إلى مشروع ناجح ومربح في السوق';
  let valProp = 'توفير بنية رقمية حديثة تربط أطراف المنظومة بسلاسة، مع أتمتة كاملة للعمليات وتخفيض تكاليف التشغيل.';
  let bizModel = 'عمولة متغيرة على المعاملات بنسبة 10-15%، بالإضافة لرسوم التوصيل والاشتراكات المميزة للشركاء.';
  let keyChallenges = [
    'التحدي اللوجستي والتنظيمي: ضبط أوقات الاستجابة وجودة الخدمة عبر خوارزميات التوزيع الجغرافي الذكي.',
    'التحدي الأمني والمالي: حماية المعاملات وتأكيد الدفع والتسليم عبر كود سري لمرة واحدة (OTP) والتشفير البنكي.',
    'التحدي التقني: استقرار الاتصال اللحظي في شبكات المحمول الضعيفة عبر آليات Offline Caching وإعادة المحاولة.'
  ];
  let mvpPlan = 'إطلاق المرحلة الأولى (MVP) في نطاق جغرافي محدد (مدينة أو حي) مع عدد مركز من الشركاء للتحقق من مؤشرات التشغيل قبل التوسع.';

  // Determine domain-specific customizations
  if (ent.isPharmacy) {
    projectName = 'منظومة فارما-إكسبريس الذكية (PharmaExpress On-Demand)';
    domainName = 'الرعاية الصحية وتوصيل الأدوية اللحظي (HealthTech & Medicine Logistics)';
    tagline = 'أسرع طريقة للحصول على الأدوية والروشتات من أقرب صيدلية معتمدة بضغطة زر';
    valProp = 'تمكين المريض من قراءة الروشتة فورياً بالكاميرا واقتراح البدائل المصرحة وتوصيل العلاج في أقل من 30 دقيقة.';
    bizModel = 'عمولة 8-12% من قيمة كل طلب صيدلي + رسوم التوصيل الثابتة + باقات ترويجية للصيدليات المتميزة.';
    keyChallenges = [
      'التحدي القانوني والصحي: التحقق من صحة الروشتات الطبية والأدوية المقيدة عبر بوابة مراجعة الصيدلي المعتمد.',
      'سلاسل التبريد والتخزين: توجيه الكباتن بحقائب حرارية خاصة للأنسولين والأدوية الحساسة للحرارة.',
      'توافر المخزون اللحظي: الربط مع أنظمة الصيدليات أو إرسال الطلب لعدة صيدليات قريبة متزامنة.'
    ];
    mvpPlan = 'البدء مع 10-15 صيدلية مركزية في منطقة حيوية وتعيين أسطول كباتن مخصص للتأكد من زمن التوصيل القياسي.';
  } else if (ent.isAuction) {
    projectName = 'منصة مزادك بلس للمزايدات الرقمية اللحظية (MazadPlus Live)';
    domainName = 'المزادات الرقمية والتجارة التفاعلية (Live Auctions & Bidding)';
    tagline = 'منظومة المزايدة بالثواني مع البث الحي المشفر والمحفظة المالية الآمنة';
    valProp = 'إتاحة فرصة التنافس على الصفقات والسلع بشفافية تامة وسرعة استجابة فائقة بدون تأخير زمني.';
    bizModel = 'رسوم دخول المزادات وتأمين المزايدة المسترد + عمولة 3-5% من قيمة الصفقة الرابحة.';
    keyChallenges = [
      'زمن التأخير في البث والعداد (Latency): استخدام بروتوكولات WebRTC ومقابس WebSocket ذات الأداء الفائق.',
      'ضمان جدية المزايدين: خصم مبلغ تأمين مبدئي عبر البطاقة أو المحفظة قبل السماح بدخول المزاد.',
      'التوثيق القانوني للصفقات: إصدار عقود رقمية وفواتير إلكترونية فورية بالرقم القومي.'
    ];
  } else if (ent.isFood) {
    projectName = 'منصة فود-ماستر للطلب والتوصيل السريع (FoodMaster Ecosystem)';
    domainName = 'خدمات التوصيل الذكي والمطاعم (FoodTech & On-Demand Delivery)';
    tagline = 'الربط الذكي بين المطاعم والعملاء وأسطول التوصيل بأعلى كفاءة تشغيلية';
    valProp = 'تقليل زمن تجهيز الوجبات وتوجيه الكباتن بدقة لتصل الوجبة ساخنة وبأعلى جودة.';
    bizModel = 'عمولة 15-20% من مبيعات المطاعم + رسوم التوصيل + إعلانات الوجبات المميزة.';
  } else if (ent.isRide) {
    projectName = 'منظومة رايد-جو للنقل والمواصلات الذكية (RideGo Mobility)';
    domainName = 'النقل التشاركي والمواصلات الذكية (Mobility & Ride Hailing)';
    tagline = 'رحلات آمنة، ملاحة دقيقة، وتسعير عادل وديناميكي للسائق والراكب';
    valProp = 'توفير وسيلة تنقل موثوقة في دقائق مع نظام حماية الطوارئ وتتبع المسار المباشر.';
    bizModel = 'عمولة 15-20% من إجمالي قيمة كل رحلة + رسوم ساعات الذروة (Surge Pricing).';
  } else if (ent.isEcommerce) {
    projectName = 'منصة تِجارة بلس متعددة التجار (TijaraPlus Marketplace)';
    domainName = 'الأسواق الرقمية والتجارة الإلكترونية (E-Commerce Multi-Vendor)';
    tagline = 'سوق رقمي متكامل يجمع أفضل التجار مع تجربة تسوق وشحن ودفع مرنة';
    valProp = 'تمكين التجار من فتح فروع رقمية وإدارة المخزون والشحن الآلي مع حماية مشتريات العملاء.';
    bizModel = 'عمولة 5-10% على المبيعات + اشتراكات شهرية للوحات التجار الاحترافية + رسوم بوابات الدفع.';
  } else if (ent.isHealth) {
    projectName = 'منظومة طبّيبك للرعاية الصحية والاستشارات (Tabeebak TeleHealth)';
    domainName = 'الرعاية الصحية وحجز العيادات (HealthTech & Telemedicine)';
    tagline = 'حجز المواعيد والاستشارات الطبية بالفيديو والملف الصحي الرقمي بكل خصوصية';
    valProp = 'توفير الوقت على المريض وتنظيم مواعيد العيادات والاستشارات الطبية عن بُعد بأعلى درجات الأمان.';
    bizModel = 'رسوم حجز رمزية + عمولة 10% على الاستشارات بالفيديو + اشتراكات العيادات الشهرية.';
  }

  // Synthesize customized platforms with specific screens
  const platforms = [];

  const wantsMobileExplicitly = matchAny(['موبايل', 'تطبيق', 'ابلكيشن', 'أبلكيشن', 'اندرويد', 'أندرويد', 'ايفون', 'آيفون', 'ios', 'android', 'app', 'كابتن', 'سائق', 'دليفري', 'مندوب']);
  const wantsWebExplicitly = matchAny(['موقع', 'موقع الكتروني', 'موقع إلكتروني', 'ويب', 'منصة ويب', 'صفحة هبوط', 'website', 'web', 'portal', 'dashboard', 'لوحة تحكم', 'crm', 'saas']);
  
  // If the client explicitly asked for web/website and DID NOT ask for mobile apps
  const isWebOnly = wantsWebExplicitly && !wantsMobileExplicitly && !ent.isRide && !ent.hasDelivery && !ent.isPharmacy;

  if (isWebOnly) {
    // Web Only Project Structure
    platforms.push({
      id: 'web_portal',
      name: 'منصة وموقع الويب التفاعلي (Responsive Web Application)',
      icon: 'globe-outline',
      role: 'موقع ويب متكامل متوافق مع كافة الشاشات والأجهزة بتجربة مستخدم عصرية',
      keyFeatures: [
        'واجهة تفاعلية حديثة وسريعة متوافقة مع متصفحات الموبايل وأجهزة الكمبيوتر',
        'نظام تسجيل دخول ومصادقة سحابية مشفرة',
        'محرك بحث وفلاتر ذكية للخدمات والمنتجات',
        'بوابات دفع إلكتروني محلية ودولية متكاملة',
        'تصميم متوافق مع معايير محركات البحث العالمية SEO'
      ],
      screens: [
        { name: 'الصفحة الرئيسية واستعراض الخدمات (Home Landing)', desc: 'واجهة بصرية احترافية تستعرض قيمة المشروع وأهم المزايا والخدمات' },
        { name: 'صفحة تفاصيل الخدمة / الكتالوج (Service Catalog)', desc: 'عرض تفصيلي للخيارات مع الأسعار وآلية الحجز أو الشراء' },
        { name: 'بوابة الدفع والطلب (Checkout & Booking)', desc: 'إتمام المعاملة المالية وإصدار الفواتير الفورية' },
        { name: 'حساب العميل (Client Portal)', desc: 'متابعة المعاملات السابقة وإدارة الملف الشخصي' }
      ]
    });

    platforms.push({
      id: 'admin_dashboard',
      name: 'لوحة التحكم المركزية السحابية (Super Admin Dashboard)',
      icon: 'desktop-outline',
      role: 'لوحة ويب سحابية شاملة للإشراف الكامل والتحكم المالي والتشغيلي بالمنصة',
      keyFeatures: [
        'لوحة مؤشرات أداء حية (KPIs) للإيرادات والزيارات والعمليات',
        'إدارة المحتوى، الأسعار، الخدمات، والمستخدمين بسهولة',
        'نظام الفواتير الإلكترونية وتقارير المبيعات التفصيلية',
        'صلاحيات متعددة للمشرفين والمديرين',
        'نسخ احتياطي آلي وحماية سحابية'
      ],
      screens: [
        { name: 'لوحة المؤشرات والتقارير (Analytics)', desc: 'رسوم بيانية حية لحجم العمليات والزيارات' },
        { name: 'شاشة إدارة المحتوى والخدمات (Content Management)', desc: 'تحديث النصوص والأسعار والمنتجات' },
        { name: 'شاشة المستخدمين والصلاحيات (Users & Roles)', desc: 'التحكم في وصول المشرفين' },
        { name: 'التقارير المالية والفواتير (Invoicing)', desc: 'كشوفات الحساب وتصدير ملفات Excel وPDF' }
      ]
    });
  } else {
    // Normal Mobile / Multi-platform Structure
    // Platform 1: Customer App
    platforms.push({
      id: 'client_app',
      name: 'تطبيق العميل والمستخدم (iOS & Android)',
      icon: 'phone-portrait-outline',
      role: 'تطبيق الهاتف الذكي للعملاء بتجربة مستخدم عصرية وسريعة',
      keyFeatures: [
        'تسجيل دخول سلس بالبصمة ورقم الهاتف مع التفعيل بكود OTP',
        ent.isPharmacy ? 'تصوير الروشتة وقراءتها آلياً بالكاميرا مع البحث عن بدائل الأدوية' : 'محرك بحث وفلاتر ذكية متقدمة للوصول للمطلوب في ثوانٍ',
        ent.hasMaps ? 'تحديد الموقع الجغرافي التلقائي وتتبع الطلب لحظياً على الخريطة' : 'استعراض الكتالوج مع التقييمات وصور المنتجات الحقيقية',
        'بوابات دفع إلكترونية متعددة (فيزا، فودافون كاش، إنستاباي، ودفع كاش عند الاستلام)',
        ent.hasChat ? 'دردشة فورية ومكالمة داخل التطبيق مع الطرف الآخر' : 'سجل تفصيلي للطلبات السابقة وإعادة الطلب بضغطة زر واحدة'
      ],
      screens: [
        { name: 'شاشة البداية والاكتشاف (Home)', desc: 'عرض العروض الرئيسية، الأقسام، وشريط البحث المتقدم' },
        { name: 'شاشة التفاصيل والخيارات (Details)', desc: 'مواصفات العنصر، الأسعار، الإضافات، والتقييمات' },
        { name: 'شاشة سلة الطلبات والدفع (Checkout)', desc: 'اختيار عنوان التوصيل، قسائم الخصم، وبوابة الدفع' },
        { name: 'شاشة التتبع والعمليات الحية (Live Tracking)', desc: 'خريطة تفاعلية توضح حالة الطلب والموقع اللحظي والوقت المتوقع ETA' },
        { name: 'الملف الشخصي والمحفظة (Profile & Wallet)', desc: 'رصيد المحفظة، الطلبات السابقة، والإشعارات' }
      ]
    });

    // Platform 2: Partner / Merchant / Vendor / Clinic App
    if (ent.isPharmacy || ent.isFood || ent.isEcommerce || ent.isHealth || ent.hasMultiVendor || ent.isAuction) {
      let partnerName = 'بوابة وتطبيق الشريك / التاجر (Partner App)';
      if (ent.isPharmacy) partnerName = 'بوابة وتطبيق الصيدلية (Pharmacy Portal)';
      else if (ent.isFood) partnerName = 'لوحة وتطبيق المطعم والمطبخ (Restaurant Portal)';
      else if (ent.isHealth) partnerName = 'بوابة وتطبيق الطبيب والعيادة (Doctor Portal)';

      platforms.push({
        id: 'partner_app',
        name: partnerName,
        icon: 'storefront-outline',
        role: 'لوحة تحكم وتطبيق مخصص لإدارة المنتجات، تأكيد الطلبات، ومتابعة الأرباح',
        keyFeatures: [
          'تنبيهات صوتية فورية بالطلبات والعمليات الجديدة الواردة',
          'إدارة المخزون وتحديد حالة التوفر والأسعار بنقرة زر واحدة',
          ent.isPharmacy ? 'مراجعة وتأكيد الروشتات الطبية وتحديد البدائل المصرحة' : 'لوحة تحليلات يومية لحجم المبيعات وصافي الأرباح',
          'طلب سحب الأرباح وإدارة الحسابات البنكية والمحافظ',
          'أدوات التواصل المباشر مع العميل ومندوب التوصيل'
        ],
        screens: [
          { name: 'لوحة استقبال الطلبات اللحظية (Live Orders)', desc: 'قائمة الطلبات الجديدة مع عداد تنازلي للتأكيد والتجهيز' },
          { name: 'شاشة إدارة الكتالوج والمخزون (Catalog)', desc: 'إضافة وتعديل الأصناف، الأسعار، وتفعيل التوفر' },
          { name: 'شاشة المحفظة والتسويات المالية (Finance)', desc: 'سجل العمليات، نسب العمولات، ورصيد الأرباح القابل للسحب' },
          { name: 'شاشة تقارير الأداء والتقييمات (Analytics)', desc: 'رسم بياني للمبيعات وتقييمات العملاء وملاحظات الجودة' }
        ]
      });
    }

    // Platform 3: Delivery / Driver / Courier App
    if (ent.hasDelivery || ent.isRide || ent.isPharmacy || ent.isFood) {
      platforms.push({
        id: 'delivery_app',
        name: ent.isRide ? 'تطبيق السائق والكابتن (Driver App)' : 'تطبيق مندوب التوصيل (Courier App)',
        icon: 'bicycle-outline',
        role: 'تطبيق موجه للكباتن لتنفيذ المشاوير والملاحة الذكية وحساب الأرباح',
        keyFeatures: [
          'زر تبديل الحالة (متاح لتلقي الطلبات / غير متصل / في مهمة)',
          'استقبال الطلبات القريبة بناءً على النطاق الجغرافي والمسافة الفعلية',
          'نظام ملاحة GPS ذكي مدمج بأسرع طريق لتفادي الاختناقات المرورية',
          'محفظة رقمية خاصة بالكابتن لحساب عمولات التوصيل اليومية والحوافز',
          'تأكيد استلام وتسليم الشحنة عبر رمز التحقق السري (OTP)'
        ],
        screens: [
          { name: 'شاشة الرادار وتلقي المهام (Radar)', desc: 'استعراض الطلب القريب مع المسافة وقيمة الأجرة قبل القبول' },
          { name: 'شاشة مسار الرحلة والملاحة (Navigation)', desc: 'توجيه خطوة بخطوة عبر الخريطة حتى نقطة الاستلام والتسليم' },
          { name: 'شاشة محفظة الكابتن (Earnings)', desc: 'إجمالي الأرباح اليومية، البونص، والرحلات المنفذة' },
          { name: 'شاشة الوثائق والحساب (Account & KYC)', desc: 'تجديد رخصة القيادة والسيارة ومطابقة الهوية' }
        ]
      });
    }

    // Platform 4: Super Admin Dashboard
    platforms.push({
      id: 'admin_dashboard',
      name: 'لوحة التحكم المركزية السحابية (Super Admin Dashboard)',
      icon: 'desktop-outline',
      role: 'لوحة ويب سحابية شاملة للإشراف الكامل والتحكم المالي والتشغيلي بالمنصة',
      keyFeatures: [
        'خريطة عمليات مركزية حية تظهر حركة الطلبات والكباتن والعمليات بالثانية',
        'فحص وتدقيق واعتماد وثائق الشركاء والكباتن الجدد قبل التفعيل',
        'إدارة متقدمة للعمولات والرسوم والضرائب وإصدار الفواتير الرسمية',
        'إرسال إشعارات جماعية تسويقية وتنبيهات مخصصة لجميع مستخدمي المنظومة',
        'نظام إدارة المشرفين والصلاحيات وقواعد البيانات السحابية'
      ],
      screens: [
        { name: 'لوحة القيادة والمؤشرات الحيوية (KPIs)', desc: 'إجمالي الإيرادات، الطلبات الحية، ونسب النمو اليومية والشهرية' },
        { name: 'خريطة العمليات الحية (Live Operations)', desc: 'مراقبة الكباتن والطلبات الجارية لحظياً على خريطة تفاعلية' },
        { name: 'شاشة إدارة المستخدمين والتراخيص (Users & Approvals)', desc: 'فحص الهويات والشهادات وتفعيل أو إيقاف الحسابات' },
        { name: 'شاشة التقارير المالية والعمولات (Billing & Ledger)', desc: 'حساب أرباح المنصة، تسويات التجار، وكشوفات الحساب البنكية' },
        { name: 'مركز التحكم بالإعدادات (System Settings)', desc: 'تحديد أسعار التوصيل، نطاقات التغطية، وكوبونات الخصم' }
      ]
    });
  }

  // Calculate dynamic lean pricing based on platforms and features
  const baseCostEGP = isWebOnly ? 24000 : 34000;
  const platformAddonEGP = Math.max(0, (platforms.length - 2)) * (isWebOnly ? 5000 : 7000);
  const featuresAddonEGP = (ent.hasMaps ? 4000 : 0) + (ent.hasAI ? 5000 : 0) + (ent.hasVideo ? 6000 : 0) + (ent.isAuction ? 6000 : 0);
  const totalCostEGP = baseCostEGP + platformAddonEGP + featuresAddonEGP;
  const totalCostUSD = Math.round(totalCostEGP / 47);

  const timelineWeeks = platforms.length >= 4 ? 10 : 8;

  return {
    projectName,
    domainName,
    tagline,
    summary: `منظومة تقنية متكاملة تهدف إلى تنفيذ "${cleanPrompt}" بأعلى معايير هندسة البرمجيات. توفر ${platforms.length} منصات متكاملة تربط أطراف المنظومة عبر بنية سحابية مرنة وسريعة ومؤمنة بالكامل.`,
    isLiveAI: false,
    engine: 'Apex Deep Semantic Engine 2.0 (Custom Dynamic Synthesis)',
    strategicAnalysis: {
      valueProposition: valProp,
      businessModel: bizModel,
      keyChallenges,
      mvpStrategy: mvpPlan
    },
    platforms,
    systemArchitecture: {
      architectureType: 'Modular Clean Architecture (RESTful API & Event-Driven)',
      microservices: [
        'خدمة التوثيق والمصادقة الآمنة (Auth & Identity Service)',
        'خدمة الطلبات والعمليات (Order Management Engine)',
        ent.hasMaps ? 'خدمة الخرائط والتتبع الجغرافي اللحظي (Geolocation & Tracking Cluster)' : 'خدمة إدارة البيانات والكتالوج (Catalog & Content Service)',
        'خدمة المدفوعات والمحفظة الرقمية (Payments & Ledger)',
        'محرك التنبيهات الفورية السحابية (Push Notification Broker)'
      ],
      databaseSchema: [
        {
          table: 'Users',
          description: 'جدول المستخدمين وحسابات المصادقة',
          fields: ['id', 'fullName', 'email', 'phone', 'role', 'avatarUrl', 'pushToken', 'createdAt']
        },
        {
          table: 'Orders / Transactions',
          description: 'جدول المعاملات والعمليات الأساسية',
          fields: ['id', 'userId', 'partnerId', 'courierId', 'status', 'totalAmount', 'paymentMethod', 'createdAt']
        },
        {
          table: 'Catalog / Offerings',
          description: 'جدول المنتجات والخدمات والأسعار',
          fields: ['id', 'partnerId', 'name', 'price', 'isAvailable', 'category', 'details']
        },
        {
          table: 'Wallets & Invoices',
          description: 'جدول العمليات المالية والأرباح',
          fields: ['id', 'userId', 'balance', 'pendingAmount', 'updatedAt']
        }
      ],
      realtimeEvents: [
        'order:created',
        'order:accepted',
        'location:update',
        'status:changed',
        'chat:new_message'
      ]
    },
    techStack: {
      mobile: 'React Native (Expo) - كود موحد عالي السرعة للأندرويد والآيفون مع دعم Background Location',
      web: 'Next.js 14 / React.js مع Tailwind CSS للوحة الإدارة الفائقة',
      backend: 'Node.js & Express.js مع معمارية Modular سهلة التوسع',
      realtime: 'Socket.io & Redis Pub/Sub للتتبع والمزامنة اللحظية بالثواني',
      database: 'PostgreSQL / SQLite مع Prisma ORM للسرعة والأمان العالي',
      maps: 'Google Maps Platform / Mapbox للتتبع الدقيق وحساب المسافات',
      payments: 'Paymob / Vodafone Cash / InstaPay للمدفوعات الرقمية',
      devops: 'سيرفر سحابي محمي بجدار ناري وشهادة SSL كاملة ونسخ احتياطي يومي',
      aiVision: ent.isPharmacy ? 'محرك Vision OCR الذكي لقراءة وتفسير الروشتات المكتوبة' : null
    },
    timelineWeeks,
    milestones: [
      {
        phase: 1,
        title: 'المرحلة 1: هندسة المتطلبات وتصميم الواجهات وتجربة المستخدم (UI/UX Design)',
        durationWeeks: 2,
        sprintTasks: [
          'إعداد وتدقيق Wireframes التفاعلية لكافة المنصات والشاشات',
          'تصميم نظام المكونات والألوان الموحدة Design System',
          'اعتماد النماذج التفاعلية الحية Prototype على Figma لكافة الأطراف'
        ]
      },
      {
        phase: 2,
        title: 'المرحلة 2: تطوير خوادم الباك إند وقواعد البيانات والربط اللحظي والخرائط',
        durationWeeks: timelineWeeks > 8 ? 3 : 2,
        sprintTasks: [
          'بناء RESTful APIs ونظام التوثيق والمصادقة المشفر JWT',
          'هندسة قواعد البيانات وربط الـ Sockets للمزامنة اللحظية',
          'تجهيز بوابات الدفع الإلكتروني والخرائط الرقمية'
        ]
      },
      {
        phase: 3,
        title: 'المرحلة 3: بناء وتطوير تطبيقات الموبايل ولوحة التحكم المركزية',
        durationWeeks: timelineWeeks > 8 ? 3 : 2,
        sprintTasks: [
          'برمجة شاشات التطبيقات لكافة أطراف المنظومة',
          'ربط التطبيقات مع الـ APIs واختبار مسار العمليات الكامل End-to-End',
          'إتمام لوحة تحكم المشرفين والتقارير المالية'
        ]
      },
      {
        phase: 4,
        title: 'المرحلة 4: الاختبارات الشاملة (QA) والإطلاق الرسمي في Google Play & App Store',
        durationWeeks: 2,
        sprintTasks: [
          'فحص الأمان ومقاومة الضغط والتأكد من الأداء السلس',
          'تجهيز حسابات المطورين ورفع التطبيقات للمتاجر الرسمية',
          'تسليم الكود المصدري وتدريب فريق العمل على إدارة المنصة'
        ]
      }
    ],
    budgetBreakdown: {
      currencyEGP: totalCostEGP,
      currencyUSD: totalCostUSD,
      items: [
        { category: 'تصميم تجربة وواجهات المستخدم (UI/UX Design)', costEGP: Math.round(totalCostEGP * 0.22), costUSD: Math.round(totalCostUSD * 0.22), desc: 'تصميم تفاعلي كامل لكافة شاشات المنصات على Figma' },
        { category: 'تطوير الباك إند وقواعد البيانات والـ APIs', costEGP: Math.round(totalCostEGP * 0.33), costUSD: Math.round(totalCostUSD * 0.33), desc: 'الخوادم، المقابس اللحظية، محرك الخرائط، وبوابات الدفع' },
        { category: 'برمجة وتطوير تطبيقات الموبايل الموحدة', costEGP: Math.round(totalCostEGP * 0.30), costUSD: Math.round(totalCostUSD * 0.30), desc: 'تطبيقات أندرويد وآيفون بأحدث تقنيات React Native' },
        { category: 'لوحة التحكم السحابية المركزية (Super Admin)', costEGP: Math.round(totalCostEGP * 0.15), costUSD: Math.round(totalCostUSD * 0.15), desc: 'لوحة ويب سحابية شاملة للتحكم في العمليات والتقارير المالية' }
      ],
      annualOperationalEstimate: isWebOnly ? {
        hosting: 'استضافة سحابية VPS وسيرفر: تبدأ من $10 - $20 شهرياً (تدفع لمزود السحابة وفق الاستهلاك الفعلي)',
        domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
        paymentGateways: 'بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك، اقتطاع 2.5% فقط عند العمليات الناجحة'
      } : {
        appleDeveloper: 'حساب مطور Apple App Store: $99 سنوياً (يدفع لشركة Apple مباشرة لرفع وتحديث تطبيق iOS في متجر التطبيقات)',
        googlePlay: 'حساب مطور Google Play Console: $25 تدفع لمرة واحدة مدى الحياة (لشركة Google لنشر تطبيقات أندرويد)',
        hosting: 'استضافة سحابية VPS وسيرفر: تبدأ من $10 - $20 شهرياً (تدفع لمزود السحابة وفق الاستهلاك الفعلي)',
        domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
        mapsApi: 'خرائط جوجل وتحديد المواقع: رصيد مجاني شهري $200 من Google Cloud يغطي آلاف العمليات مجاناً',
        paymentGateways: 'بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك، اقتطاع 2.5% فقط عند العمليات الناجحة'
      }
    },
    paymentPlan: [
      { milestone: 'الدفعة الأولى (40%)', desc: 'عند توقيع العقد والبدء في التصميم وهندسة واجهات وتجربة المستخدم' },
      { milestone: 'الدفعة الثانية (30%)', desc: 'عند تسليم النسخة التجريبية الحية (Staging Preview) واكتمال الخوادم' },
      { milestone: 'الدفعة النهائية (30%)', desc: 'عند الاعتماد النهائي، تسليم الكود المصدري ورفع التطبيقات للمتاجر الرسمية' }
    ],
    feasibilityScore: ent.isPharmacy ? 92 : ent.isFood ? 86 : ent.isRide ? 84 : ent.isAuction ? 89 : ent.isEcommerce ? 88 : 87,
    feasibilityAnalysis: 'تحليل الجدوى السوقية والتقنية: فكرة المشروع تتميز بطلب حقيقي ومرتفع في السوق المستهدف. التحدي الأساسي يكمن في سرعة الاستجابة وتجربة المستخدم الموحدة، وهو ما تعالجه معمارية Apex من خلال تقنيات التزامن اللحظي وتقليل التكلفة التشغيلية بنسبة 40% مقارنة بالحلول التقليدية.',
    competitors: ent.isPharmacy ? [
      { name: 'فيزيتا (Vezeeta)', marketShareOrType: 'تطبيق رعاية وصيدليات إقليمي', ourEdge: 'محرك OCR فوري للروشتات وقراءة خط الطبيب وتوجيه جغرافي لأقرب صيدلية' },
      { name: 'شفاء (Chefaa)', marketShareOrType: 'منصة أدوية واشتراكات شهرية', ourEdge: 'توصيل فوري بالدقيقة وعمولة أقل للصيدليات بدون وسيط معقد' }
    ] : ent.isFood ? [
      { name: 'طلبات (Talabat)', marketShareOrType: 'منصة كبرى مهيمنة على السوق', ourEdge: 'عمولة منخفضة للمطاعم 8-10% بدلاً من 25-30% وتطبيق شريك متقدم' },
      { name: 'المنيوز (elmenus)', marketShareOrType: 'تطبيق اكتشاف وطلب الطعام', ourEdge: 'تتبع GPS دقيق للكابتن ومحفظة استرداد نقدي (Cashback) حية' }
    ] : ent.isRide ? [
      { name: 'أوبر وكريم (Uber / Careem)', marketShareOrType: 'شركات نقل دولية رائدة', ourEdge: 'تسعير عادل بدون عمولات جائرة على السائق + دعم وسائط دفع محلية' },
      { name: 'ديدي وإن درايف (DiDi / inDrive)', marketShareOrType: 'تطبيقات تفاوض وسفر', ourEdge: 'حماية وأمان أعلى مع ميزات الطوارئ ومشاركة مسار الرحلة لحظياً' }
    ] : [
      { name: 'شركات وحلول تقليدية', marketShareOrType: 'تطبيقات قوالب جاهزة غير مخصصة', ourEdge: 'تطبيقات جوال سريعة React Native مخصصة مع ملكية كاملة للكود' },
      { name: 'منصات ومواقع عامة', marketShareOrType: 'أنظمة بطيئة تعتمد على اشتراكات', ourEdge: 'معمارية سحابية مستقلة قابلة للتوسع بدون قيود أو اشتراكات شهرية' }
    ],
    packages: {
      mvp: {
        title: 'باقة إطلاق النموذج الأولي (MVP - الأقل تكلفة)',
        costEGP: Math.round(totalCostEGP * 0.48),
        costUSD: Math.round(totalCostUSD * 0.48),
        weeks: Math.max(3, Math.round(timelineWeeks * 0.5)),
        desc: 'النسخة الأساسية الرشيقة للتحقق السريع من السوق واختبار الإقبال بأقل تكلفة ومخاطرة مالية',
        keyDeliverables: [
          'تطبيق موبايل موحد للعملاء (Android & iOS)',
          'لوحة إدارة مصغرة لمتابعة العمليات',
          'خادم سحابي وبنية بيانات أساسية مع نظام المصادقة',
          'بوابة دفع إلكتروني محلية واحدة'
        ]
      },
      pro: {
        title: 'باقة المنظومة المتكاملة (Pro Growth - الموصى بها)',
        costEGP: totalCostEGP,
        costUSD: totalCostUSD,
        weeks: timelineWeeks,
        desc: 'المنظومة الاحترافية المتكاملة مع كافة تطبيقات الأطراف والتتبع اللحظي والإشعارات المتقدمة',
        keyDeliverables: [
          'تطبيقات العملاء والشركاء مع التتبع المباشر',
          'لوحة تحكم إدارية مركزية متطورة مع تقارير وإحصائيات حية',
          'خرائط وتتبع لحظي GPS فائق الدقة ومحفظة رقمية',
          'بوابات دفع متعددة (Paymob, فودافون كاش, بطاقات بنكية)',
          'دعم فني وصيانة مجانية لمدة 6 أشهر مع ضمان استقرار الخوادم'
        ]
      },
      enterprise: {
        title: 'باقة المؤسسات والأنظمة الكبرى (Enterprise Scale)',
        costEGP: Math.round(totalCostEGP * 1.7),
        costUSD: Math.round(totalCostUSD * 1.7),
        weeks: Math.round(timelineWeeks * 1.4),
        desc: 'حلول برمجية ضخمة بمواصفات مخصصة، معمارية Microservices، خوادم مخصصة وميزات ذكاء اصطناعي',
        keyDeliverables: [
          'كافة تطبيقات ومنصات المنظومة (عميل، كابتن، شركاء، لوحة سوبر أدمن)',
          'معمارية سحابية Microservices عالية التحمل ومصممة لملايين المستخدمين',
          'أنظمة ذكاء اصطناعي وأتمتة مخصصة وفق نشاط المشروع',
          'تكامل شامل مع بوابات دفع دولية ومحلية وفواتير إلكترونية',
          'دعم فني 24/7 مع اتفاقية مستوى خدمة رسمية SLA'
        ]
      }
    }
  };
}

// -------------------------------------------------------------
// 4. Main Analyzer Function (Tries Live LLM first, then Deep Semantic)
// -------------------------------------------------------------
async function analyzeProjectPrompt(promptOrMessages = '', options = {}) {
  let prompt = '';
  if (Array.isArray(promptOrMessages)) {
    prompt = promptOrMessages.map(m => `${m.role === 'user' ? 'العميل' : 'المستشار'}: ${m.text || m.content || ''}`).join('\n');
  } else if (typeof promptOrMessages === 'object' && promptOrMessages !== null) {
    if (Array.isArray(promptOrMessages.messages)) {
      prompt = promptOrMessages.messages.map(m => `${m.role === 'user' ? 'العميل' : 'المستشار'}: ${m.text || m.content || ''}`).join('\n');
    } else {
      prompt = promptOrMessages.prompt || '';
    }
  } else {
    prompt = String(promptOrMessages || '');
  }

  const config = getAiConfig();
  const lang = typeof options === 'string' ? options : (options?.language || 'ar');
  const userApiKey = typeof options === 'object' ? options.apiKey : null;
  const userProvider = typeof options === 'object' ? options.provider : null;

  const activeProvider = userProvider || config.provider || 'gemini';
  const geminiKey = userApiKey || config.geminiApiKey || process.env.GEMINI_API_KEY;
  const openaiKey = userApiKey || config.openaiApiKey || process.env.OPENAI_API_KEY;

  // 1. If Gemini is requested & key available -> Call Gemini 1.5/3.6 Flash
  if (activeProvider === 'gemini' && geminiKey && geminiKey.trim().length > 10) {
    try {
      return await callGeminiAI(prompt, geminiKey.trim(), lang);
    } catch (err) {
      console.warn('Gemini AI call failed, falling back to Deep Semantic Engine:', err.message);
    }
  }

  // 2. If OpenAI is requested & key available -> Call OpenAI
  if (activeProvider === 'openai' && openaiKey && openaiKey.trim().length > 10) {
    try {
      return await callOpenAI(prompt, openaiKey.trim(), lang);
    } catch (err) {
      console.warn('OpenAI call failed, falling back to Deep Semantic Engine:', err.message);
    }
  }

  // 3. Fallback to Deep Generative Semantic Analysis Engine 2.0
  return deepSemanticAnalysis(prompt, lang);
}

// -------------------------------------------------------------
// 5. Audio Transcription (Gemini 3.5 Transcribe / Gemini Flash)
// -------------------------------------------------------------
async function transcribeAudio(audioBufferOrBase64, mimeType = 'audio/m4a', language = 'ar') {
  const config = getAiConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: language === 'ar' ? 'مفتاح الذكاء الاصطناعي غير متوفر للتحويل الصوتي' : 'AI API key not configured for transcription'
    };
  }

  try {
    let base64Data = '';
    if (Buffer.isBuffer(audioBufferOrBase64)) {
      base64Data = audioBufferOrBase64.toString('base64');
    } else if (typeof audioBufferOrBase64 === 'string') {
      base64Data = audioBufferOrBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '').trim();
    }

    if (!base64Data) {
      return {
        success: false,
        message: language === 'ar' ? 'لم يتم استلام بيانات صوتية صالحة' : 'No valid audio data received'
      };
    }

    const cleanMime = (mimeType || 'audio/m4a').split(';')[0].trim();
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest'
    ];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Transcribe this audio file with extreme accuracy.
If the speech is in Arabic (Egyptian dialect, Gulf, or Modern Standard Arabic), transcribe in accurate Arabic text.
If the speech is in English, transcribe in English.
IMPORTANT: Return ONLY the exact transcribed spoken words. Do not add any introductory or concluding remarks, explanations, quotes, or markdown.`
                  },
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
          continue;
        }

        const data = await response.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0];
        const text = candidate?.audioTranscription?.text || candidate?.text;
        
        if (text && text.trim()) {
          return {
            success: true,
            text: text.trim(),
            model
          };
        }
      } catch (err) {
        lastError = err;
        console.warn(`Transcription attempt with ${model} failed:`, err.message);
      }
    }

    throw lastError || new Error('All transcription models failed');
  } catch (err) {
    console.error('Audio transcription error:', err);
    return {
      success: false,
      message: language === 'ar' ? 'تعذر تحويل الصوت إلى نص، يرجى المحاولة ثانية.' : 'Could not transcribe audio: ' + err.message
    };
  }
}

module.exports = {
  getAiConfig,
  saveAiConfig,
  callGeminiAI,
  callOpenAI,
  callGeminiChatConsultant,
  callOpenAIChatConsultant,
  deepSemanticChatConsultant,
  chatConsultant,
  deepSemanticAnalysis,
  analyzeProjectPrompt,
  transcribeAudio
};
