"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUser, updateUser, deleteUser } from "@/app/actions/users";
import { Pencil, Trash2, Plus, Loader2, Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
  };
};

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("sales");

  const openCreateModal = () => {
    setEditingUser(null);
    setEmail("");
    setPassword("");
    setRole("sales");
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEmail(user.email || "");
    setPassword("");
    setRole(user.user_metadata?.role || "sales");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    if (password) formData.append("password", password);
    formData.append("role", role);

    try {
      if (editingUser) {
        const res = await updateUser(editingUser.id, formData);
        if (res.error) {
          alert(res.error);
        } else if (res.user) {
          setUsers(users.map(u => u.id === editingUser.id ? res.user as any : u));
          setIsModalOpen(false);
        }
      } else {
        if (!password) {
          alert("Password is required for new users");
          setLoading(false);
          return;
        }
        const res = await createUser(formData);
        if (res.error) {
          alert(res.error);
        } else if (res.user) {
          setUsers([...users, res.user as any]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      alert("An error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const res = await deleteUser(id);
      if (res.error) {
        alert(res.error);
      } else {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (err: any) {
      alert("An error occurred: " + err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, update, and manage system users.
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-200">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 capitalize">
                      {user.user_metadata?.role || "sales"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                {editingUser ? "Edit User" : "Create New User"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950 border-slate-800 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="sales">Sales</option>
                  <option value="operation">Operation</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingUser ? "Save Changes" : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
