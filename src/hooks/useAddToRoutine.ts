import { useRoutineStore } from "@/store/routine-store";
import { useToastStore } from "@/store/toast-store";
import { Product } from "@/types";

export function useAddToRoutine() {
  const routine = useRoutineStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleAddToRoutine = (product: Product, timeOfDay?: "AM" | "PM" | "both") => {
    const targetTime = timeOfDay || product.timeOfDay || "both";

    if (targetTime === "PM") {
      const success = routine.addToEvening(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine tối`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
    } else if (targetTime === "AM") {
      const success = routine.addToMorning(product);
      if (success) addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
      else addToast("Giới hạn tối đa 5 sản phẩm", "error");
    } else {
      // try morning first
      const addedMorning = routine.addToMorning(product);
      if (addedMorning) {
        addToast(`Đã thêm ${product.name} vào routine sáng`, "success");
      } else {
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
