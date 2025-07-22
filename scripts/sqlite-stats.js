const { executeQuery } = require('../server/config/database');
const fs = require('fs');
const path = require('path');

function getSQLiteStats() {
  console.log('📊 إحصائيات قاعدة بيانات SQLite');
  console.log('=' .repeat(50));
  
  try {
    // معلومات الملف
    const dbPath = path.join(__dirname, '../database/attendance_system.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const lastModified = stats.mtime.toLocaleString('en-GB');
      
      console.log('📁 معلومات الملف:');
      console.log(`   📍 المسار: ${dbPath}`);
      console.log(`   📊 الحجم: ${fileSizeInMB} MB`);
      console.log(`   📅 آخر تعديل: ${lastModified}`);
    }
    
    // إحصائيات الجداول
    console.log('\n📋 إحصائيات الجداول:');
    const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    
    for (const table of tables) {
      const tableName = table.name;
      try {
        const count = executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   📊 ${tableName}: ${count[0].count} سجل`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: خطأ في العد`);
      }
    }
    
    // إحصائيات مفصلة للجداول الرئيسية
    console.log('\n📈 إحصائيات مفصلة:');
    
    // المستخدمين
    const activeUsers = executeQuery('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const totalUsers = executeQuery('SELECT COUNT(*) as count FROM users');
    console.log(`   👥 المستخدمين: ${activeUsers[0].count} نشط من أصل ${totalUsers[0].count}`);
    
    // الطلاب
    const activeStudents = executeQuery('SELECT COUNT(*) as count FROM students WHERE is_active = 1');
    const totalStudents = executeQuery('SELECT COUNT(*) as count FROM students');
    console.log(`   🎓 الطلاب: ${activeStudents[0].count} نشط من أصل ${totalStudents[0].count}`);
    
    // الفصول
    const activeClasses = executeQuery('SELECT COUNT(*) as count FROM classes WHERE is_active = 1');
    const totalClasses = executeQuery('SELECT COUNT(*) as count FROM classes');
    console.log(`   📚 الفصول: ${activeClasses[0].count} نشط من أصل ${totalClasses[0].count}`);
    
    // الجلسات حسب الحالة
    const sessionStats = executeQuery(`
      SELECT status, COUNT(*) as count 
      FROM sessions 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('   📅 الجلسات حسب الحالة:');
    sessionStats.forEach(stat => {
      const statusText = {
        'scheduled': 'مجدولة',
        'active': 'نشطة',
        'completed': 'مكتملة',
        'cancelled': 'ملغاة'
      }[stat.status] || stat.status;
      console.log(`      ${statusText}: ${stat.count}`);
    });
    
    // الحضور حسب الحالة
    const attendanceStats = executeQuery(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('   ✅ الحضور حسب الحالة:');
    attendanceStats.forEach(stat => {
      const statusText = {
        'present': 'حاضر',
        'absent': 'غائب',
        'late': 'متأخر',
        'excused': 'معذور'
      }[stat.status] || stat.status;
      console.log(`      ${statusText}: ${stat.count}`);
    });
    
    // إحصائيات الواتساب
    const whatsappStats = executeQuery(`
      SELECT status, COUNT(*) as count 
      FROM whatsapp_logs 
      GROUP BY status 
      ORDER BY count DESC
    `);
    if (whatsappStats.length > 0) {
      console.log('   📱 رسائل الواتساب حسب الحالة:');
      whatsappStats.forEach(stat => {
        const statusText = {
          'sent': 'مرسل',
          'failed': 'فشل',
          'delivered': 'تم التسليم',
          'read': 'تم القراءة',
          'pending': 'في الانتظار'
        }[stat.status] || stat.status;
        console.log(`      ${statusText}: ${stat.count}`);
      });
    }
    
    // معلومات قاعدة البيانات
    console.log('\n🔧 معلومات قاعدة البيانات:');
    const dbInfo = executeQuery('PRAGMA database_list');
    console.log(`   📂 اسم قاعدة البيانات: ${dbInfo[0].name}`);
    console.log(`   📍 مسار الملف: ${dbInfo[0].file}`);
    
    const pageCount = executeQuery('PRAGMA page_count');
    const pageSize = executeQuery('PRAGMA page_size');
    const totalSize = (pageCount[0].page_count * pageSize[0].page_size / 1024 / 1024).toFixed(2);
    console.log(`   📄 عدد الصفحات: ${pageCount[0].page_count}`);
    console.log(`   📏 حجم الصفحة: ${pageSize[0].page_size} بايت`);
    console.log(`   💾 الحجم المحسوب: ${totalSize} MB`);
    
    // إعدادات الأداء
    console.log('\n⚡ إعدادات الأداء:');
    const journalMode = executeQuery('PRAGMA journal_mode');
    const synchronous = executeQuery('PRAGMA synchronous');
    const cacheSize = executeQuery('PRAGMA cache_size');
    console.log(`   📝 وضع اليومية: ${journalMode[0].journal_mode}`);
    console.log(`   🔄 التزامن: ${synchronous[0].synchronous}`);
    console.log(`   🧠 حجم التخزين المؤقت: ${Math.abs(cacheSize[0].cache_size)} صفحة`);
    
    // فحص سلامة قاعدة البيانات
    console.log('\n🔍 فحص سلامة قاعدة البيانات:');
    const integrityCheck = executeQuery('PRAGMA integrity_check');
    if (integrityCheck[0].integrity_check === 'ok') {
      console.log('   ✅ قاعدة البيانات سليمة');
    } else {
      console.log('   ⚠️ مشاكل في سلامة قاعدة البيانات:', integrityCheck);
    }
    
    console.log('\n✅ اكتمل عرض الإحصائيات!');
    
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  getSQLiteStats();
}

module.exports = getSQLiteStats;