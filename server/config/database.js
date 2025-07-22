const mysql = require('mysql2/promise');
require('dotenv').config();

// التحقق من نوع قاعدة البيانات (محلية أم Hostinger)
const isHostinger = process.env.DB_HOST && process.env.DB_HOST.includes('hostinger');

console.log('🔧 إعدادات قاعدة البيانات:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[محدد]' : '[فارغ]');
console.log('🌐 نوع الاتصال:', isHostinger ? 'Hostinger (سحابي)' : 'محلي (XAMPP)');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_system',
  port: parseInt(process.env.DB_PORT) || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  
  // إعدادات SSL للاتصال الآمن (Hostinger)
  ssl: isHostinger ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false,
  
  // إعدادات محسنة للاستضافة السحابية
  ...(isHostinger && {
    connectionLimit: 5, // أقل للاستضافة المشتركة
    queueLimit: 0,
    waitForConnections: true,
    flags: [
      'SECURE_CONNECTION',
      'PROTOCOL_41',
      'TRANSACTIONS',
      'RESERVED',
      'MULTI_RESULTS'
    ]
  })
};

// إنشاء pool للاتصالات
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: isHostinger ? 5 : 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// معالجة أحداث Pool
pool.on('connection', function (connection) {
  console.log(`🔗 اتصال جديد بقاعدة البيانات ${isHostinger ? '(Hostinger)' : '(محلي)'}:`, connection.threadId);
});

pool.on('error', function(err) {
  console.error(`❌ خطأ في pool قاعدة البيانات ${isHostinger ? '(Hostinger)' : '(محلي)'}:`, err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 محاولة إعادة الاتصال...');
  } else {
    throw err;
  }
});

// اختبار الاتصال
async function testConnection() {
  try {
    console.log(`🧪 اختبار الاتصال بقاعدة البيانات ${isHostinger ? '(Hostinger)' : '(محلي)'}...`);
    const connection = await pool.getConnection();
    
    // اختبار استعلام بسيط
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time, DATABASE() as current_db, USER() as current_user');
    console.log('📊 نتيجة الاختبار:', rows);
    
    console.log(`✅ تم الاتصال بقاعدة البيانات ${isHostinger ? '(Hostinger)' : '(محلي)'} بنجاح`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`❌ خطأ في الاتصال بقاعدة البيانات ${isHostinger ? '(Hostinger)' : '(محلي)'}:`, error);
    console.error('تفاصيل الخطأ:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    console.error('   الرسالة:', error.message);
    console.error('   الكود:', error.code);
    console.error('   errno:', error.errno);
    
    // معالجة أخطاء مخصصة حسب نوع الاتصال
    if (isHostinger) {
      if (error.code === 'ENOTFOUND') {
        console.log('💡 نصيحة: تحقق من عنوان الخادم (Host) في إعدادات Hostinger');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('💡 نصيحة: تحقق من اسم المستخدم وكلمة المرور في لوحة تحكم Hostinger');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.log('💡 نصيحة: تأكد من إنشاء قاعدة البيانات في لوحة تحكم Hostinger');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('💡 نصيحة: مشكلة في الشبكة أو إعدادات Firewall');
      }
    } else {
      if (error.code === 'ER_BAD_DB_ERROR') {
        console.log('💡 نصيحة: تأكد من إنشاء قاعدة البيانات attendance_system في phpMyAdmin');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('💡 نصيحة: تأكد من تشغيل MySQL في XAMPP');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('💡 نصيحة: تحقق من اسم المستخدم وكلمة المرور في ملف .env');
      }
    }
    
    if (!isHostinger) {
      console.log('🛑 إيقاف الخادم بسبب فشل الاتصال بقاعدة البيانات');
      process.exit(1);
    }
    
    return false;
  }
}

// دالة تنفيذ الاستعلامات مع معالجة أخطاء محسنة
async function executeQuery(query, params = []) {
  let connection;
  try {
    console.log('🔍 تنفيذ الاستعلام:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    console.log('📊 المعاملات:', params);
    
    connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    
    if (Array.isArray(results)) {
      console.log('✅ نتائج الاستعلام: تم جلب', results.length, 'صف');
    } else {
      console.log('✅ نتائج الاستعلام:', results.affectedRows || 'تم التنفيذ');
    }
    
    return results;
  } catch (error) {
    console.error('❌ خطأ في تنفيذ الاستعلام:', error);
    console.error('📝 الاستعلام:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
    console.error('📊 المعاملات:', params);
    console.error('تفاصيل الخطأ:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    // معالجة أخطاء Hostinger الشائعة
    if (isHostinger) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('البيانات مكررة - يرجى التحقق من القيم المدخلة');
      } else if (error.code === 'ER_NO_SUCH_TABLE') {
        throw new Error('الجدول غير موجود - يرجى التحقق من إعداد قاعدة البيانات');
      } else if (error.code === 'ER_BAD_FIELD_ERROR') {
        throw new Error('عمود غير موجود - يرجى التحقق من هيكل قاعدة البيانات');
      } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        throw new Error('انتهت مهلة انتظار القفل - يرجى المحاولة مرة أخرى');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 نصيحة: تأكد من تشغيل MySQL في XAMPP');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 نصيحة: تحقق من اسم المستخدم وكلمة المرور في ملف .env');
    }
    
    // تحسين رسائل الخطأ للكلمات المحجوزة
    if (error.code === 'ER_PARSE_ERROR' && error.sqlMessage && error.sqlMessage.includes('timestamp')) {
      console.error('💡 نصيحة: يبدو أن هناك مشكلة مع كلمة محجوزة "timestamp". تأكد من استخدام قاعدة البيانات المصححة.');
    }
    
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// دالة تنفيذ المعاملات
async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  executeQuery,
  executeTransaction,
  testConnection
};