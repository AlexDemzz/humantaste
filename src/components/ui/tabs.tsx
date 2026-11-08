import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-card relative flex w-fit max-w-full gap-1 overflow-x-auto rounded-full p-1 shadow-xs",
        className
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className="bg-muted absolute top-1 left-0 h-8 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full transition-all duration-200 ease-out motion-reduce:transition-none"
      />
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "text-muted-foreground can-hover:hover:text-foreground data-active:text-foreground focus-visible:ring-ring/50 relative z-10 inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "focus-visible:ring-ring/50 rounded-2xl text-sm outline-none focus-visible:ring-3",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
