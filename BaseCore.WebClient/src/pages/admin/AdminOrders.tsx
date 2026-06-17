import { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import { OrderResponse } from '../../types';

const statusColors: Record<string, string> = {
  Pending:   'bg-yellow-50 text-yellow-600',
  Confirmed: 'bg-blue-50 text-blue-600',
  Shipping:  'bg-purple-50 text-purple-600',
  Delivered: 'bg-green-50 text-green-600',
  Cancelled: 'bg-red-50 text-red-600',
};

const statusLabels: Record<string, string> = {
  Pending:   '⏳ Chờ xác nhận',
  Confirmed: '✅ Đã xác nhận',
  Shipping:  '🚚 Đang giao',
  Delivered: '🎉 Đã giao',
  Cancelled: '❌ Đã hủy',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const pageSize = 10;

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll(page, pageSize, statusFilter || undefined);
      setOrders(res.items);
      setTotalCount(res.totalCount);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    await orderApi.updateStatus(id, status);
    fetchOrders();
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý đơn hàng</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {totalCount} đơn hàng</p>
        </div>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'].map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${statusFilter === s
                ? 'bg-flower-100 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-flower-100'}`}>
            {s === '' ? 'Tất cả' : statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Danh sách đơn hàng */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mã đơn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <span className="text-4xl block mb-2">📋</span>
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer hover:bg-gray-50 transition
                      ${selectedOrder?.id === order.id ? 'bg-flower-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-semibold text-flower-100">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Trang {page} / {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="w-8 h-8 border border-gray-200 rounded-lg text-gray-500 hover:border-flower-100 transition disabled:opacity-30">
                  ‹
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="w-8 h-8 border border-gray-200 rounded-lg text-gray-500 hover:border-flower-100 transition disabled:opacity-30">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chi tiết đơn hàng */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {!selectedOrder ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-4xl mb-2">👆</span>
              <p className="text-sm">Chọn đơn hàng để xem chi tiết</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Đơn #{selectedOrder.id}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              {/* Thông tin */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Khách hàng</span>
                  <span className="font-medium">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng tiền</span>
                  <span className="font-bold text-flower-100">
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thanh toán</span>
                  <span>{selectedOrder.paymentMethod || 'COD'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Địa chỉ</span>
                  <span className="text-xs text-gray-600">{selectedOrder.shippingAddress}</span>
                </div>
                {selectedOrder.note && (
                  <div>
                    <span className="text-gray-500 block mb-1">Ghi chú</span>
                    <span className="text-xs text-gray-600">{selectedOrder.note}</span>
                  </div>
                )}
              </div>

              {/* Sản phẩm */}
              <div className="border-t border-gray-100 pt-3 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sản phẩm</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700 line-clamp-1 flex-1">{item.productName}</span>
                      <span className="text-gray-500 ml-2 flex-shrink-0">
                        x{item.quantity} · {item.subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cập nhật trạng thái */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cập nhật trạng thái</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Confirmed', 'Shipping', 'Delivered', 'Cancelled'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                      disabled={selectedOrder.status === s}
                      className={`py-1.5 text-xs rounded-lg border transition font-medium
                        ${selectedOrder.status === s
                          ? 'border-flower-100 bg-flower-50 text-flower-100'
                          : 'border-gray-200 text-gray-600 hover:border-flower-100 hover:text-flower-100'}
                        disabled:cursor-default`}>
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
