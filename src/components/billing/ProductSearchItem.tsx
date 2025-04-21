
import React, { useState } from "react";
import { Product } from "@/types/supabase-extensions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductSearchItemProps {
  product: Product;
  onAddToCart: (product: Product, size?: string) => void;
}

export const ProductSearchItem = ({ product, onAddToCart }: ProductSearchItemProps) => {
  const [showSizes, setShowSizes] = useState(false);

  const handleAddToCart = (size?: string) => {
    if (product.sizes_stock && Object.keys(product.sizes_stock).length > 0 && !size) {
      setShowSizes(true);
      return;
    }
    onAddToCart(product, size);
    setShowSizes(false);
  };

  return (
    <div className="flex items-center justify-between border rounded p-2">
      <div>
        <div className="font-semibold">{product.name}</div>
        <div className="text-xs text-gray-500">
          {product.brand} • {product.category}
        </div>
      </div>
      <div>
        {product.sizes_stock && Object.keys(product.sizes_stock).length > 0 ? (
          showSizes ? (
            <div className="flex gap-1">
              {Object.entries(product.sizes_stock).map(([size, qty]) => (
                <Button
                  key={size}
                  size="sm"
                  variant="outline"
                  className="px-2"
                  disabled={qty === 0}
                  onClick={() => handleAddToCart(size)}
                >
                  {size} <Badge variant="outline" className="ml-1">{qty}</Badge>
                  {qty === 0 && <span className="ml-1 text-red-400">(Out of stock)</span>}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setShowSizes(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowSizes(true)}>Choose Size</Button>
          )
        ) : (
          <Button size="sm" onClick={() => handleAddToCart()}>Add</Button>
        )}
      </div>
    </div>
  );
};
