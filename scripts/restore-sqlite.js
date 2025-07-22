const fs = require('fs');
const path = require('path');

function restoreSQLite(backupFile = null) {
  console.log('🔄 بدء استعادة النسخة الاحتياطية من SQLite...');
  
  try {
    const dbPath = path.join(__dirname, '../database/attendance_system.db');
    const backupDir = path.join(__dirname, '../backups');
    
    let backupPath;
    
    if (backupFile) {
      // استعادة ملف محدد
      backupPath = path.join(backupDir, backupFile);
    } else {
      // البحث عن آخر نسخة احتياطية
      if (!fs.existsSync(backupDir)) {
        throw new Error('مجلد النسخ الاحتياطية غير موجود');
      }
      
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('attendance_backup_') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);
      
      if (backupFiles.length === 0) {
        throw new Error('لا توجد نسخ احتياطية متاحة');
      }
      
      backupPath = backupFiles[0].path;
      console.log('📂 تم العثور على آخر نسخة احتياطية:', backupFiles[0].name);
    }
    
    // التحقق من وجود ملف النسخة الاحتياطية
    if (!fs.existsSync(backupPath)) {
      throw new Error('ملف النسخة الاحتياطية غير موجود: ' + backupPath);
    }
    
    // إنشاء نسخة احتياطية من قاعدة البيانات الحالية قبل الاستعادة
    if (fs.existsSync(dbPath)) {
      const currentBackupPath = dbPath + '.before_restore.' + Date.now();
      fs.copyFileSync(dbPath, currentBackupPath);
      console.log('💾 تم حفظ نسخة احتياطية من قاعدة البيانات الحالية');
    }
    
    // استعادة النسخة الاحتياطية
    fs.copyFileSync(backupPath, dbPath);
    
    // الحصول على حجم الملف
    const stats = fs.statSync(dbPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ تم استعادة النسخة الاحتياطية بنجاح!');
    console.log('📍 المسار:', dbPath);
    console.log('📊 الحجم:', fileSizeInMB, 'MB');
    
    // اختبار قاعدة البيانات المستعادة
    console.log('\n🧪 اختبار قاعدة البيانات المستعادة...');
    const { testConnection } = require('../server/config/database');
    const isWorking = testConnection();
    
    if (isWorking) {
      console.log('✅ قاعدة البيانات تعمل بشكل صحيح');
    } else {
      console.log('⚠️ قد تكون هناك مشكلة في قاعدة البيانات المستعادة');
    }
    
  } catch (error) {
    console.error('❌ فشل في استعادة النسخة الاحتياطية:', error.message);
    process.exit(1);
  }
}

// التحقق من وجود معامل سطر الأوامر
const backupFile = process.argv[2];

if (require.main === module) {
  if (backupFile) {
    console.log('📂 استعادة ملف محدد:', backupFile);
  } else {
    console.log('📂 استعادة آخر نسخة احتياطية');
  }
  restoreSQLite(backupFile);
}

module.exports = restoreSQLite;