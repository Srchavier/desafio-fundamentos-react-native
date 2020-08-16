import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const productSave = await AsyncStorage.getItem('@marketplace::product');
      if (productSave) {
        setProducts([...JSON.parse(productSave)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productFind = products.findIndex(
        productList => productList.id === product.id,
      );
      if (productFind === -1) {
        const { id, title, image_url, price } = product;
        const prod: Product = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        };

        setProducts([...products, prod]);
        await AsyncStorage.setItem(
          '@marketplace::product',
          JSON.stringify(products),
        );
      } else {
        products[productFind].quantity += 1;
        setProducts(products);
        await AsyncStorage.setItem(
          '@marketplace::product',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
      await AsyncStorage.setItem(
        '@marketplace::product',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const prod = products
        .map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity - 1 };
          }
          return product;
        })
        .filter(product => product.quantity > 0);

      setProducts([...prod]);
      await AsyncStorage.setItem('@marketplace::product', JSON.stringify(prod));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
