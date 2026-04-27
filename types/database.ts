export type TransactionType = "income" | "expense";
export type PayMethod = "Credit" | "Cash";
export type CategoryType = "income" | "expense" | "both";

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  color: string | null;
  display_order: number;
};

export type Transaction = {
  id: number;
  date: string;
  content: string;
  category_id: number | null;
  amount: number;
  type: TransactionType;
  pay_method: PayMethod | null;
  store: string | null;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  categories: Category | null;
};

export type CreditSettlement = {
  id: number;
  year: number;
  month: number;
  amount: number;
};

export type Budget = {
  id: number;
  year: number;
  month: number;
  category_id: number;
  amount: number;
};

export type BudgetWithCategory = Budget & {
  categories: Category;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id">;
        Update: Partial<Omit<Category, "id">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id" | "created_at">>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, "id">;
        Update: Partial<Omit<Budget, "id">>;
      };
    };
  };
};
