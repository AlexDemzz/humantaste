import { DeviceRotateIcon } from "@phosphor-icons/react";
import { useRef } from "react";

import { IconStack } from "@/components/reui/icon-stack";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Says why the browser is about to ask for motion access; its Turn on button is the tap iOS requires for that prompt. */
export const MotionDialog = ({
  open,
  onAllow,
  onSkip,
}: {
  open: boolean;
  onAllow: () => void;
  onSkip: () => void;
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => next || onSkip()}>
      {/* It opens by itself, so focus lands on the dialog and no button wears a ring. */}
      <DialogContent
        ref={popupRef}
        initialFocus={popupRef}
        showCloseButton={false}
      >
        <IconStack aria-hidden="true" className="mx-auto">
          <DeviceRotateIcon className="size-5" />
        </IconStack>
        <DialogHeader className="text-center">
          <DialogTitle>Turn on motion for your score card?</DialogTitle>
          <DialogDescription>
            Tilt your phone and the light moves across the card. Your browser
            will ask you to confirm. Motion data stays on your phone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 sm:grid-cols-2">
          <Button variant="outline" size="lg" onClick={onSkip}>
            Skip for now
          </Button>
          <Button size="lg" onClick={onAllow}>
            Turn on motion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
