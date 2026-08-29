"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Eye, X, Utensils, Calendar, QrCode } from "lucide-react";

const SolidReceiptIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 2 L8 5 L10 2 L12 5 L14 2 L16 5 L18 2 V18 A2 2 0 0 1 16 20 H4 A2 2 0 0 1 2 18 V16 A2 2 0 0 1 4 14 H6 V2 Z M8 7 H13 V9.5 H8 V7 Z M14 7 H16 V9.5 H14 V7 Z M8 11 H13 V13.5 H8 V11 Z M14 11 H16 V13.5 H14 V11 Z M14.5 15 H16 V17.5 A0.75 0.75 0 0 1 14.5 17.5 V15 Z"
    />
  </svg>
);

export default function InvoiceTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative">
      {/* Header */}
      <header className="bg-[#4caf50] text-white px-4 py-4 flex items-center gap-4 shadow-md">
        <Link href="/dashboard/businessAdmin" className="p-1 hover:bg-white/20 rounded-full transition">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-medium tracking-wide">Invoice Demo & Test</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 flex items-center justify-center mx-auto">
          <SolidReceiptIcon className="h-20 w-20 text-[#4caf50]" />
        </div>

        <h2 className="text-[22px] font-bold text-[#212121] mb-2">Demo Invoice Simulator</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
          Use this to test the printer integration and invoice layout
        </p>

        <div className="flex flex-col gap-4 w-full max-w-[360px] mx-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 w-full bg-[#4caf50] hover:bg-[#43a047] text-white py-5 px-6 rounded-2xl text-xl font-black transition shadow-md"
          >
            <Printer className="h-7 w-7" />
            Launch Active Checkout
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-3 w-full bg-[#ff9800] hover:bg-[#f57c00] text-white py-5 px-6 rounded-2xl text-xl font-black transition shadow-md"
          >
            <Eye className="h-7 w-7" />
            Launch Read-Only Preview
          </button>
        </div>
      </main>

      {/* Checkout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-[620px] max-h-[85vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-black bg-white/80 backdrop-blur-md hover:bg-gray-100 rounded-full transition z-20 shadow-sm"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 flex flex-col w-full">
              {/* Content Container */}
              <div className="p-5 sm:p-8 pt-12 shrink-0">
                {/* Complete & Print Button */}
                <button className="w-full bg-[#0d924d] hover:bg-[#0a7a3f] text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg transition active:scale-[0.98]">
                  <div className="flex items-center gap-3">
                    <Printer className="h-8 w-8" />
                    <span className="text-[26px] font-black tracking-tight">Complete & Print</span>
                  </div>
                  <span className="text-[13px] font-bold opacity-90">Tap to Finalize Order & Print Invoice</span>
                </button>

                {/* Premium Dining Block */}
                <div className="mt-6 bg-[#fff8f6] rounded-[20px] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[22px] font-black text-[#d32f2f] uppercase tracking-wider leading-tight">PREMIUM DINING EXPERIENCE</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PREMIUM DINING EXPERIENCE</p>
                    </div>
                    <Utensils className="h-9 w-9 text-[#d32f2f] shrink-0 ml-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
                      <span className="text-[#d32f2f] font-bold text-[15px]">#</span>
                      <span className="text-[13px] font-bold text-[#212121]">ORD26-0414-0073</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
                      <Calendar className="h-4 w-4 text-[#d32f2f]" strokeWidth={2.5} />
                      <span className="text-[13px] font-bold text-[#212121]">09 May, 2026</span>
                    </div>
                  </div>
                </div>

                {/* Invoice To */}
                <div className="mt-8 px-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">INVOICE TO:</p>
                  <h2 className="text-[28px] font-black text-[#212121] mt-1 tracking-tight">Order #ORD26-0414-0073</h2>
                </div>

                {/* Items Table */}
                <div className="mt-6 px-1">
                  <div className="flex justify-between border-b-[3px] border-gray-100 pb-3">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex-1">ITEM DESCRIPTION</span>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">QTY</span>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest w-24 text-right">TOTAL</span>
                  </div>

                  <div className="py-4 space-y-5 border-b-[3px] border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-[#212121] text-[15px]">Chicken Biryani</div>
                        <div className="text-[13px] font-medium text-gray-400 mt-0.5">Rs. 250</div>
                      </div>
                      <div className="w-12 text-center font-black text-[#212121] text-[15px] pt-0.5">x1</div>
                      <div className="w-24 text-right font-black text-[#212121] text-[15px] pt-0.5">Rs. 250</div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-[#212121] text-[15px]">Chicken Dal Chawal</div>
                        <div className="text-[13px] font-medium text-gray-400 mt-0.5">Rs. 200</div>
                      </div>
                      <div className="w-12 text-center font-black text-[#212121] text-[15px] pt-0.5">x2</div>
                      <div className="w-24 text-right font-black text-[#212121] text-[15px] pt-0.5">Rs. 400</div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-[#212121] text-[15px]">Steam Roast Deal</div>
                        <div className="text-[13px] font-medium text-gray-400 mt-0.5">Rs. 600</div>
                      </div>
                      <div className="w-12 text-center font-black text-[#212121] text-[15px] pt-0.5">x1</div>
                      <div className="w-24 text-right font-black text-[#212121] text-[15px] pt-0.5">Rs. 600</div>
                    </div>
                  </div>

                  <div className="py-5 flex justify-between items-center border-b-[3px] border-gray-100">
                    <span className="font-black text-gray-400 uppercase tracking-widest text-[14px]">Sub-Total</span>
                    <span className="font-black text-[#212121] text-[17px]">Rs. 1250</span>
                  </div>

                  {/* Net Amount Pill */}
                  <div className="mt-6 bg-[#d32f2f] text-white rounded-[16px] p-5 flex justify-between items-center shadow-lg">
                    <span className="text-[18px] font-black uppercase tracking-wide">NET AMOUNT</span>
                    <span className="text-[26px] font-black">Rs. 1250.00</span>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-8 flex justify-between items-start px-1">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact Information:</p>
                      <p className="font-black text-[#212121] mt-1.5 text-[14px]">0300-4153368</p>
                      <p className="font-black text-[#212121] text-[14px]">0335-4153368</p>
                    </div>
                    <QrCode className="h-16 w-16 text-[#212121]" />
                  </div>

                  <div className="mt-8 mb-2 text-center">
                    <p className="text-gray-400 italic font-medium text-[16px]">Thank you for dining with us!</p>
                  </div>
                </div>
              </div>

              {/* Footer Banner */}
              <div className="bg-[#f5f5f5] p-5 text-center mt-auto border-t border-gray-200 shrink-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">POWERED BY DIGINIZAM</p>
                <p className="text-[12px] font-bold text-[#0050F8] mt-1">diginizam.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
