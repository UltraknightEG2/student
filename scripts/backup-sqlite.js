const fs = require('fs');
const path = require('path');

function backupSQLite() {
  console.log('💾 بدء إنشاء نسخة احتياطية من SQLite...');
  
  try {
    const dbPath = path.join(__dirname, '../database/attendance_system.db');
    const backupDir = path.join(__dirname, '../backups');
    
    // التحقق من وجود قاعدة البيانات
    if (!fs.existsSync(dbPath)) {
      throw new Error('ملف قاعدة البيانات غير موجود: ' + dbPath);
    }
    
    // إنشاء مجلد النسخ الاحتياطية
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 تم إنشاء مجلد النسخ الاحتياطية');
    }
    
    // إنشاء اسم الملف مع الوقت والتاريخ
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `attendance_backup_${timestamp}.db`);
    
    // نسخ ملف قاعدة البيانات
    fs.copyFileSync(dbPath, backupPath);
    
    // الحصول على حجم الملف
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ تم إنشاء النسخة الاحتياطية بنجاح!');
    console.log('📍 المسار:', backupPath);
    console.log('📊 الحجم:', fileSizeInMB, 'MB');
    
    // تنظيف النسخ القديمة (الاحتفاظ بآخر 10 نسخ)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('attendance_backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);
    
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log('🗑️ تم حذف النسخة القديمة:', file.name);
      });
    }
    
    console.log('📋 إجمالي النسخ الاحتياطية:', Math.min(backupFiles.length, 10));
    
  } catch (error) {
    console.error('❌ فشل في إنشاء النسخة الاحتياطية:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  backupSQLite();
}

module.exports = backupSQLite;