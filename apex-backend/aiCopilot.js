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
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.7-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  const systemPrompt = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Magixa Software Agency (شركة ماجيكسا لهندسة البرمجيات وتصميم التجارب الرقمية - magixa.tech).
Your mission is to perform an EXTREMELY DETAILED, SPECIFIC, HIGHLY TAILORED architectural, technical, operational, and financial analysis of the user's software concept.

CRITICAL ARCHITECTURAL & PRICING RULES (DYNAMIC COMPLEXITY CLASSIFICATION):
You MUST dynamically classify the user's project into one of 4 realistic market tiers based on scope and platforms requested:

TIER 1: Simple Web / Landing Page / Static Portfolio (صفحات الهبوط والبورتفوليو والمواقع البسيطة):
- Trigger: Personal portfolios, simple landing pages, single-page business presence without complex databases.
- Realistic Pricing: 3,500 - 8,000 EGP ($75 - $170).
  * MVP package: 3,500 - 5,000 EGP ($75 - $110), duration: 3 to 5 business days.
  * Pro package: 6,000 - 8,000 EGP ($130 - $170), duration: 5 to 7 business days.
  * Enterprise package: 10,000 - 14,000 EGP ($210 - $300), duration: 10 to 14 business days.
- Realistic Timeline: 3 to 7 business days (1 week).
- Platforms: ONLY 1 platform (Responsive Web Landing/Portfolio). NEVER include mobile apps!
- Annual Operational Estimate:
  * "hosting": "استضافة سحابية مجانية وسريعة (Vercel / Cloudflare): 0 جنيه شهرياً تكفي لآلاف الزوار مجاناً",
  * "domainSsl": "اسم النطاق الدولي (.com/.net) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً (600 - 750 جنيه سنوياً)",
  * STRICTLY EXCLUDE "appleDeveloper" ($99), "googlePlay" ($25), and "mapsApi" because there are NO mobile apps or maps!

TIER 2: Corporate Websites & Portfolios with CMS (مواقع الشركات والخدمات وبورتفوليو بلوحة تحكم خفيفة):
- Trigger: Corporate company websites, services sites, dynamic blogs/portfolios with light admin dashboard/CMS to add/edit projects and photos without coding.
- Realistic Pricing: 10,000 - 18,000 EGP ($210 - $380).
  * MVP package: 10,000 - 12,000 EGP ($210 - $250), duration: 1 week (7 business days).
  * Pro package: 14,000 - 18,000 EGP ($300 - $380), duration: 2 weeks (14 business days).
  * Enterprise package: 22,000 - 28,000 EGP ($470 - $600), duration: 3 weeks.
- Realistic Timeline: 1 to 2 weeks (7 to 14 business days).
- Platforms: 2 web platforms (Responsive Web Application + Light CMS Admin Dashboard). NO mobile apps!
- Annual Operational Estimate:
  * "hosting": "استضافة سحابية خفيفة وقاعدة بيانات: تبدأ من $5 - $10 شهرياً وفق الاستهلاك الفعلي",
  * "domainSsl": "اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً",
  * STRICTLY EXCLUDE "appleDeveloper" ($99), "googlePlay" ($25), and "mapsApi"!

TIER 3: E-Commerce Stores & Single Dedicated Apps (المتاجر الإلكترونية والتطبيقات المستقلة):
- Trigger: Online stores, single-purpose apps, product catalog with checkout and payments.
- Realistic Pricing: 20,000 - 35,000 EGP ($420 - $750).
  * MVP package: 20,000 - 24,000 EGP ($420 - $510), duration: 2 to 3 weeks.
  * Pro package: 28,000 - 35,000 EGP ($600 - $750), duration: 4 weeks.
  * Enterprise package: 42,000 - 55,000 EGP ($900 - $1,200), duration: 5 to 6 weeks.
- Realistic Timeline: 3 to 5 weeks.
- Platforms: Web Store or Single Mobile App + Admin Management Dashboard.
- Annual Operational Estimate:
  * If mobile app requested: include Apple ($99) and Google ($25).
  * If web store only: STRICTLY EXCLUDE Apple and Google store fees!

TIER 4: Multi-Sided Platforms & On-Demand Ecosystems (المنصات والأنظمة المتعددة الأطراف كأوبر وطلبات والمزادات):
- Trigger: Multi-sided platforms (Customer app + Driver/Merchant app + Super Admin dashboard + GPS tracking + real-time sockets).
- Realistic Pricing: 45,000 EGP and above ($950+).
  * MVP package: 35,000 - 45,000 EGP ($750 - $950), duration: 4 to 5 weeks.
  * Pro package: 54,000 - 75,000 EGP ($1,150 - $1,600), duration: 8 to 10 weeks.
  * Enterprise package: 95,000 - 150,000 EGP ($2,000 - $3,200), duration: 12 to 16 weeks.
- Realistic Timeline: 6 to 10+ weeks.
- Platforms: Customer App, Partner App, Super Admin Dashboard, etc.
- Annual Operational Estimate: Full breakdown (Apple $99/yr, Google $25 one-time, VPS $15-$25/mo, Domain $12-$15/yr, Maps credit $200 free, Payments 2.5%).

2. STRICT RELEVANCE & NO INVENTED SCOPE (DO NOT ADD UNREQUESTED APPS OR PLATFORMS):
   - You MUST tailor the platforms strictly to what the client actually requested in the prompt and chat:
     * If the client asked ONLY for a "website" (موقع إلكتروني), "landing page" (صفحة هبوط), "web portal" (بوابة ويب), or "portfolio" (بورتفوليو):
       -> "platforms" MUST contain ONLY the web platforms.
       -> DO NOT include Mobile Apps (iOS & Android) in "platforms".
       -> In "annualOperationalEstimate", DO NOT include "appleDeveloper" ($99) or "googlePlay" ($25) or "mapsApi"!
     * If the client asked for a "mobile app" (تطبيق موبايل / أندرويد / آيفون):
       -> Include Mobile App(s) and include the App Store ($99) & Google Play ($25) developer accounts.
     * If the client asked for a complete on-demand system (e.g. delivery, ride hailing, marketplace):
       -> Include the required platforms (Customer App, Courier/Partner App, Web Super Admin).
     * NEVER add extra platforms, mobile apps, or hardware features that contradict the user's explicit scope!

3. STRICT NO-EMOJI CONSTRAINT: You must NEVER use any emojis or emoji-like unicode symbols anywhere in the JSON response (in projectName, tagline, summary, features, screens, milestones, etc.). The text must remain strictly formal, professional, and completely free of emojis.

Avoid generic boilerplates. Provide realistic numbers matching the classified Tier, specific local competitors, actual risks, and tailored screens according to their unique idea.
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
      "id": "platform_id",
      "name": "Platform Name (e.g. Responsive Web App or Mobile App)",
      "icon": "globe-outline",
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
    "architectureType": "e.g. Modern Web Architecture / Modular Microservices",
    "microservices": [
      "Identity & Auth Service",
      "Core Business Engine",
      "Database & Storage Engine",
      "Notification Broker"
    ],
    "databaseSchema": [
      {
        "table": "Users / Contacts",
        "description": "User accounts or visitor inquiries",
        "fields": ["id", "fullName", "email", "createdAt"]
      }
    ],
    "realtimeEvents": [
      "item:created",
      "status:updated"
    ]
  },
  "techStack": {
    "mobile": "React Native (Expo) if mobile app requested, or null if web only",
    "web": "React.js / Next.js with Tailwind CSS",
    "backend": "Node.js & Express / NestJS with modular REST architecture",
    "realtime": "Socket.io or null if simple website",
    "database": "PostgreSQL / SQLite or serverless database",
    "maps": "Google Maps Platform if geolocation required, or null",
    "payments": "Paymob / Visa / InstaPay if payments required, or null",
    "devops": "Vercel / Cloudflare / Docker with SSL certificate",
    "aiVision": "AI module if applicable to project, or null"
  },
  "timelineWeeks": 1,
  "milestones": [
    {
      "phase": 1,
      "title": "المرحلة 1: دراسة المتطلبات وتصميم الواجهات وتجربة المستخدم (UI/UX Design)",
      "durationWeeks": 1,
      "sprintTasks": [
        "إعداد Wireframes والنماذج التفاعلية للشاشات",
        "اعتماد دليل الهوية والتصميم المعتمد"
      ]
    },
    {
      "phase": 2,
      "title": "المرحلة 2: التطوير والربط البرمجي الكامل والإطلاق",
      "durationWeeks": 1,
      "sprintTasks": [
        "بناء الشاشات وتكامل الواجهات",
        "ربط النطاق والاستضافة والاختبارات الشاملة والإطلاق"
      ]
    }
  ],
  "budgetBreakdown": {
    "currencyEGP": 6000,
    "currencyUSD": 130,
    "items": [
      { "category": "تصميم تجربة وواجهات المستخدم (UI/UX Design)", "costEGP": 2000, "costUSD": 45, "desc": "تصميم كامل متجاوب على Figma" },
      { "category": "التطوير البرمجي والواجهات التفاعلية", "costEGP": 3000, "costUSD": 65, "desc": "بناء الكود عالي السرعة والجودة" },
      { "category": "التهيئة السحابية والأمان ومحركات البحث SEO", "costEGP": 1000, "costUSD": 20, "desc": "ربط النطاق وتأمين الحماية وضبط محركات البحث" }
    ],
    "annualOperationalEstimate": {
      "hosting": "استضافة سحابية: تكلفة الاستضافة السحابية المناسبة لحجم المشروع",
      "domainSsl": "اسم النطاق الدولي (.com/.net) وشهادة SSL: حوالي $12 - $15 سنوياً"
    }
  },
  "paymentPlan": [
    { "milestone": "الدفعة الأولى (50%)", "desc": "عند توقيع العقد والبدء في التصميم وهندسة الواجهات" },
    { "milestone": "الدفعة النهائية (50%)", "desc": "عند الاعتماد النهائي، تسليم الكود المصدري والإطلاق الرسمي" }
  ],
  "feasibilityScore": 90,
  "feasibilityAnalysis": "تحليل الجدوى التسويقية والتقنية والمالية وفرص التميز بالسوق...",
  "competitors": [
    { "name": "المنافس الأول", "marketShareOrType": "نوع المنافس", "ourEdge": "نقاط تميز الحلول التقنية" }
  ],
  "packages": {
    "mvp": {
      "title": "باقة إطلاق النموذج الأولي (MVP)",
      "costEGP": 3500,
      "costUSD": 75,
      "weeks": 1,
      "desc": "النسخة الأساسية الرشيقة للتحقق السريع من السوق واختبار الفكرة بأقل تكلفة ممكنة",
      "keyDeliverables": [
        "الميزات الأساسية للتحقق من السوق",
        "استضافة سحابية ونطاق معتمد"
      ]
    },
    "pro": {
      "title": "باقة المنظومة المتكاملة (Pro Growth - الموصى بها)",
      "costEGP": 6000,
      "costUSD": 130,
      "weeks": 1,
      "desc": "النسخة الاحترافية الكاملة مع ميزات متقدمة ودعم فني",
      "keyDeliverables": [
        "كافة الشاشات والميزات المطلوبة بالكامل",
        "تهيئة SEO وتحليلات الأداء ودعم فني"
      ]
    },
    "enterprise": {
      "title": "باقة المؤسسات والحلول الموسعة (Enterprise Scale)",
      "costEGP": 10000,
      "costUSD": 215,
      "weeks": 2,
      "desc": "حلول موسعة بمواصفات إضافية وتوسعية ودعم شامل",
      "keyDeliverables": [
        "لوحة إدارة متقدمة وميزات حصرية وتوسعية",
        "أعلى مستويات الأداء والأمان"
      ]
    }
  }
}
(NOTE: The numbers above in budgetBreakdown and packages MUST reflect the actual classified Tier: Tier 1: 3,500-8,000 EGP, Tier 2: 10,000-18,000 EGP, Tier 3: 20,000-35,000 EGP, Tier 4: 45,000+ EGP. Never output generic sample numbers without scaling them to the user's specific idea and Tier!)`;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
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

  const systemPrompt = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Magixa Software Agency (شركة ماجيكسا لهندسة البرمجيات وتصميم التجارب الرقمية - magixa.tech).
Analyze the user's software project concept in extreme technical, operational, and financial depth.
CRITICAL DYNAMIC PRICING RULES:
Classify the project into one of 4 market tiers:
- Tier 1: Simple Web / Landing Page / Static Portfolio -> 3,500 - 8,000 EGP ($75 - $170), duration 3-7 business days. Exclude Apple ($99) and Google ($25) and maps fees! Only cloud hosting (free) and domain ($12-$15/yr).
- Tier 2: Corporate Websites & Portfolios with CMS -> 10,000 - 18,000 EGP ($210 - $380), duration 1-2 weeks. Exclude Apple/Google store fees!
- Tier 3: E-Commerce Stores & Single Dedicated Apps -> 20,000 - 35,000 EGP ($420 - $750), duration 3-5 weeks.
- Tier 4: Multi-Sided Platforms & On-Demand Systems -> 45,000+ EGP ($950+), duration 6-10 weeks.
STRICT NO-EMOJI: Never output emojis.
Output ONLY a well-formed JSON object according to standard Magixa specifications.
Language: ${language === 'ar' ? 'Professional Arabic (العربية الفصحى التقنية الدقيقة)' : 'English'}.`;

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
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.7-flash',
    'gemini-flash-latest'
  ];
  let lastError = null;

  const systemInstruction = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Magixa Software Agency (شركة ماجيكسا لهندسة البرمجيات وتصميم التجارب الرقمية - magixa.tech).
You are having an interactive live consultation discussion with a client exploring a new software, mobile app, or SaaS idea.

Core Behavioral Guidelines:
1. Persona: Speak with the authority, clarity, warmth, technical mastery, and strategic wisdom of a world-class CTO and Software Architect.
2. Identity: If the user asks who you are, what your name is, or what they should call you, answer warmly and directly: tell them you are "مستشار Magixa البرمجي والتقني" (Magixa Chief Architect & Digital Consultant) and they can call you "مستشار Magixa" or "بشمهندس".
3. Greetings: If the user greets you or says hi, greet them back warmly and ask how you can assist with their software idea or technical question today.
4. DYNAMIC PRICING & LEAN MVP PHILOSOPHY:
   - Always prioritize the client's return on investment. Emphasize starting with the leanest viable MVP (النموذج الأولي بأقل ميزانية ممكنة) to test and validate their idea in the market without draining their capital.
   - When discussing project pricing, explain our 4 flexible market tiers:
     * المواقع البسيطة وصفحات الهبوط والبورتفوليو: تبدأ من 3,500 إلى 8,000 ج.م (3 إلى 7 أيام عمل).
     * مواقع الشركات والخدمات وبورتفوليو ديناميكي بلوحة تحكم CMS: تبدأ من 10,000 إلى 18,000 ج.م (أسبوع إلى أسبوعين).
     * المتاجر الإلكترونية والتطبيقات المستقلة: تبدأ من 20,000 إلى 35,000 ج.م (3 إلى 5 أسابيع).
     * المنصات والأنظمة المتعددة الأطراف (مثل أوبر، طلبات، مزادات): تبدأ من 45,000 ج.م فما فوق (6 إلى 10 أسابيع).
5. TRANSPARENCY ON RECURRING OPERATIONAL COSTS (مصاريف الطرف الثالث المستمرة):
   Whenever discussing operational fees:
   - Tailor operational fees strictly to the project type:
     * For Web-only, Portfolio, or Landing Page projects:
       -> Free/Economic Cloud Hosting (Vercel / Cloudflare: 0 EGP monthly).
       -> International Domain (.com/.net) & SSL (~$12 - $15 annually).
       -> STRICTLY DO NOT mention Apple ($99) or Google ($25) store fees or VPS or Maps for web-only or portfolio projects!
     * For Mobile App projects only:
       -> Apple Developer Program ($99/year for iOS on App Store).
       -> Google Play Console ($25 one-time lifetime fee for Android).
       -> Cloud Server / VPS ($10 - $20/month).
       -> Domain & SSL ($12 - $15/year).
       -> Payment gateways: 0 setup fee, ~2.5% only on successful transactions.
6. Tailored Engagement: If the user describes an idea, engage deeply with THEIR specific idea: analyze its core value, suggest modern tech stack elements (React Native, Node.js, real-time sockets, cloud databases), and ask 1 to 2 sharp clarifying questions.
7. NEVER assume or invent a project domain (like food delivery or restaurants) that the user did not explicitly mention!
8. Smart Suggestion Chips: Suggest 2 to 4 high-value, actionable quick-reply chips ("suggestions") in Arabic that directly advance the discussion (e.g. asking for MVP budget, discussing iOS fees, reviewing tech stack, or moving to contract generation).
9. CRITICAL RULE FOR "readyForSpec":
   - Set "readyForSpec" to true ONLY IF:
     a) The client explicitly requests generating the blueprint / feasibility study / packages ("استخراج الخطة", "دراسة الجدوى", "الباقات", "التعاقد").
     b) OR after sufficient interactive consultation (usually after 2 to 4 back-and-forth messages) where the core workflow, platforms (web vs mobile), and user types have been clearly explained and understood!
   - DO NOT set "readyForSpec" to true on the very first message unless the user provided a full, multi-paragraph comprehensive technical specification in that single message.
   - NEVER set "readyForSpec" to true for greetings, questions about your identity/name, general pricing questions, or complaints!
10. STRICT NO-EMOJI CONSTRAINT: You must NEVER use any emojis or emoji symbols anywhere in your replies ("reply") or in the suggestion chips ("suggestions"). Keep the text formal, dignified, professional, and strictly free of emojis under all circumstances.

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
        signal: AbortSignal.timeout(20000),
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
        reply: parsed.reply || 'أهلاً بك! أنا مستشارك البرمجي والتقني في Magixa Software. كيف يمكنني مساعدتك في تطوير فكرتك اليوم؟',
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
  const systemPrompt = `You are the Principal Chief Software Architect, Senior Technical Consultant, and CTO at Magixa Software Agency (شركة ماجيكسا لهندسة البرمجيات وتصميم التجارب الرقمية - magixa.tech).
Interactive live consultation with a client.
Follow the 4 dynamic market pricing tiers:
1. Simple Web / Portfolio: 3,500 - 8,000 EGP (3 to 7 business days). Zero store fees, free cloud hosting.
2. Corporate Web / CMS: 10,000 - 18,000 EGP (1 to 2 weeks). Zero store fees.
3. E-Commerce / Single App: 20,000 - 35,000 EGP (3 to 5 weeks).
4. Multi-Sided Platforms: 45,000+ EGP (6 to 10 weeks).
Never mention Apple ($99) or Google ($25) for web-only or portfolio projects.
STRICT NO-EMOJI: Never use emojis anywhere.
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
  const lastUserMsg = (userMessages[userMessages.length - 1]?.text || userMessages[userMessages.length - 1]?.content || '').trim();
  const allUserText = userMessages.map(m => m.text || m.content || '').join(' ');
  const userMsgCount = userMessages.length;

  const ent = extractKeywordsAndEntities(lastUserMsg);
  const allEnt = extractKeywordsAndEntities(allUserText);

  let reply = '';
  let suggestions = [];
  let readyForSpec = false;

  // 1. Identity & Name Questions ("انت مين", "اسمك ايه", "اقولك ايه عشان معرفش اسمك")
  if (ent.isIdentity) {
    reply = 'أهلاً بك يا فندم! أنا **مستشار Magixa البرمجي والتقني (Magixa Digital Consultant)**.\n\nتقدر تناديني **"مستشار Magixa"** أو **"بشمهندس"** زي ما تحب!\n\nأنا مهندسك المعماري ومستشارك التقني هنا في شركة **Magixa**: أسمع فكرة تطبيقك، أساعدك في اختيار أفضل لغات البرمجة والمعمارية (React Native، Node.js، الخرائط، الدفع الإلكتروني)، وأستخرج لك دراسة جدوى فنية و3 باقات استثمارية واضحة بالتكلفة والمدة.\n\nقول لي، هل في فكرة تطبيق أو مشروع يدور في بالك تحب نبدأ ندردش فيها ونحللها؟';
    suggestions = [
      'عندي فكرة تطبيق وأريد استشارتك فيها',
      'ما هي الخدمات التي تقدمها شركة Magixa؟',
      'كيف يتم تحديد تكلفة ومدة أي مشروع؟'
    ];
    readyForSpec = false;
  }
  // 2. Apology / Misunderstanding / Complaint Handling ("مش فاهمني", "انت مش فاهم", "محللتش")
  else if (ent.isComplaint) {
    reply = 'أعتذر منك بشدة يا فندم، حقك عليّ تماماً!\n\nأنا هنا الآن بكامل تركيزي معك دون أي افتراضات مسبقة. تفضل باختصار أو بالتفصيل: ما هي الفكرة أو السؤال الذي يدور في ذهنك؟ وسأجيبك عليه بدقة كمهندس برمجيات.';
    suggestions = [
      'أريد شرح فكرة تطبيقي بالتفصيل',
      'عندي استفسار عن تكلفة تطبيق موبايل',
      'ما هي خطوات التعاقد وتطوير المشروع؟'
    ];
    readyForSpec = false;
  }
  // 3. Greetings & Casual Welcome ("السلام عليكم", "مرحبا", "ازيك", "صباح الخير")
  else if (ent.isGreeting && !ent.hasRealProjectIdea) {
    reply = 'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك في **Magixa** (magixa.tech).\n\nأنا مهندسك المعماري ومستشارك التقني المخصص. يسعدني جداً التحدث معك ومساعدتك في تحويل أي فكرة برمجية أو تطبيق في ذهنك إلى خطة عمل ونظام تقني متكامل.\n\nتفضل شاركني فكرتك أو اسألني عن أي استشارة تقنية تحتاجها!';
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
    reply = 'العفو يا فندم، تحت أمرك دائماً! في Magixa هدفنا تقديم أفضل قيمة واستشارة تقنية بأعلى المعايير.\n\nإذا كان لديك أي استفسار آخر أو ترغب في بدء التخطيط لمشروعك، أنا معك دائماً.';
    suggestions = [
      'أريد مناقشة فكرة مشروع جديدة',
      'عرض خطة المشروع ودراسة الجدوى والـ 3 باقات',
      'التواصل مباشرة مع فريق التطوير عبر واتساب'
    ];
    readyForSpec = false;
  }
  // 5. Inquiries about Magixa Agency & Services ("مين شركة ماجيكسا", "خدماتكم ايه", "بتعملوا ايه")
  else if (ent.isAgencyInquiry) {
    reply = 'شركة **Magixa** هي شريكك التقني لتطوير الحلول البرمجية وتصميم التجارب الرقمية (magixa.tech):\n\n1. **تطبيقات الموبايل (iOS & Android):** نطور تطبيقات فائقة السرعة والأمان بتقنية React Native الموحدة.\n2. **المنصات السحابية ولوحات التحكم:** لوحات Super Admin تفاعلية ومؤتمتة لإدارة العمليات والمبيعات.\n3. **البنية التحتية والربط اللحظي:** خوادم سحابية حديثة، خرائط وتتبع GPS، وبوابات الدفع (Paymob، فودافون كاش، فيزا، كاش)، وحلول IoT والهاردوير.\n4. **الضمان والدعم الفني:** نقدم عقوداً موثقة وضماناً مجانياً 6 أشهر بعد الإطلاق.\n\nهل تخطط لإطلاق تطبيقك الخاص وتود حساب تكلفته؟';
    suggestions = [
      'نعم، عندي فكرة وأريد حساب التكلفة والمدة',
      'كيف تضمنون جودة الكود واستقرار السيرفر؟',
      'ما هي مراحل تسليم المشروع والدفعات؟'
    ];
    readyForSpec = false;
  }
  // 6. General Pricing Inquiries ("اسعاركم كام", "التكلفة كام", "بكام")
  else if (ent.isPricing && !ent.hasRealProjectIdea) {
    reply = 'في **Magixa** نعتمد نظام تسعير ديناميكي مرن (Dynamic Complexity Classification) يعكس الحجم الحقيقي للمشروع دون أي مبالغة أو حدود دنيا إجبارية:\n\n' +
      '1. **فئة المواقع البسيطة وصفحات الهبوط والبورتفوليو:** تبدأ من 3,500 إلى 8,000 ج.م (مدة التنفيذ: من 3 إلى 7 أيام عمل). استضافة سحابية مجانية وسريعة، ولا توجد أي رسوم لمتاجر التطبيقات أو خوادم باهظة.\n' +
      '2. **فئة مواقع الشركات والخدمات وبورتفوليو بلوحة تحكم (CMS):** تبدأ من 10,000 إلى 18,000 ج.م (مدة التنفيذ: من أسبوع إلى أسبوعين)، وتتيح لك إدارة وتعديل أعمالك ومقالاتك وصورك بنفسك.\n' +
      '3. **فئة المتاجر الإلكترونية والتطبيقات المستقلة:** تبدأ من 20,000 إلى 35,000 ج.م (مدة التنفيذ: من 3 إلى 5 أسابيع)، وتشمل كتالوج المنتجات، بوابات الدفع، وإدارة المخزون.\n' +
      '4. **فئة المنصات والأنظمة المتعددة الأطراف (مثل أوبر، طلبات، مزادات):** تبدأ من 45,000 ج.م فما فوق (مدة التنفيذ: من 6 إلى 10 أسابيع)، وتشمل تطبيقات متعددة، تتبع GPS لحظي، ولوحة سوبر أدمن.\n\n' +
      '**الشفافية في التكاليف التشغيلية (الطرف الثالث):**\n' +
      '- لمشاريع الويب والبورتفوليو: النطاق الدولي فقط (~$12 - $15 سنوياً) مع استضافة سحابية مجانية أو اقتصادية.\n' +
      '- لمشاريع تطبيقات الموبايل فقط: يضاف حساب مطور Apple ($99 سنوياً) وحساب Google Play ($25 لمرة واحدة مدى الحياة).\n\n' +
      'ما هو نوع المشروع الذي ترغب في تنفيذه لنحدد لك تكلفته ومدته بدقة؟';
    suggestions = [
      'موقع بورتفوليو أو صفحة هبوط سريعة',
      'موقع شركة أو خدمات بلوحة تحكم CMS',
      'متجر إلكتروني متكامل للبيع والشراء',
      'تطبيق موبايل أو منصة متعددة الأطراف'
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
      reply = `أهلاً بك! في **Magixa** نرحب بفكرتك ونحن متحمسون لتحويلها إلى منتج رقمي استثنائي في السوق (magixa.tech).\n\nلتصميم أفضل معمارية هندسية وتحديد الميزانية بدقة: ما هي أهم الميزات والخدمات التي يقدمها تطبيقك للعميل؟ ومن هم المستخدمون المستهدفون؟`;
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
    engine: 'Magixa Intelligent Architectural Consultation Engine 3.0'
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
  const serverGeminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const serverOpenaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;

  const geminiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : serverGeminiKey;
  const openaiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : serverOpenaiKey;

  // 1. If OpenAI is requested & key available -> Call OpenAI Chat Consultant
  if (activeProvider === 'openai' && openaiKey && openaiKey.trim().length > 10) {
    try {
      return await callOpenAIChatConsultant(messages, openaiKey.trim(), lang);
    } catch (err) {
      console.warn('OpenAI chat consultant failed, checking fallback server key:', err.message);
      if (serverOpenaiKey && serverOpenaiKey !== openaiKey) {
        try {
          return await callOpenAIChatConsultant(messages, serverOpenaiKey.trim(), lang);
        } catch (e2) {
          console.warn('OpenAI chat consultant server key also failed:', e2.message);
        }
      }
    }
  }

  // 2. If Gemini is requested & key available -> Call Gemini Chat Consultant
  if (activeProvider === 'gemini') {
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        return await callGeminiChatConsultant(messages, geminiKey.trim(), lang);
      } catch (err) {
        console.warn('Gemini chat consultant failed with primary key:', err.message);
        if (serverGeminiKey && serverGeminiKey !== geminiKey) {
          try {
            console.log('Retrying chat consultant with server default Gemini key...');
            return await callGeminiChatConsultant(messages, serverGeminiKey.trim(), lang);
          } catch (e2) {
            console.warn('Gemini chat consultant server key also failed:', e2.message);
          }
        }
      }
    }
  }

  // 3. Fallback to Intelligent Conversational Engine 3.0
  return deepSemanticChatConsultant(messages, lang);
}

// -------------------------------------------------------------
// 3. Deep Generative Semantic Analysis Engine (Offline / Fallback)
// -------------------------------------------------------------
function matchAnyInText(text, words) {
  if (!text || !Array.isArray(words)) return false;
  const p = String(text).toLowerCase();
  return words.some(word => {
    try {
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${word}(?:[^\\p{L}\\p{N}]|$)`, 'iu');
      return regex.test(p);
    } catch {
      return p.includes(String(word).toLowerCase());
    }
  });
}

function extractKeywordsAndEntities(prompt = '') {
  const matchAny = (words) => matchAnyInText(prompt, words);

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
  const cleanPrompt = (prompt || '').trim();
  const matchAny = (words) => matchAnyInText(cleanPrompt, words);

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

  // Intent and Scope Detection
  const wantsMobileExplicitly = matchAny(['موبايل', 'تطبيق', 'ابلكيشن', 'أبلكيشن', 'اندرويد', 'أندرويد', 'ايفون', 'آيفون', 'ios', 'android', 'app', 'كابتن', 'سائق', 'دليفري', 'مندوب']);
  const wantsWebExplicitly = matchAny(['موقع', 'موقع الكتروني', 'موقع إلكتروني', 'ويب', 'منصة ويب', 'صفحة هبوط', 'لاندنج بيج', 'بورتفوليو', 'معرض اعمال', 'معرض أعمال', 'website', 'web', 'portal', 'dashboard', 'لوحة تحكم', 'crm', 'saas']);

  const isPortfolioOrLanding = matchAny([
    'بورتفوليو', 'معرض اعمال', 'معرض أعمال', 'صفحة هبوط', 'لاندنج بيج', 
    'landing page', 'portfolio', 'صفحة تعريفية', 'موقع شخصي', 'موقع تعريفي', 
    'صفحة واحدة', 'one page', 'single page', 'cv', 'سيرة ذاتية'
  ]) && !matchAny(['متجر', 'بيع وشراء', 'سلة', 'شحن', 'دليفري', 'سائق', 'كابتن', 'عيادة', 'صيدلية', 'مزاد', 'كورس', 'عقارات']);

  const isCorporateOrCms = (
    matchAny([
      'موقع شركة', 'موقع مؤسسة', 'موقع شركات', 'موقع تعريفي للشركة', 'موقع احترافي',
      'لوحة تحكم للمحتوى', 'cms', 'موقع اخباري', 'موقع إخباري', 'مدونة', 'blog', 
      'إدارة محتوى', 'ادارة محتوى', 'موقع خدمات'
    ]) || (wantsWebExplicitly && !wantsMobileExplicitly && !isPortfolioOrLanding && !ent.isEcommerce && !ent.isAuction && !ent.hasPayment && !ent.isRide && !ent.hasDelivery && !ent.isPharmacy && !ent.isFood)
  ) && !wantsMobileExplicitly;

  // Classify into Dynamic Complexity Market Tier (1, 2, 3, or 4)
  let tier = 4;
  if (isPortfolioOrLanding) {
    tier = 1;
  } else if (isCorporateOrCms) {
    tier = 2;
  } else if (
    (ent.isEcommerce && !ent.hasMultiVendor && !ent.hasDelivery) ||
    (!ent.isRide && !ent.hasDelivery && !ent.isPharmacy && !ent.hasMultiVendor && !ent.isAuction && (wantsWebExplicitly || wantsMobileExplicitly))
  ) {
    tier = 3;
  } else {
    tier = 4;
  }

  const isWebOnly = (tier === 1 || tier === 2 || (wantsWebExplicitly && !wantsMobileExplicitly && !ent.isRide && !ent.hasDelivery && !ent.isPharmacy));

  // Determine domain-specific customizations
  if (tier === 1) {
    projectName = 'بوابة الحضور الرقمي ومعرض الأعمال (Apex Portfolio & Personal Brand)';
    domainName = 'المواقع التعريفية ومعارض الأعمال (Personal Branding & Landing Pages)';
    tagline = 'واجهة رقمية عصرية تبرز المهارات والمشاريع وتبني الثقة مع العملاء والشركاء';
    valProp = 'تقديم تجربة بصرية سريعة واستثنائية تعكس الاحترافية وتسهل التواصل المباشر مع العملاء المستهدفين.';
    bizModel = 'جذب العملاء والشركات المهتمة بالتعاقد المباشر وعرض سابقة الأعمال بأعلى جودة بصرية.';
    keyChallenges = [
      'سرعة التحميل وتجاوب الواجهة: تحسين الأصول والوسائط لتعمل بلمح البصر على كافة المتصفحات.',
      'تهيئة محركات البحث (SEO): ضمان ظهور الموقع والاسم في النتائج الأولى للبحث.',
      'سهولة التواصل: أزرار تحويل مباشرة للواتساب والبريد دون أي تعقيدات.'
    ];
    mvpPlan = 'إطلاق صفحة هبوط مركزية متجاوبة تضم معرض الأعمال ونماذج الاتصال وسابقة الإنجازات.';
  } else if (tier === 2) {
    projectName = 'الموقع التعريفي المؤسسي ومنظومة إدارة المحتوى (Apex Corporate Web & CMS)';
    domainName = 'المواقع المؤسسية وإدارة المحتوى (Corporate Presence & CMS)';
    tagline = 'منظومة ويب متكاملة تبرز هوية الشركة وخدماتها مع لوحة تحكم مرنة لتحديث المحتوى';
    valProp = 'تمكين إدارة الشركة من تحديث سابقة الأعمال والخدمات وفريق العمل بسهولة دون الحاجة لكتابة كود.';
    bizModel = 'تعزيز المبيعات واستقطاب الصفقات والعملاء التجاريين (B2B / B2C) عبر قنوات رقمية موثوقة.';
    keyChallenges = [
      'سهولة التحكم في المحتوى: لوحة إدارة بديهية وسريعة لتحديث الصفحات والصور والخدمات.',
      'الأمان وحماية النماذج: حماية قنوات التواصل من الرسائل العشوائية والاختراق.',
      'التوافق مع الهوية المؤسسية: تصميم عصري يعكس ريادة المؤسسة ومكانتها في السوق.'
    ];
    mvpPlan = 'إطلاق الموقع التعريفي بكافة الأقسام الرئيسية ولوحة الإدارة لتمكين الفريق من إدارة المحتوى فوراً.';
  } else if (ent.isPharmacy) {
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
    projectName = 'منصة تِجارة بلس (TijaraPlus Commerce)';
    domainName = 'الأسواق الرقمية والتجارة الإلكترونية (E-Commerce Platform)';
    tagline = 'متجر وسوق رقمي متكامل يجمع أفضل المنتجات مع تجربة تسوق وشحن ودفع مرنة';
    valProp = 'تمكين المتجر من إدارة المنتجات والمخزون والشحن الآلي مع حماية مشتريات العملاء.';
    bizModel = 'أرباح بيع المنتجات + رسوم الشحن والتوصيل وبوابات الدفع الإلكتروني.';
  } else if (ent.isHealth) {
    projectName = 'منظومة طبّيبك للرعاية الصحية والاستشارات (Tabeebak TeleHealth)';
    domainName = 'الرعاية الصحية وحجز العيادات (HealthTech & Telemedicine)';
    tagline = 'حجز المواعيد والاستشارات الطبية بالفيديو والملف الصحي الرقمي بكل خصوصية';
    valProp = 'توفير الوقت على المريض وتنظيم مواعيد العيادات والاستشارات الطبية عن بُعد بأعلى درجات الأمان.';
    bizModel = 'رسوم حجز رمزية + عمولة 10% على الاستشارات بالفيديو + اشتراكات العيادات الشهرية.';
  }

  // Synthesize customized platforms with specific screens
  const platforms = [];

  if (tier === 1) {
    // TIER 1: Simple Web / Landing Page / Static Portfolio (ONLY 1 PLATFORM)
    platforms.push({
      id: 'portfolio_web',
      name: 'الموقع التعريفي التفاعلي (Responsive Web Landing & Portfolio)',
      icon: 'globe-outline',
      role: 'واجهة ويب تفاعلية سريعة للغاية متوافقة بالكامل مع جميع الشاشات والأجهزة',
      keyFeatures: [
        'تصميم عصري جذاب متوافق مع كافة مقاسات شاشات الموبايل والتابلت واللابتوب',
        'سرعة تحميل فائقة وبنية كود محسنة ومصغرة وفق أحدث المعايير العالمية',
        'معرض أعمال تفاعلي مع فلاتر لتصنيف المشاريع والخدمات ونوافذ معاينة منبثقة',
        'نموذج اتصال مباشر مربوط بالبريد الإلكتروني وأزرار التحويل الفوري للواتساب',
        'تهيئة محركات البحث (SEO On-Page) وربط خرائط جوجل وأيقونات التواصل الاجتماعي'
      ],
      screens: [
        { name: 'الواجهة الرئيسية والتعريف (Hero Section)', desc: 'عرض الهوية البصرية، النبذة التعريفية، وشعارات الثقة وأزرار الإجراء السريع' },
        { name: 'معرض الأعمال والخدمات (Portfolio & Services)', desc: 'استعراض المشاريع السابقة بتنسيق شبكي جذاب مع فلاتر التصنيف ومعاينة التفاصيل' },
        { name: 'قسم الخبرات والمسيرة المهنية (About & Timeline)', desc: 'سرد المسيرة المهنية، المهارات التقنية، أو نبذة تاريخية عن المؤسسة' },
        { name: 'التواصل المباشر وحجز المواعيد (Contact & Connect)', desc: 'نموذج تواصل آمن، أزرار المحادثة المباشرة، والموقع الجغرافي' }
      ]
    });
  } else if (tier === 2) {
    // TIER 2: Corporate Websites & Portfolios with CMS (2 PLATFORMS)
    platforms.push({
      id: 'web_portal',
      name: 'الموقع المؤسسي التفاعلي (Responsive Corporate Website)',
      icon: 'globe-outline',
      role: 'موقع ويب مؤسسي متكامل يستعرض خدمات الشركة وفريق العمل وسابقة المشاريع',
      keyFeatures: [
        'واجهة مؤسسية حديثة ومتوافقة مع الهوية البصرية للشركة على كافة الشاشات',
        'أقسام تعريفية بالخدمات، سابقة الأعمال، المقالات، والأسئلة الشائعة',
        'نماذج استفسار وطلب عروض أسعار مشفرة ومحمية من السبام',
        'ربط الموقع بأدوات التحليل Google Analytics وبكسل المنصات الإعلانية',
        'بنية برمجية مهيأة لمحركات البحث العالمية (Advanced SEO)'
      ],
      screens: [
        { name: 'الصفحة الرئيسية للشركة (Corporate Home)', desc: 'استعراض هوية المؤسسة، الخدمات الرئيسية، شركاء النجاح وأزرار التواصل' },
        { name: 'صفحة الخدمات وسابقة الأعمال (Services & Projects)', desc: 'عرض تفصيلي للخدمات المقدمة مع دراسات الحالة للمشاريع المنفذة' },
        { name: 'المدونة والمركز الإعلامي (Blog & News)', desc: 'مقالات وأخبار الشركة لتعزيز التواجد الرقمي في محركات البحث' },
        { name: 'صفحة التواصل وطلب الأسعار (Contact & RFQ)', desc: 'نموذج طلب عرض سعر، خريطة الفروع، ومعلومات التواصل الرسمية' }
      ]
    });

    platforms.push({
      id: 'admin_dashboard',
      name: 'لوحة التحكم وإدارة المحتوى (Light CMS Admin Dashboard)',
      icon: 'desktop-outline',
      role: 'لوحة تحكم خفيفة وآمنة تتيح لإدارة الشركة تحديث النصوص والصور والمقالات دون برمجة',
      keyFeatures: [
        'إضافة وتعديل وحذف مشاريع سابقة الأعمال والخدمات بكل سهولة',
        'نظام نشر المقالات والأخبار وتحديث بيانات التواصل والفروع',
        'سجل استفسارات العملاء الواردة وتصديرها بصيغة Excel',
        'تسجيل دخول آمن للمشرفين مع حماية ثنائية الصلاحيات',
        'لوحة إحصائيات مبسطة لعدد الزوار والاستفسارات الشهرية'
      ],
      screens: [
        { name: 'لوحة الإحصائيات العامة (Overview)', desc: 'متابعة سريعة لأحدث الرسائل الواردة وعدد زوار الموقع' },
        { name: 'إدارة المحتوى والمشاريع (Content Manager)', desc: 'محرر نصوص وصور لإضافة وتعديل الخدمات وسابقة الأعمال' },
        { name: 'صندوق رسائل واستفسارات العملاء (Inquiries)', desc: 'مراجعة وتصدير طلبات عروض الأسعار والرسائل الواردة' },
        { name: 'إعدادات الموقع والمشرفين (Settings)', desc: 'تحديث بيانات الشركة، حسابات التواصل، وإدارة كلمات المرور' }
      ]
    });
  } else if (tier === 3) {
    // TIER 3: E-Commerce Stores & Single Dedicated Apps (2 PLATFORMS)
    if (isWebOnly) {
      platforms.push({
        id: 'web_portal',
        name: 'المتجر الإلكتروني التفاعلي (Responsive Web E-Commerce)',
        icon: 'cart-outline',
        role: 'متجر ويب متكامل متوافق مع كافة الشاشات لتصفح وشراء المنتجات بسلاسة',
        keyFeatures: [
          'واجهة متجر تفاعلية سريعة متوافقة مع متصفحات الموبايل والكمبيوتر',
          'كتالوج منتجات متقدم مع فلاتر التصنيف، البحث السريع، وسلة المشتريات',
          'بوابات دفع إلكتروني متعددة (فيزا، فودافون كاش، وإنستاباي)',
          'نظام حسابات العملاء وتتبع حالة الطلبات والفواتير',
          'تصميم مهيأ لمحركات البحث مع مشاركة المنتجات على شبكات التواصل'
        ],
        screens: [
          { name: 'واجهة المتجر الرئيسية (Storefront Home)', desc: 'العروض الترويجية، أحدث المنتجات، وأقسام التسوق الأكثر طلباً' },
          { name: 'شاشة تفاصيل المنتج (Product Details)', desc: 'الصور المكبرة، المواصفات، المخزون، والتقييمات، وزر الإضافة للسلة' },
          { name: 'سلة التسوق وإتمام الدفع (Cart & Checkout)', desc: 'إدخال بيانات الشحن، قسائم الخصم، وبوابة الدفع الإلكتروني' },
          { name: 'حساب العميل والطلبات (Customer Account)', desc: 'متابعة الشحنات السابقة وتعديل العناوين الشخصية' }
        ]
      });

      platforms.push({
        id: 'admin_dashboard',
        name: 'لوحة التحكم وإدارة المتجر (E-Commerce Store Admin)',
        icon: 'desktop-outline',
        role: 'لوحة ويب سحابية شاملة لإدارة المنتجات، المخزون، الطلبات، والتقارير المالية',
        keyFeatures: [
          'إدارة شاملة للمنتجات والأسعار والتخفيضات ومستويات المخزون',
          'معالجة الطلبات وتحديث حالات الشحن وإصدار بوالص الشحن',
          'تقارير المبيعات اليومية والشهرية وصافي الأرباح',
          'إدارة قسائم الخصم (Coupons) والعروض الترويجية',
          'تصدير كشوف الحسابات والفواتير الضريبية بصيغة PDF وExcel'
        ],
        screens: [
          { name: 'لوحة مؤشرات المبيعات (Sales Dashboard)', desc: 'مخططات الإيرادات وحجم الطلبات والمنتجات الأكثر مبيعاً' },
          { name: 'شاشة إدارة الكتالوج والمخزون (Inventory)', desc: 'إضافة وتعديل الأصناف وتنبيهات نفاد الكميات' },
          { name: 'شاشة معالجة الطلبات والشحن (Orders)', desc: 'تغيير حالات الطلب وتعيين شركة الشحن وطباعة الفاتورة' },
          { name: 'التقارير المالية وحسابات الضرائب (Finance)', desc: 'كشوفات الأرباح والعمولات وتحليلات دورة رأس المال' }
        ]
      });
    } else {
      platforms.push({
        id: 'client_app',
        name: 'تطبيق المتجر والمستخدم (iOS & Android)',
        icon: 'phone-portrait-outline',
        role: 'تطبيق هاتف ذكي سريع وعصري لتصفح المنتجات والشراء المباشر',
        keyFeatures: [
          'تسجيل دخول سلس برقم الهاتف أو الحسابات الاجتماعية مع كود OTP',
          'كتالوج منتجات سريع مع بحث فوري وفلاتر ذكية وإشعارات الخصومات',
          'سلة مشتريات تفاعلية وحفظ المنتجات في قائمة الرغبات (Wishlist)',
          'بوابات دفع إلكترونية متعددة وخيار الدفع عند الاستلام',
          'إشعارات لحظية بتحديثات شحن الطلب والعروض الحصرية'
        ],
        screens: [
          { name: 'شاشة البداية والتسوق (Home)', desc: 'استعراض المنتجات المميزة، الأقسام، وشريط البحث المتقدم' },
          { name: 'شاشة تفاصيل المنتج (Product Details)', desc: 'الصور، المقاسات، الألوان، والمخزون وزر الشراء المباشر' },
          { name: 'شاشة إتمام الطلب والدفع (Checkout)', desc: 'اختيار عنوان الشحن وقسيمة الخصم وطريقة الدفع' },
          { name: 'شاشة الطلبات والملف الشخصي (Orders & Profile)', desc: 'سجل الطلبات، تتبع مسار الشحنة، وإدارة العناوين' }
        ]
      });

      platforms.push({
        id: 'admin_dashboard',
        name: 'لوحة التحكم وإدارة المنظومة (Super Admin Dashboard)',
        icon: 'desktop-outline',
        role: 'لوحة ويب سحابية شاملة للإشراف على المنتجات والطلبات والعملاء',
        keyFeatures: [
          'إدارة الكتالوج، الأسعار، والمخزون اللحظي',
          'معالجة الطلبات وإرسال إشعارات التحديث للمستخدمين',
          'لوحة تقارير المبيعات والإيرادات والمستخدمين الأكثر نشاطاً',
          'إرسال إشعارات تسويقية وتنبيهية للموبايل عبر Firebase Cloud Messaging',
          'إدارة صلاحيات المشرفين وحماية المنظومة'
        ],
        screens: [
          { name: 'لوحة المؤشرات والتقارير (Analytics)', desc: 'رسوم بيانية حية لحجم المبيعات والطلبات اليومية' },
          { name: 'إدارة المنتجات والمخزون (Catalog)', desc: 'إضافة وحذف الأصناف والتحكم في الخصومات' },
          { name: 'إدارة الطلبات والشحن (Orders)', desc: 'متابعة الطلبات وتحديث حالات التوصيل' },
          { name: 'الإشعارات والإعدادات (Notifications)', desc: 'إرسال حملات إشعارات للمستخدمين وإدارة النظام' }
        ]
      });
    }
  } else {
    // TIER 4: Multi-Sided Platforms & On-Demand Ecosystems
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

  // Dynamic Financial, Milestone & Architecture Synthesis per Tier
  let totalCostEGP;
  let totalCostUSD;
  let timelineWeeks;
  let techStack;
  let systemArchitecture;
  let milestones;
  let budgetItems = [];
  let annualOperationalEstimate = {};
  let packages = {};
  let paymentPlan = [];
  let feasibilityScore = 88;
  let feasibilityAnalysis = '';
  let competitors = [];

  if (tier === 1) {
    totalCostEGP = 6000;
    totalCostUSD = 128;
    timelineWeeks = 1;

    techStack = {
      mobile: 'واجهات ويب متجاوبة بالكامل (Responsive Web Design) تعمل كتطبيق ويب سريع (PWA)',
      web: 'Next.js 14 / React.js مع Tailwind CSS لسرعة استجابة خارقة ومظهر استثنائي',
      backend: 'Vercel Serverless Functions / Node.js خفيف لمعالجة نماذج الاتصال',
      realtime: 'ربط فوري بأزرار WhatsApp وTelegram للتواصل اللحظي',
      database: 'JSON Schema / ملفات مهيكلة خفيفة بدون تعقيد قواعد بيانات لتسريع التصفح',
      maps: 'Google Maps Embed مجاني تماماً لموقع الشركة أو المكتب',
      payments: 'لا يتطلب المشروع بوابات دفع إلكترونية معقدة (معاملات مباشرة)',
      devops: 'استضافة سحابية فائقة السرعة على Vercel أو Cloudflare Pages مع SSL تلقائي مجاني'
    };

    systemArchitecture = {
      architectureType: 'Modern Jamstack & Static Site Generation (Next.js / HTML5 + CDN)',
      microservices: [
        'محرك توليد الصفحات الثابتة فائق السرعة (Edge SSR / SSG)',
        'خدمة استقبال رسائل الاتصال والنماذج المشفرة (Form Handling API)',
        'شبكة التوزيع السحابي العالمية (Global Edge CDN Cache)',
        'محرك تحسين الصور والوسائط التفاعلي (Image Optimization Engine)'
      ],
      databaseSchema: [
        {
          table: 'Contact Submissions',
          description: 'جدول استفسارات ورسائل الزوار والعملاء',
          fields: ['id', 'name', 'email', 'phone', 'message', 'createdAt']
        },
        {
          table: 'Portfolio Items',
          description: 'هيكل بيانات المشاريع وسابقة الأعمال',
          fields: ['id', 'title', 'category', 'thumbnailUrl', 'liveUrl', 'description']
        }
      ],
      realtimeEvents: [
        'contact:message_received',
        'portfolio:view_analytics'
      ]
    };

    milestones = [
      {
        phase: 1,
        title: 'المرحلة 1: هندسة الواجهات وتجربة المستخدم وتحديد الهوية (UI/UX Design)',
        durationWeeks: 1,
        sprintTasks: [
          'إعداد وتدقيق Wireframes وتصميم واجهة المستخدم على Figma',
          'اختيار لوحة الألوان والخطوط والأيقونات المناسبة للهوية',
          'اعتماد النسخة التجريبية التفاعلية للواجهة'
        ]
      },
      {
        phase: 2,
        title: 'المرحلة 2: التطوير البرمجي والتجاوب وسرعة التحميل (Development & Optimization)',
        durationWeeks: 1,
        sprintTasks: [
          'تكويد الواجهات بأحدث تقنيات Next.js / Tailwind CSS',
          'تطبيق التجاوب الكامل لكافة مقاسات شاشات الموبايل والتابلت واللابتوب',
          'ربط نموذج الاتصال وأزرار الواتساب وشبكات التواصل'
        ]
      },
      {
        phase: 3,
        title: 'المرحلة 3: تهيئة محركات البحث (SEO) والربط السحابي والإطلاق الرسمي',
        durationWeeks: 1,
        sprintTasks: [
          'فحص سرعة الأداء وتحسين محركات البحث SEO On-Page',
          'ربط اسم النطاق الدولي (Domain) وتفعيل شهادة الأمان SSL',
          'النشر السحابي المباشر وتسليم الكود المصدري بالكامل'
        ]
      }
    ];

    budgetItems = [
      { category: 'تصميم تجربة وواجهات المستخدم (UI/UX Design)', costEGP: 2000, costUSD: 43, desc: 'تصميم تفاعلي كامل لواجهة الموقع ومعرض الأعمال على Figma' },
      { category: 'تطوير وتكويد الواجهات التفاعلية (Front-End Development)', costEGP: 2500, costUSD: 53, desc: 'برمجة الواجهة التفاعلية بتقنيات Next.js مع سرعة تحميل فائقة وتجاوب كامل' },
      { category: 'تهيئة محركات البحث والربط السحابي (SEO & Deployment)', costEGP: 1500, costUSD: 32, desc: 'تهيئة SEO وربط الدومين واستضافة Vercel السحابية ونماذج الاتصال' }
    ];

    annualOperationalEstimate = {
      hosting: 'استضافة سحابية مجانية وسريعة (Vercel / Cloudflare): 0 جنيه شهرياً تكفي لآلاف الزوار مجاناً',
      domainSsl: 'اسم النطاق الدولي (.com/.net) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً (600 - 750 جنيه سنوياً)'
    };

    paymentPlan = [
      { milestone: 'الدفعة الأولى (50%)', desc: 'عند بدء العمل واعتماد التصميم الأولي والهوية البصرية' },
      { milestone: 'الدفعة النهائية (50%)', desc: 'عند المعاينة الحية واعتماد الموقع وربط الدومين والتسليم النهائي' }
    ];

    feasibilityScore = 96;
    feasibilityAnalysis = 'تحليل الجدوى السوقية والفنية: البورتفوليو الرقمي والموقع التعريفي يمثلان أسرع استثمار رقمي عائد للمهنيين والمبدعين، حيث تزيد الواجهة الحديثة وسرعة التجاوب من معدل إغلاق الصفقات وبناء الثقة بنسبة تفوق 70% بأقل تكلفة تشغيلية ممكنة وبدون أي رسوم خوادم.';
    competitors = [
      { name: 'قوالب ووردبريس ومواقع جاهزة بطيئة', marketShareOrType: 'حلول قوالب تقليدية مكدسة', ourEdge: 'كود Next.js فائق السرعة وخفيف وخالي من الثغرات بدون تكاليف استضافة باهظة' },
      { name: 'منصات الاشتراك الشهري مثل Wix / Squarespace', marketShareOrType: 'منصات سحابية مغلقة باشتراك شهري مستمر', ourEdge: 'ملكية تامة للكود واستضافة سحابية مجانية مدى الحياة بدون أي اشتراكات متكررة' }
    ];

    packages = {
      mvp: {
        title: 'باقة الصفحة التعريفية السريعة (One-Page Portfolio)',
        costEGP: 3500,
        costUSD: 75,
        weeks: 1,
        desc: 'صفحة هبوط احترافية متجاوبة من صفحة واحدة تضم النبذة، معرض الأعمال ونموذج الاتصال المباشر',
        keyDeliverables: [
          'تصميم صفحة هبوط متجاوبة بالكامل للموبايل والكمبيوتر',
          'معرض أعمال أساسي لـ 6-10 مشاريع مع نوافذ المعاينة',
          'ربط زر واتساب مباشر ونموذج اتصال بالبريد الإلكتروني',
          'استضافة سحابية مجانية وسريعة مدى الحياة'
        ]
      },
      pro: {
        title: 'باقة البورتفوليو والموقع الاحترافي (Pro Portfolio & Showcase)',
        costEGP: 6000,
        costUSD: 128,
        weeks: 1,
        desc: 'موقع ويب متكامل متعدد الأقسام بتأثيرات بصرية حديثة، فلاتر للمشاريع، وتهيئة متقدمة للـ SEO',
        keyDeliverables: [
          'تصميم عصري متعدد الأقسام وتأثيرات بصرية تفاعلية مميزة',
          'معرض أعمال تفاعلي متقدم مع فلاتر تصنيف ونوافذ تفاصيل المشاريع',
          'تهيئة كاملة لمحركات البحث (SEO) لظهور اسمك في النتائج الأولى في جوجل',
          'ربط النطاق المخصص (Domain) وشهادة أمان SSL تلقائية',
          'دعم فني وتعديلات مجانية لمدة شهر كامل بعد الإطلاق'
        ]
      },
      enterprise: {
        title: 'باقة الموقع الموسع المتقدم (Enterprise Dynamic Portfolio)',
        costEGP: 10000,
        costUSD: 212,
        weeks: 2,
        desc: 'موقع شخصي أو تجاري متقدم متعدد الصفحات مع دعم لغتين (عربي/إنجليزي) وتدوين مقالات مبسط',
        keyDeliverables: [
          'موقع متكامل متعدد الصفحات مع دعم كامل للغتين (العربية والإنجليزية)',
          'نظام مدونة أو مقالات مبسط لعرض المقالات والمنشورات',
          'تكامل مع أدوات التحليل Google Analytics ورصد الزوار بدقة',
          'سرعة تحميل قياسية 95%+ على Google PageSpeed',
          'دعم فني وصيانة مجانية لمدة 3 أشهر'
        ]
      }
    };
  } else if (tier === 2) {
    totalCostEGP = 14000;
    totalCostUSD = 298;
    timelineWeeks = 2;

    techStack = {
      mobile: 'تصميم ويب متجاوب بالكامل (Responsive Web Design) يعمل بسلاسة على كافة الشاشات',
      web: 'Next.js 14 / React.js مع Tailwind CSS لأعلى أداء وتجربة مستخدم عصرية',
      backend: 'Node.js & Express.js أو Next.js Server Actions لإدارة المحتوى والـ APIs',
      realtime: 'تنبيهات فورية عند وصول طلبات استفسار جديدة من العملاء',
      database: 'PostgreSQL / Supabase / SQLite لتخزين المحتوى والمقالات والمشاريع بأمان',
      maps: 'Google Maps Embed مدمج للموقع الجغرافي للشركة وفروعها',
      payments: 'اختياري: ربط بوابات الدفع في حال تفعيل حجز استشارات مدفوعة',
      devops: 'استضافة سحابية متقدمة Vercel / Railway مع شهادة أمان SSL ونسخ احتياطي'
    };

    systemArchitecture = {
      architectureType: 'Modular CMS Architecture (Headless Next.js & REST API)',
      microservices: [
        'خدمة إدارة المحتوى والمقالات (CMS Engine)',
        'خدمة التوثيق والمصادقة لإدارة المشرفين (Admin Auth Service)',
        'خدمة استقبال وإرسال استفسارات العملاء (Inquiries Broker)',
        'خدمة تحسين وضغط الوسائط والملفات (Media Storage Service)'
      ],
      databaseSchema: [
        {
          table: 'Articles & News',
          description: 'جدول المقالات والأخبار المنشورة في المدونة',
          fields: ['id', 'title', 'slug', 'content', 'coverImage', 'publishedAt']
        },
        {
          table: 'Company Services & Portfolio',
          description: 'جدول خدمات الشركة وسابقة الأعمال',
          fields: ['id', 'title', 'category', 'description', 'images', 'isFeatured']
        },
        {
          table: 'Admin Users',
          description: 'جدول المشرفين ومديري لوحة التحكم',
          fields: ['id', 'username', 'email', 'passwordHash', 'role']
        },
        {
          table: 'Customer Inquiries',
          description: 'جدول الرسائل واستفسارات عروض الأسعار',
          fields: ['id', 'clientName', 'email', 'phone', 'serviceType', 'message', 'status', 'createdAt']
        }
      ],
      realtimeEvents: [
        'inquiry:created',
        'content:updated'
      ]
    };

    milestones = [
      {
        phase: 1,
        title: 'المرحلة 1: دراسة الهوية وتصميم الواجهات وتجربة المستخدم (UI/UX Design)',
        durationWeeks: 1,
        sprintTasks: [
          'تصميم كافة شاشات الموقع المؤسسي ولوحة إدارة المحتوى على Figma',
          'اعتماد نظام المكونات والألوان الموحد متوافقاً مع هوية الشركة',
          'مراجعة واعتماد النسخة التفاعلية مع العميل'
        ]
      },
      {
        phase: 2,
        title: 'المرحلة 2: تطوير الموقع التعريفي ولوحة إدارة المحتوى (Full-Stack Dev)',
        durationWeeks: 1,
        sprintTasks: [
          'برمجة الموقع التعريفي بكافة صفحاته وتطبيق معايير التجاوب وسرعة التحميل',
          'بناء لوحة إدارة المحتوى CMS وربط قواعد البيانات ونظام المصادقة',
          'ربط نماذج الاستفسار وتنبيهات البريد الإلكتروني الفورية'
        ]
      },
      {
        phase: 3,
        title: 'المرحلة 3: الاختبارات الشاملة، تهيئة SEO، والنشر السحابي والتدريب',
        durationWeeks: 1,
        sprintTasks: [
          'فحص سرعة الموقع وأمان لوحة التحكم وتدقيق محركات البحث SEO',
          'ربط الدومين الرسمي وتفعيل شهادة التشفير وحماية SSL',
          'تسليم لوحة التحكم وتدريب فريق عمل الشركة على إدارة المحتوى'
        ]
      }
    ];

    budgetItems = [
      { category: 'تصميم تجربة وواجهات المستخدم (UI/UX Design)', costEGP: 3500, costUSD: 75, desc: 'تصميم هوية وواجهات الموقع التعريفي ولوحة إدارة المحتوى على Figma' },
      { category: 'تطوير وتكويد واجهات الموقع التفاعلي (Front-End)', costEGP: 5500, costUSD: 117, desc: 'بناء واجهات الموقع والصفحات وتهيئة التجاوب والـ SEO' },
      { category: 'برمجة لوحة التحكم والباك إند (CMS & Backend)', costEGP: 5000, costUSD: 106, desc: 'لوحة التحكم بإدارة المحتوى، المقالات، الخدمات وقاعدة البيانات' }
    ];

    annualOperationalEstimate = {
      hosting: 'استضافة سحابية خفيفة وقاعدة بيانات: تبدأ من $5 - $10 شهرياً وفق الاستهلاك الفعلي',
      domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
      paymentGateways: 'بوابات الدفع الإلكتروني (اختياري في حال تفعيل حجز مدفوع): اقتطاع 2.5% فقط عند العمليات بدون اشتراك شهري'
    };

    paymentPlan = [
      { milestone: 'الدفعة الأولى (40%)', desc: 'عند بدء العمل وتصميم واجهات الموقع ولوحة التحكم' },
      { milestone: 'الدفعة الثانية (30%)', desc: 'عند تسليم المعاينة الحية للموقع واكتمال لوحة إدارة المحتوى' },
      { milestone: 'الدفعة النهائية (30%)', desc: 'عند اعتماد الموقع وربط الدومين الرسمي وتسليم صلاحيات الإدارة' }
    ];

    feasibilityScore = 93;
    feasibilityAnalysis = 'تحليل الجدوى السوقية والمؤسسية: المواقع المؤسسية المدعومة بنظام إدارة محتوى خفيف تمنح الشركات مرونة تسويقية فائقة لعرض خدماتها وأخبارها وبناء المصداقية مع عملاء B2B/B2C بتكلفة تشغيل وتطوير منضبطة.';
    competitors = [
      { name: 'المواقع القديمة أو المعتمدة على ووردبريس', marketShareOrType: 'أنظمة بطيئة تحتاج صيانة وتحديثات إضافات مستمرة', ourEdge: 'معمارية Headless حديثة سريعة وآمنة ومحمية من الاختراق مع لوحة تحكم بديهية' },
      { name: 'شركات البرمجيات الكلاسيكية', marketShareOrType: 'تكاليف مرتفعة وفترات تسليم تتجاوز شهوراً', ourEdge: 'تسليم سريع خلال أسبوعين، تصميم مخصص يعكس الهوية، ودعم فني ممتد' }
    ];

    packages = {
      mvp: {
        title: 'باقة الموقع التعريفي الأساسي (Essential Business Site)',
        costEGP: 10000,
        costUSD: 213,
        weeks: 1,
        desc: 'موقع تعريفي للشركة من 4-5 صفحات مع لوحة تحكم مصغرة لإدارة البيانات الأساسية',
        keyDeliverables: [
          'تصميم موقع مؤسسي متجاوب بالكامل مع الشاشات',
          'صفحات رئيسية: عن الشركة، الخدمات، سابقة الأعمال، وتواصل معنا',
          'لوحة إدارة مصغرة لتعديل نصوص وبيانات الموقع',
          'ربط نموذج الاتصال بالبريد الإلكتروني وأزرار الواتساب'
        ]
      },
      pro: {
        title: 'باقة المنظومة المؤسسية وإدارة المحتوى (Pro Corporate & CMS)',
        costEGP: 14000,
        costUSD: 298,
        weeks: 2,
        desc: 'موقع مؤسسي احترافي متكامل مع لوحة إدارة محتوى ديناميكية ومدونة ونظام استفسارات متقدم',
        keyDeliverables: [
          'موقع مؤسسي شامل متعدد الأقسام بتصميم فريد عالي الاحترافية',
          'لوحة تحكم CMS كاملة لإدارة المشاريع والخدمات والمقالات بدون قيود',
          'نظام مدونة ومركز إعلامي لتحسين الترتيب في محركات البحث SEO',
          'نظام استقبال وإدارة وتصدير استفسارات العملاء وعروض الأسعار',
          'دعم فني وصيانة مجانية لمدة شهرين وتدريب كامل لفريق العمل'
        ]
      },
      enterprise: {
        title: 'باقة المؤسسات متعددة اللغات والفروع (Enterprise Multi-Branch)',
        costEGP: 22000,
        costUSD: 468,
        weeks: 3,
        desc: 'منظومة مؤسسية موسعة تدعم لغات متعددة (عربي/إنجليزي)، إدارة الفروع، ونظام علاقات عملاء مصغر',
        keyDeliverables: [
          'دعم كامل للغتين (العربية والإنجليزية) مع تبديل لحظي سلس',
          'إدارة فروع الشركة والمواقع الجغرافية المتعددة على الخريطة',
          'لوحة تحكم بصلاحيات متعددة لفريق العمل ومديري الأقسام',
          'تكامل مع أدوات التحليل المتقدمة وحماية أمنية مشددة',
          'دعم فني وصيانة مجانية لمدة 6 أشهر مع اتفاقية SLA'
        ]
      }
    };
  } else if (tier === 3) {
    totalCostEGP = 28000;
    totalCostUSD = 595;
    timelineWeeks = 4;

    techStack = {
      mobile: isWebOnly ? 'واجهات ويب متجاوبة بالكامل لمتصفحات الموبايل والتابلت والكمبيوتر' : 'React Native (Expo) - تطبيق موحد عالي السرعة للأندرويد والآيفون',
      web: 'Next.js 14 / React.js مع Tailwind CSS لأعلى سرعة وأفضل تجربة مستخدم',
      backend: 'Node.js & Express.js مع بنية معمارية رشيقة وقابلة للتوسع',
      realtime: 'إشعارات لحظية عبر WebSockets وFirebase Cloud Messaging',
      database: 'PostgreSQL / SQLite مع Prisma ORM لحماية وسرعة المعاملات',
      maps: 'خرائط جوجل مدمجة لتحديد مواقع التوصيل والفروع بدقة',
      payments: 'Paymob / Visa / Mastercard / Vodafone Cash / InstaPay',
      devops: 'سيرفر سحابي محمي بجدار ناري وشهادة تشفير SSL ونسخ احتياطي دوري'
    };

    systemArchitecture = {
      architectureType: 'Modular Commerce Architecture (RESTful API & Event-Driven)',
      microservices: [
        'خدمة التوثيق والمصادقة للعملاء (Auth & Identity Service)',
        'محرك إدارة الكتالوج والمخزون (Catalog & Inventory Engine)',
        'خدمة السلة وإتمام الطلبات (Cart & Order Processing)',
        'بوابة المدفوعات والفواتير الرقمية (Payments & Invoicing Service)',
        'محرك التنبيهات وإشعارات الطلبات (Notification Broker)'
      ],
      databaseSchema: [
        {
          table: 'Users & Customers',
          description: 'جدول العملاء والمشترين وحسابات المصادقة',
          fields: ['id', 'fullName', 'email', 'phone', 'address', 'createdAt']
        },
        {
          table: 'Products & Variants',
          description: 'جدول المنتجات والأسعار والمخزون والمواصفات',
          fields: ['id', 'title', 'price', 'discountPrice', 'stock', 'category', 'images']
        },
        {
          table: 'Orders',
          description: 'جدول الطلبات وتفاصيل الشحن والمدفوعات',
          fields: ['id', 'customerId', 'totalAmount', 'status', 'paymentMethod', 'shippingAddress', 'createdAt']
        },
        {
          table: 'Order Items',
          description: 'تفاصيل المنتجات داخل كل طلب',
          fields: ['id', 'orderId', 'productId', 'quantity', 'unitPrice']
        }
      ],
      realtimeEvents: [
        'order:created',
        'order:status_updated',
        'inventory:low_stock'
      ]
    };

    milestones = [
      {
        phase: 1,
        title: 'المرحلة 1: تصميم واجهات وتجربة المستخدم وسلة الشراء (UI/UX Design)',
        durationWeeks: 1,
        sprintTasks: [
          'تصميم كافة شاشات المتجر/التطبيق وتجربة إتمام الطلب على Figma',
          'اعتماد رحلة المستخدم السلسة من التصفح حتى الدفع',
          'تصميم لوحة التحكم الإدارية وإدارة المخزون'
        ]
      },
      {
        phase: 2,
        title: 'المرحلة 2: تطوير الباك إند وقواعد البيانات وبوابات الدفع (Backend & APIs)',
        durationWeeks: 1,
        sprintTasks: [
          'برمجة REST APIs ونظام التوثيق والمصادقة وسلة المشتريات',
          'هندسة قواعد البيانات وإدارة المخزون وتتبع الحالات',
          'ربط وتفعيل بوابات الدفع الإلكتروني (Paymob / البطاقات البنكية والمحافظ)'
        ]
      },
      {
        phase: 3,
        title: 'المرحلة 3: برمجة واجهات المتجر / التطبيق ولوحة الإدارة (Development)',
        durationWeeks: 1,
        sprintTasks: [
          'تطوير الواجهات التفاعلية أو تطبيقات الجوال',
          'ربط التطبيق مع الـ APIs واختبار مسار الشراء والدفع كاملاً',
          'إتمام لوحة تحكم المشرفين والتقارير المالية'
        ]
      },
      {
        phase: 4,
        title: 'المرحلة 4: الاختبارات الشاملة (QA) والإطلاق والتسليم الرسمي',
        durationWeeks: 1,
        sprintTasks: [
          'فحص الأمان وتأمين عمليات الدفع والتأكد من سرعة التصفح',
          isWebOnly ? 'ربط الدومين والنشر السحابي للمتجر' : 'تجهيز حسابات المتاجر ورفع التطبيقات لـ Google Play & App Store',
          'تسليم الكود المصدري وتدريب فريق العمل على إدارة المتجر'
        ]
      }
    ];

    budgetItems = [
      { category: 'تصميم تجربة وواجهات المستخدم (UI/UX Design)', costEGP: 6000, costUSD: 128, desc: 'تصميم احترافي لكافة شاشات المتجر وسلة الشراء ولوحة الإدارة على Figma' },
      { category: 'تطوير الباك إند وقواعد البيانات وبوابات الدفع', costEGP: 9000, costUSD: 191, desc: 'خوادم الـ APIs، سلة المشتريات، محرك الفواتير والربط مع Paymob' },
      { category: isWebOnly ? 'برمجة واجهات المتجر التفاعلية' : 'برمجة وتطوير تطبيقات الموبايل (iOS & Android)', costEGP: 8000, costUSD: 170, desc: isWebOnly ? 'واجهة متجر تفاعلية بتقنيات Next.js' : 'تطبيقات الهاتف الذكي بأحدث تقنيات React Native' },
      { category: 'لوحة التحكم وإدارة المخزون والتقارير', costEGP: 5000, costUSD: 106, desc: 'لوحة تحكم مركزية لإدارة المنتجات، الطلبات، وبوالص الشحن' }
    ];

    annualOperationalEstimate = isWebOnly ? {
      hosting: 'استضافة سحابية وقاعدة بيانات: تبدأ من $10 - $15 شهرياً وفق الاستهلاك الفعلي',
      domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
      paymentGateways: 'بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك، اقتطاع 2.5% فقط عند العمليات الناجحة'
    } : {
      appleDeveloper: 'حساب مطور Apple App Store: $99 سنوياً (يدفع لشركة Apple مباشرة لرفع وتحديث تطبيق iOS)',
      googlePlay: 'حساب مطور Google Play Console: $25 تدفع لمرة واحدة مدى الحياة (لشركة Google لنشر تطبيقات أندرويد)',
      hosting: 'استضافة سحابية وسيرفر: تبدأ من $10 - $15 شهرياً وفق الاستهلاك الفعلي',
      domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
      paymentGateways: 'بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك، اقتطاع 2.5% فقط عند العمليات الناجحة'
    };

    paymentPlan = [
      { milestone: 'الدفعة الأولى (40%)', desc: 'عند بدء المشروع واعتماد التصاميم وواجهات المستخدم' },
      { milestone: 'الدفعة الثانية (30%)', desc: 'عند الانتهاء من تطوير الباك إند والمعاينة التجريبية للمتجر' },
      { milestone: 'الدفعة النهائية (30%)', desc: 'عند الفحص النهائي وتسليم الكود المصدري والإطلاق الرسمي' }
    ];

    feasibilityScore = 89;
    feasibilityAnalysis = 'تحليل الجدوى السوقية والتجارية: إطلاق متجر إلكتروني مستقل يمنح العلامة التجارية استقلالية تامة عن منصات الاشتراكات وعمولات المتاجر الخارجية، مع تكامل مباشر مع بوابات الدفع والشحن المحلية لضمان تحقيق أعلى هامش ربح.';
    competitors = [
      { name: 'منصات تأجير المتاجر (سلة / زد / Shopify)', marketShareOrType: 'منصات تعتمد على اشتراكات شهرية متزايدة وعمولات إضافية', ourEdge: 'كود مملوك بالكامل 100% بدون أي اشتراكات شهرية، وأداء أسرع، وتخصيص لانهائي' },
      { name: 'البيع اليدوي عبر وسائل التواصل', marketShareOrType: 'إدارة يدوية للطلبات تسبب أخطاء وضياع للفرص البيعية', ourEdge: 'أتمتة كاملة لإتمام الطلب والدفع وإصدار الفواتير اللحظية وإشعارات الشحن' }
    ];

    packages = {
      mvp: {
        title: 'باقة المتجر الأساسي السريع (Starter Store)',
        costEGP: 20000,
        costUSD: 425,
        weeks: 2,
        desc: 'النسخة الأساسية لإطلاق متجرك وعرض المنتجات وبدء البيع واستقبال المدفوعات بأقل تكلفة',
        keyDeliverables: [
          isWebOnly ? 'متجر ويب متجاوب مع كافة الشاشات' : 'تطبيق موبايل موحد للعملاء (Android & iOS)',
          'كتالوج منتجات أساسي وسلة مشتريات',
          'بوابة دفع إلكتروني محلية واحدة بالإضافة للدفع عند الاستلام',
          'لوحة إدارة مصغرة لمتابعة وتحديث حالات الطلبات'
        ]
      },
      pro: {
        title: 'باقة المتجر الاحترافي المتكامل (Pro E-Commerce Store)',
        costEGP: 28000,
        costUSD: 595,
        weeks: 4,
        desc: 'المنظومة الاحترافية المتكاملة مع إدارة متقدمة للمخزون وبوابات دفع متعددة وتقارير مبيعات',
        keyDeliverables: [
          isWebOnly ? 'متجر ويب احترافي متقدم فائق السرعة' : 'تطبيقات الجوال (iOS & Android) ولوحة الإدارة المركزية',
          'إدارة شاملة للمخزون والمنتجات والخصومات والعروض الترويجية',
          'بوابات دفع متعددة (فيزا، ماستركارد، محافظ إلكترونية، وإنستاباي)',
          'نظام الفواتير الإلكترونية والربط مع شركات الشحن',
          'دعم فني وصيانة مجانية لمدة 3 أشهر'
        ]
      },
      enterprise: {
        title: 'باقة المتاجر الكبرى والنمو السريع (Enterprise Commerce)',
        costEGP: 45000,
        costUSD: 957,
        weeks: 5,
        desc: 'حلول تجارة رقمية متقدمة بميزات تسويقية ذكية وبرامج ولاء وسيرفرات مخصصة لحجم مبيعات ضخم',
        keyDeliverables: [
          'متجر ويب وتطبيقات هاتف ذكي موحدة ومتزامنة بالكامل',
          'برامج نقاط ومكافآت (Loyalty Points) ومحفظة رصيد للعملاء',
          'تكامل متقدم مع أنظمة الـ ERP والمخازن المحاسبية',
          'معمارية سحابية عالية التحمل لآلاف المعاملات المتزامنة',
          'دعم فني وتطوير مستمر لمدة 6 أشهر مع اتفاقية SLA'
        ]
      }
    };
  } else {
    // TIER 4: Multi-Sided Platforms & On-Demand Ecosystems
    const baseCostEGP = 45000;
    const platformAddonEGP = Math.max(0, (platforms.length - 2)) * 6000;
    const featuresAddonEGP = (ent.hasMaps ? 3000 : 0) + (ent.hasAI ? 4000 : 0) + (ent.hasVideo ? 4000 : 0) + (ent.isAuction ? 4000 : 0);
    totalCostEGP = baseCostEGP + platformAddonEGP + featuresAddonEGP;
    totalCostUSD = Math.round(totalCostEGP / 47);
    timelineWeeks = platforms.length >= 4 ? 10 : 8;

    techStack = {
      mobile: 'React Native (Expo) - كود موحد عالي السرعة للأندرويد والآيفون مع دعم Background Location',
      web: 'Next.js 14 / React.js مع Tailwind CSS للوحة الإدارة الفائقة',
      backend: 'Node.js & Express.js مع معمارية Modular سهلة التوسع',
      realtime: 'Socket.io & Redis Pub/Sub للتتبع والمزامنة اللحظية بالثواني',
      database: 'PostgreSQL / SQLite مع Prisma ORM للسرعة والأمان العالي',
      maps: 'Google Maps Platform / Mapbox للتتبع الدقيق وحساب المسافات',
      payments: 'Paymob / Vodafone Cash / InstaPay للمدفوعات الرقمية',
      devops: 'سيرفر سحابي محمي بجدار ناري وشهادة SSL كاملة ونسخ احتياطي يومي',
      aiVision: ent.isPharmacy ? 'محرك Vision OCR الذكي لقراءة وتفسير الروشتات المكتوبة' : null
    };

    systemArchitecture = {
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
    };

    milestones = [
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
    ];

    budgetItems = [
      { category: 'تصميم تجربة وواجهات المستخدم (UI/UX Design)', costEGP: Math.round(totalCostEGP * 0.22), costUSD: Math.round(totalCostUSD * 0.22), desc: 'تصميم تفاعلي كامل لكافة شاشات المنصات على Figma' },
      { category: 'تطوير الباك إند وقواعد البيانات والـ APIs', costEGP: Math.round(totalCostEGP * 0.33), costUSD: Math.round(totalCostUSD * 0.33), desc: 'الخوادم، المقابس اللحظية، محرك الخرائط، وبوابات الدفع' },
      { category: 'برمجة وتطوير تطبيقات الموبايل الموحدة', costEGP: Math.round(totalCostEGP * 0.30), costUSD: Math.round(totalCostUSD * 0.30), desc: 'تطبيقات أندرويد وآيفون بأحدث تقنيات React Native' },
      { category: 'لوحة التحكم السحابية المركزية (Super Admin)', costEGP: Math.round(totalCostEGP * 0.15), costUSD: Math.round(totalCostUSD * 0.15), desc: 'لوحة ويب سحابية شاملة للتحكم في العمليات والتقارير المالية' }
    ];

    annualOperationalEstimate = {
      appleDeveloper: 'حساب مطور Apple App Store: $99 سنوياً (يدفع لشركة Apple مباشرة لرفع وتحديث تطبيق iOS في متجر التطبيقات)',
      googlePlay: 'حساب مطور Google Play Console: $25 تدفع لمرة واحدة مدى الحياة (لشركة Google لنشر تطبيقات أندرويد)',
      hosting: 'استضافة سحابية VPS وسيرفر: تبدأ من $15 - $25 شهرياً (تدفع لمزود السحابة وفق الاستهلاك الفعلي)',
      domainSsl: 'اسم النطاق الدولي (.com) وشهادة التشفير SSL: حوالي $12 - $15 سنوياً',
      mapsApi: 'خرائط جوجل وتحديد المواقع: رصيد مجاني شهري $200 من Google Cloud يغطي آلاف العمليات مجاناً',
      paymentGateways: 'بوابات الدفع الإلكتروني (Paymob / فيزا): 0 رسوم تأسيس أو اشتراك، اقتطاع 2.5% فقط عند العمليات الناجحة'
    };

    paymentPlan = [
      { milestone: 'الدفعة الأولى (40%)', desc: 'عند توقيع العقد والبدء في التصميم وهندسة واجهات وتجربة المستخدم' },
      { milestone: 'الدفعة الثانية (30%)', desc: 'عند تسليم النسخة التجريبية الحية (Staging Preview) واكتمال الخوادم' },
      { milestone: 'الدفعة النهائية (30%)', desc: 'عند الاعتماد النهائي، تسليم الكود المصدري ورفع التطبيقات للمتاجر الرسمية' }
    ];

    feasibilityScore = ent.isPharmacy ? 92 : ent.isFood ? 86 : ent.isRide ? 84 : ent.isAuction ? 89 : ent.isEcommerce ? 88 : 87;
    feasibilityAnalysis = 'تحليل الجدوى السوقية والتقنية: فكرة المشروع تتميز بطلب حقيقي ومرتفع في السوق المستهدف. التحدي الأساسي يكمن في سرعة الاستجابة وتجربة المستخدم الموحدة، وهو ما تعالجه معمارية Apex من خلال تقنيات التزامن اللحظي وتقليل التكلفة التشغيلية بنسبة 40% مقارنة بالحلول التقليدية.';
    competitors = ent.isPharmacy ? [
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
    ];

    packages = {
      mvp: {
        title: 'باقة إطلاق النموذج الأولي (MVP - الأقل تكلفة)',
        costEGP: Math.round(totalCostEGP * 0.65),
        costUSD: Math.round(totalCostUSD * 0.65),
        weeks: Math.max(4, Math.round(timelineWeeks * 0.5)),
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
    };
  }

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
    systemArchitecture,
    techStack,
    timelineWeeks,
    milestones,
    budgetBreakdown: {
      currencyEGP: totalCostEGP,
      currencyUSD: totalCostUSD,
      items: budgetItems,
      annualOperationalEstimate
    },
    paymentPlan,
    feasibilityScore,
    feasibilityAnalysis,
    competitors,
    packages
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
  const serverGeminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  const serverOpenaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;

  const geminiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : serverGeminiKey;
  const openaiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : serverOpenaiKey;

  // 1. If Gemini is requested & key available -> Call Gemini Flash
  if (activeProvider === 'gemini') {
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        return await callGeminiAI(prompt, geminiKey.trim(), lang);
      } catch (err) {
        console.warn('Gemini AI call failed with primary key:', err.message);
        if (serverGeminiKey && serverGeminiKey !== geminiKey) {
          try {
            console.log('Retrying analyzeProjectPrompt with server default Gemini key...');
            return await callGeminiAI(prompt, serverGeminiKey.trim(), lang);
          } catch (e2) {
            console.warn('Gemini AI server key retry also failed:', e2.message);
          }
        }
      }
    }
  }

  // 2. If OpenAI is requested & key available -> Call OpenAI
  if (activeProvider === 'openai') {
    if (openaiKey && openaiKey.trim().length > 10) {
      try {
        return await callOpenAI(prompt, openaiKey.trim(), lang);
      } catch (err) {
        console.warn('OpenAI call failed with primary key:', err.message);
        if (serverOpenaiKey && serverOpenaiKey !== openaiKey) {
          try {
            return await callOpenAI(prompt, serverOpenaiKey.trim(), lang);
          } catch (e2) {
            console.warn('OpenAI server key retry also failed:', e2.message);
          }
        }
      }
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
      'gemini-3.8-flash',
      'gemini-3.5-transcribe',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash'
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
