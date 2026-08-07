import Image from "next/image";
import Link from "next/link";
import type { MockLecturer } from "@/lib/office-hours/mock-data";
import { Card } from "./Card";

export function LecturerCard({ lecturer }: { lecturer: MockLecturer }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Image
          src={lecturer.photoUrl}
          alt=""
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--brand-50)] shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-[var(--ink-900)] truncate">{lecturer.name}</p>
          <p className="text-[11.5px] font-semibold text-[var(--brand-600)] truncate">{lecturer.department}</p>
        </div>
      </div>
      <p className="text-[13px] text-[var(--ink-600)] leading-relaxed line-clamp-2">{lecturer.blurb}</p>
      <Link
        href={`/dashboard/lecturers/${lecturer.id}/slots`}
        className="mt-1 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold no-underline hover:bg-[var(--brand-600)] transition-colors w-fit"
      >
        View slots
      </Link>
    </Card>
  );
}
