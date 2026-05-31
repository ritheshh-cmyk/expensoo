import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, Trash2, Edit, RefreshCw } from "lucide-react";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://backendmobile-4swg.onrender.com/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`https://backendmobile-4swg.onrender.com/api/auth/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const handleRoleChange = async (id: number, currentRole: string) => {
    const newRole = prompt("Enter new role (admin, owner, worker):", currentRole);
    if (!newRole || !["admin", "owner", "worker"].includes(newRole)) return;
    try {
      const res = await fetch(`https://backendmobile-4swg.onrender.com/api/auth/users/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast({ title: "Success", description: "Role updated successfully" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            User Management
          </CardTitle>
          <CardDescription className="mt-1">
            Manage users, assign roles, and handle account lifecycles
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{user.username}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleRoleChange(user.id, user.role)}>
                        <Edit className="h-4 w-4 mr-2" /> Role
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
