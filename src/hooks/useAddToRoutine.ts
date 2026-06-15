import { useRoutineStore } from "@/store/routine-store";
import { useToastStore } from "@/store/toast-store";
import { Product } from "@/types";
import { checkConflicts } from "@/lib/conflict-checker";

export function useAddToRoutine() {
  const routine = useRoutineStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleAddToRoutine = (product: Product, timeOfDay?: "AM" | "PM" | "both") => {
    const targetTime = timeOfDay || product.timeOfDay || "both";

    const checkAndConfirmConflict = (existingProducts: Product[]): boolean => {
      const testProducts = [...existingProducts, product];
      const conflicts = checkConflicts(testProducts);
      if (conflicts.length > 0) {
        const conflictDetails = conflicts
          .map((c) => `• ${c.items.join(" + ")}: ${c.reason}`)
          .join("\n\n");
        return window.confirm(
          `🚨 PHÁT HIỆN XUNG ĐỘT HOẠT CHẤT!\n\nSản phẩm này có thể gây kích ứng khi kết hợp với các sản phẩm sẵn có trong chu trình của bạn:\n\n${conflictDetails}\n\nBạn có chắc chắn vẫn muốn thêm sản phẩm này không?`
        );
      }
      return true;
    };

    if (targetTime === "PM") {
      if (!checkAndConfirmConflict(routine.eveningRoutine)) return;
      const success = routine.addToEvening(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine tối`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
    } else if (targetTime === "AM") {
      if (!checkAndConfirmConflict(routine.morningRoutine)) return;
      const success = routine.addToMorning(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
    } else {
      // both/either
      // Check morning routine conflict first
      const canAddMorning = checkAndConfirmConflict(routine.morningRoutine);
      if (canAddMorning) {
        const addedMorning = routine.addToMorning(product);
        if (addedMorning) {
          addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
          return;
        }
      } else {
        // If user cancelled, don't fallback to evening
        return;
      }

      // If morning is full, check and confirm evening routine conflicts
      const canAddEvening = checkAndConfirmConflict(routine.eveningRoutine);
      if (canAddEvening) {
        const addedEvening = routine.addToEvening(product);
        if (addedEvening) {
          addToast(`Đã thêm ${product.name} vào routine tối`, "success");
        } else {
          addToast("Giới hạn tối đa 5 sản phẩm cho mỗi routine", "error");
        }
      }
    }
  };

  return { handleAddToRoutine };
}
