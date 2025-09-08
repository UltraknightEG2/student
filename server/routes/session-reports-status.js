const express = require('express');
const router = express.Router();
const SessionReportStatus = require('../models/SessionReportStatus');

// جلب حالة إرسال التقارير لجميع الحصص
router.get('/', async (req, res) => {
  try {
    console.log('📊 طلب جلب حالة التقارير لجميع الحصص');
    
    const reportsStatus = await SessionReportStatus.getAll();
    console.log('📡 حالة التقارير المجلبة:', reportsStatus.length, 'عنصر');
    
    res.json({
      success: true,
      data: reportsStatus,
      message: 'تم جلب حالة التقارير بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في جلب حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة التقارير',
      error: error.message
    });
  }
});

// جلب حالة إرسال التقارير لحصة معينة
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('📊 طلب جلب حالة التقارير للحصة:', sessionId);
    
    const reportStatus = await SessionReportStatus.getBySessionId(sessionId);
    
    res.json({
      success: true,
      data: reportStatus,
      message: 'تم جلب حالة التقارير بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في جلب حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة التقارير',
      error: error.message
    });
  }
});

// إعادة تعيين حالة إرسال التقارير (لإعادة المحاولة)
router.post('/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔄 إعادة تعيين حالة التقارير للحصة:', sessionId);
    
    const success = await SessionReportStatus.resetReportStatus(sessionId);
    
    if (success) {
      res.json({
        success: true,
        message: 'تم إعادة تعيين حالة التقارير بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة تعيين حالة التقارير'
      });
    }
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين حالة التقارير',
      error: error.message
    });
  }
});

module.exports = router;