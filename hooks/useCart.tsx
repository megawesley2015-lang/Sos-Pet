'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  product_id: string
  variant_id: string
  quantity: number
  price_brl: number
  name: string
  image_url?: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (product_id: string, variant_id: string) => void
  updateQuantity: (product_id: string, variant_id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const STORAGE_KEY = 'sos-pet-cart'

export const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
})

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveCart(items)
  }, [items, hydrated])

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const idx = prev.findIndex(
        i => i.product_id === item.product_id && i.variant_id === item.variant_id
      )
      if (idx >= 0) {
        return prev.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((product_id: string, variant_id: string) => {
    setItems(prev =>
      prev.filter(i => !(i.product_id === product_id && i.variant_id === variant_id))
    )
  }, [])

  const updateQuantity = useCallback(
    (product_id: string, variant_id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(product_id, variant_id)
        return
      }
      setItems(prev =>
        prev.map(i =>
          i.product_id === product_id && i.variant_id === variant_id
            ? { ...i, quantity }
            : i
        )
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price_brl * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
