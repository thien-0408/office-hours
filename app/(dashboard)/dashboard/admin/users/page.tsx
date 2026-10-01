"use client";

import { useState } from "react";
import { CalendarCheck, ShieldAlert, Trash2, UserX } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { getMockAdminUsers, getMockSemesters } from "@/lib/office-hours/mock-data";
import type { AdminUserRow, Semester } from "@/lib/office-hours/types";
import type { UserRole } from "@/lib/auth/types";
import { useI18n } from "@/i18n/provider";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortButton } from "@/components/dashboard/SortButton";
import { Badge } from "@/components/ui/badge";

type Tab = "USERS" | "SEMESTERS";
type RoleFilter = UserRole | "ALL";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="neutral">Inactive</Badge>
  );
}

function UserEditRow({
  user,
  onSave,
  onCancel,
}: {
  user: AdminUserRow;
  onSave: (role: UserRole, department: string) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [department, setDepartment] = useState(user.department ?? "");

  return (
    <TableRow className="border-b border-[var(--paper-100)] bg-[var(--brand-50)]">
      <TableCell className="px-5 py-3.5" colSpan={5}>
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Role">
            <NativeSelect
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-auto"
            >
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="ADMIN">Admin</option>
            </NativeSelect>
          </FormField>
          <FormField label="Department">
            <TextInput
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-56"
            />
          </FormField>
          <div className="flex items-center gap-2 pb-0.5">
            <Button
              type="button"
              onClick={() => onSave(role, department)}
            >
              Save
            </Button>
            <Button variant="link-muted"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function UsersTab({ users, setUsers }: { users: AdminUserRow[]; setUsers: React.Dispatch<React.SetStateAction<AdminUserRow[]>> }) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [sortAscending, setSortAscending] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<number | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = users
    .filter((u) => roleFilter === "ALL" || u.role === roleFilter)
    .filter((u) => !q || `${u.fullName} ${u.email}`.toLowerCase().includes(q))
    .sort((a, b) => (sortAscending ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <FormField label="Search">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email…"
            className="sm:w-72"
          />
        </FormField>
        <FilterTabs
          options={[
            { value: "ALL" as RoleFilter, label: "All roles" },
            { value: "STUDENT" as RoleFilter, label: "Student" },
            { value: "LECTURER" as RoleFilter, label: "Lecturer" },
            { value: "ADMIN" as RoleFilter, label: "Admin" },
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">No users match your search.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-[var(--paper-200)]">
                <TableHead className="text-left px-5 py-3">
                  <SortButton label="Name" active onClick={() => setSortAscending((v) => !v)} />
                </TableHead>
                <TableHead className="text-left px-5 py-3 hidden sm:table-cell">Role</TableHead>
                <TableHead className="text-left px-5 py-3 hidden sm:table-cell">Department</TableHead>
                <TableHead className="text-left px-5 py-3">Status</TableHead>
                <TableHead className="text-right px-5 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) =>
                editingId === u.id ? (
                  <UserEditRow
                    key={u.id}
                    user={u}
                    onCancel={() => setEditingId(null)}
                    onSave={(role, department) => {
                      setUsers((list) =>
                        list.map((row) => (row.id === u.id ? { ...row, role, department: department.trim() || null } : row))
                      );
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <TableRow key={u.id}
                  className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors">
                    <TableCell className="px-5 py-3.5">
                      <p className="font-semibold text-[var(--ink-900)]">{u.fullName}</p>
                      <p className="text-[12px] text-[var(--ink-500)]">{u.email}</p>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-[var(--ink-700)] hidden sm:table-cell">{u.role}</TableCell>
                    <TableCell className="px-5 py-3.5 text-[var(--ink-700)] hidden sm:table-cell">{u.department ?? "—"}</TableCell>
                    <TableCell className="px-5 py-3.5">
                      <StatusPill active={u.active} />
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Button variant="link-brand"
                        type="button"
                        onClick={() => setEditingId(u.id)} className="mr-3"
                      >
                        Edit
                      </Button>
                      {u.active && (
                        <Button variant="link-danger"
                          type="button"
                          onClick={() => setPendingDeactivateId(u.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmModal
        open={pendingDeactivateId !== null}
        icon={UserX}
        title="Deactivate this user?"
        description="They'll lose access immediately. This can be reversed later by re-activating the account."
        confirmLabel="Deactivate"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeactivateId(null)}
        onConfirm={() => {
          setUsers((list) => list.map((u) => (u.id === pendingDeactivateId ? { ...u, active: false } : u)));
          setPendingDeactivateId(null);
        }}
      />
    </div>
  );
}

function SemesterCard({
  semester,
  onActivate,
  onDelete,
}: {
  semester: Semester;
  onActivate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[var(--ink-900)]">{semester.name}</p>
          {semester.active && (
            <span className="px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--success-100)] text-[var(--success-700)]">
              Active
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--ink-600)] tabular-nums">
          {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!semester.active && (
          <Button variant="ghost-success" size="icon-md"
            type="button"
            onClick={onActivate}
            title="Activate"
          >
            <CalendarCheck className="w-3.5 h-3.5" strokeWidth={2} />
          </Button>
        )}
        <Button variant="ghost-danger" size="icon-md"
          type="button"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </Button>
      </div>
    </Card>
  );
}

function SemestersTab({ semesters, setSemesters }: { semesters: Semester[]; setSemesters: React.Dispatch<React.SetStateAction<Semester[]>> }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = [...semesters].sort((a, b) => a.startDate.localeCompare(b.startDate));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    const nextId = semesters.length === 0 ? 1 : Math.max(...semesters.map((s) => s.id)) + 1;
    setSemesters((list) => [...list, { id: nextId, name: name.trim(), startDate, endDate, active: false }]);
    setName("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title="Add a semester" />
        <form onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4">
          <FormField label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring 2027" className="w-48" />
          </FormField>
          <FormField label="Start date">
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End date">
            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
          <Button
            type="submit"
          >
            Add semester
          </Button>
        </form>
      </Card>

      <div>
        <SectionHeader title="Semesters" />
        <div className="flex flex-col gap-3">
          {sorted.map((s) => (
            <SemesterCard
              key={s.id}
              semester={s}
              onActivate={() => setSemesters((list) => list.map((row) => ({ ...row, active: row.id === s.id })))}
              onDelete={() => setPendingDeleteId(s.id)}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this semester?"
        description="Any bookings or recurring series tied to it stay in history — this only removes it from future scheduling."
        confirmLabel="Delete semester"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setSemesters((list) => list.filter((s) => s.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("USERS");
  const [users, setUsers] = useState<AdminUserRow[]>(() => getMockAdminUsers());
  const [semesters, setSemesters] = useState<Semester[]>(() => getMockSemesters());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">{t("admin.usersTitle")}</h1>
        <p className="text-sm text-[var(--ink-600)]">Manage platform accounts and academic terms.</p>
      </div>

      <FilterTabs
        options={[
          { value: "USERS" as Tab, label: t("admin.users") },
          { value: "SEMESTERS" as Tab, label: t("admin.semesters") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "USERS" ? (
        <UsersTab users={users} setUsers={setUsers} />
      ) : (
        <SemestersTab semesters={semesters} setSemesters={setSemesters} />
      )}
    </div>
  );
}
