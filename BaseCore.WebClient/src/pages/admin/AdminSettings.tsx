import { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settingsApi';

const groupIcons: Record<string, string> = {
  General:  '🌐',
  Shipping: '🚚',
  System:   '⚙️',
  Order:    '📦',
  Product:  '🧱',
  Loyalty:  '🎁',
};

const groupLabels: Record<string, string> = {
  General:  'Thông tin chung',
  Shipping: 'Vận chuyển',
  System:   'Hệ thống',
  Order:    'Đơn hàng',
  Product:  'Sản phẩm',
  Loyalty:  'Điểm thưởng',
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [activeGroup, setActiveGroup] = useState('General');

  // Local edits
  const [edits, setEdits] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getAll();
      setSettings(res);
      // Init edits
      const initEdits: Record<number, string> = {};
      Object.values(res).flat().forEach((s: any) => {
        initEdits[s.id] = s.value;
      });
      setEdits(initEdits);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(edits).map(([id, value]) => ({
        id: Number(id),
        value,
      }));
      await settingsApi.updateMany(payload);
      setSuccess('Lưu cài đặt thành công!');
      setTimeout(() => setSuccess(''), 3000);
      fetchSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (id: number, value: string) => {
    setEdits(prev => ({ ...prev, [id]: value }));
  };

  const groups = Object.keys(settings);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Cài đặt hệ thống</h2>
          <p className="text-sm text-gray-400 mt-0.5">Chỉ Admin mới có quyền thay đổi</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-flower-100 text-white rounded-xl text-sm font-medium hover:bg-flower-150 transition disabled:opacity-50">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
          )}
          {saving ? 'Đang lưu...' : 'Lưu tất cả'}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2">
          ✅ {success}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">

        {/* Sidebar nhóm */}
        <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-3 h-fit">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition mb-1
                ${activeGroup === group
                  ? 'bg-flower-50 text-flower-100 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{groupIcons[group] || '⚙️'}</span>
              {groupLabels[group] || group}
              <span className="ml-auto text-xs text-gray-400">
                {settings[group]?.length}
              </span>
            </button>
          ))}
        </div>

        {/* Form cài đặt */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span>{groupIcons[activeGroup] || '⚙️'}</span>
            {groupLabels[activeGroup] || activeGroup}
          </h3>

          <div className="space-y-4">
            {settings[activeGroup]?.map((setting: any) => (
              <div key={setting.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-flower-50 transition">

                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">
                    {setting.description || setting.key}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">{setting.key}</p>

                  {/* Input theo loại value */}
                  {setting.value === 'true' || setting.value === 'false' ? (
                    // Toggle boolean
                    <button
                      onClick={() => handleChange(
                        setting.id,
                        edits[setting.id] === 'true' ? 'false' : 'true'
                      )}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                        ${edits[setting.id] === 'true'
                          ? 'bg-flower-100'
                          : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition
                        ${edits[setting.id] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  ) : (
                    // Input text/number
                    <input
                      type={isNaN(Number(setting.value)) ? 'text' : 'number'}
                      value={edits[setting.id] ?? setting.value}
                      onChange={(e) => handleChange(setting.id, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100 bg-white"
                    />
                  )}
                </div>

                {/* Chỉ thị đã thay đổi */}
                {edits[setting.id] !== setting.value && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full flex-shrink-0 mt-6">
                    Đã thay đổi
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;