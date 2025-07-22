# 🗄️ دليل إعداد واستخدام SQLite - نظام إدارة الحضور

## 🎯 نظرة عامة

تم تحويل النظام بالكامل من MySQL إلى SQLite لتوفير:
- ✅ **سهولة الإعداد** - لا حاجة لخادم قاعدة بيانات منفصل
- ✅ **أداء ممتاز** - قاعدة بيانات محلية سريعة
- ✅ **نقل سهل** - ملف واحد يحتوي على كامل البيانات
- ✅ **موثوقية عالية** - SQLite مستقر ومختبر على نطاق واسع
- ✅ **لا حاجة لـ XAMPP** - يعمل بشكل مستقل

## 📋 المتطلبات الأساسية

### البرامج المطلوبة:
- **Node.js** (الإصدار 16 أو أحدث)
- **متصفح ويب** (Chrome أو Firefox)

### ملاحظة مهمة:
❌ **لا حاجة لـ XAMPP أو MySQL بعد الآن!**
✅ **SQLite يعمل بشكل مستقل تماماً**

## 🚀 خطوات الإعداد السريع

### الخطوة 1: تثبيت المكتبات
```bash
npm install
```

### الخطوة 2: إعداد قاعدة البيانات
```bash
npm run db:setup
```

### الخطوة 3: تشغيل النظام
```bash
npm run dev:full
```

## 🔧 الأوامر المتاحة

### إدارة قاعدة البيانات:
```bash
# إعداد قاعدة البيانات من الصفر
npm run db:setup

# اختبار قاعدة البيانات
npm run db:test

# إنشاء نسخة احتياطية
npm run db:backup

# استعادة نسخة احتياطية
npm run db:restore

# عرض إحصائيات قاعدة البيانات
npm run db:stats
```

### تشغيل النظام:
```bash
# تشغيل كامل (الخادم الخلفي والواجهة الأمامية)
npm run dev:full

# تشغيل الخادم الخلفي فقط
npm run dev:server

# تشغيل الواجهة الأمامية فقط
npm run dev

# تشغيل الإنتاج
npm start
```

### إدارة الواتساب:
```bash
# تهيئة الواتساب
npm run whatsapp:init

# اختبار الواتساب
npm run whatsapp:test

# تنظيف ملفات الواتساب
npm run whatsapp:clean

# فحص حالة الواتساب
npm run whatsapp:status
```

## 📁 هيكل الملفات الجديد

```
attendance-system/
├── database/
│   ├── attendance_system.db      # ملف قاعدة البيانات الرئيسي
│   └── sqlite_schema.sql         # هيكل قاعدة البيانات
├── backups/                      # النسخ الاحتياطية
│   └── attendance_backup_*.db
├── server/
│   ├── config/
│   │   └── database.js           # إعدادات SQLite
│   └── ...
├── scripts/
│   ├── setup-sqlite.js          # سكريبت إعداد قاعدة البيانات
│   └── ...
└── ...
```

## 🔐 بيانات الدخول الافتراضية

### المدير العام:
- **اسم المستخدم:** `admin`
- **كلمة المرور:** `admin123`

### المشرف الأول:
- **اسم المستخدم:** `supervisor1`
- **كلمة المرور:** `admin123`

### المشرف الثاني:
- **اسم المستخدم:** `supervisor2`
- **كلمة المرور:** `admin123`

## 🌐 الوصول للنظام

- **النظام الكامل:** `http://localhost:5173`
- **API الخلفي:** `http://localhost:3001/api`

## 💾 إدارة النسخ الاحتياطية

### إنشاء نسخة احتياطية:
```bash
# نسخة احتياطية تلقائية
npm run db:backup

# نسخة احتياطية يدوية
cp database/attendance_system.db backups/manual_backup_$(date +%Y%m%d_%H%M%S).db
```

### استعادة نسخة احتياطية:
```bash
# استعادة آخر نسخة احتياطية
npm run db:restore

# استعادة نسخة محددة
cp backups/attendance_backup_20240121_143022.db database/attendance_system.db
```

## 🔧 استكشاف الأخطاء وحلها

### مشكلة: خطأ في فتح قاعدة البيانات
```
Error: SQLITE_CANTOPEN: unable to open database file
```
**الحل:**
```bash
# التحقق من الصلاحيات
chmod 755 database/
chmod 644 database/attendance_system.db

# إعادة إنشاء قاعدة البيانات
rm database/attendance_system.db
npm run db:setup
```

### مشكلة: قاعدة البيانات مقفلة
```
Error: SQLITE_BUSY: database is locked
```
**الحل:**
```bash
# إيقاف جميع العمليات
pkill -f "node.*server"

# إعادة تشغيل النظام
npm run dev:full
```

### مشكلة: بيانات مفقودة
```
Error: no such table: users
```
**الحل:**
```bash
# إعادة إعداد قاعدة البيانات
npm run db:setup
```

## 📊 مراقبة الأداء

### إحصائيات قاعدة البيانات:
```bash
# عرض إحصائيات مفصلة
npm run db:stats
```

### مراقبة حجم قاعدة البيانات:
```bash
# عرض حجم الملف
ls -lh database/attendance_system.db

# عرض إحصائيات SQLite
sqlite3 database/attendance_system.db ".dbinfo"
```

### تحسين الأداء:
```bash
# تحسين قاعدة البيانات
sqlite3 database/attendance_system.db "VACUUM;"
sqlite3 database/attendance_system.db "ANALYZE;"
```

## 🔒 الأمان والحماية

### حماية ملف قاعدة البيانات:
```bash
# تعيين صلاحيات آمنة
chmod 600 database/attendance_system.db
chown $USER:$USER database/attendance_system.db
```

### تشفير قاعدة البيانات (اختياري):
```bash
# تثبيت SQLCipher للتشفير
npm install sqlite3-cipher

# تشفير قاعدة البيانات
sqlite3 database/attendance_system.db "PRAGMA key = 'your-encryption-key';"
```

### نسخ احتياطية آمنة:
```bash
# نسخة احتياطية مشفرة
tar -czf - database/ | gpg -c > backup_$(date +%Y%m%d).tar.gz.gpg
```

## 🚀 نشر النظام

### للنشر المحلي:
```bash
# بناء النظام
npm run build

# تشغيل الإنتاج
npm start
```

### للنشر على خادم:
```bash
# نسخ الملفات المطلوبة
rsync -av --exclude node_modules . user@server:/path/to/app/

# على الخادم
npm install --production
npm run db:setup
npm start
```

## 🔄 الترحيل من MySQL

إذا كان لديك بيانات في MySQL وتريد ترحيلها:

### الخطوة 1: تصدير البيانات من MySQL
```bash
mysqldump -u root -p attendance_system > mysql_backup.sql
```

### الخطوة 2: تحويل البيانات إلى SQLite
```bash
# استخدام أداة التحويل
npm run convert:mysql-to-sqlite mysql_backup.sql
```

### الخطوة 3: التحقق من البيانات
```bash
npm run db:test
```

## 📈 المزايا الجديدة مع SQLite

### 1. **أداء محسن:**
- ✅ استعلامات أسرع للبيانات المحلية
- ✅ لا توجد زمن استجابة شبكة
- ✅ تحسينات تلقائية للفهارس

### 2. **سهولة الإدارة:**
- ✅ ملف واحد يحتوي على كامل البيانات
- ✅ نسخ احتياطية بسيطة (نسخ ملف)
- ✅ لا حاجة لإدارة خادم قاعدة بيانات

### 3. **موثوقية عالية:**
- ✅ SQLite مستقر ومختبر
- ✅ دعم المعاملات الكاملة
- ✅ استرداد تلقائي من الأخطاء

### 4. **نقل سهل:**
- ✅ نسخ المشروع بالكامل بنسخ مجلد واحد
- ✅ لا حاجة لإعداد قاعدة بيانات منفصلة
- ✅ يعمل على أي نظام تشغيل

## 🛠️ أدوات إضافية

### عارض قاعدة البيانات:
```bash
# تثبيت أداة عرض SQLite
npm install -g sqlite-web

# تشغيل عارض الويب
sqlite-web database/attendance_system.db
```

### أدوات سطر الأوامر:
```bash
# الدخول إلى SQLite CLI
sqlite3 database/attendance_system.db

# عرض الجداول
.tables

# عرض هيكل جدول
.schema users

# تصدير البيانات
.output backup.sql
.dump

# الخروج
.quit
```

## 📞 الدعم الفني

### في حالة مواجهة مشاكل:

1. **تحقق من سجلات الأخطاء:**
   ```bash
   tail -f logs/error.log
   ```

2. **إعادة إعداد قاعدة البيانات:**
   ```bash
   npm run db:setup
   ```

3. **اختبار النظام:**
   ```bash
   npm run db:test
   ```

4. **التحقق من الصلاحيات:**
   ```bash
   ls -la database/
   ```

---

## ✅ قائمة التحقق النهائية

- [ ] Node.js مثبت (الإصدار 16+)
- [ ] المكتبات مثبتة (`npm install`)
- [ ] قاعدة البيانات مُعدة (`npm run db:setup`)
- [ ] اختبار النظام (`npm run db:test`)
- [ ] النظام يعمل (`npm run dev:full`)
- [ ] يمكن الوصول للنظام على `http://localhost:5173`
- [ ] تسجيل الدخول يعمل
- [ ] النسخ الاحتياطية مُعدة

## 🎉 تهانينا!

أصبح لديك الآن نظام إدارة حضور متكامل يعمل بـ SQLite!

**المزايا الجديدة:**
- 🚀 **أسرع في التشغيل** - لا حاجة لـ XAMPP
- 💾 **أسهل في النسخ الاحتياطي** - ملف واحد فقط
- 🔧 **أبسط في الصيانة** - لا حاجة لإدارة خادم
- 📦 **أسهل في النشر** - نسخ مجلد واحد

**استمتع بالنظام الجديد! 🚀✨**

---

**تطوير:** Ahmed Hosny | **هاتف:** 01272774494 - 01002246668 | **بريد إلكتروني:** Sales@GO4Host.net