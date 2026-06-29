import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/fortivus/TopBar";
import { KpiStrip } from "@/components/fortivus/KpiStrip";
import { SituationMap } from "@/components/fortivus/map/SituationMap";
import { EventsColumn } from "@/components/fortivus/EventsColumn";
import { OrdersColumn } from "@/components/fortivus/OrdersColumn";
import { DispatchColumn } from "@/components/fortivus/DispatchColumn";
import { Timeline } from "@/components/fortivus/Timeline";
import { MobileBottomNav } from "@/components/fortivus/MobileNav";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORTIVUS — Sala de Situação · Incêndios Florestais" },
      { name: "description", content: "Mission Control FORTIVUS: monitore focos do NASA/FIRMS, planeje OS e despache brigadas, helitack e maquinário em tempo real." },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  const [selectedFire, setSelectedFire] = useState<string>("f1");
  const { role, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && role === 'COMBATENTE') {
      navigate({ to: '/despachos' });
    }
  }, [isInitialized, role, navigate]);

  return (
    <>
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-fire/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-command/8 blur-3xl" />
      </div>

      <div className="flex flex-col h-full gap-3 sm:gap-4 pb-20 lg:pb-0">
        <KpiStrip />
        <div className="flex-1 min-h-[400px]">
          <SituationMap selectedId={selectedFire} onSelect={setSelectedFire} />
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
