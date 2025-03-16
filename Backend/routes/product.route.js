import express from 'express'
import { getAllProducts,getFeaturedProducts,getRecommendedProducts,createProduct,deleteProduct,toggleFeaturedProduct, getProductsByCategory } from '../controller/product.controller.js';
import { protectRoute,adminRoute } from '../middleware/auth.middleware.js';
const router=express.Router();
router.get('/',protectRoute,adminRoute,getAllProducts)
router.get('/featured',getFeaturedProducts)
router.get('/recommendations',getRecommendedProducts)
router.get('/category/:category',getProductsByCategory)
router.post('/',protectRoute,adminRoute,createProduct)
router.delete('/:id',protectRoute,adminRoute,deleteProduct)
router.patch('/:id',protectRoute,adminRoute,toggleFeaturedProduct)
export default router;