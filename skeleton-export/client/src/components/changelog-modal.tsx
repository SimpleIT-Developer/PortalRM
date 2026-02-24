import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import versionData from "@/version.json";
import featuresData from "@/features.json";
import { Bell, Sparkles } from "lucide-react";

export function ChangelogModal() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if the user has opted out of seeing this specific version
    const storedVersion = localStorage.getItem("lastSeenVersion");
    const currentVersion = versionData.version;
    const isSuppressed = localStorage.getItem("suppressVersionNotification") === "true";
    
    if (!isSuppressed && storedVersion !== currentVersion) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Save current version as seen
    localStorage.setItem("lastSeenVersion", versionData.version);
    
    // Save suppression preference
    if (dontShowAgain) {
      localStorage.setItem("suppressVersionNotification", "true");
    } else {
      localStorage.removeItem("suppressVersionNotification");
    }
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(true);
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border">
        <div className="p-6 pb-2 h-full flex flex-col">
            <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-1">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg text-foreground">O que há de novo</h2>
            </div>
            <DialogTitle className="sr-only">Novidades e Atualizações</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="updates" className="flex-1 flex flex-col h-full overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="updates">Novidades e Atualizações</TabsTrigger>
                    <TabsTrigger value="features">Funcionalidades</TabsTrigger>
                </TabsList>
                
                <TabsContent value="updates" className="flex-1 mt-0 overflow-hidden flex flex-col">
                    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[50vh]">
                        <div className="p-4 border-b border-border bg-muted/50">
                            <h3 className="font-semibold text-primary text-base">
                                {versionData.title}
                            </h3>
                        </div>
                        
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-8">
                                {versionData.updates.map((update, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Data: <span className="text-foreground font-normal">{update.date}</span>
                                        </div>
                                        {update.ticket && (
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Ticket: <span className="text-foreground font-normal">{update.ticket}</span>
                                            </div>
                                        )}
                                        <div className="text-sm font-medium text-muted-foreground">
                                            Tipo: <span className="text-foreground font-normal">{update.type}</span>
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground mt-1">
                                            Descrição: <span className="text-foreground font-normal">{update.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>
                
                <TabsContent value="features" className="flex-1 mt-0 overflow-hidden flex flex-col">
                    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[50vh]">
                        <div className="p-4 border-b border-border bg-muted/50">
                            <h3 className="font-semibold text-primary text-base">
                                {featuresData.title}
                            </h3>
                        </div>
                        
                        <ScrollArea className="flex-1">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {featuresData.features.map((feature, index) => (
                                    <div key={index} className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <h4 className="font-semibold text-foreground text-sm">{feature.title}</h4>
                                        </div>
                                        <div className="text-xs font-medium text-primary mb-2 px-2 py-0.5 rounded-full bg-primary/10 w-fit">
                                            {feature.category}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2 flex flex-row items-center justify-between sm:justify-between bg-background">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="dont-show" 
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                    className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label 
                    htmlFor="dont-show" 
                    className="text-sm font-normal text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                    Não mostrar notificações de versão automaticamente
                </Label>
            </div>
            <Button onClick={handleClose} variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
                Fechar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
