import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { creativeApi, CreativePost } from '../api/creativeApi';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageHelper';

const CreativeCornerPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CreativePost[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = () => creativeApi.getAll().then(setPosts).catch(() => setPosts([]));
  useEffect(() => { load(); }, []);

  const onPickFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : '');
  };

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (file) imageUrl = await creativeApi.uploadImage(file);
      if (editingId) {
        await creativeApi.update(editingId, { content, imageUrl });
      } else {
        await creativeApi.create({ content, imageUrl });
      }
      setContent(''); setFile(null); setPreview(''); setEditingId(null);
      await load();
    } catch {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const startEdit = (p: CreativePost) => {
    setEditingId(p.id); setContent(p.content); setPreview(p.imageUrl ? getImageUrl(p.imageUrl) : ''); setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!window.confirm('Xóa bài viết này?')) return;
    await creativeApi.remove(id).then(load).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-flower-50/40 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-flower-100">✨ Góc Sáng Tạo</h1>
          <p className="text-gray-500 mt-1">Chia sẻ hình ảnh và cảm nhận của bạn cùng cộng đồng 3TL-Store</p>
        </div>

        {/* Form gửi bài */}
        {isAuthenticated ? (
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-flower-100 p-5 mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết cảm nhận của bạn..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flower-100" />
            {preview && (
              <img src={preview} alt="preview" className="mt-3 max-h-52 rounded-xl object-contain" />
            )}
            <div className="flex items-center justify-between mt-3">
              <label className="text-sm text-flower-100 cursor-pointer hover:underline">
                📷 Thêm ảnh
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setContent(''); setPreview(''); setFile(null); }}
                    className="px-4 py-2 rounded-full text-sm border border-gray-200 text-gray-500">Hủy</button>
                )}
                <button type="submit" disabled={sending || !content.trim()}
                  className="px-6 py-2 rounded-full bg-flower-100 text-white text-sm font-semibold hover:bg-flower-150 disabled:opacity-50">
                  {sending ? 'Đang gửi...' : editingId ? 'Cập nhật' : 'Gửi bài'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 text-center text-sm text-gray-500">
            <button onClick={() => navigate('/login')} className="text-flower-100 font-semibold hover:underline">Đăng nhập</button> để chia sẻ bài viết của bạn.
          </div>
        )}

        {/* Danh sách bài viết — giao diện dạng khung chat */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
          ) : posts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-flower-100 overflow-hidden">
              {/* Header của bài viết */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-flower-100 bg-flower-50/50">
                <div className="w-10 h-10 rounded-full bg-flower-100 flex items-center justify-center overflow-hidden shadow-inner">
                  {p.userAvatar ? (
                    <img src={getImageUrl(p.userAvatar)} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="text-white font-semibold">{p.userName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{p.userName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                {p.canEdit && (
                  <div className="flex gap-2.5 text-xs font-semibold">
                    <button onClick={() => startEdit(p)} className="text-blue-500 hover:text-blue-600 hover:underline">Sửa</button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-600 hover:underline">Xóa</button>
                  </div>
                )}
              </div>

              {/* Phần thân chứa Ảnh và Khối Chat */}
              <div className="p-5 flex flex-col gap-4">
                {p.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 max-h-96 flex justify-center bg-gray-50 shadow-sm">
                    <img src={getImageUrl(p.imageUrl)} alt="" className="max-w-full max-h-96 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                )}
                
                {/* Khối tin nhắn chat */}
                <div className="flex items-start">
                  <div className="bg-flower-50 border border-flower-100/50 rounded-2xl rounded-tl-none px-5 py-3 shadow-sm max-w-full md:max-w-[85%]">
                    <p className="whitespace-pre-wrap text-[15px] text-pink-700 font-semibold leading-relaxed">
                      {p.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreativeCornerPage;
