# Deploy SMART MENU PRO from your phone (free, ~15 minutes)

Everything below works in your phone's browser. No computer needed.

## Part 1 — GitHub (account + token)

1. Open **github.com** in your phone browser and tap **Sign up**.
2. Enter your email, a password, and a username. Verify your email when the code arrives.
3. Tap your **avatar** (top right) → **Settings** → scroll down → **Developer settings**.
4. Tap **Personal access tokens** → **Tokens (classic)** → **Generate new token** → **Generate new token (classic)**.
5. In **Note**, write `deploy`. In the checkboxes, tick **repo** (the first box). Scroll down and tap **Generate token**.
6. **Copy the token** (starts with `ghp_`) and send it through the secure link we give you.
   We upload the full project to a new repo under your account called `smart-menu-pro`.
   (After the upload you can delete the token the same way: Settings → Developer settings → Tokens → Delete.)

*Prefer not to share a token? Any computer works too: create the repo on GitHub, tap "uploading an existing file", drag the unzipped `smart-menu-pro` folder in, and commit.*

## Part 2 — Render (the app goes live)

1. Open **render.com** and tap **Get Started** → **Sign up with GitHub** → authorize.
2. In the dashboard tap **New +** → **Blueprint**.
3. Pick the **smart-menu-pro** repo and tap **Connect** / **Apply**.
   Render reads `render.yaml` and configures everything itself: free plan, build, start command, and a random admin password.
4. Wait about 5 minutes while it builds (you can watch the logs scroll).
5. When the status turns green **Live**, tap the URL at the top (`smart-menu-pro.onrender.com` or similar). Your app is live.

## Admin panel

- Open `your-url/admin` (e.g. `smart-menu-pro.onrender.com/admin`).
- The password is in Render: dashboard → **smart-menu-pro** → **Environment** → **ADMIN_PASSWORD** → tap the eye icon to reveal.

## Free-tier notes (honest limits)

- The free app **sleeps after 15 minutes** with no visitors. The first open after sleep takes about a minute. This is normal.
- On the free plan the database **resets when the app restarts or redeploys** (orders and settings are lost). Fine for testing and demos.
- For real orders: upgrade the service to **Starter ($7/mo)** and add a disk, or ask us to switch the database to **Supabase free tier** (no cost, keeps data). Both are covered in `README.md`.

---

# نشر تطبيق SMART MENU PRO من هاتفك (مجانًا، حوالي ١٥ دقيقة)

كل الخطوات التالية تعمل من متصفح هاتفك. لا حاجة لأي كمبيوتر.

## الجزء الأول — GitHub (حساب + رمز وصول)

1. افتح **github.com** في متصفح هاتفك واضغط **Sign up**.
2. أدخل بريدك الإلكتروني وكلمة مرور واسم مستخدم. فعّل بريدك عند وصول الرمز.
3. اضغط على **صورتك** (أعلى اليمين) → **Settings** → انزل للأسفل → **Developer settings**.
4. اضغط **Personal access tokens** → **Tokens (classic)** → **Generate new token** → **Generate new token (classic)**.
5. في خانة **Note** اكتب `deploy`. في الخيارات، فعّل **repo** (أول خانة). انزل للأسفل واضغط **Generate token**.
6. **انسخ الرمز** (يبدأ بـ `ghp_`) وأرسله عبر الرابط الآمن الذي سنرسله لك.
   سنرفع المشروع كاملًا إلى مستودع جديد باسم `smart-menu-pro` في حسابك.
   (بعد الرفع يمكنك حذف الرمز بنفس الطريقة: Settings → Developer settings → Tokens → Delete.)

*لا تريد مشاركة الرمز؟ أي كمبيوتر يكفي: أنشئ المستودع على GitHub، اضغط "uploading an existing file"، اسحب مجلد `smart-menu-pro` بعد فك ضغطه، ثم Commit.*

## الجزء الثاني — Render (التطبيق يصبح مباشرًا)

1. افتح **render.com** واضغط **Get Started** → **Sign up with GitHub** → وافق على الصلاحيات.
2. في لوحة التحكم اضغط **New +** → **Blueprint**.
3. اختر مستودع **smart-menu-pro** واضغط **Connect** / **Apply**.
   Render يقرأ ملف `render.yaml` ويضبط كل شيء تلقائيًا: الخطة المجانية، البناء، أمر التشغيل، وكلمة مرور عشوائية للوحة التحكم.
4. انتظر حوالي ٥ دقائق أثناء البناء (يمكنك مشاهدة السجلات).
5. عندما تظهر الحالة خضراء **Live**، اضغط الرابط في الأعلى (`smart-menu-pro.onrender.com` أو ما شابه). تطبيقك أصبح مباشرًا.

## لوحة التحكم (Admin)

- افتح `your-url/admin` (مثال: `smart-menu-pro.onrender.com/admin`).
- كلمة المرور موجودة في Render: لوحة التحكم ← **smart-menu-pro** ← **Environment** ← **ADMIN_PASSWORD** ← اضغط أيقونة العين لإظهارها.

## ملاحظات الخطة المجانية (حدود حقيقية)

- التطبيق المجاني **ينام بعد ١٥ دقيقة** بدون زوار. أول فتح بعد النوم يستغرق حوالي دقيقة. هذا طبيعي.
- في الخطة المجانية **تُعاد تهيئة قاعدة البيانات عند إعادة تشغيل التطبيق** (تُفقد الطلبات والإعدادات). مناسب للتجربة والعرض فقط.
- للطلبات الحقيقية: رقِّ الخدمة إلى **Starter (٧$ شهريًا)** وأضف قرصًا، أو اطلب منا تحويل قاعدة البيانات إلى **Supabase المجاني** (بدون تكلفة ويحفظ البيانات). كلاهما مشروح في `README.md`.
