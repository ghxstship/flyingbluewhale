import { ModuleHeader } from "@/components/Shell";
import { CourseNewToggle } from "./CourseNewToggle";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl">
        <CourseNewToggle />
      </div>
    </>
  );
}
