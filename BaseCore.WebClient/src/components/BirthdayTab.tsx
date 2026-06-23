import { useEffect, useState } from 'react';
import { birthdayApi, BirthdayInfo, ChildProfile, ChildRequest } from '../api/birthdayApi';

const emptyForm: ChildRequest = { name: '', gender: 'Khác', age: undefined, birthDate: '' };

const BirthdayTab = () => {
  const [info, setInfo] = useState<BirthdayInfo | null>(null);
  const [form, setForm] = useState<ChildRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => birthdayApi.getMine().then(setInfo).catch(() => setInfo(null));
  useEffect(() => { load(); }, []);

  const canEdit = info?.canEdit ?? true;
  const remaining = info ? Math.max(0, 3 - info.editCount) : 3;

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload: ChildRequest = {
        name: form.name || undefined,
        gender: form.gender,
        age: form.age ? Number(form.age) : undefined,
        birthDate: form.birthDate || undefined,
      };
      if (editingId) await birthdayApi.updateChild(editingId, payload);
      else await birthdayApi.addChild(payload);
      setForm(emptyForm); setEditingId(null);
      await load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: ChildProfile) => {
    setEditingId(c.id);
    setForm({
      name: c.name || '',
      gender: c.gender || 'Khác',
      age: c.age ?? undefined,
      birthDate: c.birthDate ? c.birthDate.substring(0, 10) : '',
    });
  };

  const remove = async (id: number) => {
    if (!window.confirm('Xóa thông tin con này?')) return;
    await birthdayApi.deleteChild(id).then(load).catch(() => {});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">🎂 Sinh nhật của bé</h2>
      <p className="text-sm text-gray-500 mb-4">
        Thêm thông tin con của bạn để nhận mã giảm giá sinh nhật. Trước sinh nhật 1 tháng,
        3TL-Store sẽ gửi thông báo kèm mã giảm giá cho bạn.
      </p>

      {/* Cảnh báo số lần sửa */}
      {!info?.rewardReceived && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-4 ${remaining > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
          {remaining > 0
            ? `Bạn còn ${remaining} lần chỉnh sửa thông tin trước khi nhận mã giảm giá đầu tiên.`
            : 'Bạn đã dùng hết 3 lần chỉnh sửa. Không thể sửa thêm trước khi nhận mã đầu tiên.'}
        </div>
      )}

      {/* Form thêm / sửa */}
      {canEdit && (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-flower-50">
          <div>
            <label className="text-xs text-gray-500">Tên bé</label>
            <input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="VD: Bé Bi" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Giới tính</label>
            <select value={form.gender ?? 'Khác'} onChange={e => setForm({ ...form, gender: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option>Nam</option><option>Nữ</option><option>Khác</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Độ tuổi</label>
            <input type="number" min={0} max={18} value={form.age ?? ''} onChange={e => setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="VD: 7" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Ngày sinh</label>
            <input type="date" value={form.birthDate ?? ''} onChange={e => setForm({ ...form, birthDate: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-full bg-flower-100 text-white text-sm font-semibold hover:bg-flower-150 disabled:opacity-50">
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : '➕ Thêm con'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-500 text-sm">Hủy</button>
            )}
            {msg && <span className="text-xs text-red-500">{msg}</span>}
          </div>
        </form>
      )}

      {/* Danh sách con */}
      <div className="space-y-3">
        {(info?.children?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400">Chưa có thông tin con nào.</p>
        ) : info!.children.map(c => (
          <div key={c.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-flower-100 text-white flex items-center justify-center">🧒</div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-gray-800">{c.name || 'Bé'} · {c.gender || 'Khác'}</p>
              <p className="text-xs text-gray-500">
                {c.age != null ? `${c.age} tuổi` : ''}{c.birthDate ? ` · Sinh ngày ${new Date(c.birthDate).toLocaleDateString('vi-VN')}` : ''}
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2 text-xs">
                <button onClick={() => startEdit(c)} className="text-blue-500 hover:underline">Sửa</button>
                <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Xóa</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BirthdayTab;
