const { testConnection, executeQuery } = require('../server/config/database');

async function testDatabase() {
  console.log('🧪 بدء اختبار قاعدة البيانات...');
  console.log('=' .repeat(50));
  
  try {
    // اختبار الاتصال
    console.log('1️⃣ اختبار الاتصال الأساسي...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('❌ فشل في الاتصال بقاعدة البيانات');
      process.exit(1);
    }
    
    // اختبار الجداول
    console.log('\n2️⃣ اختبار وجود الجداول...');
    const tables = await executeQuery('SHOW TABLES');
    console.log('📋 الجداول الموجودة:', tables.length);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   ✅ ${tableName}`);
    });
    
    // اختبار البيانات
    console.log('\n3️⃣ اختبار البيانات...');
    const users = await executeQuery('SELECT COUNT(*) as count FROM users');
    const students = await executeQuery('SELECT COUNT(*) as count FROM students');
    const classes = await executeQuery('SELECT COUNT(*) as count FROM classes');
    const sessions = await executeQuery('SELECT COUNT(*) as count FROM sessions');
    
    console.log('📊 إحصائيات البيانات:');
    console.log(`   👥 المستخدمين: ${users[0].count}`);
    console.log(`   🎓 الطلاب: ${students[0].count}`);
    console.log(`   📚 الفصول: ${classes[0].count}`);
    console.log(`   📅 الجلسات: ${sessions[0].count}`);
    
    // اختبار المستخدم الافتراضي
    console.log('\n4️⃣ اختبار المستخدم الافتراضي...');
    const adminUser = await executeQuery('SELECT username, name, role FROM users WHERE username = ?', ['admin']);
    if (adminUser.length > 0) {
      console.log('✅ المستخدم الافتراضي موجود:', adminUser[0]);
    } else {
      console.log('⚠️ المستخدم الافتراضي غير موجود');
    }
    
    // اختبار الأداء
    console.log('\n5️⃣ اختبار الأداء...');
    const startTime = Date.now();
    await executeQuery('SELECT * FROM students LIMIT 10');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⚡ وقت الاستجابة: ${responseTime}ms`);
    if (responseTime < 1000) {
      console.log('✅ الأداء ممتاز');
    } else if (responseTime < 3000) {
      console.log('⚠️ الأداء مقبول');
    } else {
      console.log('❌ الأداء بطيء - قد تحتاج لتحسين الاتصال');
    }
    
    console.log('\n🎉 اكتمل اختبار قاعدة البيانات بنجاح!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ فشل اختبار قاعدة البيانات:', error.message);
    console.log('💡 تحقق من:');
    console.log('   - إعدادات .env');
    console.log('   - حالة الاتصال بالإنترنت');
    console.log('   - صحة بيانات قاعدة البيانات');
    process.exit(1);
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = testDatabase;