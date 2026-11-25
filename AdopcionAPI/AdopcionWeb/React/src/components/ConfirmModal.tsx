import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { PawIcon } from "@/components/PawIcon";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  description: string;
  question?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  question,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
      backdrop="blur"
      placement="center"
      radius="lg"
    >
      <ModalContent className="bg-white text-[#11181C]">
        {() => (
          <>
            <ModalHeader className="flex items-center gap-3 pb-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-[#F59E0B]">
                <PawIcon color="#F59E0B" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight">{title}</h3>
                {subtitle && (
                  <p className="text-xs font-normal text-[#52525B]">{subtitle}</p>
                )}
              </div>
            </ModalHeader>

            <ModalBody className="gap-2.5 py-3">
              <p className="text-sm leading-relaxed text-[#52525B]">
                {description}
              </p>
              {question && (
                <p className="text-sm font-semibold text-[#11181C]">{question}</p>
              )}
            </ModalBody>

            <ModalFooter className="gap-2 pt-2">
              <Button
                radius="full"
                variant="flat"
                isDisabled={isLoading}
                onPress={onClose}
                className="font-semibold text-[#11181C]"
              >
                {cancelText}
              </Button>
              <Button
                radius="full"
                isLoading={isLoading}
                onPress={onConfirm}
                className="bg-[#F59E0B] font-semibold text-white shadow-[0_6px_16px_-4px_rgba(245,158,11,0.5)]"
                endContent={!isLoading ? <PawIcon color="#FFFFFF" size={14} /> : undefined}
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
