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

// -------------------------------------------------------------
// 1. Google Gemini Flash API Caller (Gemini 3.6 / 3.5 / Flash-latest)
// -------------------------------------------------------------
async function callGeminiAI(prompt, apiKey, language = 'ar') {
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  const systemPrompt = `You are an elite Principal Software Architect, Senior Technical Consultant, and CTO at Apex Software Agency.
Your mission is to perform an EXTREMELY DETAILED, SPECIFIC, HIGHLY TAILORED architectural, technical, operational, and financial analysis of the user's software concept.
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
  "timelineWeeks": 10,
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
      "durationWeeks": 3,
      "sprintTasks": [
        "بناء الـ RESTful APIs ونظام التوثيق والمصادقة المشفر JWT",
        "هندسة قواعد البيانات وعلاقات الجداول وخدمات التتبع",
        "دمج بوابات الدفع الإلكتروني ونظام المقابس اللحظية Socket.io"
      ]
    },
    {
      "phase": 3,
      "title": "المرحلة 3: تطوير وتكامل تطبيقات الموبايل ولوحة التحكم المركزية",
      "durationWeeks": 3,
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
    "currencyEGP": 68000,
    "currencyUSD": 1450,
    "items": [
      { "category": "تصميم تجربة وواجهات المستخدم (UI/UX Design)", "costEGP": 15000, "costUSD": 320, "desc": "تصميم تفاعلي كامل لكافة المنصات والشاشات على Figma" },
      { "category": "تطوير الباك إند وقواعد البيانات والـ APIs", "costEGP": 23000, "costUSD": 490, "desc": "الخوادم، المقابس اللحظية، محرك الخرائط، وبوابات الدفع" },
      { "category": "برمجة وتطوير تطبيقات الموبايل الموحدة", "costEGP": 20000, "costUSD": 430, "desc": "تطبيقات أندرويد وآيفون بأحدث تقنيات React Native" },
      { "category": "لوحة التحكم السحابية المركزية (Super Admin)", "costEGP": 10000, "costUSD": 210, "desc": "لوحة ويب سحابية شاملة للتحكم في العمليات والتقارير المالية" }
    ],
    "annualOperationalEstimate": {
      "hosting": "استضافة سحابية VPS عالية الأداء: تبدأ من $15 - $25 شهرياً",
      "mapsApi": "خرائط جوجل: رصيد مجاني شهري $200 من Google Cloud يكفي للبداية",
      "domainSsl": "اسم النطاق وشهادة التشفير SSL: مجاناً للسنة الأولى مع الاستضافة"
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
      "title": "باقة إطلاق النموذج الأولي (MVP)",
      "costEGP": 34000,
      "costUSD": 750,
      "weeks": 5,
      "desc": "النسخة الأساسية للتحقق السريع من السوق واختبار الإقبال بأقل تكلفة ومخاطرة",
      "keyDeliverables": [
        "تطبيق موبايل مخصص (Android & iOS)",
        "لوحة إدارة مصغرة للمشرفين",
        "خادم سحابي وبنية بيانات أساسية",
        "بوابة دفع إلكتروني واحدة أساسية"
      ]
    },
    "pro": {
      "title": "باقة المنظومة المتكاملة (Pro Growth - الموصى بها)",
      "costEGP": 68000,
      "costUSD": 1450,
      "weeks": 10,
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
      "costEGP": 115000,
      "costUSD": 2450,
      "weeks": 14,
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
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n[فكرة العميل لتحليلها بدقة وبشكل مخصص وعميق جداً]:\n"${prompt}"` }]
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
        // If 404 model not found, continue to next model in the list
        if (response.status === 404) {
          console.warn(`Model ${model} returned 404, trying next...`);
          lastError = new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
          continue;
        }
        throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find(p => p.text && !p.thought) || parts[parts.length - 1];
      let text = textPart?.text;
      if (!text) throw new Error(`No content returned from Gemini API (${model})`);

      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(text);
      parsed.isLiveAI = true;
      parsed.engine = `Google Gemini Live LLM (${model})`;
      return parsed;
    } catch (err) {
      lastError = err;
      if (!err.message?.includes('404')) {
        throw err;
      }
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
// 2.1 Google Gemini Interactive Chat Consultant
// -------------------------------------------------------------
async function callGeminiChatConsultant(messages, apiKey, language = 'ar') {
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  const systemInstruction = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Apex Software Agency (شركة إيبكس لحلول البرمجيات وتطوير التطبيقات).
You are having an interactive live consultation discussion with a client exploring a new software, mobile app, or SaaS idea.
Your mission:
1. Speak with the authority, clarity, empathy, and deep technical knowledge of a world-class software architect.
2. If this is the start of the chat, warmly welcome the client, acknowledge their specific idea, highlight what makes it interesting, and ask 1 to 2 sharp clarifying questions about their business model, target audience, or essential workflows (such as real-time tracking, multi-vendor payout, payment gateways, offline mode).
3. If the user provides details, provide tailored architectural advice and either ask the next clarifying question or validate that the specifications are ready.
4. Output 2 to 4 quick-reply suggestion chips ("suggestions") in Arabic that the user can tap immediately to answer or guide the conversation.
5. Set "readyForSpec" to true if the client has shared enough fundamental requirements (or after 2+ turns of discussion) to generate the full formal contract blueprint, architecture, and 3 investment packages. Otherwise set to false.

Language: ${language === 'ar' ? 'Professional Modern Arabic (العربية الفصحى التقنية الراقية والودودة)' : 'English'}.
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

  // Map messages to Gemini format (roles must be 'user' or 'model')
  const contents = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
    let text = msg.text || msg.content || '';
    if (i === 0 && role === 'user') {
      text = `${systemInstruction}\n\n[رسالة العميل]:\n${text}`;
    }
    contents.push({
      role,
      parts: [{ text: text || 'مرحباً' }]
    });
  }

  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\n[بدء الجلسة الاستشارية]` }]
    });
  }

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        if (response.status === 404) {
          lastError = new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
          continue;
        }
        throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find(p => p.text && !p.thought) || parts[parts.length - 1];
      let text = textPart?.text;
      if (!text) throw new Error(`No content returned from Gemini API (${model})`);

      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply || 'أهلاً بك! أنا مستشارك البرمجي الذكي في Apex Software. كيف يمكنني مساعدتك في تطوير فكرتك اليوم؟',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        readyForSpec: !!parsed.readyForSpec,
        isLiveAI: true,
        engine: `Google Gemini Live LLM (${model})`
      };
    } catch (err) {
      lastError = err;
      if (!err.message?.includes('404')) {
        throw err;
      }
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
function deepSemanticChatConsultant(messages = [], language = 'ar') {
  const allUserText = messages
    .filter(m => m.role === 'user')
    .map(m => m.text || m.content || '')
    .join(' ');
  const lastUserMsg = (messages.filter(m => m.role === 'user').pop()?.text || '').trim();
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const ent = extractKeywordsAndEntities(allUserText || lastUserMsg);

  let reply = '';
  let suggestions = [];
  const readyForSpec = userMsgCount >= 2;

  if (ent.isPharmacy) {
    if (userMsgCount <= 1) {
      reply = 'أهلاً بك! فكرة تطبيق توصيل الأدوية من الصيدليات فكرة واعدة جداً وتلبي حاجة ماسة وسريعة. لبناء المعمارية الصحيحة، نوصي بربط أقرب صيدلية بالعميل مع كاميرا ذكية لقراءة الروشتات (OCR). هل تخطط للتعاقد مع سلاسل صيدليات محددة أم فتح الانضمام لكافة الصيدليات؟ وما هي طريقة التسعير المقترحة للتوصيل؟';
      suggestions = [
        'الانضمام متاح لكافة الصيدليات المعتمدة مع نسبة عمولة 10%',
        'التوصيل عبر كباتن مخصصين بحقائب حرارية لحفظ الأدوية',
        'توفير محفظة دفع إلكترونية وفودافون كاش وكاش عند الاستلام',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات الآن'
      ];
    } else {
      reply = 'عظيم جداً! هذه التفاصيل واضحة ودقيقة. في Apex سنبني لك تطبيق عميل فائق السلاسة، تطبيق كابتن للملاحة بالـ GPS، وتطبيق ويب للصيدليات لمراجعة الروشتات، مع لوحة تحكم Super Admin مركزية لحساب العمولات. أصبحت كافة متطلبات المشروع مكتملة ويمكننا توليد المواصفات المعمارية ودراسة الجدوى والـ 3 باقات فوراً!';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'هل يمكن إضافة ميزة تذكير بمواعيد الدواء للمرضى؟',
        'ما هي مدة تسليم النسخة التجريبية الأولى (MVP)؟'
      ];
    }
  } else if (ent.isFood) {
    if (userMsgCount <= 1) {
      reply = 'مرحباً بك! منصات طلب الطعام والوجبات تحقق نمواً مستمراً. لتحقيق ميزة تنافسية أمام التطبيقات الحالية، ننصح بتخفيض عمولة المطاعم (8-12%) مع نظام تتبع مباشر فائق الدقة للكابتن وتطبيق تابلت للمطابخ. هل سيكون لديك أسطول توصيل خاص أم التوصيل من خلال المطاعم نفسها؟';
      suggestions = [
        'أسطول كباتن خاص مع تتبع GPS لحظي على الخريطة',
        'تطبيق تابلت مخصص للمطابخ لاستقبال الطلبات وطباعة الفواتير',
        'نظام عروض وكوبونات خصم ومحفظة استرداد نقدي (Cashback)',
        'جاهز لاستخراج خطة المشروع ودراسة الجدوى'
      ];
    } else {
      reply = 'ممتاز! حددنا نموذج العمل التقني بالكامل. النظام سيتضمن تطبيق عميل React Native، تطبيق كابتن مع خوارزميات التوزيع الجغرافي الذكي، وبوابة ويب للمطاعم. متطلباتك جاهزة تماماً لاستخراج وثيقة المشروع ودراسة الجدوى والـ 3 باقات.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'هل يدعم النظام الدفع بـ Apple Pay و Google Pay؟',
        'ما هي تكلفة باقة النمو المتكاملة (Pro)؟'
      ];
    }
  } else if (ent.isRide) {
    if (userMsgCount <= 1) {
      reply = 'أهلاً بك! تطبيقات النقل الذكي ورحلات السيارات تتطلب بنية تحتية فائقة السرعة تتحمل تحديثات الموقع بالثواني (WebSockets + Redis). هل الفكرة مخصصة للسيارات الملاكي فقط أم تشمل التاكسي، السكوتر، والشحن بين المحافظات؟';
      suggestions = [
        'سيارات ملاكي وتاكسي وسكوتر مع تسعير ديناميكي',
        'دعم الدفع كاش والمحافظ الرقمية وتقسيم الأجرة',
        'زر طوارئ SOS ومشاركة مسار الرحلة لحظياً للأمان',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات'
      ];
    } else {
      reply = 'رائع جداً! تم تثبيت معمارية التتبع والملاحة ونظام الأمان المالي. نحن جاهزون الآن لاستخراج الخطة المعمارية الكاملة ودراسة الجدوى والـ 3 باقات.';
      suggestions = [
        'استخراج خطة المشروع والـ 3 باقات الآن',
        'ما هي المتطلبات اللازمة لرفع التطبيق على Google Play و App Store؟'
      ];
    }
  } else if (ent.isEcommerce) {
    if (userMsgCount <= 1) {
      reply = 'مرحباً بك! الأسواق الرقمية المتعددة (Multi-Vendor Marketplace) من أنجح النماذج الاستثمارية. لضمان تجربة مميزة، نحتاج لتحديد آلية شحن المنتجات: هل ستتعاقد مع شركات شحن سريعة عبر API، وهل ترغب في لوحة مخصصة لكل تاجر لمتابعة أرباحه ومخزونه؟';
      suggestions = [
        'لوحة تاجر متقدمة لإدارة المنتجات والأرباح والطلبات',
        'ربط آلي مع شركات الشحن وتوليد بوالص الشحن تلقائياً',
        'تكامل مع بوابات الدفع Paymob والدفع عند الاستلام',
        'جاهز لاستخراج خطة المشروع والـ 3 باقات'
      ];
    } else {
      reply = 'اختيارات ممتازة! المعمارية ستعتمد على قاعدة بيانات موثوقة ومحرك دفع آمن ومزامنة للمخزون. المتطلبات واضحة ومكتملة لاستخراج خطة العمل وباقات الأسعار.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'هل يمكن ربط النظام مع برنامج الفاتورة الإلكترونية؟'
      ];
    }
  } else {
    if (userMsgCount <= 1) {
      reply = 'أهلاً بك! في Apex Software نرحب بفكرتك ونحن متحمسون لتحويلها إلى منتج رقمي استثنائي في السوق. لتصميم أفضل معمارية هندسية وتحديد الميزانية الدقيقة، من هم المستخدمون الرئيسيون للتطبيق؟ وما هي أهم ميزة رقمية تجعل العميل يفضل تطبيقك؟';
      suggestions = [
        'التركيز على إطلاق نسخة أولية (MVP) لاختبار السوق بأسرع وقت',
        'تطبيق موبايل موحد للآيفون والأندرويد مع لوحة تحكم سحابية',
        'إضافة بوابات دفع إلكترونية ومحفظة رقمية للمستخدمين',
        'جاهز لاستخراج خطة المشروع ودراسة الجدوى والـ 3 باقات'
      ];
    } else {
      reply = 'رائع جداً! استوعبنا طبيعة الفكرة وأطراف المنظومة والحلول التقنية المناسبة لها. نحن جاهزون الآن لاستخراج وثيقة المواصفات الفنية الكاملة مع دراسة الجدوى وتفاصيل الباقات الثلاث.';
      suggestions = [
        'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات الآن',
        'ما هي خطة الدفع والمراحل الزمنية للتسليم؟'
      ];
    }
  }

  return {
    reply,
    suggestions,
    readyForSpec,
    isLiveAI: false,
    engine: 'Apex Deep Semantic Consultation Engine 2.0'
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

  // 1. If Gemini is requested & key available -> Call Gemini Chat Consultant
  if (activeProvider === 'gemini' && geminiKey && geminiKey.trim().length > 10) {
    try {
      return await callGeminiChatConsultant(messages, geminiKey.trim(), lang);
    } catch (err) {
      console.warn('Gemini chat consultant failed, falling back to Deep Semantic:', err.message);
    }
  }

  // 2. If OpenAI is requested & key available -> Call OpenAI Chat Consultant
  if (activeProvider === 'openai' && openaiKey && openaiKey.trim().length > 10) {
    try {
      return await callOpenAIChatConsultant(messages, openaiKey.trim(), lang);
    } catch (err) {
      console.warn('OpenAI chat consultant failed, falling back to Deep Semantic:', err.message);
    }
  }

  // 3. Fallback to Deep Generative Semantic Chat Consultant
  return deepSemanticChatConsultant(messages, lang);
}

// -------------------------------------------------------------
// 3. Deep Generative Semantic Analysis Engine (Offline / Fallback)
// -------------------------------------------------------------
function extractKeywordsAndEntities(prompt = '') {
  const p = prompt.toLowerCase();

  const entities = {
    isPharmacy: p.includes('صيدل') || p.includes('دواء') || p.includes('ادوي') || p.includes('روشت') || p.includes('علاج') || p.includes('pharmacy') || p.includes('medicine'),
    isFood: p.includes('أكل') || p.includes('اكل') || p.includes('طعام') || p.includes('مطعم') || p.includes('مطاعم') || p.includes('وجب') || p.includes('food') || p.includes('restaurant'),
    isRide: p.includes('اوبر') || p.includes('أوبر') || p.includes('كريم') || p.includes('تاكسي') || p.includes('سائق') || p.includes('مشوار') || p.includes('رحلات') || p.includes('توصيل ركاب') || p.includes('ride') || p.includes('taxi'),
    isEcommerce: p.includes('متجر') || p.includes('سوق') || p.includes('منتج') || p.includes('بيع') || p.includes('شراء') || p.includes('تجار') || p.includes('ecommerce') || p.includes('shop') || p.includes('store') || p.includes('marketplace'),
    isHealth: p.includes('عياد') || p.includes('طبيب') || p.includes('دكتور') || p.includes('كشف') || p.includes('حجز طبي') || p.includes('مرضى') || p.includes('clinic') || p.includes('doctor') || p.includes('health'),
    isRealEstate: p.includes('عقار') || p.includes('شقق') || p.includes('ايجار') || p.includes('إيجار') || p.includes('سمسار') || p.includes('ارض') || p.includes('real estate') || p.includes('property'),
    isAuction: p.includes('مزاد') || p.includes('مزايد') || p.includes('سوم') || p.includes('auction'),
    isEdu: p.includes('كورس') || p.includes('تعليم') || p.includes('مدرس') || p.includes('اكاديمي') || p.includes('دروس') || p.includes('course') || p.includes('learning'),
    isServices: p.includes('صيان') || p.includes('فني') || p.includes('سباك') || p.includes('كهربا') || p.includes('تنظيف') || p.includes('خدمات منزل') || p.includes('handyman'),
    
    // Feature flags
    hasDelivery: p.includes('توصيل') || p.includes('مندوب') || p.includes('كابتن') || p.includes('شحن') || p.includes('دليفري'),
    hasMaps: p.includes('خريط') || p.includes('خرائط') || p.includes('gps') || p.includes('تتبع') || p.includes('موقع'),
    hasPayment: p.includes('دفع') || p.includes('فيزا') || p.includes('كاش') || p.includes('محفظ') || p.includes('pay') || p.includes('فودافون'),
    hasChat: p.includes('شات') || p.includes('محادث') || p.includes('رسائل') || p.includes('دردش') || p.includes('chat'),
    hasVideo: p.includes('فيديو') || p.includes('كاميرا') || p.includes('بث') || p.includes('مكالم') || p.includes('video'),
    hasAI: p.includes('ذكاء') || p.includes('ai') || p.includes('روشت') || p.includes('تعرف') || p.includes('ocr')
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

  // Calculate dynamic pricing based on platforms and features
  const baseCostEGP = 42000;
  const platformAddonEGP = (platforms.length - 2) * 11000;
  const featuresAddonEGP = (ent.hasMaps ? 5000 : 0) + (ent.hasAI ? 6000 : 0) + (ent.hasVideo ? 8000 : 0) + (ent.isAuction ? 8000 : 0);
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
      annualOperationalEstimate: {
        hosting: 'استضافة سحابية VPS عالية الأداء: تبدأ من $15 - $25 شهرياً',
        mapsApi: 'خرائط جوجل: رصيد مجاني شهري $200 من Google Cloud يكفي للبداية',
        domainSsl: 'اسم النطاق وشهادة التشفير SSL: مجاناً للسنة الأولى مع الاستضافة'
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
        title: 'باقة إطلاق النموذج الأولي (MVP)',
        costEGP: Math.round(totalCostEGP * 0.55),
        costUSD: Math.round(totalCostUSD * 0.55),
        weeks: Math.max(4, Math.round(timelineWeeks * 0.6)),
        desc: 'النسخة الأساسية للتحقق السريع من السوق واختبار الإقبال بأقل تكلفة ومخاطرة',
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
  analyzeProjectPrompt
};
