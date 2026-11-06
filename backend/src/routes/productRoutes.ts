import express from 'express';
import { 
  analyzeProduct, 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.use(protect); // All product routes are protected

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

router.post('/analyze', analyzeProduct);

export default router;
