import config from 'virtual:open-pages/config';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useLocale } from './lib/use-locale';
import { AssetsPage } from './routes/assets';
import { Home } from './routes/home';
import { HomeShell } from './routes/home-shell';
import { PageView } from './routes/page';
import { ThemeDetailPage, ThemesGalleryPage } from './routes/themes';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {config.build.showPageBrowser ? (
          <Route element={<HomeShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/themes" element={<ThemesGalleryPage />} />
            <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
            <Route path="/assets" element={<AssetsPage />} />
          </Route>
        ) : (
          <Route path="/" element={<NotFound />} />
        )}
        <Route path="/p/:pageId" element={<PageView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function NotFound() {
  const t = useLocale();
  return (
    <div className="grid h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div>
        <p className="folio">{t.notFound.eyebrow}</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {t.notFound.title}
        </h1>
      </div>
    </div>
  );
}
