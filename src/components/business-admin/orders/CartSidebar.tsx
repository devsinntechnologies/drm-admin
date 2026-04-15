import Image from "next/image";
import { ShoppingCart, X, Minus, Plus, CheckCircle } from "lucide-react";
import type { CartItem } from "@/app/orders/page";

type Props = {
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
};

export default function CartSidebar({ cart = [], onUpdateQuantity, onRemoveItem }: Props) {
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center sticky top-6 min-h-[300px]">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-gray-700 font-medium mb-1.5">Your order is empty</h3>
        <p className="text-[13px] text-gray-400">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="bg-[#ebfbf3] rounded-2xl p-4 sticky top-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-green-50">
      <div className="bg-[#00c853] text-white rounded-xl p-3.5 flex items-center justify-between mb-4 shadow-sm">
        <div className="flex items-center gap-2 font-bold">
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[15px]">Order Summary</span>
        </div>
        <div className="bg-white text-[#00c853] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 cart-scrollbar">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-green-50/50">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 relative flex-shrink-0">
                <Image src={item.img} alt={item.name} fill className="rounded-lg object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="pr-2">
                    <h4 className="font-bold text-[13px] text-gray-800 tracking-tight leading-tight mb-0.5 truncate">{item.name}</h4>
                    <p className="text-[11px] text-gray-400 leading-none">{item.category}</p>
                  </div>
                  <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex items-end justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-transparent gap-1">
                       <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-red-500 hover:bg-red-50 transition-colors">
                         <Minus className="w-3 h-3" />
                       </button>
                       <span className="text-[13px] font-bold w-5 text-center text-[#00c853] select-none">{item.quantity}</span>
                       <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 text-green-500 hover:bg-green-50 transition-colors">
                         <Plus className="w-3 h-3" />
                       </button>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] text-gray-400 tracking-wide font-medium">Total</div>
                    <div className="text-sm font-bold text-[#00c853] leading-none">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="mt-1 flex items-center text-[10px] text-gray-400">
                  <span className="font-medium mr-1">$</span>
                  {item.price.toFixed(2)} <span>each</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#fff5f0] rounded-xl p-4 mt-4 border border-orange-100 shadow-sm">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Amount</p>
            <p className="text-[22px] leading-none font-bold text-[#ff6b00]">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right pb-0.5">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Items</p>
            <p className="text-[17px] leading-none font-bold text-gray-700">{totalItems}</p>
          </div>
        </div>
      </div>

      <button className="w-full bg-[#00c853] text-white rounded-xl py-3.5 mt-3 font-semibold text-[15px] flex items-center justify-center gap-2 shadow-md shadow-green-500/20 hover:shadow-lg hover:bg-[#00b047] transition-all">
        <CheckCircle className="w-4 h-4" />
        Place Order Now
      </button>
    </div>
  );
}
