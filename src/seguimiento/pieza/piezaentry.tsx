import { Link } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const [id, setId] = useState(null);
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-neutral-100 via-white to-neutral-200 text-neutral-900 dark:from-black dark:via-neutral-950 dark:to-neutral-900 dark:text-neutral-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-8">
        <input type="hidden" name="id" />
        <Link to={`/pieza/${id}`} className="flex">
          ir
        </Link>
      </main>
    </div>
  );
}
