import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVersionNotification } from '@/hooks/simpledfe/useVersionNotification';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

interface VersionNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isManualView?: boolean;
}

export const VersionNotificationDialog: React.FC<VersionNotificationDialogProps> = ({
  isOpen,
  onClose,
  isManualView = false
}) => {
  const { versionData, updateNotificationPreference } = useVersionNotification();
  const { toast } = useToast();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = async () => {
    if (dontShowAgain && !isManualView) {
      try {
        await updateNotificationPreference.mutateAsync(false);
        toast({
          title: "Preferência atualizada",
          description: "Você não receberá mais notificações de versão automaticamente.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a preferência.",
          variant: "destructive",
        });
      }
    }
    onClose();
  };

  if (!versionData?.hasVersion) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Novidades e Atualizações
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Sistema SimpleDFe - Última Atualização
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
                {versionData.content}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col gap-3">
          {!isManualView && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label htmlFor="dont-show-again" className="text-sm text-gray-700 dark:text-gray-300">
                Não mostrar notificações de versão automaticamente
              </label>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={handleClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};