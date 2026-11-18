import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/webgl/CustomCursor";
import SmoothScroll from "@/components/webgl/SmoothScroll";
import PageTransition from "@/components/webgl/PageTransition";
import SocialDock from "@/components/SocialDock";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";

import HubHome from "./pages/HubHome";
import ChunkBoundary from "@/components/ChunkBoundary";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";
import Distribution from "./pages/Distribution";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import Events from "./pages/Events";
import Publication from "./pages/Publication";
import Start from "./pages/Start";
import StartDone from "./pages/StartDone";
import StartBalance from "./pages/StartBalance";
import StartPrep from "./pages/StartPrep";
import StartAddOns from "./pages/StartAddOns";
import PublicationDetail from "./pages/PublicationDetail";
import Exclusive from "./pages/Exclusive";
import NotFound from "./pages/NotFound";
import lazyWithRetry from "@/lib/lazyWithRetry";

// The classic home page: shown when a device cannot run the hub. Loaded only then, so its 3D
// logo scene no longer weighs on every other page.
const Index = lazyWithRetry(() => import("./pages/Index"));
// PropWorld is the only other page built on the 3D library. Loading it on demand keeps that
// library (about 170 KB compressed) out of every other page's first download.
const Propworld = lazyWithRetry(() => import("./pages/Propworld"));

import Login from "./pages/auth/Login";
import Callback from "./pages/auth/Callback";

import DashboardRoot from "./pages/dashboard/index";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import DistributionDashboard from "./pages/dashboard/DistributionDashboard";
import MarketingDashboard from "./pages/dashboard/MarketingDashboard";
import SponsorsDashboard from "./pages/dashboard/SponsorsDashboard";

import CrmProtectedRoute from "@/components/dashboard/CrmProtectedRoute";
import StevieDashboard from "./pages/admin/StevieDashboard";
import MikeDashboard from "./pages/admin/MikeDashboard";
import StevenDashboard from "./pages/admin/StevenDashboard";
import JayDashboard from "./pages/admin/JayDashboard";
import EditorDashboard from "./pages/admin/EditorDashboard";
import DeliverablesReport from "./pages/admin/DeliverablesReport";
import RoadmapBoard from "./pages/admin/RoadmapBoard";
import ContactInquiries from "./pages/admin/ContactInquiries";
import NewsWire from "./pages/admin/NewsWire";
import Invites from "./pages/admin/Invites";
import Funnel from "./pages/admin/Funnel";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // The booking flow keeps its own actions pinned to the bottom of the screen; the dock would sit on top of them.
  const hideSocialDock = location.pathname === "/propworld" || location.pathname === "/exclusive" || location.pathname.startsWith("/start");
  return (
    <>
      <Navbar />
      {children}
      {!hideSocialDock && <SocialDock />}
      <Footer />
    </>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const isDash = location.pathname.startsWith("/dashboard");
  const isAdmin = location.pathname.startsWith("/admin");
  const isAuth = location.pathname.startsWith("/auth");
  const isConsent = location.pathname.startsWith("/.lovable/oauth");

  if (isDash || isAdmin || isAuth || isConsent) {
    return (
      <Routes location={location}>
        <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
        <Route path="/auth/login"    element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />

        {/* Legacy public-site dashboards */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRoot /></ProtectedRoute>} />
        <Route path="/dashboard/admin"        element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/distribution" element={<ProtectedRoute allowedRoles={["admin","distribution"]}><DistributionDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/marketing"    element={<ProtectedRoute allowedRoles={["admin","marketing"]}><MarketingDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/sponsorships" element={<ProtectedRoute allowedRoles={["admin","sponsorships"]}><SponsorsDashboard /></ProtectedRoute>} />

        {/* CRM team dashboards */}
        <Route path="/admin/stevie" element={<CrmProtectedRoute allowedRoles={["admin"]}><StevieDashboard /></CrmProtectedRoute>} />
        <Route path="/admin/mike"   element={<CrmProtectedRoute allowedRoles={["admin","mike"]}><MikeDashboard /></CrmProtectedRoute>} />
        <Route path="/admin/steven" element={<CrmProtectedRoute allowedRoles={["admin","steven"]}><StevenDashboard /></CrmProtectedRoute>} />
        <Route path="/admin/jay"    element={<CrmProtectedRoute allowedRoles={["admin","jay"]}><JayDashboard /></CrmProtectedRoute>} />
        <Route path="/admin/editor" element={<CrmProtectedRoute allowedRoles={["admin","editor","jay"]}><EditorDashboard /></CrmProtectedRoute>} />
        <Route path="/admin/reports/deliverables" element={<CrmProtectedRoute allowedRoles={["admin","jay"]}><DeliverablesReport /></CrmProtectedRoute>} />
        <Route path="/admin/roadmap" element={<CrmProtectedRoute allowedRoles={["admin","mike","steven","jay","editor"]}><RoadmapBoard /></CrmProtectedRoute>} />
        <Route path="/admin/contact" element={<CrmProtectedRoute allowedRoles={["admin","jay"]}><ContactInquiries /></CrmProtectedRoute>} />
        <Route path="/admin/wire" element={<CrmProtectedRoute allowedRoles={["admin","jay","editor"]}><NewsWire /></CrmProtectedRoute>} />
        <Route path="/admin/invites" element={<CrmProtectedRoute allowedRoles={["admin","jay"]}><Invites /></CrmProtectedRoute>} />
        <Route path="/admin/funnel" element={<CrmProtectedRoute allowedRoles={["admin","jay"]}><Funnel /></CrmProtectedRoute>} />
      </Routes>
    );
  }

  // Home is the hub: it has its own nav, menu and footer links, so it sits outside the public
  // layout. The classic home (with the layout) is its fallback.
  if (location.pathname === "/") {
    return (
      <HubHome
        classic={
          <PageTransition key="/">
            <PublicLayout>
              <ChunkBoundary page label="This page didn't load">
                <Suspense fallback={<div className="min-h-screen bg-black" />}>
                  <Index />
                </Suspense>
              </ChunkBoundary>
            </PublicLayout>
          </PageTransition>
        }
      />
    );
  }

  return (
    <PageTransition key={location.pathname}>
      <PublicLayout>
        <Routes location={location}>
          <Route path="/artists"       element={<Artists />} />
          <Route path="/artists/:id"   element={<ArtistDetail />} />
          <Route path="/distribution"  element={<Distribution />} />
          <Route path="/store"         element={<Store />} />
          <Route path="/store/:id"     element={<ProductDetail />} />
          <Route path="/propworld"     element={<ChunkBoundary page label="This page didn't load"><Suspense fallback={<div className="min-h-screen bg-black" />}><Propworld /></Suspense></ChunkBoundary>} />
          <Route path="/contact"       element={<Contact />} />
          <Route path="/events"        element={<Events />} />
          <Route path="/publication"        element={<Publication />} />
          <Route path="/publication/:slug"  element={<PublicationDetail />} />
          <Route path="/exclusive"          element={<Exclusive />} />
          <Route path="/start"              element={<Start />} />
          <Route path="/start/done"         element={<StartDone />} />
          <Route path="/start/balance" element={<StartBalance />} />
          <Route path="/start/prep"         element={<StartPrep />} />
          <Route path="/start/addons"       element={<StartAddOns />} />
          {/* Legacy bio-link typo — redirect so visitors don't 404 */}
          <Route path="/exlusive"           element={<Navigate to="/exclusive" replace />} />
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </PublicLayout>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SmoothScroll>
          <CustomCursor />
          <AppRoutes />
        </SmoothScroll>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
