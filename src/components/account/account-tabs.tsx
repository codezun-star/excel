"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AccountTabs({
  tabs,
  defaultTab,
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  defaultTab?: string;
}) {
  return (
    <Tabs defaultValue={defaultTab ?? tabs[0]?.id}>
      <TabsList className="w-full sm:w-fit">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id} className="mt-4">
          {t.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
