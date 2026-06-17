import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/fortivus/TopBar";
import { KpiStrip } from "@/components/fortivus/KpiStrip";
import { SituationMap } from "@/components/fortivus/map/SituationMap";
import { EventsColumn } from "@/components/fortivus/EventsColumn";
import { OrdersColumn } from "@/components/fortivus/OrdersColumn";
import { DispatchColumn } from "@/components/fortivus/DispatchColumn";
import { Timeline } from "@/components/fortivus/Timeline";
import { MobileBottomNav } from "@/components/fortivus/MobileNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORTIVUS — Sala de Situação · Incêndios Florestais" },
      { name: "description", content: "Mission Control FORTIVUS: monitore focos do BDQueimadas/INPE, planeje OS e despache brigadas, helitack e maquinário em tempo real." },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  const [selectedFire, setSelectedFire] = useState<string>("f1");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-fire/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-command/8 blur-3xl" />
      </div>

      <main className="flex-1 px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4 pb-24 lg:pb-4">
        <KpiStrip />

        {/* Map + Timeline */}
        <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-3 sm:gap-4">
          <div className="h-[42vh] sm:h-[48vh] xl:h-[52vh] min-h-[280px]">
            <SituationMap selectedId={selectedFire} onSelect={setSelectedFire} />
          </div>
          <div className="xl:h-[52vh] xl:overflow-y-auto">
            <Timeline />
          </div>
        </section>

        {/* 3-column workflow */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:h-[calc(100vh-560px)] lg:min-h-[420px]">
          <EventsColumn selectedId={selectedFire} onSelect={setSelectedFire} />
          <OrdersColumn selectedFireId={selectedFire} />
          <DispatchColumn />
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}
