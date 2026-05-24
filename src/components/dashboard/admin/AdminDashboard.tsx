import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminDashboard() {
  const [studentsList, setStudentsList] = useState([
    { id: 101, name: "Ahmad Fauzi", email: "ahmad@gmail.com", package: "Paket C (SMA)", status: "Aktif" },
    { id: 102, name: "Siti Rahma", email: "siti@gmail.com", package: "Paket B (SMP)", status: "Aktif" },
    { id: 103, name: "Budi Santoso", email: "budi@gmail.com", package: "Paket C (SMA)", status: "Nonaktif" },
  ]);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPackage, setNewStudentPackage] = useState("Paket C (SMA)");

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;
    const newStudent = {
      id: Date.now(),
      name: newStudentName,
      email: newStudentEmail,
      package: newStudentPackage,
      status: "Aktif",
    };
    setStudentsList([...studentsList, newStudent]);
    setNewStudentName("");
    setNewStudentEmail("");
    alert("Berhasil menambahkan warga belajar baru!");
  };

  return (
    <Card className="border-slate-200/60 bg-white p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-[#280f91]">Daftar Warga Belajar</h3>
          <p className="text-xs text-slate-500 font-semibold">Manajemen data peserta didik kesetaraan paket A, B, dan C.</p>
        </div>
      </div>

      {/* Add Student Form */}
      <form onSubmit={handleAddStudent} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Nama Lengkap</label>
          <input
            type="text"
            required
            placeholder="Nama Siswa"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Alamat Email</label>
          <input
            type="email"
            required
            placeholder="email@domain.com"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Paket Belajar</label>
          <select
            value={newStudentPackage}
            onChange={(e) => setNewStudentPackage(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:border-[#280f91] transition-colors"
          >
            <option value="Paket A (SD)">Paket A (SD)</option>
            <option value="Paket B (SMP)">Paket B (SMP)</option>
            <option value="Paket C (SMA)">Paket C (SMA)</option>
          </select>
        </div>
        <Button type="submit" className="h-10 bg-[#280f91] text-white hover:bg-[#ff6105] rounded-lg font-bold text-xs cursor-pointer shadow-md shadow-[#280f91]/10 transition-colors">
          Tambah Siswa
        </Button>
      </form>

      {/* Students Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nama</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Program</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {studentsList.map((student) => (
              <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 font-medium text-slate-700 transition-colors">
                <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{student.id}</td>
                <td className="py-3.5 px-4 font-black text-slate-800">{student.name}</td>
                <td className="py-3.5 px-4 text-xs">{student.email}</td>
                <td className="py-3.5 px-4 text-xs font-bold text-[#280f91]">{student.package}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                    student.status === "Aktif" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
