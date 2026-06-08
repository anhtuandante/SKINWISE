import React from "react";
import { Package } from "lucide-react";

interface ProductAvatarProps {
  brand: string;
  name: string;
  className?: string;
}

// Hàm tạo màu ngẫu nhiên nhưng nhất quán dựa trên tên brand
const getBrandColor = (brand: string) => {
  const colors = [
    "from-blue-400 to-indigo-500",
    "from-emerald-400 to-teal-500",
    "from-orange-400 to-red-500",
    "from-pink-400 to-rose-500",
    "from-violet-400 to-purple-500",
    "from-cyan-400 to-blue-500",
    "from-amber-400 to-orange-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Hàm lấy chữ cái đầu của brand (VD: "La Roche-Posay" -> "LR")
const getInitials = (brand: string) => {
  const words = brand.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "SK";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function ProductAvatar({ brand, className = "" }: ProductAvatarProps) {
  const gradient = getBrandColor(brand);
  const initials = getInitials(brand);

  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden shadow-sm shrink-0 bg-gradient-to-br ${gradient} ${className}`}
    >
      {/* Texture overlay (glassmorphism effect) */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
      
      {/* Icon + Initials */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white p-2">
        <Package size={20} className="mb-1 opacity-90 drop-shadow-sm" />
        <span className="font-bold text-[10px] tracking-widest drop-shadow-md">
          {initials}
        </span>
      </div>
    </div>
  );
}
