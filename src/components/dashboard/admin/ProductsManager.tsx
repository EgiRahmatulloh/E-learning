import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Edit, Save, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  // Form Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(true);
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
    setSelectedItem(null);
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
    setSelectedItem(item);
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
      } else {
        alert("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Error mengunggah gambar");
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
        alert("Hanya file gambar yang diperbolehkan");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setFormOpen(false);
        fetchProducts();
      } else {
        alert("Gagal menyimpan produk: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menyimpan produk");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

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
        fetchProducts();
      } else {
        alert("Gagal menghapus produk: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus produk");
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
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Produk Warga Belajar</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola galeri produk hasil kreativitas warga belajar PKBM Menuju Makmur</p>
        </div>
        <Button onClick={openAddForm} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
          <Plus size={16} />
          Tambah Produk
        </Button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cari Nama Produk</label>
          <input
            type="text"
            className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Masukkan nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2 pt-5">
          <Button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2">
            Filter
          </Button>
          <Button onClick={handleReset} variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-100 text-sm px-4 py-2">
            Reset
          </Button>
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-500 text-sm">Memuat data produk...</span>
        </div>
      ) : totalItems === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-lg">
          <HelpCircle size={48} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">Tidak ada produk warga belajar yang ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-xs font-bold uppercase border-b border-gray-100">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4 w-48">Gambar</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Deskripsi</th>
                <th className="py-3.5 px-4">Penjual</th>
                <th className="py-3.5 px-4">Harga / Satuan</th>
                <th className="py-3.5 px-4">No. HP/WA</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {currentItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-4 text-center text-gray-500">{indexOfFirstItem + idx + 1}</td>
                  <td className="py-4 px-4">
                    {item.gambar ? (
                      <img
                        src={item.gambar}
                        alt={item.namaProduk}
                        className="h-16 w-24 object-cover rounded border border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-24 bg-gray-100 rounded border border-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-800">{item.namaProduk}</td>
                  <td className="py-4 px-4 max-w-xs truncate">{item.deskripsi}</td>
                  <td className="py-4 px-4">{item.penjual}</td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-emerald-600">
                      Rp {item.harga.toLocaleString("id-ID")}
                    </span>
                    <span className="text-gray-400 text-xs"> / {item.satuan}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs">{item.noHp}</td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "AKTIF"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => openEditForm(item)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit Produk"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus Produk"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100 text-sm">
              <span className="text-gray-500">
                Menampilkan <strong className="text-gray-700">{indexOfFirstItem + 1}</strong> sampai{" "}
                <strong className="text-gray-700">{Math.min(indexOfLastItem, totalItems)}</strong> dari{" "}
                <strong className="text-gray-700">{totalItems}</strong> produk
              </span>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3"
                >
                  Sebelumnya
                </Button>
                {Array.from({ length: totalPages }).map((_, pageIdx) => (
                  <Button
                    key={pageIdx}
                    onClick={() => setCurrentPage(pageIdx + 1)}
                    variant={currentPage === pageIdx + 1 ? "default" : "outline"}
                    size="sm"
                    className={`text-xs h-8 w-8 p-0 ${
                      currentPage === pageIdx + 1 ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""
                    }`}
                  >
                    {pageIdx + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl bg-white rounded-lg shadow-lg border border-gray-100 p-0 overflow-hidden">
          <DialogHeader className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-bold text-gray-800">
              {isAdding ? "Tambah Produk Baru" : "Edit Produk"}
            </DialogTitle>
            <DialogClose className="text-gray-400 hover:text-gray-600 text-lg font-semibold focus:outline-none">
              ✕
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Contoh: Keset Rajut Cantik"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Penjual (Warga Belajar)</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Contoh: Aceng"
                  value={penjual}
                  onChange={(e) => setPenjual(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Contoh: 15000"
                  value={harga}
                  onChange={(e) => setHarga(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Satuan</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Contoh: Buah, Paket, Kg"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">No. HP/WhatsApp Penjual</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Contoh: 081234567890"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Deskripsi Produk</label>
              <textarea
                required
                rows={3}
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                placeholder="Tuliskan deskripsi lengkap produk hasil karya di sini..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status Keaktifan</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="NON AKTIF">NON AKTIF</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">URL / Link Gambar</label>
                <input
                  type="text"
                  className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-gray-50"
                  placeholder="Unggah berkas atau isi manual..."
                  value={gambar}
                  onChange={(e) => setGambar(e.target.value)}
                />
              </div>
            </div>

            {/* Drag & Drop Upload Block */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                id="image-file-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    await handleImageUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-xs text-gray-500 font-semibold mb-1">
                Tarik & letakkan file gambar di sini, atau klik tombol di bawah
              </p>
              <p className="text-[10px] text-gray-400 mb-3">Mendukung format JPG, PNG, WEBP hingga 5MB</p>
              <Button
                type="button"
                disabled={uploading}
                onClick={() => document.getElementById("image-file-input")?.click()}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 h-auto"
              >
                {uploading ? "Mengunggah..." : "Pilih File Gambar"}
              </Button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="text-gray-500 hover:bg-gray-100 text-sm">
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-2">
                <Save size={16} />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
