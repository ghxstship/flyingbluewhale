import { ModuleHeader } from "@/components/Shell";
import { NewProjectForm } from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <ModuleHeader title="New project" subtitle="Create a project for your organization" />
      <div className="page-content max-w-2xl">
        <NewProjectForm />
      </div>
    </>
  );
}
