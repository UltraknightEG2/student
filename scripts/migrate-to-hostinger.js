const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../server/config/database');

async function migrateToHostinger() {
  console.log('🚀 بدء ترحيل البيانات إلى Hostinger...');
  console.log('=' .repeat(60));
  
  try {
    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, '../supabase/migrations/20250721200104_ivory_band.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error('ملف SQL غير موجود: ' + sqlFile);
    }
    
    console.log('📖 قراءة ملف SQL...');
    let sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // تنظيف SQL للتوافق مع Hostinger
    console.log('🧹 تنظيف SQL للتوافق مع Hostinger...');
    
    // إزالة أوامر إنشاء قاعدة البيانات (Hostinger لا يسمح بها)
    sqlContent = sqlContent.replace(/CREATE DATABASE.*?;/gi, '');
    sqlContent = sqlContent.replace(/USE\s+\w+\s*;/gi, '');
    
    // إزالة أوامر SET FOREIGN_KEY_CHECKS (قد لا تكون مدعومة)
    sqlContent = sqlContent.replace(/SET FOREIGN_KEY_CHECKS\s*=\s*[01]\s*;/gi, '');
    
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
        
        await executeQuery(command);
        successCount++;
        
        // انتظار قصير بين الأوامر لتجنب إرهاق الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في الأمر ${i + 1}:`, error.message);
        
        // تسجيل الأمر الذي فشل
        console.error(`   📝 الأمر الفاشل: ${command.substring(0, 200)}...`);
        
        // إيقاف التنفيذ في حالة أخطاء حرجة
        if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_DBACCESS_DENIED_ERROR') {
          throw new Error('خطأ في الصلاحيات - توقف التنفيذ');
        }
      }
    }
    
    console.log('\n📊 ملخص الترحيل:');
    console.log(`✅ نجح: ${successCount} أمر`);
    console.log(`❌ فشل: ${errorCount} أمر`);
    
    if (errorCount === 0) {
      console.log('\n🎉 تم ترحيل البيانات بنجاح إلى Hostinger!');
    } else {
      console.log('\n⚠️ تم الترحيل مع بعض الأخطاء. راجع الأخطاء أعلاه.');
    }
    
    // اختبار نهائي
    console.log('\n🧪 اختبار نهائي...');
    const tables = await executeQuery('SHOW TABLES');
    console.log(`📋 تم إنشاء ${tables.length} جدول`);
    
    // اختبار البيانات
    const users = await executeQuery('SELECT COUNT(*) as count FROM users');
    console.log(`👥 عدد المستخدمين: ${users[0].count}`);
    
    console.log('\n✅ اكتمل الترحيل!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ فشل في ترحيل البيانات:', error.message);
    console.log('\n💡 نصائح لحل المشكلة:');
    console.log('   1. تحقق من صحة بيانات الاتصال في .env');
    console.log('   2. تأكد من وجود صلاحيات كافية للمستخدم');
    console.log('   3. تحقق من حالة الاتصال بالإنترنت');
    console.log('   4. راجع سجلات Hostinger للأخطاء');
    process.exit(1);
  }
}

if (require.main === module) {
  migrateToHostinger();
}

module.exports = migrateToHostinger;