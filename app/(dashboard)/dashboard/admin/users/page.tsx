"use client";

import { useState } from "react";
import { ArrowUpDown, CalendarCheck, ShieldAlert, Trash2, UserX } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { getMockAdminUsers, getMockSemesters } from "@/lib/office-hours/mock-data";
import type { AdminUserRow, Semester } from "@/lib/office-hours/types";
import type { UserRole } from "@/lib/auth/types";

type Tab = "USERS" | "SEMESTERS";
type RoleFilter = UserRole | "ALL";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--success-100)] text-[var(--success-700)]">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--paper-100)] text-[var(--ink-500)]">
      Inactive
    </span>
  );
}

function SortButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
        active ? "text-[var(--brand-700)]" : "text-[var(--ink-500)] hover:text-[var(--brand-700)]"
      }`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" strokeWidth={2} />
    </button>
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
    <tr className="border-b border-[var(--paper-100)] bg-[var(--brand-50)]">
      <td className="px-5 py-3.5" colSpan={5}>
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
            >
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="ADMIN">Admin</option>
            </select>
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
            <button
              type="button"
              onClick={() => onSave(role, department)}
              className="px-3.5 py-2 rounded-xl bg-[var(--brand-500)] text-white text-[13px] font-bold hover:bg-[var(--brand-600)] transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)]"
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-200)]">
                <th className="text-left px-5 py-3">
                  <SortButton label="Name" active onClick={() => setSortAscending((v) => !v)} />
                </th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Department</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={u.id} className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[var(--ink-900)]">{u.fullName}</p>
                      <p className="text-[12px] text-[var(--ink-500)]">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ink-700)] hidden sm:table-cell">{u.role}</td>
                    <td className="px-5 py-3.5 text-[var(--ink-700)] hidden sm:table-cell">{u.department ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill active={u.active} />
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingId(u.id)}
                        className="text-[13px] font-semibold text-[var(--brand-500)] hover:underline mr-3"
                      >
                        Edit
                      </button>
                      {u.active && (
                        <button
                          type="button"
                          onClick={() => setPendingDeactivateId(u.id)}
                          className="text-[13px] font-semibold text-[var(--danger-700)] hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
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
          <button
            type="button"
            onClick={onActivate}
            title="Activate"
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--success-100)] hover:text-[var(--success-700)] transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
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
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <FormField label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring 2027" className="w-48" />
          </FormField>
          <FormField label="Start date">
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End date">
            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
          >
            Add semester
          </button>
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
  const [tab, setTab] = useState<Tab>("USERS");
  const [users, setUsers] = useState<AdminUserRow[]>(() => getMockAdminUsers());
  const [semesters, setSemesters] = useState<Semester[]>(() => getMockSemesters());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Users & Semesters</h1>
        <p className="text-sm text-[var(--ink-600)]">Manage platform accounts and academic terms.</p>
      </div>

      <FilterTabs
        options={[
          { value: "USERS" as Tab, label: "Users" },
          { value: "SEMESTERS" as Tab, label: "Semesters" },
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
