import express from 'express';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import { ReportService } from '../services/reports/ReportService';
import { jsonToCsv } from '../utils/csvExport';
import { ExportJobService } from '../services/reports/ExportJobService';
import { ReportScheduleService } from '../services/reports/ReportScheduleService';
import ReportHistory from '../models/ReportHistory';

const router = express.Router();

router.use(protect);

// Scheduled Reports
router.post('/schedules', requirePermission('reports.create'), async (req: any, res) => {
  try {
    const schedule = await ReportScheduleService.createSchedule(req.user.organizationId, req.user._id, req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/schedules', requirePermission('reports.view'), async (req: any, res) => {
  try {
    const schedules = await ReportScheduleService.getSchedules(req.user.organizationId);
    res.json({ success: true, data: schedules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/schedules/:id', requirePermission('reports.create'), async (req: any, res) => {
  try {
    const schedule = await ReportScheduleService.updateSchedule(req.params.id, req.user.organizationId, req.user._id, req.body);
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/schedules/:id', requirePermission('reports.delete'), async (req: any, res) => {
  try {
    await ReportScheduleService.deleteSchedule(req.params.id, req.user.organizationId, req.user._id);
    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/schedules/:id/run', requirePermission('reports.create'), async (req: any, res) => {
  try {
    const result = await ReportScheduleService.runSchedule(req.params.id, req.user.organizationId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Report History
router.get('/history', async (req: any, res) => {
  try {
    const history = await ReportHistory.find({ organizationId: req.user.organizationId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'firstName lastName email')
      .lean();
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/history/:id', async (req: any, res) => {
  try {
    await ReportHistory.deleteOne({ _id: req.params.id, organizationId: req.user.organizationId });
    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Export Jobs
router.get('/export-jobs', async (req: any, res) => {
  try {
    const jobs = await ExportJobService.getJobs(req.user.organizationId, req.user._id);
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/export-jobs', async (req: any, res) => {
  try {
    const { reportType, format, filters } = req.body;
    const job = await ExportJobService.requestExport(req.user.organizationId, req.user._id, reportType, format, filters);
    res.status(201).json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Normal reporting endpoint
router.get('/:type', async (req: any, res) => {
  try {
    const data = await ReportService.generateReport(req.user.organizationId, req.params.type, req.query);
    
    if (req.query.format === 'csv') {
      let exportData: any[] = [];
      if (data && (data as any).data && Array.isArray((data as any).data)) {
        exportData = (data as any).data;
      } else if (data && !Array.isArray(data)) {
        exportData = [data];
      } else if (Array.isArray(data)) {
        exportData = data;
      }

      const csv = jsonToCsv(exportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`report_${req.params.type}_${Date.now()}.csv`);
      return res.send(csv);
    }
    
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
