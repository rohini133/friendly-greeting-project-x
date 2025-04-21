import { useState, useEffect, useRef } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProductSearch } from "@/components/billing/ProductSearch";
import { ShoppingCart } from "@/components/billing/ShoppingCart";
import { CheckoutDialog } from "@/components/billing/CheckoutDialog";
import { BillReceipt } from "@/components/billing/BillReceipt";
import { useToast } from "@/components/ui/use-toast";
import { useBillingCart } from "@/hooks/useBillingCart";
import { createBill } from "@/services/billService";
import { Bill, Product } from "@/types/supabase-extensions";
import { Button } from "@/components/ui/button";
import { useProductsSync } from "@/hooks/useProductsSync";
import { getProductStockStatus } from "@/services/product/productHelpers";

function Billing() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const checkoutDialogRef = useRef(null);
  const { products, isLoading, error } = useProductsSync();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    discountAmount,
    discountType,
    discountValue,
    applyDiscount,
    removeDiscount,
  } = useBillingCart();

  useEffect(() => {
    if (error) {
      toast({
        title: "Sync Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to the cart before checking out.",
      });
      return;
    }

    setIsCheckoutOpen(true);
  };

  const handleCreateBill = async () => {
    try {
      const billData = {
        cartItems: cartItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        paymentMethod: paymentMethod,
        discountAmount: discountAmount,
        discountType: discountType,
        discountValue: discountValue,
      };

      const newBill = await createBill(billData);
      setCurrentBill(newBill);
      clearCart();
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);

      toast({
        title: "Bill created",
        description: `Bill #${newBill.id} created successfully.`,
      });
    } catch (error: any) {
      console.error("Bill creation error:", error);
      toast({
        title: "Bill creation failed",
        description: error.message || "Failed to create bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { toast } = useToast();

  // Fix type signature to properly accept size parameter
  const handleAddToCart = (product: Product, size?: string) => {
    if (getProductStockStatus(product) === "out-of-stock") {
      toast({
        title: "Cannot add to cart",
        description: `${product.name} is out of stock.`,
        variant: "destructive",
      });
      return;
    }

    // If the product has sizes_stock and no size was selected
    if (
      product.sizes_stock && 
      Object.keys(product.sizes_stock).length > 0 && 
      !size
    ) {
      toast({
        title: "Size required",
        description: "Please select a size for this product.",
        variant: "destructive",
      });
      return;
    }

    // Check size-specific stock
    if (
      size && 
      product.sizes_stock && 
      (product.sizes_stock[size] === undefined || product.sizes_stock[size] <= 0)
    ) {
      toast({
        title: "Size out of stock",
        description: `${product.name} in size ${size} is out of stock.`,
        variant: "destructive",
      });
      return;
    }

    // Add to cart with selected size
    addToCart(product, size);
    
    toast({
      title: "Added to cart",
      description: `${product.name}${size ? ` (${size})` : ""} added to cart.`,
    });
  };

  return (
    <PageContainer title="Billing" subtitle="Create and manage bills">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ProductSearch 
            onAddToCart={handleAddToCart} 
          />
          {isLoading && <div>Loading products...</div>}
          {error && <div>Error: {error}</div>}
        </div>
        
        <div>
          <ShoppingCart
            items={cartItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            discountAmount={discountAmount}
            discountType={discountType}
            discountValue={discountValue}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onApplyDiscount={applyDiscount}
            onRemoveDiscount={removeDiscount}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
      
      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        subtotal={subtotal}
        tax={tax}
        total={total}
        discountAmount={discountAmount}
        discountType={discountType}
        discountValue={discountValue}
        customerInfo={customerInfo}
        onCustomerInfoChange={(info) => setCustomerInfo(info)}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={(method) => setPaymentMethod(method)}
        onCreateBill={handleCreateBill}
      />

      <BillReceipt
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={currentBill}
      />
    </PageContainer>
  );
}

export default Billing;
