import { ModuleHeader } from "@/components/Shell";
import { NewCourseWithAI } from "./NewCourseWithAI";
import { createCourseAction } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl">
        <NewCourseWithAI action={createCourseAction} />
      </div>
    </>
  );
}
