import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Landing from "@/features/landing/Landing";
import AppShell from "@/features/app/layout/AppShell";
import MissionProgressTracker from "@/features/app/missions/MissionProgressTracker";
import PageLoader from "@/components/PageLoader/PageLoader";

const Portfolio = lazy(() => import("@/features/app/pages/Portfolio"));
const Stake = lazy(() => import("@/features/app/pages/Stake"));
const Earn = lazy(() => import("@/features/app/pages/Earn"));
const Genesis = lazy(() => import("@/features/app/pages/Genesis"));
const Rewards = lazy(() => import("@/features/app/pages/Rewards"));
const Referrals = lazy(() => import("@/features/app/pages/Referrals"));
const Airdrop = lazy(() => import("@/features/app/pages/Season"));
const History = lazy(() => import("@/features/app/pages/History"));
const Ecosystem = lazy(() => import("@/features/app/pages/Ecosystem"));
const Learn = lazy(() => import("@/features/app/pages/Learn"));
const AdminDashboard = lazy(() => import("@/features/admin/AdminDashboard"));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/admin"
        element={
          <Lazy>
            <AdminDashboard />
          </Lazy>
        }
      />

      <Route
        element={
          <>
            <MissionProgressTracker />
            <AppShell />
          </>
        }
      >
        <Route path="/app" element={<Lazy><Portfolio /></Lazy>} />
        <Route path="/app/stake" element={<Lazy><Stake /></Lazy>} />
        <Route path="/app/earn" element={<Lazy><Earn /></Lazy>} />
        <Route path="/app/genesis" element={<Lazy><Genesis /></Lazy>} />
        <Route path="/app/rewards" element={<Lazy><Rewards /></Lazy>} />
        <Route path="/app/referrals" element={<Lazy><Referrals /></Lazy>} />
        <Route path="/app/airdrop" element={<Lazy><Airdrop /></Lazy>} />
        <Route path="/app/season" element={<Navigate to="/app/airdrop" replace />} />
        <Route path="/app/history" element={<Lazy><History /></Lazy>} />
        <Route path="/app/ecosystem" element={<Lazy><Ecosystem /></Lazy>} />
        <Route path="/app/learn" element={<Lazy><Learn /></Lazy>} />
      </Route>
    </Routes>
  );
}
