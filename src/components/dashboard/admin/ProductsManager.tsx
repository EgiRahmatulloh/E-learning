import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Edit3, Save, HelpCircle, Search, X, Filter, RotateCcw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

interface ProductItem {
  id: number;
  namaProduk: string;
  deskripsi: string;
  noHp: string;
  penjual: string;
  satuan: string;
  harga: number;
  status: string; // 'AKTIF', 'NON AKTIF'
  gambar: string;
}

export default function ProductsManager() {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  // Form Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);

  // Form inputs
  const [namaProduk, setNamaProduk] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [noHp, setNoHp] = useState("");
  const [penjual, setPenjual] = useState("");
  const [satuan, setSatuan] = useState("Buah");
  const [harga, setHarga] = useState<number>(0);
  const [status, setStatus] = useState("AKTIF");
  const [gambar, setGambar] = useState("");

  const [originalProduct, setOriginalProduct] = useState<ProductItem | null>(null);

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("/api/products/admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setProducts(data.data);
        }
      })
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoading(false));
  };

  const handleFilter = () => {
    setFilterQuery(searchQuery);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterQuery("");
    setCurrentPage(1);
  };

  const openAddForm = () => {
    setIsAdding(true);
    setIsEditing(true);
    setSelectedItem(null);
    setOriginalProduct(null);
    setNamaProduk("");
    setDeskripsi("");
    setNoHp("");
    setPenjual("");
    setSatuan("Buah");
    setHarga(0);
    setStatus("AKTIF");
    setGambar("");
    setFormOpen(true);
  };

  const openEditForm = (item: ProductItem) => {
    setIsAdding(false);
    setIsEditing(false);
    setSelectedItem(item);
    setOriginalProduct(item);
    setNamaProduk(item.namaProduk);
    setDeskripsi(item.deskripsi);
    setNoHp(item.noHp);
    setPenjual(item.penjual);
    setSatuan(item.satuan);
    setHarga(item.harga);
    setStatus(item.status);
    setGambar(item.gambar);
    setFormOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setGambar(data.url);
        toast.success("Gambar berhasil diunggah");
      } else {
        toast.error("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file);
      } else {
        toast.error("Hanya file gambar yang diperbolehkan");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");

    const payload = {
      namaProduk,
      deskripsi,
      noHp,
      penjual,
      satuan,
      harga: Number(harga),
      status,
      gambar,
    };

    try {
      let res;
      if (isAdding) {
        res = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/products/${selectedItem?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success(isAdding ? "Produk berhasil ditambahkan" : "Produk berhasil diperbarui");
        setFormOpen(false);
        fetchProducts();
      } else {
        toast.error("Gagal menyimpan produk: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus produk ini?",
      variant: "danger"
    })) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Produk berhasil dihapus");
        setFormOpen(false);
        fetchProducts();
      } else {
        toast.error("Gagal menghapus produk: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan saat menghapus produk");
    }
  };

  // Filtered list
  const filteredProducts = products.filter((item) => {
    const matchSearch = item.namaProduk.toLowerCase().includes(filterQuery.toLowerCase());
    return matchSearch;
  });

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🛍️</span> KELOLA WEBSITE PRODUK WARGA BELAJAR
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola galeri produk hasil kreativitas warga belajar PKBM Menuju Makmur.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="CARI NAMA PRODUK"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={openAddForm}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> TAMBAH PRODUK
            </Button>
            <Button
              onClick={handleFilter}
              className="flex-1 h-10 rounded-xl bg-[#00badb] hover:bg-[#009cb9] text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <Filter className="h-4 w-4" /> FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Produk ({filteredProducts.length})
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
            <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat data produk...</span>
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-10">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Tidak ada produk warga belajar yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-48">GAMBAR</th>
                  <th className="py-4 px-6 border-r border-[#009cb9]">NAMA PRODUK</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] w-48">PENJUAL</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">HARGA / SATUAN</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center font-mono">NO. HP/WA</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">STATUS</th>
                  <th className="py-4 px-6 text-center w-32">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {currentItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors">
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {indexOfFirstItem + idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      {item.gambar ? (
                        <img
                          src={item.gambar}
                          alt={item.namaProduk}
                          className="h-14 w-24 object-cover rounded mx-auto border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="h-14 w-24 bg-gray-100 mx-auto rounded border border-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900 uppercase">
                      {item.namaProduk}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 uppercase">
                      {item.penjual}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-mono font-bold text-emerald-600">
                      Rp {item.harga.toLocaleString("id-ID")}
                      <span className="text-slate-400 text-xs font-semibold"> / {item.satuan}</span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-mono">
                      {item.noHp}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          item.status === "AKTIF"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => openEditForm(item)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          className="bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2.5 p-4 border-t border-slate-100">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
                </Button>

                <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
                  {currentPage}
                </span>

                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  Next <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setFormOpen(false)} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-6 relative text-white">
              {/* Close Button */}
              <button
                onClick={() => setFormOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH PRODUK BARU" : (!isEditing ? "LIHAT PRODUK" : "EDIT PRODUK")}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Nama Produk</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Contoh: Keset Rajut Cantik"
                      value={namaProduk}
                      onChange={(e) => setNamaProduk(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Penjual (Warga Belajar)</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Contoh: Aceng"
                      value={penjual}
                      onChange={(e) => setPenjual(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Contoh: 15000"
                      value={harga}
                      onChange={(e) => setHarga(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Satuan</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Contoh: Buah, Paket, Kg"
                      value={satuan}
                      onChange={(e) => setSatuan(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">No. HP/WhatsApp</label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Contoh: 0812..."
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Deskripsi Produk</label>
                  <textarea
                    required
                    rows={2}
                    disabled={!isEditing}
                    className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Tuliskan deskripsi lengkap produk hasil karya di sini..."
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">Status Keaktifan</label>
                    <select
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="NON AKTIF">NON AKTIF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-cyan-50 mb-1">URL / Link Gambar</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="Masukkan URL gambar..."
                      value={gambar}
                      onChange={(e) => setGambar(e.target.value)}
                    />
                  </div>
                </div>

                {/* Drag & Drop Upload Block */}
                <div
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition cursor-pointer text-xs ${
                    dragActive ? "border-yellow-300 bg-white/20" : "border-white/40 hover:border-white hover:bg-white/10"
                  } ${!isEditing && "pointer-events-none opacity-60"}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        await handleImageUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="mx-auto text-white/60 mb-1" size={20} />
                  <span className="font-bold text-white block">
                    {uploading ? "Mengunggah..." : "Tarik Foto / Klik di sini"}
                  </span>
                  <span className="text-[10px] text-cyan-100 block mt-0.5">Mendukung format JPG, PNG, WEBP (Maksimal 5MB)</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  {isAdding ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
                          </>
                        ) : (
                          <>
                            <Save size={15} /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : isEditing ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => {
                          if (originalProduct) {
                            setNamaProduk(originalProduct.namaProduk);
                            setDeskripsi(originalProduct.deskripsi);
                            setNoHp(originalProduct.noHp);
                            setPenjual(originalProduct.penjual);
                            setSatuan(originalProduct.satuan);
                            setHarga(originalProduct.harga);
                            setStatus(originalProduct.status);
                            setGambar(originalProduct.gambar);
                          }
                          setIsEditing(false);
                        }}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
                          </>
                        ) : (
                          <>
                            <Save size={15} /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); if (selectedItem) handleDelete(selectedItem.id); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={15} /> HAPUS
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 size={15} /> EDIT
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
