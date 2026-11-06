import express from 'express';
import { 
  runReconciliation, 
  getReconciliationSummary, 
  getOrderReconciliation, 
  getUnmatchedTransactions 
} from '../controllers/reconciliationController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.use(protect); // All routes protected and scoped to organization

router.post('/run', runReconciliation);
router.get('/summary', getReconciliationSummary);
router.get('/unmatched', getUnmatchedTransactions);
router.get('/:orderId', getOrderReconciliation);

export default router;
