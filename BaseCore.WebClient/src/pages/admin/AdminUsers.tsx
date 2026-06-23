import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

interface UserItem {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  roleName: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

const roleColors: Record<string, string> = {
  Admin:    'bg-red-50 text-red-600',
  Supplier: 'bg-blue-50 text-blue-600',
  Seller:   'bg-purple-50 text-purple-600',
  Customer: 'bg-green-50 text-green-600',
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const pageSize = 10;

  useEffect(() => { fetchUsers(); }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/Users', { params: { page, pageSize, keyword: search || undefined } });
      setUsers(res.data.items || res.data);
      setTotalCount(res.data.totalCount || res.data.length);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, roleId: number) => {
    setUpdatingRole(true);
    try {
      await axiosClient.put(`/Users/${userId}/role`, roleId);
      fetchUsers();
      if (selectedUser?.id === userId) {
        const roleNames: Record<number, string> = { 1: 'Admin', 2: 'Supplier', 3: 'Seller', 4: 'Customer' };
        setSelectedUser({ ...selectedUser, roleId, roleName: roleNames[roleId] });
      }
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await axiosClient.put(`/Users/${userId}/active`, isActive);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, isActive });
      }
    } catch {
      alert('Không thể cập nhật trạng thái tài khoản.');
    }
  };

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    };

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý người dùng</h2>
          <p className="text-sm text-gray-400 mt-0.5">Tổng {totalCount} người dùng</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <form onSubmit={handleSearch} className="flex gap-3">
        <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100"
        />
        <button type="submit"
            className="px-4 py-2.5 bg-flower-100 text-white rounded-xl text-sm hover:bg-flower-150 transition">
            Tìm
        </button>
        {search && (
            <button type="button"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition">
            Xóa
            </button>
        )}
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Danh sách */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <span className="text-4xl block mb-2">👥</span>
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`cursor-pointer hover:bg-gray-50 transition
                      ${selectedUser?.id === user.id ? 'bg-flower-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-flower-100 flex items-center justify-center flex-shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl.startsWith('http')
                                ? user.avatarUrl
                                : `https://localhost:7175${user.avatarUrl}`}
                              alt={user.fullName}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-white text-xs font-semibold">
                              {user.fullName?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.roleName] || 'bg-gray-100 text-gray-600'}`}>
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
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
                  className="w-8 h-8 border border-gray-200 rounded-lg text-gray-500 hover:border-flower-100 transition disabled:opacity-30">‹</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="w-8 h-8 border border-gray-200 rounded-lg text-gray-500 hover:border-flower-100 transition disabled:opacity-30">›</button>
              </div>
            </div>
          )}
        </div>

        {/* Chi tiết user */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-4xl mb-2">👆</span>
              <p className="text-sm">Chọn người dùng để xem chi tiết</p>
            </div>
          ) : (
            <div>
              {/* Avatar + tên */}
              <div className="flex flex-col items-center mb-5 pb-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-flower-100 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl.startsWith('http') ? selectedUser.avatarUrl : `https://localhost:7175${selectedUser.avatarUrl}`}
                      alt={selectedUser.fullName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {selectedUser.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-800">{selectedUser.fullName}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${roleColors[selectedUser.roleName]}`}>
                  {selectedUser.roleName}
                </span>
              </div>

              {/* Thông tin */}
              <div className="space-y-3 text-sm mb-5">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-gray-700">{selectedUser.email}</p>
                </div>
                {selectedUser.phoneNumber && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Số điện thoại</p>
                    <p className="text-gray-700">{selectedUser.phoneNumber}</p>
                  </div>
                )}
                {selectedUser.address && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Địa chỉ</p>
                    <p className="text-gray-700 text-xs">{selectedUser.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Ngày tạo</p>
                  <p className="text-gray-700">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              {/* Phân quyền */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Phân quyền</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 1, label: 'Admin' },
                    { id: 2, label: 'Supplier' },
                    { id: 3, label: 'Seller' },
                    { id: 4, label: 'Customer' },
                  ].map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleUpdateRole(selectedUser.id, role.id)}
                      disabled={selectedUser.roleId === role.id || updatingRole}
                      className={`py-1.5 text-xs rounded-lg border transition font-medium
                        ${selectedUser.roleId === role.id
                          ? `border-2 ${roleColors[role.label]} border-current`
                          : 'border-gray-200 text-gray-600 hover:border-flower-100 hover:text-flower-100'}
                        disabled:cursor-default`}>
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trạng thái hoạt động */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Trạng thái tài khoản</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selectedUser.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {selectedUser.isActive ? 'Đang hoạt động' : 'Đã ngừng hoạt động'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(selectedUser.id, !selectedUser.isActive)}
                    className={`px-4 py-1.5 text-xs rounded-lg font-semibold text-white transition
                      ${selectedUser.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                    {selectedUser.isActive ? 'Ngừng hoạt động' : 'Mở khoá'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;