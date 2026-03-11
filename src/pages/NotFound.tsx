import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-muted px-4">
      <div className="text-center w-full max-w-md">
        <h1 className="mb-4 text-3xl sm:text-4xl font-bold">404</h1>
        <p className="mb-4 text-lg sm:text-xl text-muted-foreground">Página não encontrada</p>
        <a href="/" className="inline-block min-h-[44px] leading-[44px] text-primary underline hover:text-primary/90 touch-manipulation">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
