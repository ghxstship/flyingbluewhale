export default function PortalLoading() {
  return (
    <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
      <p className="text-label text-secondary animate-pulse">Loading Portal...</p>
    </div>
  );
}
