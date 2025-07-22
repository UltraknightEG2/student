const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('🗄️ إعداد قاعدة بيانات SQLite...');

// مسار قاعدة البيانات
const dbPath = path.join(__dirname, '../../database/attendance_system.db');
const dbDir = path.dirname(dbPath);

// التأكد من وجود مجلد قاعدة البيانات
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 تم إنشاء مجلد قاعدة البيانات');
}

console.log('📍 مسار قاعدة البيانات:', dbPath);

// إنشاء اتصال قاعدة البيانات
let db;
try {
  db = new Database(dbPath, { 
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    fileMustExist: false
  });
  
  // إعدادات تحسين الأداء
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = 1000000');
  db.pragma('temp_store = memory');
  db.pragma('mmap_size = 268435456'); // 256MB
  
  console.log('✅ تم الاتصال بقاعدة بيانات SQLite بنجاح');
} catch (error) {
  console.error('❌ خطأ في إنشاء قاعدة البيانات:', error);
  process.exit(1);
}

// اختبار الاتصال
async function testConnection() {
  try {
    console.log('🧪 اختبار الاتصال بقاعدة البيانات SQLite...');
    
    const result = db.prepare('SELECT 1 as test, datetime("now") as server_time').get();
    console.log('📊 نتيجة الاختبار:', result);
    
    // التحقق من وجود الجداول
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('📋 الجداول الموجودة:', tables.length);
    
    if (tables.length === 0) {
      console.log('⚠️ لا توجد جداول - يجب تشغيل إعداد قاعدة البيانات');
      return false;
    }
    
    console.log('✅ تم اختبار الاتصال بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار الاتصال:', error);
    return false;
  }
}

// دالة تنفيذ الاستعلامات
function executeQuery(query, params = []) {
  try {
    console.log('🔍 تنفيذ الاستعلام:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    console.log('📊 المعاملات:', params);
    
    // تحديد نوع الاستعلام
    const queryType = query.trim().toUpperCase();
    
    if (queryType.startsWith('SELECT')) {
      // استعلام SELECT
      const stmt = db.prepare(query);
      const results = stmt.all(params);
      console.log('✅ نتائج الاستعلام: تم جلب', results.length, 'صف');
      return results;
    } else if (queryType.startsWith('INSERT')) {
      // استعلام INSERT
      const stmt = db.prepare(query);
      const result = stmt.run(params);
      console.log('✅ نتائج الاستعلام: تم إدراج صف جديد، ID:', result.lastInsertRowid);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    } else if (queryType.startsWith('UPDATE') || queryType.startsWith('DELETE')) {
      // استعلام UPDATE أو DELETE
      const stmt = db.prepare(query);
      const result = stmt.run(params);
      console.log('✅ نتائج الاستعلام: تم تعديل', result.changes, 'صف');
      return { affectedRows: result.changes };
    } else {
      // استعلامات أخرى (CREATE, DROP, etc.)
      const stmt = db.prepare(query);
      const result = stmt.run(params);
      console.log('✅ تم تنفيذ الاستعلام بنجاح');
      return result;
    }
  } catch (error) {
    console.error('❌ خطأ في تنفيذ الاستعلام:', error);
    console.error('📝 الاستعلام:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
    console.error('📊 المعاملات:', params);
    
    // تحسين رسائل الخطأ
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('البيانات مكررة - يرجى التحقق من القيم المدخلة');
    } else if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
      throw new Error('الجدول غير موجود - يرجى التحقق من إعداد قاعدة البيانات');
    } else if (error.code === 'SQLITE_ERROR' && error.message.includes('no such column')) {
      throw new Error('العمود غير موجود - يرجى التحقق من هيكل قاعدة البيانات');
    }
    
    throw error;
  }
}

// دالة تنفيذ المعاملات
function executeTransaction(queries) {
  const transaction = db.transaction(() => {
    const results = [];
    for (const { query, params } of queries) {
      const result = executeQuery(query, params || []);
      results.push(result);
    }
    return results;
  });
  
  return transaction();
}

// دالة إنشاء النسخ الاحتياطية
function createBackup() {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `attendance_backup_${timestamp}.db`);
    
    // نسخ ملف قاعدة البيانات
    fs.copyFileSync(dbPath, backupPath);
    
    console.log('💾 تم إنشاء نسخة احتياطية:', backupPath);
    return backupPath;
  } catch (error) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
    throw error;
  }
}

// دالة إغلاق قاعدة البيانات بأمان
function closeDatabase() {
  try {
    if (db) {
      db.close();
      console.log('🔒 تم إغلاق قاعدة البيانات بأمان');
    }
  } catch (error) {
    console.error('❌ خطأ في إغلاق قاعدة البيانات:', error);
  }
}

// معالجة إغلاق التطبيق
process.on('SIGINT', () => {
  console.log('\n🛑 إيقاف النظام...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 إيقاف النظام...');
  closeDatabase();
  process.exit(0);
});

module.exports = {
  db,
  executeQuery,
  executeTransaction,
  testConnection,
  createBackup,
  closeDatabase
};