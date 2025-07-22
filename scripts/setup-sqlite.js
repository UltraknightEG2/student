const fs = require('fs');
const path = require('path');
const { db, executeQuery, testConnection } = require('../server/config/database');

async function setupSQLite() {
  console.log('🚀 بدء إعداد قاعدة بيانات SQLite...');
  console.log('=' .repeat(60));
  
  try {
    // قراءة ملف SQL Schema
    const schemaFile = path.join(__dirname, '../database/sqlite_schema.sql');
    
    if (!fs.existsSync(schemaFile)) {
      throw new Error('ملف SQLite Schema غير موجود: ' + schemaFile);
    }
    
    console.log('📖 قراءة ملف SQLite Schema...');
    const sqlContent = fs.readFileSync(schemaFile, 'utf8');
    
    // تقسيم SQL إلى أوامر منفصلة
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 تم العثور على ${sqlCommands.length} أمر SQL`);
    
    // تنفيذ الأوامر واحداً تلو الآخر
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // تخطي الأوامر الفارغة أو التعليقات
      if (!command || command.startsWith('--') || command.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`⚡ تنفيذ الأمر ${i + 1}/${sqlCommands.length}...`);
        
        // عرض جزء من الأمر للمراجعة
        const preview = command.substring(0, 100) + (command.length > 100 ? '...' : '');
        console.log(`   📝 ${preview}`);
        
        executeQuery(command);
        successCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في الأمر ${i + 1}:`, error.message);
        
        // تسجيل الأمر الذي فشل
        console.error(`   📝 الأمر الفاشل: ${command.substring(0, 200)}...`);
        
        // إيقاف التنفيذ في حالة أخطاء حرجة
        if (error.code === 'SQLITE_CANTOPEN') {
          throw new Error('لا يمكن فتح قاعدة البيانات - توقف التنفيذ');
        }
      }
    }
    
    console.log('\n📊 ملخص الإعداد:');
    console.log(`✅ نجح: ${successCount} أمر`);
    console.log(`❌ فشل: ${errorCount} أمر`);
    
    if (errorCount === 0) {
      console.log('\n🎉 تم إعداد قاعدة بيانات SQLite بنجاح!');
    } else {
      console.log('\n⚠️ تم الإعداد مع بعض الأخطاء. راجع الأخطاء أعلاه.');
    }
    
    // اختبار نهائي
    console.log('\n🧪 اختبار نهائي...');
    const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(`📋 تم إنشاء ${tables.length} جدول`);
    
    // اختبار البيانات
    const users = executeQuery('SELECT COUNT(*) as count FROM users');
    console.log(`👥 عدد المستخدمين: ${users[0].count}`);
    
    const students = executeQuery('SELECT COUNT(*) as count FROM students');
    console.log(`🎓 عدد الطلاب: ${students[0].count}`);
    
    console.log('\n✅ اكتمل إعداد SQLite!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ فشل في إعداد قاعدة البيانات:', error.message);
    console.log('\n💡 نصائح لحل المشكلة:');
    console.log('   1. تحقق من صلاحيات الكتابة في مجلد database');
    console.log('   2. تأكد من تثبيت better-sqlite3 بشكل صحيح');
    console.log('   3. تحقق من وجود مساحة كافية على القرص');
    process.exit(1);
  }
}

if (require.main === module) {
  setupSQLite();
}

module.exports = setupSQLite;