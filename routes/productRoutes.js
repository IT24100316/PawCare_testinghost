const express = require('express');
const { addProduct, getProducts, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorizeRoles('ShopOwner', 'Admin'), addProduct)
  .get(getProducts);

router.route('/:id')
  .put(authorizeRoles('ShopOwner', 'Admin'), updateProduct)
  .delete(authorizeRoles('ShopOwner', 'Admin'), deleteProduct);

module.exports = router;
