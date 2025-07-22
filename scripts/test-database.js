const { testConnection, executeQuery } = require('../server/config/database');

async function testDatabase() {
  console.log('🧪 بدء اختبار قاعدة بيانات SQLite...');
  console.log('=' .repeat(50));
  
  try {
    // اختبار الاتصال
    console.log('1️⃣ اختبار الاتصال الأساسي...');
    const connected = testConnection();
    
    if (!connected) {
      console.log('❌ فشل في الاتصال بقاعدة البيانات');
      process.exit(1);
    }
    
    // اختبار الجداول
    console.log('\n2️⃣ اختبار وجود الجداول...');
    const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 الجداول الموجودة:', tables.length);
    tables.forEach(table => {
      const tableName = table.name;
      console.log(`   ✅ ${tableName}`);
    });
    
    // اختبار البيانات
    console.log('\n3️⃣ اختبار البيانات...');
    const users = executeQuery('SELECT COUNT(*) as count FROM users');
    const students = executeQuery('SELECT COUNT(*) as count FROM students');
    const classes = executeQuery('SELECT COUNT(*) as count FROM classes');
    const sessions = executeQuery('SELECT COUNT(*) as count FROM sessions');
    
    console.log('📊 إحصائيات البيانات:');
    console.log(`   👥 المستخدمين: ${users[0].count}`);
    console.log(`   🎓 الطلاب: ${students[0].count}`);
    console.log(`   📚 الفصول: ${classes[0].count}`);
    console.log(`   📅 الجلسات: ${sessions[0].count}`);
    
    // اختبار المستخدم الافتراضي
    console.log('\n4️⃣ اختبار المستخدم الافتراضي...');
    const adminUser = executeQuery('SELECT username, name, role FROM users WHERE username = ?', ['admin']);
    if (adminUser.length > 0) {
      console.log('✅ المستخدم الافتراضي موجود:', adminUser[0]);
    } else {
      console.log('⚠️ المستخدم الافتراضي غير موجود');
    }
    
    // اختبار الأداء
    console.log('\n5️⃣ اختبار الأداء...');
    const startTime = Date.now();
    executeQuery('SELECT * FROM students LIMIT 10');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⚡ وقت الاستجابة: ${responseTime}ms`);
    if (responseTime < 100) {
      console.log('✅ الأداء ممتاز');
    } else if (responseTime < 500) {
      console.log('⚠️ الأداء مقبول');
    } else {
      console.log('❌ الأداء بطيء - قد تحتاج لتحسين قاعدة البيانات');
    }
    
    // اختبار سلامة قاعدة البيانات
    console.log('\n6️⃣ اختبار سلامة قاعدة البيانات...');
    const integrityCheck = executeQuery('PRAGMA integrity_check');
    if (integrityCheck[0].integrity_check === 'ok') {
      console.log('✅ قاعدة البيانات سليمة');
    } else {
      console.log('⚠️ مشاكل في سلامة قاعدة البيانات');
    }
    
    console.log('\n🎉 اكتمل اختبار قاعدة بيانات SQLite بنجاح!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ فشل اختبار قاعدة البيانات:', error.message);
    console.log('💡 تحقق من:');
    console.log('   - وجود ملف قاعدة البيانات');
    console.log('   - صلاحيات الوصول للملف');
    console.log('   - تشغيل npm run db:setup أولاً');
    process.exit(1);
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = testDatabase;