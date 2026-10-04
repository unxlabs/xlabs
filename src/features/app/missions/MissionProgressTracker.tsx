import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/shared/auth/AuthProvider";
import { getMyMissions, recordMissionStep } from "@/shared/api/season";

const ROUTE_STEPS: Array<{ matches: (pathname: string) => boolean; stepKey: string }> = [
  { matches: (pathname) => pathname === "/app", stepKey: "portfolio" },
  { matches: (pathname) => pathname === "/app/earn", stepKey: "earn" },
  { matches: (pathname) => pathname === "/app/stake", stepKey: "stake" },
  { matches: (pathname) => pathname === "/app/genesis", stepKey: "genesis" },
];

export default function MissionProgressTracker() {
  const location = useLocation();
  const { isAuthenticated, isRestoring } = useAuth();
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthenticated || isRestoring) return;
    const routeStep = ROUTE_STEPS.find((entry) => entry.matches(location.pathname));
    if (!routeStep) return;

    let cancelled = false;
    const run = async () => {
      try {
        const profile = await getMyMissions();
        if (cancelled || profile.participation?.status !== "active") return;
        const mission = profile.missions.find((item) =>
          item.availableNow &&
          item.verificationType === "system" &&
          item.appSteps?.requiredSteps.includes(routeStep.stepKey) &&
          !(item.completedSteps ?? []).includes(routeStep.stepKey) &&
          (item.verifiedCompletionCount ?? 0) === 0
        );
        if (!mission) return;
        const key = `${mission.id}:${routeStep.stepKey}`;
        if (inFlight.current.has(key)) return;
        inFlight.current.add(key);
        try { await recordMissionStep(mission.id, routeStep.stepKey); }
        finally { inFlight.current.delete(key); }
      } catch (error) {
        console.warn("Mission progress was not recorded:", error);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [isAuthenticated, isRestoring, location.pathname]);

  return null;
}
