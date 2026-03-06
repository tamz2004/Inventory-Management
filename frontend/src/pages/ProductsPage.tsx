import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  ApiProduct,
  PaginationMeta,
} from '../services/inventoryApi';

const productSchema = z.object({
  productName: z.string().min(2, 'Name must be at least 2 characters'),
  productCode: z.string().min(2, 'Code is required').toUpperCase(),
  weight: z.coerce.number().min(0.001, 'Weight must be greater than 0'),
});

type ProductForm = z.infer<typeof productSchema>;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) as any });

  // Refs so the barcode scanner Enter-key can advance focus
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getProducts({ search: debouncedSearch || undefined, page, limit: 20 });
      setProducts(result.products);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openModal = (product?: ApiProduct) => {
    if (product) {
      setEditingProduct(product);
      reset({
        productName: product.productName,
        productCode: product.productCode,
        weight: product.weight,
      });
    } else {
      setEditingProduct(null);
      reset({ productName: '', productCode: '', weight: 0 });
    }
    setIsModalOpen(true);
    // Auto-focus the code field (scanner fires immediately on open)
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.productCode, {
          productName: data.productName,
          weight: data.weight,
        });
        toast.success('Product updated successfully');
      } else {
        await createProduct({
          productName: data.productName,
          productCode: data.productCode,
          weight: data.weight,
        });
        toast.success('Product created successfully');
      }
      closeModal();
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(productToDelete.productCode);
      toast.success('Product deleted');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Product Management</h1>
          <p className="text-neutral-500">Manage your product catalog and details.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or code"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 transition-all">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <p className="text-neutral-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-neutral-400">No products found. Add your first product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-neutral-900">{product.productName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-600">
                        {product.productCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{product.weight} g</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-sm font-bold', product.currentStock < 10 ? 'text-red-600' : 'text-neutral-900')}>
                        {product.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Page <span className="font-medium text-neutral-900">{pagination.page}</span> of{' '}
              <span className="font-medium text-neutral-900">{pagination.totalPages}</span> — {pagination.total} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-neutral-200 rounded-lg text-neutral-400 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border border-neutral-200 rounded-lg text-neutral-400 hover:bg-neutral-50 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 flex items-center justify-between">
                  Unique Product Code
                  {!editingProduct && (
                    <span className="text-[10px] font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Scan or type
                    </span>
                  )}
                </label>
                <input
                  {...register('productCode')}
                  ref={(el) => {
                    // Merge react-hook-form ref with our own
                    (register('productCode') as any).ref?.(el);
                    (codeInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                  }}
                  disabled={!!editingProduct}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      nameInputRef.current?.focus();
                    }
                  }}
                  autoComplete="off"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 uppercase font-mono tracking-widest"
                  placeholder="ABCD123"
                />
                {errors.productCode && <p className="text-xs text-red-500">{errors.productCode.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Product Name</label>
                <input
                  {...register('productName')}
                  ref={(el) => {
                    (register('productName') as any).ref?.(el);
                    (nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      weightInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="The Nutri Jar"
                />
                {errors.productName && <p className="text-xs text-red-500">{errors.productName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Weight (g)</label>
                <input
                  type="number"
                  step="0.001"
                  {...register('weight')}
                  ref={(el) => {
                    (register('weight') as any).ref?.(el);
                    (weightInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                  }}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="0"
                />
                {errors.weight && <p className="text-xs text-red-500">{errors.weight.message}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-neutral-200 p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Product?</h3>
            <p className="text-neutral-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-bold text-neutral-900">{productToDelete?.productName}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
