import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const AdminReturns = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/ReturnItems');
      setReturns(res.data);
    } catch { setReturns([]); }
    finally { setLoading(false); }
  };

  const handleProcess = async (id: number, status: string) => {
    await axiosClient.put(`/ReturnItems/${id}`, { status });
    fetchReturns();
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-50 text-yellow-600',
    Approved: 'bg-green-50 text-green-600',
    Rejected: 'bg-red-50 text-red-600',
    Completed: 'bg-blue-50 text-blue-600',
  };

  const statusLabels: Record<string, string> = {
    Pending: '⏳ Chờ xử lý',
    Approved: '✅ Đã duyệt',
    Rejected: '❌ Từ chối',
    Completed: '🎉 Hoàn thành',
  };

  const filtered = filter ? returns.filter(r => r.status === filter) : returns;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý hàng trả lại</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {returns.length} yêu cầu</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'Pending', 'Approved', 'Rejected', 'Completed'].map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition
              ${filter === s
                ? 'bg-flower-100 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-flower-100'}`}>
            {s === '' ? 'Tất cả' : statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mã đơn</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">SL</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lý do</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <span className="text-4xl block mb-2">🔄</span>
                  Không có yêu cầu trả hàng nào
                </td>
              </tr>
            ) : (
              filtered.map(ret => (
                <tr key={ret.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-semibold text-flower-100">
                    #{ret.orderId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {ret.productName}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    {ret.quantity}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                    <p className="line-clamp-2">{ret.reason}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ret.status]}`}>
                      {statusLabels[ret.status] || ret.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {ret.status === 'Pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleProcess(ret.id, 'Approved')}
                          className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleProcess(ret.id, 'Rejected')}
                          className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                          Từ chối
                        </button>
                      </div>
                    )}
                    {ret.status === 'Approved' && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleProcess(ret.id, 'Completed')}
                          className="text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                          Hoàn thành
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReturns;