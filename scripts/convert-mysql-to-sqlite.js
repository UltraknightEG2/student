const fs = require('fs');
const path = require('path');

function convertMySQLToSQLite(mysqlFile) {
  console.log('🔄 تحويل ملف MySQL إلى SQLite...');
  
  if (!mysqlFile) {
    console.error('❌ يرجى تحديد ملف MySQL للتحويل');
    console.log('الاستخدام: npm run convert:mysql-to-sqlite <mysql-file.sql>');
    process.exit(1);
  }
  
  try {
    const inputPath = path.resolve(mysqlFile);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error('ملف MySQL غير موجود: ' + inputPath);
    }
    
    console.log('📖 قراءة ملف MySQL:', inputPath);
    let sqlContent = fs.readFileSync(inputPath, 'utf8');
    
    console.log('🔧 تحويل SQL من MySQL إلى SQLite...');
    
    // تحويلات أساسية من MySQL إلى SQLite
    
    // 1. إزالة أوامر MySQL المخصصة
    sqlContent = sqlContent.replace(/SET FOREIGN_KEY_CHECKS\s*=\s*[01]\s*;/gi, '');
    sqlContent = sqlContent.replace(/SET SQL_MODE\s*=.*?;/gi, '');
    sqlContent = sqlContent.replace(/SET time_zone\s*=.*?;/gi, '');
    sqlContent = sqlContent.replace(/CREATE DATABASE.*?;/gi, '');
    sqlContent = sqlContent.replace(/USE\s+\w+\s*;/gi, '');
    
    // 2. تحويل أنواع البيانات
    sqlContent = sqlContent.replace(/INT\(\d+\)\s+AUTO_INCREMENT/gi, 'INTEGER');
    sqlContent = sqlContent.replace(/INT\(\d+\)/gi, 'INTEGER');
    sqlContent = sqlContent.replace(/BIGINT\(\d+\)/gi, 'INTEGER');
    sqlContent = sqlContent.replace(/SMALLINT\(\d+\)/gi, 'INTEGER');
    sqlContent = sqlContent.replace(/TINYINT\(\d+\)/gi, 'INTEGER');
    sqlContent = sqlContent.replace(/VARCHAR\(\d+\)/gi, 'TEXT');
    sqlContent = sqlContent.replace(/CHAR\(\d+\)/gi, 'TEXT');
    sqlContent = sqlContent.replace(/TEXT/gi, 'TEXT');
    sqlContent = sqlContent.replace(/LONGTEXT/gi, 'TEXT');
    sqlContent = sqlContent.replace(/MEDIUMTEXT/gi, 'TEXT');
    sqlContent = sqlContent.replace(/DECIMAL\(\d+,\d+\)/gi, 'REAL');
    sqlContent = sqlContent.replace(/FLOAT\(\d+,\d+\)/gi, 'REAL');
    sqlContent = sqlContent.replace(/DOUBLE\(\d+,\d+\)/gi, 'REAL');
    sqlContent = sqlContent.replace(/DATETIME/gi, 'DATETIME');
    sqlContent = sqlContent.replace(/TIMESTAMP/gi, 'DATETIME');
    sqlContent = sqlContent.replace(/DATE/gi, 'DATE');
    sqlContent = sqlContent.replace(/TIME/gi, 'TIME');
    sqlContent = sqlContent.replace(/BOOLEAN/gi, 'BOOLEAN');
    sqlContent = sqlContent.replace(/TINYINT\(1\)/gi, 'BOOLEAN');
    
    // 3. تحويل ENUM إلى CHECK constraints
    sqlContent = sqlContent.replace(/ENUM\((.*?)\)/gi, (match, values) => {
      const enumValues = values.split(',').map(v => v.trim());
      const checkConstraint = enumValues.join(', ');
      return `TEXT CHECK (column_name IN (${checkConstraint}))`;
    });
    
    // 4. تحويل AUTO_INCREMENT إلى AUTOINCREMENT
    sqlContent = sqlContent.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
    
    // 5. تحويل PRIMARY KEY
    sqlContent = sqlContent.replace(/PRIMARY KEY\s+\(`?(\w+)`?\)/gi, 'PRIMARY KEY');
    
    // 6. تحويل UNIQUE KEY إلى UNIQUE
    sqlContent = sqlContent.replace(/UNIQUE KEY\s+`?\w+`?\s+\((.*?)\)/gi, 'UNIQUE ($1)');
    
    // 7. تحويل KEY إلى INDEX (سيتم إنشاؤها منفصلة)
    sqlContent = sqlContent.replace(/,\s*KEY\s+`?\w+`?\s+\((.*?)\)/gi, '');
    sqlContent = sqlContent.replace(/,\s*INDEX\s+`?\w+`?\s+\((.*?)\)/gi, '');
    
    // 8. إزالة ENGINE وCHARSET
    sqlContent = sqlContent.replace(/ENGINE\s*=\s*\w+/gi, '');
    sqlContent = sqlContent.replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '');
    sqlContent = sqlContent.replace(/COLLATE\s*=\s*\w+/gi, '');
    sqlContent = sqlContent.replace(/CHARACTER SET\s+\w+/gi, '');
    
    // 9. تحويل DEFAULT CURRENT_TIMESTAMP
    sqlContent = sqlContent.replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, "DEFAULT CURRENT_TIMESTAMP");
    sqlContent = sqlContent.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
    
    // 10. إزالة backticks
    sqlContent = sqlContent.replace(/`/g, '');
    
    // 11. تحويل IF NOT EXISTS
    sqlContent = sqlContent.replace(/CREATE TABLE\s+(\w+)/gi, 'CREATE TABLE IF NOT EXISTS $1');
    
    // 12. إضافة PRAGMA في البداية
    const pragmas = `
-- تفعيل المفاتيح الخارجية
PRAGMA foreign_keys = ON;

`;
    
    sqlContent = pragmas + sqlContent;
    
    // 13. تنظيف نهائي
    sqlContent = sqlContent.replace(/,\s*\)/g, ')'); // إزالة الفواصل الزائدة
    sqlContent = sqlContent.replace(/\s+/g, ' '); // تنظيف المسافات
    sqlContent = sqlContent.replace(/;\s*;/g, ';'); // إزالة الفواصل المنقوطة المكررة
    
    // حفظ الملف المحول
    const outputPath = path.join(path.dirname(inputPath), 'converted_sqlite.sql');
    fs.writeFileSync(outputPath, sqlContent, 'utf8');
    
    console.log('✅ تم تحويل الملف بنجاح!');
    console.log('📍 الملف المحول:', outputPath);
    
    // إحصائيات التحويل
    const originalSize = fs.statSync(inputPath).size;
    const convertedSize = fs.statSync(outputPath).size;
    console.log('📊 الحجم الأصلي:', (originalSize / 1024).toFixed(2), 'KB');
    console.log('📊 الحجم المحول:', (convertedSize / 1024).toFixed(2), 'KB');
    
    console.log('\n💡 خطوات التالية:');
    console.log('1. راجع الملف المحول للتأكد من صحة التحويل');
    console.log('2. قم بتشغيل: npm run db:setup');
    console.log('3. استورد البيانات المحولة إذا لزم الأمر');
    
  } catch (error) {
    console.error('❌ فشل في تحويل الملف:', error.message);
    process.exit(1);
  }
}

const mysqlFile = process.argv[2];

if (require.main === module) {
  convertMySQLToSQLite(mysqlFile);
}

module.exports = convertMySQLToSQLite;