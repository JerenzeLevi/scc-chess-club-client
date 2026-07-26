export function Footer() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-8 text-sm">
        <p>&copy; {new Date().getFullYear()} SCC Chess Club.</p>
      </div>
    </footer>
  );
}
