import { ModuleHeader } from "@/components/Shell";
import { NewCourseForm } from "./NewCourseForm";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl">
        <NewCourseForm />
      </div>
    </>
  );
}
