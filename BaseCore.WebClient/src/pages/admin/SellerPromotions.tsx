import { useEffect, useState, useCallback } from 'react';
import { campaignApi } from '../../api/campaignApi';
import { getImageUrl } from '../../utils/imageHelper';
import { voucherApi, Voucher } from '../../api/voucherApi';
import { promotionApi, PromotionResponse, PromotionRequest } from '../../api/promotionApi';
import { productApi } from '../../api/productApi';
import { categoryApi, CategoryResponse } from '../../api/categoryApi';
import { themeApi, ThemeResponse } from '../../api/themeApi';
import { ProductResponse } from '../../types';
import { profileApi } from '../../api/profileApi';

type Tab = 'campaign' | 'codes';

const SellerPromotions = () => {
  const [tab, setTab] = useState<Tab>('campaign');
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Khuyến mãi</h1>
      <p className="text-sm text-gray-500 mb-5">Quản lý chương trình khuyến mãi và mã giảm giá của cửa hàng.</p>

      <div className="flex gap-2 mb-6">
        {([['campaign', '🎪 Chương trình'], ['codes', '🎟️ Mã giảm giá']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition
              ${tab === k ? 'bg-flower-100 text-white' : 'bg-flower-50 text-flower-100 hover:bg-flower-100/20'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'campaign' ? <CampaignTab /> : <CodesTab />}
    </div>
  );
};

// ============ TAB CHƯƠNG TRÌNH ============
const CampaignTab = () => {
  const [title, setTitle] = useState('');
  const [banner, setBanner] = useState('');
  const [sideBanner, setSideBanner] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<ProductResponse[]>([]);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ProductResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [cats, setCats] = useState<CategoryResponse[]>([]);
  const [themes, setThemes] = useState<ThemeResponse[]>([]);
  const [catId, setCatId] = useState<number | ''>('');
  const [themeId, setThemeId] = useState<number | ''>('');

  useEffect(() => {
    campaignApi.get().then(async cfg => {
      setTitle(cfg.title);
      setBanner(cfg.banner);
      setSideBanner(cfg.sideBanner || '');
      setEndDate(cfg.endDate ? cfg.endDate.slice(0, 10) : '');
      const ids = (cfg.productIds || '').split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
      const items = await Promise.all(ids.map(id => productApi.getById(id).catch(() => null)));
      setSelected(items.filter((x): x is ProductResponse => x !== null));
    }).catch(() => {});
    categoryApi.getAll().then(setCats).catch(() => {});
    themeApi.getAll().then(setThemes).catch(() => {});
  }, []);

  // Luôn hiển thị tối đa 8 sản phẩm theo tiêu chí hiện tại (không có tiêu chí -> 8 SP đầu)
  const runSearch = useCallback(async (kw: string, c: number | '', t: number | '') => {
    const res = await productApi.getAll({
      keyword: kw.trim() || undefined,
      categoryId: c ? Number(c) : undefined,
      themeId: t ? Number(t) : undefined,
      pageSize: 8, page: 1,
    });
    setResults(res.items);
  }, []);

  // Tải sẵn 8 sản phẩm khi mở tab
  useEffect(() => { runSearch('', '', ''); }, [runSearch]);

  // Khi chọn danh mục: tải chủ đề thuộc danh mục + reset chủ đề đang chọn
  useEffect(() => {
    setThemeId('');
    if (catId) themeApi.getAll(Number(catId)).then(setThemes).catch(() => setThemes([]));
    else themeApi.getAll().then(setThemes).catch(() => {});
  }, [catId]);

  // Tự lọc lại danh sách khi đổi danh mục / chủ đề
  useEffect(() => { runSearch(keyword, catId, themeId); /* eslint-disable-next-line */ }, [catId, themeId, runSearch]);

  const search = () => runSearch(keyword, catId, themeId);

  const add = (p: ProductResponse) => {
    if (!selected.some(s => s.id === p.id)) setSelected([...selected, p]);
  };
  const remove = (id: number) => setSelected(selected.filter(s => s.id !== id));

  const uploadBanner = async (f: File) => {
    const url = await campaignApi.uploadBanner(f);
    setBanner(url);
  };

  const uploadSideBanner = async (f: File) => {
    const url = await campaignApi.uploadBanner(f);
    setSideBanner(url);
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await campaignApi.update({
        title,
        banner,
        sideBanner,
        endDate,
        productIds: selected.map(s => s.id).join(',')
      });
      setMsg('Đã lưu! Trang Chương trình bên Web đã cập nhật.');
    } catch { setMsg('Có lỗi khi lưu.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <label className="text-sm font-medium text-gray-700">Tên chương trình (chữ nổi trên Web)</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="VD: Trung Thu, Tết Thiếu Nhi..."
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />

        <div className="grid sm:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block">Banner chương trình</label>
            <div className="flex items-center gap-4 mt-2">
              {banner && <img src={getImageUrl(banner)} alt="" className="h-20 rounded-lg object-cover border" />}
              <label className="text-sm text-flower-100 cursor-pointer hover:underline">
                📷 Tải ảnh banner
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block">Ảnh phụ cột trái (Tùy chọn trang trí)</label>
            <div className="flex items-center gap-4 mt-2">
              {sideBanner && <img src={getImageUrl(sideBanner)} alt="" className="h-20 rounded-lg object-cover border" />}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-flower-100 cursor-pointer hover:underline">
                  📷 Tải ảnh phụ
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadSideBanner(e.target.files[0])} />
                </label>
                {sideBanner && (
                  <button type="button" onClick={() => setSideBanner('')} className="text-left text-xs text-red-500 hover:underline">
                    Xóa ảnh phụ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 block">Ngày kết thúc chương trình (để đếm ngược)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm max-w-xs focus:outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm trong chương trình</p>
        <div className="flex flex-wrap gap-2">
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Tìm theo tên..."
            className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <select value={catId} onChange={e => setCatId(e.target.value ? Number(e.target.value) : '')}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm">
            <option value="">Tất cả danh mục</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {/* Chủ đề chỉ hiện khi danh mục đang chọn có chủ đề */}
          {themes.length > 0 && (
            <select value={themeId} onChange={e => setThemeId(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm">
              <option value="">Tất cả chủ đề</option>
              {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={search} className="px-4 py-2 rounded-lg bg-flower-50 text-flower-100 text-sm font-medium">Tìm</button>
        </div>
        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {results.map(p => {
              const isSel = selected.some(s => s.id === p.id);
              return (
                <button key={p.id} onClick={() => isSel ? remove(p.id) : add(p)}
                  className={`text-left border rounded-lg p-2 transition ${isSel ? 'border-flower-100 bg-flower-50' : 'border-gray-100 hover:border-flower-100'}`}>
                  <img src={getImageUrl(p.imageUrl)} alt="" className="w-full h-20 object-contain" />
                  <p className="text-xs line-clamp-1 mt-1">{p.name}</p>
                  <p className="text-xs text-flower-100">{p.price.toLocaleString('vi-VN')}đ</p>
                  <p className={`text-xs font-medium ${isSel ? 'text-green-600' : 'text-flower-100'}`}>
                    {isSel ? '✓ Đã chọn' : '+ Thêm'}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-3">Không tìm thấy sản phẩm phù hợp.</p>
        )}
        {selected.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Đã chọn ({selected.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selected.map(s => (
                <span key={s.id} className="flex items-center gap-1 bg-flower-50 text-flower-100 text-xs rounded-full px-3 py-1">
                  {s.name}
                  <button onClick={() => remove(s.id)} className="font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 rounded-full bg-flower-100 text-white font-semibold hover:bg-flower-150 disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu chương trình'}
        </button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>

      {/* Dòng khuyến mãi hiển thị bên Web (cột trái trang Chương trình) */}
      <PromoLines />
    </div>
  );
};

// ============ DÒNG KHUYẾN MÃI (Promotion) ============
const emptyPromo: PromotionRequest = {
  name: '', description: '', discountPercent: 10,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  isActive: true,
};

const PromoLines = () => {
  const [list, setList] = useState<PromotionResponse[]>([]);
  const [form, setForm] = useState<PromotionRequest>(emptyPromo);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => promotionApi.getAll().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMsg('');
    if (!form.name.trim()) { setMsg('Vui lòng nhập nội dung dòng khuyến mãi.'); return; }
    try {
      if (editingId) await promotionApi.update(editingId, form);
      else await promotionApi.create(form);
      setForm(emptyPromo); setEditingId(null);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const startEdit = (p: PromotionResponse) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description || '', discountPercent: p.discountPercent,
      startDate: p.startDate?.slice(0, 10) || emptyPromo.startDate,
      endDate: p.endDate?.slice(0, 10) || emptyPromo.endDate,
      isActive: p.isActive,
    });
  };

  const del = async (id: number) => {
    if (!window.confirm('Xoá dòng khuyến mãi này?')) return;
    await promotionApi.remove(id).then(load).catch(() => {});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-medium text-gray-700 mb-1">Dòng khuyến mãi hiển thị trên Web</p>
      <p className="text-xs text-gray-400 mb-3">Các dòng này hiện ở cột trái trang Chương trình (vd: "Quốc tế thiếu nhi 1/6 · -10%").</p>

      {/* Danh sách */}
      <div className="space-y-2 mb-4">
        {list.length === 0 ? (
          <p className="text-xs text-gray-400">Chưa có dòng khuyến mãi nào.</p>
        ) : list.map(p => (
          <div key={p.id} className="flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-flower-100 truncate">{p.name} · -{p.discountPercent}%</p>
              {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
            </div>
            <button onClick={() => promotionApi.toggle(p.id).then(load)} className="text-xs text-gray-500 hover:underline">
              {p.isActive ? 'Ẩn' : 'Hiện'}
            </button>
            <button onClick={() => startEdit(p)} className="text-xs text-blue-500 hover:underline">Sửa</button>
            <button onClick={() => del(p.id)} className="text-xs text-red-500 hover:underline">Xoá</button>
          </div>
        ))}
      </div>

      {/* Form thêm/sửa dòng */}
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-2 bg-flower-50 rounded-xl p-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Nội dung (vd: Quốc tế thiếu nhi 1/6)"
          className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Mô tả (tuỳ chọn)" className="sm:col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <div>
          <label className="text-xs text-gray-500">Mức giảm (%)</label>
          <input type="number" min={0} max={100} value={form.discountPercent}
            onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <label className="flex items-end gap-2 text-sm text-gray-600 pb-1.5">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
          Hiển thị
        </label>
        <div>
          <label className="text-xs text-gray-500">Từ ngày</label>
          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Đến ngày</label>
          <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <button type="submit" className="px-5 py-2 rounded-full bg-flower-100 text-white text-sm font-semibold hover:bg-flower-150">
            {editingId ? 'Cập nhật dòng' : '➕ Thêm dòng'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyPromo); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-gray-500 text-sm">Hủy</button>
          )}
          {msg && <span className="text-xs text-red-500">{msg}</span>}
        </div>
      </form>
    </div>
  );
};

// ============ TAB MÃ GIẢM GIÁ ============
type Scope = 'All' | 'Specific' | 'Birthday';

const CodesTab = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [percent, setPercent] = useState(10);
  const [scope, setScope] = useState<Scope>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cats, setCats] = useState<CategoryResponse[]>([]);
  const [themes, setThemes] = useState<ThemeResponse[]>([]);
  const [selCats, setSelCats] = useState<number[]>([]);
  const [selThemes, setSelThemes] = useState<number[]>([]);
  const [prodKeyword, setProdKeyword] = useState('');
  const [prodResults, setProdResults] = useState<ProductResponse[]>([]);
  const [selProds, setSelProds] = useState<ProductResponse[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  // Gửi mã giảm giá sinh nhật cho người dùng cụ thể
  const [customers, setCustomers] = useState<{ id: number; fullName: string; email: string }[]>([]);
  const [sendVoucherId, setSendVoucherId] = useState<number | null>(null);
  const [selectedCustId, setSelectedCustId] = useState<number | ''>('');
  const [sendingCode, setSendingCode] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  const load = () => voucherApi.getAll().then(setVouchers).catch(() => setVouchers([]));
  useEffect(() => {
    load();
    categoryApi.getAll().then(setCats).catch(() => {});
    themeApi.getAll().then(setThemes).catch(() => {});
    profileApi.getCustomers().then(setCustomers).catch(() => {});
  }, []);

  const sendVoucher = async () => {
    if (!sendVoucherId || !selectedCustId) return;
    setSendingCode(true); setSendMsg('');
    try {
      await voucherApi.send(sendVoucherId, Number(selectedCustId));
      setSendMsg('Đã gửi mã giảm giá thành công!');
      setSelectedCustId('');
      setTimeout(() => { setSendVoucherId(null); setSendMsg(''); }, 1500);
    } catch (err: any) {
      setSendMsg(err.response?.data?.message || 'Lỗi gửi mã.');
    } finally {
      setSendingCode(false);
    }
  };

  const toggle = (arr: number[], set: (v: number[]) => void, id: number) =>
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const searchProd = async () => {
    // Bấm Tìm: nếu để trống vẫn gợi ý theo danh mục/chủ đề đã chọn (hoặc top sản phẩm)
    const res = await productApi.getAll({
      keyword: prodKeyword.trim() || undefined,
      categoryId: selCats.length === 1 ? selCats[0] : undefined,
      themeId: selThemes.length === 1 ? selThemes[0] : undefined,
      pageSize: 8, page: 1,
    });
    setProdResults(res.items);
  };

  const create = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await voucherApi.create({
        code, description: desc, discountPercent: percent, scopeType: scope,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        categoryIds: scope === 'Specific' ? selCats.join(',') : undefined,
        themeIds: scope === 'Specific' ? selThemes.join(',') : undefined,
        productIds: scope === 'Specific' ? selProds.map(p => p.id).join(',') : undefined,
      });
      setMsg({ ok: true, t: 'Đã tạo mã!' });
      setCode(''); setDesc(''); setSelCats([]); setSelThemes([]); setSelProds([]); setProdResults([]);
      load();
    } catch (err: any) {
      const data = err.response?.data;
      const detail = typeof data === 'string' ? data : (data?.message || data?.title);
      setMsg({ ok: false, t: detail || (err.response ? `Lỗi tạo mã (mã ${err.response.status})` : 'Không kết nối được máy chủ') });
    }
  };

  const del = async (id: number) => {
    if (!window.confirm('Xóa mã này?')) return;
    await voucherApi.remove(id).then(load).catch(() => {});
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Form tạo mã */}
      <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <p className="font-semibold text-gray-800">Tạo mã giảm giá</p>
        <div>
          <label className="text-xs text-gray-500">Dòng code để nhận</label>
          <input value={code} onChange={e => setCode(e.target.value)} required
            placeholder="VD: TRUNGTHU2026" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Chú thích</label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Mức giảm (%)</label>
            <input type="number" min={1} max={100} value={percent} onChange={e => setPercent(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Bắt đầu</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Hạn dùng</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Loại giảm</label>
          <div className="flex gap-2 flex-wrap">
            {([['All', 'Giảm tổng thể'], ['Specific', 'Giảm cụ thể'], ['Birthday', 'Sinh nhật']] as [Scope, string][]).map(([k, l]) => (
              <button type="button" key={k} onClick={() => setScope(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${scope === k ? 'bg-flower-100 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {scope === 'Specific' && (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Danh mục (có thể chọn nhiều)</p>
              <div className="flex flex-wrap gap-1.5">
                {cats.map(c => (
                  <button type="button" key={c.id} onClick={() => toggle(selCats, setSelCats, c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs ${selCats.includes(c.id) ? 'bg-flower-100 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Chủ đề (tuỳ chọn)</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {themes.map(t => (
                  <button type="button" key={t.id} onClick={() => toggle(selThemes, setSelThemes, t.id)}
                    className={`px-2.5 py-1 rounded-full text-xs ${selThemes.includes(t.id) ? 'bg-flower-100 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Sản phẩm (tìm theo tên)</p>
              <div className="flex gap-2">
                <input value={prodKeyword} onChange={e => setProdKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchProd())}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" placeholder="Tên sản phẩm..." />
                <button type="button" onClick={searchProd} className="px-3 rounded-lg bg-flower-50 text-flower-100 text-xs">Tìm</button>
              </div>
              {prodResults.length > 0 && (
                <div className="mt-2 border border-gray-100 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {prodResults.map(p => {
                    const sel = selProds.some(s => s.id === p.id);
                    return (
                      <button type="button" key={p.id}
                        onClick={() => sel ? setSelProds(selProds.filter(s => s.id !== p.id)) : setSelProds([...selProds, p])}
                        className={`flex items-center gap-2 w-full text-left p-2 transition ${sel ? 'bg-flower-50' : 'hover:bg-gray-50'}`}>
                        <img src={getImageUrl(p.imageUrl)} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs text-gray-700 truncate">{p.name}</span>
                          <span className="block text-[11px] text-flower-100">{p.price.toLocaleString('vi-VN')}đ</span>
                        </span>
                        <span className={`text-xs font-medium ${sel ? 'text-green-600' : 'text-flower-100'}`}>{sel ? '✓' : '+ Chọn'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selProds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selProds.map(p => (
                    <span key={p.id} className="bg-flower-50 text-flower-100 text-xs rounded-full px-2 py-0.5">
                      {p.name} <button type="button" onClick={() => setSelProds(selProds.filter(s => s.id !== p.id))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {scope === 'Birthday' && (
          <p className="text-xs text-gray-500 bg-flower-50 rounded-lg p-2">
            Mã sinh nhật sẽ được gửi tới người dùng (qua nút "Gửi" trong danh sách, hoặc tự động trước sinh nhật 1 tháng).
          </p>
        )}

        <button type="submit" className="w-full py-2.5 rounded-full bg-flower-100 text-white font-semibold hover:bg-flower-150">
          Tạo mã
        </button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.t}</p>}
      </form>

      {/* Danh sách mã */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-semibold text-gray-800 mb-3">Danh sách mã ({vouchers.length})</p>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {vouchers.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có mã nào.</p>
          ) : vouchers.map(v => (
            <div key={v.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2">
              <span className="bg-flower-100 text-white text-sm font-bold rounded-lg px-2 py-1">{v.discountPercent}%</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{v.code}</p>
                <p className="text-xs text-gray-400">
                  {v.scopeType === 'All' ? 'Tổng thể' : v.scopeType === 'Birthday' ? 'Sinh nhật' : 'Cụ thể'}
                  {' · HSD '}{new Date(v.endDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="flex gap-2">
                {v.scopeType === 'Birthday' && (
                  <button onClick={() => { setSendVoucherId(v.id); setSendMsg(''); setSelectedCustId(''); }}
                    className="text-flower-100 text-xs hover:underline mr-1">Gửi</button>
                )}
                <button onClick={() => del(v.id)} className="text-red-500 text-xs hover:underline">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal gửi mã sinh nhật */}
      {sendVoucherId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl border">
            <p className="font-semibold text-gray-800">Gửi mã sinh nhật</p>
            <p className="text-xs text-gray-400">Chọn khách hàng để gửi mã giảm giá sinh nhật này.</p>
            <select value={selectedCustId} onChange={e => setSelectedCustId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              <option value="">Chọn khách hàng...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
              ))}
            </select>
            {sendMsg && <p className="text-xs text-flower-100">{sendMsg}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setSendVoucherId(null)}
                className="px-4 py-2 border rounded-full text-xs text-gray-500">Hủy</button>
              <button type="button" onClick={sendVoucher} disabled={sendingCode || !selectedCustId}
                className="px-4 py-2 rounded-full bg-flower-100 text-white text-xs font-semibold hover:bg-flower-150 disabled:opacity-50">
                {sendingCode ? 'Đang gửi...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPromotions;
