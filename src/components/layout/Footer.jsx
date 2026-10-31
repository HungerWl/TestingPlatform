export default function Footer() {
  return (
    <footer className="tp-footer">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span>© 2026 TESTING PLATFORM</span>
        <span className="hidden h-3 w-px bg-line sm:block" />
        <span className="text-muted/80">DESIGNED FOR QUALITY ENGINEERING</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="hidden sm:inline">BUILD 2.4.0 / STABLE</span>
        <span className="flex items-center gap-2">
          <i className="tp-footer__dot" />
          ALL SYSTEMS NOMINAL
        </span>
      </div>
    </footer>
  );
}
